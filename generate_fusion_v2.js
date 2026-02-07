
const weekday = [430, 378, 348, 326, 309, 338, 400, 473, 601, 668, 717, 702, 678, 672, 688, 705, 702, 671, 665, 651, 589, 572, 533, 486];
const weekend = [430, 385, 345, 315, 320, 335, 400, 465, 590, 655, 685, 685, 660, 635, 645, 670, 675, 660, 665, 680, 595, 555, 530, 460];

const normalize = (arr) => {
    const sum = arr.reduce((a, b) => a + b, 0);
    return arr.map(v => Number((v / sum).toFixed(5)));
};

const normalizedWeekday = normalize(weekday);
const normalizedWeekend = normalize(weekend);
const finalWeights = [...normalizedWeekday, ...normalizedWeekend];

console.log(JSON.stringify(finalWeights));
