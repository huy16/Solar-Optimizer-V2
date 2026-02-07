import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

const DEFAULT_MAPPING = {
    // Prefix -> Fallback Profile Key
    "san xuat": "san xuat - phu tai deu",
    "kinh doanh": "kinh doanh - dinh ban ngay",
    "cscc": "sinh hoat - phu tai ngay", // Public/Apartment -> Residential?
    "bvntmgth": "benh vien", // Hospital
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

        const facilityType = row[2]; // e.g. "San Xuat_Welding Rod (Sovigaz)"
        if (!facilityType) continue;

        const facKey = facilityType.toString();
        const facLower = facKey.toLowerCase();

        let targetColIdx = undefined;
        let matchMethod = "none";

        // Strategy 1: Parens Match
        const match = facKey.match(/\(([^)]+)\)/);
        if (match) {
            const specificKey = match[1].trim().toLowerCase();
            if (headerMap[specificKey] !== undefined) {
                targetColIdx = headerMap[specificKey];
                matchMethod = "specific";
            }
        }

        // Strategy 2: Fallback by Prefix
        if (targetColIdx === undefined) {
            for (const [prefix, fallbackKey] of Object.entries(DEFAULT_MAPPING)) {
                if (facLower.startsWith(prefix)) {
                    targetColIdx = headerMap[fallbackKey];
                    matchMethod = `fallback (${fallbackKey})`;
                    break;
                }
            }
        }

        // Extract Data
        if (targetColIdx !== undefined) {
            const hourlyData = [];
            for (let r = 2; r < 26; r++) {
                const val = profileDataRows[r] ? profileDataRows[r][targetColIdx] : 0;
                hourlyData.push(typeof val === 'number' ? val : 0);
            }

            let sum = hourlyData.reduce((a, b) => a + b, 0);
            if (sum === 0) {
                // Zero Check
                FINAL_PROFILES[facKey] = Array(24).fill(1 / 24);
            } else {
                FINAL_PROFILES[facKey] = hourlyData.map(v => Number((v / sum).toFixed(5)));
            }
            mappedCount++;
            // console.log(`Mapped "${facKey}" via ${matchMethod}`);
        } else {
            // console.warn(`FAILED to map "${facKey}"`);
            // Last resort: flat load
            FINAL_PROFILES[facKey] = Array(24).fill(1 / 24);
        }
    }

    console.log(`Mapped/Generated ${Object.keys(FINAL_PROFILES).length} profiles.`);

    const content = `export const LOAD_PROFILES = ${JSON.stringify(FINAL_PROFILES, null, 4)};`;
    fs.writeFileSync('d:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/solar-optimizer/src/utils/loadProfileGenerator.js', content, 'utf8');
    console.log("Done.");

} catch (e) { console.error(e); }
