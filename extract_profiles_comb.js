
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = "D:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/Tool V2/Summary_Load Profile.xlsx";

try {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });

    // 1. Read Project Sheet for Mappings
    const projectSheet = workbook.Sheets['Project'];
    const projects = XLSX.utils.sheet_to_json(projectSheet);

    // Create Profile Map: "San Xuat_Steel Fac (VAS)" -> "San Xuat_24/24" (or similar)
    const projectMap = {}; // { "Facility Name": "Generic Type" }
    projects.forEach(p => {
        const name = p['Loại hình cơ sở sử dụng điện'] || p['Loai hinh co so su dung dien'];
        const type = p['Load Profile Type'] || p['Load Profile Chart'];
        if (name && type) {
            projectMap[name] = type;
        }
    });

    // 2. Read Load Profile Sheet
    const profileSheet = workbook.Sheets['Load Profile'];
    const data = XLSX.utils.sheet_to_json(profileSheet, { header: 1 });

    // --- Extract Block 1 (Generic Profiles) ---
    // Headers at Row 1 (Index 1)
    const block1Headers = data[1];
    const block1Rows = data.slice(2, 187); // Approx range
    const genericProfiles = {};

    // Process Block 1
    if (block1Headers && block1Rows.length > 0) {
        block1Headers.forEach((h, colIdx) => {
            if (!h || colIdx === 0) return;
            const vals = block1Rows.map(r => Number(r[colIdx]) || 0);

            // Normalize sum to 1
            const sum = vals.reduce((a, b) => a + b, 0);
            if (sum > 0) {
                // Average 168h -> 24h
                const avgDaily = new Array(24).fill(0);
                const days = Math.floor(vals.length / 24);
                for (let d = 0; d < days; d++) {
                    for (let h = 0; h < 24; h++) avgDaily[h] += vals[d * 24 + h];
                }
                const daily = avgDaily.map(v => v / days);

                // Normalize
                const dSum = daily.reduce((a, b) => a + b, 0);
                if (dSum > 0) {
                    genericProfiles[h] = daily.map(v => v / dSum);
                }
            }
        });
    }

    // --- Extract Block 2 (Specific Profiles) ---
    // Headers at Row 188
    const block2Headers = data[188];
    const block2Rows = data.slice(189);
    const specificProfiles = {};

    if (block2Headers && block2Rows.length > 0) {
        block2Headers.forEach((h, colIdx) => {
            if (!h || colIdx === 0) return;
            const vals = block2Rows.map(r => Number(r[colIdx]) || 0);

            // 48h -> 24h Average
            if (vals.length >= 24) {
                const daily = new Array(24).fill(0);
                const days = Math.floor(vals.length / 24); // Usually 2
                for (let d = 0; d < days; d++) {
                    for (let i = 0; i < 24; i++) daily[i] += vals[d * 24 + i];
                }
                // Average
                const avgDaily = daily.map(v => v / days);

                const sum = avgDaily.reduce((a, b) => a + b, 0);
                if (sum > 0) {
                    specificProfiles[h] = avgDaily.map(v => v / sum);
                } else {
                    specificProfiles[h] = null; // Mark as empty
                }
            }
        });
    }

    // 3. Merge & Fallback
    const finalProfiles = {};

    // Correct Strategy: Use Block 2 Headers as the definitive list of names we want to generate
    const targetNames = [];
    if (block2Headers) {
        block2Headers.forEach((h, i) => {
            if (i > 0 && h && !h.startsWith('Column')) targetNames.push(h);
        });
    }

    // Also include any from Project Map that we missed? 
    // Maybe not, to avoid clutter. Let's stick to the specific headers found in the file.

    console.log(`Target Names found in Block 2: ${targetNames.length}`);

    targetNames.forEach(name => {
        let profile = specificProfiles[name];

        // If profile is null/empty, or if we want to force fallback for zeros
        let isSpecificDataValid = profile && profile.some(v => v > 0);

        if (!isSpecificDataValid) {
            // Specific data is empty/null, try fallback via generic mapping

            // We need to find this 'name' in the projectMap
            // projectMap keys are "Loại hình..." names. 
            // 'name' from Block 2 should match 'Loại hình...'? 
            // In Step 962, 'Loại hình...' values were exactly these strings.

            let genericType = projectMap[name];

            // Fuzzy search in projectMap keys if direct match fails
            if (!genericType) {
                const pKey = Object.keys(projectMap).find(k => k && (name.includes(k) || k.includes(name)));
                if (pKey) genericType = projectMap[pKey];
            }

            // 1. Try exact match generic profile name
            let fallbackData = genericProfiles[genericType];

            // 2. Try partial match in generic profiles
            if (!fallbackData && genericType) {
                const key = Object.keys(genericProfiles).find(k => k.includes(genericType) || genericType.includes(k));
                if (key) fallbackData = genericProfiles[key];
            }

            // 3. Manual Mapping for Common Codes
            if (!fallbackData && genericType) {
                if (genericType === "San Xuat_24/24" || genericType.includes("24/24")) fallbackData = genericProfiles["San xuat - 3 Dinh"];
                else if (genericType === "San Xuat_2 Ca" || genericType.includes("2 Ca")) fallbackData = genericProfiles["San xuat - 2 Dinh"];
                else if (genericType === "San Xuat_1 Ca" || genericType.includes("1 Ca")) fallbackData = genericProfiles["San xuat - Phu tai deu"];
                else if (genericType === "Kinh doanh" || genericType.includes("Kinh doanh")) fallbackData = genericProfiles["Kinh doanh - Dinh ban ngay"];
                else if (genericType === "Hộ gia đình" || genericType.includes("Hộ gia đình")) fallbackData = genericProfiles["Sinh hoat - Ngay va Dem"];
                else if (genericType === "Kho Lạnh" || genericType.includes("Kho Lạnh")) fallbackData = genericProfiles["San xuat - Phu tai deu"];
            }

            if (fallbackData) {
                profile = fallbackData;
                // console.log(`Fallback for '${name}': Used generic '${genericType}'`);
            } else {
                // Determine missing data strategy
                // Last ditch: Heuristic based on name itself
                if (name.includes("3 Dinh") || name.includes("24/24")) profile = genericProfiles["San xuat - 3 Dinh"];
                else if (name.includes("2 Ca")) profile = genericProfiles["San xuat - 2 Dinh"];
                else if (name.includes("Kinh Doanh") || name.includes("Office")) profile = genericProfiles["Kinh doanh - Dinh ban ngay"];
                else {
                    // Default flat profile = 1/24
                    profile = new Array(24).fill(1 / 24);
                }
                // console.log(`Fallback for '${name}': Failed, used Default/Heuristic.`);
            }
        }

        // Final normalization to be safe
        const sum = profile.reduce((a, b) => a + b, 0);
        if (sum > 0) profile = profile.map(v => v / sum);

        // Add to final list
        finalProfiles[name] = profile;
    });

    const content = "export const LOAD_PROFILES = " + JSON.stringify(finalProfiles, null, 4) + ";";
    fs.writeFileSync("d:/TOOL GOOGLE ANTIGRAVITY/2. Tool Tính toán công suất/solar-optimizer/src/utils/loadProfilesData.js", content);
    console.log("Written to src/utils/loadProfilesData.js");
    console.log(`Generated ${Object.keys(finalProfiles).length} profiles.`);

} catch (e) {
    console.error("Error:", e.message);
}
