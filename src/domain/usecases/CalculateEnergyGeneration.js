/**
 * Use Case: Calculate Energy Generation
 * Describes the core business logic for simulating solar + battery system performance.
 */

// Domain Logic often needs simple helpers, we can keep them internal or extracted.
// For now, we will include the logic directly.

export const execute = (
    systemSize, // kWp
    data, // Processed Hourly/Step Data
    bessCapacityKwh = 0,
    bessMaxPowerKw = 0,
    useTouMode = false,
    enableGridCharge = false,
    params = {}, // Pricing & Factors
    techParams = {} // { inverterMaxAcKw, losses: { temp, ... } }
) => {
    let totalSolarGen = 0;
    let totalCurtailed = 0;
    let totalUsed = 0;
    let totalLoad = 0;

    // Grid Exports (Sold to Grid)
    let totalExported = 0;

    let currentSoc = 0;
    let totalCharged = 0;
    let totalDischarged = 0;
    let totalGridCharge = 0;

    let usedPeak = 0; let usedNormal = 0; let usedOffPeak = 0;
    let exportedPeak = 0; let exportedNormal = 0; let exportedOffPeak = 0;
    let curtailedPeak = 0; let curtailedNormal = 0; let curtailedOffPeak = 0;

    // --- PARSE PARAMS ---
    // --- PARSE PARAMS (Robust sanitization) ---
    const calibrationFactor = isNaN(Number(params.calibrationFactor)) ? 100 : Number(params.calibrationFactor);
    const scaling = calibrationFactor / 100.0;
    const inverterMaxAcKw = isNaN(Number(techParams.inverterMaxAcKw)) ? 999999 : Number(techParams.inverterMaxAcKw);
    const gridInjectionPrice = isNaN(Number(techParams.gridInjectionPrice)) ? 0 : Number(techParams.gridInjectionPrice);
    const allowGridExport = gridInjectionPrice > 0;

    // --- LOSS FACTORS (Robust sanitization) ---
    const losses = techParams.losses || {};
    const safeLoss = (val) => isNaN(Number(val)) ? 0 : Number(val);
    const totalLossPct = safeLoss(losses.temp) + safeLoss(losses.soiling) + safeLoss(losses.cable) + safeLoss(losses.inverter);
    const systemDerate = 1 - (totalLossPct / 100);

    // Weather Scenario Derate Factor (for bad weather simulation)
    const weatherDerate = isNaN(Number(techParams.weatherDerate)) ? 1.0 : Number(techParams.weatherDerate);

    // Sanitize System Size
    const safeSystemSize = isNaN(Number(systemSize)) ? 0 : Number(systemSize);

    // --- BESS PARAMS ---
    // Use techParams or defaults. Round Trip Eff -> Single Way = sqrt(RT)
    const rtEff = techParams.bessEffRoundTrip !== undefined ? Number(techParams.bessEffRoundTrip) : 0.90; // Default 90% RT (~95% one way)
    const singleWayEff = Math.sqrt(rtEff);

    // Explicit or Derived
    const CHARGE_EFF = singleWayEff;
    const DISCHARGE_EFF = singleWayEff;

    const DOD_LIMIT = techParams.bessDod !== undefined ? Number(techParams.bessDod) : 0.90;
    const minSocKwh = bessCapacityKwh * (1 - DOD_LIMIT);

    // Helper: Determine TOU Type
    const getTouType = (dateOrTimestamp) => {
        const date = (dateOrTimestamp instanceof Date) ? dateOrTimestamp : new Date(dateOrTimestamp?.timestamp || dateOrTimestamp);
        if (isNaN(date.getTime())) return 'NORMAL'; // Fallback if invalid

        const h = date.getHours();
        const d = date.getDay();
        if (d === 0) {
            // Sunday: No Peak hours. Normal: 04h-22h, Off-Peak: 22h-04h
            if (h >= 22 || h < 4) return 'OFF_PEAK';
            return 'NORMAL';
        }
        // standard VN logic
        if ((h >= 9 && h < 11) || (h >= 17 && h < 20)) return 'PEAK';
        if (h >= 22 || h < 4) return 'OFF_PEAK';
        return 'NORMAL';
    };

    const hourlyBatteryData = [];

    // Main Simulation Loop
    for (let i = 0; i < data.length; i++) {
        const point = data[i];
        const timeFactor = point.timeStep || 1;
        const pointDate = point.date || new Date(point.timestamp);
        const touType = getTouType(pointDate);

        let hourlyChargeFromSolar = 0;
        let hourlyChargeFromGrid = 0;
        let hourlyDischarge = 0;

        // 1. Calculate Solar Power (Raw) -- Robust Check
        const safeSolarUnit = isNaN(Number(point.solarUnit)) ? 0 : Number(point.solarUnit);
        let solarPowerKw = safeSolarUnit * safeSystemSize * scaling * systemDerate * weatherDerate;
        if (isNaN(solarPowerKw)) solarPowerKw = 0;

        // 2. Apply Inverter Clipping (AC Limit)
        if (solarPowerKw > inverterMaxAcKw) {
            solarPowerKw = inverterMaxAcKw;
        }

        const solarEnergy = isNaN(solarPowerKw) ? 0 : (solarPowerKw * timeFactor);
        const loadPower = isNaN(Number(point.load)) ? 0 : Number(point.load);
        const loadEnergy = loadPower * timeFactor;

        totalLoad += loadEnergy;
        totalSolarGen += solarEnergy;

        let usedEnergy = Math.min(solarEnergy, loadEnergy);
        let excessSolar = Math.max(0, solarEnergy - loadEnergy);
        let deficitEnergy = Math.max(0, loadEnergy - solarEnergy);

        // --- BATTERY LOGIC ---
        if (bessCapacityKwh > 0) {
            const maxTransferEnergy = (bessMaxPowerKw > 0 ? bessMaxPowerKw : 1000) * timeFactor;

            // CHARGE
            if (excessSolar > 0) {
                const roomInBattery = bessCapacityKwh - currentSoc;
                const maxInput = Math.min(excessSolar, maxTransferEnergy);
                const realChargeInput = Math.min(maxInput, roomInBattery / CHARGE_EFF);
                const actualStored = realChargeInput * CHARGE_EFF;

                if (currentSoc + actualStored <= bessCapacityKwh + 0.001) {
                    currentSoc += actualStored;
                    totalCharged += actualStored;
                    excessSolar -= realChargeInput; // Reduce excess available for grid export
                    hourlyChargeFromSolar = actualStored;
                }
            }

            // GRID CHARGE (Off-Peak Only)
            if (enableGridCharge && touType === 'OFF_PEAK' && currentSoc < bessCapacityKwh) {
                const roomInBattery = bessCapacityKwh - currentSoc;
                const maxInput = maxTransferEnergy;
                const actualStored = Math.min(roomInBattery, maxInput * CHARGE_EFF);

                currentSoc += actualStored;
                totalGridCharge += (actualStored / CHARGE_EFF);
                hourlyChargeFromGrid = actualStored;
            }

            // DISCHARGE
            const shouldDischarge = (useTouMode && touType === 'PEAK' && deficitEnergy > 0) ||
                (!useTouMode && deficitEnergy > 0);

            if (shouldDischarge && currentSoc > minSocKwh) {
                const energyNeeded = deficitEnergy;
                const availableEnergyInBatt = (currentSoc - minSocKwh) * DISCHARGE_EFF;
                const outputToLoad = Math.min(energyNeeded, Math.min(availableEnergyInBatt, maxTransferEnergy));

                // Calculate discharged amount from battery state
                const deductedFromBatt = outputToLoad / DISCHARGE_EFF;

                currentSoc -= deductedFromBatt;
                totalDischarged += outputToLoad;
                usedEnergy += outputToLoad;
                deficitEnergy -= outputToLoad;
                hourlyDischarge = outputToLoad;
            }
        }

        // --- EXPORT vs CURTAILMENT ---
        let exportedEnergy = 0;
        let curtailedEnergy = 0;

        if (excessSolar > 0) {
            if (allowGridExport) {
                exportedEnergy = excessSolar;
            } else {
                curtailedEnergy = excessSolar;
            }
        }

        totalUsed += usedEnergy;
        totalExported += exportedEnergy;
        totalCurtailed += curtailedEnergy;

        // Breakdown Stats
        if (touType === 'OFF_PEAK') {
            usedOffPeak += usedEnergy;
            exportedOffPeak += exportedEnergy;
            curtailedOffPeak += curtailedEnergy;
        } else if (touType === 'PEAK') {
            usedPeak += usedEnergy;
            exportedPeak += exportedEnergy;
            curtailedPeak += curtailedEnergy;
        } else {
            usedNormal += usedEnergy;
            exportedNormal += exportedEnergy;
            curtailedNormal += curtailedEnergy;
        }

        // Collect hourly battery data
        const currentGridImport = Math.max(0, (loadEnergy + hourlyChargeFromGrid) - (usedEnergy));
        // Note: usedEnergy includes solar_used + discharge.
        // Wait, usedEnergy is strictly "energy served by system". 
        // If Deficit > 0, Grid covers it.
        // So GridImport = (Load + ChargeFromGrid) - UsedEnergy? 
        // UsedEnergy = Min(Solar, Load) (no battery) OR ...
        // In battery logic:
        // usedEnergy updated at line 144 (discharge) and line 162 (total).
        // Line 96: usedEnergy = Min(Solar, Load).
        // So usedEnergy = SolarUsed + DischargeUsed.
        // True Load = Load.
        // Deficit = Load - UsedEnergy.
        // Grid covers Deficit.
        // Plus any GridCharge.
        // So HourlyImport = (Load - usedEnergy) + hourlyChargeFromGrid.

        hourlyBatteryData.push({
            date: point.date,
            soc: currentSoc,
            charge: hourlyChargeFromSolar + hourlyChargeFromGrid,
            chargeFromSolar: hourlyChargeFromSolar,
            chargeFromGrid: hourlyChargeFromGrid,
            discharge: hourlyDischarge,
            solar: solarEnergy,
            load: loadEnergy,
            curtailed: curtailedEnergy,
            exported: exportedEnergy,
            gridImport: (loadEnergy - usedEnergy) + hourlyChargeFromGrid
        });
    }

    const gridImport = (totalLoad + totalGridCharge) - totalUsed;

    return {
        systemSize,
        totalSolarGen, // FIX: Match Dashboard expectation (was totalSolar)
        totalCurtailed,
        totalUsed,
        totalExported,
        totalLoad,
        totalCharged,
        totalDischarged,
        totalGridCharge,
        gridImport,
        usedPeak, usedNormal, usedOffPeak,
        exportedPeak, exportedNormal, exportedOffPeak,
        curtailedPeak, curtailedNormal, curtailedOffPeak,
        curtailmentRate: totalSolarGen > 0 ? totalCurtailed / totalSolarGen : 0,
        selfConsumptionRate: totalSolarGen > 0 ? totalUsed / totalSolarGen : 0,
        hourlyBatteryData
    };
};
