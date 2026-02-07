import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

const MANUAL_MAPPING = {
    // missing_key -> existing_header
    "san xuat_24/24": "san xuat - phu tai deu",
    // Add others if needed
};

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    // --- 1. PREP HEADERS (Load Profile) ---
    const profileSheet = workbook.Sheets['Load Profile'];
    const profileDataRows = XLSX.utils.sheet_to_json(profileSheet, { header: 1 });
    const rawHeaders = profileDataRows[1]; // Row 1

    const headerMap = {};
    rawHeaders.forEach((h, idx) => {
        if (h && typeof h === 'string') {
            const key = h.trim().toLowerCase();
            headerMap[key] = idx;
        }
    });

    // --- 2. PREP MAPPING (Project) ---
    const projectSheet = workbook.Sheets['Project'];
    const projectData = XLSX.utils.sheet_to_json(projectSheet, { header: 1 });

    const FINAL_PROFILES = {};
    let mappedCount = 0;

    // Iterate Projects
    for (let i = 1; i < projectData.length; i++) {
        const row = projectData[i];
        if (!row || row.length < 3) continue;

        const facilityType = row[2]; // e.g. "San Xuat_Welding Rod (Sovigaz)"
        const rawProfileType = row[3]; // e.g. "San Xuat_24/24"

        if (facilityType && rawProfileType) {
            let profileKey = rawProfileType.toString().trim().toLowerCase();

            // Apply Manual Fix
            if (MANUAL_MAPPING[profileKey]) {
                profileKey = MANUAL_MAPPING[profileKey];
            }

            // Find data column
            const colIdx = headerMap[profileKey];

            if (colIdx !== undefined) {
                const hourlyData = [];
                // Data assumes Rows 2 to 25 (24 hours) matches 0h-23h
                for (let r = 2; r < 26; r++) {
                    const val = profileDataRows[r] ? profileDataRows[r][colIdx] : 0;
                    hourlyData.push(typeof val === 'number' ? val : 0);
                }

                // DATA CLEANUP: Some profiles (like 24/24) might be constant.
                // Normalize so Sum = 1 (to be treated as Weights)
                // OR normalize so max = 1?
                // The Tool usually expects Weights where sum(weights) * TotalDailyConsumption = HourlyLoad.
                // So sum(weights) MUST = 1.

                let sum = hourlyData.reduce((a, b) => a + b, 0);

                // Protection against Zero Sum
                if (sum === 0) {
                    // Fallback to flat load
                    const flat = Array(24).fill(1 / 24);
                    FINAL_PROFILES[facilityType] = flat;
                } else {
                    const normalized = hourlyData.map(v => Number((v / sum).toFixed(5)));
                    // Ensure sum is exactly 1 by adjusting last element?
                    // Not strictly necessary for this tool, precision is ok.
                    FINAL_PROFILES[facilityType] = normalized;
                }
                mappedCount++;
            } else {
                console.warn(`SKIP: Profile "${rawProfileType}" not found for "${facilityType}"`);
            }
        }
    }

    console.log(`Successfully mapped ${mappedCount} profiles.`);

    const content = `export const LOAD_PROFILES = ${JSON.stringify(FINAL_PROFILES, null, 4)};`;
    fs.writeFileSync('d:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/solar-optimizer/src/utils/loadProfileGenerator.js', content, 'utf8');
    console.log("File loadProfileGenerator.js updated.");

} catch (e) {
    console.error(e);
}
