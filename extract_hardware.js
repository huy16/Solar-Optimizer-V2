import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const filePath = 'd:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\Tool V2\\SOLAR CALCULATION TOOL_V2.xlsm';
const outputPath = './src/data/hardware_db.json';

try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets['DATA EQUIP'];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const inverters = [];
    const panels = [];
    const seenInv = new Set();
    const seenPanel = new Set();

    data.forEach(row => {
        if (!row || row.length < 10) return;

        // Try extracting Panel from Col 2 (C)
        const panelModel = row[2];
        if (typeof panelModel === 'string' && panelModel.includes('W') && !seenPanel.has(panelModel)) {
            panels.push({
                model: panelModel,
                // Maybe Power is next col?
                power: typeof row[3] === 'number' ? row[3] : 550 // Default or extract
            });
            seenPanel.add(panelModel);
        }

        // Try extracting Inverter from Col 5 (F)
        const invModel = row[5];
        if (typeof invModel === 'string' && (invModel.includes('SUN2000') || invModel.includes('KTL')) && !seenInv.has(invModel)) {
            // Power might be Col 6?
            // From previous output: "SUN2000-8K-MAP0", 8 (kW), 1100 (Voc?)...
            const powerKw = typeof row[6] === 'number' ? row[6] : 0;
            inverters.push({
                model: invModel,
                power_kw: powerKw,
                specs: {
                    max_input_voltage: row[7],
                    // guessing other cols
                }
            });
            seenInv.add(invModel);
        }
    });

    const db = { inverters, panels };
    console.log(`Extracted ${inverters.length} inverters and ${panels.length} panels.`);
    fs.writeFileSync(outputPath, JSON.stringify(db, null, 2));

} catch (e) {
    console.error("Error:", e);
}
