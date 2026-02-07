import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const filePath = 'd:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\Tool V2\\SOLAR CALCULATION TOOL_V2.xlsm';
const outputPath = './src/data/provinces.json';

try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets['DATA GSA'];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const provinceMap = {};

    // Start scanning from Row 2 (Row 0=Title, Row 1=Header)
    for (let i = 2; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 5) continue;

        const name = row[0]; // Col A: Province Name
        const monthlyYield = row[row.length - 1]; // Last Col: Monthly Total?

        // Validation: Name should be string, Yield should be number
        if (typeof name !== 'string' || typeof monthlyYield !== 'number') continue;
        if (name.includes('Province') || name.length > 50) continue; // Skip headers

        if (!provinceMap[name]) {
            provinceMap[name] = {
                name: name,
                totalYield: 0,
                count: 0
            };
        }

        provinceMap[name].totalYield += monthlyYield;
        provinceMap[name].count++;
    }

    // Convert to array
    const provinces = Object.values(provinceMap)
        .filter(p => p.count === 12) // Ensure complete year data
        .map(p => {
            // The excel seems to base on 100kWp system (Col B = 100)
            // Annual Yield per 1 kWp = TotalYield / 100
            const yieldPerKWp = p.totalYield / 100;
            const peakSunHours = yieldPerKWp / 365;

            return {
                id: p.name.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, ''),
                name: p.name,
                peakSunHours: parseFloat(peakSunHours.toFixed(2)),
                yield_yearly: parseFloat(yieldPerKWp.toFixed(0))
            };
        });

    console.log(`Extracted ${provinces.length} provinces.`);
    fs.writeFileSync(outputPath, JSON.stringify(provinces, null, 2));

} catch (e) {
    console.error("Error:", e);
}
