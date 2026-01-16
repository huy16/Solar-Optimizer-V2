export const parseTMYData = (dataArray) => {
    let headerIdx = -1; let colMap = { time: -1, val: -1 };
    const valCols = ['g(h)', 'g_h', 'ghi', 'global horizontal', 'irradiance'];
    for (let i = 0; i < Math.min(dataArray.length, 50); i++) {
        const row = dataArray[i].map(c => String(c).toLowerCase().trim());
        const hasTime = row.some(c => c.includes('time') || c === 'date');
        const hasG = row.some(c => valCols.some(v => c.includes(v)));
        if (hasTime && hasG) { headerIdx = i; row.forEach((cell, idx) => { if (cell.includes('time') || cell === 'date') colMap.time = idx; else if (colMap.val === -1 && valCols.some(v => cell.includes(v))) colMap.val = idx; }); break; }
    }
    if (headerIdx === -1) return [];
    const solarMap = new Map(); let count = 0;
    for (let i = headerIdx + 1; i < dataArray.length; i++) {
        const row = dataArray[i]; if (!row || row.length <= colMap.val) continue;
        const rawTime = String(row[colMap.time]).trim(); const rawVal = parseFloat(row[colMap.val]);
        if (!rawTime || isNaN(rawVal)) continue;
        let y, m, d, h;
        if (rawTime.includes(':') && rawTime.length >= 13) { const parts = rawTime.split(':'); const datePart = parts[0]; const timePart = parts[1]; if (datePart.length === 8) { y = parseInt(datePart.substring(0, 4)); m = parseInt(datePart.substring(4, 6)) - 1; d = parseInt(datePart.substring(6, 8)); h = parseInt(timePart.substring(0, 2)); } }
        if (m === undefined) continue; // Skip if parse fail
        solarMap.set(`${m}-${d}-${h}-0`, rawVal / 1000); solarMap.set(`${m}-${d}-${h}-30`, rawVal / 1000); count++;
    }
    return [{ map: solarMap, source: `TMY Data (${count} rows)`, title: 'TMY Data', score: 2 }];
};

export const parse8760Data = (dataArray) => {
    if (dataArray.length < 100) return [];
    let headerIdx = -1; let colMap = { month: -1, day: -1, hour: -1, val: -1 };
    const valCols = ['globinc', 'ghi', 'global horizontal', 'ac system output', 'poa', 'irradiance'];
    for (let i = 0; i < Math.min(dataArray.length, 50); i++) {
        const row = dataArray[i].map(c => String(c).toLowerCase().trim());
        const hasM = row.includes('month'); const hasD = row.includes('day'); const hasH = row.includes('hour');
        const hasVal = row.some(c => valCols.some(v => c.includes(v)));
        if (hasM && hasD && hasH && hasVal) {
            headerIdx = i;
            row.forEach((cell, idx) => {
                if (cell === 'month') colMap.month = idx;
                else if (cell === 'day') colMap.day = idx;
                else if (cell === 'hour') colMap.hour = idx;
                else if (colMap.val === -1 && valCols.some(v => cell.includes(v))) colMap.val = idx;
            });
            break;
        }
    }
    if (headerIdx === -1) return [];

    const solarMap = new Map();
    let count = 0;
    for (let i = headerIdx + 1; i < dataArray.length; i++) {
        const row = dataArray[i];
        if (!row) continue;
        const m = parseInt(row[colMap.month]) - 1;
        const d = parseInt(row[colMap.day]);
        const h = parseInt(row[colMap.hour]);
        let val = parseFloat(row[colMap.val]);
        if (isNaN(m) || isNaN(d) || isNaN(h) || isNaN(val)) continue;

        if (colMap.val > -1 && String(dataArray[headerIdx][colMap.val]).toLowerCase().includes('w/m2')) val /= 1000;

        solarMap.set(`${m}-${d}-${h}-0`, val);
        solarMap.set(`${m}-${d}-${h}-30`, val);
        count++;
    }
    return [{ map: solarMap, source: `8760 Data (${count} rows)`, title: '8760 Data', score: 8 }];
};
