/**
 * Use Case: Calculate Peak Shaving with BESS
 * 
 * Calculates monthly Pmax from load data, simulates BESS peak-shaving
 * to reduce Pmax, and computes demand charge savings under the
 * 2-component tariff (giá điện 2 thành phần).
 * 
 * TC = Cp × Pmax + Ca × Ap
 * Savings = Cp × (Pmax_before - Pmax_after) × 12 months
 */

/**
 * Calculate monthly Pmax values from hourly load data.
 * Pmax = max 30-minute average power in each month.
 * Since data is typically hourly, we use hourly values directly.
 * 
 * @param {Array} hourlyData - Array of {date, load} objects
 * @returns {Array} Monthly Pmax values [{month, pmax}]
 */
const calculateMonthlyPmax = (hourlyData) => {
    if (!hourlyData || hourlyData.length === 0) return [];

    const monthlyPeaks = new Map(); // month -> max load

    hourlyData.forEach(point => {
        const dateObj = (point.date instanceof Date) ? point.date : new Date(point.date || point.timestamp);
        if (isNaN(dateObj.getTime())) return;

        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        const load = Number(point.load) || 0;
        const solarGen = Number(point.solarUsed || point.solar || 0);
        const netLoad = Math.max(0, load - solarGen);

        const current = monthlyPeaks.get(monthKey) || 0;
        if (netLoad > current) {
            monthlyPeaks.set(monthKey, netLoad);
        }
    });

    return Array.from(monthlyPeaks.entries()).map(([month, pmax]) => ({ month, pmax }));
};

/**
 * Simulate BESS peak-shaving to find the reduced Pmax.
 * Strategy: discharge battery when load exceeds a target threshold,
 * charge when load is below threshold (or during off-peak).
 * 
 * @param {Array} hourlyData - Hourly simulation data with {date, load, solarUsed, ...}
 * @param {number} bessKwh - Battery capacity (kWh)
 * @param {number} bessMaxPowerKw - Max charge/discharge power (kW)
 * @param {number} bessEffRoundTrip - Round-trip efficiency (0-1)
 * @param {number} bessDod - Depth of discharge (0-1)
 * @returns {Object} { pmaxBefore, pmaxAfter, monthlyResults, annualDemandReduction }
 */
const simulatePeakShaving = (hourlyData, bessKwh, bessMaxPowerKw, bessEffRoundTrip = 0.90, bessDod = 0.90) => {
    if (!hourlyData || hourlyData.length === 0 || bessKwh <= 0) {
        const monthlyPmax = calculateMonthlyPmax(hourlyData);
        const avgPmax = monthlyPmax.length > 0 ? monthlyPmax.reduce((s, m) => s + m.pmax, 0) / monthlyPmax.length : 0;
        return {
            pmaxBefore: avgPmax,
            pmaxAfter: avgPmax,
            monthlyResults: monthlyPmax.map(m => ({ ...m, pmaxBefore: m.pmax, pmaxAfter: m.pmax, reduction: 0 })),
            annualDemandReduction: 0,
            avgMonthlyReduction: 0
        };
    }

    const SINGLE_WAY_EFF = Math.sqrt(bessEffRoundTrip);
    const minSocKwh = bessKwh * (1 - bessDod);
    const maxTransferKwh = bessMaxPowerKw; // Per hour (1h timestep)

    // Group data by month
    const monthlyData = new Map();
    hourlyData.forEach(point => {
        const dateObj = (point.date instanceof Date) ? point.date : new Date(point.date || point.timestamp);
        if (isNaN(dateObj.getTime())) return;
        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData.has(monthKey)) monthlyData.set(monthKey, []);
        monthlyData.get(monthKey).push({ ...point, dateObj });
    });

    const monthlyResults = [];

    monthlyData.forEach((points, monthKey) => {
        // Get original Pmax (net load = load - solar used by load directly)
        const loads = points.map(p => {
            const load = Number(p.load) || 0;
            const solarGen = Number(p.solarUsed || p.solar || 0);
            return Math.max(0, load - solarGen);
        });
        const pmaxBefore = Math.max(...loads);

        // Binary search for the optimal target load level
        // Try to find the lowest Pmax achievable with this BESS
        let bestPmaxAfter = pmaxBefore;

        // Try target levels from pmaxBefore down
        let low = 0, high = pmaxBefore;

        for (let iter = 0; iter < 30; iter++) {
            const targetPmax = (low + high) / 2;

            // Simulate: can BESS keep load below targetPmax for entire month?
            let soc = bessKwh * 0.5; // Start at 50%
            let feasible = true;
            let actualPmax = 0;

            for (const p of points) {
                const load = Number(p.load) || 0;
                const solarGen = Number(p.solarUsed || p.solar || 0);
                const netLoad = Math.max(0, load - solarGen);

                if (netLoad > targetPmax) {
                    // Need to discharge to bring load down
                    const deficit = netLoad - targetPmax;
                    const maxDischarge = Math.min(
                        deficit,
                        maxTransferKwh,
                        (soc - minSocKwh) * SINGLE_WAY_EFF
                    );
                    const actualDischarge = Math.max(0, maxDischarge);
                    soc -= actualDischarge / SINGLE_WAY_EFF;
                    const remainingLoad = netLoad - actualDischarge;
                    actualPmax = Math.max(actualPmax, remainingLoad);
                } else {
                    // Load is below target — charge if possible
                    const surplus = targetPmax - netLoad;
                    const maxCharge = Math.min(
                        surplus * 0.5, // Use 50% of headroom for charging
                        maxTransferKwh,
                        (bessKwh - soc)
                    );
                    const actualCharge = Math.max(0, maxCharge);
                    soc += actualCharge * SINGLE_WAY_EFF;
                    soc = Math.min(soc, bessKwh); // Cap at max
                    actualPmax = Math.max(actualPmax, netLoad);
                }
            }

            if (actualPmax <= targetPmax * 1.02) {
                // Feasible — try lower
                bestPmaxAfter = actualPmax;
                high = targetPmax;
            } else {
                // Not feasible — try higher
                low = targetPmax;
            }
        }

        const reduction = pmaxBefore - bestPmaxAfter;
        monthlyResults.push({
            month: monthKey,
            pmaxBefore: Math.round(pmaxBefore * 10) / 10,
            pmaxAfter: Math.round(bestPmaxAfter * 10) / 10,
            reduction: Math.round(reduction * 10) / 10
        });
    });

    const avgPmaxBefore = monthlyResults.reduce((s, m) => s + m.pmaxBefore, 0) / (monthlyResults.length || 1);
    const avgPmaxAfter = monthlyResults.reduce((s, m) => s + m.pmaxAfter, 0) / (monthlyResults.length || 1);
    const avgReduction = monthlyResults.reduce((s, m) => s + m.reduction, 0) / (monthlyResults.length || 1);

    return {
        pmaxBefore: Math.round(avgPmaxBefore * 10) / 10,
        pmaxAfter: Math.round(avgPmaxAfter * 10) / 10,
        monthlyResults,
        annualDemandReduction: Math.round(avgReduction * 10) / 10,
        avgMonthlyReduction: Math.round(avgReduction * 10) / 10
    };
};

/**
 * Calculate annual demand charge savings under 2-component tariff.
 * 
 * @param {Object} peakShavingResult - From simulatePeakShaving
 * @param {number} cp - Demand charge rate (VNĐ/kW/month)
 * @returns {Object} { annualDemandSaving, monthlyDemandSaving, ... }
 */
export const calculateDemandChargeSavings = (peakShavingResult, cp) => {
    if (!peakShavingResult || !cp) return { annualDemandSaving: 0, monthlyDemandSaving: 0 };

    const monthlyDemandSaving = peakShavingResult.avgMonthlyReduction * cp;
    const annualDemandSaving = monthlyDemandSaving * 12;

    return {
        annualDemandSaving: Math.round(annualDemandSaving),
        monthlyDemandSaving: Math.round(monthlyDemandSaving),
        pmaxBefore: peakShavingResult.pmaxBefore,
        pmaxAfter: peakShavingResult.pmaxAfter,
        reductionKw: peakShavingResult.avgMonthlyReduction,
        monthlyResults: peakShavingResult.monthlyResults
    };
};

/**
 * Find optimal BESS size for peak shaving under 2-component tariff.
 * Tries various BESS sizes and finds the one with best ROI for demand savings.
 * 
 * @param {Array} hourlyData 
 * @param {number} cp - Demand charge (VNĐ/kW/month)
 * @param {number} bessPrice - BESS cost (VNĐ/kWh)
 * @param {Object} techParams - {bessEffRoundTrip, bessDod}
 * @returns {Object} { optimalKwh, optimalKw, annualSaving, paybackYears }
 */
export const findOptimalBessForPeakShaving = (hourlyData, cp, bessPrice, techParams = {}) => {
    const { bessEffRoundTrip = 0.90, bessDod = 0.90 } = techParams;

    // Get baseline Pmax
    const baseline = simulatePeakShaving(hourlyData, 0, 0, bessEffRoundTrip, bessDod);
    if (baseline.pmaxBefore <= 0) return null;

    // Try different BESS sizes (% of Pmax)
    const candidates = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50];
    let bestResult = null;
    let bestPayback = Infinity;

    for (const ratio of candidates) {
        const bessKwh = Math.round(baseline.pmaxBefore * ratio * 2); // 2-hour duration
        const bessKw = Math.round(bessKwh / 2);
        if (bessKwh <= 0) continue;

        const result = simulatePeakShaving(hourlyData, bessKwh, bessKw, bessEffRoundTrip, bessDod);
        const savings = calculateDemandChargeSavings(result, cp);

        if (savings.annualDemandSaving <= 0) continue;

        const capex = bessKwh * bessPrice;
        const payback = capex / savings.annualDemandSaving;

        if (payback < bestPayback) {
            bestPayback = payback;
            bestResult = {
                optimalKwh: bessKwh,
                optimalKw: bessKw,
                annualSaving: savings.annualDemandSaving,
                paybackYears: Math.round(payback * 10) / 10,
                reductionKw: savings.reductionKw,
                pmaxBefore: result.pmaxBefore,
                pmaxAfter: result.pmaxAfter
            };
        }
    }

    return bestResult;
};

export { calculateMonthlyPmax, simulatePeakShaving };
