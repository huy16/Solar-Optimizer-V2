
import { LOAD_PROFILES } from './loadProfilesData.js';

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
    let profileEntry = LOAD_PROFILES[profileType] || LOAD_PROFILES[Object.keys(LOAD_PROFILES)[0]] || {};
    
    // Handle Custom Override from UI (Manual 48h input)
    if (profileType === 'custom' && options.customWeights) {
        profileEntry = {
            weights: options.customWeights,
            intervalMins: 60,
            isDualDay: true
        };
    }

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
        let weightedDaysCount = 0;
        const monthByteMap = []; 

        for (let d = 1; d <= daysInMonth[m]; d++) {
            const date = new Date(year, m, d, 12, 0, 0);
            const dayOfWeek = date.getDay(); 
            let scale = 1.0;

            const isMonFri = options.workSchedule === 'mon_fri';
            const isMonSat = options.workSchedule === 'mon_sat';
            const scheduleArray = Array.isArray(options.workSchedule) ? options.workSchedule : null;

            const ratioSat = options.weekendRatioSat !== undefined ? options.weekendRatioSat : 0.4;
            const ratioSun = options.weekendRatioSun !== undefined ? options.weekendRatioSun : 0.3;

            if (isMonFri) {
                if (dayOfWeek === 6) scale = ratioSat; 
                else if (dayOfWeek === 0) scale = ratioSun;
            } else if (isMonSat) {
                if (dayOfWeek === 0) scale = ratioSun; 
            } else if (scheduleArray && scheduleArray.length === 7) {
                if (scheduleArray[dayOfWeek] === 0) {
                    scale = (dayOfWeek === 6) ? ratioSat : ratioSun;
                }
            }

            weightedDaysCount += scale;
            monthByteMap.push({ d, scale, dayOfWeek });
        }

        const baseDailyKwh = totalMonthKwh / weightedDaysCount;
        const stepsPerDay = Math.floor(1440 / intervalMins);
        
        // Month generation buffer for TOU normalization
        const monthResults = [];

        monthByteMap.forEach(({ d, scale, dayOfWeek }) => {
            const dailyKwh = baseDailyKwh * scale;

            for (let step = 0; step < stepsPerDay; step++) {
                const mins = step * intervalMins;
                const hh = Math.floor(mins / 60);
                const mm = Math.floor(mins % 60);
                const pointDate = new Date(year, m, d, hh, mm, 0);

                let weight = 0;
                if (isDualDay) {
                    const isMonFriInternal = options.workSchedule === 'mon_fri';
                    const isWeekend = isMonFriInternal ? (dayOfWeek === 0 || dayOfWeek === 6) : (dayOfWeek === 0);
                    const idx = step + (isWeekend && weights.length >= stepsPerDay * 2 ? stepsPerDay : 0);
                    weight = weights[idx] || (1 / stepsPerDay);
                } else {
                    weight = weights[step] || (1 / stepsPerDay);
                }

                const stepEnergyKwh = dailyKwh * weight;
                const stepPowerKw = stepEnergyKwh / (intervalMins / 60);

                // Determine TOU group for this step
                // (Using center of step for more accurate boundary check)
                const centerMins = mins + (intervalMins / 2);
                const centerHour = centerMins / 60;
                let touGroup = 'normal';
                if (centerHour >= 22 || centerHour < 4) touGroup = 'offPeak';
                else if ((centerHour >= 9.5 && centerHour < 11.5) || (centerHour >= 17 && centerHour < 20)) touGroup = 'peak';

                monthResults.push({
                    rawTime: pointDate,
                    loadKw: stepPowerKw,
                    weight,
                    timeStep: intervalMins / 60,
                    touGroup
                });
            }
        });

        // 4. 3-Tier Normalization (Apply Factor per TOU Bucket)
        if (options.isThreeTier && options.threeTierData) {
            const targets = {
                normal: options.threeTierData.normal[m] || 0,
                peak: options.threeTierData.peak[m] || 0,
                offPeak: options.threeTierData.offPeak[m] || 0
            };

            const actuals = { normal: 0, peak: 0, offPeak: 0 };
            monthResults.forEach(r => {
                actuals[r.touGroup] += r.loadKw * r.timeStep;
            });

            const factors = {
                normal: actuals.normal > 0 ? targets.normal / actuals.normal : 0,
                peak: actuals.peak > 0 ? targets.peak / actuals.peak : 0,
                offPeak: actuals.offPeak > 0 ? targets.offPeak / actuals.offPeak : 0
            };

            monthResults.forEach(r => {
                r.loadKw *= factors[r.touGroup];
            });
        }

        results.push(...monthResults);
    }
    return results;
};