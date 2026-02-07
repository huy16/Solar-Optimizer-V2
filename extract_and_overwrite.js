import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    // --- 1. MAPPING ---
    const projectSheet = workbook.Sheets['Project'];
    const projectData = XLSX.utils.sheet_to_json(projectSheet, { header: 1 });

    // Row 0 is header. Data starts row 1.
    const projectMapping = {};
    for (let i = 1; i < projectData.length; i++) {
        const row = projectData[i];
        if (row && row.length > 3) {
            const facType = row[2]; // "Loại hình..."
            const profType = row[3]; // "Load Profile Type"
            if (facType && profType) {
                // Determine normalized key (trim spaces)
                const key = facType.toString().trim();
                const target = profType.toString().trim();
                projectMapping[key] = target;
            }
        }
    }

    console.log(`Mapped ${Object.keys(projectMapping).length} facility types.`);

    // --- 2. DATA EXTRACTION ---
    const profileSheet = workbook.Sheets['Load Profile'];
    const profileDataRows = XLSX.utils.sheet_to_json(profileSheet, { header: 1 });

    if (profileDataRows.length < 3) throw new Error("Profile sheet too short");

    const headers = profileDataRows[1]; // Row 1 is header

    // Map header name -> column index
    const headerMap = {};
    headers.forEach((h, idx) => {
        if (h) headerMap[h.toString().trim()] = idx;
    });

    // Hourly Data Rows: from index 2 to 26 (24 hours) - NO, let's verify row count.
    // The previous debug showed "1900 01 00 00 00" -> this is likely Excel time format for hours.
    // We assume 24 rows of data representing 0h to 23h.
    // Row 2 is 0h, Row 25 is 23h. Row 26 is... ?
    // Let's take rows 2 to 25 (24 rows).
    const dataRows = profileDataRows.slice(2, 26);

    if (dataRows.length !== 24) console.warn(`Warning: Found ${dataRows.length} data rows, expected 24.`);

    const FINAL_PROFILES = {};

    // For each Facility Type in our mapping...
    Object.keys(projectMapping).forEach(facType => {
        const targetProf = projectMapping[facType];
        const colIdx = headerMap[targetProf];

        if (colIdx !== undefined) {
            const hourlyValues = dataRows.map(row => {
                const val = row[colIdx];
                return typeof val === 'number' ? val : 0;
            });

            // Normalize sum to 1?
            // Existing logic uses weights.
            const sum = hourlyValues.reduce((a, b) => a + b, 0);

            if (sum === 0) {
                console.warn(`Profile ${facType} -> ${targetProf} has ZERO sum.`);
                FINAL_PROFILES[facType] = hourlyValues; // fallback
            } else {
                // Round to 4 decimal places for cleanliness
                FINAL_PROFILES[facType] = hourlyValues.map(v => Number((v / sum).toFixed(5)));
            }
        } else {
            console.warn(`Missing column for profile: "${targetProf}" (used by "${facType}")`);
        }
    });

    console.log(`Generated ${Object.keys(FINAL_PROFILES).length} profiles.`);

    // --- 3. OUTPUT ---
    const content = `export const LOAD_PROFILES = ${JSON.stringify(FINAL_PROFILES, null, 4)};`;
    fs.writeFileSync('d:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/solar-optimizer/src/utils/loadProfileGenerator.js', content, 'utf8');
    console.log("Successfully overwrote loadProfileGenerator.js");

} catch (e) {
    console.error("FATAL ERROR:", e);
}
