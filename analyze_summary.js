import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    console.log(`File: Summary_Load Profile.xlsx`);
    console.log(`Sheet Names: ${workbook.SheetNames.join(', ')}`);

    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n--- Sheet: ${sheetName} ---`);
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Array of arrays

        // Print first 10 rows
        data.slice(0, 10).forEach((row, i) => {
            console.log(`Row ${i}: ${JSON.stringify(row)}`);
        });
    });

} catch (e) {
    console.error("Error reading file:", e.message);
}
