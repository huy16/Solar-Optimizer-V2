// Debug script to check day distribution in WATAKYU file
import XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'D:\\TOOL GOOGLE ANTIGRAVITY\\2. Tool Tính toán công suất\\Tool V2\\WATAKYU\\WATAKYU LOAD PROFILE (10-2024 TO 10-2025).xlsx';

// Simple date parser
const parseDate = (input) => {
    if (!input) return null;
    if (typeof input === 'number') {
        return new Date(Math.round((input - 25569) * 86400 * 1000));
    }
    if (typeof input === 'string') {
        const cleanStr = input.trim();
        const parts = cleanStr.split(' ');
        if (parts.length >= 1) {
            const datePart = parts[0];
            const timePart = parts[1] || '00:00';

            if (datePart.includes('/')) {
                const dp = datePart.split('/');
                let day, month, year;
                if (dp[0].length === 4) {
                    year = parseInt(dp[0]); month = parseInt(dp[1]) - 1; day = parseInt(dp[2]);
                } else {
                    day = parseInt(dp[0]); month = parseInt(dp[1]) - 1; year = parseInt(dp[2]);
                }
                const timeParts = timePart.split(':');
                const hour = parseInt(timeParts[0]) || 0;
                const minute = parseInt(timeParts[1]) || 0;
                return new Date(year, month, day, hour, minute);
            }
        }
    }
    return null;
};

try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    // Find time column (column index 2 based on earlier debug)
    const timeColIdx = 2;

    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun, Mon, Tue, Wed, Thu, Fri, Sat
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    let total = 0;
    let parseErrors = 0;

    // Skip first 5 header rows, process data
    for (let i = 5; i < Math.min(data.length, 1000); i++) {
        const row = data[i];
        if (!row) continue;
        const rawTime = row[timeColIdx];
        const date = parseDate(rawTime);

        if (date && !isNaN(date.getTime())) {
            const dayOfWeek = date.getDay();
            dayCounts[dayOfWeek]++;
            total++;
        } else {
            parseErrors++;
        }
    }

    console.log('\n--- Day Distribution Analysis ---');
    console.log(`Total parsed: ${total}, Parse errors: ${parseErrors}\n`);

    dayNames.forEach((name, i) => {
        const pct = total > 0 ? ((dayCounts[i] / total) * 100).toFixed(1) : 0;
        console.log(`${name}: ${dayCounts[i]} records (${pct}%)`);
    });

    // Show sample dates
    console.log('\n--- Sample Dates ---');
    for (let i = 5; i < Math.min(data.length, 15); i++) {
        const row = data[i];
        if (!row) continue;
        const rawTime = row[timeColIdx];
        const date = parseDate(rawTime);
        if (date) {
            console.log(`Row ${i}: ${rawTime} -> ${dayNames[date.getDay()]} (${date.toLocaleDateString()})`);
        }
    }

} catch (e) {
    console.error('Error:', e.message);
}
