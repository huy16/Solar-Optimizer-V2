
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/SOLAR CALCULATION TOOL_V2.xlsm";

// The 14 missing profiles we are looking for
const missingProfiles = [
    "San Xuat_Steel Fac (VAS)",
    "San Xuat_Steel Fac (Assab)",
    "San Xuat_Shoes Making (Jands)",
    "San Xuat_Milk Factory (Vinamilk DN)",
    "San Xuat_Mechanical Process (HuynhDuc)",
    "San Xuat_Laundry (Watakyu)",
    "San Xuat_Dentium (ICT Vina)",
    "San Xuat_Cosmetic (Figla)",
    "San Xuat_Cold Storage (Fishy)",
    "Kinh Doanh_Workspace (HI4)",
    "Kinh Doanh_Building Office",
    "CSCC,CQHC_National University (VNUHCM)",
    "CSCC,CQHC_Apartment (Rivana)",
    "BVNTMGTH_Hospital (BVTN HCM)"
];

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    const sheetName = 'DATA LOAD PROFILE';
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
        console.log(`Sheet '${sheetName}' not found.`);
        process.exit(1);
    }

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`Sheet '${sheetName}': ${data.length} rows`);

    // Print first 5 rows
    console.log("First 5 rows:");
    for (let i = 0; i < 5 && i < data.length; i++) {
        console.log(`Row ${i}:`, JSON.stringify(data[i]?.slice(0, 10)));
    }

    // Search for any of our missing profile names
    console.log("\nSearching for missing profiles...");
    missingProfiles.forEach(mpName => {
        // Search in all cells
        let found = false;
        for (let row = 0; row < data.length; row++) {
            for (let col = 0; col < (data[row]?.length || 0); col++) {
                const cell = data[row][col];
                if (typeof cell === 'string' && cell.includes(mpName.split('(')[1]?.replace(')', '') || mpName)) {
                    console.log(`Found '${mpName}' at Row ${row}, Col ${col}: "${cell}"`);
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
        if (!found) {
            // Try partial match (e.g., just "VAS", "Assab")
            const shortName = mpName.match(/\(([^)]+)\)/)?.[1] || mpName;
            for (let row = 0; row < data.length; row++) {
                for (let col = 0; col < (data[row]?.length || 0); col++) {
                    const cell = data[row][col];
                    if (typeof cell === 'string' && cell.includes(shortName)) {
                        console.log(`Found '${mpName}' (via '${shortName}') at Row ${row}, Col ${col}: "${cell}"`);
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
        }
        if (!found) console.log(`NOT FOUND: '${mpName}'`);
    });

} catch (e) {
    console.error("Error:", e.message);
}
