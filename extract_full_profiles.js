import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    // 1. Get Mapping: Facility Type -> Load Profile Type
    const projectSheet = workbook.Sheets['Project'];
    // Rows: STT, Name Project, Facility Type, Load Profile Type
    // Range 1 to skip header
    const projectRaw = XLSX.utils.sheet_to_json(projectSheet, { range: 1, header: ['stt', 'name', 'facilityType', 'profileType'] });

    const typeMapping = {};
    projectRaw.forEach(row => {
        if (row.facilityType && row.profileType) {
            typeMapping[row.facilityType] = row.profileType;
        }
    });

    console.log("Mapping Found:", Object.keys(typeMapping).length, "entries");
    console.log(typeMapping);

    // 2. Get Data: Load Profile Type -> Hourly Weights
    const dataSheet = workbook.Sheets['Load Profile'];
    const dataRaw = XLSX.utils.sheet_to_json(dataSheet, { header: 1 });

    // Header row (Row 1, index 1) contains the Profile Types
    const headers = dataRaw[1];
    // Data rows (Row 2 onwards) might have time in col 0 and data in cols 1+

    const profileData = {};

    // Find column indices for each known profileType
    const profileIndices = {};
    headers.forEach((h, idx) => {
        if (h && typeof h === 'string') {
            profileIndices[h] = idx;
        }
    });

    console.log("\nAvailable Profiles in Sheet:", Object.keys(profileIndices));

    // Extract 24h data (assuming 1 hour intervals or similar)
    // We need to check the time column to see the resolution.
    // The previous analysis showed "1900 01 00 00 00", "01 00", "02 00"... which looks like hourly.

    // Let's grab the first 24 rows of data (after header)
    const timeSeriesData = dataRaw.slice(2, 26); // Rows 2 to 25?

    console.log("\nTime Series Length:", timeSeriesData.length);

    const finalLoadProfiles = {};

    Object.keys(typeMapping).forEach(facilityType => {
        const targetProfile = typeMapping[facilityType]; // e.g., "San Xuat_24/24"
        const colIdx = profileIndices[targetProfile];

        if (colIdx !== undefined) {
            // Extract column data
            const rawValues = timeSeriesData.map(row => row[colIdx]);

            // Normalize: We need weights that sum to 1, OR weights that represent hourly load relative to... something?
            // Usually Load Profile = % of Daily Consumption or % of Peak.
            // Let's create an array of numbers.
            const nums = rawValues.map(v => typeof v === 'number' ? v : 0);

            // Normalize to sum = 1 for the generator usage?
            // In loadProfileGenerator.js: weights are used. "dummyDailyTotal * w".
            // If the weights sum to 1, then sum(dummyDailyTotal * w) = dummyDailyTotal. Correct.

            const sum = nums.reduce((a, b) => a + b, 0);
            const normalized = sum > 0 ? nums.map(n => n / sum) : nums;

            finalLoadProfiles[facilityType] = normalized;
        } else {
            console.warn(`Missing data for profile type: ${targetProfile} (Facility: ${facilityType})`);
            // Fallback?
        }
    });

    console.log("\nGenerated PROFILES keys:", Object.keys(finalLoadProfiles));

    // Output format for js file
    const fileContent = `export const LOAD_PROFILES = ${JSON.stringify(finalLoadProfiles, null, 4)};`;
    // console.log(fileContent.substring(0, 500) + "...");

} catch (e) {
    console.error(e);
}
