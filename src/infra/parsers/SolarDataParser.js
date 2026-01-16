import { parseAnyDate } from '../../utils/dateParsing';

export const parsePVSystCSV = (dataArray) => {
    let headerIdx = -1;
    for (let i = 0; i < Math.min(dataArray.length, 50); i++) {
        const row = dataArray[i].map(c => String(c).toLowerCase().trim());
        if (row.includes('date') && (row.includes('e_grid') || row.includes('egrid') || row.includes('earray') || row.includes('globinc'))) {
            headerIdx = i;
            break;
        }
    }
    if (headerIdx === -1) return [];

    const headerRow = dataArray[headerIdx].map(c => String(c).toLowerCase().trim());
    const dateIdx = headerRow.indexOf('date');
    const globIncIdx = headerRow.indexOf('globinc'); // W/m2
    const eGridIdx = headerRow.findIndex(c => c === 'e_grid' || c === 'egrid'); // kW
    const eArrayIdx = headerRow.findIndex(c => c === 'earray'); // kW

    // Neu co E_Grid hoac EArray, uu tien dung E_Grid (output thuc te)
    // Neu chi co GlobInc, dung no lam profile

    // Tim don vi (W/m2 hay kW) o dong duoi header neu co
    let isUnitKw = false;
    if (dataArray.length > headerIdx + 1) {
        const unitRow = dataArray[headerIdx + 1].map(c => String(c).toLowerCase().trim());
        if (unitRow[eGridIdx] === 'kw' || unitRow[eArrayIdx] === 'kw' || unitRow[eGridIdx] === 'mw' || unitRow[eArrayIdx] === 'mw') isUnitKw = true; // Don vi la Cong suat
    }

    const solarMap = new Map();
    const solarLayers = [];
    let maxVal = 0;

    // 1. Thu tao Layer E_Grid (Output thuc te)
    if (eGridIdx !== -1 || eArrayIdx !== -1) {
        const colIdx = eGridIdx !== -1 ? eGridIdx : eArrayIdx;
        const outputMap = new Map();
        let count = 0;
        let sumOutput = 0;
        for (let i = headerIdx + 2; i < dataArray.length; i++) {
            const row = dataArray[i];
            if (!row || row.length <= Math.max(dateIdx, colIdx)) continue;
            const dateStr = String(row[dateIdx]).trim();
            let val = parseFloat(row[colIdx]);
            if (!dateStr || isNaN(val)) continue;

            // Parse Date: dd/MM/yy HH:mm -> Can ham parse rieng hoac parseAnyDate
            const date = parseAnyDate(dateStr, true); // Assume dd/MM/yy HH:mm format, force year to 2023. Note: isSwapMonthDay=true passed? Original code passed false, true (3 args?). 
            // Original: parseAnyDate(dateStr, false, true); // 3 args?
            // parseAnyDate definition has 2 args: (input, isSwapMonthDay=false).
            // Line 524 in Step 59: parseAnyDate(dateStr, false, true);
            // Wait, the definition at line 55 has 2 args. 
            // If it was called with 3 args, the 3rd arg is ignored by the definition at line 55.
            // But line 55 definition is: const parseAnyDate = (input, isSwapMonthDay = false) => { ... }
            // So the 'true' passed as 3rd arg matches nothing?
            // Wait. In line 524 comment it says "force year to 2023".
            // Maybe there WAS a 3rd arg in a previous version or I missed it?
            // Let's check line 55 again.
            // ... no 3rd arg.
            // So I will just call it with 2 args.

            if (!date || isNaN(date.getTime())) continue;

            const day = date.getDate();
            const month = date.getMonth();
            const hour = date.getHours();
            const min = date.getMinutes();

            // Key: M-D-H-m
            const key = `${month}-${day}-${hour}-${min >= 30 ? 30 : 0}`;

            // Normalize ve he so 1 kWp? 
            if (val < 0) val = 0; // Negative grid injection (night consumption)
            outputMap.set(key, val);
            sumOutput += val;
            if (val > maxVal) maxVal = val;
            count++;
        }

        if (count > 100) {
            // Thu doan System Size dua tren Max Output (thuong Output max ~ 0.8-0.9 System Size)
            const estimatedSize = maxVal / 0.85;
            // De chuyen ve unit profile (0-1), ta chia cho estimatedSize
            const normalizedMap = new Map();
            outputMap.forEach((v, k) => normalizedMap.set(k, v / estimatedSize));

            solarLayers.push({
                map: normalizedMap,
                source: `PVSyst E_Grid (Est. Size: ${Math.round(estimatedSize)} kWp)`,
                title: 'PVSyst Output (E_Grid)',
                score: 1, // High priority
                isAbsolute: true, // Flag special handling if needed
                estimatedSize: estimatedSize
            });
        }
    }

    // 2. Thu tao Layer GlobInc (Irradiance) -> Giong nhu CSV thuong
    if (globIncIdx !== -1) {
        const ghiMap = new Map();
        let count = 0;
        for (let i = headerIdx + 2; i < dataArray.length; i++) {
            const row = dataArray[i];
            if (!row || row.length <= Math.max(dateIdx, globIncIdx)) continue;
            const dateStr = String(row[dateIdx]).trim();
            let val = parseFloat(row[globIncIdx]); // W/m2
            if (!dateStr || isNaN(val)) continue;

            const date = parseAnyDate(dateStr, true); // Original: parseAnyDate(dateStr, false, true);
            if (!date || isNaN(date.getTime())) continue;

            const day = date.getDate();
            const month = date.getMonth();
            const hour = date.getHours();
            const min = date.getMinutes();
            const key = `${month}-${day}-${hour}-${min >= 30 ? 30 : 0}`;

            ghiMap.set(key, val / 1000); // W/m2 -> kW/m2 (standard unit for logic)
            count++;
        }
        if (count > 100) {
            solarLayers.push({
                map: ghiMap,
                source: 'PVSyst GlobInc (Irradiance)',
                title: 'PVSyst Irradiance (GHI)',
                score: 2 // Lower priority than E_Grid
            });
        }
    }

    return solarLayers;
};

export const parseStandardCSV = (dataArray) => {
    let headerIdx = -1; let colMap = { time: -1, val: -1 };
    const timeKeywords = ['period_end', 'period', 'time', 'date', 'timestamp'];
    const valKeywords = ['ghi', 'global_horizontal', 'irradiance', 'shortwave'];
    for (let i = 0; i < Math.min(dataArray.length, 50); i++) {
        const row = dataArray[i].map(c => String(c).toLowerCase().trim());
        const tIdx = row.findIndex(c => timeKeywords.some(k => c === k || c.includes(k)));
        const vIdx = row.findIndex(c => valKeywords.some(k => c === k || c.includes(k)));
        if (tIdx !== -1 && vIdx !== -1) { headerIdx = i; colMap.time = tIdx; colMap.val = vIdx; break; }
    }
    if (headerIdx === -1) return [];
    const headerName = String(dataArray[headerIdx][colMap.time]).toLowerCase();
    const isPeriodEnd = headerName.includes('end');
    const solarMap = new Map(); let count = 0; let maxVal = 0;
    for (let i = headerIdx + 1; i < dataArray.length; i++) {
        const row = dataArray[i]; if (!row || row.length <= Math.max(colMap.time, colMap.val)) continue;
        const rawTime = String(row[colMap.time]).trim(); let rawVal = parseFloat(row[colMap.val]);
        if (!rawTime || isNaN(rawVal)) continue;

        let dateObj = parseAnyDate(rawTime);
        if (!dateObj || isNaN(dateObj.getTime())) continue;

        if (isPeriodEnd) dateObj.setUTCMinutes(dateObj.getUTCMinutes() - 30);
        const finalM = dateObj.getUTCMonth(); const finalD = dateObj.getUTCDate(); const finalH = dateObj.getUTCHours(); const finalMin = dateObj.getUTCMinutes();
        if (rawVal > maxVal) maxVal = rawVal;
        solarMap.set(`${finalM}-${finalD}-${finalH}-${finalMin >= 30 ? 30 : 0}`, rawVal); count++;
    }
    if (count < 100) return [];
    const isWatts = maxVal > 2.0; const finalMap = new Map();
    solarMap.forEach((v, k) => { finalMap.set(k, isWatts ? v / 1000 : v); });
    return [{
        map: finalMap,
        source: `Standard CSV (${isWatts ? 'W/m² converted' : 'kW/m²'}) ${isPeriodEnd ? '[-30m shift]' : ''}`,
        title: 'CSV Data', score: 1
    }];
};
