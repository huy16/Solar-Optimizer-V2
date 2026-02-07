export const generateSolarProfile = (monthlyGhi, metadata, sourceName) => {
    const solarMap = new Map(); const year = new Date().getFullYear();
    for (let m = 0; m < 12; m++) {
        const daysInMonth = new Date(year, m + 1, 0).getDate(); const monthlySum = monthlyGhi[m];
        // monthlyGhi is usually kWh/m2/month or similar.
        // Convert to daily avg peak sun hours (PSH)
        const avgDailyPsh = monthlySum / daysInMonth;
        const amplitude = (avgDailyPsh * Math.PI) / 24; // Simple sinusoidal model
        for (let d = 1; d <= daysInMonth; d++) {
            for (let h = 0; h < 24; h++) {
                let val = 0; if (h > 6 && h < 18) val = amplitude * Math.sin(((h - 6) * Math.PI) / 12);
                if (val < 0) val = 0;
                solarMap.set(`${m}-${d}-${h}-0`, val);
                solarMap.set(`${m}-${d}-${h}-30`, val);
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
                    const keyCurrent = `MONTHLY-${m}-${h}`;
                    const valCurrent = originalMap.get(keyCurrent) || 0;

                    const keyNext = `MONTHLY-${m}-${(h + 1) % 24}`; // Simple wrap-around for H=23->0
                    const valNext = originalMap.get(keyNext) || 0;

                    // Calculate 30m value (avg)
                    // Logic: If Solar at 18:00 is >0 and 19:00 is 0, 18:30 is avg.
                    let val30 = 0;
                    // Only interpolate if endpoints reasonable (e.g. not wrapping noon to midnight)
                    // H=23 to H=0 is acceptable (night to night is 0 to 0)
                    if (Math.abs(h - (h + 1) % 24) === 1 || h === 23) {
                        val30 = (valCurrent + valNext) / 2;
                    }

                    // Key Format: M-D-H-0 and M-D-H-30 (SolarOptimizer expects these for exact match)
                    newMap.set(`${m}-${d}-${h}-0`, valCurrent);
                    newMap.set(`${m}-${d}-${h}-30`, val30);
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
    // Integral of A * sin(pi * (t-6) / 12) dt from 6 to 18 = A * 24/pi
    // We want Integral = dailyPsh
    // So A = dailyPsh * pi / 24

    const peak = (dailyPsh * Math.PI) / 24;
    const val = peak * Math.sin((Math.PI * (time - 6)) / 12);

    return Math.max(0, val);
};
