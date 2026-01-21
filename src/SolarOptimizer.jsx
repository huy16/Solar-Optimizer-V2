
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

import { ResponsiveContainer, ComposedChart, BarChart, AreaChart, ScatterChart, Scatter, ZAxis, CartesianGrid, XAxis, YAxis, Legend, Bar, Line, Area, Cell, ReferenceLine, Tooltip } from 'recharts';
import { execute as calculateSystemStats } from './domain/usecases/CalculateEnergyGeneration';
import { selectOptimalInverters } from './utils/inverterOptimizer';
import { execute as calculateAdvancedFinancials } from './domain/usecases/CalculateFinancials';
import { parseAnyDate } from './utils/dateParsing';
import {
    parseGSAExcel, parseMETData, parsePDFData, parsePVSystCSV, parseStandardCSV,
    processExcelData, processCSVText, parseSmartDesignData, parseTMYData, parse8760Data, parseGSAMapData,
    interpolate30Min, generateSolarProfile
} from './infra/parsers';
import { Dashboard } from './presentation/features/dashboard/Dashboard';
import { Design } from './presentation/features/design/Design';
import { Finance } from './presentation/features/finance/Finance';
import { Report } from './presentation/features/report/Report';
import { useSolarSystemData } from './presentation/hooks/useSolarSystemData';
import { useSolarConfiguration } from './presentation/hooks/useSolarConfiguration';
import { useFinancialModel } from './presentation/hooks/useFinancialModel';
import { FormulaModal } from './presentation/components/FormulaModal';

import { Upload, Sun, BatteryCharging, Zap, FileText, AlertCircle, Settings, Download, Bug, RefreshCw, Calendar, SlidersHorizontal, CloudSun, CheckCircle2, Leaf, Trees, Factory, ArrowDownRight, Info, ShieldCheck, Grid3X3, Lock, Cpu, Server, Target, MousePointerClick, TrendingUp, DollarSign, Wallet, Plus, Minus, ToggleLeft, ToggleRight, Calculator, Table, ClipboardList, Moon, FileSpreadsheet, Hourglass, Clock, Eye, ZapOff, Gauge, MapPin, Maximize, Battery, Briefcase, Sofa, LayoutDashboard, PieChart, ChevronRight, Menu, X, Printer, Image as ImageIcon, Coins, Percent, ArrowUpRight, BarChart3, CheckSquare, Square, Layers, Activity, AlertTriangle, Wrench } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { PANEL_SPECS, INVERTER_DB, BESS_DB, INVERTER_OPTIONS, BESS_OPTIONS } from './data/sources/HardwareDatabase';
import casLogo from './assets/cas_logo.png';




// --- CONSTANTS & DATABASE ---



// --- UTILS ---



const isPeakHour = (date) => {
    const day = date.getDay();
    const hour = date.getHours();
    const minute = date.getMinutes();
    if (day === 0) return false;
    if (hour === 9 && minute >= 30) return true;
    if (hour === 10) return true;
    if (hour === 11 && minute < 30) return true;
    if (hour >= 17 && hour < 20) return true;
    return false;
};

const isOffPeakHour = (date) => {
    const hour = date.getHours();
    return (hour >= 22 || hour < 4);
};





// --- INTERPOLATION HELPER (Global) ---

const generateInstantaneousSolar = (date, psh) => {
    // Simple sinusoidal model for fallback
    const hour = date.getHours();
    const minute = date.getMinutes();
    const time = hour + minute / 60;

    // Assume 12 hours of sun, peak at 12:00
    if (time < 6 || time > 18) return 0;

    // Amplitude based on PSH
    // Total integral of sin(t) from 0 to pi is 2.
    // We want avg daily kWh/kWp = PSH.
    // 1 kWp * PSH = Integral(P(t) dt)
    // Model: P(t) = A * sin( (t-6)*pi/12 )
    // Integral from 6 to 18 of A*sin(...) is A * (12/pi) * 2 = A * 24/pi.
    // So A * 24/pi = PSH => A = PSH * pi / 24.

    const amplitude = (psh * Math.PI) / 24;
    return amplitude * Math.sin(((time - 6) * Math.PI) / 12);
};


// --- COMPONENTS ---
const StatCard = ({ icon: Icon, label, value, unit, colorClass = "text-slate-800" }) => (
    <div className="p-3 bg-slate-50 border border-slate-300 rounded flex flex-col items-center justify-center text-center">
        <Icon size={20} className={`mb-1 ${colorClass}`} />
        <div className="text-[10px] text-slate-500 uppercase font-bold">{label}</div>
        <div className={`text-lg font-bold ${colorClass}`}>{value} <span className="text-[9px] text-slate-400 font-normal">{unit}</span></div>
    </div>
);

// --- COMPONENT CHINH ---
const SolarOptimizer = () => {
    // 1. DATA HOOK
    const {
        rawData, setRawData,
        processedData, setProcessedData,
        solarLayers, setSolarLayers,
        selectedLayerIndex, setSelectedLayerIndex,
        enableInterpolation, setEnableInterpolation,
        loadTag, setLoadTag,
        solarMetadata, setSolarMetadata,
        handleFileUpload: onFileUpload,
        showFormulaModal, setShowFormulaModal
    } = useSolarSystemData();

    // 2. CONFIG HOOK
    const {
        inv1Id, setInv1Id,
        inv1Qty, setInv1Qty,
        inv2Id, setInv2Id,
        inv2Qty, setInv2Qty,
        selectedBess, handleBessSelect,
        bessKwh, setBessKwh,
        bessMaxPower, setBessMaxPower,
        isGridCharge, setIsGridCharge,
        params, setParams,
        techParams, setTechParams,
        targetKwp, setTargetKwp,
        handleAutoSelectInverter,
        totalACPower,
        inverterMaxAcKw
    } = useSolarConfiguration({
        psh: 4.2, systemPrice: 12000000, bessPrice: 9000000,
        pricePeak: 3151, priceNormal: 1738, priceOffPeak: 1133, co2Factor: 0.66,
    }, {
        gridInjectionPrice: 600,
        inverterMaxAcKw: 0, // Will be updated by hook logic or manual
        losses: { temp: 4.5, soiling: 2.0, cable: 1.5, inverter: 2.0 }
    });

    // 3. FINANCE HOOK
    const { finParams, setFinParams } = useFinancialModel({
        years: 20,
        escalation: 2.0,
        degradation: 0.5,
        discountRate: 10,
        omPercent: 1.5, // % of Capex
        batteryLife: 10,
        batteryReplaceCost: 80, // % of initial price
        loan: {
            enable: false,
            ratio: 70, // % Loan
            rate: 8.0, // % Interest
            term: 10 // Years
        }
    });

    // --- RESTORED LOCAL STATES & REFS ---
    const [scenarios, setScenarios] = useState([]);
    const [isTouMode, setIsTouMode] = useState(true); // Default TOU Mode
    // --- LOAD TUNING STATE ---
    const [loadScaling, setLoadScaling] = useState(100);
    const [simulateWeekend, setSimulateWeekend] = useState(false);

    const [isSwappedDate, setIsSwappedDate] = useState(false);
    const [calibrationFactor, setCalibrationFactor] = useState(100);

    // Logo removed (using static CAS logo)
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isManualConfig, setIsManualConfig] = useState(false);

    // Processing UI States
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [pdfLibStatus, setPdfLibStatus] = useState('loading');
    const [libStatus, setLibStatus] = useState('loading');
    const [isExporting, setIsExporting] = useState(false);
    const [showExportSettings, setShowExportSettings] = useState(false);
    const [exportConfig, setExportConfig] = useState({
        overview: true,
        systemConfig: true,
        dailyCharts: true,
        energyDispatch: true,
        correlation: true,
        monthlyTable: true,
        powerCurves: true,
        detailedSpecs: true,
        cashFlow: true,
        cashFlowTable: true,
        investmentAnalysis: true
    });

    // Auto-detect States
    const [detectedMaxLoad, setDetectedMaxLoad] = useState(0);
    const [detectedKwp, setDetectedKwp] = useState(0);
    const [maxKwpRef, setMaxKwpRef] = useState(100); // Using State instead of Ref for rendering

    // Refs
    const fileInputRef = useRef(null);
    const solarFileInputRef = useRef(null);

    const isNewFileLoad = useRef(true);

    // Helper Debug
    const [debugInfo, setDebugInfo] = useState('');

    // Wrappers for Hook Handlers
    // Unified Solar Upload Handler
    const handleSolarUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.name.endsWith('.xlsx')) onFileUpload(e, 'gsa');
        else if (file.name.endsWith('.met')) onFileUpload(e, 'met');
        else if (file.name.endsWith('.pdf')) onFileUpload(e, 'pdf');
        else onFileUpload(e, 'solar-tmy');
    };

    // Unified Load Upload Handler (Generic)
    const handleFileUpload = (e) => onFileUpload(e, 'load');




    // --- DERIVED VARS ---
    const inv1 = INVERTER_DB.find(i => i.id === inv1Id);
    const inv2 = INVERTER_DB.find(i => i.id === inv2Id);
    const selectedBessModel = BESS_DB.find(m => m.id === selectedBess);
    const totalPanels = Math.ceil((targetKwp * 1000) / PANEL_SPECS.power);
    const realSystemSize = (totalPanels * PANEL_SPECS.power) / 1000;
    const isSmallSystem = targetKwp < 100;
    const dcAcRatio = totalACPower > 0 ? (realSystemSize / totalACPower) : 0;
    const totalStrings = Math.ceil(totalPanels / 17);
    const panelsPerStringAvg = totalStrings > 0 ? Math.ceil(totalPanels / totalStrings) : 0;

    // CURRENT ACTIVE PROFILE - WITH INTERPOLATION LOGIC
    const currentSolarLayer = solarLayers.length > 0 ? solarLayers[selectedLayerIndex] : null;

    const realSolarProfile = useMemo(() => {
        if (!currentSolarLayer || !currentSolarLayer.map) return null;
        if (enableInterpolation) return interpolate30Min(currentSolarLayer.map);
        return currentSolarLayer.map;
    }, [currentSolarLayer, enableInterpolation]);

    const solarSourceName = currentSolarLayer ? currentSolarLayer.source : '';

    // AUTO-SYNC AC LIMIT
    useEffect(() => {
        setTechParams(prev => {
            // If manually set to Infinity or 0, maybe we should respect? 
            // But user asked to "Remove AC Limit" which implies removing the manual control.
            // So we sync to physical Total AC Power of inverters.
            if (prev.inverterMaxAcKw !== totalACPower) {
                return { ...prev, inverterMaxAcKw: totalACPower };
            }
            return prev;
        });
    }, [totalACPower]);

    const formatNumber = (num) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(num);
    const formatMoney = (num) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(num);

    // --- EFFECTS ---
    useEffect(() => {
        const checkAndLoadLib = () => {
            if (window.XLSX) { setLibStatus('ready'); }
            else {
                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
                script.async = true;
                script.onload = () => { setLibStatus('ready'); setErrorMsg(''); };
                script.onerror = () => { setLibStatus('error'); setErrorMsg("Khong the tai thu vien Excel."); };
                document.body.appendChild(script);
            }

            const loadPdfJs = () => {
                const scriptPdfJs = document.createElement('script');
                scriptPdfJs.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
                scriptPdfJs.async = true;
                scriptPdfJs.onload = () => {
                    if (window.pdfjsLib) {
                        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                    }
                };
                document.body.appendChild(scriptPdfJs);
            };
            loadPdfJs();

            // PDF Libraries are now imported via npm, so we mark them ready immediately
            setPdfLibStatus('ready');
        };
        checkAndLoadLib();

    }, []);

    useEffect(() => {
        if (!isManualConfig) {
            // Use the centralized auto-select logic from the hook
            // This ensures both Model and Quantity are updated based on the new Target kWp
            handleAutoSelectInverter();
        }
    }, [targetKwp, isManualConfig, handleAutoSelectInverter]);

    // Handle Layer Switching: Auto-adjust Calibration
    const handleLayerChange = (idx) => {
        setSelectedLayerIndex(idx);
        const layer = solarLayers[idx];
        if (!layer) return;

        // Auto-suggest Calibration & Losses based on data type
        const titleLower = layer.title.toLowerCase();

        if (titleLower.includes('pvout') || titleLower.includes('specific') || titleLower.includes('produce') || titleLower.includes('e_grid')) {
            // OUTPUT DATA (Pre-simulated): No extra losses, 100% calibration
            setCalibrationFactor(100);
            setTechParams(prev => ({
                ...prev,
                losses: { temp: 0, soiling: 0, cable: 0, inverter: 0 }
            }));
        } else if (titleLower.includes('global') || titleLower.includes('ghi') || titleLower.includes('gti')) {
            // IRRADIANCE DATA (Input): 80% PR approx (via Calibration or Losses)
            // Here we keep Calibration conservative (80 -> 80% PR if losses are included separately?)
            // If we use standard physics, GHI -> Power needs ~15-20% losses.
            // Let's restore default losses and Keep Calibration 100 (or 95)
            setCalibrationFactor(100);
            setTechParams(prev => ({
                ...prev,
                losses: { temp: 4.5, soiling: 2.0, cable: 1.5, inverter: 2.0 } // Restore ~10% Losses
            }));
        } else if (titleLower.includes('dni')) {
            setCalibrationFactor(100);
            setTechParams(prev => ({
                ...prev,
                losses: { temp: 4.5, soiling: 2.0, cable: 1.5, inverter: 2.0 }
            }));
        }
    };

    // --- CALCULATION CORE ---
    // --- CALCULATION CORE (MOVED TO UTILS) ---
    // calculateSystemStats is now imported












    const toggleExportConfig = (key) => { setExportConfig(prev => ({ ...prev, [key]: !prev[key] })); };

    const customStats = useMemo(() => {
        if (processedData.length === 0) return null;
        return calculateSystemStats(realSystemSize, processedData, bessKwh, bessMaxPower, isTouMode, isGridCharge, { ...params, calibrationFactor }, { ...techParams, inverterMaxAcKw: totalACPower });
    }, [realSystemSize, processedData, bessKwh, bessMaxPower, isTouMode, isGridCharge, params, techParams, calibrationFactor, totalACPower]);

    const estimatedLosses = useMemo(() => {
        if (!customStats) return null;
        // Calculate total loss percentage from techParams to match calculated stats
        const currentLosses = techParams.losses || { temp: 0, soiling: 0, cable: 0, inverter: 0 };
        const totalLoss = Object.values(currentLosses).reduce((sum, val) => sum + val, 0);
        return { systemLossPct: totalLoss };
    }, [customStats, techParams.losses]);

    // --- ADVANCED FINANCIAL CALCULATION ---
    // --- ADVANCED FINANCIAL CALCULATION (MOVED TO UTILS) ---
    // calculateAdvancedFinancials is imported


    const currentFinance = useMemo(() => {
        if (!customStats) return null;
        const systemCapex = realSystemSize * params.systemPrice;
        const batteryCapex = bessKwh * params.bessPrice;
        const totalCapex = systemCapex + batteryCapex;

        // Prices obj
        const prices = {
            peak: params.pricePeak,
            normal: params.priceNormal,
            offPeak: params.priceOffPeak,
            gridInjection: techParams.gridInjectionPrice
        };

        const finParamsFull = {
            ...finParams,
            batteryCapex // Pass explicit battery capex for replacement calculation
        };

        return calculateAdvancedFinancials(totalCapex, customStats, prices, finParamsFull);
    }, [customStats, realSystemSize, params, bessKwh, techParams, finParams]);

    // --- DATA PROCESSING ---
    useEffect(() => {
        if (rawData.length === 0) return;
        setIsProcessing(true);
        setTimeout(() => {
            let failCount = 0; let nightLoadCount = 0; let eveningLoadCount = 0;
            const cleanData = rawData.map((d) => {
                const date = parseAnyDate(d.rawTime, isSwappedDate);
                if (!date || isNaN(date.getTime())) { failCount++; return null; }
                let solarUnit = 0;
                if (realSolarProfile) {
                    const keyExact = `${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
                    const keyHour = `${date.getMonth()}-${date.getDate()}-${date.getHours()}-0`;
                    const keyMonthly = `MONTHLY-${date.getMonth()}-${date.getHours()}`;
                    const realVal = realSolarProfile.get(keyExact) ?? realSolarProfile.get(keyHour) ?? realSolarProfile.get(keyMonthly);
                    solarUnit = (realVal !== undefined) ? realVal : 0;
                } else { solarUnit = generateInstantaneousSolar(date, params.psh); }
                if (d.loadKw > 10) { if (date.getHours() === 2) nightLoadCount++; if (date.getHours() === 20) eveningLoadCount++; }
                return { date, day: date.getDay(), hour: date.getHours(), minute: date.getMinutes(), timestamp: date.getTime(), load: d.loadKw, solarUnit: solarUnit };
            }).filter(d => d !== null);

            cleanData.sort((a, b) => a.timestamp - b.timestamp);

            // --- LOAD TUNING LOGIC ---
            // 1. Calculate Average Weekday Load Profile
            const weekdayLoadsByHour = Array(24).fill(0).map(() => ({ sum: 0, count: 0 }));
            cleanData.forEach(d => {
                if (d.day !== 0) { // Not Sunday
                    weekdayLoadsByHour[d.hour].sum += d.load;
                    weekdayLoadsByHour[d.hour].count++;
                }
            });
            const avgWeekdayLoad = weekdayLoadsByHour.map(h => h.count > 0 ? h.sum / h.count : 0);

            // 2. Apply Tuning (Scaling & Weekend Simulation)
            const processedWithStep = cleanData.map((d, i) => {
                let timeStep = 1.0;
                if (i < cleanData.length - 1) { const diff = (cleanData[i + 1].timestamp - d.timestamp) / 3600000; if (diff > 0 && diff <= 24) timeStep = diff; }

                let tunedLoad = d.load;

                // Simulate Weekend: If Sunday, replace with Avg Weekday Load
                if (simulateWeekend && d.day === 0) {
                    tunedLoad = avgWeekdayLoad[d.hour] || tunedLoad;
                }

                // Load Scaling
                tunedLoad = tunedLoad * (loadScaling / 100.0);

                return { ...d, load: tunedLoad, timeStep };
            });

            if (processedWithStep.length === 0) { setErrorMsg(`Loi format ngay thang.`); setIsProcessing(false); return; }
            const uniqueDays = new Set(processedWithStep.map(d => d.date.toDateString())).size;
            let detectedType = '1 Ca (Hành chính)';
            if (nightLoadCount > uniqueDays * 0.3) detectedType = '3 Ca (24/7)'; else if (eveningLoadCount > uniqueDays * 0.3) detectedType = '2 Ca (Sáng/Chiều)';

            let sunSum = 0, sunCount = 0, weekSum = 0, weekCount = 0;
            processedWithStep.forEach(d => { if (d.day === 0) { sunSum += d.load; sunCount++; } else { weekSum += d.load; weekCount++; } });
            const isWeekendOff = sunCount > 0 ? (sunSum / sunCount) < (weekSum / weekCount * 0.4) : false;

            setLoadTag({ label: detectedType, isWeekendOff });
            setProcessedData(processedWithStep);

            // Annualize Metrics for Auto-Sizing
            // If data > 370 days, we should normalize MaxLoad? 
            // MaxLoad is instantaneous, so it doesn't strictly depend on duration, but summing loads does.
            // For now, keep MaxLoad as absolute Peak.
            const calculatedMaxLoad = Math.max(...processedWithStep.map(d => d.load));
            setDetectedMaxLoad(calculatedMaxLoad);
            const autoMaxKwp = Math.ceil(calculatedMaxLoad * 2.5);
            setMaxKwpRef(autoMaxKwp);
            if (isNewFileLoad.current) { setTargetKwp(detectedKwp || Math.round(calculatedMaxLoad)); isNewFileLoad.current = false; }
            setIsProcessing(false);
        }, 100);
    }, [rawData, params.psh, realSolarProfile, isSwappedDate, loadScaling, simulateWeekend]);



    // --- SCENARIOS ---
    useEffect(() => {
        if (processedData.length === 0) return;

        // 1. Local Sanitization for Sizing: Filter out "Phantom/Off" days for optimization purposes
        // Valid Day = Day with Peak Load > 5kW (Filters out 'zero' days which are actually ~0.1-1kW)
        const validDailyPeaks = [];
        const dayMap = new Map();
        processedData.forEach(d => {
            const dateStr = d.date.toDateString();
            if (!dayMap.has(dateStr)) dayMap.set(dateStr, []);
            dayMap.get(dateStr).push(d);
        });

        // Collect Peak Load for each Valid Day
        dayMap.forEach((points) => {
            const dayPeak = Math.max(...points.map(p => p.load));
            if (dayPeak > 5) validDailyPeaks.push(dayPeak);
        });

        // If everything is filtered (unlikely), fallback to raw peaks
        const sizingPeaks = validDailyPeaks.length > 0 ? validDailyPeaks : Array.from(dayMap.values()).map(pts => Math.max(...pts.map(p => p.load)));

        // 2. Base Load Calculation: Robust Median
        // Use Median (50th percentile) of Daily Peaks from Valid Days
        // This is much more stable than P10 or Min, avoiding outliers
        sizingPeaks.sort((a, b) => a - b);
        let baseLoad = 0;
        if (sizingPeaks.length > 0) {
            baseLoad = sizingPeaks[Math.floor(sizingPeaks.length * 0.50)] || sizingPeaks[0];
        }
        let baseLoadKwp = Math.round(baseLoad); if (baseLoadKwp < 1) baseLoadKwp = 1;

        const targets = [{ label: 'Cắt giảm 0%', val: 0.00 }, { label: 'Cắt giảm 5%', val: 0.05 }, { label: 'Cắt giảm 10%', val: 0.10 }, { label: 'Cắt giảm 15%', val: 0.15 }, { label: 'Cắt giảm 20%', val: 0.20 }];
        const computedScenarios = targets.map(t => {
            let low = 1, high = maxKwpRef * 1.5; let bestKwp = low; let minDiff = 1;
            for (let i = 0; i < 20; i++) {
                const mid = (low + high) / 2;
                // --- ADVANCED INVERTER SELECTION ---
                // Instead of fixed ratio, we actally SELECT inverters
                const { totalAcKw } = selectOptimalInverters(mid, INVERTER_DB, 1.25);

                const optParams = { ...techParams, inverterMaxAcKw: totalAcKw, gridInjectionPrice: 0 };

                // Re-filtering processedData (Keep existing)
                const validDataForSim = processedData.filter(d => {
                    const peak = Math.max(...(dayMap.get(d.date.toDateString()) || []).map(p => p.load));
                    return peak > 5;
                });
                const simData = validDataForSim.length > 0 ? validDataForSim : processedData;

                const stats = calculateSystemStats(mid, simData, 0, 0, false, false, { ...params, calibrationFactor }, optParams);
                const diff = stats.curtailmentRate - t.val;
                if (Math.abs(diff) < minDiff) { minDiff = Math.abs(diff); bestKwp = mid; }
                if (stats.curtailmentRate < t.val) low = mid; else high = mid;
            }
            let finalKwp = Math.round(bestKwp); if (finalKwp < 1) finalKwp = 1;

            // Final Selection for Display/Stats
            const { totalAcKw: finalAcKw, selectedInverters: finalInverters } = selectOptimalInverters(finalKwp, INVERTER_DB, 1.25);

            // Re-filtering processedData (Keep existing)
            const validDataForSim = processedData.filter(d => {
                const peak = Math.max(...(dayMap.get(d.date.toDateString()) || []).map(p => p.load));
                return peak > 5;
            });
            const simData = validDataForSim.length > 0 ? validDataForSim : processedData;

            const scenarioTechParams = { ...techParams, inverterMaxAcKw: finalAcKw, gridInjectionPrice: 0 };
            const stats = calculateSystemStats(finalKwp, simData, 0, 0, isTouMode, false, { ...params, calibrationFactor }, scenarioTechParams);

            // Calculate CAPEX without Battery
            const capex = finalKwp * params.systemPrice;

            const prices = { peak: params.pricePeak, normal: params.priceNormal, offPeak: params.priceOffPeak, gridInjection: techParams.gridInjectionPrice };

            // Financials without Battery
            const fin = calculateAdvancedFinancials(capex, stats, prices, { ...finParams, batteryCapex: 0 }); // batteryCapex 0

            // Reconstruct annualSaving for table display from the new object
            const annualSaving = fin.firstYearRevenue;

            return { ...t, kwp: finalKwp, realRate: stats.curtailmentRate, stats, capex, annualSaving, paybackYears: fin.payback, npv: fin.npv, irr: fin.irr, config: finalInverters };
        });

        // Base Load Scenario also needs Inverter Config
        const { totalAcKw: blAcKw, selectedInverters: blInverters } = selectOptimalInverters(baseLoadKwp, INVERTER_DB, 1.25);

        const blStats = calculateSystemStats(baseLoadKwp, processedData, bessKwh, bessMaxPower, isTouMode, isGridCharge, { ...params, calibrationFactor }, { ...techParams, inverterMaxAcKw: blAcKw });
        const blCapex = baseLoadKwp * params.systemPrice + bessKwh * params.bessPrice;
        const prices = { peak: params.pricePeak, normal: params.priceNormal, offPeak: params.priceOffPeak, gridInjection: techParams.gridInjectionPrice };
        const blFin = calculateAdvancedFinancials(blCapex, blStats, prices, { ...finParams, batteryCapex: bessKwh * params.bessPrice });
        const blSaving = blFin.firstYearRevenue;

        setScenarios([{ label: 'Theo tải nền (Base)', kwp: baseLoadKwp, realRate: blStats.curtailmentRate, stats: blStats, capex: blCapex, annualSaving: blSaving, paybackYears: blFin.payback, npv: blFin.npv, irr: blFin.irr, config: blInverters }, ...computedScenarios]);
    }, [processedData, maxKwpRef, calculateSystemStats, params, bessKwh, bessMaxPower, isTouMode, isGridCharge, calculateAdvancedFinancials, finParams, dcAcRatio]);


    // --- HANDLER: SELECT SCENARIO ---
    const handleSelectScenario = (scenario) => {
        setTargetKwp(scenario.kwp);
        // Auto-configure Inverters from the optimized result
        if (scenario.config && scenario.config.length > 0) {
            // Apply first inverter type
            const inv1 = scenario.config[0];
            setInv1Id(inv1.id);
            setInv1Qty(inv1.count);

            // Apply second inverter type if exists, else clear
            if (scenario.config.length > 1) {
                const inv2 = scenario.config[1];
                setInv2Id(inv2.id);
                setInv2Qty(inv2.count);
            } else {
                setInv2Id('');
                setInv2Qty(0);
            }
        }
    };




    // --- CHART DATA ---
    const averageDayData = useMemo(() => {
        if (processedData.length === 0) return [];

        // Use the shared calculation engine to get consistent results
        const stats = calculateSystemStats(
            realSystemSize,
            processedData,
            bessKwh,
            bessMaxPower,
            isTouMode,
            isGridCharge,
            { ...params, calibrationFactor },
            techParams
        );

        const hourly = Array(24).fill(0).map(() => ({ count: 0, load: 0, solar: 0, charge: 0, discharge: 0, gridCharge: 0, wdSum: 0, wdCount: 0, weSum: 0, weCount: 0 }));

        // Iterate through the detailed results if available, or fall back (should be available now)
        if (stats.hourlyBatteryData && stats.hourlyBatteryData.length === processedData.length) {
            stats.hourlyBatteryData.forEach((bat, i) => {
                const d = processedData[i];
                const h = d.hour; // Use original hour from data

                if (hourly[h]) {
                    hourly[h].count++;
                    hourly[h].load += (bat.load || 0);
                    hourly[h].solar += (bat.solar || 0);
                    hourly[h].charge += (bat.chargeFromSolar || 0);
                    hourly[h].gridCharge += (bat.chargeFromGrid || 0);
                    hourly[h].discharge += (bat.discharge || 0);

                    if (d.day === 0) {
                        hourly[h].weSum += (bat.load || 0);
                        hourly[h].weCount++;
                    } else {
                        hourly[h].wdSum += (bat.load || 0);
                        hourly[h].wdCount++;
                    }
                }
            });
        } else {
            // Fallback if something fails (shouldn't happen with correct logic)
            processedData.forEach(d => {
                if (hourly[d.hour]) {
                    hourly[d.hour].count++;
                    hourly[d.hour].load += d.load;
                    hourly[d.hour].solar += d.solarUnit * realSystemSize * (calibrationFactor / 100);
                    if (d.day === 0) {
                        hourly[d.hour].weSum += d.load;
                        hourly[d.hour].weCount++;
                    } else {
                        hourly[d.hour].wdSum += d.load;
                        hourly[d.hour].wdCount++;
                    }
                }
            });
        }

        return hourly.map((h, i) => ({
            hour: `${i}:00`,
            avgLoad: h.load / (h.count || 1),
            solarProfile: h.solar / (h.count || 1),
            avgBessCharge: h.charge / (h.count || 1),
            avgGridCharge: h.gridCharge / (h.count || 1),
            avgBessDischarge: h.discharge / (h.count || 1),
            weekday: h.wdCount ? h.wdSum / h.wdCount : 0,
            weekend: h.weCount ? h.weSum / h.weCount : 0
        }));
    }, [processedData, realSystemSize, bessKwh, bessMaxPower, calibrationFactor, isTouMode, isGridCharge, techParams, params]);

    const monthlyDetails = useMemo(() => {
        if (processedData.length === 0) return [];
        // Initialize stats carefully
        const stats = Array(12).fill(0).map(() => ({
            solar: 0, load: 0, used: 0, curtailed: 0, gridCharge: 0,
            usedPeak: 0, usedNormal: 0, curtailedPeak: 0, curtailedNormal: 0
        }));
        let soc = 0; const scale = calibrationFactor / 100.0;

        for (let i = 0; i < processedData.length; i++) {
            const d = processedData[i]; const monthIdx = d.date.getMonth();
            const timeFactor = d.timeStep || 1;
            const solarGen = d.solarUnit * realSystemSize * scale * timeFactor; const loadEnergy = d.load * timeFactor;

            let used = Math.min(solarGen, loadEnergy);
            let curtailed = Math.max(0, solarGen - loadEnergy);
            let deficit = Math.max(0, loadEnergy - solarGen);
            let gridChargeAmt = 0;

            if (bessKwh > 0) {
                const maxTransfer = (bessMaxPower > 0 ? bessMaxPower : 1000) * timeFactor;
                if (curtailed > 0) { const charge = Math.min(curtailed, Math.min(bessKwh - soc, maxTransfer)); soc += charge; curtailed -= charge; }
                if (isGridCharge && isOffPeakHour(d.date) && soc < bessKwh) { const ch = Math.min(bessKwh - soc, maxTransfer); soc += ch; gridChargeAmt += ch; }
                if ((isTouMode && isPeakHour(d.date) && deficit > 0 && soc > 0) || (!isTouMode && deficit > 0 && soc > 0)) { const dis = Math.min(deficit, Math.min(soc, maxTransfer)); soc -= dis; used += dis; }
            }

            stats[monthIdx].solar += solarGen; stats[monthIdx].load += loadEnergy; stats[monthIdx].used += used; stats[monthIdx].curtailed += curtailed; stats[monthIdx].gridCharge += gridChargeAmt;
            if (isPeakHour(d.date)) { stats[monthIdx].usedPeak += used; stats[monthIdx].curtailedPeak += curtailed; }
            else { stats[monthIdx].usedNormal += used; stats[monthIdx].curtailedNormal += curtailed; }
        }
        return stats.map((s, i) => ({
            month: `T${i + 1}`, solar: s.solar, load: s.load, used: s.used, curtailed: s.curtailed, curtailedPct: s.solar > 0 ? s.curtailed / s.solar : 0, usedPeak: s.usedPeak, usedNormal: s.usedNormal, curtailedPeak: s.curtailedPeak, curtailedNormal: s.curtailedNormal, gridImport: (s.load + s.gridCharge) - s.used
        }));
    }, [processedData, realSystemSize, calibrationFactor, bessKwh, bessMaxPower, isTouMode, isGridCharge]);

    const detailedSpecsList = useMemo(() => {
        if (!customStats || !estimatedLosses) return [];
        return [
            { id: 1, label: 'PV Total (Tổng sản lượng PV)', value: customStats.totalSolarGen, unit: 'kWh', formula: 'Σ ( Monthly Solar Generation )' },
            { id: 2, label: 'PV Used by Loads (Năng lượng Solar)', value: customStats.totalUsed, unit: 'kWh', highlight: true, color: 'text-green-600', formula: 'Σ Min( Solar, Load )' },
            { id: 3, label: 'PV Used by Loads %', value: (customStats.totalUsed / customStats.totalSolarGen * 100).toFixed(2), unit: '%', highlight: true, color: 'text-green-600', formula: '( PV Used / PV Total ) * 100' },
            { id: 4, label: 'PV Curtailed (Cắt giảm)', value: customStats.totalCurtailed + (customStats.totalExported || 0), unit: 'kWh', highlight: true, color: 'text-red-500', formula: 'PV Total - PV Used' },
            { id: 5, label: 'PV Curtailed %', value: (customStats.totalSolarGen > 0 ? ((customStats.totalCurtailed + (customStats.totalExported || 0)) / customStats.totalSolarGen * 100).toFixed(2) : 0), unit: '%', highlight: true, color: 'text-red-500', formula: '( PV Curtailed / PV Total ) * 100' },
            { id: 6, label: 'Grid Import (Mua lưới)', value: customStats.gridImport, unit: 'kWh', formula: 'Total Load - PV Used' },
            { id: 7, label: 'Load Consumption (Tổng tải)', value: customStats.totalLoad, unit: 'kWh', formula: 'Σ ( Monthly Load Consumption )' },
            { id: 8, label: 'Loss Percent (Tổng tổn thất)', value: estimatedLosses.systemLossPct.toFixed(2), unit: '%', formula: '( 1 - Total Derate Factor ) * 100' },
            { id: 9, label: 'PV Used (Giờ Bình thường)', value: customStats.usedNormal, unit: 'kWh', formula: 'Σ PV Used (Normal Hours)' },
            { id: 10, label: 'PV Used (Giờ BT) %', value: customStats.totalUsed > 0 ? (customStats.usedNormal / customStats.totalUsed * 100).toFixed(2) : 0, unit: '%', formula: '( PV Used Normal / Total PV Used ) * 100' },
            { id: 11, label: 'PV Used (Giờ Cao điểm)', value: customStats.usedPeak, unit: 'kWh', formula: 'Σ PV Used (Peak Hours)' },
            { id: 12, label: 'PV Used (Giờ CĐ) %', value: customStats.totalUsed > 0 ? (customStats.usedPeak / customStats.totalUsed * 100).toFixed(2) : 0, unit: '%', formula: '( PV Used Peak / Total PV Used ) * 100' },
            { id: 13, label: 'PV Curtailed (Giờ Bình thường)', value: customStats.curtailedNormal + (customStats.exportedNormal || 0), unit: 'kWh', formula: 'Excess Normal' },
            { id: 14, label: 'PV Curtailed (Giờ BT) %', value: (customStats.totalCurtailed + customStats.totalExported) > 0 ? ((customStats.curtailedNormal + (customStats.exportedNormal || 0)) / (customStats.totalCurtailed + customStats.totalExported) * 100).toFixed(2) : 0, unit: '%', formula: '( Curtailed Normal / Total Curtailed ) * 100' },
            { id: 15, label: 'PV Curtailed (Giờ Cao điểm)', value: customStats.curtailedPeak + (customStats.exportedPeak || 0), unit: 'kWh', formula: 'Excess Peak' },
            { id: 16, label: 'PV Curtailed (Giờ CĐ) %', value: (customStats.totalCurtailed + customStats.totalExported) > 0 ? ((customStats.curtailedPeak + (customStats.exportedPeak || 0)) / (customStats.totalCurtailed + customStats.totalExported) * 100).toFixed(2) : 0, unit: '%', formula: '( Curtailed Peak / Total Curtailed ) * 100' },
        ];
    }, [customStats, estimatedLosses]);

    const monthlyPowerCurves = useMemo(() => {
        if (processedData.length === 0) return [];
        const acc = Array.from({ length: 12 }, () => Array.from({ length: 24 }, () => ({ wdSum: 0, wdCount: 0, weSum: 0, weCount: 0, solarSum: 0, solarCount: 0 })));
        const scale = calibrationFactor / 100.0;
        processedData.forEach(d => {
            const m = d.date.getMonth(); const h = d.date.getHours();
            acc[m][h].solarSum += d.solarUnit * realSystemSize * scale; acc[m][h].solarCount++;
            if (d.day === 0) { acc[m][h].weSum += d.load; acc[m][h].weCount++; } else { acc[m][h].wdSum += d.load; acc[m][h].wdCount++; }
        });
        return acc.map((m, i) => ({ month: `Tháng ${i + 1}`, data: m.map((h, hi) => ({ hour: hi, weekday: h.wdCount ? h.wdSum / h.wdCount : 0, weekend: h.weCount ? h.weSum / h.weCount : 0, solar: h.solarCount ? h.solarSum / h.solarCount : 0 })) }));
    }, [processedData, realSystemSize, calibrationFactor]);

    const correlationData = useMemo(() => {
        if (processedData.length === 0) return [];

        let sourceData = processedData; // Default: just raw data

        // If BESS is active, run simulation to get Grid Import & SOC
        if (bessKwh > 0) {
            const stats = calculateSystemStats(
                realSystemSize,
                processedData,
                bessKwh,
                bessMaxPower,
                isTouMode,
                isGridCharge,
                { ...params, calibrationFactor },
                techParams
            );
            if (stats.hourlyBatteryData && stats.hourlyBatteryData.length === processedData.length) {
                // Merge simulation results
                sourceData = stats.hourlyBatteryData.map((b, i) => ({
                    ...processedData[i],
                    ...b // Overwrites load/solar with simulation values if needed, adds gridImport, soc
                }));
            }
        }

        // Downsample for scatter plot robustness (max 500 points)
        const step = Math.ceil(sourceData.length / 500);
        return sourceData.filter((_, i) => i % step === 0).map(d => ({
            solar: d.solarUnit ? d.solarUnit * realSystemSize * (calibrationFactor / 100.0) : (d.solar || 0), // Handle both raw and sim formats
            load: d.load,
            gridImport: d.gridImport || 0, // Will be 0 if no BESS or calculated
            soc: d.soc || 0
        }));
    }, [processedData, realSystemSize, calibrationFactor, bessKwh, bessMaxPower, isTouMode, isGridCharge, techParams, params]);



    // --- UPDATE SOLAR METADATA ON LAYER CHANGE ---
    useEffect(() => {
        if (currentSolarLayer) {
            setSolarMetadata(prev => ({ ...prev, ...(currentSolarLayer.meta || {}) }));
        }
    }, [currentSolarLayer]);

    // --- EXPORT ---
    const handleExportExcel = () => {
        if (!customStats || !currentFinance || !window.XLSX) return;
        const summaryData = [
            { ID: 1, Parameter: 'PV Total (Tổng sản lượng PV)', Value: customStats.totalSolarGen, Unit: 'kWh' },
            { ID: 2, Parameter: 'PV Used by Loads (Năng lượng Solar)', Value: customStats.totalUsed, Unit: 'kWh' },
            { ID: 3, Parameter: 'PV Used by Loads %', Value: (customStats.totalUsed / customStats.totalSolarGen * 100).toFixed(2), Unit: '%' },
            { ID: 4, Parameter: 'PV Curtailed (Cắt giảm)', Value: customStats.totalCurtailed, Unit: 'kWh' },
            { ID: 5, Parameter: 'PV Curtailed %', Value: (customStats.curtailmentRate * 100).toFixed(2), Unit: '%' },
            { ID: 6, Parameter: 'Grid Import (Mua lưới)', Value: customStats.gridImport, Unit: 'kWh' },
            { ID: 7, Parameter: 'Load Consumption (Tổng tải)', Value: customStats.totalLoad, Unit: 'kWh' },
            { ID: 8, Parameter: 'Loss Percent (Tổng tổn thất)', Value: estimatedLosses.systemLossPct.toFixed(2), Unit: '%' },
            { ID: 9, Parameter: 'PV Used (Giờ Bình thường)', Value: customStats.usedNormal, Unit: 'kWh' },
            { ID: 10, Parameter: 'PV Used (Giờ BT) %', Value: customStats.totalUsed > 0 ? (customStats.usedNormal / customStats.totalUsed * 100).toFixed(2) : 0, Unit: '%' },
            { ID: 11, Parameter: 'PV Used (Giờ Cao điểm)', Value: customStats.usedPeak, Unit: 'kWh' },
            { ID: 12, Parameter: 'PV Used (Giờ CĐ) %', Value: customStats.totalUsed > 0 ? (customStats.usedPeak / customStats.totalUsed * 100).toFixed(2) : 0, Unit: '%' },
            { ID: 13, Parameter: 'PV Curtailed (Giờ Bình thường)', Value: customStats.curtailedNormal, Unit: 'kWh' },
            { ID: 14, Parameter: 'PV Curtailed (Giờ BT) %', Value: customStats.totalCurtailed > 0 ? (customStats.curtailedNormal / customStats.totalCurtailed * 100).toFixed(2) : 0, Unit: '%' },
            { ID: 15, Parameter: 'PV Curtailed (Giờ Cao điểm)', Value: customStats.curtailedPeak, Unit: 'kWh' },
            { ID: 16, Parameter: 'PV Curtailed (Giờ CĐ) %', Value: customStats.totalCurtailed > 0 ? (customStats.curtailedPeak / customStats.totalCurtailed * 100).toFixed(2) : 0, Unit: '%' },

        ];
        const monthlyData = monthlyDetails.map(m => ({ Thang: m.month, Solar: m.solar, Load: m.load, Used: m.used, Import: m.gridImport, Curtailment: m.curtailed, Peak_Used: m.usedPeak, Peak_Curtailed: m.curtailedPeak }));
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(summaryData), "Tong_Quan_Ky_Thuat");
        window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(monthlyData), "Chi_Tiet_Thang");
        window.XLSX.writeFile(wb, `Solar_Report_Tech_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    // --- COMPONENT LEVEL EXPORT HANDLERS ---
    const handleDownloadImage = async (elementId, fileName) => {
        const node = document.getElementById(elementId);
        if (!node) return;
        try {
            const dataUrl = await htmlToImage.toPng(node, { backgroundColor: '#ffffff', pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `${fileName}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Download image failed', error);
        }
    };

    const handleDownloadExcelTable = (data, fileName, sheetName) => {
        if (!window.XLSX) { alert("Thư viện Excel chưa tải xong. Vui lòng đợi."); return; }
        // Format data based on type
        const exportData = data.map(item => {
            if (item.label) return { 'Thông số': item.label, 'Giá trị': item.value, 'Đơn vị': item.unit };
            if (item.month) return { 'Tháng': item.month, 'PV Yield (kWh)': item.solar, 'Load (kWh)': item.load, 'Tự dùng (kWh)': item.used, 'Tự dùng (%)': item.solar > 0 ? ((item.used / item.solar) * 100).toFixed(1) + '%' : '0%' };
            return item;
        });
        const ws = window.XLSX.utils.json_to_sheet(exportData);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, sheetName || "Sheet1");
        window.XLSX.writeFile(wb, `${fileName}.xlsx`);
    };


    const handleExportPDF = async () => {
        if (!processedData || !htmlToImage || !jsPDF) { alert('Thu vien chua tai xong. Vui long doi 1 lat.'); return; }
        setShowExportSettings(false); setIsExporting(true);

        // Allow UI to render the hidden report sections
        setTimeout(async () => {
            try {
                console.log('Starting PDF generation (5 Pages)...');
                const doc = new jsPDF('p', 'mm', 'a4');
                const pageWidth = doc.internal.pageSize.getWidth();
                let isFirstPage = true;

                const addSectionToPdf = async (elementId) => {
                    try {
                        const element = document.getElementById(elementId);
                        if (!element) {
                            console.warn(`Element ${elementId} not found`);
                            return;
                        }
                        // Check if element has content
                        if (element.clientHeight === 0) {
                            console.warn(`Element ${elementId} is empty`);
                            return;
                        }

                        console.log(` capturing ${elementId}...`);
                        const dataUrl = await htmlToImage.toPng(element, {
                            quality: 0.95,
                            backgroundColor: '#ffffff',
                            skipAutoScale: true,
                            cacheBust: true,
                            style: { visibility: 'visible' }
                        });

                        const imgProps = doc.getImageProperties(dataUrl);
                        const pdfWidth = pageWidth - 20; // 10mm margin
                        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                        if (!isFirstPage) doc.addPage();
                        doc.addImage(dataUrl, 'PNG', 10, 10, pdfWidth, pdfHeight);
                        isFirstPage = false;
                    } catch (secErr) {
                        console.error(`Error adding section ${elementId}:`, secErr);
                    }
                };

                // PAGE 1: Overview
                if (exportConfig.overview) {
                    await new Promise(r => setTimeout(r, 800));
                    await addSectionToPdf('report-page-1');
                }

                // PAGE 2: System Config & Dispatch
                if (exportConfig.systemConfig || exportConfig.energyDispatch) {
                    await new Promise(r => setTimeout(r, 600));
                    await addSectionToPdf('report-page-2');
                }

                // PAGE 3: Charts (Daily, Correlation, Power Curves)
                if (exportConfig.dailyCharts || exportConfig.correlation || exportConfig.powerCurves) {
                    await new Promise(r => setTimeout(r, 600));
                    await addSectionToPdf('report-page-3');
                }

                // PAGE 4: Data Tables
                if (exportConfig.monthlyTable || exportConfig.detailedSpecs) {
                    await new Promise(r => setTimeout(r, 600));
                    await addSectionToPdf('report-page-4');
                }

                // PAGE 5: Financials
                if (exportConfig.cashFlow || exportConfig.cashFlowTable || exportConfig.investmentAnalysis) {
                    await new Promise(r => setTimeout(r, 600));
                    await addSectionToPdf('report-page-5');
                }

                console.log('Saving PDF...');
                const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
                const fileName = `Solar_Report_Full_${dateStr}.pdf`;

                const pdfBuffer = doc.output('arraybuffer');
                const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.setAttribute('download', fileName);
                document.body.appendChild(a);
                a.click();

                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 2000);
            } catch (err) {
                console.error("PDF Generate Error:", err);
                alert("Lỗi tạo PDF: " + err.message);
            } finally {
                setIsExporting(false);
            }
        }, 1500);
    };

    if (processedData.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
                <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shadow-sm"><div className="flex items-center gap-2"><div className="bg-emerald-600 p-1.5 rounded-lg"><Sun className="text-white" size={20} /></div><span className="font-bold text-lg text-slate-800 tracking-tight">SolarOptimizer <span className="text-emerald-600">Pro</span></span></div></div>
                <div className="flex-1 flex items-center justify-center p-6"><div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center"><div className="space-y-6"><h1 className="text-4xl font-extrabold text-slate-900 leading-tight">Tối ưu hóa hệ thống <br /><span className="text-emerald-600">Điện mặt trời</span> của bạn</h1><p className="text-lg text-slate-500">Công cụ phân tích dữ liệu Load Profile tải tiêu thụ, mô phỏng năng suất PV và đề xuất cấu hình Inverter/BESS tối ưu nhất cho doanh nghiệp.</p><div className="space-y-4 pt-4"><button onClick={() => fileInputRef.current.click()} disabled={isProcessing || libStatus !== 'ready'} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition active:scale-95 disabled:bg-slate-300">{isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Upload size={18} />} {libStatus !== 'ready' ? 'Đang tải thư viện...' : 'Chọn file Load Profile'}</button><input type="file" ref={fileInputRef} accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={handleFileUpload} onClick={(e) => e.target.value = null} /></div>{errorMsg && (<div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-3"><AlertCircle size={20} /> {errorMsg}</div>)}</div><div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 relative overflow-hidden"><div className="absolute top-0 right-0 p-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div><div className="relative z-10 space-y-4"><div className="h-32 bg-slate-50 rounded-lg border border-slate-100 flex items-end justify-around pb-2 px-2">{[40, 65, 45, 80, 55, 70, 60].map((h, i) => (<div key={i} className="w-6 bg-emerald-500 rounded-t-sm opacity-80" style={{ height: `${h}%` }}></div>))}</div><div className="grid grid-cols-3 gap-3">{[{ icon: Sun, l: 'Solar' }, { icon: Zap, l: 'Load' }, { icon: Coins, l: 'ROI' }].map((item, i) => (<div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-center"><item.icon size={20} className="text-slate-500 mb-1" /><span className="text-xs font-bold text-slate-700">{item.l}</span></div>))}</div></div></div></div></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 overflow-hidden relative">
            {showExportSettings && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800 text-lg">Tùy chọn xuất PDF</h3><button onClick={() => setShowExportSettings(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            <p className="text-sm text-slate-500 mb-2">Chọn các phần bạn muốn đưa vào báo cáo:</p>
                            <div onClick={() => toggleExportConfig('overview')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.overview ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Tổng quan & Sản lượng tháng</span></div>
                            <div onClick={() => toggleExportConfig('systemConfig')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.systemConfig ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Cấu hình hệ thống & Kịch bản</span></div>
                            <div className="h-px bg-slate-100 my-2"></div>
                            <div onClick={() => toggleExportConfig('dailyCharts')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.dailyCharts ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Biểu đồ ngày & Tuần</span></div>
                            <div onClick={() => toggleExportConfig('energyDispatch')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.energyDispatch ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Biểu đồ Điều độ Năng lượng (Mới)</span></div>
                            <div onClick={() => toggleExportConfig('correlation')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.correlation ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Biểu đồ tương quan</span></div>
                            <div onClick={() => toggleExportConfig('monthlyTable')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.monthlyTable ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Bảng số liệu tháng</span></div>
                            <div className="h-px bg-slate-100 my-2"></div>
                            <div onClick={() => toggleExportConfig('powerCurves')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.powerCurves ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Power Curve 12 tháng</span></div>
                            <div onClick={() => toggleExportConfig('detailedSpecs')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.detailedSpecs ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Thông số chi tiết</span></div>
                            <div className="h-px bg-slate-100 my-2"></div>
                            <div onClick={() => toggleExportConfig('cashFlow')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.cashFlow ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Biểu đồ dòng tiền (Cash Flow)</span></div>
                            <div onClick={() => toggleExportConfig('cashFlowTable')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.cashFlowTable ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Bảng chi tiết dòng tiền</span></div>
                            <div onClick={() => toggleExportConfig('investmentAnalysis')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.investmentAnalysis ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Phân tích hiệu quả đầu tư</span></div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowExportSettings(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition">Đóng</button>
                            <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition">{isExporting ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />} Xuất PDF</button>
                        </div>
                    </div>
                </div>
            )}

            {showFormulaModal && <FormulaModal onClose={() => setShowFormulaModal(false)} />}

            {isExporting && customStats && (
                <div style={{ position: 'fixed', top: 0, left: '-10000px', width: '1000px', background: 'white', fontFamily: 'Arial, Helvetica, sans-serif' }}>

                    {/* PAGE 1: OVERVIEW */}
                    {/* PAGE 1: OVERVIEW & CONFIG & DISPATCH */}
                    <div id="report-page-1" className="p-8 h-full bg-white flex flex-col justify-start gap-4">
                        <div className="relative h-24 w-full shrink-0"><div className="absolute left-0 top-0 h-full flex items-start pt-2 max-w-[200px]"><img src={casLogo} className="max-h-16 w-auto object-contain" alt="CAS Logo" /></div><div className="w-full h-full flex flex-col justify-start items-center pt-2 pointer-events-none"><h1 className="text-3xl font-bold text-blue-900 mb-1 uppercase text-center leading-tight">Báo Cáo Tính Toán<br />Công Suất Lắp Đặt</h1><p className="text-sm text-slate-500 italic">Ngày báo cáo: {new Date().toLocaleDateString('vi-VN')}</p></div></div>

                        {/* 1. Overview */}
                        {exportConfig.overview && (
                            <div className="mb-2 shrink-0"><h2 className="text-lg font-bold text-blue-800 border-b border-blue-200 pb-1 mb-2">1. Tổng quan Hiệu quả Kỹ thuật</h2>
                                <div className="grid grid-cols-3 gap-3 mb-2">
                                    <StatCard icon={Sun} label="Sản lượng PV" value={formatNumber(customStats.totalSolarGen / 1000)} unit="MWh/năm" colorClass="text-emerald-600" />
                                    <StatCard icon={Zap} label="Năng lượng Solar" value={formatNumber(customStats.totalUsed / 1000)} unit="MWh/năm" colorClass="text-blue-600" />
                                    <StatCard icon={Grid3X3} label="Từ Lưới" value={formatNumber(customStats.gridImport / 1000)} unit="MWh/năm" colorClass="text-slate-600" />
                                </div>
                                <div className="h-48 w-full border border-slate-300 rounded p-2 mb-2"><h3 className="text-xs font-bold text-slate-600 mb-1 text-center">Cân bằng Năng lượng Hàng tháng</h3>
                                    <ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyDetails} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: 'Arial' }} /><YAxis tick={{ fontSize: 9, fontFamily: 'Arial' }} /><Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'Arial' }} /><Bar dataKey="used" stackId="a" name="Năng lượng Solar" fill="#10b981" isAnimationActive={false} /><Bar dataKey="gridImport" stackId="a" name="Mua lưới" fill="#94a3b8" isAnimationActive={false} /><Line type="monotone" dataKey="solar" stroke="#f59e0b" strokeWidth={2} dot={false} name="Solar Yield" isAnimationActive={false} /></BarChart></ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* 2. System Config (Moved from Page 2) */}
                        {exportConfig.systemConfig && (
                            <div className="grid grid-cols-1 gap-4 shrink-0">
                                <div><h2 className="text-lg font-bold text-blue-800 border-b border-blue-200 pb-1 mb-2">2. Cấu hình Kỹ thuật Sơ bộ</h2>
                                    <div className="bg-slate-50 p-2 rounded border border-slate-300">
                                        <table className="w-full text-xs text-left">
                                            <tbody>
                                                <tr className="border-b border-slate-200">
                                                    <td className="py-2 font-bold text-slate-500 w-1/3">CÔNG SUẤT PV (DC)</td>
                                                    <td className="py-2 font-bold text-blue-700 text-sm">{realSystemSize} kWp</td>
                                                </tr>
                                                <tr className="border-b border-slate-200">
                                                    <td className="py-2 font-bold text-slate-500">TẤM PIN (PANEL)</td>
                                                    <td className="py-2">
                                                        <div className="font-semibold text-slate-800">{PANEL_SPECS.model}</div>
                                                        <div className="text-[10px] text-slate-500">Số lượng: {totalPanels} tấm • Công suất: {PANEL_SPECS.power}Wp</div>
                                                    </td>
                                                </tr>
                                                <tr className="border-b border-slate-200">
                                                    <td className="py-2 font-bold text-slate-500">BIẾN TẦN (INVERTER)</td>
                                                    <td className="py-2">
                                                        {inv1Qty > 0 && <div className="font-semibold text-slate-800">{inv1Qty} x {inv1?.name.split(' ').slice(1).join(' ')} ({inv1?.acPower}kW)</div>}
                                                        {inv2Qty > 0 && <div className="font-semibold text-slate-800 mt-1">{inv2Qty} x {inv2?.name.split(' ').slice(1).join(' ')} ({inv2?.acPower}kW)</div>}
                                                        <div className="text-[10px] text-slate-500 mt-0.5">Tỷ lệ DC/AC: {(realSystemSize / techParams.inverterMaxAcKw).toFixed(2)}</div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 font-bold text-slate-500">LƯU TRỮ (BESS)</td>
                                                    <td className="py-2">
                                                        {bessKwh > 0 ? (
                                                            <>
                                                                <div className="font-semibold text-emerald-700">{formatNumber(bessKwh)} kWh</div>
                                                                <div className="text-[10px] text-slate-500">{selectedBessModel?.name} • Công suất xả: {bessMaxPower}kW</div>
                                                            </>
                                                        ) : <span className="text-slate-400 italic">Không sử dụng</span>}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Detailed Scenarios (Moved from Page 4) */}
                        {exportConfig.detailedSpecs && (
                            <div className="w-full mt-4">
                                <h2 className="text-lg font-bold text-blue-800 border-b border-blue-200 pb-1 mb-3">3. Phân tích Năng lượng theo Kịch bản</h2>
                                <table className="w-full text-xs text-left border border-slate-300">
                                    <thead className="bg-slate-100 font-bold text-slate-700">
                                        <tr>
                                            <th rowSpan={2} className="p-2 border border-slate-300">Kịch bản</th>
                                            <th colSpan={2} className="p-2 border border-slate-300 text-center bg-blue-50 text-blue-700 border-b">Tự dùng (Self-Use)</th>
                                            <th colSpan={2} className="p-2 border border-slate-300 text-center bg-amber-50 text-amber-700 border-b">Dư thừa (Export/Curtail)</th>
                                        </tr>
                                        <tr>
                                            <th className="p-2 border border-slate-300 text-center text-blue-600">Cao điểm</th>
                                            <th className="p-2 border border-slate-300 text-center text-blue-600">Bình thường</th>
                                            <th className="p-2 border border-slate-300 text-center text-amber-600">Cao điểm</th>
                                            <th className="p-2 border border-slate-300 text-center text-amber-600">Bình thường</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {scenarios.map((s, i) => (
                                            <tr key={i} className={`hover:bg-slate-50 transition border-b border-slate-200 ${targetKwp === s.kwp ? 'bg-indigo-50 font-medium' : ''}`}>
                                                <td className="p-2 border border-slate-300 font-medium">{s.label} ({s.kwp} kWp)</td>
                                                <td className="p-2 border border-slate-300 text-right text-blue-700">{formatNumber(s.stats.usedPeak)}</td>
                                                <td className="p-2 border border-slate-300 text-right text-blue-700">{formatNumber(s.stats.usedNormal)}</td>
                                                <td className="p-2 border border-slate-300 text-right text-amber-700">{formatNumber(s.stats.curtailedPeak + (s.stats.exportedPeak || 0))}</td>
                                                <td className="p-2 border border-slate-300 text-right text-amber-700">{formatNumber(s.stats.curtailedNormal + (s.stats.exportedNormal || 0))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 4. Daily Charts (Moved from Page 3) */}
                        {exportConfig.dailyCharts && (
                            <div className="w-full shrink-0 mt-4">
                                <h2 className="text-lg font-bold text-blue-800 border-b border-blue-200 pb-1 mb-3">4. Biểu đồ Ngày điển hình</h2>
                                <div className="h-64 border border-slate-300 rounded p-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={averageDayData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="hour" tick={{ fontSize: 9, fontFamily: 'Arial' }} />
                                            <YAxis tick={{ fontSize: 9, fontFamily: 'Arial' }} />
                                            <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'Arial' }} />
                                            <Area type="monotone" dataKey="weekday" stroke="#3b82f6" fillOpacity={0.1} fill="#3b82f6" name="Load (Mon-Sat)" isAnimationActive={false} />
                                            <Area type="monotone" dataKey="weekend" stroke="#ef4444" fillOpacity={0.1} fill="#ef4444" name="Load (Sun)" isAnimationActive={false} />
                                            <Area type="monotone" dataKey="solarProfile" stroke="#f59e0b" fillOpacity={0.1} fill="#f59e0b" name="Solar Profile" strokeWidth={2} isAnimationActive={false} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}



                        {/* 5. Energy Dispatch (Moved TO PAGE 2) */}

                    </div>

                    {/* PAGE 2: SYSTEM CONFIG & DISPATCH */}
                    {/* (Actually Page 2 has only headers removed, and logic is moved out, effectively empty div if headers gone? No, headers were removed, but div remains. Let's keep structure clean.) */}
                    <div id="report-page-2" className="p-8 h-full bg-white flex flex-col justify-start gap-6">


                        {/* 2. System Config */}




                        {/* 5. Correlation (Moved from Page 3) */}


                        {/* 6. Monthly Energy Overview (Moved from Page 4) */}
                        {exportConfig.monthlyTable && (
                            <div className="w-full mb-6">
                                <h2 className="text-lg font-bold text-blue-800 border-b border-blue-200 pb-1 mb-3">5. Tổng quan năng lượng hàng tháng</h2>
                                <div className="h-64 w-full border border-slate-300 rounded p-2 mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={monthlyDetails}>
                                            <defs>
                                                <linearGradient id="colorUsedReport" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.8} /><stop offset="100%" stopColor="#059669" stopOpacity={0.8} /></linearGradient>
                                                <linearGradient id="colorCurtailedReport" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} /><stop offset="100%" stopColor="#b91c1c" stopOpacity={0.8} /></linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: 'Arial' }} stroke="#94a3b8" />
                                            <YAxis tick={{ fontSize: 9, fontFamily: 'Arial' }} stroke="#94a3b8" tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                                            <Legend wrapperStyle={{ paddingTop: '5px', fontSize: '10px', fontFamily: 'Arial' }} />
                                            <Bar dataKey="used" stackId="solar" name="Năng lượng Solar (Sử dụng)" fill="url(#colorUsedReport)" isAnimationActive={false} />
                                            <Bar dataKey="curtailed" stackId="solar" name="Cắt giảm (Dư thừa)" fill="url(#colorCurtailedReport)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                                            <Line type="monotone" dataKey="load" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, strokeWidth: 1 }} name="Tổng Tải (Load)" isAnimationActive={false} />
                                            <Area type="monotone" dataKey="gridImport" fill="#64748b" stroke="#64748b" fillOpacity={0.1} strokeDasharray="5 5" strokeWidth={2} name="Mua lưới (Import)" isAnimationActive={false} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}



                        {/* 6. Energy Dispatch & Correlation (Dynamic Slot) */}
                        {bessKwh > 0 ? (
                            exportConfig.energyDispatch && (
                                <div className="w-full shrink-0">
                                    <h2 className="text-lg font-bold text-blue-800 border-b border-blue-200 pb-1 mb-3">6. Biểu đồ Điều độ Năng lượng (BESS)</h2>
                                    <div className="h-56 border border-slate-300 rounded p-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={averageDayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorSolarBessReport2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                                                    <linearGradient id="colorLoadDispatchReport2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="hour" tick={{ fontSize: 9, fontFamily: 'Arial' }} />
                                                <YAxis tick={{ fontSize: 9, fontFamily: 'Arial' }} />
                                                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'Arial' }} />
                                                <Area type="monotone" dataKey="solarProfile" name="Solar" fill="url(#colorSolarBessReport2)" stroke="#f59e0b" strokeWidth={2} isAnimationActive={false} />
                                                <Bar dataKey="avgBessCharge" name="BESS Sạc" fill="#10b981" barSize={20} stackId="bess" isAnimationActive={false} />
                                                <Bar dataKey="avgBessDischarge" name="BESS Xả" fill="#f43f5e" barSize={20} stackId="bess" isAnimationActive={false} />
                                                <Area type="monotone" dataKey="avgLoad" name="Phụ tải (Load)" stroke="#3b82f6" strokeWidth={3} fill="url(#colorLoadDispatchReport2)" dot={false} isAnimationActive={false} />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic mt-1 text-center">* Biểu đồ hiển thị hoạt động Sạc/Xả của pin lưu trữ theo giờ trong ngày điển hình</p>
                                </div>
                            )
                        ) : (
                            exportConfig.correlation && (
                                <div className="w-full shrink-0">
                                    <h2 className="text-lg font-bold text-blue-800 border-b border-blue-200 pb-1 mb-3">6. Tương quan Load - Solar</h2>
                                    <div className="h-56 border border-slate-300 rounded p-2"><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" dataKey="solar" name="Solar" unit="kW" tick={{ fontSize: 9, fontFamily: 'Arial' }} /><YAxis type="number" dataKey="load" name="Load (Observed)" unit="kW" tick={{ fontSize: 9, fontFamily: 'Arial' }} /><Scatter name="Correlation" data={correlationData} fill="#3b82f6" fillOpacity={0.6} isAnimationActive={false} /></ScatterChart></ResponsiveContainer></div>
                                </div>
                            )
                        )}



                        {/* 7. Power Curves (Moved to Page 2) */}
                        {exportConfig.powerCurves && (
                            <div className="w-full shrink-0 mt-4">
                                <h2 className="text-lg font-bold text-blue-800 border-b border-blue-200 pb-1 mb-3">7. Power Curves (12 Tháng)</h2>
                                <div className="grid grid-cols-4 gap-4">
                                    {monthlyPowerCurves.map((mItem, idx) => (
                                        <div key={idx} className="border border-slate-300 rounded p-2 bg-slate-50 h-48">
                                            <div className="text-xs font-bold text-slate-500 mb-1 text-center uppercase">{mItem.month}</div>
                                            <div className="h-32 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={mItem.data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id={`colorWeekdaySmallRp-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                            </linearGradient>
                                                            <linearGradient id={`colorWeekendSmallRp-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                            </linearGradient>
                                                            <linearGradient id={`colorSolarSmallRp-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                        <XAxis dataKey="hour" tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} interval={6} tickFormatter={(val) => `${val}h`} />
                                                        <YAxis tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} width={25} tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                                                        <Area type="monotone" dataKey="weekday" stroke="#3b82f6" strokeWidth={1.5} fill={`url(#colorWeekdaySmallRp-${idx})`} dot={false} isAnimationActive={false} />
                                                        <Area type="monotone" dataKey="weekend" stroke="#ef4444" strokeWidth={1.5} fill={`url(#colorWeekendSmallRp-${idx})`} dot={false} strokeDasharray="3 3" isAnimationActive={false} />
                                                        <Area type="monotone" dataKey="solar" stroke="#eab308" strokeWidth={1.5} fill={`url(#colorSolarSmallRp-${idx})`} dot={false} isAnimationActive={false} />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="flex justify-center items-center gap-2 mt-1 w-full text-[9px] text-slate-500">
                                                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> T2-T7</div>
                                                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> CN</div>
                                                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div> Solar</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>




                    {/* PAGE 3: MONTHLY DATA (Was Page 4) */}
                    <div id="report-page-4" className="p-8 h-full bg-white flex flex-col justify-start gap-6">


                        {/* 7. Detailed Table */}




                        {/* 8. Detailed Specs (Renumbered) */}
                        {/* 8. Financials (Moved to Page 3) */}
                        <div className="w-full mt-4">
                            <h2 className="text-lg font-bold text-blue-800 border-b border-blue-200 pb-1 mb-3">8. Phân tích Dòng tiền</h2>
                            {exportConfig.cashFlow && currentFinance && (
                                <div className="w-full shrink-0 mb-4">
                                    <h3 className="font-bold text-blue-800 mb-2">Biểu đồ Dòng tiền (Tích lũy)</h3>
                                    <div className="h-64 border border-slate-300 rounded p-2"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={currentFinance.cumulativeData} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" tick={{ fontSize: 9, fontFamily: 'Arial' }} /><YAxis yAxisId="left" tick={{ fontSize: 9, fontFamily: 'Arial' }} width={50} tickFormatter={(val) => Math.abs(val) >= 1e9 ? `${(val / 1e9).toFixed(1)} Tỷ` : Math.abs(val) >= 1e6 ? `${(val / 1e6).toFixed(0)} Tr` : val} label={{ value: 'Dòng tiền', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: '#64748b' } }} />
                                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fontFamily: 'Arial' }} width={50} tickFormatter={(val) => Math.abs(val) >= 1e9 ? `${(val / 1e9).toFixed(1)} Tỷ` : Math.abs(val) >= 1e6 ? `${(val / 1e6).toFixed(0)} Tr` : val} label={{ value: 'Tích lũy', angle: 90, position: 'insideRight', offset: 10, style: { fontSize: 10, fill: '#64748b' } }} /><Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'Arial', paddingTop: '5px' }} /><ReferenceLine yAxisId="left" y={0} stroke="#94a3b8" /><Bar yAxisId="left" dataKey="net" name="Dòng tiền ròng" barSize={20} isAnimationActive={false}>{currentFinance.cumulativeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.net >= 0 ? '#3b82f6' : '#ef4444'} />))}</Bar><Line yAxisId="right" type="monotone" dataKey="acc" name="Tích lũy" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} /></ComposedChart></ResponsiveContainer></div>

                                    {/* Financial Table - Exact Dashboard Match */}
                                    <div className="mt-4 border rounded-lg border-slate-300">
                                        <table className="w-full text-[9px] text-left">
                                            <thead className="bg-slate-50 font-bold text-slate-600"><tr><th className="p-1 border-b border-slate-300 w-16">Năm</th><th className="p-1 border-b border-slate-300 text-right">Doanh thu</th><th className="p-1 border-b border-slate-300 text-right">Chi phí O&M</th><th className="p-1 border-b border-slate-300 text-right">Thay pin</th><th className="p-1 border-b border-slate-300 text-right text-blue-700">Dòng tiền</th><th className="p-1 border-b border-slate-300 text-right text-green-700">Tích lũy</th></tr></thead>
                                            <tbody>
                                                {currentFinance.cumulativeData.map((y, i) => (
                                                    <tr key={i} className={`hover:bg-slate-50 border-b border-slate-200 ${y.year === 0 ? 'bg-orange-50' : ''} ${y.isReplacement ? 'bg-red-50' : ''}`}>
                                                        <td className="p-1 font-medium">{y.year === 0 ? 'Năm 0' : `Năm ${y.year}`}</td>
                                                        <td className="p-1 text-right">{formatMoney(y.revenue)}</td>
                                                        <td className="p-1 text-right text-slate-500">{y.year > 0 ? formatMoney(y.om) : '-'}</td>
                                                        <td className="p-1 text-right text-red-500">{y.replace < 0 ? formatMoney(y.replace) : '-'}</td>
                                                        <td className="p-1 text-right font-bold text-blue-700">{formatMoney(y.net)}</td>
                                                        <td className={`p-1 text-right font-bold ${y.acc >= 0 ? 'text-green-600' : 'text-orange-600'}`}>{formatMoney(y.acc)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {exportConfig.investmentAnalysis && (
                                <div className="w-full shrink-0 mt-4">
                                    <h3 className="font-bold text-blue-800 mb-2">Chỉ số Hiệu quả Đầu tư</h3>
                                    <div className="grid grid-cols-4 gap-4 mb-4">
                                        <div className="p-3 bg-slate-50 border border-slate-300 rounded text-center"><div className="text-xs text-slate-500 uppercase">NPV</div><div className="text-lg font-bold text-emerald-600">{formatMoney(currentFinance.npv)}</div></div>
                                        <div className="p-3 bg-slate-50 border border-slate-300 rounded text-center"><div className="text-xs text-slate-500 uppercase">IRR</div><div className="text-lg font-bold text-blue-600">{currentFinance.irr.toFixed(1)}%</div></div>
                                        <div className="p-3 bg-slate-50 border border-slate-300 rounded text-center"><div className="text-xs text-slate-500 uppercase">Payback</div><div className="text-lg font-bold text-slate-800">{currentFinance.payback.toFixed(1)} Năm</div></div>
                                        <div className="p-3 bg-slate-50 border border-slate-300 rounded text-center"><div className="text-xs text-slate-500 uppercase">ROI</div><div className="text-lg font-bold text-indigo-600">{((currentFinance.npv / currentFinance.initialCapex) * 100).toFixed(0)}%</div></div>
                                    </div>

                                    {/* Detailed Investment Scenarios Table */}
                                    <h3 className="font-bold text-blue-800 mb-2 mt-4">So sánh Kịch bản Đầu tư</h3>
                                    <table className="w-full text-xs text-left border border-slate-300">
                                        <thead className="bg-slate-100 font-bold text-slate-700">
                                            <tr>
                                                <th className="p-2 border border-slate-300">Kịch bản</th>
                                                <th className="p-2 border border-slate-300 text-center">Công suất</th>
                                                <th className="p-2 border border-slate-300 text-right">Vốn (CAPEX)</th>
                                                <th className="p-2 border border-slate-300 text-right">TK (Năm 1)</th>
                                                <th className="p-2 border border-slate-300 text-right text-emerald-600">NPV</th>
                                                <th className="p-2 border border-slate-300 text-right text-blue-600">IRR</th>
                                                <th className="p-2 border border-slate-300 text-right">Hoàn vốn</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {scenarios.map((s, i) => (
                                                <tr key={i} className={`border-b border-slate-200 hover:bg-slate-50 ${targetKwp === s.kwp ? 'bg-indigo-50 font-bold' : ''}`}>
                                                    <td className="p-2 border border-slate-300 font-medium">{s.label}</td>
                                                    <td className="p-2 border border-slate-300 text-center">{s.kwp} kWp</td>
                                                    <td className="p-2 border border-slate-300 text-right">{formatMoney(s.capex)}</td>
                                                    <td className="p-2 border border-slate-300 text-right">{formatMoney(s.annualSaving)}</td>
                                                    <td className="p-2 border border-slate-300 text-right text-emerald-600 font-bold">{formatMoney(s.npv)}</td>
                                                    <td className="p-2 border border-slate-300 text-right text-blue-600 font-bold">{s.irr.toFixed(1)}%</td>
                                                    <td className="p-2 border border-slate-300 text-right text-slate-800">{s.paybackYears.toFixed(1)} Năm</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div >


                    {/* PAGE 4: FINANCIALS (Was Page 5) */}
                    <div id="report-page-5" className="p-8 h-full bg-white flex flex-col justify-start gap-6">


                        {/* 8/9. Financials */}
                        <div className="w-full mt-4">
                            <h2 className="text-lg font-bold text-blue-800 border-b border-blue-200 pb-1 mb-3">9. Thông số Kỹ thuật Chi tiết</h2>
                            {customStats && exportConfig.detailedSpecs && (
                                <div className="mt-4 border rounded-lg border-slate-300 overflow-hidden">
                                    <table className="w-full text-[10px] text-left">
                                        <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-300">
                                            <tr>
                                                <th className="p-2 border-r border-slate-300">Thông số</th>
                                                <th className="p-2 border-r border-slate-300 text-right">Giá trị</th>
                                                <th className="p-2 text-center w-16">Đơn vị</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {[
                                                { id: 1, label: 'PV Total (Tổng sản lượng PV)', value: customStats.totalSolarGen, unit: 'kWh' },
                                                { id: 2, label: 'PV Used by Loads (Năng lượng Solar)', value: customStats.totalUsed, unit: 'kWh', highlight: true },
                                                { id: 3, label: 'PV Used %', value: (customStats.totalUsed / customStats.totalSolarGen * 100).toFixed(2), unit: '%' },
                                                { id: 4, label: 'PV Curtailed (Cắt giảm)', value: customStats.totalCurtailed, unit: 'kWh', highlight: true, color: 'text-red-600' },
                                                { id: 5, label: 'PV Curtailed %', value: (customStats.curtailmentRate * 100).toFixed(2), unit: '%' },
                                                { id: 6, label: 'Grid Import (Mua lưới)', value: customStats.gridImport, unit: 'kWh' },
                                                { id: 7, label: 'Load Consumption (Tổng tải)', value: customStats.totalLoad, unit: 'kWh' },
                                                { id: 8, label: 'Loss Percent (Tổng tổn thất)', value: estimatedLosses.systemLossPct.toFixed(2), unit: '%' },
                                                { id: 9, label: 'PV Used (Giờ BT)', value: customStats.usedNormal, unit: 'kWh' },
                                                { id: 10, label: 'PV Used - Giờ BT (%)', value: customStats.usedNormal > 0 ? (customStats.usedNormal / customStats.totalUsed * 100).toFixed(1) : 0, unit: '%' },
                                                { id: 11, label: 'PV Used (Giờ CĐ)', value: customStats.usedPeak, unit: 'kWh' },
                                                { id: 12, label: 'PV Used - Giờ CĐ (%)', value: customStats.usedPeak > 0 ? (customStats.usedPeak / customStats.totalUsed * 100).toFixed(1) : 0, unit: '%' },
                                                { id: 13, label: 'PV Curtailed (Giờ BT)', value: customStats.curtailedNormal, unit: 'kWh' },
                                                { id: 14, label: 'PV Curtailed - Giờ BT (%)', value: customStats.curtailedNormal > 0 ? (customStats.curtailedNormal / customStats.totalCurtailed * 100).toFixed(1) : 0, unit: '%' },
                                                { id: 15, label: 'PV Curtailed (Giờ CĐ)', value: customStats.curtailedPeak, unit: 'kWh' },
                                                { id: 16, label: 'PV Curtailed - Giờ CĐ (%)', value: customStats.curtailedPeak > 0 ? (customStats.curtailedPeak / customStats.totalCurtailed * 100).toFixed(1) : 0, unit: '%' },
                                            ].map((row, idx) => (
                                                <tr key={row.id} className={`hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                    <td className="p-2 text-slate-700 border-r border-slate-300 font-medium">{row.label}</td>
                                                    <td className={`p-2 font-bold text-right border-r border-slate-300 ${row.highlight ? 'text-blue-700' : 'text-slate-800'} ${row.color || ''}`}>{typeof row.value === 'number' ? formatNumber(row.value) : row.value}</td>
                                                    <td className="p-2 text-slate-500 text-center">{row.unit}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Monthly Data Table (PDF) */}
                        {exportConfig.detailedSpecs && (
                            <div className="w-full mt-4">
                                <h2 className="text-lg font-bold text-blue-800 border-b border-blue-200 pb-1 mb-3">10. Bảng dữ liệu Solar & Tải hàng tháng</h2>
                                <div className="border rounded-lg border-slate-300 overflow-hidden">
                                    <table className="w-full text-[10px] text-left">
                                        <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-300">
                                            <tr>
                                                <th className="p-2 border-r border-slate-300 text-center">Month</th>
                                                <th className="p-2 border-r border-slate-300 text-right">PV Yield (kWh)</th>
                                                <th className="p-2 border-r border-slate-300 text-right">Load Consumption (kWh)</th>
                                                <th className="p-2 border-r border-slate-300 text-right">Self-consumption (kWh)</th>
                                                <th className="p-2 text-center">Self-consumption Rate %</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {monthlyDetails.map((row, idx) => (
                                                <tr key={idx} className={`hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                    <td className="p-2 text-center border-r border-slate-300 font-medium">{row.month}</td>
                                                    <td className="p-2 text-right border-r border-slate-300">{formatNumber(row.solar)}</td>
                                                    <td className="p-2 text-right border-r border-slate-300">{formatNumber(row.load)}</td>
                                                    <td className="p-2 text-right border-r border-slate-300">{formatNumber(row.used)}</td>
                                                    <td className="p-2 text-center font-bold text-green-600">
                                                        {row.solar > 0 ? ((row.used / row.solar) * 100).toFixed(0) : '0'}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}


            <aside className={`fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-auto md:w-64 shrink-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-16 flex items-center justify-center border-b border-slate-200"><span className="font-bold text-xl tracking-tight text-slate-800">Solar<span className="text-emerald-600">Optimizer</span></span></div>
                <div className="p-4 flex-1 overflow-y-auto space-y-6">
                    <div className="space-y-1">
                        {[{ id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard }, { id: 'design', label: 'Thiết kế & BESS', icon: SlidersHorizontal }, { id: 'finance', label: 'Kịch bản Đầu tư', icon: TrendingUp }, { id: 'report', label: 'Báo cáo chi tiết', icon: ClipboardList }].map(item => (
                            <button key={item.id} onClick={() => { setActiveTab(item.id); if (window.innerWidth < 768) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}><item.icon size={18} /> {item.label}</button>
                        ))}
                    </div>
                    <div className="border-t border-slate-100 pt-4"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Hành động</p>
                        {customStats && (<div className="space-y-2"><button onClick={() => setShowExportSettings(true)} className="w-full flex items-center justify-start gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg text-sm transition font-medium"><Settings size={18} /> Cấu hình Báo cáo</button><button onClick={() => setShowFormulaModal(true)} className="w-full flex items-center justify-start gap-3 px-3 py-2.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm transition font-medium"><Calculator size={18} /> Xem Công Thức</button><button onClick={handleExportPDF} disabled={pdfLibStatus !== 'ready' || isExporting} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm transition disabled:bg-slate-400">{isExporting ? <RefreshCw className="animate-spin" size={16} /> : <Printer size={16} />}{isExporting ? 'Đang tạo PDF...' : 'Xuất PDF Báo cáo'}</button></div>)}
                    </div>
                    <div className="border-t border-slate-100 pt-4"><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Dữ liệu đầu vào</p>
                        <div className="space-y-3">
                            <div className="px-3 py-2 bg-slate-50 rounded border border-slate-200 text-sm">
                                <div className="flex justify-between items-center mb-1"><span className="font-medium text-slate-700">Load Profile</span><button onClick={() => fileInputRef.current?.click()} className="text-blue-600 hover:underline text-xs"><RefreshCw size={12} /></button></div><div className="text-xs text-slate-500 truncate">{loadTag.label ? 'Đã tải: ' + loadTag.label : 'Chưa có'}</div>
                            </div>
                            <input type="file" ref={fileInputRef} accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={handleFileUpload} onClick={(e) => e.target.value = null} />

                            <div className={`px-3 py-2 rounded border text-sm ${realSolarProfile ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex justify-between items-center mb-1"><span className="font-medium text-slate-700">Solar Data</span><button onClick={() => solarFileInputRef.current?.click()} className="text-blue-600 hover:underline text-xs"><Upload size={12} /></button></div>
                                <div className="text-xs text-slate-500 truncate" title={solarSourceName}>{solarLayers.length > 0 ? `${solarLayers.length} Layers Found` : (realSolarProfile ? 'Loaded' : 'Default (Sine)')}</div>



                                {/* Layer Selector */}
                                {solarLayers.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                        {solarLayers.length > 1 && (
                                            <>
                                                <label className="text-[10px] text-slate-400 font-bold block mb-1 flex items-center gap-1"><Layers size={10} /> SELECT LAYER</label>
                                                <select
                                                    className="w-full text-[10px] p-1 border rounded bg-white text-slate-700 font-medium"
                                                    value={selectedLayerIndex}
                                                    onChange={(e) => handleLayerChange(Number(e.target.value))}
                                                >
                                                    {solarLayers.map((layer, idx) => (
                                                        <option key={idx} value={idx}>{layer.title} (Sc: {layer.score})</option>
                                                    ))}
                                                </select>
                                            </>
                                        )}
                                        <div className="mt-2 flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="chkInterpolate"
                                                checked={enableInterpolation}
                                                onChange={(e) => setEnableInterpolation(e.target.checked)}
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="chkInterpolate" className="text-[10px] text-slate-600 cursor-pointer select-none">
                                                Làm mượt dữ liệu 30p (Interpolate)
                                            </label>
                                        </div>
                                    </div>
                                )}
                                {solarMetadata && solarMetadata.lat && (<div className="text-[9px] text-slate-400 mt-1 flex gap-1 pt-1 border-t border-slate-100"><MapPin size={10} className="mt-0.5" /> {solarMetadata.siteName ? solarMetadata.siteName.substring(0, 10) : ''} ({solarMetadata.lat.toFixed(2)}, {solarMetadata.lon.toFixed(2)})</div>)}
                                {/* DEBUG BOX */}
                                {debugInfo && <div className="mt-1 p-1 bg-yellow-50 border border-yellow-200 text-[9px] font-mono text-slate-700 h-24 overflow-auto whitespace-pre-wrap">{debugInfo}</div>}
                            </div>
                            <input type="file" ref={solarFileInputRef} accept=".csv,.txt,.xlsx,.xls,.met,.pdf" className="hidden" onChange={handleSolarUpload} onClick={(e) => e.target.value = null} />

                            {/* NEW LOAD TUNING CARD */}
                            <div className="px-3 py-2 bg-indigo-50 rounded border border-indigo-200 text-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-indigo-700 flex items-center gap-1.5"><Wrench size={12} /> Load Tuning</span>
                                    <div className="flex items-center gap-1">
                                        <input type="checkbox" id="chkSimWeekend" checked={simulateWeekend} onChange={(e) => setSimulateWeekend(e.target.checked)} className="rounded-sm w-3 h-3 text-indigo-600 focus:ring-indigo-500" />
                                        <label htmlFor="chkSimWeekend" className="text-[10px] text-indigo-600 font-medium cursor-pointer select-none">Simulate CN</label>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-indigo-500 w-8 text-right">{loadScaling}%</span>
                                    <input type="range" min="50" max="150" step="1" value={loadScaling} onChange={(e) => setLoadScaling(Number(e.target.value))} className="flex-1 h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                                </div>
                            </div>


                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-200 text-[10px] text-slate-400 text-center">v6.8 - Multi-Layer GSA</div>
            </aside >

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 gap-4">
                    <div className="flex items-center gap-3 shrink-0"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">{isSidebarOpen ? <Menu size={20} className="rotate-180" /> : <Menu size={20} />}</button><div className="flex flex-col"><h2 className="font-bold text-slate-800 leading-none">Dashboard</h2>{loadTag.label && <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">{loadTag.label} {loadTag.isWeekendOff && '• Nghỉ CN'}</span>}</div></div>

                    {/* Dynamic Solar Slider (Debounced) */}
                    <div className="hidden md:flex flex-1 max-w-md mx-4 items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                        <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Solar Capacity:</span>
                        <DebouncedSlider targetKwp={targetKwp} setTargetKwp={setTargetKwp} maxKwp={maxKwpRef || 1000} />
                    </div>

                    <div className="flex items-center gap-4">{detectedMaxLoad > 0 && (<div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100"><Maximize size={14} /> Max Load: {formatNumber(detectedMaxLoad)} kW</div>)}<div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100"><Leaf size={14} /> Loss: {estimatedLosses?.systemLossPct?.toFixed(1) || '0.0'}%</div></div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <div className="max-w-6xl mx-auto space-y-6 pb-12">
                        {activeTab === 'dashboard' && (
                            <Dashboard
                                customStats={customStats}
                                formatNumber={formatNumber}
                                params={params}
                                bessKwh={bessKwh}
                                averageDayData={averageDayData}
                                solarMetadata={solarMetadata}
                                correlationData={correlationData}
                                monthlyDetails={monthlyDetails}
                                monthlyPowerCurves={monthlyPowerCurves}
                            />
                        )}

                        {activeTab === 'design' && (
                            <Design
                                inv1Id={inv1Id} setInv1Id={setInv1Id}
                                inv1Qty={inv1Qty} setInv1Qty={setInv1Qty}
                                inv2Id={inv2Id} setInv2Id={setInv2Id}
                                inv2Qty={inv2Qty} setInv2Qty={setInv2Qty}
                                INVERTER_OPTIONS={INVERTER_OPTIONS}
                                totalACPower={totalACPower}
                                targetKwp={targetKwp}
                                handleAutoSelectInverter={handleAutoSelectInverter}
                                techParams={techParams} setTechParams={setTechParams}
                                selectedBess={selectedBess} handleBessSelect={handleBessSelect}
                                BESS_OPTIONS={BESS_OPTIONS}
                                bessKwh={bessKwh} setBessKwh={setBessKwh}
                                bessMaxPower={bessMaxPower} setBessMaxPower={setBessMaxPower}
                                isGridCharge={isGridCharge} setIsGridCharge={setIsGridCharge}
                                params={params} setParams={setParams}
                                finParams={finParams} setFinParams={setFinParams}
                            />
                        )}

                        {activeTab === 'finance' && (
                            <Finance
                                finParams={finParams} setFinParams={setFinParams}
                                bessKwh={bessKwh}
                                currentFinance={currentFinance}
                                formatMoney={formatMoney}
                                scenarios={scenarios}
                                targetKwp={targetKwp} setTargetKwp={setTargetKwp}
                                onSelectScenario={handleSelectScenario}
                            />
                        )}

                        {activeTab === 'report' && customStats && (
                            <Report
                                onSelectScenario={(s) => setTargetKwp(s.kwp)}
                                onShowFormulas={() => setShowFormulaModal(true)}
                                customStats={customStats}
                                scenarios={scenarios}
                                targetKwp={targetKwp}
                                formatNumber={formatNumber}
                                detailedSpecsList={detailedSpecsList}
                                handleDownloadImage={handleDownloadImage}
                                handleDownloadExcelTable={handleDownloadExcelTable}
                                monthlyDetails={monthlyDetails}
                            />
                        )}
                    </div>
                </div>
            </main >
            {showFormulaModal && <FormulaModal onClose={() => setShowFormulaModal(false)} />}
        </div >
    );
};


// Helper Component for Slider
const DebouncedSlider = ({ targetKwp, setTargetKwp, maxKwp }) => {
    const [localKwp, setLocalKwp] = useState(targetKwp);

    useEffect(() => {
        setLocalKwp(targetKwp);
    }, [targetKwp]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localKwp !== targetKwp) {
                setTargetKwp(localKwp);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [localKwp, targetKwp, setTargetKwp]);

    return (
        <>
            <input
                type="range"
                min="1"
                max={maxKwp}
                step="1"
                value={localKwp || 0}
                onChange={(e) => setLocalKwp(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex items-center relative">
                <input
                    type="number"
                    value={localKwp || 0}
                    onChange={(e) => setLocalKwp(Number(e.target.value))}
                    className="w-16 text-center text-sm font-bold text-emerald-700 bg-white border border-slate-300 rounded focus:outline-none focus:border-emerald-500 px-1 py-0.5"
                />
                <span className="text-[10px] text-slate-500 absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap">kWp</span>
            </div>
        </>
    );
};

export default SolarOptimizer;
