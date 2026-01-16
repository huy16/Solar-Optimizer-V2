import { generateSolarProfile } from './utils';

export const parseGSAMapData = (workbook) => {
    const mapSheet = workbook.Sheets['Map data']; if (!mapSheet) return null;
    const jsonData = window.XLSX.utils.sheet_to_json(mapSheet, { header: 1 });
    const metadata = {};
    jsonData.forEach(row => {
        if (row.length >= 2) {
            const key = String(row[0]).trim().toLowerCase(); const val = row[1];
            if (key.includes('site name')) metadata['siteName'] = val;
            else if (key === 'latitude' || key.includes('lat')) metadata['lat'] = val;
            else if (key === 'longitude' || key.includes('long') || key.includes('lon')) metadata['lon'] = val;
            else if (key.includes('elevation')) metadata['elevation'] = val;
        }
    });
    return metadata;
};

export const parseGSAExcel = (input) => {
    const logs = [];
    const log = (msg) => logs.push(msg);
    log(`Starting parseGSAExcel...`);

    // Normalize input: If it's a single sheet (array of rows), wrap it.
    let data = [];
    if (Array.isArray(input) && Array.isArray(input[0]) && !input[0].data) {
        data = input;
    } else if (Array.isArray(input) && input[0].data) {
        // Handled by caller extracting data? OR input is sheet data?
        // The code in dataParsers.js was confusing about input. 
        // Line 72: checking sheets.
        // Line 92: loop `i < data.length`. `data` variable used but undefined in scope in dataParsers.js snippet?
        // WAIT. In dataParsers.js line 92: `for (let i = 0; i < data.length - 24; i++)`. `data` is NOT defined in `parseGSAExcel` function body in lines 66-296 of dataParsers.js.
        // It seems `dataParsers.js` had a bug or assumed `data` was `sheets[0].data`?
        // Let's look at lines 73-77 of dataParsers.js:
        // if (Array.isArray(input) && Array.isArray(input[0])...) sheets = ...
        // But line 92 uses `data`.
        // Most likely `data` should be `input` (if input is array of arrays).
        // In SolarOptimizer.jsx usage (line 685): `jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1... })`.
        // `jsonData` is Array of Arrays.
        // So `input` is `jsonData` (Matrix).
        data = input;
    } else {
        log("Invalid input format.");
        return { profiles: [], logs };
    }

    let candidates = [];
    const PRIORITIES = {
        'specific photovoltaic power output': 1, 'pvout': 1,
        'global tilted irradiation': 2, 'gti': 2, 'poa': 2,
        'global horizontal irradiation': 3, 'ghi': 3,
        'direct normal irradiation': 5, 'dni': 5
    };

    // Scan entire file for all valid tables
    // GSA Matrix usually has Month Names as headers (Jan, Feb...) and Hours as Rows
    for (let i = 0; i < data.length - 24; i++) {
        const row = data[i]; if (!Array.isArray(row)) continue;
        const rowStr = row.map(c => String(c).toLowerCase().trim());

        // Find Jan and Feb to detect a header row
        const janIdx = rowStr.findIndex(c => c === 'jan' || c === 'january' || c === '1' || c === 'tháng 1' || c === 'th1');
        const febIdx = rowStr.findIndex(c => c === 'feb' || c === 'february' || c === '2' || c === 'tháng 2' || c === 'th2');

        if (janIdx !== -1 && febIdx !== -1 && febIdx > janIdx) {
            // Found a potential header. Validate data rows below.
            let validDataRows = 0;
            for (let h = 1; h <= 24; h++) {
                const dRow = data[i + h];
                if (dRow && !isNaN(parseFloat(dRow[janIdx]))) validDataRows++;
            }

            if (validDataRows < 12) continue; // Expect at least 12-24 rows of data

            // Attempt to find a Title for this block by looking upwards
            let title = 'Unknown Data Block';
            let score = 99;
            for (let off = 1; off <= 15; off++) {
                if (i - off < 0) break;
                const titleRow = data[i - off];
                if (Array.isArray(titleRow)) {
                    const tStr = titleRow.join(' ').toLowerCase();
                    for (const [key, pScore] of Object.entries(PRIORITIES)) {
                        if (tStr.includes(key)) { title = key; score = pScore; }
                    }
                }
            }
            // Add to candidates list
            log(`Found candidate at Row ${i}, Col ${janIdx} (${title}, Score: ${score})`);
            candidates.push({ rowIdx: i, colIdx: janIdx, score, title });
        }
    }

    if (candidates.length === 0) {
        log("No candidates found via Header Search. Attempting Brute Force Matrix Scan...");
        // Fallback: Scan for ANY block of 12x24 numbers
        for (let i = 0; i < data.length - 24; i++) {
            const row = data[i]; if (!Array.isArray(row)) continue;
            // Check if we can find 12 sequential numbers in this row
            for (let c = 0; c < row.length - 11; c++) {
                // Check if this cell and next 11 are numbers
                let isRowValid = true;
                for (let k = 0; k < 12; k++) {
                    // Robust check: Handle numbers, strings with commas
                    let val = row[c + k];
                    if (typeof val === 'string') val = val.replace(',', '.');
                    if (val === null || val === undefined || val === '' || isNaN(parseFloat(val))) { isRowValid = false; break; }
                }
                if (isRowValid) {
                    // Check strict depth: 24 rows deep must be numbers
                    let isBlockValid = true;
                    for (let r = 1; r < 24; r++) {
                        const nextRow = data[i + r];
                        if (!nextRow) { isBlockValid = false; break; }
                        let val = nextRow[c];
                        if (typeof val === 'string') val = val.replace(',', '.');
                        if (val === null || val === undefined || val === '' || isNaN(parseFloat(val))) { isBlockValid = false; break; }
                    }

                    if (isBlockValid) {
                        log(`Found Brute Force Candidate at Row ${i}, Col ${c}`);
                        candidates.push({ rowIdx: i - 1, colIdx: c, score: 999, title: 'Unknown Matrix (Brute Force)' });
                        // Skip ahead to avoid overlapping candidates
                        i += 24;
                        break;
                    }
                }
            }
        }
    }

    // NEW: Check for Transposed Matrix (24 Columns x 12 Rows)
    // Common in some reports: Months are Rows, Hours are Columns (0..23)
    if (candidates.length === 0) {
        log("Attempting Brute Force TRANSPOSED Matrix Scan (24 Cols x 12 Rows)...");
        for (let i = 0; i < data.length - 12; i++) {
            const row = data[i]; if (!Array.isArray(row)) continue;
            // Need 24 sequential numbers
            for (let c = 0; c < row.length - 23; c++) {
                // Check if valid row (24 nums)
                let isRowValid = true;
                for (let k = 0; k < 24; k++) {
                    let val = row[c + k];
                    if (typeof val === 'string') val = val.replace(',', '.');
                    if (isNaN(parseFloat(val))) { isRowValid = false; break; }
                }

                if (isRowValid) {
                    // Check depth (12 rows)
                    let isBlockValid = true;
                    for (let r = 1; r < 12; r++) {
                        const nextRow = data[i + r];
                        if (!nextRow) { isBlockValid = false; break; }
                        // Check 24 cols in next row
                        for (let k = 0; k < 24; k++) {
                            let val = nextRow[c + k];
                            if (typeof val === 'string') val = val.replace(',', '.');
                            if (isNaN(parseFloat(val))) { isBlockValid = false; break; }
                        }
                        if (!isBlockValid) break;
                    }

                    if (isBlockValid) {
                        log(`Found Transposed Candidate at Row ${i}, Col ${c}`);
                        candidates.push({ rowIdx: i - 1, colIdx: c, score: 999, title: 'Transposed Matrix (24x12)', isTransposed: true });
                        i += 12; break;
                    }
                }
            }
        }
    }

    if (candidates.length === 0) {
        log("No candidates found via Matrix Scan. Attempting Monthly Summary Search...");

        // Strategy: Look for "Month" column and 12 rows of Jan-Dec
        // look for "PVOUT", "GHI" headers
        let headerRowIdx = -1;
        let pvoutCol = -1;
        let ghiCol = -1;

        for (let i = 0; i < Math.min(data.length, 50); i++) {
            const row = data[i]; if (!Array.isArray(row)) continue;
            const rStr = row.map(c => String(c).toLowerCase());

            rStr.forEach((val, idx) => {
                if (val.includes('pvout')) pvoutCol = idx;
                if (val.includes('ghi') && !val.includes('ghi_')) ghiCol = idx; // avoid ghi_flag etc
            });

            if (pvoutCol !== -1 || ghiCol !== -1) {
                // Check if we have Jan/Feb below
                const nextRow = data[i + 1];
                if (nextRow) {
                    const nStr = nextRow.map(c => String(c).toLowerCase());
                    if (nStr.some(s => s === 'jan' || s === '1' || s.includes('tháng 1'))) {
                        headerRowIdx = i;
                        break;
                    }
                }
            }
        }

        if (headerRowIdx !== -1 && (pvoutCol !== -1 || ghiCol !== -1)) {
            const extractedValues = [];
            const colToUse = pvoutCol !== -1 ? pvoutCol : ghiCol;
            const title = pvoutCol !== -1 ? 'PVOUT (Theo tháng)' : 'GHI (Theo tháng)';

            // Extract 12 months
            for (let m = 0; m < 12; m++) {
                const row = data[headerRowIdx + 1 + m];
                if (row) {
                    const val = parseFloat(row[colToUse]);
                    extractedValues.push(isNaN(val) ? 0 : val);
                } else extractedValues.push(0);
            }

            log(`Found Monthly Data (${title}): ${extractedValues.join(', ')}`);
            // Generate synthetic
            // generateSyntheticProfile returns [{ map, source, title, score, meta }]
            const synth = generateSolarProfile(extractedValues, {}, `GSA Monthly (${title})`);
            if (synth.length > 0) {
                return { profiles: synth, logs };
            }
        }

        log("Parse Failed: No valid Matrix or Monthly Summary found.");
        return { profiles: [], logs };
    }

    if (candidates.length === 0) {
        return { profiles: [], logs };
    }

    // Parse ALL candidates
    const parsedProfiles = candidates.map(cand => {
        // Special cleanup for strings
        // ...

        if (cand.isTransposed) {
            const monthlyProfiles = [];
            for (let m = 0; m < 12; m++) monthlyProfiles.push([]);
            // Handle Transposed: 12 Rows (Months), 24 Columns (Hours)
            for (let m = 0; m < 12; m++) {
                const row = data[cand.rowIdx + 1 + m];
                if (!row) break;
                for (let h = 0; h < 24; h++) {
                    let val = row[cand.colIdx + h];
                    if (typeof val === 'string') val = val.replace(',', '.');
                    val = parseFloat(val);
                    monthlyProfiles[m][h] = isNaN(val) ? 0 : val;
                }
            }

            // Compact Storage: Use MONTHLY keys instead of duplicating for 365 days
            const solarMap = new Map();
            for (let m = 0; m < 12; m++) {
                for (let h = 0; h < 24; h++) {
                    const val = monthlyProfiles[m][h];
                    // Store generic key: MONTHLY-Method
                    solarMap.set(`MONTHLY-${m}-${h}`, val);
                }
            }

            // Check Scale
            let sum = 0; let count = 0;
            solarMap.forEach(v => { sum += v; count++; });
            if (count > 0 && (sum / count) > 100) {
                const avg = sum / count;
                log(`Detected High Values (Transposed Avg: ${avg.toFixed(1)}). Auto-scaling / 1000.`);
                solarMap.forEach((v, k) => solarMap.set(k, v / 1000));
            }

            return { map: solarMap, source: 'GSA Transposed', title: cand.title, score: 900 }; // Better score
        }

        // Standard Parsing (for BOTH headers/keywords and brute force score=999)
        {
            const monthlyProfiles = [];
            for (let m = 0; m < 12; m++) monthlyProfiles.push([]);

            // Standard: 24 Rows (Hours), 12 Columns (Months)
            for (let h = 0; h < 24; h++) {
                const row = data[cand.rowIdx + 1 + h];
                if (!row) break;
                for (let m = 0; m < 12; m++) {
                    let val = row[cand.colIdx + m];
                    if (typeof val === 'string') val = val.replace(',', '.');
                    val = parseFloat(val);
                    monthlyProfiles[m].push(isNaN(val) ? 0 : val);
                }
            }

            // Compact Storage: Use MONTHLY keys instead of duplicating for 365 days
            const solarMap = new Map();
            for (let m = 0; m < 12; m++) {
                for (let h = 0; h < 24; h++) {
                    // Check for valid profile data, handle jagged array just in case
                    const val = (monthlyProfiles[m] && monthlyProfiles[m][h]) || 0;
                    // Store generic key: MONTHLY-Method
                    solarMap.set(`MONTHLY-${m}-${h}`, val);
                }
            }

            // Check Scale for standard parsed profiles too
            let sum = 0; let count = 0;
            solarMap.forEach(v => { sum += v; count++; });
            if (count > 0 && (sum / count) > 100) {
                const avg = sum / count;
                log(`Detected High Values (Standard Avg: ${avg.toFixed(1)}). Auto-scaling / 1000.`);
                solarMap.forEach((v, k) => solarMap.set(k, v / 1000));
            }

            let displayTitle = cand.title.toUpperCase();
            if (cand.title.includes('pvout')) displayTitle = 'PVOUT (Sản lượng điện)';
            else if (cand.title.includes('ghi')) displayTitle = 'GHI (Bức xạ ngang)';
            else if (cand.title.includes('gti')) displayTitle = 'GTI (Bức xạ nghiêng)';
            else if (cand.title.includes('dni')) displayTitle = 'DNI (Bức xạ trực tiếp)';

            return { map: solarMap, source: `GSA Excel (${cand.name || 'Sheet'})`, title: displayTitle, score: cand.score };
        }
        return null;
    });

    // Sort by score (lower is better) and return
    const sorted = parsedProfiles.filter(p => p !== null).sort((a, b) => a.score - b.score);
    log(`Parsed ${sorted.length} profiles successfully.`);
    return { profiles: sorted, logs };
};
