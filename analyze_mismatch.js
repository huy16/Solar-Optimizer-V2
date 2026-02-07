import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    // 1. Headers
    const profileSheet = workbook.Sheets['Load Profile'];
    const headers = XLSX.utils.sheet_to_json(profileSheet, { header: 1 })[1]
        .filter(h => h && typeof h === 'string')
        .map(h => h.trim().toLowerCase());

    // 2. Project Types
    const projectSheet = workbook.Sheets['Project'];
    const projectData = XLSX.utils.sheet_to_json(projectSheet, { header: 1 });
    const requestedTypes = new Set();

    for (let i = 1; i < projectData.length; i++) {
        const row = projectData[i];
        if (row && row.length > 3 && row[3]) {
            requestedTypes.add(row[3].toString().trim().toLowerCase());
        }
    }

    console.log("--- REQUESTED TYPES (from Project Sheet) ---");
    requestedTypes.forEach(t => console.log(`- ${t} ${headers.includes(t) ? "(FOUND)" : "(MISSING)"}`));

    console.log("\n--- AVAILABLE HEADERS (from Load Profile Sheet) ---");
    headers.forEach(h => console.log(`- ${h}`));

} catch (e) {
    console.error(e);
}
