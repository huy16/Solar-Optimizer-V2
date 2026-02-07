
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/SOLAR CALCULATION TOOL_V2.xlsm";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    const sheetName = 'DATA LOAD PROFILE';
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`Sheet '${sheetName}' total rows: ${data.length}`);

    // Print first 30 rows of the first 5 columns to see the structure
    console.log("Structure of first 30 rows:");
    for (let i = 0; i < 30 && i < data.length; i++) {
        const row = data[i] || [];
        const hour = row[0];
        const val1 = row[1];
        const val2 = row[2];
        console.log(`Row ${i} | Hour: ${hour} | Val1: ${val1} | Val2: ${val2}`);
    }

} catch (e) {
    console.error("Error:", e.message);
}
