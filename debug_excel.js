import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    console.log("--- DEBUG PROJECT SHEET ---");
    const projectSheet = workbook.Sheets['Project'];
    const projectData = XLSX.utils.sheet_to_json(projectSheet, { header: 1 });
    // Print first 3 rows to see headers and data alignment
    projectData.slice(0, 3).forEach((r, i) => console.log(`Row ${i}:`, JSON.stringify(r)));

    console.log("\n--- DEBUG PROFILE SHEET ---");
    const profileSheet = workbook.Sheets['Load Profile'];
    const profileData = XLSX.utils.sheet_to_json(profileSheet, { header: 1 });
    // Print first 3 rows
    profileData.slice(0, 3).forEach((r, i) => console.log(`Row ${i}:`, JSON.stringify(r)));

} catch (e) {
    console.error(e);
}
