
import { LOAD_PROFILES } from './src/utils/loadProfilesData.js';

const targetProfiles = [
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

targetProfiles.forEach(name => {
    const profile = LOAD_PROFILES[name];
    if (!profile) {
        console.error(`- Profile ${name}: NOT FOUND`);
        return;
    }
    const sum = profile.reduce((a, b) => a + b, 0);
    console.log(`- Profile ${name}: Sum = ${sum.toFixed(4)} (${profile.length} values)`);
});
