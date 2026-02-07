import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    const sheetName = 'Load Profile';
    if (workbook.Sheets[sheetName]) {
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        const headers = data[1]; // Row 1 is headers
        const rows = data.slice(2); // Data starts from Row 2

        console.log(`Data rows: ${rows.length}`);
        console.log("Headers found:", headers.filter(h => h && !h.startsWith('Column')));

        // Analyze timestamps (Column 0)
        console.log("First 5 Timestamps:");
        rows.slice(0, 5).forEach(r => console.log(r[0]));

        console.log("Last 5 Timestamps:");
        rows.slice(-5).forEach(r => console.log(r[0]));

        // Extract and normalize profiles
        const profiles = {};

        headers.forEach((h, colIdx) => {
            if (!h || h.startsWith('Column') || colIdx === 0) return;

            const values = rows.map(r => Number(r[colIdx]) || 0);

            // If 168 rows (7 days * 24h), we can average to 24h
            // Or just check first 24h
            if (values.length >= 24) {
                // Improved logic: Find valid days (sum > 0) and average them
                const validDays = [];
                const totalDays = Math.floor(values.length / 24);

                for (let d = 0; d < totalDays; d++) {
                    const dailySlice = values.slice(d * 24, (d + 1) * 24);
                    const dailySum = dailySlice.reduce((a, b) => a + b, 0);
                    if (dailySum > 0) {
                        validDays.push(dailySlice);
                    }
                }

                let daily;
                if (validDays.length > 0) {
                    // Average the valid days
                    const avgDaily = new Array(24).fill(0);
                    for (const day of validDays) {
                        for (let h = 0; h < 24; h++) {
                            avgDaily[h] += day[h];
                        }
                    }
                    // Divide by count of valid days
                    daily = avgDaily.map(v => v / validDays.length);
                } else {
                    // Fallback if no valid days found (should be caught by zero check later)
                    daily = values.slice(0, 24);
                }

                // Normalize sum to 1
                const sum = daily.reduce((a, b) => a + b, 0);
                const normalized = sum > 0 ? daily.map(v => v / sum) : daily;

                profiles[h] = normalized;
            }
        });

        console.log("\n--- GENERATED PROFILES ---");
        const validProfiles = {};
        Object.keys(profiles).forEach(k => {
            // Filter out all-zero profiles
            if (profiles[k].some(v => v > 0)) {
                validProfiles[k] = profiles[k];
            }
        });

        const content = "export const LOAD_PROFILES = " + JSON.stringify(validProfiles, null, 4) + ";";
        fs.writeFileSync('d:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/solar-optimizer/src/utils/loadProfilesData.js', content);
        console.log("Written to src/utils/loadProfilesData.js");

    } else {
        console.log(`Sheet '${sheetName}' not found.`);
    }

} catch (e) {
    console.error("Error:", e.message);
}
