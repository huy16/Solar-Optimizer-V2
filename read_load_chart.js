
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheetName = 'Load Chart';

    if (workbook.Sheets[sheetName]) {
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        console.log(`Scanning '${sheetName}' sheet...`);
        console.log(`Total Rows: ${data.length}`);

        if (data.length > 0) {
            // Check first few rows for headers
            for (let i = 0; i < 5; i++) {
                console.log(`Row ${i}:`, JSON.stringify(data[i]));
            }

            // Check specific column names user mentioned
            const rowWithNames = data.find(r => r && r.includes && r.includes("San Xuat_Welding Rod (Sovigaz)"));
            if (rowWithNames) {
                console.log("Found row with expected names:", JSON.stringify(rowWithNames));
            } else {
                console.log("Could not find row with 'San Xuat_Welding Rod (Sovigaz)'");
            }
        }
    } else {
        console.log(`Sheet '${sheetName}' not found.`);
    }

} catch (e) {
    console.error("Error:", e.message);
}
