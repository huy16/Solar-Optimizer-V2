import { generateSolarProfile } from './utils';

export const parsePDFData = async (arrayBuffer) => {
    // Note: window.pdfjsLib is expected to be available globally in the browser context
    if (!window.pdfjsLib) return [];
    try {
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let monthlyData = [];
        let metadata = {};

        // Loop through first 3 pages to find data
        for (let pageNum = 1; pageNum <= Math.min(3, pdf.numPages); pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const textItems = textContent.items.map(item => item.str);
            const fullText = textItems.join(' ');

            // Try to extract metadata
            if (!metadata.lat) {
                const latMatch = fullText.match(/Latitude\s*([\d\.]+)/i); if (latMatch) metadata.lat = parseFloat(latMatch[1]);
                const lonMatch = fullText.match(/Longitude\s*([\d\.]+)/i); if (lonMatch) metadata.lon = parseFloat(lonMatch[1]);
                const siteMatch = fullText.match(/Geographical Site\s*([A-Za-z0-9\s]+)\s/i); if (siteMatch) metadata.siteName = siteMatch[1].trim();
            }

            // Look for headers
            const keywords = ['horizontal global', 'global horizontal', 'ghi', 'irradiation'];
            const headerIndex = textItems.findIndex(t => keywords.some(k => t.toLowerCase().includes(k)));

            if (headerIndex !== -1) {
                let rawNumbers = [];
                // Look ahead for numbers
                for (let i = headerIndex; i < Math.min(textItems.length, headerIndex + 200); i++) {
                    const str = textItems[i].trim().replace(',', '');
                    if (/^\d+(\.\d+)?$/.test(str)) rawNumbers.push(parseFloat(str));
                    // 13 values: 12 months + total/avg
                    if (rawNumbers.length >= 13) break;
                }

                // If we found a sequence of at least 12 numbers
                if (rawNumbers.length >= 12) {
                    monthlyData = rawNumbers.slice(0, 12);
                    break; // stop scanning pages
                }
            }
        }

        if (monthlyData.length === 12) return generateSolarProfile(monthlyData, metadata, 'PDF Report');
        return [];
    } catch (e) { return []; }
};
