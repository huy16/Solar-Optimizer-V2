import XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'D:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\Tool V2\\WATAKYU\\WATAKYU LOAD PROFILE (10-2024 TO 10-2025).xlsx';

try {
    if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        process.exit(1);
    }
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    console.log(`\n--- Inspect Sheet: ${sheetName} ---`);
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    // Print first 20 rows to visually check for headers
    data.slice(0, 20).forEach((r, i) => {
        // Filter out nulls for cleaner output
        const rowData = r ? r.map(c => c === null ? '' : c) : [];
        console.log(`Row ${i}:`, JSON.stringify(rowData.slice(0, 20)));
    });

} catch (e) {
    console.error("Error:", e.message);
}
