
import XLSX from 'xlsx';

const filePath = 'd:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\Tool V2\\SOLAR CALCULATION TOOL_V2.xlsm';

try {
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets['DATA LOAD PROFILE'];

    // Read headers (Row 1, 0-indexed)
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const headers = [];
    for (let C = 1; C <= range.e.c; ++C) { // Skip Column 0 (HOUR)
        const cell = worksheet[XLSX.utils.encode_cell({ r: 1, c: C })];
        if (cell && cell.v) {
            headers.push({ col: C, name: cell.v });
        }
    }

    const profiles = {};

    headers.forEach(h => {
        const values = [];
        for (let R = 2; R <= 25; ++R) { // Rows 2 to 25 (00:00 to 23:00)
            const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: h.col })];
            values.push(cell ? (cell.v || 0) : 0);
        }
        // Only add if we have 24 values
        if (values.length === 24) {
            profiles[h.name] = values;
        }
    });

    console.log(JSON.stringify(profiles, null, 2));

} catch (e) {
    console.error("Error:", e.message);
}
