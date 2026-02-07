import XLSX from 'xlsx';

const filePath = 'd:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\Tool V2\\SOLAR CALCULATION TOOL_V2.xlsm';

try {
    const workbook = XLSX.readFile(filePath);
    const gsaSheet = workbook.Sheets['DATA GSA'];

    if (gsaSheet) {
        console.log(`\n--- Inspect GSA Headers (Row 0-4) ---`);
        const d = XLSX.utils.sheet_to_json(gsaSheet, { header: 1 });

        d.slice(0, 5).forEach((r, i) => {
            console.log(`Row ${i} Length: ${r.length}`);
            // Print first 20 cols
            console.log(`Row ${i} Head:`, JSON.stringify(r.slice(0, 20)));
        });
    }

} catch (e) {
    console.error("Error:", e.message);
}
