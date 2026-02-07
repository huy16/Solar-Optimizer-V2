
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";
const searchString = "San Xuat_Welding Rod";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    console.log(`Searching for '${searchString}' in ${filePath}...`);

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        data.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (typeof cell === 'string' && cell.includes(searchString)) {
                    console.log(`FOUND in Sheet '${sheetName}' at Row ${rowIndex}, Col ${colIndex}: "${cell}"`);
                }
            });
        });
    });

    console.log("Search complete.");

} catch (e) {
    console.error("Error:", e.message);
}
