/**
 * Use Case: Optimize System
 * Automatically searches for the optimal Solar and BESS configuration to maximize financial returns.
 */

import { execute as calculateEnergy } from './CalculateEnergyGeneration';
import { execute as calculateFinancials } from './CalculateFinancials';
import { selectOptimalInverters } from '../../utils/inverterOptimizer';
import { INVERTER_DB } from '../../data/sources/HardwareDatabase';

export const execute = (
    processedData,
    prices,
    finParams,
    techParams,
    constraints = { maxKwp: 2000, stepKwp: 50, bessHours: [0, 1, 2, 4] }
) => {
    if (!processedData || processedData.length === 0) return null;

    const maxLoad = Math.max(...processedData.map(p => p.load || 0));
    const results = [];

    // Define Solar Search Range
    let startKwp, endKwp, stepKwp;

    if (constraints.fixedKwp) {
        startKwp = constraints.fixedKwp;
        endKwp = constraints.fixedKwp;
        stepKwp = 1;
    } else {
        // From ~20% of peak load to 150% or maxKwp
        startKwp = Math.max(10, Math.round(maxLoad * 0.2 / 10) * 10);
        endKwp = Math.min(constraints.maxKwp, Math.round(maxLoad * 1.5 / 10) * 10);
        stepKwp = constraints.stepKwp || 50;
    }

    // Define BESS Search Range (Hours of Solar Peak)
    // If noBess is set, only search with BESS = 0
    const bessHourOptions = techParams.noBess ? [0] : (constraints.bessHours || [0, 1, 2, 4]);

    for (let kwp = startKwp; kwp <= endKwp; kwp += stepKwp) {
        // For each Solar Size, find optimal inverters
        const { totalAcKw } = selectOptimalInverters(kwp, INVERTER_DB, techParams.dcAcRatio || 1.25);

        for (const hours of bessHourOptions) {
            const bessKwh = kwp * hours * 0.5; // Rough heuristic: Hours relative to 50% Solar Peak
            // Actually, let's just use hours relative to Solar Peak directly or explicit kWh steps
            // Better: bessKwh = kwp * hours * 0.25 (typical C&I ratio)
            const targetBessKwh = Math.round(kwp * hours * 0.25);
            const targetBessKw = Math.round(targetBessKwh / 2); // 2-hour system

            const stats = calculateEnergy(
                kwp,
                processedData,
                targetBessKwh,
                targetBessKw,
                true, // useTouMode
                false, // gridCharge
                prices,
                { ...techParams, inverterMaxAcKw: totalAcKw }
            );

            // Estimate BESS Capex (approx $250/kWh installed)
            const bessPrice = finParams.bessPrice || 6000000; // VNĐ/kWh
            const totalBessCapex = targetBessKwh * bessPrice;
            const solarCapex = kwp * (finParams.solarPrice || 12000000); // VNĐ/kWp
            const totalCapex = solarCapex + totalBessCapex;

            const fin = calculateFinancials(
                totalCapex,
                stats,
                prices,
                { ...finParams, batteryCapex: totalBessCapex }
            );

            results.push({
                kwp,
                bessKwh: targetBessKwh,
                bessKw: targetBessKw,
                payback: fin.payback,
                irr: fin.irr,
                npv: fin.npv,
                roi: fin.roi
            });
        }
    }

    // Sort by shortest payback
    results.sort((a, b) => a.payback - b.payback);

    return {
        best: results[0],
        all: results
    };
};
