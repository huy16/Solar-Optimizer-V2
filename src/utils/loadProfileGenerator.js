
import { LOAD_PROFILES } from './loadProfilesData';

export { LOAD_PROFILES };

/**
 * Generates a full year load profile (8760 hours) based on monthly totals and a daily profile shape.
 * 
 * @param {Array<number>} monthlyData - Array of 12 monthly kWh values
 * @param {string} profileType - Key matching LOAD_PROFILES
 * @param {number} year - Base year (default current year)
 * @param {Object} options - { workSchedule: 'mon_fri'|'mon_sat'|'all_days' }
 */
export const generateSyntheticProfile = (monthlyData, profileType, year = new Date().getFullYear(), options = {}) => {
    const results = [];

    // Safety: Fallback to first available profile if key not found
    const profileEntry = LOAD_PROFILES[profileType] || LOAD_PROFILES[Object.keys(LOAD_PROFILES)[0]] || {};

    // Support both Legacy (Array) and New (Object) structure
    const weights = Array.isArray(profileEntry) ? profileEntry : (profileEntry.weights || Array(24).fill(1 / 24));
    const intervalMins = profileEntry.intervalMins || 60;
    const isDualDay = profileEntry.isDualDay || false;

    // Safety check for monthlyData
    const safeMonthlyData = Array.isArray(monthlyData) && monthlyData.length === 12
        ? monthlyData.map(v => Number(v) || 0)
        : Array(12).fill(0);

    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const daysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    for (let m = 0; m < 12; m++) {
        const totalMonthKwh = safeMonthlyData[m];
        if (totalMonthKwh <= 0) {
            // Fill with zeros for this month
            for (let d = 1; d <= daysInMonth[m]; d++) {
                for (let h = 0; h < 24; h++) {
                    const date = new Date(year, m, d, h, 0, 0);
                    results.push({ rawTime: date, loadKw: 0 });
                }
            }
            continue;
        }

        // 1. Calculate Total Weighted Days for the Month
        // This ensures that when we scale down weekends, we boost weekdays to match the Total Monthly kWh
        let weightedDaysCount = 0;
        const monthByteMap = []; // Store day-type for the second pass

        for (let d = 1; d <= daysInMonth[m]; d++) {
            const date = new Date(year, m, d, 12, 0, 0);
            const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
            let scale = 1.0;

            if (options.workSchedule === 'mon_fri') {
                if (dayOfWeek === 0 || dayOfWeek === 6) scale = 0.3;
            } else if (options.workSchedule === 'mon_sat') {
                if (dayOfWeek === 0) scale = 0.3;
            }
            // 'all_days' implies scale = 1.0 always

            weightedDaysCount += scale;
            monthByteMap.push({ d, scale, dayOfWeek });
        }

        // 2. Calculate Base Daily Energy (for a "1.0" scale day)
        const baseDailyKwh = totalMonthKwh / weightedDaysCount;

        // 3. Generate Profile
        const stepsPerDay = Math.floor(1440 / intervalMins);

        monthByteMap.forEach(({ d, scale, dayOfWeek }) => {
            // Distribute this day's share of energy
            const dailyKwh = baseDailyKwh * scale;

            for (let step = 0; step < stepsPerDay; step++) {
                const mins = step * intervalMins;
                const hh = Math.floor(mins / 60);
                const mm = Math.floor(mins % 60);
                const pointDate = new Date(year, m, d, hh, mm, 0);

                let weight = 0;
                if (isDualDay) {
                    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
                    // Handle case where dual day might not have 2x steps
                    const idx = step + (isWeekend && weights.length >= stepsPerDay * 2 ? stepsPerDay : 0);
                    weight = weights[idx] || (1 / stepsPerDay);
                } else {
                    weight = weights[step] || (1 / stepsPerDay);
                }

                // Normalization check: ensure weights sum to ~1 usually, but we rely on dailyKwh distribution here
                // Formula: Power (kW) = Energy (kWh) / Time (h)
                // We distribute 'dailyKwh' according to 'weight' profile
                // Assumption: sum(weights) for a day approx equals 1. If not, we might need to normalize weights per day.
                // For safety with arbitrary profiles, let's assume raw weights sum to 1. 
                // If they don't, we should ideally normalize them. 
                // But for now, adhering to existing logic: Power = (dailyKwh * weight) / (interval / 60)

                const stepEnergyKwh = dailyKwh * weight;
                const stepPowerKw = stepEnergyKwh / (intervalMins / 60);

                results.push({
                    rawTime: pointDate,
                    loadKw: stepPowerKw,
                    weight,
                    timeStep: intervalMins / 60
                });
            }
        });
    }
    return results;
};