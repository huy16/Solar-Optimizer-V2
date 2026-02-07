
import { LOAD_PROFILES } from './src/utils/loadProfilesData.js';

const emptyProfiles = [];
const validProfiles = [];

Object.entries(LOAD_PROFILES).forEach(([key, data]) => {
    const sum = data.reduce((a, b) => a + b, 0);
    if (sum === 0) {
        emptyProfiles.push(key);
    } else {
        validProfiles.push(key);
    }
});

console.log(`Total Profiles: ${Object.keys(LOAD_PROFILES).length}`);
console.log(`Valid Profiles: ${validProfiles.length}`);
console.log(`Empty Profiles (${emptyProfiles.length}):`);
emptyProfiles.forEach(p => console.log(`- ${p}`));
