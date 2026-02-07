import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const { readFile } = XLSX;
import { join } from 'path';

const filePath = "D:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\Tool V2\\SOLAR CALCULATION TOOL_V2.xlsm";

console.log(`Analyzing: ${filePath}`);

try {
    const workbook = readFile(filePath);
    const sheetNames = workbook.SheetNames;
    console.log(`Found ${sheetNames.length} sheets: ${sheetNames.join(', ')}`);

    sheetNames.forEach(sheetName => {
        console.log(`\n--- Sheet: ${sheetName} ---`);
        const worksheet = workbook.Sheets[sheetName];
        // Get range
        const ref = worksheet['!ref'];
        if (!ref) {
            console.log("Empty sheet");
            return;
        }

        // Convert to JSON to see data
        // We handle it manually to just show first 10 rows
        const range = decodeRange(ref);
        const endRow = Math.min(range.e.r, 9); // 0-indexed, so 0-9 is 10 rows

        for (let R = range.s.r; R <= endRow; ++R) {
            let rowData = [];
            for (let C = range.s.c; C <= range.e.c && C < 20; ++C) { // Limit columns to 20
                const cellAddress = { c: C, r: R };
                const cellRef = encodeCell(cellAddress);
                const cell = worksheet[cellRef];
                rowData.push(cell ? cell.v : "");
            }
            console.log(rowData.join('\t'));
        }
    });

} catch (e) {
    console.error("Error reading file:", e);
}

// Helpers from xlsx utils mostly
function decodeRange(range) {
    const parts = range.split(":");
    if (parts.length === 1) return { s: decodeCell(parts[0]), e: decodeCell(parts[0]) };
    return { s: decodeCell(parts[0]), e: decodeCell(parts[1]) };
}

function decodeCell(cell) {
    const alpha = cell.match(/[A-Z]+/)[0];
    const num = parseInt(cell.match(/\d+/)[0], 10);
    return { c: decodeCol(alpha), r: num - 1 };
}

function decodeCol(col) {
    let c = 0;
    for (let i = 0; i < col.length; ++i) c = c * 26 + col.charCodeAt(i) - 64;
    return c - 1;
}

function encodeCell(cell) {
    return encodeCol(cell.c) + (cell.r + 1);
}

function encodeCol(col) {
    let s = "";
    for (++col; col; col = Math.floor((col - 1) / 26)) s = String.fromCharCode(((col - 1) % 26) + 65) + s;
    return s;
}
