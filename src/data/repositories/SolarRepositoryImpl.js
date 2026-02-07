import { SolarRepository } from '../../domain/repositories/SolarRepository';
import {
    parseGSAExcel, parseMETData, parsePDFData, parsePVSystCSV, parseStandardCSV,
    parseTMYData, parse8760Data, parseGSAMapData
} from '../../infra/parsers';

export class SolarRepositoryImpl extends SolarRepository {
    async parseSolarFile(file) {
        return new Promise((resolve, reject) => {
            const fileName = file.name.toLowerCase();
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    let layers = [];
                    let metadata = null;

                    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                        if (!window.XLSX) {
                            // Ideally load XLSX dynamically here if not present
                            reject(new Error("XLSX library not loaded"));
                            return;
                        }
                        const data = new Uint8Array(e.target.result);
                        const workbook = window.XLSX.read(data, { type: 'array' });
                        metadata = parseGSAMapData(workbook);

                        let targetSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('hourly') || n.toLowerCase().includes('profile')) || workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[targetSheetName];
                        const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

                        const result = parseGSAExcel(jsonData);
                        // Store logs if needed, but for now return layers
                        // metadata.logs = result.logs; 
                        layers = Array.isArray(result) ? result : (result.profiles || []);

                    } else if (fileName.endsWith('.met')) {
                        layers = parseMETData(e.target.result);
                        if (layers.length > 0 && layers[0].meta) metadata = layers[0].meta;

                    } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
                        const lines = e.target.result.split('\n');
                        const jsonData = lines.map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, ''))).filter(r => r.length > 0);

                        const pvsystLayers = parsePVSystCSV(jsonData);
                        if (pvsystLayers.length > 0) {
                            layers = pvsystLayers;
                        } else {
                            const standard = parseStandardCSV(jsonData);
                            if (standard.length === 0) {
                                const legacy = parseTMYData(jsonData);
                                if (legacy.length === 0) layers = parse8760Data(jsonData);
                                else layers = legacy;
                            } else {
                                layers = standard;
                            }
                        }

                    } else if (fileName.endsWith('.pdf')) {
                        layers = await parsePDFData(e.target.result);
                        if (layers.length > 0 && layers[0].meta) metadata = layers[0].meta;

                    } else {
                        reject(new Error("Unsupported file format"));
                        return;
                    }

                    resolve({ layers, metadata });

                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (err) => reject(err);

            if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.pdf')) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        });
    }
}
