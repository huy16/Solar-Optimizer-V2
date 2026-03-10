export const generateSolarProfile = (monthlyGhi, metadata, sourceName, isSmoothProfile = false) => {
    const solarMap = new Map(); const year = new Date().getFullYear();

    // Calculate overall avg PSH to shape the curve differently per province
    const totalAnnualGhi = monthlyGhi.reduce((a, b) => a + b, 0);
    const avgPsh = totalAnnualGhi / 365;

    // Dynamic profile: vary solar window and shape based on province PSH
    // Higher PSH = wider window, more symmetric peak
    // Lower PSH = narrower window, sharper peak
    const buildDailyProfile = (psh) => {
        // Solar window boundaries (hours)
        // PSH 4.5 → sunrise 5.5, sunset 18.0 (wide)
        // PSH 2.8 → sunrise 6.5, sunset 16.5 (narrow)
        const sunriseBase = 6.0;
        const sunsetBase = 17.0;
        const widthFactor = Math.max(0, (psh - 3.0) / 2.0); // 0-1 range
        const sunrise = sunriseBase - widthFactor * 1.0;  // 5.0 to 6.0
        const sunset = sunsetBase + widthFactor * 1.0;    // 17.0 to 18.0
        
        // Peak hour shifts slightly: higher PSH peaks later (12.5), lower PSH peaks earlier (11.5)
        const peakHour = 11.5 + widthFactor * 1.0; // 11.5 to 12.5
        
        // Asymmetry: afternoon drops faster for lower PSH (more cloud cover)
        const morningWidth = peakHour - sunrise;
        const afternoonWidth = sunset - peakHour;
        
        const profile = {};
        for (let t = 0; t <= 23.5; t += 0.5) {
            let val = 0;
            if (t >= sunrise && t <= sunset) {
                let normalized;
                if (t <= peakHour) {
                    normalized = (t - sunrise) / morningWidth; // 0 to 1
                } else {
                    normalized = (sunset - t) / afternoonWidth; // 1 to 0
                }
                // Use sin^2 envelope with province-specific shape
                const sinVal = Math.sin(normalized * Math.PI / 2);
                val = Math.pow(sinVal, 1.5 + widthFactor * 0.5); // exponent 1.5-2.0
            }
            if (val > 0.001) profile[t] = val;
        }
        return profile;
    };

    for (let m = 0; m < 12; m++) {
        const daysInMonth = new Date(year, m + 1, 0).getDate(); const monthlySum = monthlyGhi[m];
        const avgDailyPsh = monthlySum / daysInMonth;
        
        // Build profile specific to this month's PSH
        const dailyProfile = isSmoothProfile
            ? buildDailyProfile(avgDailyPsh)  // Province-specific bell-curve
            : buildDailyProfile(avgPsh);       // Fallback: use avg PSH
        
        const sumWeights = Object.values(dailyProfile).reduce((a, b) => a + b, 0);
        if (sumWeights === 0) continue;

        for (let d = 1; d <= daysInMonth; d++) {
            for (let h = 0; h < 24; h++) {
                let valCurrent = 0;
                let valNext = 0;

                if (dailyProfile[h] !== undefined) {
                    valCurrent = (avgDailyPsh * (dailyProfile[h] / sumWeights)) / 0.5;
                }
                if (dailyProfile[h + 0.5] !== undefined) {
                    valNext = (avgDailyPsh * (dailyProfile[h + 0.5] / sumWeights)) / 0.5;
                }

                solarMap.set(`${m}-${d}-${h}-0`, Math.max(0, valCurrent));
                solarMap.set(`${m}-${d}-${h}-30`, Math.max(0, valNext));
            }
        }
    }
    return [{ map: solarMap, source: sourceName, title: sourceName, score: 2, meta: metadata }];
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
        // GIẢI THÍCH:
        // Do dữ liệu PVSyst/GSA thường là "Năng lượng thu được trong 1 giờ" (Wh/m² hoặc kWh).
        // Khi chúng ta chia 1 slot 1-hour thành 2 slot 30-min (mộc phút 0 và mốc phút 30),
        // NẾU chúng ta muốn "Công suất" (kW) giữ nguyên thì ok, nhưng thuật toán Evaluate 
        // ở CalculateEnergyGeneration đang coi Giá trị Map là Energy/Hour. 
        // Do đó, ta phải chia đôi giá trị gốc ra cho 2 nửa tiếng để TỔNG năng lượng không đổi.

        let pwrCurrent = curr.val;
        let pwrNext = curr.val;

        const next = entries[i + 1];
        if (next && (next.time - curr.time) <= 3600000 * 1.5) {
            // Nội suy tuyến tính tạo độ dốc nhẹ
            pwrNext = (curr.val + next.val) / 2;
        }

        newMap.set(curr.key, pwrCurrent);

        const key30 = curr.key.replace(/-0$/, '-30');
        newMap.set(key30, pwrNext);
    });
    return newMap;
};


export const generateInstantaneousSolar = (date, dailyPsh) => {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const time = hour + (minute >= 30 ? 0.5 : 0);

    // Profile chuẩn phân bổ theo ngày, tổng các trọng số = 1.0 (trước khi normalize)
    const dailyProfile = {
        7.0: 0.040, 7.5: 0.060,
        8.0: 0.080, 8.5: 0.095, 9.0: 0.105, 9.5: 0.118,
        10.0: 0.117, 10.5: 0.117, 11.0: 0.118, 11.5: 0.135,
        12.0: 0.155, 12.5: 0.145, 13.0: 0.135, 13.5: 0.125,
        14.0: 0.090, 14.5: 0.060, 15.0: 0.030, 15.5: 0.015,
        16.0: 0.010, 16.5: 0.005, 17.0: 0.002
    };

    // Chuẩn hoá để tổng weights = 1.0
    const sumWeights = Object.values(dailyProfile).reduce((a, b) => a + b, 0);

    if (dailyProfile[time] === undefined) return 0;

    // Năng lượng phân bổ cho slot này (cho 1 kWp): Energy(t) = dailyPsh * (weight(t) / sumWeights)
    // Để được mốc Công suất kW ở điểm t, ta tính: Power(t) = Energy(t) / timeStep
    // Vì timeStep ở đây là 0.5h, nên:
    const energyThisSlot = dailyPsh * (dailyProfile[time] / sumWeights);
    const powerKw = energyThisSlot / 0.5;

    return powerKw;
};
