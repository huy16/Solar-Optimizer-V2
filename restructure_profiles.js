
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const v2FilePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/SOLAR CALCULATION TOOL_V2.xlsm";
const summaryFilePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";
const outputPath = "d:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/solar-optimizer/src/utils/loadProfilesData.js";

// 10 profiles WITHOUT real data - keep in dropdown, but set to zeros
const emptyProfiles = [
    "San Xuat_Steel Fac (VAS)",
    "San Xuat_Steel Fac (Assab)",
    "San Xuat_Shoes Making (Jands)",
    "San Xuat_Mechanical Process (HuynhDuc)",
    "San Xuat_Laundry (Watakyu)",
    "San Xuat_Dentium (ICT Vina)",
    "San Xuat_Cold Storage (Fishy)",
    "Kinh Doanh_Workspace (HI4)",
    "Kinh Doanh_Building Office",
    "CSCC,CQHC_National University (VNUHCM)"
];

// 10 generic profiles to ADD (renamed for consistency)
const genericProfilesToAdd = [
    { old: "Kinh doanh - Dinh ban dem", new: "Kinh Doanh_Dinh Ban Dem" },
    { old: "Kinh doanh - Dinh ban ngay", new: "Kinh Doanh_Dinh Ban Ngay" },
    { old: "Kinh doanh - 2 Dinh", new: "Kinh Doanh_2 Dinh" },
    { old: "San xuat - Phu tai deu", new: "San Xuat_Phu Tai Deu" },
    { old: "San xuat - 2 Dinh", new: "San Xuat_2 Dinh" },
    { old: "San xuat - 3 Dinh", new: "San Xuat_3 Dinh" },
    { old: "Sinh hoat - Phu tai ngay", new: "Sinh Hoat_Phu Tai Ngay" },
    { old: "Sinh hoat - Ngay va Dem", new: "Sinh Hoat_Ngay Va Dem" },
    { old: "Sinh hoat - Phu tai chieu toi", new: "Sinh Hoat_Phu Tai Chieu Toi" },
    { old: "Sinh hoat - Phu tai dem khuya", new: "Sinh Hoat_Phu Tai Dem Khuya" }
];

try {
    // 1. Read V2 Tool for generic profiles
    const v2Buf = fs.readFileSync(v2FilePath);
    const v2Workbook = XLSX.read(v2Buf, { type: 'buffer' });
    const v2Sheet = v2Workbook.Sheets['DATA LOAD PROFILE'];
    const v2Data = XLSX.utils.sheet_to_json(v2Sheet, { header: 1 });

    const v2Headers = v2Data[1];
    const v2Rows = v2Data.slice(2);

    // Extract generic profiles from V2
    const v2Profiles = {};
    v2Headers.forEach((h, colIdx) => {
        if (!h || colIdx === 0) return;
        const values = v2Rows.map(r => Number(r[colIdx]) || 0);

        let daily = values.slice(0, 24);
        if (values.length >= 48) {
            for (let i = 0; i < 24; i++) {
                daily[i] = (daily[i] + (values[i + 24] || 0)) / 2;
            }
        }

        const sum = daily.reduce((a, b) => a + b, 0);
        if (sum > 0) {
            v2Profiles[h] = daily.map(v => v / sum);
        }
    });

    // 2. Read Summary_Load Profile.xlsx for specific profiles (Block 2)
    const summaryBuf = fs.readFileSync(summaryFilePath);
    const summaryWorkbook = XLSX.read(summaryBuf, { type: 'buffer' });
    const summarySheet = summaryWorkbook.Sheets['Load Profile'];
    const summaryData = XLSX.utils.sheet_to_json(summarySheet, { header: 1 });

    const block2Headers = summaryData[188];
    const block2Rows = summaryData.slice(189);

    const finalProfiles = {};

    // Process ALL specific profiles from Block 2
    if (block2Headers) {
        block2Headers.forEach((h, colIdx) => {
            if (!h || colIdx === 0 || h.startsWith('Column')) return;

            const values = block2Rows.map(r => Number(r[colIdx]) || 0);

            // Average to 24h
            let daily = new Array(24).fill(0);
            const days = Math.floor(values.length / 24);
            for (let d = 0; d < days; d++) {
                for (let i = 0; i < 24; i++) daily[i] += values[d * 24 + i];
            }
            const avgDaily = daily.map(v => v / days);

            const sum = avgDaily.reduce((a, b) => a + b, 0);

            if (emptyProfiles.includes(h)) {
                // This is one of the 10 empty profiles - set to all zeros
                finalProfiles[h] = new Array(24).fill(0);
                console.log(`Empty profile (zeros): ${h}`);
            } else if (sum > 0) {
                // Has real data - normalize
                finalProfiles[h] = avgDaily.map(v => v / sum);
                console.log(`Real data: ${h}`);
            } else {
                // No data found - set to zeros
                finalProfiles[h] = new Array(24).fill(0);
                console.log(`No data found (zeros): ${h}`);
            }
        });
    }

    console.log(`\nSpecific profiles from Block 2: ${Object.keys(finalProfiles).length}`);

    // 3. Manually add the 10 empty profiles with zeros (if not already added)
    emptyProfiles.forEach(name => {
        if (!finalProfiles[name]) {
            finalProfiles[name] = new Array(24).fill(0);
            console.log(`Manually added empty: ${name}`);
        }
    });

    console.log(`After adding empty profiles: ${Object.keys(finalProfiles).length}`);

    // 4. Add generic profiles with renamed keys
    genericProfilesToAdd.forEach(item => {
        if (v2Profiles[item.old]) {
            finalProfiles[item.new] = v2Profiles[item.old];
            console.log(`Added generic: ${item.old} -> ${item.new}`);
        } else {
            console.log(`WARNING: Generic profile '${item.old}' not found in V2 Tool`);
        }
    });

    // 4. Write to file
    const content = "export const LOAD_PROFILES = " + JSON.stringify(finalProfiles, null, 4) + ";";
    fs.writeFileSync(outputPath, content);

    console.log(`\nFinal profile count: ${Object.keys(finalProfiles).length}`);
    console.log("Written to:", outputPath);

} catch (e) {
    console.error("Error:", e.message);
}
