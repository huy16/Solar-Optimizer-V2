
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    const sheetName = 'Load Profile';
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`Sheet '${sheetName}' total rows: ${data.length}`);

    // Block 2 starts at index 188
    console.log("Block 2 start (headers):", data[188]?.slice(0, 5));

    // Check Row 189 + 48 = 237
    console.log("Rows around 237:");
    for (let i = 230; i < 245 && i < data.length; i++) {
        const row = data[i] || [];
        console.log(`Row ${i} | Col0: ${row[0]} | Col1: ${row[1]}`);
    }

} catch (e) {
    console.error("Error:", e.message);
}
