
const fs = require('fs');
const path = require('path');

// Mock export for testing in Node
const LOAD_PROFILES = require('./src/utils/loadProfilesData.js').LOAD_PROFILES;

const results = {};
for (const [name, weights] of Object.entries(LOAD_PROFILES)) {
    const sum = weights.reduce((a, b) => a + b, 0);
    const count = weights.length;

    // Normalize if sum is far from 1.0
    if (Math.abs(sum - 1.0) > 0.001) {
        const factor = 1.0 / sum;
        results[name] = weights.map(w => Number((w * factor).toFixed(5)));
    } else {
        results[name] = weights;
    }
}

console.log('Finished normalization.');
// In reality, I will use replace_file_content to update the file.
