/**
 * Use Case: Suggest Safe Capacity (Expert Advisory)
 * Implements the conservative sizing logic for zero-export systems.
 * Rule: Find the minimum load during peak solar hours (11:00-13:00) 
 * of the month with the lowest total energy consumption.
 */

export const execute = (processedData, techParams = {}) => {
    if (!processedData || processedData.length === 0) return null;

    // 0. Calculate system efficiency (derate factor)
    const losses = techParams.losses || { temp: 0, soiling: 0, cable: 0, inverter: 0 };
    const totalLossPct = Object.values(losses).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const derateFactor = Math.max(0.1, (100 - totalLossPct) / 100); // Guard against 100% loss

    // 1. Group data by month and calculate total consumption per month
    const monthlyStats = {};
    processedData.forEach(point => {
        const date = (point.date instanceof Date) ? point.date : new Date(point.date || point.timestamp);
        if (isNaN(date.getTime())) return;

        const month = date.getMonth(); // 0-11
        if (!monthlyStats[month]) {
            monthlyStats[month] = {
                totalLoad: 0,
                points: []
            };
        }
        monthlyStats[month].totalLoad += (point.load || 0);
        monthlyStats[month].points.push({
            ...point,
            hour: date.getHours(),
            day: date.getDay()
        });
    });

    // 2. Identify the month with the minimum total load
    // This applies to ALL data sources (Import 8760 or Manual Bill)
    // We want the system to be safe even in the lowest consumption month of the year.
    let minMonth = null;
    let minTotal = Infinity;

    // Filter out incomplete months (less than 15 days ~ 360 hours)
    // We only consider months with "sufficient data" unless the whole dataset is short.
    const monthList = Object.entries(monthlyStats);
    const validMonths = monthList.filter(([_, stats]) => stats.points.length >= 360);
    const candidateMonths = validMonths.length > 0 ? validMonths : monthList;

    candidateMonths.forEach(([month, stats]) => {
        if (stats.totalLoad < minTotal && stats.totalLoad > 0) {
            minTotal = stats.totalLoad;
            minMonth = month;
        }
    });

    if (minMonth === null) return null;

    const targetMonthPoints = monthlyStats[minMonth].points;

    // 3. Filter for peak solar hours (11:00 - 13:00) within that month
    const peakHourPoints = targetMonthPoints.filter(p => p.hour >= 11 && p.hour <= 13);

    if (peakHourPoints.length === 0) return null;

    // 4. Determine "Safe" Minimum Load Logic based on Data Source
    // - Manual (EVN Bill): Strict "Original Formula" (Absolute Minimum Power in Peak Hours)
    // - Import (8760 Data): "Safe Fit" (P50 / Median of peak hours in the lowest month to be less conservative)

    const isImportData = processedData.length > 0 && processedData[0].dataSource === 'import';

    let safeLoad = 0;
    const peakLoads = peakHourPoints.map(p => p.load || 0).sort((a, b) => a - b);

    if (peakLoads.length > 0) {
        if (isImportData) {
            // Import: Use Median (P50) of the Lowest Month to be less conservative
            // This suggests a capacity that fits the "typical" day of the lowest month
            const p50Index = Math.floor(peakLoads.length * 0.5);
            safeLoad = peakLoads[p50Index] || peakLoads[0];
        } else {
            // Manual: Use Strict Minimum (Original Formula)
            // Since synthetic profiles are regular, this is safe and expected.
            safeLoad = peakLoads[0]; // The absolute lowest value
        }
    }

    const minLoadFound = safeLoad;

    // 5. Convert required AC Power (kW) to DC Capacity (kWp) using efficiency factor
    // Instead of using the absolute strict minimum load, we now use a simulated approach
    // to find the max capacity that keeps annual curtailment under 0.75% (so UI rounds to 0%).
    // We already have `safeLoad` as a starting point. Let's do a quick upward scan.

    // Fallback if we don't have enough data to simulate full year
    if (processedData.length < 365 * 24) {
        const suggestedKwp = isFinite(minLoadFound) ? (minLoadFound / derateFactor) : null;
        return suggestedKwp !== null ? Math.round(suggestedKwp) : null;
    }

    // Fast simulation helper to check curtailment % for a given kWp
    const checkCurtailment = (kwp) => {
        let totalGen = 0;
        let totalCurtailed = 0;
        for (let i = 0; i < processedData.length; i++) {
            const point = processedData[i];
            const safeSolarUnit = isNaN(Number(point.solarUnit)) ? 0 : Number(point.solarUnit);
            let solarPowerKw = safeSolarUnit * kwp * derateFactor;

            const loadPower = isNaN(Number(point.load)) ? 0 : Number(point.load);

            totalGen += solarPowerKw;
            if (solarPowerKw > loadPower) {
                totalCurtailed += (solarPowerKw - loadPower);
            }
        }
        return totalGen > 0 ? (totalCurtailed / totalGen) * 100 : 0;
    };

    // Start from the strict absolute minimum
    let currentKwp = isFinite(minLoadFound) ? Math.floor(minLoadFound / derateFactor) : 1;
    if (currentKwp < 1) currentKwp = 1;

    // Scan upwards until curtailment exceeds 0.75%
    let bestKwp = currentKwp;
    let step = 10; // Start with bigger steps to save time

    // Phase 1: Rough scan
    while (true) {
        const curtPct = checkCurtailment(currentKwp + step);
        if (curtPct > 0.75) {
            break;
        }
        currentKwp += step;
        bestKwp = currentKwp;
    }

    // Phase 2: Fine scan
    step = 1;
    while (true) {
        const curtPct = checkCurtailment(currentKwp + step);
        if (curtPct > 0.75) {
            break;
        }
        currentKwp += step;
        bestKwp = currentKwp;
    }

    return bestKwp;
};
