import { LoadRepository } from '../../domain/repositories/LoadRepository';
import { processExcelData, processCSVText, parseSmartDesignData } from '../../infra/parsers';

export class LoadRepositoryImpl extends LoadRepository {
    async parseLoadFile(file) {
        return new Promise((resolve, reject) => {
            const fileName = file.name.toLowerCase();
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    let rawData = [];
                    let processedData = [];
                    let metadata = {};
                    let loadTag = { label: '', isWeekendOff: false };
                    let detectedMaxLoad = 0;

                    if (fileName.endsWith('.xlsx')) {
                        if (!window.XLSX) {
                            reject(new Error("XLSX library not loaded"));
                            return;
                        }
                        const data = new Uint8Array(e.target.result);
                        const workbook = window.XLSX.read(data, { type: 'array' });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        rawData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                        // Use processExcelData
                        const results = processExcelData(rawData);
                        processedData = results;

                        if (processedData.length > 0) {
                            // Find max load
                            const maxVal = Math.max(...processedData.map(d => d.val));
                            detectedMaxLoad = maxVal;

                            // Check load tag name (if extractable, Logic was in SolarOptimizer but mostly manual)
                            if (results.length > 0 && results[0].loadName) {
                                loadTag.label = results[0].loadName;
                            }
                        }

                    } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
                        const text = e.target.result;
                        // Try SmartDesign first? Logic in handleFileUpload ran processCSVText OR parseSmartDesignData

                        // Detection logic from handleFileUpload:
                        const lines = text.split('\n');
                        const header = lines[0] ? lines[0].toLowerCase() : '';

                        if (header.includes('metering') && header.includes('point')) {
                            // Smart Design (Example detection, or just try parseSmartDesignData)
                            // Logic in SolarOptimizer was: check for "Metering Point" in header
                            const smartData = parseSmartDesignData(text);
                            if (smartData && smartData.length > 0) {
                                processedData = smartData;
                                detectedMaxLoad = Math.max(...processedData.map(d => d.val));
                            } else {
                                processedData = processCSVText(text);
                            }
                        } else {
                            processedData = processCSVText(text);
                        }

                        // RawData for CSV is just array of arrays
                        rawData = lines.map(line => line.split(','));

                        if (processedData.length > 0) {
                            const maxVal = Math.max(...processedData.map(d => d.val || 0));
                            detectedMaxLoad = maxVal;
                        }
                    } else {
                        reject(new Error("Unsupported file format"));
                        return;
                    }

                    resolve({
                        rawData,
                        processedData,
                        metadata,
                        detectedMaxLoad,
                        loadTag
                    });

                } catch (err) {
                    reject(err);
                }
            };

            reader.onerror = (err) => reject(err);

            if (fileName.endsWith('.xlsx')) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        });
    }
}
