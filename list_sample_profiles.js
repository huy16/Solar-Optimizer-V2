
import { LOAD_PROFILES } from './src/utils/loadProfilesData.js';

const samples = [
    "Kinh Doanh_Dinh Ban Dem",
    "Kinh Doanh_Dinh Ban Ngay",
    "Kinh Doanh_2 Dinh",
    "San Xuat_Phu Tai Deu",
    "San Xuat_2 Dinh",
    "San Xuat_3 Dinh",
    "Sinh Hoat_Phu Tai Ngay",
    "Sinh Hoat_Ngay Va Dem",
    "Sinh Hoat_Phu Tai Chieu Toi",
    "Sinh Hoat_Phu Tai Dem Khuya"
];

console.log("LOAD PROFILE DATA (Normalized to 100%)");
console.log("HOUR | " + samples.map(s => s.split('_')[1]).join(" | "));
console.log("-".repeat(150));

for (let i = 0; i < 24; i++) {
    let row = `${i.toString().padStart(2, '0')}:00 | `;
    samples.forEach(s => {
        const val = LOAD_PROFILES[s][i] || 0;
        row += (val * 100).toFixed(1).padStart(8) + " | ";
    });
    console.log(row);
}

console.log("-".repeat(150));
let totalRow = "Total | ";
samples.forEach(s => {
    const sum = LOAD_PROFILES[s].reduce((a, b) => a + b, 0);
    totalRow += (sum * 100).toFixed(1).padStart(8) + " | ";
});
console.log(totalRow);
