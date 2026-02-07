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
    let minMonth = null;
    let minTotal = Infinity;

    Object.entries(monthlyStats).forEach(([month, stats]) => {
        if (stats.totalLoad < minTotal && stats.totalLoad > 0) {
            minTotal = stats.totalLoad;
            minMonth = month;
        }
    });

    if (minMonth === null) return null;

    const targetMonthPoints = monthlyStats[minMonth].points;

    // 3. Filter for peak solar hours (11:00 - 13:00) within that month
    // We look for the absolute minimum to be safe (conservative)
    const peakHourPoints = targetMonthPoints.filter(p => p.hour >= 11 && p.hour <= 13);

    if (peakHourPoints.length === 0) return null;

    // 4. Find the minimum load in these peak hours (Normalized to kW)
    // This represents the "trough" of the lowest month
    let minLoadFound = Infinity;

    peakHourPoints.forEach(p => {
        // Calculate instantaneous power (kW)
        // processedData already normalized this to kW in loadProfileGenerator
        const powerKw = (p.load || 0);

        if (powerKw < minLoadFound) {
            minLoadFound = powerKw;
        }
    });

    // 5. Convert required AC Power (kW) to DC Capacity (kWp) using efficiency factor
    // Target kWp = Min Load (kW) / Efficiency (Derate)
    const suggestedKwp = isFinite(minLoadFound) ? (minLoadFound / derateFactor) : null;

    // Round to nearest integer for clean kWp
    return suggestedKwp !== null ? Math.round(suggestedKwp) : null;
};
