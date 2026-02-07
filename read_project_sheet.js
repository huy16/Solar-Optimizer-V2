
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheetName = 'Project'; // User's image looks like the Project sheet

    if (workbook.Sheets[sheetName]) {
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        console.log(`Scanning '${sheetName}' sheet...`);
        console.log(`Found ${data.length} rows.`);

        if (data.length > 0) {
            console.log("Headers (All Keys):", Object.keys(data[0]));

            console.log("Searching for Sovigaz row...");
            const sovigazRow = data.find(r => JSON.stringify(r).includes("Sovigaz"));
            if (sovigazRow) {
                console.log("Sovigaz Row found:");
                console.log(JSON.stringify(sovigazRow, null, 2));
            } else {
                console.log("Sovigaz row not found. Printing first row:");
                console.log(JSON.stringify(data[0], null, 2));
            }

            // Print all 'Loại hình cơ sở sử dụng điện' values
            console.log("\nAll 'Loại hình cơ sở sử dụng điện' values:");
            data.forEach(r => {
                console.log(r['Loại hình cơ sở sử dụng điện'] || r['Loai hinh co so su dung dien'] || "N/A");
            });
        }
    } else {
        console.log(`Sheet '${sheetName}' not found.`);
    }

} catch (e) {
    console.error("Error:", e.message);
}
