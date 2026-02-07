
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const sheetName = 'Load Profile';

    if (workbook.Sheets[sheetName]) {
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        if (data.length < 2) {
            console.log("Sheet empty or insufficient rows.");
            process.exit(0);
        }

        const headers = data[1]; // Row 1 is headers (0-indexed)
        const rows = data.slice(2);

        console.log(`Total Rows of Data: ${rows.length}`);

        const validProfiles = [];
        const incompleteProfiles = [];

        headers.forEach((h, colIdx) => {
            if (!h || h.startsWith('Column') || colIdx === 0) return;

            // Extract column data
            const colValues = rows.map(r => Number(r[colIdx]) || 0);

            // Criteria for "sufficient data": 
            // 1. Must have at least 24 data points
            // 2. Sum must be > 0 (not all zeros)

            const hasData = colValues.some(v => v > 0);
            const dataCount = colValues.length;

            if (hasData && dataCount >= 24) {
                validProfiles.push(h);
            } else {
                if (h) incompleteProfiles.push({ name: h, reason: hasData ? 'Insufficient length' : 'All zeros' });
            }
        });

        console.log(`\nFound ${validProfiles.length} valid profiles with sufficient data:`);
        validProfiles.forEach((p, i) => console.log(`${i + 1}. ${p}`));

        if (incompleteProfiles.length > 0) {
            console.log(`\nFound ${incompleteProfiles.length} incomplete/empty profiles:`);
            incompleteProfiles.forEach(p => console.log(`- ${p.name} (${p.reason})`));
        }

    } else {
        console.log(`Sheet '${sheetName}' not found.`);
    }

} catch (e) {
    console.error("Error:", e.message);
}
