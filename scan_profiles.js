
import { LOAD_PROFILES } from './src/utils/loadProfilesData.js';

const profilesToConvert = [];

console.log("Scanning profiles...");

for (const [key, value] of Object.entries(LOAD_PROFILES)) {
    if (Array.isArray(value)) {
        if (value.length === 48) {
            const sum = value.reduce((a, b) => a + b, 0);
            console.log(`Found 48-point array: ${key}, Sum: ${sum.toFixed(3)}`);
            profilesToConvert.push({ key, value, sum });
        } else if (value.length !== 24) {
            console.log(`Found odd array length: ${key}, Length: ${value.length}`);
        }
    } else {
        // Object
        if (value.intervalMins === 30) {
            const sum = value.weights.reduce((a, b) => a + b, 0);
            console.log(`Existing 30-min profile: ${key}, Sum: ${sum.toFixed(3)}`);
        }
    }
}

console.log("\n--- Conversion Preview ---");
profilesToConvert.forEach(p => {
    // Normalize to sum 1.0
    const scale = 1.0 / p.sum;
    const newWeights = p.value.map(v => v * scale);
    const newSum = newWeights.reduce((a, b) => a + b, 0);

    console.log(`\n"${p.key}": {`);
    console.log(`    weights: [`);
    // Print in rows of 12 for readability
    for (let i = 0; i < newWeights.length; i += 12) {
        const chunk = newWeights.slice(i, i + 12);
        const line = chunk.map(n => n.toFixed(5).replace(/\.?0+$/, '')).join(', ');
        console.log(`        ${line},`);
    }
    console.log(`    ],`);
    console.log(`    intervalMins: 30`);
    console.log(`},`);
});
