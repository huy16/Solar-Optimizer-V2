
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/SOLAR CALCULATION TOOL_V2.xlsm";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    const sheetName = 'DATA LOAD PROFILE';
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Print all headers (Row 1)
    const headers = data[1] || [];
    console.log(`Headers in '${sheetName}':`);
    headers.forEach((h, i) => console.log(`  Col ${i}: ${h}`));

    console.log(`\nTotal data rows: ${data.length - 2}`); // Exclude header rows

} catch (e) {
    console.error("Error:", e.message);
}
