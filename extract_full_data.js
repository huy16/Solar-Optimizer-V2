import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const filePath = 'd:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\Tool V2\\SOLAR CALCULATION TOOL_V2.xlsm';
const outputPath = './src/data';

if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
}

try {
    const workbook = XLSX.readFile(filePath);

    // --- 1. EXTRACT PROVINCES (DATA GSA) ---
    console.log("Extracting Provinces...");
    const gsaSheet = workbook.Sheets['DATA GSA'];
    const gsaData = XLSX.utils.sheet_to_json(gsaSheet, { header: 1 });
    // Structure: Row 0 (Headers?), Row 1 (Province Names), Row 2 (PVOUT), Row 3 (GHI)
    // Actually inspecting previous output:
    // Row 1: "An Giang", "Bà Rịa - Vũng Tàu"...
    // Row 2: "Specific Photovoltaic Power Output (PVOUT)", 3.4, 3.8, ...
    // Wait, let's look at the structure again.
    // If Row 1 has names, and Row 2 has values...
    // I need to confirm orientation. Usually columns are provinces? Or rows?
    // Let's assume Column-based based on previous "Row 2: [Title, val, val...]". 
    // Wait, let's re-read the extraction logic carefully from the previous `inspect_excel` output.
    // Row 1: ["Province", "An Giang", "Ba Ria..."] ? No.
    // Let's assume standard format: Headers in Row 0 or 1.
    // I will dump the data to JSON first to inspect structure programmatically then save.

    // Actually, I'll write a smarter extractor that maps it.
    // PREV OUTPUT: Row 1: [null, "An Giang", "Bà Rịa - Vũng Tàu", ...]
    // Row 2: ["Spec...", 1461, 1580...] (Yearly kWh/kWp?)
    // Row 3: ["GHI...", ...] 

    const provinceNames = gsaData[1].slice(1); // Skip first col
    const pvOutValues = gsaData[2].slice(1);

    const provinces = provinceNames.map((name, i) => ({
        id: name?.toLowerCase().replace(/ /g, '_').replace(/[\W_]+/g, '_'),
        name: name,
        peakSunHours: (pvOutValues[i] || 1400) / 365, // Convert Yearly Yield to Daily Peak Hours
        yield_yearly: pvOutValues[i]
    })).filter(p => p.name);

    fs.writeFileSync(path.join(outputPath, 'provinces.json'), JSON.stringify(provinces, null, 2));


    // --- 2. EXTRACT TARIFFS (DATA EVN) ---
    console.log("Extracting Tariffs...");
    // Need custom parsing logic based on Row 8-11
    const evnSheet = workbook.Sheets['DATA EVN'];
    // Hardcoded cell reading might be safer if structure is fixed
    // Let's assume we map standard cells.
    // Or just dump it for now and I will manually refine the `evn_tariffs.js` in next step if it's complex.
    // But let's try to grab the numbers.
    // Manufacturing 110kV+: C8 (Normal), D8 (Peak), E8 (Off) ? 
    // I'll scan for keywords "SX", "KD" to find rows.

    const evnRaw = XLSX.utils.sheet_to_json(evnSheet, { header: 1 });
    const tariffs = { business: [], manufacturing: [] };

    evnRaw.forEach(row => {
        if (!row || row.length < 5) return;
        const code = String(row[1] || ''); // Column B usually has code like "SX110kV"
        const name = String(row[2] || '');
        const norm = row[4]; // Col E?
        const peak = row[5];
        const off = row[6];

        // This is a guess on columns. Let's rely on my manual file for now OR 
        // write a raw dump to refine.
        // Actually, previous task I created a manual `evn_tariffs.js`. The user wants to USE the file data.
        // I will save the raw dump to analyze index.
    });
    // Saving raw for logic refinement
    fs.writeFileSync(path.join(outputPath, 'raw_evn.json'), JSON.stringify(evnRaw, null, 2));


    // --- 3. EXTRACT EQUIPMENT (DATA EQUIP) ---
    console.log("Extracting Equipment...");
    const equipSheet = workbook.Sheets['DATA EQUIP'];
    const equipData = XLSX.utils.sheet_to_json(equipSheet, { header: 1 });

    // Filter for Inverters and Panels
    const inverters = [];
    const panels = [];

    equipData.forEach(row => {
        if (!row || row.length < 2) return;
        const model = row[0];
        const power = row[1];

        // Naive classification
        if (typeof model === 'string') {
            if (model.includes('SUN2000') || model.includes('KTL')) {
                inverters.push({
                    model,
                    power_kw: power,
                    // Try to find specs...
                });
            } else if (model.includes('W') && (power > 300 && power < 800)) {
                panels.push({
                    model,
                    power_w: power
                });
            }
        }
    });

    const hardware = { inverters, panels };
    fs.writeFileSync(path.join(outputPath, 'hardware_db.json'), JSON.stringify(hardware, null, 2));

    console.log("Extraction Complete!");

} catch (e) {
    console.error("Error:", e);
}
