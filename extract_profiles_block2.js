
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheetName = 'Load Profile';

    if (workbook.Sheets[sheetName]) {
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        // Target Block 2: Headers likely at Row 188 (0-indexed)
        const headerRowIndex = 188;

        if (data.length <= headerRowIndex) {
            console.log(`Sheet has fewer rows (${data.length}) than expected header index (${headerRowIndex}).`);
            process.exit(0);
        }

        const headers = data[headerRowIndex];
        const rows = data.slice(headerRowIndex + 1);

        console.log(`Extracting from Header Row ${headerRowIndex}:`);
        console.log(`Headers found:`, headers.filter(h => h).slice(0, 5)); // Show first 5 valid headers
        console.log(`Data Rows: ${rows.length}`); // Expected 48

        const profiles = {};

        headers.forEach((h, colIdx) => {
            if (!h || h.startsWith('Column') || colIdx === 0) return;

            // Extract column data
            const values = rows.map(r => Number(r[colIdx]) || 0);

            // We expect 48h data.
            // Logic: Average the 2 days (Day 1: 0-23, Day 2: 24-47)

            if (values.length >= 24) {
                let daily;

                if (values.length >= 48) {
                    const day1 = values.slice(0, 24);
                    const day2 = values.slice(24, 48);

                    const avgDaily = new Array(24).fill(0);
                    for (let i = 0; i < 24; i++) {
                        // Handle potential undefined if row count is slightly off
                        const v1 = day1[i] || 0;
                        const v2 = day2[i] || 0;
                        avgDaily[i] = (v1 + v2) / 2;
                    }
                    daily = avgDaily;
                } else {
                    // Fallback if < 48 hours (just take what we have, up to 24)
                    daily = values.slice(0, 24);
                }

                // Normalize sum to 1
                const sum = daily.reduce((a, b) => a + b, 0);
                const normalized = sum > 0 ? daily.map(v => v / sum) : daily;

                profiles[h] = normalized;
            }
        });

        const profileCount = Object.keys(profiles).length;
        console.log(`\nGenerated ${profileCount} profiles from Block 2.`);

        if (profileCount > 0) {
            const content = "export const LOAD_PROFILES = " + JSON.stringify(profiles, null, 4) + ";";
            fs.writeFileSync("d:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/solar-optimizer/src/utils/loadProfilesData.js", content);
            console.log("Written to src/utils/loadProfilesData.js");
        } else {
            console.log("No valid profiles found in Block 2.");
        }

    } else {
        console.log(`Sheet '${sheetName}' not found.`);
    }

} catch (e) {
    console.error("Error:", e.message);
}
