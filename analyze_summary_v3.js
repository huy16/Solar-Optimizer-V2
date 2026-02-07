import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    console.log("Analyzing 'Load Profile' sheet raw data...");
    const sheet = workbook.Sheets['Load Profile'];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Dump first 5 rows fully
    for (let i = 0; i < 5; i++) {
        console.log(`Row ${i}:`, JSON.stringify(data[i]));
    }

} catch (e) {
    console.error(e);
}
