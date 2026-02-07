
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/SOLAR CALCULATION TOOL_V2.xlsm";

// Simplified search terms for the 14 missing profiles
const searchTerms = [
    "VAS", "Assab", "Jands", "Vinamilk", "HuynhDuc", "Watakyu",
    "ICT Vina", "Figla", "Fishy", "HI4", "Building Office",
    "VNUHCM", "Rivana", "BVTN"
];

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    console.log("Searching ALL sheets for missing profile keywords...\n");

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        console.log(`=== Sheet: ${sheetName} (${data.length} rows) ===`);

        const foundInSheet = [];

        searchTerms.forEach(term => {
            for (let row = 0; row < data.length; row++) {
                for (let col = 0; col < (data[row]?.length || 0); col++) {
                    const cell = String(data[row][col] || '');
                    if (cell.includes(term)) {
                        foundInSheet.push(`'${term}' at Row ${row}, Col ${col}: "${cell.substring(0, 50)}..."`);
                        break; // Only report first occurrence per term
                    }
                }
                if (foundInSheet.filter(f => f.includes(term)).length > 0) break;
            }
        });

        if (foundInSheet.length > 0) {
            foundInSheet.forEach(f => console.log(`  ${f}`));
        } else {
            console.log("  (No matches found)");
        }
        console.log("");
    });

} catch (e) {
    console.error("Error:", e.message);
}
