import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

const KEY_MAPPING = {
    "san xuat_24/24": "san xuat - phu tai deu",
    // Generic fallbacks/fixes
    "heating": "san xuat - phu tai deu",
};

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    // 1. Headers
    const profileSheet = workbook.Sheets['Load Profile'];
    const profileDataRows = XLSX.utils.sheet_to_json(profileSheet, { header: 1 });
    const rawHeaders = profileDataRows[1];

    const headerMap = {};
    rawHeaders.forEach((h, idx) => {
        if (h && typeof h === 'string') {
            headerMap[h.trim().toLowerCase()] = idx;
        }
    });

    // 2. Projects
    const projectSheet = workbook.Sheets['Project'];
    const projectData = XLSX.utils.sheet_to_json(projectSheet, { header: 1 });

    const FINAL_PROFILES = {};
    let mappedCount = 0;

    for (let i = 1; i < projectData.length; i++) {
        const row = projectData[i];
        if (!row || row.length < 3) continue;

        const facilityType = row[2]; // Key Name
        const explicitType = row[3]; // Hint 1

        if (!facilityType) continue;

        // Strategy 1: Explicit Type
        let targetKey = null;
        if (explicitType) {
            targetKey = explicitType.toString().trim().toLowerCase();
        }

        // Strategy 2: Extract text in parens
        if (!targetKey && typeof facilityType === 'string') {
            const match = facilityType.match(/\(([^)]+)\)/);
            if (match) {
                targetKey = match[1].trim().toLowerCase();
            }
        }

        // Manual Map Fix
        if (targetKey && KEY_MAPPING[targetKey]) {
            targetKey = KEY_MAPPING[targetKey];
        }

        // Check availability
        if (targetKey) {
            let colIdx = headerMap[targetKey];

            // Try explicit fallback if not found?
            if (colIdx === undefined) {
                // Try fuzzy? e.g. "figla" vs "figla 1"
                const partialMatch = Object.keys(headerMap).find(k => k.includes(targetKey) || targetKey.includes(k));
                if (partialMatch) colIdx = headerMap[partialMatch];
            }

            if (colIdx !== undefined) {
                const hourlyData = [];
                for (let r = 2; r < 26; r++) {
                    const val = profileDataRows[r] ? profileDataRows[r][colIdx] : 0;
                    hourlyData.push(typeof val === 'number' ? val : 0);
                }
                const sum = hourlyData.reduce((a, b) => a + b, 0);
                if (sum > 0) {
                    const normalized = hourlyData.map(v => Number((v / sum).toFixed(5)));
                    FINAL_PROFILES[facilityType.trim()] = normalized;
                    mappedCount++;
                }
            }
        }
    }

    console.log(`Mapped ${mappedCount} profiles.`);

    const content = `export const LOAD_PROFILES = ${JSON.stringify(FINAL_PROFILES, null, 4)};`;
    fs.writeFileSync('d:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/solar-optimizer/src/utils/loadProfileGenerator.js', content, 'utf8');

} catch (e) { console.error(e); }
