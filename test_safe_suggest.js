/**
 * Test script for SuggestSafeCapacity logic
 */
import { execute as suggestSafeCapacity } from './src/domain/usecases/SuggestSafeCapacity.js';

const mockData = [];

// Generate data for 2 months: Jan (Low) and Feb (High)
// Jan: Min load at noon Sunday = 635
// Feb: Min load at noon Sunday = 1000

for (let month = 0; month < 2; month++) {
    for (let day = 1; day <= 28; day++) {
        for (let hour = 0; hour < 24; hour++) {
            let load = 2000;

            // Peak solar hours: 11, 12, 13
            if (hour >= 11 && hour <= 13) {
                if (month === 0) { // Jan
                    load = (day === 7) ? 635 : 800; // Sunday min
                } else { // Feb
                    load = 1000;
                }
            }

            const date = new Date(2026, month, day, hour);
            mockData.push({
                date: date,
                load: load
            });
        }
    }
}

const result = suggestSafeCapacity(mockData);
console.log('--- TEST RESULT ---');
console.log('Expected: 635');
console.log('Actual:', result);

if (result === 635) {
    console.log('✅ TEST PASSED');
    process.exit(0);
} else {
    console.log('❌ TEST FAILED');
    process.exit(1);
}
