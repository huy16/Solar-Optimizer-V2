
import { LOAD_PROFILES } from './src/utils/loadProfilesData.js';

const profiles = Object.entries(LOAD_PROFILES);
console.log(`Total Profiles: ${profiles.length}`);

const duplicates = [];
for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
        const [name1, data1] = profiles[i];
        const [name2, data2] = profiles[j];

        if (JSON.stringify(data1) === JSON.stringify(data2)) {
            duplicates.push(`${name1} == ${name2}`);
        }
    }
}

if (duplicates.length > 0) {
    console.log("Found duplicates:", duplicates);
} else {
    console.log("All 27 profiles are unique.");
}
