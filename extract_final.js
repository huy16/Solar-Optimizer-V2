import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    // --- 1. PREP HEADERS (Load Profile) ---
    const profileSheet = workbook.Sheets['Load Profile'];
    const profileDataRows = XLSX.utils.sheet_to_json(profileSheet, { header: 1 });
    const rawHeaders = profileDataRows[1]; // Row 1

    // Create a normalized map: standardized_name -> column_index
    const headerMap = {};
    rawHeaders.forEach((h, idx) => {
        if (h && typeof h === 'string') {
            const key = h.trim().toLowerCase();
            headerMap[key] = idx;
        }
    });

    console.log("Normalized Load Profile Headers:", Object.keys(headerMap));

    // --- 2. PREP MAPPING (Project) ---
    const projectSheet = workbook.Sheets['Project'];
    const projectData = XLSX.utils.sheet_to_json(projectSheet, { header: 1 }); // Row 0 is header

    const FINAL_PROFILES = {};

    // Data rows start at index 2 (Row 2), since Row 0=Header, Row 1=First user?
    // Wait, typical sheet_to_json header:1:
    // [0] = Header
    // [1] = Data 1

    // In previous debug:
    // Row 0: ["STT", "Name...", "Loại hình...", "Load Profile Type"]
    // Row 1: ["1", "Sovigaz...", "San Xuat_Welding...", "San Xuat_24/24"]

    let mappedCount = 0;

    for (let i = 1; i < projectData.length; i++) {
        const row = projectData[i];
        if (!row || row.length < 3) continue;

        const facilityType = row[2]; // User-facing name
        const rawProfileType = row[3]; // Excel key

        if (facilityType && rawProfileType) {
            const profileKey = rawProfileType.toString().trim().toLowerCase();

            // Find data column
            const colIdx = headerMap[profileKey];

            if (colIdx !== undefined) {
                // Extract 24h data
                // Data starts at row 2 (index 2) usually?
                // Let's assume indices 2 to 25.

                const hourlyData = [];
                for (let r = 2; r < 26; r++) {
                    const val = profileDataRows[r] ? profileDataRows[r][colIdx] : 0;
                    hourlyData.push(typeof val === 'number' ? val : 0);
                }

                // Normalize to percentages (sum = 1)
                const sum = hourlyData.reduce((a, b) => a + b, 0);
                const normalized = sum > 0 ? hourlyData.map(v => Number((v / sum).toFixed(5))) : hourlyData;

                // Assign to FINAL_PROFILES with the FACILITY TYPE as key
                const facKey = facilityType.toString().trim();
                FINAL_PROFILES[facKey] = normalized;
                mappedCount++;
            } else {
                console.warn(`Profile Not Found in Headers: "${rawProfileType}" (for ${facilityType})`);
            }
        }
    }

    console.log(`Successfully mapped ${mappedCount} profiles.`);
    console.log(`Generated Keys: ${Object.keys(FINAL_PROFILES).slice(0, 5)}...`);

    // --- 3. OUTPUT ---
    const content = `export const LOAD_PROFILES = ${JSON.stringify(FINAL_PROFILES, null, 4)};`;
    fs.writeFileSync('d:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/solar-optimizer/src/utils/loadProfileGenerator.js', content, 'utf8');
    console.log("File written.");

} catch (e) {
    console.error(e);
}
