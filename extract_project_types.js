import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    const projectSheet = workbook.Sheets['Project'];
    if (projectSheet) {
        // Skip header row (row 0), start from row 1
        const projectData = XLSX.utils.sheet_to_json(projectSheet, { range: 1, header: ['stt', 'name', 'type', 'profile'] });

        // Extract unique types
        const uniqueTypes = [...new Set(projectData.map(row => row.type).filter(t => t))];

        console.log("Extracted Types:");
        console.log(JSON.stringify(uniqueTypes, null, 2));

        // Generate JS array content
        const jsContent = `export const PROJECT_TYPES = ${JSON.stringify(uniqueTypes, null, 4)};\n`;
        // We will likely save this to a file later, for now just print
    }

} catch (e) {
    console.error(e);
}
