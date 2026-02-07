import * as Icons from 'lucide-react';

const requiredIcons = ['Globe', 'Building2', 'Landmark', 'Mountain', 'Waves', 'Anchor', 'Sprout', 'Castle', 'MapPin', 'Factory'];

console.log("Checking icons...");
requiredIcons.forEach(icon => {
    if (Icons[icon]) {
        console.log(`[OK] ${icon} is present.`);
    } else {
        console.error(`[ERROR] ${icon} is MISSING!`);
    }
});
