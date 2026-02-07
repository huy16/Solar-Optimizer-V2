
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const v2FilePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/SOLAR CALCULATION TOOL_V2.xlsm";
const outputPath = "d:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/solar-optimizer/src/utils/loadProfilesData.js";

// Missing profiles and their potential V2 column mappings
const missingToV2Map = {
    "San Xuat_Steel Fac (VAS)": "San xuat - 3 Dinh", // No direct match, use generic
    "San Xuat_Steel Fac (Assab)": "San xuat - 3 Dinh", // No direct match, use generic
    "San Xuat_Shoes Making (Jands)": "San xuat - 2 Dinh", // Assume 2-shift factory
    "San Xuat_Milk Factory (Vinamilk DN)": "Vinamilk DN", // Direct match!
    "San Xuat_Mechanical Process (HuynhDuc)": "San xuat - 3 Dinh", // Generic fallback
    "San Xuat_Laundry (Watakyu)": "San xuat - 2 Dinh", // Laundry = 2 shifts
    "San Xuat_Dentium (ICT Vina)": "San xuat - 3 Dinh", // Medical devices = 24h
    "San Xuat_Cosmetic (Figla)": "FIGLA 1", // Direct or close match!
    "San Xuat_Cold Storage (Fishy)": "San xuat - Phu tai deu", // Cold storage = 24h constant
    "Kinh Doanh_Workspace (HI4)": "Kinh doanh - Dinh ban ngay", // Office = day peak
    "Kinh Doanh_Building Office": "Kinh doanh - Dinh ban ngay", // Office = day peak
    "CSCC,CQHC_National University (VNUHCM)": "Kinh doanh - 2 Dinh", // University
    "CSCC,CQHC_Apartment (Rivana)": "CHUNG CU - RIVANA", // Direct match!
    "BVNTMGTH_Hospital (BVTN HCM)": "Benh vien" // Direct match!
};

try {
    const buf = fs.readFileSync(v2FilePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    const sheetName = 'DATA LOAD PROFILE';
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Headers at Row 1 (index 1)
    const headers = data[1];
    const dataRows = data.slice(2); // Data starts at Row 2

    // Extract ALL profiles from V2 to a temporary object
    const v2Profiles = {};

    headers.forEach((h, colIdx) => {
        if (!h || colIdx === 0 || h.startsWith('Column')) return;

        const values = dataRows.map(r => Number(r[colIdx]) || 0);

        // Average to 24h if needed (data might be 48h or 24h)
        let daily;
        if (values.length >= 48) {
            daily = new Array(24).fill(0);
            for (let i = 0; i < 24; i++) {
                daily[i] = (values[i] + (values[i + 24] || 0)) / 2;
            }
        } else {
            daily = values.slice(0, 24);
        }

        // Normalize
        const sum = daily.reduce((a, b) => a + b, 0);
        if (sum > 0) {
            v2Profiles[h] = daily.map(v => v / sum);
        }
    });

    console.log(`Extracted ${Object.keys(v2Profiles).length} profiles from V2 Tool.`);

    // Read current loadProfilesData.js and parse LOAD_PROFILES object
    const currentContent = fs.readFileSync(outputPath, 'utf8');
    const match = currentContent.match(/export const LOAD_PROFILES = (\{[\s\S]*\});/);
    let currentProfiles = {};
    if (match) {
        try {
            currentProfiles = JSON.parse(match[1]);
        } catch (e) {
            console.log("Could not parse current profiles, starting fresh.");
        }
    }

    console.log(`Current profiles count: ${Object.keys(currentProfiles).length}`);

    // Update missing profiles using V2 data
    let updatedCount = 0;
    Object.entries(missingToV2Map).forEach(([missingName, v2ColumnName]) => {
        const v2Data = v2Profiles[v2ColumnName];
        if (v2Data) {
            currentProfiles[missingName] = v2Data;
            console.log(`Updated '${missingName}' <- V2 '${v2ColumnName}'`);
            updatedCount++;
        } else {
            console.log(`FAILED to update '${missingName}': V2 column '${v2ColumnName}' not found or empty.`);
        }
    });

    console.log(`\nUpdated ${updatedCount} of 14 missing profiles.`);

    // Write updated profiles back
    const newContent = "export const LOAD_PROFILES = " + JSON.stringify(currentProfiles, null, 4) + ";";
    fs.writeFileSync(outputPath, newContent);
    console.log(`Written to ${outputPath}`);
    console.log(`Final profile count: ${Object.keys(currentProfiles).length}`);

} catch (e) {
    console.error("Error:", e.message);
}
