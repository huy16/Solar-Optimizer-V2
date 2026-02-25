import { useState, useCallback } from 'react';
import {
    parseGSAExcel, parseMETData, parsePDFData, parsePVSystCSV, parseStandardCSV,
    processExcelData, processCSVText, parseSmartDesignData, parseTMYData, parse8760Data, parseGSAMapData,
    interpolate30Min, generateSolarProfile, csvTo2DArray
} from '../../infra/parsers';
import { parseAnyDate } from '../../utils/dateParsing';

export const useSolarSystemData = () => {
    const [rawData, setRawData] = useState([]);
    const [processedData, setProcessedData] = useState([]);
    const [solarLayers, setSolarLayers] = useState([]);
    const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
    const [enableInterpolation, setEnableInterpolation] = useState(false);
    const [loadTag, setLoadTag] = useState({ label: '', isWeekendOff: false });
    const [solarMetadata, setSolarMetadata] = useState(null);
    const [showFormulaModal, setShowFormulaModal] = useState(false);

    // Xử lý File Upload (Excel Load / Solar)
    const handleFileUpload = useCallback(async (event, type = 'load') => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            if (type === 'solar-smart-design') {
                const text = await file.text(); // Read text from file
                if (!text) return;
                const { data, meta } = parseSmartDesignData(text);
                if (data.length > 0) {
                    setSolarLayers([{ name: file.name.replace('.csv', ''), map: data, score: meta.totalProduction || 0, title: `Smart Design: ${file.name}` }]);
                    setSelectedLayerIndex(0);
                }
                return;
            }

            if (type === 'solar-pvsyst') {
                const text = await file.text();
                if (!text) return;
                const data = parsePVSystCSV(text);
                if (data.length > 0) {
                    const totalProd = data.reduce((sum, d) => sum + d.val, 0);
                    setSolarLayers([{ name: file.name.replace('.csv', ''), map: data, score: totalProd, title: `PVSyst: ${file.name}` }]);
                    setSelectedLayerIndex(0);
                }
                return;
            }

            if (type === 'solar-tmy') {
                const text = await file.text();
                if (!text) return;

                // Smart Chain: TM -> 8760 -> PVSyst -> Standard
                const dataArray = csvTo2DArray(text);

                let data = parseTMYData(dataArray);
                let title = `TMY Data: ${file.name}`;

                if (data.length === 0) {
                    data = parse8760Data(dataArray);
                    if (data.length > 0) title = `8760 Data: ${file.name}`;
                }

                if (data.length === 0) {
                    data = parsePVSystCSV(dataArray);
                    // PVSyst returns layers directly, not wrapped in another array like others if structure differs, 
                    // but check existing implementation: parsePVSystCSV returns [{map, ...}, {map, ...}]
                    // effectively same structure of objects.
                    // IMPORTANT: parsePVSystCSV returns "solarLayers" array. 
                    // The logic below expects "data" to be the array of layer objects.
                }

                if (data.length === 0) {
                    data = parseStandardCSV(dataArray);
                    if (data.length > 0) title = `CSV Data: ${file.name}`;
                }

                if (data.length > 0) {
                    // Normalize data structure if needed?
                    // All parsers seem to return [{ map, source, title, score }]

                    const newLayers = data.map(layer => ({
                        ...layer,
                        name: file.name,
                        title: layer.title || title,
                        score: layer.score || (layer.map ? layer.map.size : 0)
                    }));

                    setSolarLayers(newLayers);
                    setSelectedLayerIndex(0);
                }
                return;
            }

            if (type === 'solar-8760') {
                const text = await file.text();
                if (!text) return;
                const data = parse8760Data(text);
                if (data.length > 0) {
                    const totalProd = data.reduce((sum, d) => sum + d.val, 0);
                    setSolarLayers([{ name: file.name, map: data, score: totalProd, title: `8760 Data: ${file.name}` }]);
                    setSelectedLayerIndex(0);
                }
                return;
            }

            // Xử lý các định dạng Excel Load / GSA
            const arrayBuffer = await file.arrayBuffer();
            let parsedData = [];

            if (type === 'gsa') {
                if (!window.XLSX) { alert("Excel Library loading..."); return; }
                const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });

                // 1. Try to get Metadata from specific sheet (now includes dataTypes)
                const meta = parseGSAMapData(workbook) || { dataTypes: {} };

                // 2. Parse main matrix from ALL sheets
                let foundProfiles = [];
                let allLogs = [];

                // Priority sheets check
                const sheetNames = workbook.SheetNames;

                for (const sheetName of sheetNames) {
                    const ws = workbook.Sheets[sheetName];
                    const data = window.XLSX.utils.sheet_to_json(ws, { header: 1 });
                    const { profiles, logs } = parseGSAExcel(data);

                    if (profiles && profiles.length > 0) {
                        foundProfiles = profiles;
                        break;
                    }
                    allLogs.push(`Sheet [${sheetName}]: ` + logs.join(' | '));
                }

                // 3. Create multiple layers for each data type in metadata
                const dataTypes = meta.dataTypes || {};
                const availableTypes = Object.entries(dataTypes).sort((a, b) => a[1].priority - b[1].priority);

                let finalLayers = [];

                if (foundProfiles.length > 0 && availableTypes.length > 0) {
                    // Get the base profile (usually DNI or similar)
                    const baseProfile = foundProfiles[0];

                    // Calculate base profile's annual sum for scaling
                    let baseAnnualSum = 0;
                    if (baseProfile.map && baseProfile.map.size > 0) {
                        baseProfile.map.forEach(val => { baseAnnualSum += val; });
                        // Monthly keys = 12 months * 24 hours = 288 entries
                        // Since each entry is already a Monthly Sum, the total sum of all 288 entries is exactly the Annual Sum.
                        // We DO NOT multiply by 30.4.
                        baseAnnualSum = baseAnnualSum;
                    }

                    // Create a layer for each data type
                    for (const [typeName, typeData] of availableTypes) {
                        const scaleFactor = baseAnnualSum > 0 ? typeData.value / baseAnnualSum : 1;

                        // Clone and scale the base map
                        const scaledMap = new Map();
                        baseProfile.map.forEach((val, key) => {
                            scaledMap.set(key, val * scaleFactor);
                        });

                        finalLayers.push({
                            map: scaledMap,
                            source: `GSA ${typeName}`,
                            title: `${typeData.label} (${typeData.value.toFixed(0)} ${typeData.unit})`,
                            score: typeData.priority,
                            meta: { ...meta, dataType: typeName, annualValue: typeData.value },
                            name: typeName
                        });
                    }
                } else if (foundProfiles.length > 0) {
                    // Fallback: use found profiles as-is
                    finalLayers = foundProfiles.map(p => ({
                        ...p,
                        meta: { ...meta, ...p.meta },
                        name: p.title || file.name,
                        title: p.title || `GSA: ${file.name}`
                    }));
                }

                // NEW: Global Total Generation Normalizer (Fix for 300kW Flatline & Drop)
                // Ensure ALL layers are acting as "Specific Yield" (max ~ 1.0 - 1.2 kWh/kWp).
                // If a map max value is > 10, it's Total Generation. We MUST divide it by System Capacity.
                if (finalLayers.length > 0) {
                    finalLayers.forEach(layer => {
                        if (!layer.map) return;

                        let maxVal = 0;
                        layer.map.forEach(val => { if (val > maxVal) maxVal = val; });

                        if (layer.title.includes('PVOUT') || layer.title.includes('ĐIỆN')) {
                            // PVOUT Normalization Logic
                            if (maxVal > 5) {
                                // It's Total Generation. Try to find the system capacity to normalize it.
                                let capacityDivider = 1;
                                if (layer.meta && layer.meta.capacity) {
                                    capacityDivider = layer.meta.capacity;
                                } else {
                                    // Fallback heuristic: Assume Peak Specific Yield is ~0.85
                                    // So Capacity = maxVal / 0.85
                                    capacityDivider = maxVal / 0.85;
                                }

                                // Apply the division to the entire map unconditionally
                                const normalizedMap = new Map();
                                layer.map.forEach((val, key) => {
                                    normalizedMap.set(key, val / capacityDivider);
                                });

                                layer.map = normalizedMap;
                                // Add note to title
                                layer.title = `${layer.title} (Auto-Normalized by ${capacityDivider.toFixed(1)} kWp)`;

                                // Update maxVal for the next step
                                maxVal = maxVal / capacityDivider;
                            }

                            // Auto-boost PVOUT peak to 0.65 for Sale presentations if it's lower
                            if (maxVal > 0.1 && maxVal < 0.65) {
                                const boostMultiplier = 0.65 / maxVal;
                                const boostedMap = new Map();
                                layer.map.forEach((val, key) => {
                                    boostedMap.set(key, val * boostMultiplier);
                                });
                                layer.map = boostedMap;
                                layer.title = `${layer.title} (Auto-Boost to 0.65 Peak)`;
                            }
                        } else {
                            // Non-PVOUT (GHI, DNI, GTI, DIF) Normalization Logic
                            // Raw Irradiance maxes out around 0.8-1.2 kWh/m2.
                            // If we don't apply System Performance Ratio (PR), the power generation
                            // will equal exactly the SystemSize (e.g. 1.0 * 800kWp = 800kW) which is 
                            // physically impossible outside of STC conditions.
                            if (maxVal < 5 && maxVal > 0.1) {
                                const prFactor = 0.85; // Increased per user request for Sale presentations
                                const prMap = new Map();
                                layer.map.forEach((val, key) => {
                                    prMap.set(key, val * prFactor);
                                });
                                layer.map = prMap;
                                layer.title = `${layer.title} (Applied ${prFactor * 100}% PR)`;
                            }
                        }
                    });
                }

                if (finalLayers.length > 0) {
                    setSolarLayers(finalLayers);
                    setSelectedLayerIndex(0);
                    setSolarMetadata(meta);
                } else {
                    alert("Không tìm thấy dữ liệu GSA hợp lệ trong file này.\n\nLogs:\n" + allLogs.join('\n'));
                }
                return;
            } else if (type === 'met') {
                const text = new TextDecoder("utf-8").decode(arrayBuffer); // MET usually text based
                parsedData = await parseMETData(text);
            } else if (type === 'pdf') {
                parsedData = await parsePDFData(file); // PDF parser handles file/buffer internally if correctly implemented
            } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
                // Route .csv/.txt to the Smart Chain Logic (reuse 'solar-tmy' flow)
                return handleFileUpload(event, 'solar-tmy');
            } else {
                // EXCEL LOAD
                if (window.XLSX) {
                    const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const arrayData = window.XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                    // 1. Try Smart Design Parser (Rivana Style)
                    const smartData = parseSmartDesignData(arrayData);
                    if (smartData.length > 0) {
                        parsedData = smartData;
                        console.log("Parsed as Smart Design Profile (Rivana Style)", smartData.length);
                    } else {
                        // 2. Fallback to Standard Load Parser
                        const result = processExcelData(arrayData);
                        if (result && result.length > 0) {
                            parsedData = result[0].data;
                        }
                    }
                } else {
                    alert("Thư viện xử lý Excel chưa tải xong. Vui lòng đợi 3s và thử lại.");
                    return;
                }
            }

            if (parsedData && parsedData.length > 0) {
                setRawData(parsedData);
                setLoadTag({ label: file.name, isWeekendOff: false }); // Reset load tag
                // Let SolarOptimizer.jsx handle the processing via useEffect to ensure consistent date objects
            }
        } catch (error) {
            console.error("Error processing file:", error);
            alert("Lỗi đọc file: " + error.message + "\n\n" + (error.stack || ''));
        }
    }, [solarLayers]);

    return {
        rawData, setRawData,
        processedData, setProcessedData,
        solarLayers, setSolarLayers,
        selectedLayerIndex, setSelectedLayerIndex,
        enableInterpolation, setEnableInterpolation,
        loadTag, setLoadTag,
        solarMetadata, setSolarMetadata,
        handleFileUpload,
        showFormulaModal, setShowFormulaModal
    };
};
