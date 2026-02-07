import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    // Analyze 'Project' Sheet
    const projectSheet = workbook.Sheets['Project'];
    if (projectSheet) {
        const projectData = XLSX.utils.sheet_to_json(projectSheet, { header: 1 });
        console.log("\nANALYZE: 'Project' Sheet columns:");
        if (projectData.length > 0) console.log(projectData[0]);
        console.log("Sample Projects:");
        projectData.slice(1, 6).forEach(r => console.log(r[1])); // Assuming Name is 2nd column
    }

    // Analyze 'Load Profile' Sheet headers
    const profileSheet = workbook.Sheets['Load Profile'];
    if (profileSheet) {
        const profileData = XLSX.utils.sheet_to_json(profileSheet, { header: 1 });
        console.log("\nANALYZE: 'Load Profile' Sheet headers (Profiles):");
        if (profileData.length > 0) {
            // Filter out empty or non-string headers to identify profile names
            const headers = profileData[0].filter(h => typeof h === 'string' && h.length > 0);
            console.log(headers);
        }
    }

} catch (e) {
    console.error(e);
}
