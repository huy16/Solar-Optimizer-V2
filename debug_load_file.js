
const XLSX = require('xlsx');
const fs = require('fs');

const filePath = "D:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\1. Database\\2. Load Data Analysis\\SUB_519_Bieu do phu tai_Them thoi gian lam viec.xlsx";

try {
    console.log(`Reading file: ${filePath}`);
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log("\n--- First 20 rows of Raw Data ---");
    data.slice(0, 20).forEach((row, index) => {
        console.log(`Row ${index}:`, row);
    });

    // Check for large numbers
    console.log("\n--- Scanning for Large Values (> 10,000) ---");
    let largeCount = 0;
    for (let i = 0; i < Math.min(data.length, 100); i++) {
        const row = data[i];
        row.forEach(cell => {
            const val = parseFloat(cell);
            if (!isNaN(val) && val > 10000) {
                console.log(`Found large value at Row ${i}: ${val}`);
                largeCount++;
            }
        });
        if (largeCount > 5) break;
    }

} catch (error) {
    console.error("Error reading file:", error.message);
}
