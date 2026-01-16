import { generateSolarProfile } from './utils';

export const parseMETData = (text) => {
    try {
        const lines = text.split('\n'); const metadata = {}; let globalH_Month = [];
        for (let line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith('Site=')) metadata['siteName'] = cleanLine.split('=')[1];
            if (cleanLine.startsWith('Latitude=')) metadata['lat'] = parseFloat(cleanLine.split('=')[1]);
            if (cleanLine.startsWith('Longitude=')) metadata['lon'] = parseFloat(cleanLine.split('=')[1]);
            if (cleanLine.startsWith('GlobalH=')) { const parts = cleanLine.split('=')[1].split(','); globalH_Month = parts.map(p => parseFloat(p)).filter(n => !isNaN(n)); }
        }
        if (globalH_Month.length >= 12) return generateSolarProfile(globalH_Month, metadata, `File MET (${metadata['siteName'] || 'Unknown'})`);
        return [];
    } catch (e) { return []; }
};
