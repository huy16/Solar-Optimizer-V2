import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    // Headers
    const profileSheet = workbook.Sheets['Load Profile'];
    const headers = XLSX.utils.sheet_to_json(profileSheet, { header: 1 })[1]
        .map(h => (h && typeof h === 'string') ? h.trim().toLowerCase() : "");

    console.log("Headers available:", headers);

    // Projects
    const projectSheet = workbook.Sheets['Project'];
    const projectData = XLSX.utils.sheet_to_json(profileSheet, { header: 1 }); // WAIT: profileSheet?? COPY PASTE ERROR?

    // I used `profileSheet` instead of `projectSheet` in previous step? 
    // Let's check previous code.
    // extract_advanced.js: const projectData = XLSX.utils.sheet_to_json(projectSheet, { header: 1 }); -> Correct.

    const projectDataCorrect = XLSX.utils.sheet_to_json(projectSheet, { header: 1 });

    for (let i = 1; i < 5; i++) { // First 5 rows
        const row = projectDataCorrect[i];
        if (!row) continue;

        const facility = row[2];
        let key = "null";
        if (typeof facility === 'string') {
            const match = facility.match(/\(([^)]+)\)/);
            if (match) key = match[1].trim().toLowerCase();
        }

        console.log(`Row ${i}: Facility="${facility}" -> Key="${key}" -> HeaderMatch=${headers.includes(key)}`);
    }

} catch (e) { console.error(e); }
