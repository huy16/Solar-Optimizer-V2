
const fusionValues = [
    3.1, 3.0, 2.8, 2.7, 2.6, 2.5, 2.5, 2.4, 2.3, 2.4, 2.5, 2.8, 3.0, 3.4, 3.7, 4.0, 4.4, 4.7, 5.0, 5.3, 5.5, 5.5, 5.5, 5.4,
    5.3, 5.3, 5.3, 5.3, 5.2, 5.3, 5.3, 5.4, 5.4, 5.3, 5.2, 5.1, 4.9, 4.9, 4.8, 4.5, 4.2, 4.1, 4.0, 4.0, 3.9, 3.6, 3.4, 3.3
];

const sum = fusionValues.reduce((a, b) => a + b, 0);
const normalized = fusionValues.map(v => Number((v / sum).toFixed(5)));

console.log('// Normalized Fusion Weights (Sum: ' + normalized.reduce((a, b) => a + b, 0).toFixed(4) + ')');
console.log(JSON.stringify(normalized));
