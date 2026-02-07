/**
 * Selects the optimal combination of inverters for a given target DC capacity (kWp).
 * 
 * Strategy:
 * 1. Filter usable inverters (exclude hybrids/batteries if needed, though mostly standard string inverters).
 * 2. Calculate target AC capacity based on a ratio (e.g. 1.25).
 * 3. Fill with largest available inverters first.
 * 4. Verify DC Input Constraint (Max PV Input). If insufficient, upsizing AC capacity (more inverters) until DC fits.
 * 
 * @param {number} targetDcKw - The target DC system size (Solar Capacity)
 * @param {Array} inverterDb - Array of inverter objects { id, acPower, maxPv, ... }
 * @param {number} targetRatio - Desired DC/AC ratio (default 1.25)
 * @returns {Object} { totalAcKw, selectedInverters: [{ id, count, model }] }
 */
export const selectOptimalInverters = (targetDcKw, inverterDb, targetRatio = 1.25) => {
    if (!targetDcKw || targetDcKw <= 0) return { totalAcKw: 0, selectedInverters: [] };
    if (!inverterDb || inverterDb.length === 0) return { totalAcKw: targetDcKw / targetRatio, selectedInverters: [] }; // Fallback

    // 1. Filter Valid Inverters (Exclude invalid or special ones if necessary)
    // Assuming DB has standard string inverters. Sort by AC Power Descending.
    // Exclude 'custom' or 'PCS' if they don't accept PV directly (maxPv > 0)
    const validInverters = inverterDb
        .filter(i => i.acPower > 0 && i.maxPv > 0)
        .sort((a, b) => b.acPower - a.acPower);

    if (validInverters.length === 0) return { totalAcKw: targetDcKw / targetRatio, selectedInverters: [] };

    // 2. Determine Minimum Required AC
    // Primary Constraint: DC/AC Ratio
    let minAcRequired = targetDcKw / targetRatio;

    // Secondary Constraint: Max PV Input (DC Limit)
    // We need enough inverters so that sum(maxPv) >= targetDcKw
    // But we don't know the mix yet. So we iterate.

    // Simple Greedy Approach:
    // Try to satisfy AC requirement first. Then check DC limit. If fail, increase AC requirement.

    let totalAcKw = 0;
    let totalMaxPv = 0;
    const selection = {}; // id -> count

    let remainingAc = minAcRequired;

    // Helper to add inverter
    const addInverter = (inv) => {
        selection[inv.id] = (selection[inv.id] || 0) + 1;
        totalAcKw += inv.acPower;
        totalMaxPv += inv.maxPv;
        remainingAc -= inv.acPower;
    };

    // First Pass: Fill minimum AC
    while (remainingAc > 0) {
        // Find largest inverter that fits remaining or just the smallest one to top up?
        // Actually, for C&I, we prefer fewer large inverters.
        // If remaining > largest/2, take largest. Else take text smaller...
        // Simplified: Just always take largest that isn't excessively huge compared to remaining?
        // No, C&I usually standardizes on 100KTL or 110KTL.
        // Let's just use Greedy: fit largest available.
        // If remaining is small (e.g. 5kW), taking a 100kW is overkill?
        // Better: Find best fit.

        let bestFit = validInverters[0]; // Default largest
        // If remaining is small, look for smaller fit
        if (remainingAc < validInverters[0].acPower) {
            // Find smallest inverter that is >= remaining
            const smallestSufficient = validInverters.slice().reverse().find(i => i.acPower >= remainingAc);
            if (smallestSufficient) bestFit = smallestSufficient;
            else bestFit = validInverters[validInverters.length - 1]; // Smallest available
        } else {
            bestFit = validInverters[0]; // Largest
        }
        addInverter(bestFit);
    }

    // Second Pass: Verify DC Input Limit (Max PV)
    // If totalMaxPv < targetDcKw, we need MORE inverters.
    // We iterate adding smallest/medium inverters until satisfied?
    // Or just add the largest efficient one?
    // Let's add the largest available to quickly satisfy the gap.
    let safetyLoop = 0;
    while (totalMaxPv < targetDcKw && safetyLoop < 20) {
        // Need more DC capacity.
        const deficit = targetDcKw - totalMaxPv;

        // Find inverter with best MaxPV/AC ratio? Or just largest?
        // Usually larger is better.
        addInverter(validInverters[0]);
        safetyLoop++;
    }

    // Convert selection map to array
    const selectedInverters = Object.entries(selection).map(([id, count]) => {
        const inv = validInverters.find(i => i.id === id);
        return { id, count, model: inv };
    });

    return { totalAcKw, selectedInverters };
};
