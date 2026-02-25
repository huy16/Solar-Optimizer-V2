export const generateSolarProfile = (monthlyGhi, metadata, sourceName) => {
    const solarMap = new Map(); const year = new Date().getFullYear();
    for (let m = 0; m < 12; m++) {
        const daysInMonth = new Date(year, m + 1, 0).getDate(); const monthlySum = monthlyGhi[m];
        // monthlyGhi is usually kWh/m2/month or similar.
        // Convert to daily avg peak sun hours (PSH)
        const avgDailyPsh = monthlySum / daysInMonth;
        // 1. Calculate the base shape integral (sum of half-hours)
        let shapeSum = 0;
        for (let h = 0; h < 24; h++) {
            if (h >= 6 && h <= 18) {
                shapeSum += Math.pow(Math.sin((Math.PI * (h - 6)) / 12), 3);
            }
            const hNext = h + 0.5;
            if (hNext >= 6 && hNext <= 18) {
                shapeSum += Math.pow(Math.sin((Math.PI * (hNext - 6)) / 12), 3);
            }
        }

        // 2. The total daily energy is (Peak * shapeSum * 0.5).
        // We want Energy = avgDailyPsh. So Peak = avgDailyPsh / (shapeSum * 0.5).
        const peak = avgDailyPsh / (shapeSum * 0.5);

        for (let d = 1; d <= daysInMonth; d++) {
            for (let h = 0; h < 24; h++) {
                let valCurrent = 0;
                let valNext = 0;

                if (h >= 6 && h <= 18) {
                    valCurrent = peak * Math.pow(Math.sin((Math.PI * (h - 6)) / 12), 3);
                }
                const hNext = h + 0.5;
                if (hNext >= 6 && hNext <= 18) {
                    valNext = peak * Math.pow(Math.sin((Math.PI * (hNext - 6)) / 12), 3);
                }

                solarMap.set(`${m}-${d}-${h}-0`, Math.max(0, valCurrent));
                solarMap.set(`${m}-${d}-${h}-30`, Math.max(0, valNext));
            }
        }
    }
    if (metadata) metadata['sourceType'] = 'MET_SYNTHETIC';
    return [{ map: solarMap, source: `${sourceName} - Dữ liệu tháng tổng hợp`, title: sourceName, score: 2, meta: metadata }];
};

export const interpolate30Min = (originalMap) => {
    const newMap = new Map();
    const entries = [];
    let isMonthly = false;

    // Check Format
    for (const key of originalMap.keys()) {
        if (key.startsWith('MONTHLY-')) {
            isMonthly = true;
            break;
        }
    }

    if (isMonthly) {
        // Expand MONTHLY-m-h to full year M-D-H-0 and M-D-H-30
        const year = 2023;
        for (let m = 0; m < 12; m++) {
            const daysInMonth = new Date(year, m + 1, 0).getDate();

            for (let d = 1; d <= daysInMonth; d++) {
                for (let h = 0; h < 24; h++) {
                    const currentHourSum = originalMap.get(`MONTHLY-${m}-${h}`) || 0;
                    const nextHourSum = originalMap.get(`MONTHLY-${m}-${h + 1 === 24 ? 0 : h + 1}`) || 0;

                    // MONTHLY-m-h contains the Monthly Sum of specific yield for that hour.
                    // We divide by daysInMonth to get the daily specific yield for that hour.
                    const valCurrent = currentHourSum / daysInMonth;

                    // Interpret the 30-min data point as the average between this hour and next hour
                    const valNextHour = nextHourSum / daysInMonth;
                    let valNext = (valCurrent + valNextHour) / 2;

                    // Edge case: don't interpolate night hours into morning artificially if current is 0
                    if (valCurrent === 0 && valNextHour > 0) valNext = valNextHour * 0.1;
                    if (valCurrent > 0 && valNextHour === 0) valNext = valCurrent * 0.1;

                    // Key Format: M-D-H-0 and M-D-H-30 (SolarOptimizer expects these for exact match)
                    newMap.set(`${m}-${d}-${h}-0`, Math.max(0, valCurrent));
                    newMap.set(`${m}-${d}-${h}-30`, Math.max(0, valNext));
                }
            }
        }
        return newMap;
    }

    // EXISTING LOGIC FOR HOURLY (M-D-H-0)
    originalMap.forEach((val, key) => {
        if (key.endsWith('-0')) {
            const parts = key.split('-'); // M, D, H, 0
            const date = new Date(Date.UTC(2023, parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), 0));
            entries.push({ time: date.getTime(), val, key });
        }
    });

    if (entries.length === 0) return originalMap; // Return original if no valid keys found (fallback)

    entries.sort((a, b) => a.time - b.time);

    entries.forEach((curr, i) => {
        newMap.set(curr.key, curr.val);
        const next = entries[i + 1];
        let val30 = curr.val;
        if (next && (next.time - curr.time) <= 3600000 * 1.5) {
            val30 = (curr.val + next.val) / 2;
        }
        const key30 = curr.key.replace(/-0$/, '-30');
        newMap.set(key30, val30);
    });
    return newMap;
};


export const generateInstantaneousSolar = (date, dailyPsh) => {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const time = hour + minute / 60;

    // Simple model: Solar from 6am to 6pm (12 hours)
    if (time < 6 || time > 18) return 0;

    // Sine wave centered at 12:00
    // Integral of A * sin^3(pi * (t-6) / 12) dt from 6 to 18 = A * 16/pi
    // We want Integral = dailyPsh
    // So A = dailyPsh * pi / 16

    const peak = (dailyPsh * Math.PI) / 16;
    const val = peak * Math.pow(Math.sin((Math.PI * (time - 6)) / 12), 3);

    return Math.max(0, val);
};
