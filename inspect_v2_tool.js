
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/SOLAR CALCULATION TOOL_V2.xlsm";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    console.log("Sheet Names in SOLAR CALCULATION TOOL_V2.xlsm:");
    workbook.SheetNames.forEach(name => console.log(`- ${name}`));

} catch (e) {
    console.error("Error:", e.message);
}
