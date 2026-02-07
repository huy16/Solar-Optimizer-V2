import fs from 'fs';

const outputPath = './src/data/provinces.json';

// Data from Image (Unit: kWh/kWp/month)
// Converted to Annual Yield (Sum) and Peak Sun Hours (Sum / 365)
const RAW_TABLE = [
    { name: "Tuyen Quang", data: [81, 40, 95, 97, 103, 83, 103, 103, 101, 95, 83, 66] },
    { name: "Cao Bang", data: [86, 39, 99, 106, 98, 79, 110, 111, 109, 103, 92, 77] },
    { name: "Lai Chau", data: [111, 98, 119, 112, 120, 93, 109, 110, 110, 108, 103, 92] },
    { name: "Lao Cai", data: [90, 56, 99, 93, 107, 92, 108, 106, 101, 96, 90, 80] },
    { name: "Thai Nguyen", data: [80, 31, 80, 83, 91, 80, 102, 93, 93, 89, 76, 57] },
    { name: "Dien Bien", data: [120, 105, 123, 115, 123, 100, 114, 111, 117, 115, 106, 97] },
    { name: "Lang Son", data: [86, 33, 75, 87, 86, 90, 112, 101, 99, 97, 85, 70] },
    { name: "Son La", data: [113, 86, 117, 109, 126, 108, 124, 113, 109, 108, 101, 94] },
    { name: "Phu Tho", data: [88, 38, 78, 88, 104, 100, 112, 103, 97, 93, 80, 64] },
    { name: "Bac Ninh", data: [82, 32, 68, 80, 86, 91, 97, 92, 87, 87, 74, 54] },
    { name: "Quang Ninh", data: [87, 37, 73, 73, 76, 94, 103, 98, 98, 93, 84, 66] },
    { name: "Ha Noi", data: [82, 33, 68, 83, 102, 98, 101, 93, 87, 84, 71, 53] },
    { name: "Hai Phong", data: [82, 33, 64, 72, 88, 99, 105, 96, 90, 91, 80, 65] },
    { name: "Hung Yen", data: [79, 31, 61, 77, 96, 104, 110, 100, 90, 91, 79, 63] },
    { name: "Ninh Binh", data: [83, 33, 64, 89, 110, 114, 117, 109, 97, 94, 83, 70] },
    { name: "Thanh Hoa", data: [98, 48, 83, 103, 124, 126, 124, 113, 100, 95, 83, 72] },
    { name: "Nghe An", data: [105, 60, 94, 112, 134, 138, 131, 120, 104, 99, 88, 78] },
    { name: "Ha Tinh", data: [86, 45, 80, 114, 132, 141, 135, 118, 96, 83, 76, 70] },
    { name: "Quang Tri", data: [78, 56, 85, 119, 138, 150, 137, 126, 102, 84, 79, 71] },
    { name: "Hue", data: [83, 69, 95, 121, 142, 149, 137, 135, 109, 84, 81, 70] },
    { name: "Da Nang", data: [89, 73, 113, 138, 155, 147, 140, 134, 119, 104, 91, 83] },
    { name: "Quang Ngai", data: [125, 111, 145, 153, 146, 122, 135, 126, 121, 110, 103, 101] },
    { name: "Gia Lai", data: [128, 106, 143, 154, 148, 128, 133, 126, 119, 108, 97, 95] },
    { name: "Dak Lak", data: [120, 102, 137, 155, 146, 129, 128, 129, 118, 107, 94, 90] },
    { name: "Khanh Hoa", data: [120, 100, 137, 160, 148, 144, 144, 150, 135, 121, 104, 100] },
    { name: "Lam Dong", data: [147, 127, 161, 157, 139, 116, 125, 135, 123, 128, 121, 126] },
    { name: "Dong Nai", data: [146, 127, 157, 150, 140, 111, 113, 118, 105, 114, 113, 111] }, // Note: Image values might differ slightly from Excel, prioritizing Image as it's the "Master" source provided
    { name: "Tay Ninh", data: [139, 126, 143, 140, 133, 116, 106, 109, 96, 102, 97, 100] },
    { name: "TP. Ho Chi Minh", data: [135, 120, 149, 147, 136, 113, 116, 119, 105, 111, 110, 106] },
    { name: "Dong Thap", data: [135, 124, 139, 143, 126, 106, 106, 107, 93, 98, 95, 98] },
    { name: "An Giang", data: [142, 125, 130, 139, 123, 104, 99, 103, 90, 98, 97, 106] },
    { name: "Vinh Long", data: [123, 127, 144, 147, 125, 104, 102, 105, 91, 94, 92, 95] },
    { name: "Can Tho", data: [123, 123, 133, 141, 120, 98, 92, 98, 83, 88, 84, 96] },
    { name: "Ca Mau", data: [119, 124, 138, 145, 122, 96, 90, 95, 85, 88, 89, 98] }
];

const provinces = RAW_TABLE.map(p => {
    const totalYield = p.data.reduce((a, b) => a + b, 0);
    const peakSunHours = totalYield / 365;

    return {
        id: p.name.toLowerCase().replace(/tp\. /g, '').replace(/ /g, '_').replace(/[^a-z0-9_]/g, ''),
        name: p.name,
        peakSunHours: parseFloat(peakSunHours.toFixed(2)),
        yield_yearly: totalYield,
        monthly_distribution: p.data // Keeping this for future advanced monthly scaling
    };
});

// Sort A-Z
provinces.sort((a, b) => a.name.localeCompare(b.name));

// Add "Vietnam Average" as fallback
provinces.unshift({
    id: "vietnam_average",
    name: "Vietnam (Trung bình)",
    peakSunHours: 3.8,
    yield_yearly: 1387,
    monthly_distribution: []
});

fs.writeFileSync(outputPath, JSON.stringify(provinces, null, 2));
console.log(`Successfully merged ${provinces.length} provinces.`);
