import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    // 1. DUMP HEADERS from Load Profile
    const profileSheet = workbook.Sheets['Load Profile'];
    const profileHeaders = XLSX.utils.sheet_to_json(profileSheet, { header: 1 })[1]; // Row 1

    console.log("--- ACTUAL PROFILE HEADERS (Load Profile Sheet) ---");
    profileHeaders.forEach((h, i) => {
        if (h) console.log(`[${i}] "${h}"`);
    });

    // 2. DUMP MAPPING from Project
    const projectSheet = workbook.Sheets['Project'];
    const projectData = XLSX.utils.sheet_to_json(projectSheet, { header: 1 });

    console.log("\n--- ACTUAL MAPPING (Project Sheet) ---");
    // Skip row 0
    for (let i = 1; i < 10; i++) { // First 10 rows
        const row = projectData[i];
        if (row) {
            console.log(`[Row ${i}] Facility: "${row[2]}" -> Profile: "${row[3]}"`);
        }
    }

} catch (e) {
    console.error(e);
}
