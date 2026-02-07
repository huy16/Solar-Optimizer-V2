
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheetName = 'Load Profile';

    if (workbook.Sheets[sheetName]) {
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        const headers = data[1]; // Row 1 is headers
        const rows = data.slice(2);

        const targets = ["FPT Complex", "Fusion Resort"];

        targets.forEach(target => {
            const colIdx = headers.indexOf(target);
            if (colIdx === -1) {
                console.log(`Column '${target}' not found.`);
                return;
            }

            console.log(`\n--- Inspecting ${target} (Col ${colIdx}) ---`);
            const values = rows.map(r => Number(r[colIdx]) || 0);

            const nonZeroCount = values.filter(v => v > 0).length;
            const zeroCount = values.length - nonZeroCount;
            const sum = values.reduce((a, b) => a + b, 0);

            console.log(`Total Rows: ${values.length}`);
            console.log(`Non-Zero Values: ${nonZeroCount}`);
            console.log(`Zero Values: ${zeroCount}`);
            console.log(`Sum: ${sum}`);

            // Show first 24
            console.log(`First 24 values:`, JSON.stringify(values.slice(0, 24)));

            // Show first 5 non-zero
            const firstNonZero = values.slice().filter(v => v > 0).slice(0, 5);
            console.log(`First 5 Non-Zero:`, JSON.stringify(firstNonZero));
        });

    } else {
        console.log(`Sheet '${sheetName}' not found.`);
    }

} catch (e) {
    console.error("Error:", e.message);
}
