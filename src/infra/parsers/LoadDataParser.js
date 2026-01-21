export const processExcelData = (arrayData) => {
    let headerRowIndex = -1; let timeColIdx = -1; let loadColIdx = -1; let foundLoadName = '';
    for (let i = 0; i < Math.min(arrayData.length, 100); i++) {
        const row = arrayData[i]; if (!Array.isArray(row)) continue;
        const rowStr = row.map(cell => String(cell).toLowerCase());
        let pIdx = rowStr.findIndex(c => c.includes('σ p') || c.includes('sum p') || c.includes('total p') || c.includes('Σ p') || (c.includes('p') && c.includes('(kw)') && !c.includes('pa') && !c.includes('pb') && !c.includes('pc')));
        if (pIdx === -1) pIdx = rowStr.findIndex(c => c === 'load (kw)' || c === 'load' || (c.includes('load') && !c.includes('solar')));
        if (pIdx !== -1) {
            headerRowIndex = i; loadColIdx = pIdx; foundLoadName = row[pIdx];
            const potentialTimeIndices = rowStr.map((c, idx) => (c.includes('time') || c.includes('date') || c.includes('bắt đầu') || c.includes('kết thúc')) ? idx : -1).filter(idx => idx !== -1);
            if (potentialTimeIndices.length > 0) { for (let tCandidate of potentialTimeIndices) { let hasData = false; for (let j = 1; j <= 5; j++) { if (i + j < arrayData.length) { const val = arrayData[i + j][tCandidate]; if (val && String(val).trim() !== '') { hasData = true; break; } } } if (hasData) { timeColIdx = tCandidate; break; } } }
            break;
        }
    }
    if (headerRowIndex === -1 || loadColIdx === -1) { return []; } // Debug log removed (moved to caller or separate logger)
    if (timeColIdx === -1) { return []; }

    // Return extracted data, caller handles state
    const extracted = [];
    for (let i = headerRowIndex + 1; i < Math.min(arrayData.length, headerRowIndex + 50000); i++) {
        const row = arrayData[i]; if (!row) continue;
        const rawTime = row[timeColIdx]; const rawLoad = row[loadColIdx];
        if (rawTime === undefined || rawLoad === undefined) continue;
        const loadKw = parseFloat(rawLoad);
        if (!isNaN(loadKw)) extracted.push({ rawTime: rawTime, loadKw: loadKw });
    }
    return [{ data: extracted, loadName: foundLoadName }];
};

export const csvTo2DArray = (str) => {
    return str.split('\n').map(l => l.split(/[,;\t]/).map(c => c.trim()));
};

export const processCSVText = (textData) => {
    const arrayData = csvTo2DArray(textData);
    return processExcelData(arrayData);
};

export const parseSmartDesignData = (arrayData) => {
    let dayHourHeaderRow = -1; let colStartIdx = -1;
    // 1. Locate Profile Header (DAY\HOUR)
    for (let i = 0; i < Math.min(arrayData.length, 50); i++) {
        const row = arrayData[i]; if (!Array.isArray(row)) continue;
        const dayHourIdx = row.findIndex(c => String(c).includes('DAY\\HOUR') || String(c).includes('DAY/HOUR'));
        if (dayHourIdx !== -1) {
            if (row[dayHourIdx + 1] == 0) { dayHourHeaderRow = i; colStartIdx = dayHourIdx + 1; break; }
        }
    }
    if (dayHourHeaderRow === -1) return [];

    const profiles = { WKD: null, SAT: null, SUN: null };
    const labelCol = colStartIdx - 1;

    for (let i = dayHourHeaderRow + 1; i < Math.min(arrayData.length, dayHourHeaderRow + 20); i++) {
        const row = arrayData[i]; if (!row) continue;
        const label = String(row[labelCol]).toUpperCase();

        const extractValues = (r) => {
            const vals = [];
            for (let h = 0; h < 24; h++) {
                const v = parseFloat(r[colStartIdx + h]);
                vals.push(isNaN(v) ? 0 : v);
            }
            return vals;
        };

        if (label.includes('WRD') && !profiles.WKD) profiles.WKD = extractValues(row);
        if (label.includes('T7') && !profiles.SAT) profiles.SAT = extractValues(row);
        if (label.includes('CN') && !profiles.SUN) profiles.SUN = extractValues(row);
    }

    if (!profiles.WKD) return [];
    if (!profiles.SAT) profiles.SAT = profiles.WKD;
    if (!profiles.SUN) profiles.SUN = profiles.SAT;

    const monthlyTotals = new Array(12).fill(0);
    let monthHeaderCol = -1;
    let mainTotalCol = -1;

    // Better Header Detection: Look for row containing "tháng 1" directly, verify structure
    for (let i = 0; i < Math.min(arrayData.length, 50); i++) {
        const row = arrayData[i]; if (!Array.isArray(row)) continue;
        // Find "tháng 1"
        const idx = row.findIndex(c => {
            const s = String(c).toLowerCase();
            return s.includes('tháng 1') || s.includes('thang 1') || s === '1';
        });

        if (idx !== -1) {
            // Verify next rows follow pattern (month 2, month 3...)
            if (i + 1 < arrayData.length) {
                const nextCell = String(arrayData[i + 1][idx]).toLowerCase();
                if (nextCell === '2' || nextCell.includes('tháng 2') || nextCell.includes('thang 2')) {
                    monthHeaderCol = idx;
                    // Check for Total Column: look for "Tổng" or assume offset +4
                    // In Rivana: Month (1) - High (2) - Normal (3) - Low (4) - Total (5). Offset = 4.
                    mainTotalCol = idx + 4;
                    break;
                }
            }
        }
    }

    if (monthHeaderCol !== -1) {
        for (let m = 0; m < 12; m++) {
            let monthRow = -1;
            // Scan down from header row to find specific month
            for (let r = 0; r < 100; r++) {
                const cell = String(arrayData[r]?.[monthHeaderCol] || '').toLowerCase();
                // Match "tháng X" or just "X"
                if (cell.includes(`tháng ${m + 1}`) || cell === `${m + 1}`) { monthRow = r; break; }
            }

            if (monthRow !== -1) {
                const val1 = parseFloat(arrayData[monthRow][monthHeaderCol + 1]) || 0; // High
                const val2 = parseFloat(arrayData[monthRow][monthHeaderCol + 2]) || 0; // Normal
                const val3 = parseFloat(arrayData[monthRow][monthHeaderCol + 3]) || 0; // Low
                let valTotal = parseFloat(arrayData[monthRow][mainTotalCol]) || 0;

                // Fallback: If Total is 0, check next column (So sanh - Rivana specific fallback)
                // Rivana file: Col 6 (idx + 5) has data when Col 5 is 0
                if (valTotal === 0) {
                    valTotal = parseFloat(arrayData[monthRow][mainTotalCol + 1]) || 0;
                }

                // Validation: if sum of components matches total, prefer total
                if (Math.abs(val1 + val2 + val3 - valTotal) < 10 && valTotal > 0) monthlyTotals[m] = valTotal;
                else monthlyTotals[m] = Math.max(valTotal, val1 + val2 + val3);
            }
        }
    }

    const year = new Date().getFullYear();
    const fullYearData = [];

    for (let m = 0; m < 12; m++) {
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        const totalEnergyTarget = monthlyTotals[m];
        let monthBaselineProfile = [];
        let monthBaselineSum = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, m, d);
            const dayOfWeek = date.getDay();
            let dayProfile = profiles.WKD;
            if (dayOfWeek === 6) dayProfile = profiles.SAT;
            else if (dayOfWeek === 0) dayProfile = profiles.SUN;

            monthBaselineProfile.push(...dayProfile);
            monthBaselineSum += dayProfile.reduce((a, b) => a + b, 0);
        }

        let scaleFactor = 1;
        if (totalEnergyTarget > 0 && monthBaselineSum > 0) {
            scaleFactor = totalEnergyTarget / monthBaselineSum;
        }

        // Scale factor adjustment: 
        // User feedback: "Hundreds of thousands is wrong". Reverting scaling.
        const UNIT_SCALE = 1;

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, m, d);
            const dayOfWeek = date.getDay();
            let dayProfile = profiles.WKD;
            if (dayOfWeek === 6) dayProfile = profiles.SAT;
            else if (dayOfWeek === 0) dayProfile = profiles.SUN;

            for (let h = 0; h < 24; h++) {
                fullYearData.push({
                    rawTime: `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(h).padStart(2, '0')}:00`,
                    loadKw: dayProfile[h] * scaleFactor * UNIT_SCALE,
                });
            }
        }
    }
    return fullYearData;
};
