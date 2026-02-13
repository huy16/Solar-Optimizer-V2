
import React, { useState, useMemo, useEffect, useRef, useCallback, useDeferredValue } from 'react';

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
import { generateSyntheticProfile } from './utils/loadProfileGenerator';
import { Dashboard } from './presentation/features/dashboard/Dashboard';
import { Design } from './presentation/features/design/Design';
import { Finance } from './presentation/features/finance/Finance';
import { Report } from './presentation/features/report/Report';
import { useSolarSystemData } from './presentation/hooks/useSolarSystemData';
import { useSolarConfiguration, WEATHER_SCENARIOS } from './presentation/hooks/useSolarConfiguration';
import PROVINCES from './data/provinces.json';
import { useFinancialModel } from './presentation/hooks/useFinancialModel';
import { FormulaModal } from './presentation/components/FormulaModal';
import { EVN_TARIFFS } from './data/evn_tariffs';

import { Upload, Sun, BatteryCharging, Zap, FileText, AlertCircle, Settings, Download, Bug, RefreshCw, Calendar, SlidersHorizontal, CloudSun, CheckCircle2, Leaf, Trees, Factory, ArrowDownRight, Info, ShieldCheck, Grid3X3, Lock, Cpu, Server, Target, MousePointerClick, TrendingUp, DollarSign, Wallet, Plus, Minus, ToggleLeft, ToggleRight, Calculator, Table, ClipboardList, Moon, FileSpreadsheet, Hourglass, Clock, Eye, ZapOff, Gauge, MapPin, Maximize, Battery, Briefcase, Sofa, LayoutDashboard, PieChart, ChevronRight, Menu, X, Printer, Image as ImageIcon, Coins, Percent, ArrowUpRight, BarChart3, BarChart2, CheckSquare, Square, Layers, Activity, AlertTriangle, Wrench, Globe, Building2, Landmark, Mountain, Waves, Anchor, Sprout, Castle, Coffee, Fish, Flower2, Plane, Utensils, Music, Medal, Snowflake, Sailboat, Ship } from 'lucide-react';
import { SmartDesignSelector } from './presentation/components/SmartDesignSelector';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { PANEL_SPECS, INVERTER_DB, BESS_DB, INVERTER_OPTIONS, BESS_OPTIONS } from './data/sources/HardwareDatabase';
import casLogoReport from './assets/cas_logo_report.png';
import casLogo from './assets/Logo_CAS_White.png';
import monthlyChartStatic from './assets/monthly_chart_static.png';





// --- CONSTANTS & DATABASE ---
// --- ENVIRONMENTAL CONSTANTS ---
const CO2_KG_PER_KWH = 0.816; // kg CO2 per kWh (Vietnam Grid Emission Factor)
const TREES_PER_CO2_KG = 0.06; // Trees per kg CO2 (approx 16.7kg CO2/tree/year)
const COAL_KG_PER_KWH = 0.4; // kg Standard Coal per kWh saved



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

// --- CUSTOM ICONS ---
const VietnamFlagIcon = ({ size = 24, className, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <rect width="24" height="24" rx="4" fill="#DA251D" />
        <path d="M12 5.5L14.2 9.8L19 10.5L15.5 13.9L16.4 18.5L12 16.2L7.6 18.5L8.5 13.9L5 10.5L9.8 9.8L12 5.5Z" fill="#FFFF00" />
    </svg>
);

const DragonBridgeIcon = ({ size = 24, className, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
        <path d="M2 20h20" />
        <path d="M4 16c2-4 5-5 8-2s5 4 8 0" />
        <path d="M7 16v4" />
        <path d="M17 16v4" />
        <path d="M12 18v2" />
        <circle cx="19" cy="13" r="1.5" />
    </svg>
);


const TeaIcon = ({ size = 24, className, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
);

const ElephantIcon = ({ size = 24, className, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
        <path d="M4 16h16" />
        <path d="M21 16v-4a5 5 0 0 0-5-5h-4l-2-4H6l-2 5" />
        <path d="M9 16V9" />
        <path d="M16 16v-4" />
        <path d="M6 16v3" />
        <path d="M19 16v3" />
        <circle cx="16" cy="10" r="1.5" />
    </svg>
);

const GarlicIcon = ({ size = 24, className, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
        <path d="M12 2C8 2 5 6 5 10c0 4 3 9 7 12 4-3 7-8 7-12 0-4-3-8-7-8z" />
        <path d="M12 22S9 15 9 10" />
        <path d="M12 22s3-7 3-12" />
    </svg>
);

const PineappleIcon = ({ size = 24, className, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
        <path d="M6 10a6 6 0 0 0 12 0" />
        <path d="M12 10v10" />
        <path d="M8 8l-2-4 3 2 3-4 3 4 3-2-2 4" />
        <path d="M9 14l6-4" />
        <path d="M9 18l6-4" />
    </svg>
);

const TempleIcon = ({ size = 24, className, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
        <path d="M4 22h16" />
        <path d="M7 22V10l5-4 5 4v12" />
        <path d="M12 2v4" />
        <circle cx="12" cy="14" r="2" />
    </svg>
);

const IslandIcon = ({ size = 24, className, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
        <path d="M12 22v-9" />
        <path d="M5 13a7 7 0 1 0 14 0" />
        <path d="M12 22a7 7 0 0 0 7-7" />
        <path d="M5 13H2a10 10 0 0 0 20 0h-3" />
        <path d="M8 8l2-4 2 4 2-4 2 4" />
    </svg>
);

// --- PROVINCE STYLING ---
// Helper to wrap Emoji as a component compatible with Lucide Icon interface
const EmojiIcon = ({ emoji, size = 18, className }) => (
    <span style={{ fontSize: size, lineHeight: '1em' }} className={className} role="img" aria-label="icon">
        {emoji}
    </span>
);

const PROVINCE_STYLES = {
    // SPECIAL
    vietnam_average: { icon: VietnamFlagIcon, color: "text-red-600", bg: "bg-red-50" },

    // NORTH
    ha_noi: { icon: (props) => <EmojiIcon emoji="🏛️" {...props} />, color: "text-red-700", bg: "bg-fuchsia-50" }, // Biểu tượng Khuê Văn Các
    hai_phong: { icon: (props) => <EmojiIcon emoji="⚓" {...props} />, color: "text-blue-800", bg: "bg-blue-50" }, // Thành phố Cảng
    quang_ninh: { icon: (props) => <EmojiIcon emoji="🛳️" {...props} />, color: "text-teal-600", bg: "bg-teal-50" }, // Vịnh Hạ Long
    bac_ninh: { icon: (props) => <EmojiIcon emoji="🎶" {...props} />, color: "text-pink-600", bg: "bg-pink-50" }, // Dân ca Quan họ
    bac_giang: { icon: Factory, color: "text-orange-600", bg: "bg-orange-50" },
    hung_yen: { icon: (props) => <EmojiIcon emoji="🍊" {...props} />, color: "text-orange-600", bg: "bg-orange-50" }, // Nhãn lồng
    hai_duong: { icon: Factory, color: "text-slate-600", bg: "bg-slate-50" },
    vinh_phuc: { icon: Factory, color: "text-slate-600", bg: "bg-slate-50" },
    thai_nguyen: { icon: (props) => <EmojiIcon emoji="🍵" {...props} />, color: "text-green-700", bg: "bg-green-50" }, // Đệ nhất danh trà
    lang_son: { icon: (props) => <EmojiIcon emoji="🏯" {...props} />, color: "text-stone-600", bg: "bg-stone-50" }, // Ải Chi Lăng
    cao_bang: { icon: (props) => <EmojiIcon emoji="🌊" {...props} />, color: "text-cyan-700", bg: "bg-cyan-50" }, // Thác Bản Giốc
    ha_giang: { icon: Mountain, color: "text-stone-700", bg: "bg-stone-50" },
    lao_cai: { icon: (props) => <EmojiIcon emoji="❄️" {...props} />, color: "text-sky-400", bg: "bg-sky-50" }, // Sa Pa
    dien_bien: { icon: (props) => <EmojiIcon emoji="🎖️" {...props} />, color: "text-red-600", bg: "bg-red-50" }, // Tượng đài chiến thắng
    son_la: { icon: (props) => <EmojiIcon emoji="🐄" {...props} />, color: "text-green-600", bg: "bg-green-50" }, // Sữa Mộc Châu
    lai_chau: { icon: (props) => <EmojiIcon emoji="🏔️" {...props} />, color: "text-slate-500", bg: "bg-slate-50" }, // Đỉnh Pu Ta Leng
    yen_bai: { icon: Trees, color: "text-emerald-600", bg: "bg-emerald-50" },
    tuyen_quang: { icon: (props) => <EmojiIcon emoji="🏮" {...props} />, color: "text-teal-600", bg: "bg-teal-50" }, // Lễ hội Thành Tuyên
    phu_tho: { icon: (props) => <EmojiIcon emoji="⛩️" {...props} />, color: "text-amber-700", bg: "bg-amber-50" }, // Đền Hùng
    hoa_binh: { icon: Zap, color: "text-blue-600", bg: "bg-blue-50" },
    ninh_binh: { icon: (props) => <EmojiIcon emoji="🛶" {...props} />, color: "text-emerald-800", bg: "bg-emerald-50" }, // Tràng An
    nam_dinh: { icon: Sprout, color: "text-yellow-600", bg: "bg-yellow-50" },
    thai_binh: { icon: Sprout, color: "text-yellow-600", bg: "bg-yellow-50" },
    ha_nam: { icon: Factory, color: "text-slate-600", bg: "bg-slate-50" },

    // CENTRAL
    thanh_hoa: { icon: (props) => <EmojiIcon emoji="🏯" {...props} />, color: "text-blue-600", bg: "bg-blue-50" }, // Thành nhà Hồ
    nghe_an: { icon: (props) => <EmojiIcon emoji="🌻" {...props} />, color: "text-green-600", bg: "bg-green-50" }, // Hoa Hướng Dương/Quê Bác
    ha_tinh: { icon: (props) => <EmojiIcon emoji="⛰️" {...props} />, color: "text-slate-700", bg: "bg-slate-50" }, // Núi Hồng Lĩnh
    quang_binh: { icon: Mountain, color: "text-teal-700", bg: "bg-teal-50" },
    quang_tri: { icon: (props) => <EmojiIcon emoji="🕊️" {...props} />, color: "text-amber-600", bg: "bg-amber-50" }, // Đất lửa/Hòa bình
    hue: { icon: (props) => <EmojiIcon emoji="🏰" {...props} />, color: "text-purple-700", bg: "bg-purple-50" }, // Cố đô
    da_nang: { icon: (props) => <EmojiIcon emoji="🌉" {...props} />, color: "text-amber-600", bg: "bg-amber-50" }, // Cầu Rồng
    quang_nam: { icon: Landmark, color: "text-yellow-700", bg: "bg-yellow-50" },
    quang_ngai: { icon: (props) => <EmojiIcon emoji="🧅" {...props} />, color: "text-purple-500", bg: "bg-purple-50" }, // Tỏi Lý Sơn
    binh_dinh: { icon: Waves, color: "text-cyan-600", bg: "bg-cyan-50" },
    phu_yen: { icon: Fish, color: "text-blue-400", bg: "bg-blue-50" },
    khanh_hoa: { icon: (props) => <EmojiIcon emoji="🏝️" {...props} />, color: "text-teal-500", bg: "bg-teal-50" }, // Nha Trang
    ninh_thuan: { icon: Sun, color: "text-orange-500", bg: "bg-orange-50" },
    binh_thuan: { icon: Sun, color: "text-orange-600", bg: "bg-orange-50" },

    // HIGHLANDS
    kon_tum: { icon: Trees, color: "text-green-800", bg: "bg-green-50" },
    gia_lai: { icon: (props) => <EmojiIcon emoji="🌋" {...props} />, color: "text-emerald-700", bg: "bg-emerald-50" }, // Biển Hồ Pleiku
    dak_lak: { icon: (props) => <EmojiIcon emoji="🐘" {...props} />, color: "text-stone-600", bg: "bg-stone-50" }, // Chú voi Bản Đôn
    dak_nong: { icon: Leaf, color: "text-emerald-600", bg: "bg-emerald-50" },
    lam_dong: { icon: (props) => <EmojiIcon emoji="🌲" {...props} />, color: "text-green-800", bg: "bg-green-50" }, // Đà Lạt

    // SOUTH
    ho_chi_minh: { icon: (props) => <EmojiIcon emoji="🏙️" {...props} />, color: "text-blue-600", bg: "bg-blue-50" }, // Tòa nhà cao tầng
    ba_ria: { icon: Anchor, color: "text-blue-800", bg: "bg-blue-50" },
    binh_duong: { icon: Factory, color: "text-indigo-600", bg: "bg-indigo-50" },
    binh_phuoc: { icon: Trees, color: "text-green-700", bg: "bg-green-50" },
    dong_nai: { icon: (props) => <EmojiIcon emoji="🏭" {...props} />, color: "text-indigo-600", bg: "bg-indigo-50" }, // Công nghiệp
    tay_ninh: { icon: (props) => <EmojiIcon emoji="🕌" {...props} />, color: "text-pink-600", bg: "bg-pink-50" }, // Tòa thánh Cao Đài
    long_an: { icon: Factory, color: "text-orange-500", bg: "bg-orange-50" },
    tien_giang: { icon: Sprout, color: "text-green-500", bg: "bg-green-50" },
    ben_tre: { icon: Trees, color: "text-green-600", bg: "bg-green-50" },
    tra_vinh: { icon: Landmark, color: "text-amber-600", bg: "bg-amber-50" },
    vinh_long: { icon: (props) => <EmojiIcon emoji="🏺" {...props} />, color: "text-orange-400", bg: "bg-orange-50" }, // Làng gốm Mang Thít
    dong_thap: { icon: (props) => <EmojiIcon emoji="🪷" {...props} />, color: "text-pink-500", bg: "bg-pink-50" }, // Xứ sở Sen hồng
    an_giang: { icon: (props) => <EmojiIcon emoji="⛰️" {...props} />, color: "text-emerald-700", bg: "bg-emerald-50" }, // Thất Sơn
    kien_giang: { icon: Anchor, color: "text-cyan-600", bg: "bg-cyan-50" },
    can_tho: { icon: (props) => <EmojiIcon emoji="🍍" {...props} />, color: "text-yellow-600", bg: "bg-yellow-50" }, // Chợ nổi Cái Răng
    hau_giang: { icon: Sprout, color: "text-green-500", bg: "bg-green-50" },
    soc_trang: { icon: Landmark, color: "text-amber-500", bg: "bg-amber-50" },
    bac_lieu: { icon: Zap, color: "text-cyan-700", bg: "bg-cyan-50" },
    ca_mau: { icon: (props) => <EmojiIcon emoji="📍" {...props} />, color: "text-red-700", bg: "bg-red-50" }, // Điểm cực Nam
};

const getProvinceStyle = (id) => {
    if (!id) return { icon: MapPin, color: "text-slate-500", bg: "bg-slate-100" };
    const style = PROVINCE_STYLES[id] || { icon: MapPin, color: "text-slate-500", bg: "bg-slate-100" };
    return style;
};

// --- DATA PREPARATION HELPERS ---

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

    // 2. CONFIG HOOK (Updated)
    const {
        inv1Id, setInv1Id,
        inv1Qty, setInv1Qty,
        inv2Id, setInv2Id,
        inv2Qty, setInv2Qty,
        customInv1Power, setCustomInv1Power,
        customInv2Power, setCustomInv2Power,
        selectedBess, handleBessSelect,
        bessKwh, setBessKwh,
        bessMaxPower, setBessMaxPower,
        isGridCharge, setIsGridCharge,
        params, setParams,
        techParams, setTechParams,
        targetKwp, setTargetKwp,
        handleMagicSuggest,
        handleOptimize,
        handleOptimizeNoBess,
        handleOptimizeBess,
        handleSuggestBessSize,
        handleSuggestSafeCapacity,
        bessStrategy, setBessStrategy,
        weatherScenario, setWeatherScenario,
        handleWeatherChange, // Added missing function
        pricingType, setPricingType,
        voltageLevelId, setVoltageLevelId,
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

    // --- TARIFF CATEGORY STATE (REMOVED - Use pricingType/voltageLevelId from hook) ---
    // const [tariffCategory, setTariffCategory] = useState('retail_manufacturing');
    // const [voltageLevel, setVoltageLevel] = useState('110kv_plus');

    // --- RESTORED LOCAL STATES & REFS ---
    // --- RESTORED LOCAL STATES & REFS ---
    const [scenarios, setScenarios] = useState([]);
    const useTouMode = bessStrategy === 'peak-shaving';
    // --- LOAD TUNING STATE ---
    const [loadScaling, setLoadScaling] = useState(100);
    const [simulateWeekend, setSimulateWeekend] = useState(false);

    const [isSwappedDate, setIsSwappedDate] = useState(false);
    const [calibrationFactor, setCalibrationFactor] = useState(100);
    const [customStats, setCustomStats] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);

    // Province State for Solar Generation
    const [selectedProvince, setSelectedProvince] = useState(PROVINCES.find(p => p.id === 'ho_chi_minh') || PROVINCES[0]);

    // Update Solar Layer when Province changes (If in Manual Mode or Empty)
    useEffect(() => {
        if (!selectedProvince) return;

        // Only auto-generate if we are not locked to a specific uploaded file,
        // OR simply add it as an available layer.
        // Let's add it as a new layer always so user can choose.

        const monthlyGhi = selectedProvince.monthly_distribution || Array(12).fill(selectedProvince.peakSunHours * 30);

        // Generate Synthetic Profile
        const newLayer = generateSolarProfile(monthlyGhi, {
            siteName: selectedProvince.name,
            lat: 0, lon: 0, // Placeholder
            yield_yearly: selectedProvince.yield_yearly
        }, `Standard: ${selectedProvince.name}`)[0];

        setSolarLayers(prev => {
            // Check if this province layer already exists to avoid dupes?
            const exists = prev.find(l => l.title === newLayer.title);
            if (exists) return prev;
            // Add to top
            return [newLayer, ...prev.filter(l => !l.title.startsWith('Standard: '))];
        });
        // Auto-select
        setSelectedLayerIndex(0);

    }, [selectedProvince, setSolarLayers, setSelectedLayerIndex]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (provinceDropdownRef.current && !provinceDropdownRef.current.contains(event.target)) {
                setShowProvinceDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleProvinceChange = useCallback((provinceId) => {
        const province = PROVINCES.find(p => p.id === provinceId);
        if (province) setSelectedProvince(province);
    }, []);




    // Logo removed (using static CAS logo)
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isManualConfig, setIsManualConfig] = useState(false);
    const [projectName, setProjectName] = useState('');

    // Design Mode State
    const [designMode, setDesignMode] = useState(null); // 'profile' or 'manual'
    const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
    const provinceDropdownRef = useRef(null);
    const [lang, setLang] = useState('vi'); // Default language

    const TRANSLATIONS = {
        vi: {
            dashboard: "Tổng quan",
            design: "Thiết kế & BESS",
            finance: "Kịch bản Đầu tư",
            report: "Báo cáo chi tiết",
            project_name: "Tên dự án",
            sidebar_open: "Mở menu",
            sidebar_close: "Đóng menu",
            actions: "Hành động",
            report_config: "Cấu hình Báo cáo",
            view_formulas: "Xem Công Thức",
            export_pdf: "Xuất PDF Báo cáo",
            generating_pdf: "Đang tạo PDF...",
            project_info: "Thông tin Dự án",
            input_data: "Dữ liệu đầu vào",
            load_profile: "Load Profile",
            solar_data: "Dữ liệu Solar",
            load_tuning: "Tinh chỉnh Tải",
            simulate_sun: "Giả lập CN",
            area_province: "Khu vực / Tỉnh thành",
            solar_capacity: "Công suất Solar",
            max_load: "Tải cực đại",
            loss_percent: "Tổn thất",
            interpolate_msg: "Làm mượt dữ liệu 30p (Interpolate)",
            stats: {
                pv_yield: "Sản lượng PV",
                solar_energy: "Năng lượng Solar",
                savings: "Tiết kiệm",
                self_consumption: "Tự dùng",
                efficiency: "Hiệu suất"
            },
            pdf: {
                title: "Báo Cáo Tính Toán Công Suất Lắp Đặt",
                report_date: "Ngày báo cáo",
                tech_overview: "Tổng quan Hiệu quả Kỹ thuật",
                tech_config: "Cấu hình Kỹ thuật Sơ bộ",
                energy_analysis: "Phân tích Năng lượng theo Kịch bản",
                daily_charts: "Biểu đồ Ngày điển hình",
                monthly_overview: "Tổng quan Năng lượng Hàng tháng",
                energy_dispatch: "Biểu đồ Điều độ Năng lượng (BESS)",
                correlation: "Tương quan Load - Solar",
                power_curves: "Power Curves (12 Tháng)",
                pv_capacity: "CÔNG SUẤT PV (DC)",
                panels: "TẤM PIN (PANEL)",
                inverters: "BIẾN TẦN (INVERTER)",
                bess: "LƯU TRỮ (BESS)",
                qty: "Số lượng",
                capacity: "Công suất",
                dc_ac_ratio: "Tỷ lệ DC/AC",
                not_used: "Không sử dụng",
                scenario: "Kịch bản",
                self_use: "Tự dùng (Self-Use)",
                excess: "Dư thừa (Export/Curtail)",
                peak: "Cao điểm",
                normal: "Bình thường",
                solar_yield_chart: "Cân bằng Năng lượng Hàng tháng",
                solar_energy_name: "Năng lượng Solar",
                grid_import_name: "Mua lưới",
                solar_yield_name: "Sản lượng Solar",
                energy_solar_used: "Năng lượng Solar (Sử dụng)",
                curtailed: "Cắt giảm (Dư thừa)",
                total_load: "Tổng Tải (Load)",
                import: "Mua lưới (Import)",
                bess_charge_avg: "BESS Sạc",
                bess_discharge_avg: "BESS Xả",
                dispatch_desc: "* Biểu đồ hiển thị hoạt động Sạc/Xả của pin lưu trữ theo giờ trong ngày điển hình",
                detailed_specs_title: "Thông số Kỹ thuật Chi tiết",
                cash_flow_roi_title: "Phân tích Dòng tiền & ROI",
                financial_chart_title: "Biểu đồ Dòng tiền (Tích lũy)",
                finance_table: {
                    year: "Năm",
                    year_0: "Đầu tư (Năm 0)",
                    revenue: "Doanh thu (Tiết kiệm)",
                    om: "Chi phí O&M",
                    replacement: "Thay thế Thiết bị",
                    net_flow: "Dòng tiền ròng",
                    acc: "Tích lũy"
                },
                payback: "Hoàn vốn",
                roi: "ROI",
                mon_sat: "T2-T7",
                sun: "CN",
                col_month: "Tháng",
                col_solar: "Solar (kWh)",
                col_load: "Load (kWh)",
                col_pv_used: "Tự dùng (kWh)",
                col_self_use_pct: "Tỷ lệ %"
            },
            months: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
            months_short: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
            tech_labels: {
                pv_total: "Tổng sản lượng PV",
                pv_used: "Năng lượng Solar",
                pv_used_pct: "Tỷ lệ sử dụng Solar",
                pv_curtailed: "Cắt giảm (Dư thừa)",
                pv_curtailed_pct: "Tỷ lệ cắt giảm",
                grid_import: "Điện mua lưới",
                total_load: "Tổng Tải (Load)",
                loss_pct: "Tổn thất hệ thống",
                pv_used_normal: "Solar sử dụng (Giờ BT)",
                pv_used_normal_pct: "Tỷ lệ BT",
                pv_used_peak: "Solar sử dụng (Giờ CĐ)",
                pv_used_peak_pct: "Tỷ lệ CĐ",
                curtailed_normal: "Cắt giảm (Giờ BT)",
                curtailed_normal_pct: "Tỷ lệ Cắt giảm BT",
                curtailed_peak: "Cắt giảm (Giờ CĐ)",
                curtailed_peak_pct: "Tỷ lệ Cắt giảm CĐ"
            },
            pdf_config: {
                title: "Tùy chọn xuất PDF",
                desc: "Chọn các phần bạn muốn đưa vào báo cáo:",
                overview: "Tổng quan & Sản lượng tháng",
                system_config: "Cấu hình hệ thống & Kịch bản",
                daily_charts: "Biểu đồ ngày & Tuần",
                energy_dispatch: "Biểu đồ Điều độ Năng lượng (Mới)",
                correlation: "Biểu đồ tương quan",
                monthly_table: "Bảng số liệu tháng",
                power_curves: "Power Curve 12 tháng",
                detailed_specs: "Thông số chi tiết",
                cashflow: "Biểu đồ dòng tiền (Cash Flow)",
                cashflow_table: "Bảng chi tiết dòng tiền",
                investment_analysis: "Phân tích hiệu quả đầu tư",
                close: "Đóng",
                env_impact: "Hiệu quả Môi trường",
                co2_saved: "Giảm phát thải CO2",
                trees_planted: "Tương đương trồng cây",
                coal_saved: "Tiết kiệm than tiêu chuẩn",
                ton_year: "Tấn/năm",
                trees: "Cây xanh",
                ton_coal: "Tấn than",
                env_desc: "Dự án đóng góp tích cực vào việc bảo vệ môi trường và giảm thiểu biến đổi khí hậu.",
            },
            alerts: {
                lib_not_ready: "Thư viện chưa tải xong. Vui lòng đợi một lát.",
                pdf_error: "Lỗi tạo PDF: ",
                new_project: "DỰ ÁN MỚI"
            },
            landing: {
                headline_1: "Tối ưu hóa hệ thống",
                headline_2: "Điện mặt trời",
                headline_3: "của bạn",
                description: "Công cụ phân tích dữ liệu Load Profile tải tiêu thụ, mô phỏng năng suất PV và đề xuất cấu hình Inverter/BESS tối ưu nhất cho doanh nghiệp.",
                btn_select: "Chọn file Load Profile",
                loading: "Đang tải thư viện...",
                solar: "Solar",
                load: "Tải",
                roi: "ROI"
            },
            units: {
                m_units: "MWh/năm",
                m_units_short: "MWh",
                m_units_yr: "MWh/năm",
                kw: "kW",
                kwp: "kWp",
                m_vnd: "Triệu VNĐ"
            },
            loss_labels: {
                temp: "Nhiệt độ",
                soiling: "Bụi bẩn",
                cable: "Dây dẫn",
                inverter: "Biến tần",

                total_derate: "Tỷ lệ hiệu chỉnh"
            },
            export: {
                loading_excel: "Thư viện Excel chưa tải xong. Vui lòng đợi.",
                col_param: "Thông số",
                col_value: "Giá trị",
                col_unit: "Đơn vị",
                col_month: "Tháng",
                col_pv_yield: "Sản lượng PV (kWh)",
                col_load: "Load (kWh)",
                col_self_use: "Tự dùng (kWh)",
                col_self_use_pct: "Tỷ lệ tự dùng (%)"
            },
            scenarios: {
                base: "Theo tải nền (Base)",
                curtailment: "Cắt giảm"
            },
            profile_types: {
                shift_1: "🏢 1 Ca (Hành chính)",
                shift_2: "🌅 2 Ca (Sáng/Chiều)",
                shift_3: "🏭 3 Ca (24/7)",
                weekend_off: "📅 Nghỉ cuối tuần",
                fnb_retail: "🍽️ F&B/Bán lẻ",
                none: "Chưa có"
            },
            status: {
                select_layer: "CHỌN LỚP DỮ LIỆU",
                loaded_short: "Đã tải",
                loaded: "Đã tải: ",
                pvout_explanation: "Dữ liệu PVOUT đã bao gồm hao hụt hệ thống (Nhiệt độ, Bụi, Dây dẫn, Biến tần).",
                sun_off: "CN Nghỉ"
            },
            formulas: {
                pv_total: "Σ ( Sản lượng PV hàng tháng )",
                pv_used: "Σ Min( Solar, Tải )",
                pv_used_pct: "( Solar Tự dùng / Tổng Solar ) * 100",
                pv_curtailed: "Tổng Solar - Solar Tự dùng",
                pv_curtailed_pct: "( Cắt giảm / Tổng Solar ) * 100",
                grid_import: "Tổng tải - Solar Tự dùng",
                total_load: "Σ ( Phụ tải hàng tháng )",
                loss_pct: "( 1 - Tỷ lệ hiệu chỉnh tổng ) * 100",
                pv_used_normal: "Σ Solar Tự dùng (Giờ Bình thường)",
                pv_used_normal_pct: "( Tự dùng Bình thường / Tổng Tự dùng ) * 100",
                pv_used_peak: "Σ Solar Tự dùng (Giờ Cao điểm)",
                pv_used_peak_pct: "( Tự dùng Cao điểm / Tổng Tự dùng ) * 100",
                curtailed_normal: "Σ Cắt giảm (Giờ Bình thường)",
                curtailed_normal_pct: "( Cắt giảm Bình thường / Tổng Cắt giảm ) * 100",
                curtailed_peak: "Σ Cắt giảm (Giờ Cao điểm)",
                curtailed_peak_pct: "( Cắt giảm Cao điểm / Tổng Cắt giảm ) * 100"
            }
        },
        en: {
            dashboard: "Dashboard",
            design: "Design & Config",
            finance: "Financial Scenarios",
            report: "Detailed Report",
            project_name: "Project Name",
            sidebar_open: "Open Sidebar",
            sidebar_close: "Close Sidebar",
            actions: "Actions",
            report_config: "Report Configuration",
            view_formulas: "View Formulas",
            export_pdf: "Export PDF Report",
            generating_pdf: "Generating PDF...",
            project_info: "Project Information",
            input_data: "Input Data",
            load_profile: "Load Profile",
            solar_data: "Solar Data",
            load_tuning: "Load Tuning",
            simulate_sun: "Simulate Sun",
            area_province: "Region / Province",
            solar_capacity: "Solar Capacity",
            max_load: "Max Load",
            loss_percent: "Loss",
            interpolate_msg: "Interpolate 30m data",
            stats: {
                pv_yield: "PV Yield",
                solar_energy: "Solar Energy",
                savings: "Savings",
                self_consumption: "Self-consumption",
                efficiency: "Efficiency"
            },
            landing: {
                headline_1: "Optimize Your",
                headline_2: "Solar Energy",
                headline_3: "System",
                description: "Load profile analysis tool, PV yield simulation, and optimal Inverter/BESS configuration for businesses.",
                btn_select: "Select Load Profile File",
                loading: "Loading libraries...",
                solar: "Solar",
                load: "Load",
                roi: "ROI"
            },
            units: {
                m_units: "MWh/year",
                m_units_short: "MWh",
                m_units_yr: "MWh/year",
                kw: "kW",
                kwp: "kWp",
                m_vnd: "M VND"
            },
            loss_labels: {
                temp: "Temperature",
                soiling: "Soiling",
                cable: "Cabling",
                inverter: "Inverter",
                availability: "Availability",
                total_derate: "Total Derate"
            },
            export: {
                loading_excel: "Excel library not loaded. Please wait.",
                col_param: "Parameter",
                col_value: "Value",
                col_unit: "Unit",
                col_month: "Month",
                col_pv_yield: "PV Yield (kWh)",
                col_load: "Load (kWh)",
                col_self_use: "Self-Use (kWh)",
                col_self_use_pct: "Self-Use (%)"
            },
            pdf: {
                title: "Solar Capacity & Financial Design Report",
                report_date: "Report Date",
                tech_overview: "Technical Performance Overview",
                tech_config: "Preliminary Technical Configuration",
                energy_analysis: "Scenario-based Energy Analysis",
                daily_charts: "Typical Daily Charts",
                monthly_overview: "Monthly Energy Overview",
                energy_dispatch: "Energy Dispatch & BESS Activity",
                correlation: "Load-Solar Correlation",
                power_curves: "Power Curves (12 Months)",
                pv_capacity: "PV CAPACITY (DC)",
                panels: "PV PANELS",
                inverters: "INVERTERS",
                bess: "STORAGE (BESS)",
                qty: "Quantity",
                capacity: "Capacity",
                dc_ac_ratio: "DC/AC Ratio",
                not_used: "Not used",
                scenario: "Scenario",
                self_use: "Self-Consumption",
                excess: "Excess (Export/Curtail)",
                peak: "Peak",
                normal: "Normal",
                solar_yield_chart: "Monthly Energy Balance",
                solar_energy_name: "Solar Energy",
                grid_import_name: "Grid Import",
                solar_yield_name: "Solar Yield",
                energy_solar_used: "Solar Energy (Consumed)",
                curtailed: "Curtailed (Excess)",
                total_load: "Total Load",
                import: "Grid Import",
                bess_charge_avg: "BESS Charge",
                bess_discharge_avg: "BESS Discharge",
                dispatch_desc: "* Chart shows typical hourly BESS charging/discharging activity",
                detailed_specs_title: "Detailed Technical Specifications",
                cash_flow_roi_title: "Cash Flow & ROI Analysis",
                financial_chart_title: "Cash Flow (Cumulative)",
                finance_table: {
                    year: "Year",
                    year_0: "Investment (Year 0)",
                    revenue: "Revenue",
                    om: "O&M",
                    replacement: "Equipment Replacement",
                    net_flow: "Cashflow",
                    acc: "Cumulative"
                },
                payback: "Payback",
                roi: "ROI",
                mon_sat: "Mon-Sat",
                sun: "Sun",
                col_month: "Month",
                col_solar: "Solar (MWh)",
                col_load: "Load (MWh)",
                col_pv_used: "Self-use (MWh)",
                col_self_use_pct: "Self-use %",
                tech_efficiency_title: "Technical Performance Overview",
                pv_yield_yearly: "PV YIELD",
                solar_used_yearly: "SOLAR SELF-CONSUMPTION",
                grid_import_yearly: "FROM GRID",
                mwh_year: "MWh/year",
                yearly_summary: "Yearly Energy Summary",
                curtailment: "Curtailment (MWh)",
                ratio_pct: "Ratio %",
                total_year: "TOTAL YEAR",
                investment_indicators: "Investment Performance Indicators",
                cashflow_chart: "Cash Flow Chart (Cumulative)",
                energy_dispatch_day: "Typical Day Profile",
                bess_dispatch_day: "BESS Dispatch (Typical Day)",
                header_report: "CAPACITY CALCULATION REPORT",
                header_install: "INSTALLATION DESIGN",
                header_operation: "OPERATION DETAILS",
                header_finance: "FINANCIAL ANALYSIS",
                header_specs: "DETAILED SPECIFICATIONS",
                load_weekday: "Load (Mon-Sat)",
                load_weekend: "Load (Weekend)",
                legend_self_use: "Self-Consumption",
                legend_curtail: "Grid Export/Curtail",
                legend_load: "Load Profile",
                legend_grid_import: "Grid Import",
                legend_bess_charge: "BESS Charge",
                legend_bess_discharge: "BESS Discharge",
                legend_load_avg: "Average Load",
                legend_load_we: "Weekend Load",
                no_bess: "Not used",
                not_selected: "Not selected",
                chart_load_solar: "Load vs Solar",
                chart_grid_import_bess: "Grid Import vs Solar (with BESS)",
                axis_solar_kw: "Solar Generation (kW)",
                axis_load_kw: "Load Consumption (kW)",
                axis_grid_kw: "Grid Import (kW)",
                detailed_specs: "Detailed Technical Specifications (16 Items)",
                spec_name: "SPECIFICATION",
                spec_value: "VALUE",
                spec_unit: "UNIT",
                scenario_comparison: "Investment Scenario Comparison",
                scenario_name: "SCENARIO"
            },
            months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            months_short: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            tech_labels: {
                pv_total: "Total PV Yield",
                pv_used: "Solar Energy Used",
                pv_used_pct: "Solar Self-Use %",
                pv_curtailed: "Curtailment (Excess)",
                pv_curtailed_pct: "Curtailment %",
                grid_import: "Grid Import",
                total_load: "Total Load Consumption",
                loss_pct: "System Loss Percent",
                pv_used_normal: "Solar Used (Normal)",
                pv_used_normal_pct: "Normal Use %",
                pv_used_peak: "Solar Used (Peak)",
                pv_used_peak_pct: "Peak Use %",
                curtailed_normal: "Curtailment (Normal)",
                curtailed_normal_pct: "Curtail normal %",
                curtailed_peak: "Curtailment (Peak)",
                curtailed_peak_pct: "Curtail peak %"
            },
            pdf_config: {
                title: "PDF Export Options",
                desc: "Select the sections to include in your report:",
                overview: "Overview & Monthly Yield",
                system_config: "System Config & Scenarios",
                daily_charts: "Daily & Weekly Charts",
                energy_dispatch: "Energy Dispatch & BESS",
                correlation: "Correlation Charts",
                monthly_table: "Monthly Data Table",
                power_curves: "12-Month Power Curves",
                detailed_specs: "Detailed Specifications",
                cashflow: "Cash Flow Chart",
                cashflow_table: "Detailed Cash Flow Table",
                investment_analysis: "Investment Analysis",
                close: "Close",
                export: "Export PDF",
                env_impact: "Environmental Impact",
                co2_saved: "CO2 Emissions Reduced",
                trees_planted: "Equivalent Trees Planted",
                coal_saved: "Standard Coal Saved",
                ton_year: "Tons/year",
                trees: "Trees",
                ton_coal: "Tons coal",
                env_desc: "This project contributes positively to environmental protection and climate change mitigation."
            },
            alerts: {
                lib_not_ready: "Libraries are not yet loaded. Please wait a moment.",
                pdf_error: "PDF Generation Error: ",
                new_project: "NEW PROJECT"
            },
            scenarios: {
                base: "Base Load Scenario",
                curtailment: "Curtailment"
            },
            profile_types: {
                shift_1: "🏢 1 Shift (Office)",
                shift_2: "🌅 2 Shifts (Day/Eve)",
                shift_3: "🏭 3 Shifts (24/7)",
                weekend_off: "📅 Weekend Off",
                fnb_retail: "🍽️ F&B/Retail",
                none: "None"
            },
            status: {
                select_layer: "SELECT LAYER",
                loaded_short: "Loaded",
                loaded: "Loaded: ",
                pvout_explanation: "PVOUT data includes system losses (Temperature, Soiling, Cables, Inverter).",
                sun_off: "Sun Off"
            },
            formulas: {
                pv_total: "Σ ( Monthly Solar Generation )",
                pv_used: "Σ Min( Solar, Load )",
                pv_used_pct: "( PV Used / PV Total ) * 100",
                pv_curtailed: "PV Total - PV Used",
                pv_curtailed_pct: "( PV Curtailed / PV Total ) * 100",
                grid_import: "Total Load - PV Used",
                total_load: "Σ ( Monthly Load Consumption )",
                loss_pct: "( 1 - Total Derate Factor ) * 100",
                pv_used_normal: "Σ PV Used (Normal Hours)",
                pv_used_normal_pct: "( PV Used Normal / Total PV Used ) * 100",
                pv_used_peak: "Σ PV Used (Peak Hours)",
                pv_used_peak_pct: "( PV Used Peak / Total PV Used ) * 100",
                curtailed_normal: "Σ PV Curtailed (Normal Hours)",
                curtailed_normal_pct: "( Curtailed Normal / Total Curtailed ) * 100",
                curtailed_peak: "Σ PV Curtailed (Peak Hours)",
                curtailed_peak_pct: "( Curtailed Peak / Total Curtailed ) * 100"
            }
        }
    };

    const t = TRANSLATIONS[lang];

    const handleDesignModeSelect = (mode, data = null, profileType = 'commercial_day', options = {}) => {
        setDesignMode(mode);
        if (mode === 'manual') {
            // APPLY CUSTOM OVERRIDES (Province, Price)
            if (options.provinceData) {
                setSelectedProvince(options.provinceData);
                setParams(prev => ({ ...prev, psh: options.provinceData.peakSunHours }));
            }
            // UPDATE PRICING TYPE & VOLTAGE
            if (options.customerGroup) setPricingType(options.customerGroup);
            if (options.voltageLevel) setVoltageLevelId(options.voltageLevel);

            if (options.isManualPrice) {
                // Manual overrides ALL prices (Flat Rate)
                setParams(prev => ({
                    ...prev,
                    priceNormal: options.customPrice,
                    pricePeak: options.customPrice,
                    priceOffPeak: options.customPrice
                }));
            } else if (options.customerGroup && options.voltageLevel) {
                // EVN Tariff: Lookup actual TOU prices
                const group = EVN_TARIFFS[options.customerGroup];
                const level = group?.voltage_levels.find(v => v.id === options.voltageLevel);
                if (level && level.prices) {
                    setParams(prev => ({
                        ...prev,
                        priceNormal: level.prices.normal,
                        pricePeak: level.prices.peak,
                        priceOffPeak: level.prices.off_peak
                    }));
                }
            }
            if (options.priceEscalation !== undefined) {
                setFinParams(prev => ({ ...prev, escalation: options.priceEscalation }));
            }

            if (data && Array.isArray(data)) {
                // EVN Bill / Synthetic Profile Flow
                try {
                    const syntheticProfile = generateSyntheticProfile(data, profileType, new Date().getFullYear(), options);
                    // Format for rawData (cleanData mapping expects { rawTime, loadKw })
                    // generateSyntheticProfile ALREADY returns { rawTime, loadKw }
                    setRawData(syntheticProfile);
                    setIsManualConfig(false); // treat as if we have a file
                    setActiveTab('dashboard');
                } catch (e) {
                    console.error("Error generating profile:", e);
                    setIsManualConfig(true);
                    setActiveTab('design');
                }
            } else {
                // Pure Manual Config (Capacity only)
                setIsManualConfig(true);
                setActiveTab('design');
            }
        } else if (mode === 'profile' && data && data instanceof File) {
            // DIRECT FILE IMPORT FROM LANDING PAGE
            // Trigger the hooks upload logic
            onFileUpload({ target: { files: [data] } }, 'load');
            setIsManualConfig(false);
        } else {
            setIsManualConfig(false);
        }
    };

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
            // Only update if value actually changed and we have valid totalACPower
            if (totalACPower > 0 && prev.inverterMaxAcKw !== totalACPower) {
                return { ...prev, inverterMaxAcKw: totalACPower };
            }
            return prev;
        });
    }, [totalACPower]);

    const formatNumber = useCallback((num) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(num), []);
    const formatMoney = useCallback((num) => new Intl.NumberFormat(lang === 'vi' ? 'vi-VN' : 'en-US', { maximumFractionDigits: 0 }).format(num), [lang]);

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
            handleMagicSuggest();
        }
    }, [targetKwp, isManualConfig, handleMagicSuggest]);

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

    // PERF: Defer heavy calculation inputs to prevent UI blocking (slider lag)
    const deferredSystemSize = useDeferredValue(targetKwp);
    const deferredParams = useDeferredValue(params);
    const deferredTechParams = useDeferredValue(techParams);
    const deferredBessKwh = useDeferredValue(bessKwh);

    // PERF: Simulation is now asynchronous to prevent UI blocking
    useEffect(() => {
        if (processedData.length === 0) {
            setCustomStats(null);
            setIsSimulating(false);
            return;
        }

        setIsSimulating(true);
        const timer = setTimeout(() => {
            try {
                const results = calculateSystemStats(
                    deferredSystemSize,
                    processedData,
                    deferredBessKwh,
                    bessMaxPower,
                    bessStrategy === 'peak-shaving', // Derived from strategy
                    isGridCharge,
                    { ...deferredParams, calibrationFactor },
                    { ...deferredTechParams, inverterMaxAcKw: totalACPower } // Removed hardcoded weatherDerate override
                );
                setCustomStats(results);
            } catch (err) {
                console.error("Simulation error:", err);
            } finally {
                setIsSimulating(false);
            }
        }, 50); // Small delay to let UI paint fallbacks first

        return () => clearTimeout(timer);
    }, [deferredSystemSize, processedData, deferredBessKwh, bessMaxPower, bessStrategy, isGridCharge, deferredParams, deferredTechParams, calibrationFactor, totalACPower, weatherScenario]);

    const estimatedLosses = useMemo(() => {
        if (!customStats) return null;
        // Calculate total loss percentage from techParams to match calculated stats
        const currentLosses = techParams.losses || { temp: 0, soiling: 0, cable: 0, inverter: 0 };
        const totalLoss = Object.values(currentLosses).reduce((sum, val) => sum + (Number(val) || 0), 0);
        return { systemLossPct: totalLoss, breakdown: currentLosses };
    }, [customStats, techParams.losses]);

    // --- ADVANCED FINANCIAL CALCULATION ---
    // --- ADVANCED FINANCIAL CALCULATION (MOVED TO UTILS) ---
    // calculateAdvancedFinancials is imported


    const currentFinance = useMemo(() => {
        if (!customStats) return null;
        const systemCapex = realSystemSize * params.systemPrice;
        const batteryCapex = bessKwh * params.bessPrice;
        // Use Manual Total Investment if provided (handling empty string by Number coercion check)
        const totalCapex = (finParams.manualCapex && Number(finParams.manualCapex) > 0)
            ? Number(finParams.manualCapex)
            : (systemCapex + batteryCapex);

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
            let failCount = 0;
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

                // Ensure numeric values to prevent NaN propagation
                const safeLoad = isNaN(Number(d.loadKw)) ? 0 : Number(d.loadKw);
                const safeSolar = isNaN(Number(solarUnit)) ? 0 : Number(solarUnit);

                return { date, day: date.getDay(), hour: date.getHours(), minute: date.getMinutes(), timestamp: date.getTime(), load: safeLoad, solarUnit: safeSolar };
            }).filter(d => d !== null);

            cleanData.sort((a, b) => a.timestamp - b.timestamp);

            // 1. Calculate Average Weekday Load using a single pass reduce
            const weekdayStats = cleanData.reduce((acc, d) => {
                if (d.day !== 0) { // Not Sunday
                    acc[d.hour].sum += d.load;
                    acc[d.hour].count++;
                }
                return acc;
            }, Array(24).fill(0).map(() => ({ sum: 0, count: 0 })));

            const avgWeekdayLoad = weekdayStats.map(h => h.count > 0 ? h.sum / h.count : 0);

            // 2. Apply Tuning in a single pass map
            const processedWithStep = cleanData.map((d, i) => {
                let timeStep = 1.0;
                if (i < cleanData.length - 1) {
                    const diff = (cleanData[i + 1].timestamp - d.timestamp) / 3600000;
                    if (diff > 0 && diff <= 24) timeStep = diff;
                }

                let tunedLoad = d.load;

                // Simulate Weekend: Replace Sunday with Avg Weekday Load
                if (simulateWeekend && d.day === 0) {
                    tunedLoad = avgWeekdayLoad[d.hour] || tunedLoad;
                }

                // Load Scaling
                tunedLoad = tunedLoad * (loadScaling / 100.0);

                return { ...d, load: tunedLoad, timeStep, dataSource: 'import' };
            });

            if (processedWithStep.length === 0) { setErrorMsg(`Loi format ngay thang.`); setIsProcessing(false); return; }

            // One-pass summary statistics
            let nightLoadCount = 0;
            let eveningLoadCount = 0;
            let lunchPeakCount = 0;
            let dinnerPeakCount = 0;
            let sunSum = 0, sunCount = 0, weekSum = 0, weekCount = 0;
            let maxLoad = 0;
            const uniqueDaysSet = new Set();
            const hourlyAvg = Array(24).fill(0);
            const hourlyCounts = Array(24).fill(0);

            processedWithStep.forEach(d => {
                const hour = d.hour;
                hourlyAvg[hour] += d.load;
                hourlyCounts[hour]++;
                if (d.load > 10) {
                    if (hour === 2) nightLoadCount++;
                    if (hour === 20) eveningLoadCount++;
                    // Detect F&B pattern: peaks at lunch (11-14h) and dinner (18-21h)
                    if (hour >= 11 && hour <= 14) lunchPeakCount++;
                    if (hour >= 18 && hour <= 21) dinnerPeakCount++;
                }
                if (d.day === 0) { sunSum += d.load; sunCount++; } else { weekSum += d.load; weekCount++; }
                if (d.load > maxLoad) maxLoad = d.load;
                uniqueDaysSet.add(d.date.toDateString());
            });

            // Calculate hourly averages
            for (let i = 0; i < 24; i++) {
                if (hourlyCounts[i] > 0) hourlyAvg[i] /= hourlyCounts[i];
            }

            const uniqueDays = uniqueDaysSet.size;

            // Detect F&B/Retail pattern: high lunch AND dinner peaks with lower mid-afternoon
            const avgLunch = (hourlyAvg[11] + hourlyAvg[12] + hourlyAvg[13]) / 3;
            const avgAfternoon = (hourlyAvg[14] + hourlyAvg[15] + hourlyAvg[16]) / 3;
            const avgDinner = (hourlyAvg[18] + hourlyAvg[19] + hourlyAvg[20]) / 3;
            const avgNight = (hourlyAvg[0] + hourlyAvg[1] + hourlyAvg[2] + hourlyAvg[3]) / 4;
            const isFnbPattern = avgLunch > avgAfternoon * 1.2 && avgDinner > avgAfternoon * 1.2 && avgNight < avgLunch * 0.3;

            // Detect shift type
            let detectedType = t.profile_types.shift_1;
            if (isFnbPattern) {
                detectedType = t.profile_types.fnb_retail;
            } else if (nightLoadCount > uniqueDays * 0.3) {
                detectedType = t.profile_types.shift_3;
            } else if (eveningLoadCount > uniqueDays * 0.3) {
                detectedType = t.profile_types.shift_2;
            }

            // Detect weekend off
            const isWeekendOff = sunCount > 0 ? (sunSum / sunCount) < (weekSum / weekCount * 0.4) : false;

            // Combine label with weekend info
            let finalLabel = detectedType;
            if (isWeekendOff && detectedType !== t.profile_types.fnb_retail) {
                finalLabel = detectedType + ' + ' + t.profile_types.weekend_off;
            }

            setLoadTag({ label: finalLabel, isWeekendOff });
            setProcessedData(processedWithStep);

            setDetectedMaxLoad(maxLoad);
            const autoMaxKwp = Math.max(Math.ceil(maxLoad * 5), 5000);
            setMaxKwpRef(autoMaxKwp);
            if (isNewFileLoad.current) { setTargetKwp(detectedKwp || Math.round(maxLoad)); isNewFileLoad.current = false; }
            setIsProcessing(false);
        }, 50); // Reduced delay
    }, [rawData, params.psh, realSolarProfile, isSwappedDate, loadScaling, simulateWeekend, detectedKwp]);



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

        // 3. Debounce the heavy calculation
        const timer = setTimeout(() => {
            // ... existing logic ...
            const targets = [
                { label: `${t.scenarios.curtailment} 0%`, val: 0.00 },
                { label: `${t.scenarios.curtailment} 5%`, val: 0.05 },
                { label: `${t.scenarios.curtailment} 10%`, val: 0.10 },
                { label: `${t.scenarios.curtailment} 15%`, val: 0.15 },
                { label: `${t.scenarios.curtailment} 20%`, val: 0.20 }
            ];

            const computedScenarios = targets.map(tScenario => {
                let low = 1, high = maxKwpRef * 1.5; let bestKwp = low; let minDiff = 1;

                // OPTIMIZATION: Pre-filter data ONCE outside loop (was filtering 12x per scenario!)
                const validDataForSim = processedData.filter(d => {
                    const peak = Math.max(...(dayMap.get(d.date.toDateString()) || []).map(p => p.load));
                    return peak > 5;
                });
                const simData = validDataForSim.length > 0 ? validDataForSim : processedData;

                // Reduce iterations: 8 is enough for ±1kWp accuracy on 1-500kWp range
                for (let i = 0; i < 8; i++) {
                    const mid = (low + high) / 2;
                    const { totalAcKw } = selectOptimalInverters(mid, INVERTER_DB, 1.25);
                    const optParams = { ...techParams, inverterMaxAcKw: totalAcKw, gridInjectionPrice: 0 };

                    const stats = calculateSystemStats(mid, simData, 0, 0, false, false, { ...params, calibrationFactor }, optParams);
                    const diff = stats.curtailmentRate - tScenario.val;
                    if (Math.abs(diff) < minDiff) { minDiff = Math.abs(diff); bestKwp = mid; }
                    if (stats.curtailmentRate < tScenario.val) low = mid; else high = mid;
                }
                let finalKwp = Math.round(bestKwp); if (finalKwp < 1) finalKwp = 1;

                // Final Stats Calc (reuse simData from above)
                const { totalAcKw: finalAcKw, selectedInverters: finalInverters } = selectOptimalInverters(finalKwp, INVERTER_DB, 1.25);
                const scenarioTechParams = { ...techParams, inverterMaxAcKw: finalAcKw, gridInjectionPrice: 0 };
                const stats = calculateSystemStats(finalKwp, simData, 0, 0, useTouMode, false, { ...params, calibrationFactor }, scenarioTechParams);
                const capex = finalKwp * params.systemPrice;
                const scenarioPrices = { peak: params.pricePeak, normal: params.priceNormal, offPeak: params.priceOffPeak, gridInjection: 0 };
                const fin = calculateAdvancedFinancials(capex, stats, scenarioPrices, { ...finParams, batteryCapex: 0 });

                return { ...tScenario, kwp: finalKwp, realRate: stats.curtailmentRate, stats, capex, annualSaving: fin.firstYearRevenue, paybackYears: fin.payback, npv: fin.npv, irr: fin.irr, lcoe: fin.lcoe, config: finalInverters };
            });

            // Base Scenario
            const { totalAcKw: blAcKw, selectedInverters: blInverters } = selectOptimalInverters(baseLoadKwp, INVERTER_DB, 1.25);
            const blStats = calculateSystemStats(baseLoadKwp, processedData, bessKwh, bessMaxPower, useTouMode, isGridCharge, { ...params, calibrationFactor }, { ...techParams, inverterMaxAcKw: blAcKw });
            const blCapex = baseLoadKwp * params.systemPrice + bessKwh * params.bessPrice;
            const prices = { peak: params.pricePeak, normal: params.priceNormal, offPeak: params.priceOffPeak, gridInjection: techParams.gridInjectionPrice };
            const blFin = calculateAdvancedFinancials(blCapex, blStats, prices, { ...finParams, batteryCapex: bessKwh * params.bessPrice });

            setScenarios([{ label: t.scenarios.base, kwp: baseLoadKwp, realRate: blStats.curtailmentRate, stats: blStats, capex: blCapex, annualSaving: blFin.firstYearRevenue, paybackYears: blFin.payback, npv: blFin.npv, irr: blFin.irr, lcoe: blFin.lcoe, config: blInverters }, ...computedScenarios]);

        }, 100); // 100ms Delay to unblock UI

        return () => clearTimeout(timer);

    }, [processedData, maxKwpRef, calculateSystemStats, params, bessKwh, bessMaxPower, bessStrategy, isGridCharge, calculateAdvancedFinancials, finParams, dcAcRatio, lang, t]);


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

        const hourly = Array(24).fill(0).map(() => ({ count: 0, load: 0, solar: 0, charge: 0, discharge: 0, gridCharge: 0, selfConsumption: 0, soc: 0, wdSum: 0, wdCount: 0, weSum: 0, weCount: 0 }));

        // PERFORMANCE FIX: Use customStats if available, otherwise use fast fallback from processedData
        // Do NOT call calculateSystemStats synchronously - it blocks UI for several seconds
        if (customStats && customStats.hourlyBatteryData && customStats.hourlyBatteryData.length > 0) {
            // Use simulation results for accurate BESS data
            customStats.hourlyBatteryData.forEach((bat) => {
                // Use bat.date directly for reliable hour/day detection
                const batDate = bat.date instanceof Date ? bat.date : new Date(bat.date);
                const h = batDate.getHours();
                const dayOfWeek = batDate.getDay(); // 0 = Sunday

                if (hourly[h]) {
                    hourly[h].count++;
                    hourly[h].load += (bat.load || 0);
                    hourly[h].solar += (bat.solar || 0);
                    hourly[h].charge += (bat.chargeFromSolar || 0);
                    hourly[h].gridCharge += (bat.chargeFromGrid || 0);
                    hourly[h].discharge += (bat.discharge || 0);
                    hourly[h].soc += (bat.soc || 0); // Accumulate SOC
                    // Self Consumption = Solar - (Export + Curtailment)
                    // If export/curtailment not explicit, use min(solar, load + chargeFromSolar)
                    // Assuming bat has export/curtailment or we derive it:
                    const totalSolar = bat.solar || 0;
                    const exportAndCurtail = (bat.gridExport || 0) + (bat.curtailed || 0);
                    hourly[h].selfConsumption += Math.max(0, totalSolar - exportAndCurtail);

                    if (dayOfWeek === 0) {
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
                    const s = d.solarUnit * realSystemSize * (calibrationFactor / 100);
                    hourly[d.hour].solar += s;
                    hourly[d.hour].selfConsumption += Math.min(s, d.load); // Simple fallback
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
            avgLoad: Number(h.load / (h.count || 1)) || 0,
            solarProfile: Number(h.solar / (h.count || 1)) || 0,
            avgBessCharge: Number(h.charge / (h.count || 1)) || 0,
            avgGridCharge: Number(h.gridCharge / (h.count || 1)) || 0,
            avgBessDischarge: Number(h.discharge / (h.count || 1)) || 0,
            avgSoc: Number(h.soc / (h.count || 1)) || 0,
            avgSelfConsumption: Number(h.selfConsumption / (h.count || 1)) || 0,
            weekday: Number(h.wdCount ? h.wdSum / h.wdCount : 0) || 0,
            weekend: Number(h.weCount ? h.weSum / h.weCount : 0) || 0
        }));
    }, [customStats, processedData, realSystemSize, bessKwh, bessMaxPower, params, techParams, useTouMode, isGridCharge, calibrationFactor]);

    const monthlyDetails = useMemo(() => {
        const stats = Array(12).fill(0).map(() => ({
            solar: 0, load: 0, used: 0, curtailed: 0, gridCharge: 0, gridImport: 0,
            usedPeak: 0, usedNormal: 0, curtailedPeak: 0, curtailedNormal: 0
        }));

        const dataToUse = (customStats && customStats.hourlyBatteryData && customStats.hourlyBatteryData.length > 0)
            ? customStats.hourlyBatteryData
            : processedData;

        if (!dataToUse || dataToUse.length === 0) return [];

        const hasSim = (customStats && customStats.hourlyBatteryData && customStats.hourlyBatteryData.length > 0);

        dataToUse.forEach(d => {
            if (!d.date) return;
            const m = d.date.getMonth();

            // Handle differences between raw processedData and simulation result
            let solar = d.solar;
            if (solar === undefined) {
                // Re-calculate solar from unit if raw data
                solar = (d.solarUnit || 0) * realSystemSize * (calibrationFactor / 100.0);
            }

            stats[m].solar += solar || 0;
            stats[m].load += d.load || 0;

            if (hasSim) {
                // Derived from verified hourly data
                const usedVal = ((d.load || 0) + (d.chargeFromGrid || 0)) - (d.gridImport || 0);
                const curtailedVal = Math.max(0, (solar || 0) - usedVal);

                stats[m].used += usedVal;
                stats[m].curtailed += curtailedVal;
                stats[m].gridImport += (d.gridImport || 0);
                stats[m].gridCharge += (d.chargeFromGrid || 0);
            } else {
                // Simple Fallback (No Battery)
                const usedVal = Math.min(solar || 0, d.load || 0);
                stats[m].used += usedVal;
                stats[m].curtailed += Math.max(0, (solar || 0) - usedVal);
                stats[m].gridImport += Math.max(0, (d.load || 0) - usedVal);
            }
        });

        return stats.map((s, i) => ({
            month: t.months_short ? t.months_short[i] : (i + 1).toString(),
            solar: Number(s.solar) || 0,
            load: Number(s.load) || 0,
            used: Number(s.used) || 0,
            curtailed: Number(s.curtailed) || 0,
            gridImport: Number(s.gridImport) || 0
        }));
    }, [customStats, processedData, realSystemSize, calibrationFactor, t]);

    const dailyStats = useMemo(() => {
        if (processedData.length === 0) return [];

        const days = new Map();
        const hasSim = customStats && customStats.hourlyBatteryData && customStats.hourlyBatteryData.length > 0;
        const dataToUse = hasSim ? customStats.hourlyBatteryData : processedData;

        dataToUse.forEach(d => {
            const dateStr = d.date.toLocaleDateString('en-CA');
            if (!days.has(dateStr)) {
                days.set(dateStr, {
                    date: dateStr,
                    fullDate: d.date,
                    solar: 0, load: 0, used: 0, curtailed: 0,
                    gridImport: 0, gridCharge: 0
                });
            }
            const day = days.get(dateStr);

            let solar = d.solar;
            if (solar === undefined) {
                // From raw processedData
                solar = (d.solarUnit || 0) * realSystemSize * (calibrationFactor / 100.0);
            }

            day.solar += solar || 0;
            day.load += d.load || 0;

            if (hasSim) {
                const usedVal = (d.load + (d.chargeFromGrid || 0)) - (d.gridImport || 0);
                day.used += usedVal;
                day.curtailed += Math.max(0, solar - usedVal);
                day.gridImport += (d.gridImport || 0);
                day.gridCharge += (d.chargeFromGrid || 0);
            } else {
                // Simple Fallback
                const usedVal = Math.min(solar || 0, d.load || 0);
                day.used += usedVal;
                day.curtailed += Math.max(0, (solar || 0) - usedVal);
                day.gridImport += Math.max(0, (d.load || 0) - usedVal);
            }
        });

        return Array.from(days.values())
            .map(d => ({
                ...d,
                solar: Number(d.solar) || 0,
                load: Number(d.load) || 0,
                used: Number(d.used) || 0,
                curtailed: Number(d.curtailed) || 0,
                gridImport: Number(d.gridImport) || 0
            }))
            .sort((a, b) => a.fullDate - b.fullDate);
    }, [customStats, processedData, realSystemSize, calibrationFactor]);

    const detailedSpecsList = useMemo(() => {
        if (!customStats || !estimatedLosses) return [];
        return [
            { id: 1, label: t.tech_labels.pv_total, value: customStats.totalSolarGen, unit: 'kWh', formula: t.formulas.pv_total },
            { id: 2, label: t.tech_labels.pv_used, value: customStats.totalUsed, unit: 'kWh', highlight: true, color: 'text-green-600', formula: t.formulas.pv_used },
            { id: 3, label: t.tech_labels.pv_used_pct, value: (customStats.totalUsed / customStats.totalSolarGen * 100).toFixed(2), unit: '%', highlight: true, color: 'text-green-600', formula: t.formulas.pv_used_pct },
            { id: 4, label: t.tech_labels.pv_curtailed, value: customStats.totalCurtailed + (customStats.totalExported || 0), unit: 'kWh', highlight: true, color: 'text-red-500', formula: t.formulas.pv_curtailed },
            { id: 5, label: t.tech_labels.pv_curtailed_pct, value: (customStats.totalSolarGen > 0 ? ((customStats.totalCurtailed + (customStats.totalExported || 0)) / customStats.totalSolarGen * 100).toFixed(2) : 0), unit: '%', highlight: true, color: 'text-red-500', formula: t.formulas.pv_curtailed_pct },
            { id: 6, label: t.tech_labels.grid_import, value: customStats.gridImport, unit: 'kWh', formula: t.formulas.grid_import },
            { id: 7, label: t.tech_labels.total_load, value: customStats.totalLoad, unit: 'kWh', formula: t.formulas.total_load },
            { id: 8, label: t.tech_labels.loss_pct, value: estimatedLosses.systemLossPct.toFixed(2), unit: '%', formula: t.formulas.loss_pct },
            { id: 9, label: t.tech_labels.pv_used_normal, value: customStats.usedNormal, unit: 'kWh', formula: t.formulas.pv_used_normal },
            { id: 10, label: t.tech_labels.pv_used_normal_pct, value: customStats.totalUsed > 0 ? (customStats.usedNormal / customStats.totalUsed * 100).toFixed(2) : 0, unit: '%', formula: t.formulas.pv_used_normal_pct },
            { id: 11, label: t.tech_labels.pv_used_peak, value: customStats.usedPeak, unit: 'kWh', formula: t.formulas.pv_used_peak },
            { id: 12, label: t.tech_labels.pv_used_peak_pct, value: customStats.totalUsed > 0 ? (customStats.usedPeak / customStats.totalUsed * 100).toFixed(2) : 0, unit: '%', formula: t.formulas.pv_used_peak_pct },
            { id: 13, label: t.tech_labels.curtailed_normal, value: customStats.curtailedNormal + (customStats.exportedNormal || 0), unit: 'kWh', formula: t.formulas.curtailed_normal },
            { id: 14, label: t.tech_labels.curtailed_normal_pct, value: (customStats.totalCurtailed + customStats.totalExported) > 0 ? ((customStats.curtailedNormal + (customStats.exportedNormal || 0)) / (customStats.totalCurtailed + customStats.totalExported) * 100).toFixed(2) : 0, unit: '%', formula: t.formulas.curtailed_normal_pct },
            { id: 15, label: t.tech_labels.curtailed_peak, value: customStats.curtailedPeak + (customStats.exportedPeak || 0), unit: 'kWh', formula: t.formulas.curtailed_peak },
            { id: 16, label: t.tech_labels.curtailed_peak_pct, value: (customStats.totalCurtailed + customStats.totalExported) > 0 ? ((customStats.curtailedPeak + (customStats.exportedPeak || 0)) / (customStats.totalCurtailed + customStats.totalExported) * 100).toFixed(2) : 0, unit: '%', formula: t.formulas.curtailed_peak_pct },
        ];
    }, [customStats, estimatedLosses, t.tech_labels]);

    const monthlyPowerCurves = useMemo(() => {
        if (processedData.length === 0) return [];
        const acc = Array.from({ length: 12 }, () => Array.from({ length: 24 }, () => ({ wdSum: 0, wdCount: 0, weSum: 0, weCount: 0, solarSum: 0, solarCount: 0 })));

        const safeCalibration = isNaN(Number(calibrationFactor)) ? 100 : Number(calibrationFactor);
        const scale = safeCalibration / 100.0;
        const safeSize = isNaN(Number(realSystemSize)) ? 0 : Number(realSystemSize);

        processedData.forEach(d => {
            if (!d.date) return;
            const m = d.date.getMonth(); const h = d.date.getHours();

            const safeSolarUnit = isNaN(Number(d.solarUnit)) ? 0 : Number(d.solarUnit);
            const solarVal = safeSolarUnit * safeSize * scale;
            const safeLoad = isNaN(Number(d.load)) ? 0 : Number(d.load);

            acc[m][h].solarSum += solarVal; acc[m][h].solarCount++;
            if (d.day === 0) { acc[m][h].weSum += safeLoad; acc[m][h].weCount++; } else { acc[m][h].wdSum += safeLoad; acc[m][h].wdCount++; }
        });

        return acc.map((m, i) => ({
            month: t.months ? t.months[i] : (i + 1).toString(),
            data: m.map((h, hi) => ({
                hour: hi,
                weekday: Number(h.wdCount ? h.wdSum / h.wdCount : 0) || 0,
                weekend: Number(h.weCount ? h.weSum / h.weCount : 0) || 0,
                solar: Number(h.solarCount ? h.solarSum / h.solarCount : 0) || 0
            }))
        }));
    }, [processedData, realSystemSize, calibrationFactor, t]);

    // Base correlation data (without BESS) for comparison
    const baseCorrelationData = useMemo(() => {
        if (processedData.length === 0) return [];
        const daylightData = processedData.filter(d => {
            const h = d.date.getHours();
            return h >= 6 && h <= 18;
        });
        const step = Math.ceil(daylightData.length / 500);
        return daylightData.filter((_, i) => i % step === 0).map(d => ({
            solar: d.solarUnit ? d.solarUnit * realSystemSize * (calibrationFactor / 100.0) : (d.solar || 0),
            load: d.load,
            dataSource: 'manual'
        }));
    }, [processedData, realSystemSize, calibrationFactor]);

    const correlationData = useMemo(() => {
        if (processedData.length === 0) return [];
        let sourceData = processedData;

        // Use cached customStats for simulation results
        if (customStats && customStats.hourlyBatteryData && customStats.hourlyBatteryData.length === processedData.length) {
            sourceData = customStats.hourlyBatteryData.map((b, i) => ({
                ...processedData[i],
                ...b
            }));
        }

        // Filter for daylight hours (6:00 AM - 6:00 PM) to make the correlation meaningful
        const daylightData = sourceData.filter(d => {
            const h = d.date.getHours();
            return h >= 6 && h <= 18;
        });

        // Downsample for scatter plot robustness (max 500 points)
        const step = Math.ceil(daylightData.length / 500);
        return daylightData.filter((_, i) => i % step === 0).map(d => ({
            solar: d.solarUnit ? d.solarUnit * realSystemSize * (calibrationFactor / 100.0) : (d.solar || 0), // Handle both raw and sim formats
            load: d.load,
            gridImport: Math.max(0, d.gridImport || 0), // Ensure non-negative
            soc: d.soc || 0
        }));
    }, [processedData, customStats, realSystemSize, calibrationFactor]);



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
        if (!window.XLSX) { alert(t.export.loading_excel); return; }
        // Format data based on type
        const exportData = data.map(item => {
            if (item.label) return { [t.export.col_param]: item.label, [t.export.col_value]: item.value, [t.export.col_unit]: item.unit };
            if (item.month) return { [t.export.col_month]: item.month, [t.export.col_pv_yield]: item.solar, [t.export.col_load]: item.load, [t.export.col_self_use]: item.used, [t.export.col_self_use_pct]: item.solar > 0 ? ((item.used / item.solar) * 100).toFixed(1) + '%' : '0%' };
            return item;
        });
        const ws = window.XLSX.utils.json_to_sheet(exportData);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, sheetName || "Sheet1");
        window.XLSX.writeFile(wb, `${fileName}.xlsx`);
    };


    const handleExportPDF = async () => {
        if (!processedData || !htmlToImage || !jsPDF) { alert(t.alerts.lib_not_ready); return; }
        setShowExportSettings(false); setIsExporting(true);

        // Allow UI to render the hidden report sections
        setTimeout(async () => {
            try {
                console.log('Starting PDF generation (5 Pages)...');
                const doc = new jsPDF({
                    orientation: 'p',
                    unit: 'mm',
                    format: 'a4',
                    compress: true
                });
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
                        const dataUrl = await htmlToImage.toJpeg(element, {
                            quality: 0.8,
                            pixelRatio: 1.5,
                            backgroundColor: '#ffffff',
                            skipAutoScale: true,
                            cacheBust: true,
                            style: { visibility: 'visible' }
                        });

                        const imgProps = doc.getImageProperties(dataUrl);
                        const pdfWidth = pageWidth - 20; // 10mm margin
                        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                        if (!isFirstPage) doc.addPage();
                        doc.addImage(dataUrl, 'JPEG', 10, 10, pdfWidth, pdfHeight, undefined, 'FAST');
                        isFirstPage = false;
                    } catch (secErr) {
                        console.error(`Error adding section ${elementId}:`, secErr);
                    }
                };

                // PAGE 1: Overview + Config + Daily (longer delay for charts)
                await new Promise(r => setTimeout(r, 1500));
                await new Promise(r => requestAnimationFrame(() => setTimeout(r, 100)));
                await addSectionToPdf('report-page-1');

                // PAGE 2: Monthly + Correlation + Power Curves
                await new Promise(r => setTimeout(r, 600));
                await addSectionToPdf('report-page-2');

                // PAGE 3: Financial Analysis + Detailed Specs
                await new Promise(r => setTimeout(r, 600));
                await addSectionToPdf('report-page-3');

                // PAGE 4: Monthly Data Table
                await new Promise(r => setTimeout(r, 600));
                await addSectionToPdf('report-page-4');
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
                alert(t.alerts.pdf_error + err.message);
            } finally {
                setIsExporting(false);
            }
        }, 1500);
    };

    // 4. SMART DESIGN SELECTOR
    if (!designMode) {
        return <SmartDesignSelector onSelect={handleDesignModeSelect} lang={lang} setLang={setLang} />;
    }


    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 overflow-hidden relative">
            {showExportSettings && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800 text-lg">{t.pdf_config.title}</h3><button onClick={() => setShowExportSettings(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            <p className="text-sm text-slate-500 mb-2">{t.pdf_config.desc}</p>
                            <div onClick={() => toggleExportConfig('overview')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.overview ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{t.pdf_config.overview}</span></div>
                            <div onClick={() => toggleExportConfig('systemConfig')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.systemConfig ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{t.pdf_config.system_config}</span></div>
                            <div className="h-px bg-slate-100 my-2"></div>
                            <div onClick={() => toggleExportConfig('dailyCharts')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.dailyCharts ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{t.pdf_config.daily_charts}</span></div>
                            <div onClick={() => toggleExportConfig('energyDispatch')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.energyDispatch ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{t.pdf_config.energy_dispatch}</span></div>
                            <div onClick={() => toggleExportConfig('correlation')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.correlation ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{t.pdf_config.correlation}</span></div>
                            <div onClick={() => toggleExportConfig('monthlyTable')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.monthlyTable ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{t.pdf_config.monthly_table}</span></div>
                            <div className="h-px bg-slate-100 my-2"></div>
                            <div onClick={() => toggleExportConfig('powerCurves')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.powerCurves ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{t.pdf_config.power_curves}</span></div>
                            <div onClick={() => toggleExportConfig('detailedSpecs')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.detailedSpecs ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{t.pdf_config.detailed_specs}</span></div>
                            <div className="h-px bg-slate-100 my-2"></div>
                            <div onClick={() => toggleExportConfig('cashFlow')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.cashFlow ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{t.pdf_config.cashflow}</span></div>
                            <div onClick={() => toggleExportConfig('cashFlowTable')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.cashFlowTable ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{t.pdf_config.cashflow_table}</span></div>
                            <div onClick={() => toggleExportConfig('investmentAnalysis')} className="flex items-center gap-3 cursor-pointer group">{exportConfig.investmentAnalysis ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-slate-300" size={20} />}<span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{t.pdf_config.investment_analysis}</span></div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowExportSettings(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition">{t.pdf_config.close}</button>
                            <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition">{isExporting ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />} {t.pdf_config.export}</button>
                        </div>
                    </div>
                </div>
            )}

            {showFormulaModal && <FormulaModal lang={lang} onClose={() => setShowFormulaModal(false)} />}

            {isExporting && customStats && (
                <div style={{ position: 'fixed', top: 0, left: '-10000px', width: '1200px', background: '#f8fafc', fontFamily: 'Arial, Helvetica, sans-serif' }}>

                    {/* PAGE 1: TECHNICAL OVERVIEW */}
                    <div id="report-page-1" className="p-8 min-h-[1650px] bg-white flex flex-col items-stretch gap-4">
                        {/* Premium Header */}
                        <div className="flex justify-between items-end border-b-2 border-blue-900 pb-4 mb-4">
                            <div className="flex items-center gap-4">
                                <img src={casLogoReport} className="h-16 w-auto object-contain" alt="CAS Logo" />
                                <div className="flex flex-col">
                                    <h1 className="text-2xl font-black text-blue-900 uppercase leading-none text-left">{t.pdf.header_report || "BÁO CÁO TÍNH TOÁN"}</h1>
                                    <h2 className="text-xl font-bold text-blue-800 uppercase leading-tight text-left">{t.pdf.header_install || "CÔNG SUẤT LẮP ĐẶT"} {projectName || "SOLAR PROJECT"}</h2>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 font-medium italic">{t.pdf.report_date}: {new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN')}</p>
                            </div>
                        </div>

                        {/* 1. Technical Efficiency Overview (3 Cards) */}
                        <div>
                            <h3 className="text-blue-700 font-bold text-lg mb-3 flex items-center gap-2">
                                <div className="p-1.5 bg-blue-50 rounded text-blue-600"><Gauge size={18} /></div>
                                1. {t.pdf.tech_efficiency_title || "Tổng quan Hiệu quả Kỹ thuật"}
                            </h3>
                            {customStats && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="border border-slate-200 rounded-lg p-4 flex flex-col items-center bg-slate-50">
                                        <Sun size={24} className="text-green-500 mb-2" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.pdf.pv_yield_yearly || "SẢN LƯỢNG PV"}</span>
                                        <span className="text-xl font-black text-green-600">{(customStats.totalSolarGen / 1000).toFixed(1)} <small className="text-xs text-slate-400 font-medium">{t.pdf.mwh_year || "MWh/năm"}</small></span>
                                    </div>
                                    <div className="border border-slate-200 rounded-lg p-4 flex flex-col items-center bg-slate-50">
                                        <Zap size={24} className="text-blue-500 mb-2" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.pdf.solar_used_yearly || "NĂNG LƯỢNG SOLAR TỰ DÙNG"}</span>
                                        <span className="text-xl font-black text-blue-600">{(customStats.totalUsed / 1000).toFixed(1)} <small className="text-xs text-slate-400 font-medium">{t.pdf.mwh_year || "MWh/năm"}</small></span>
                                    </div>
                                    <div className="border border-slate-200 rounded-lg p-4 flex flex-col items-center bg-slate-50">
                                        <Grid3X3 size={24} className="text-slate-500 mb-2" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.pdf.grid_import_yearly || "TỪ LƯỚI"}</span>
                                        <span className="text-xl font-black text-slate-700">{((customStats.totalLoad - customStats.totalUsed) / 1000).toFixed(1)} <small className="text-xs text-slate-400 font-medium">{t.pdf.mwh_year || "MWh/năm"}</small></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Technical Config */}
                        <div>
                            <h3 className="text-blue-700 font-bold text-lg mb-2 flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-50 rounded text-indigo-600"><SlidersHorizontal size={18} /></div>
                                2. {t.pdf.tech_config || "Cấu hình Kỹ thuật Sơ bộ"}
                            </h3>
                            <div className="border border-blue-100 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <tbody className="divide-y divide-blue-50">
                                        <tr className="bg-blue-50/30">
                                            <td className="px-4 py-2 font-bold text-slate-500 uppercase text-[11px] w-1/3">{t.pdf.pv_capacity}</td>
                                            <td className="px-4 py-2 font-bold text-blue-700">{formatNumber(realSystemSize)} kWp</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 font-bold text-slate-500 uppercase text-[11px]">{t.pdf.panels}</td>
                                            <td className="px-4 py-2 font-medium text-slate-700">{totalPanels}x Panel 580W (N-Type)</td>
                                        </tr>
                                        <tr className="bg-blue-50/30">
                                            <td className="px-4 py-2 font-bold text-slate-500 uppercase text-[11px]">{t.pdf.inverters}</td>
                                            <td className="px-4 py-2 font-medium text-slate-700">{inv1Qty}x {inv1Id ? INVERTER_DB.find(i => i.id === inv1Id)?.name : "Inverter"} ({inv1Qty > 0 ? formatNumber(inv1Qty * (INVERTER_DB.find(i => i.id === inv1Id)?.power || 0)) : 0} kW)</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-2 font-bold text-slate-500 uppercase text-[11px]">{t.pdf.bess}</td>
                                            <td className="px-4 py-2 font-medium text-slate-700">{bessKwh > 0 ? `${bessKwh} kWh / ${bessMaxPower} kW` : (t.pdf.no_bess || "Không sử dụng")}</td>
                                        </tr>
                                        <tr className="bg-blue-50/30">
                                            <td className="px-4 py-2 font-bold text-slate-500 uppercase text-[11px]">{t.area_province || "KHU VỰC / TỈNH THÀNH"}</td>
                                            <td className="px-4 py-2 font-medium text-slate-700">{selectedProvince?.name || (t.pdf.not_selected || "Chưa chọn")}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 3. Monthly Overview Chart */}
                        <div className="h-[400px]">
                            <h3 className="text-blue-700 font-bold text-lg mb-2 flex items-center gap-2">
                                <div className="p-1.5 bg-green-50 rounded text-green-600"><Calendar size={18} /></div>
                                3. {t.pdf.monthly_overview || "Tổng quan Năng lượng Hàng tháng"}
                            </h3>
                            <div className="h-[350px] w-full border border-slate-200 rounded-lg p-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={monthlyDetails} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} />
                                        <YAxis tick={{ fontSize: 10 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} />
                                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                        <Bar dataKey="used" stackId="a" name={t.pdf.legend_self_use || "Sản lượng tự dùng"} fill="#f97316" barSize={28} isAnimationActive={false} />
                                        <Bar dataKey="curtailed" stackId="a" name={t.pdf.legend_curtail || "Phát lên lưới/Cắt giảm"} fill="#22c55e" barSize={28} isAnimationActive={false} />
                                        <Line type="monotone" dataKey="load" name={t.pdf.legend_load || "Phụ tải (Load)"} stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6', stroke: '#fff', strokeWidth: 1.5 }} isAnimationActive={false} />
                                        <Line type="monotone" dataKey="gridImport" name={t.pdf.legend_grid_import || "Điện mua lưới"} stroke="#94a3b8" strokeWidth={4} strokeDasharray="5 5" dot={{ r: 2, fill: '#94a3b8' }} isAnimationActive={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 4. Daily Chart */}
                        <div className="h-[400px]">
                            <h3 className="text-blue-700 font-bold text-lg mb-2 flex items-center gap-2">
                                <div className="p-1.5 bg-amber-50 rounded text-amber-600"><Clock size={18} /></div>
                                4. {bessKwh > 0 ? (t.pdf.bess_dispatch_day || "Điều độ Pin Lưu trữ (Ngày điển hình)") : (t.pdf.energy_dispatch_day || "Biểu đồ Ngày điển hình")}
                            </h3>
                            <div className="h-[350px] w-full border border-slate-200 rounded-lg p-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    {bessKwh > 0 ? (
                                        <ComposedChart data={averageDayData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                                            <defs>
                                                <linearGradient id="pdfColorSolar" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                                                </linearGradient>
                                                <linearGradient id="pdfColorLoad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="hour" tick={{ fontSize: 9 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} />
                                            <YAxis tick={{ fontSize: 9 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} />
                                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />

                                            <Area type="monotone" dataKey="solarProfile" stroke="#f59e0b" fill="url(#pdfColorSolar)" strokeWidth={2} fillOpacity={1} dot={false} name="Solar" isAnimationActive={false} />
                                            <Bar dataKey="avgBessCharge" name={t.pdf.legend_bess_charge || "Pin sạc"} fill="#10b981" barSize={12} stackId="bess" isAnimationActive={false} />
                                            <Bar dataKey="avgBessDischarge" name={t.pdf.legend_bess_discharge || "Pin xả"} fill="#f43f5e" barSize={12} stackId="bess" isAnimationActive={false} />
                                            <Area type="monotone" dataKey="avgLoad" stroke="#3b82f6" fill="url(#pdfColorLoad)" fillOpacity={1} strokeWidth={1.5} dot={false} name={t.pdf.legend_load_avg || "Load (TB)"} isAnimationActive={false} />
                                            <Line type="monotone" dataKey="weekend" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" dot={false} name={t.pdf.legend_load_we || "Load (Weekend)"} isAnimationActive={false} />
                                        </ComposedChart>
                                    ) : (
                                        <ComposedChart data={averageDayData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                                            <defs>
                                                <linearGradient id="pdfColorLoad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                                                </linearGradient>
                                                <linearGradient id="pdfColorWeekend" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                                                </linearGradient>
                                                <linearGradient id="pdfColorSolar" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="hour" tick={{ fontSize: 9 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} />
                                            <YAxis tick={{ fontSize: 9 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={{ stroke: '#cbd5e1' }} />
                                            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                            <Area type="monotone" dataKey="solarProfile" stroke="#22c55e" fill="url(#pdfColorSolar)" strokeWidth={2} fillOpacity={1} dot={false} name="Solar" isAnimationActive={false} />
                                            <Area type="monotone" dataKey="weekend" stroke="#ef4444" strokeDasharray="4 2" fill="url(#pdfColorWeekend)" fillOpacity={1} name={t.pdf.load_weekend || "Tải cuối tuần"} strokeWidth={2} dot={false} isAnimationActive={false} />
                                            <Area type="monotone" dataKey="weekday" stroke="#3b82f6" fill="url(#pdfColorLoad)" fillOpacity={1} strokeWidth={1.5} dot={false} name={t.pdf.load_weekday || "Phụ tải (T2-T7)"} isAnimationActive={false} />
                                        </ComposedChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 5. Scenario Analysis */}
                        <div>
                            <h3 className="text-blue-700 font-bold text-lg mb-2 flex items-center gap-2">
                                <div className="p-1.5 bg-purple-50 rounded text-purple-600"><Layers size={18} /></div>
                                5. {t.pdf.energy_analysis || "Phân tích Năng lượng theo Kịch bản"}
                            </h3>
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-[10px] text-left">
                                    <thead className="bg-blue-50/50 text-slate-600 font-bold border-b border-blue-100 uppercase tracking-wider">
                                        <tr>
                                            <th rowSpan={2} className="px-4 py-2 border-r border-blue-100 align-middle text-center">{t.pdf.scenario}</th>
                                            <th colSpan={2} className="px-4 py-1 border-r border-blue-100 text-center text-blue-600 border-b border-blue-100">{t.pdf.self_use}</th>
                                            <th colSpan={2} className="px-4 py-1 text-center text-amber-600 border-b border-blue-100">{t.pdf.excess}</th>
                                        </tr>
                                        <tr>
                                            <th className="px-4 py-1 border-r border-blue-100 text-center text-blue-500">{t.pdf.peak}</th>
                                            <th className="px-4 py-1 border-r border-blue-100 text-center text-blue-500">{t.pdf.normal}</th>
                                            <th className="px-4 py-1 border-r border-blue-100 text-center text-amber-500">{t.pdf.peak}</th>
                                            <th className="px-4 py-1 text-center text-amber-500">{t.pdf.normal}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {scenarios.map((s, i) => (
                                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                                                <td className="px-4 py-2 border-r border-slate-100 font-medium text-slate-700">{s.label} ({s.kwp} kWp)</td>
                                                <td className="px-4 py-2 text-right text-blue-700 border-r border-slate-100">{formatNumber(s.stats?.usedPeak || 0)}</td>
                                                <td className="px-4 py-2 text-right text-blue-700 border-r border-slate-100">{formatNumber(s.stats?.usedNormal || 0)}</td>
                                                <td className="px-4 py-2 text-right text-amber-700 border-r border-slate-100">{formatNumber((s.stats?.curtailedPeak || 0) + (s.stats?.exportedPeak || 0))}</td>
                                                <td className="px-4 py-2 text-right text-amber-700">{formatNumber((s.stats?.curtailedNormal || 0) + (s.stats?.exportedNormal || 0))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div id="report-page-2" className="pt-4 px-10 pb-10 min-h-[1650px] bg-white flex flex-col items-stretch gap-0">
                        {/* Premium Header Mini */}
                        <div className="flex justify-between items-end border-b border-blue-900 pb-1 mb-1">
                            <div className="flex items-center gap-2">
                                <img src={casLogoReport} className="h-6 w-auto object-contain" alt="CAS Logo" />
                                <div className="flex flex-col">
                                    <h1 className="text-base font-black text-blue-900 uppercase leading-none text-left">{t.pdf.header_operation || "CHI TIẾT VẬN HÀNH"}</h1>
                                    <h2 className="text-[10px] font-bold text-blue-800 uppercase leading-tight text-left">{projectName || "SOLAR PROJECT"}</h2>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] text-slate-500 font-medium italic">{t.pdf.report_date}: {new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN')}</p>
                            </div>
                        </div>



                        {/* 7. POWER CURVES */}
                        <div>
                            <h3 className="text-blue-700 font-bold text-lg mb-1 flex items-center gap-2">
                                <div className="p-1.5 bg-blue-50 rounded text-blue-600"><Activity size={18} /></div>
                                6. {t.pdf.power_curves || "Power Curves (12 Tháng)"}
                            </h3>
                            <div className="grid grid-cols-4 gap-2">
                                {monthlyPowerCurves.map((mItem, idx) => (
                                    <div key={idx} className="border border-slate-200 rounded p-1.5 h-48 bg-white">
                                        <div className="text-[8px] font-bold text-slate-500 mb-0.5 text-center uppercase">{mItem.month}</div>
                                        <div className="h-36 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={mItem.data} margin={{ top: 5, right: 5, left: 0, bottom: 15 }}>
                                                    <defs>
                                                        <linearGradient id={`pdfColorWeekday-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id={`pdfColorWeekend-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id={`pdfColorSolar-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis dataKey="hour" tick={{ fontSize: 6, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={5} />
                                                    <YAxis tick={{ fontSize: 6, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={22} />
                                                    <Area type="monotone" dataKey="weekday" stroke="#3b82f6" strokeWidth={1.5} fill={`url(#pdfColorWeekday-${idx})`} dot={false} isAnimationActive={false} />
                                                    <Area type="monotone" dataKey="weekend" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 3" fill={`url(#pdfColorWeekend-${idx})`} dot={false} isAnimationActive={false} />
                                                    <Area type="monotone" dataKey="solar" stroke="#eab308" strokeWidth={1.5} fill={`url(#pdfColorSolar-${idx})`} dot={false} isAnimationActive={false} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex justify-center items-center gap-1.5 mt-0.5 w-full text-[6px] text-slate-500">
                                            <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-blue-500"></div> {t.pdf.mon_sat}</div>
                                            <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-red-500"></div> {t.pdf.sun}</div>
                                            <div className="flex items-center gap-0.5"><div className="w-1 h-1 rounded-full bg-yellow-400"></div> Solar</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 8. YEARLY ENERGY SUMMARY */}
                        <div>
                            <h3 className="text-blue-700 font-bold text-lg mb-1 flex items-center gap-2">
                                <div className="p-1.5 bg-emerald-50 rounded text-emerald-600"><Table size={18} /></div>
                                7. {t.pdf.yearly_summary || "Tổng hợp Năng lượng theo Năm"}
                            </h3>
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full text-[10px] text-left">
                                    <thead className="bg-blue-50/50 text-slate-600 font-bold border-b border-blue-100 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-3 py-2 border-r border-blue-100 text-center">{t.pdf.col_month || "Tháng"}</th>
                                            <th className="px-3 py-2 border-r border-blue-100 text-center text-amber-600">{t.pdf.col_solar || "Solar (MWh)"}</th>
                                            <th className="px-3 py-2 border-r border-blue-100 text-center text-blue-600">{t.pdf.col_load || "Load (MWh)"}</th>
                                            <th className="px-3 py-2 border-r border-blue-100 text-center text-orange-600">{t.pdf.col_pv_used || "Tự dùng (MWh)"}</th>
                                            <th className="px-3 py-2 border-r border-blue-100 text-center text-green-600">{t.pdf.curtailment || "Cắt giảm (MWh)"}</th>
                                            <th className="px-3 py-2 text-center text-slate-500">{t.pdf.ratio_pct || "Tỷ lệ %"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {monthlyDetails.map((m, i) => (
                                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                                <td className="px-3 py-1.5 font-bold text-slate-600 text-center">{m.month}</td>
                                                <td className="px-3 py-1.5 text-center text-amber-700 font-medium">{formatNumber((m.solar || 0) / 1000)}</td>
                                                <td className="px-3 py-1.5 text-center text-blue-700 font-medium">{formatNumber((m.load || 0) / 1000)}</td>
                                                <td className="px-3 py-1.5 text-center text-orange-600 font-medium">{formatNumber((m.used || 0) / 1000)}</td>
                                                <td className="px-3 py-1.5 text-center text-green-600 font-medium">{formatNumber((m.curtailed || 0) / 1000)}</td>
                                                <td className="px-3 py-1.5 text-center font-bold text-slate-700">{m.load > 0 ? ((m.used / m.load) * 100).toFixed(1) : 0}%</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-blue-100/50 font-black">
                                            <td className="px-3 py-2 text-center text-blue-800">{t.pdf.total_year || "TỔNG NĂM"}</td>
                                            <td className="px-3 py-2 text-center text-amber-700">{formatNumber(monthlyDetails.reduce((s, m) => s + (m.solar || 0), 0) / 1000)}</td>
                                            <td className="px-3 py-2 text-center text-blue-700">{formatNumber(monthlyDetails.reduce((s, m) => s + (m.load || 0), 0) / 1000)}</td>
                                            <td className="px-3 py-2 text-center text-orange-600">{formatNumber(monthlyDetails.reduce((s, m) => s + (m.used || 0), 0) / 1000)}</td>
                                            <td className="px-3 py-2 text-center text-green-600">{formatNumber(monthlyDetails.reduce((s, m) => s + (m.curtailed || 0), 0) / 1000)}</td>
                                            <td className="px-3 py-2 text-center text-blue-800">{monthlyDetails.reduce((s, m) => s + (m.load || 0), 0) > 0 ? ((monthlyDetails.reduce((s, m) => s + (m.used || 0), 0) / monthlyDetails.reduce((s, m) => s + (m.load || 0), 0)) * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* PAGE 3: FINANCIAL ANALYSIS */}
                    <div id="report-page-3" className="pt-4 px-10 pb-10 min-h-[1650px] bg-white flex flex-col items-stretch gap-2">
                        {/* Premium Header Mini */}
                        <div className="flex justify-between items-end border-b border-blue-900 pb-1 mb-1">
                            <div className="flex items-center gap-2">
                                <img src={casLogoReport} className="h-6 w-auto object-contain" alt="CAS Logo" />
                                <div className="flex flex-col">
                                    <h1 className="text-base font-black text-blue-900 uppercase leading-none text-left">{t.pdf.header_finance || "PHÂN TÍCH TÀI CHÍNH"}</h1>
                                    <h2 className="text-[10px] font-bold text-blue-800 uppercase leading-tight text-left">{projectName || "SOLAR PROJECT"}</h2>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] text-slate-500 font-medium italic">{t.pdf.report_date}: {new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN')}</p>
                            </div>
                        </div>
                        <h3 className="text-blue-700 font-bold text-lg mb-3 flex items-center gap-2">
                            <div className="p-1.5 bg-blue-50 rounded text-blue-600"><TrendingUp size={18} /></div>
                            8. {t.pdf.cash_flow_roi_title || "Phân tích Dòng tiền & ROI"}
                        </h3>

                        {/* FRAME 1: ENVIRONMENTAL IMPACT */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <div className="mb-4 p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Leaf size={120} className="text-emerald-500 transform rotate-12" />
                                </div>
                                <h3 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2 relative z-10">
                                    <Leaf size={14} className="text-emerald-600" />
                                    {t.pdf_config.env_impact || "Hiệu quả Môi trường"}
                                </h3>
                                <p className="text-[10px] text-emerald-600 mb-3 max-w-[80%] relative z-10 font-medium">{t.pdf_config.env_desc}</p>

                                <div className="grid grid-cols-3 gap-3 relative z-10">
                                    {/* CO2 Saved */}
                                    <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-emerald-100 shadow-sm flex flex-col items-center text-center">
                                        <div className="p-2 bg-emerald-100 rounded-full mb-1 text-emerald-600">
                                            <CloudSun size={18} />
                                        </div>
                                        <span className="text-lg font-black text-slate-700">
                                            {formatNumber((customStats?.totalSolarGen || 0) * CO2_KG_PER_KWH / 1000)}
                                        </span>
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{t.pdf_config.ton_year}</span>
                                        <span className="text-[10px] text-slate-400 font-medium mt-1">{t.pdf_config.co2_saved}</span>
                                    </div>

                                    {/* Trees Planted */}
                                    <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-emerald-100 shadow-sm flex flex-col items-center text-center">
                                        <div className="p-2 bg-green-100 rounded-full mb-1 text-green-600">
                                            <Trees size={18} />
                                        </div>
                                        <span className="text-lg font-black text-slate-700">
                                            {formatNumber((customStats?.totalSolarGen || 0) * CO2_KG_PER_KWH * TREES_PER_CO2_KG)}
                                        </span>
                                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{t.pdf_config.trees}</span>
                                        <span className="text-[10px] text-slate-400 font-medium mt-1">{t.pdf_config.trees_planted}</span>
                                    </div>

                                    {/* Coal Saved */}
                                    <div className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-emerald-100 shadow-sm flex flex-col items-center text-center">
                                        <div className="p-2 bg-slate-100 rounded-full mb-1 text-slate-600">
                                            <Factory size={18} />
                                        </div>
                                        <span className="text-lg font-black text-slate-700">
                                            {formatNumber((customStats?.totalSolarGen || 0) * COAL_KG_PER_KWH / 1000)}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.pdf_config.ton_coal}</span>
                                        <span className="text-[10px] text-slate-400 font-medium mt-1">{t.pdf_config.coal_saved}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FRAME 2: CASH FLOW CHART */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <div className="h-[350px] w-full">
                                <h4 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">{t.pdf.cashflow_chart || "Biểu đồ Dòng tiền (Tích lũy)"}</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={currentFinance.cumulativeData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                                        <YAxis
                                            yAxisId="left"
                                            tick={({ x, y, payload }) => {
                                                const val = payload.value;
                                                const formatted = Math.abs(val) >= 1e9 ? `${(val / 1e9).toFixed(1)} Tỷ` : Math.abs(val) >= 1e6 ? `${(val / 1e6).toFixed(0)} Tr` : val;
                                                return <text x={x} y={y} dy={4} textAnchor="end" fontSize={10} fill="#666">{formatted}</text>;
                                            }}
                                            width={60}
                                            label={{ value: t.pdf.finance_table.net_flow, angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: '#64748b' } }}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            tick={({ x, y, payload }) => {
                                                const val = payload.value;
                                                const formatted = Math.abs(val) >= 1e9 ? `${(val / 1e9).toFixed(1)} Tỷ` : Math.abs(val) >= 1e6 ? `${(val / 1e6).toFixed(0)} Tr` : val;
                                                return <text x={x} y={y} dy={4} textAnchor="start" fontSize={10} fill="#666">{formatted}</text>;
                                            }}
                                            width={60}
                                            label={{ value: t.pdf.finance_table.acc, angle: 90, position: 'insideRight', offset: 10, style: { fontSize: 10, fill: '#64748b' } }}
                                        />
                                        <ReferenceLine yAxisId="left" y={0} stroke="#94a3b8" />
                                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                                        <Bar yAxisId="left" dataKey="net" name={t.pdf.finance_table.net_flow} barSize={20} isAnimationActive={false}>
                                            {currentFinance.cumulativeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.net >= 0 ? '#3b82f6' : '#ef4444'} />
                                            ))}
                                        </Bar>
                                        <Line yAxisId="right" type="monotone" dataKey="acc" name={t.pdf.finance_table.acc} stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* FRAME 3: CASH FLOW TABLE */}
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                            <div className="rounded-lg border border-slate-200 overflow-hidden">
                                <table className="w-full text-[10px] text-left">
                                    <thead className="bg-slate-50 font-black text-slate-500 uppercase">
                                        <tr>
                                            <th className="p-3 border-r border-slate-100">{t.pdf.finance_table.year}</th>
                                            <th className="p-3 border-r border-slate-100 text-right">{t.pdf.finance_table.revenue}</th>
                                            <th className="p-3 border-r border-slate-100 text-right">{t.pdf.finance_table.om}</th>
                                            <th className="p-3 border-r border-slate-100 text-right text-red-500">{t.pdf.finance_table.replacement}</th>
                                            <th className="p-3 border-r border-slate-100 text-right font-black text-blue-600">{t.pdf.finance_table.net_flow}</th>
                                            <th className="p-3 text-right font-black text-emerald-600">{t.pdf.finance_table.acc}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {currentFinance.cumulativeData.map((y, i) => (
                                            <tr key={i}>
                                                <td className="p-2 font-black">{y.year === 0 ? (t.pdf.finance_table.year_0 || "Investment (Year 0)") : `${t.pdf.finance_table.year || "Year"} ${y.year}`}</td>
                                                <td className="p-2 text-right font-medium text-slate-600">{y.year > 0 ? formatMoney(y.revenue) : '-'}</td>
                                                <td className="p-2 text-right font-medium text-slate-600">{y.year > 0 ? formatMoney(y.om) : '-'}</td>
                                                <td className="p-2 text-right font-medium text-red-500">{y.replace < 0 ? formatMoney(y.replace) : '-'}</td>
                                                <td className="p-2 text-right font-black text-blue-600">{formatMoney(y.net)}</td>
                                                <td className={`p-2 text-right font-black ${y.acc >= 0 ? 'text-emerald-600' : 'text-orange-500'}`}>{formatMoney(y.acc)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* FRAME 4: INVESTMENT INDICATORS */}
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{t.pdf.investment_indicators || "Chỉ số Hiệu quả Đầu tư"}</h4>
                            <div className="grid grid-cols-4 gap-2">
                                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                                    <p className="text-[9px] font-black text-emerald-600 uppercase">NPV</p>
                                    <p className="text-sm font-black text-emerald-700">{formatMoney(currentFinance.npv)}</p>
                                </div>
                                <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-center">
                                    <p className="text-[9px] font-black text-blue-600 uppercase">IRR</p>
                                    <p className="text-sm font-black text-blue-700">{currentFinance.irr.toFixed(1)}%</p>
                                </div>
                                <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 text-center">
                                    <p className="text-[9px] font-black text-indigo-600 uppercase">{t.pdf.payback}</p>
                                    <p className="text-sm font-black text-indigo-700">{currentFinance.payback.toFixed(1)} <small className="text-[9px] font-normal">{lang === 'en' ? 'years' : 'Năm'}</small></p>
                                </div>
                                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                    <p className="text-[9px] font-black text-slate-600 uppercase">ROI</p>
                                    <p className="text-sm font-black text-slate-700">{((currentFinance.npv / currentFinance.initialCapex) * 100).toFixed(0)}%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PAGE 4: TECHNICAL SPECS & INVESTMENT ANALYSIS */}
                    <div id="report-page-4" className="pt-4 px-10 pb-10 min-h-[1400px] bg-white flex flex-col items-stretch gap-2">
                        {/* Premium Header Mini */}
                        <div className="flex justify-between items-end border-b border-blue-900 pb-1 mb-1">
                            <div className="flex items-center gap-2">
                                <img src={casLogoReport} className="h-6 w-auto object-contain" alt="CAS Logo" />
                                <div className="flex flex-col">
                                    <h1 className="text-base font-black text-blue-900 uppercase leading-none text-left">{t.pdf.header_specs || "THÔNG SỐ CHI TIẾT"}</h1>
                                    <h2 className="text-[10px] font-bold text-blue-800 uppercase leading-tight text-left">{projectName || "SOLAR PROJECT"}</h2>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] text-slate-500 font-medium italic">{t.pdf.report_date}: {new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'vi-VN')}</p>
                            </div>
                        </div>

                        {/* SECTION 10: DETAILED TECHNICAL SPECIFICATIONS (16 items) */}
                        <h3 className="text-blue-700 font-bold text-lg mb-3 flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-50 rounded text-indigo-600"><Settings size={18} /></div>
                            10. {t.pdf.detailed_specs || "Thông số Kỹ thuật Chi tiết (16 Mục)"}
                        </h3>

                        {/* Frame 1: 16 Detailed Specs Table */}
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                            <div className="rounded-lg border border-slate-200 overflow-hidden">
                                <table className="w-full text-[10px]">
                                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
                                        <tr>
                                            <th className="p-2 text-center w-8 border-r border-slate-100">#</th>
                                            <th className="p-2 text-left border-r border-slate-100">{t.pdf.spec_name || "Thông số"}</th>
                                            <th className="p-2 text-right border-r border-slate-100 w-24">{t.pdf.spec_value || "Giá trị"}</th>
                                            <th className="p-2 text-center w-12">{t.pdf.spec_unit || "ĐV"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {/* Row 1-8: Energy Stats */}
                                        <tr className="hover:bg-slate-50"><td className="p-1.5 text-center text-slate-400 border-r border-slate-100">1</td><td className="p-1.5 border-r border-slate-100">{t.tech_labels.pv_total}</td><td className="p-1.5 text-right font-bold border-r border-slate-100">{formatNumber(customStats?.totalSolarGen || 0)}</td><td className="p-1.5 text-center text-slate-400">kWh</td></tr>
                                        <tr className="hover:bg-green-50/50 bg-green-50/30"><td className="p-1.5 text-center text-slate-400 border-r border-slate-100">2</td><td className="p-1.5 border-r border-slate-100">{t.tech_labels.pv_used}</td><td className="p-1.5 text-right font-bold text-green-600 border-r border-slate-100">{formatNumber(customStats?.totalUsed || 0)}</td><td className="p-1.5 text-center text-slate-400">kWh</td></tr>
                                        <tr className="hover:bg-green-50/50 bg-green-50/30"><td className="p-1.5 text-center text-slate-400 border-r border-slate-100">3</td><td className="p-1.5 border-r border-slate-100">{t.tech_labels.pv_used_pct}</td><td className="p-1.5 text-right font-bold text-green-600 border-r border-slate-100">{((customStats?.totalUsed || 0) / (customStats?.totalSolarGen || 1) * 100).toFixed(2)}</td><td className="p-1.5 text-center text-slate-400">%</td></tr>
                                        <tr className="hover:bg-red-50/50 bg-red-50/30"><td className="p-1.5 text-center text-slate-400 border-r border-slate-100">4</td><td className="p-1.5 border-r border-slate-100">{t.tech_labels.pv_curtailed}</td><td className="p-1.5 text-right font-bold text-red-500 border-r border-slate-100">{formatNumber((customStats?.totalCurtailed || 0) + (customStats?.totalExported || 0))}</td><td className="p-1.5 text-center text-slate-400">kWh</td></tr>
                                        <tr className="hover:bg-red-50/50 bg-red-50/30"><td className="p-1.5 text-center text-slate-400 border-r border-slate-100">5</td><td className="p-1.5 border-r border-slate-100">{t.tech_labels.pv_curtailed_pct}</td><td className="p-1.5 text-right font-bold text-red-500 border-r border-slate-100">{(((customStats?.totalCurtailed || 0) + (customStats?.totalExported || 0)) / (customStats?.totalSolarGen || 1) * 100).toFixed(2)}</td><td className="p-1.5 text-center text-slate-400">%</td></tr>
                                        <tr className="hover:bg-slate-50"><td className="p-1.5 text-center text-slate-400 border-r border-slate-100">6</td><td className="p-1.5 border-r border-slate-100">{t.tech_labels.grid_import}</td><td className="p-1.5 text-right font-bold border-r border-slate-100">{formatNumber((customStats?.totalLoad || 0) - (customStats?.totalUsed || 0))}</td><td className="p-1.5 text-center text-slate-400">kWh</td></tr>
                                        <tr className="hover:bg-slate-50"><td className="p-1.5 text-center text-slate-400 border-r border-slate-100">7</td><td className="p-1.5 border-r border-slate-100">{t.tech_labels.total_load}</td><td className="p-1.5 text-right font-bold border-r border-slate-100">{formatNumber(customStats?.totalLoad || 0)}</td><td className="p-1.5 text-center text-slate-400">kWh</td></tr>
                                        <tr className="hover:bg-slate-50"><td className="p-1.5 text-center text-slate-400 border-r border-slate-100">8</td><td className="p-1.5 border-r border-slate-100">{t.tech_labels.loss_pct}</td><td className="p-1.5 text-right font-bold border-r border-slate-100">{customStats?.losses?.totalDerate || 0}</td><td className="p-1.5 text-center text-slate-400">%</td></tr>
                                        {/* Row 9-12: Normal/Peak */}
                                        <tr className="hover:bg-blue-50/50 bg-blue-50/20"><td className="p-1.5 text-center text-slate-400 border-r border-slate-100">9</td><td className="p-1.5 border-r border-slate-100">{t.tech_labels.pv_used_normal}</td><td className="p-1.5 text-right font-bold text-blue-600 border-r border-slate-100">{formatNumber(customStats?.usedNormal || 0)}</td><td className="p-1.5 text-center text-slate-400">kWh</td></tr>
                                        <tr className="hover:bg-blue-50/50 bg-blue-50/20"><td className="p-1.5 text-center text-slate-400 border-r border-slate-100">10</td><td className="p-1.5 border-r border-slate-100">{t.tech_labels.pv_used_normal_pct}</td><td className="p-1.5 text-right font-bold text-blue-600 border-r border-slate-100">{((customStats?.usedNormal || 0) / (customStats?.totalUsed || 1) * 100).toFixed(2)}</td><td className="p-1.5 text-center text-slate-400">%</td></tr>
                                        <tr className="hover:bg-indigo-50/50 bg-indigo-50/20"><td className="p-1.5 text-center text-slate-400 border-r border-slate-100">11</td><td className="p-1.5 border-r border-slate-100">{t.tech_labels.pv_used_peak}</td><td className="p-1.5 text-right font-bold text-indigo-600 border-r border-slate-100">{formatNumber(customStats?.usedPeak || 0)}</td><td className="p-1.5 text-center text-slate-400">kWh</td></tr>
                                        <tr className="hover:bg-indigo-50/50 bg-indigo-50/20"><td className="p-1.5 text-center text-slate-400 border-r border-slate-100">12</td><td className="p-1.5 border-r border-slate-100">{t.tech_labels.pv_used_peak_pct}</td><td className="p-1.5 text-right font-bold text-indigo-600 border-r border-slate-100">{((customStats?.usedPeak || 0) / (customStats?.totalUsed || 1) * 100).toFixed(2)}</td><td className="p-1.5 text-center text-slate-400">%</td></tr>
                                        {/* Row 13-16: Curtailed */}
                                        <tr className="hover:bg-amber-50/50 bg-amber-50/20"><td className="p-1.5 text-center text-slate-400 border-r border-slate-100">13</td><td className="p-1.5 border-r border-slate-100">{t.tech_labels.curtailed_normal}</td><td className="p-1.5 text-right font-bold text-amber-600 border-r border-slate-100">{formatNumber((customStats?.curtailedNormal || 0) + (customStats?.exportedNormal || 0))}</td><td className="p-1.5 text-center text-slate-400">kWh</td></tr>
                                        <tr className="hover:bg-amber-50/50 bg-amber-50/20"><td className="p-1.5 text-center text-slate-400 border-r border-slate-100">14</td><td className="p-1.5 border-r border-slate-100">{t.tech_labels.curtailed_normal_pct}</td><td className="p-1.5 text-right font-bold text-amber-600 border-r border-slate-100">{(((customStats?.curtailedNormal || 0) + (customStats?.exportedNormal || 0)) / ((customStats?.totalCurtailed || 0) + (customStats?.totalExported || 1)) * 100).toFixed(2)}</td><td className="p-1.5 text-center text-slate-400">%</td></tr>
                                        <tr className="hover:bg-orange-50/50 bg-orange-50/20"><td className="p-1.5 text-center text-slate-400 border-r border-slate-100">15</td><td className="p-1.5 border-r border-slate-100">{t.tech_labels.curtailed_peak}</td><td className="p-1.5 text-right font-bold text-orange-600 border-r border-slate-100">{formatNumber((customStats?.curtailedPeak || 0) + (customStats?.exportedPeak || 0))}</td><td className="p-1.5 text-center text-slate-400">kWh</td></tr>
                                        <tr className="hover:bg-orange-50/50 bg-orange-50/20"><td className="p-1.5 text-center text-slate-400 border-r border-slate-100">16</td><td className="p-1.5 border-r border-slate-100">{t.tech_labels.curtailed_peak_pct}</td><td className="p-1.5 text-right font-bold text-orange-600 border-r border-slate-100">{(((customStats?.curtailedPeak || 0) + (customStats?.exportedPeak || 0)) / ((customStats?.totalCurtailed || 0) + (customStats?.totalExported || 1)) * 100).toFixed(2)}</td><td className="p-1.5 text-center text-slate-400">%</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* SECTION 11: INVESTMENT SCENARIO COMPARISON */}
                        <h3 className="text-blue-700 font-bold text-lg mb-3 flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-50 rounded text-emerald-600"><TrendingUp size={18} /></div>
                            11. {t.pdf.scenario_comparison || "So sánh Kịch bản Đầu tư"}
                        </h3>

                        {/* Frame 2: Scenario Comparison Table */}
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                            <div className="rounded-lg border border-slate-200 overflow-hidden">
                                <table className="w-full text-[10px]">
                                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
                                        <tr>
                                            <th rowSpan={2} className="p-2 text-left border-r border-slate-100">{t.pdf.scenario_name || "Kịch bản"}</th>
                                            <th colSpan={2} className="p-2 text-center border-r border-slate-100 bg-blue-50 text-blue-600">{t.pdf.self_use || "Tự dùng (kWh)"}</th>
                                            <th colSpan={2} className="p-2 text-center bg-amber-50 text-amber-600">{t.pdf.excess || "Dư thừa (kWh)"}</th>
                                        </tr>
                                        <tr>
                                            <th className="p-2 text-center border-r border-slate-100 text-blue-500">{t.pdf.peak || "Peak"}</th>
                                            <th className="p-2 text-center border-r border-slate-100 text-blue-500">{t.pdf.normal || "Normal"}</th>
                                            <th className="p-2 text-center border-r border-slate-100 text-amber-500">{t.pdf.peak || "Peak"}</th>
                                            <th className="p-2 text-center text-amber-500">{t.pdf.normal || "Normal"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {scenarios.map((s, i) => (
                                            <tr key={i} className={`hover:bg-slate-50 ${targetKwp === s.kwp ? 'bg-indigo-50/50 font-bold' : ''}`}>
                                                <td className="p-2 text-slate-700 font-medium border-r border-slate-100">
                                                    {s.label} ({s.kwp} kWp)
                                                    {targetKwp === s.kwp && <span className="ml-1 text-[8px] bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded">✓</span>}
                                                </td>
                                                <td className="p-2 text-right text-blue-700 border-r border-slate-100">{formatNumber(s.stats.usedPeak)}</td>
                                                <td className="p-2 text-right text-blue-700 border-r border-slate-100">{formatNumber(s.stats.usedNormal)}</td>
                                                <td className="p-2 text-right text-amber-700 border-r border-slate-100">{formatNumber(s.stats.curtailedPeak + (s.stats.exportedPeak || 0))}</td>
                                                <td className="p-2 text-right text-amber-700">{formatNumber(s.stats.curtailedNormal + (s.stats.exportedNormal || 0))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            <aside className={`fixed inset-y-0 left-0 z-20 w-64 bg-slate-50 border-r border-slate-200 transform transition-transform duration-200 ease-in-out shrink-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-20 flex items-center justify-start pl-6 border-b border-blue-900 bg-gradient-to-r from-[#004e92] to-[#000428] cursor-pointer hover:opacity-95 transition-colors group" onClick={() => {
                    setDesignMode(null);
                    setProcessedData([]);
                    setRawData([]);
                    setSolarLayers([]);
                    setLoadTag({ label: '', isWeekendOff: false });
                    setSolarMetadata({});
                    setCustomStats(null);
                    setScenarios([]);
                    setActiveTab('dashboard');
                }}>
                    <img src={casLogo} alt="CAS Logo" className="h-8 w-auto mr-3 transition-transform group-hover:scale-105" />
                    <div className="flex flex-col">
                        <span className="font-black text-sm leading-tight text-white drop-shadow-sm">SOLAR</span>
                        <span className="font-bold text-blue-100 text-[10px] tracking-widest uppercase">Optimizer</span>
                    </div>
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                    <div className="space-y-1">
                        {[
                            { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
                            { id: 'design', label: t.design, icon: SlidersHorizontal },
                            { id: 'finance', label: t.finance, icon: TrendingUp },
                            { id: 'report', label: t.report, icon: ClipboardList }
                        ].map(item => (
                            <button key={item.id} onClick={() => { setActiveTab(item.id); if (window.innerWidth < 768) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === item.id ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'}`}><item.icon size={15} /> {item.label}</button>
                        ))}
                    </div>
                    <div className="border-t border-slate-200 pt-2"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">{t.actions}</p>
                        {customStats && (
                            <div className="space-y-1">
                                <button onClick={() => setShowExportSettings(true)} className="w-full flex items-center justify-start gap-2 px-2 py-1.5 text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded text-xs transition font-medium"><Settings size={14} /> {t.report_config}</button>
                                <button onClick={() => setShowFormulaModal(true)} className="w-full flex items-center justify-start gap-2 px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded text-xs transition font-medium"><Calculator size={14} /> {t.view_formulas}</button>
                                <button onClick={handleExportPDF} disabled={pdfLibStatus !== 'ready' || isExporting} className="w-full flex items-center justify-center gap-2 px-2 py-1.5 bg-gradient-to-r from-blue-700 to-blue-900 hover:shadow-lg text-white rounded text-xs transition disabled:bg-slate-400 shadow-sm">{isExporting ? <RefreshCw className="animate-spin" size={14} /> : <Printer size={14} />}{isExporting ? t.generating_pdf : t.export_pdf}</button>
                            </div>
                        )}
                    </div>
                    <div className="border-t border-slate-200 pt-2 px-1">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block">{t.project_info}</label>
                        <DebouncedInput value={projectName} onChange={setProjectName} placeholder={t.project_name + "..."} className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white" />
                    </div>
                    <div className="border-t border-slate-200 pt-2"><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">{t.input_data}</p>
                        <div className="space-y-2">
                            <div className="px-2 py-1.5 bg-white rounded border border-slate-200 text-xs shadow-sm group hover:border-blue-300 transition-colors">
                                <div className="flex justify-between items-center"><span className="font-medium text-slate-700 flex items-center gap-1"><Zap size={12} className="text-amber-500" />{t.load_profile}</span><button onClick={() => fileInputRef.current?.click()} className="text-blue-600 hover:underline text-[10px]"><RefreshCw size={10} /></button></div><div className="text-[10px] text-slate-500 whitespace-normal">{loadTag.label ? t.status.loaded + loadTag.label : t.profile_types.none}</div>
                            </div>
                            <input type="file" ref={fileInputRef} accept=".csv,.txt,.xlsx,.xls" className="hidden" onChange={handleFileUpload} onClick={(e) => e.target.value = null} />


                            <div className={`px-2 py-1.5 rounded border text-xs shadow-sm transition-colors group hover:border-blue-300 ${realSolarProfile ? 'bg-white border-blue-200' : 'bg-white border-slate-200'}`}>
                                <div className="flex justify-between items-center"><span className="font-medium text-slate-700 flex items-center gap-1"><Sun size={12} className="text-orange-500" />{t.solar_data}</span><button onClick={() => solarFileInputRef.current?.click()} className="text-blue-600 hover:underline text-[10px]"><Upload size={10} /></button></div>
                                <div className="text-[10px] text-slate-500 truncate" title={solarSourceName}>{solarLayers.length > 0 ? `${solarLayers.length} ${t.status.layers || 'Layers'}` : (realSolarProfile ? t.status.loaded_short : 'Default (Sine)')}</div>

                                {solarLayers.length > 0 ? (
                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                        <div className="grid grid-cols-4 gap-2">
                                            {['temp', 'soiling', 'cable', 'inverter'].map(k => (
                                                <div key={k}><label className="text-[9px] font-bold text-slate-400 block mb-0.5">{t.loss_labels[k]}</label><input type="number" step="0.1" value={techParams.losses[k]} className="w-full p-1 border rounded text-xs text-center bg-slate-50 border-slate-200 text-slate-600" readOnly /></div>
                                            ))}
                                        </div>
                                        <div className="text-right text-[10px] font-bold text-blue-500 mt-1">{t.loss_labels.total_derate}: {((1 - (Object.values(techParams.losses).reduce((a, b) => a + b, 0) / 100)) * 100).toFixed(1)}%</div>

                                        {solarLayers[selectedLayerIndex]?.title.toLowerCase().includes('pvout') && (
                                            <div className="mt-1 p-1 bg-blue-50 border border-blue-100 rounded text-[9px] text-blue-600 leading-tight italic">
                                                {t.status.pvout_explanation}
                                            </div>
                                        )}
                                        {solarLayers.length > 1 ? (
                                            <>
                                                <label className="text-[10px] text-blue-500 font-bold block mb-1 flex items-center gap-1"><Layers size={10} /> {t.status.select_layer}</label>
                                                <select
                                                    className="w-full text-[10px] p-1 border rounded bg-white text-blue-700 font-medium border-blue-200"
                                                    value={selectedLayerIndex}
                                                    onChange={(e) => handleLayerChange(Number(e.target.value))}
                                                >
                                                    {solarLayers.map((layer, idx) => (
                                                        <option key={idx} value={idx}>{layer.title} (Sc: {layer.score})</option>
                                                    ))}
                                                </select>
                                            </>
                                        ) : null}
                                    </div>
                                ) : null}
                                {solarMetadata && !!solarMetadata.lat && (<div className="text-[9px] text-blue-400 mt-1 flex gap-1 pt-1 border-t border-slate-100"><MapPin size={10} className="mt-0.5" /> {solarMetadata.siteName ? solarMetadata.siteName.substring(0, 10) : ''} ({solarMetadata.lat.toFixed(2)}, {solarMetadata.lon.toFixed(2)})</div>)}

                            </div>
                            <input type="file" ref={solarFileInputRef} accept=".csv,.txt,.xlsx,.xls,.met,.pdf" className="hidden" onChange={handleSolarUpload} onClick={(e) => e.target.value = null} />

                            {/* Weather Scenario - Separate Box */}
                            <div className={`px-2 py-1.5 rounded border text-xs shadow-sm transition-colors ${weatherScenario === 'normal' ? 'bg-green-50 border-green-200' :
                                weatherScenario === 'rainy' ? 'bg-blue-50 border-blue-200' :
                                    weatherScenario === 'bad' ? 'bg-amber-50 border-amber-200' :
                                        'bg-red-50 border-red-200'
                                }`}>
                                <div className="flex justify-between items-center">
                                    <span className={`font-medium flex items-center gap-1 ${weatherScenario === 'normal' ? 'text-green-700' :
                                        weatherScenario === 'rainy' ? 'text-blue-700' :
                                            weatherScenario === 'bad' ? 'text-amber-700' :
                                                'text-red-700'
                                        }`}><CloudSun size={12} /> {lang === 'vi' ? 'Thời tiết' : 'Weather'}</span>
                                </div>
                                <select
                                    className={`w-full text-xs p-1.5 border rounded font-medium transition ${weatherScenario === 'normal' ? 'bg-white text-green-700 border-green-300' :
                                        weatherScenario === 'rainy' ? 'bg-white text-blue-700 border-blue-300' :
                                            weatherScenario === 'bad' ? 'bg-white text-amber-700 border-amber-300' :
                                                'bg-white text-red-700 border-red-300'
                                        }`}
                                    value={weatherScenario}
                                    onChange={(e) => handleWeatherChange(e.target.value)}
                                >
                                    {Object.entries(WEATHER_SCENARIOS).map(([key, scenario]) => (
                                        <option key={key} value={key}>
                                            {scenario.icon} {lang === 'vi' ? scenario.label : scenario.labelEn} ({(scenario.derate * 100).toFixed(0)}%)
                                        </option>
                                    ))}
                                </select>
                                {weatherScenario !== 'normal' && (
                                    <div className={`mt-1.5 text-[10px] rounded px-2 py-1 flex items-center gap-1 ${weatherScenario === 'rainy' ? 'text-blue-600 bg-blue-100' :
                                        weatherScenario === 'bad' ? 'text-amber-600 bg-amber-100' :
                                            'text-red-600 bg-red-100'
                                        }`}>
                                        <AlertTriangle size={10} />
                                        {lang === 'vi'
                                            ? `Sản lượng Solar giảm ${((1 - WEATHER_SCENARIOS[weatherScenario].derate) * 100).toFixed(0)}%`
                                            : `Solar yield reduced by ${((1 - WEATHER_SCENARIOS[weatherScenario].derate) * 100).toFixed(0)}%`
                                        }
                                    </div>
                                )}
                            </div>


                        </div>
                    </div>
                </div>
                <div className="p-2 border-t border-slate-200 text-[9px] text-slate-400 text-center"><span className="font-bold">CPS Solar Solutions</span> © 2026 • Engineering Division</div>
            </aside>

            <main className={`flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-200 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 gap-4">
                    <div className="flex items-center gap-3 shrink-0">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                            {isSidebarOpen ? <Menu size={20} className="rotate-180" /> : <Menu size={20} />}
                        </button>
                        <div className="flex flex-col">
                            <h2 className="font-bold text-slate-800 leading-none">{t[activeTab]}</h2>
                            {loadTag.label && <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">{loadTag.label} {loadTag.isWeekendOff && '• ' + t.status.sun_off}</span>}
                        </div>
                    </div>

                    {/* Province Selector for Solar Yield */}
                    <div className="relative border-l border-slate-200 pl-4" ref={provinceDropdownRef}>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block leading-none">{t.area_province}</span>
                        <div
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition min-w-[180px] shadow-sm select-none"
                            onClick={() => setShowProvinceDropdown(!showProvinceDropdown)}
                        >
                            {(() => {
                                const style = getProvinceStyle(selectedProvince?.id);
                                const SelectedIcon = style.icon;
                                return <SelectedIcon size={14} className={style.color} />;
                            })()}
                            <div className="flex-1 overflow-hidden">
                                <span className="text-sm font-bold text-slate-700 block truncate leading-tight">
                                    {selectedProvince?.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium leading-none block pb-0.5">
                                    {selectedProvince?.peakSunHours}h/ngày
                                </span>
                            </div>
                            <ChevronRight size={14} className={`text-slate-400 transition-transform ${showProvinceDropdown ? 'rotate-90' : ''}`} />
                        </div>

                        {showProvinceDropdown && (
                            <div className="absolute top-full mt-2 left-4 w-72 max-h-80 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-[100] overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in duration-200">
                                <div className="grid grid-cols-1 gap-1">
                                    {PROVINCES.map(p => {
                                        const style = getProvinceStyle(p.id);
                                        const Icon = style.icon;
                                        return (
                                            <div
                                                key={p.id}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition ${selectedProvince?.id === p.id ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600'}`}
                                                onClick={() => {
                                                    handleProvinceChange(p.id);
                                                    setShowProvinceDropdown(false);
                                                }}
                                            >
                                                <div className="flex items-center">
                                                    <div className={`mr-3 p-1.5 rounded-full transition-colors ${selectedProvince?.id === p.id ? 'bg-white' : style.bg} ${style.color}`}>
                                                        <Icon size={16} strokeWidth={2} />
                                                    </div>
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-sm font-semibold">{p.name}</span>
                                                        {p.id === 'vietnam_average' && <span className="text-[10px] opacity-70">Vietnam Default</span>}
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedProvince?.id === p.id ? 'bg-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                                                    {p.peakSunHours}h
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>


                    {/* Dynamic Solar Slider (Debounced) */}
                    <div className="hidden md:flex flex-1 max-w-md mx-4 items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                        <span className="text-xs font-bold text-slate-600 whitespace-nowrap">{t.solar_capacity}:</span>
                        <DebouncedSlider targetKwp={targetKwp} setTargetKwp={setTargetKwp} maxKwp={maxKwpRef || 1000} />
                    </div>

                    <div className="flex items-center gap-4">{detectedMaxLoad > 0 && (<div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100"><Maximize size={14} /> {t.max_load}: {formatNumber(detectedMaxLoad)} kW</div>)}<div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-100"><Leaf size={14} /> {t.loss_percent}: {estimatedLosses?.systemLossPct?.toFixed(1) || '0.0'}%</div></div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                    <div className="max-w-6xl mx-auto space-y-6 pb-12">
                        {(!designMode && activeTab === 'dashboard') && (
                            <SmartDesignSelector
                                lang={lang}
                                setLang={setLang}
                                onSelect={handleInitialSelect}
                                pricingType={pricingType}
                                setPricingType={setPricingType}
                                voltageLevelId={voltageLevelId}
                                setVoltageLevelId={setVoltageLevelId}
                                EVN_TARIFFS={EVN_TARIFFS}
                            />
                        )}

                        {activeTab === 'dashboard' && designMode && (
                            <Dashboard
                                customStats={customStats}
                                isSimulating={isSimulating}
                                formatNumber={formatNumber}
                                params={params}
                                bessKwh={bessKwh}
                                averageDayData={averageDayData}
                                dailyStats={dailyStats}
                                solarMetadata={solarMetadata}
                                correlationData={correlationData}
                                monthlyDetails={monthlyDetails}
                                monthlyPowerCurves={monthlyPowerCurves}
                                lang={lang}
                                t={t}
                            />
                        )}

                        {activeTab === 'design' && (
                            <Design
                                inv1Id={inv1Id} setInv1Id={setInv1Id}
                                inv1Qty={inv1Qty} setInv1Qty={setInv1Qty}
                                inv2Id={inv2Id} setInv2Id={setInv2Id}
                                inv2Qty={inv2Qty} setInv2Qty={setInv2Qty}
                                customInv1Power={customInv1Power} setCustomInv1Power={setCustomInv1Power}
                                customInv2Power={customInv2Power} setCustomInv2Power={setCustomInv2Power}
                                INVERTER_OPTIONS={INVERTER_OPTIONS}
                                totalACPower={totalACPower}
                                targetKwp={targetKwp}
                                handleMagicSuggest={handleMagicSuggest}
                                techParams={techParams} setTechParams={setTechParams}
                                selectedBess={selectedBess} handleBessSelect={handleBessSelect}
                                BESS_OPTIONS={BESS_OPTIONS}
                                bessKwh={bessKwh} setBessKwh={setBessKwh}
                                bessMaxPower={bessMaxPower} setBessMaxPower={setBessMaxPower}
                                handleSuggestBessSize={handleSuggestBessSize}
                                handleSuggestSafeCapacity={handleSuggestSafeCapacity}
                                isGridCharge={isGridCharge} setIsGridCharge={setIsGridCharge}
                                bessStrategy={bessStrategy} setBessStrategy={setBessStrategy}
                                handleOptimize={handleOptimize}
                                handleOptimizeNoBess={handleOptimizeNoBess}
                                handleOptimizeBess={handleOptimizeBess}
                                processedData={processedData}
                                params={params} setParams={setParams}
                                finParams={finParams} setFinParams={setFinParams}
                                tariffCategory={pricingType} setTariffCategory={setPricingType}
                                voltageLevel={voltageLevelId} setVoltageLevel={setVoltageLevelId}
                                lang={lang}
                                t={t}
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
                                pricingType={pricingType} setPricingType={setPricingType}
                                voltageLevelId={voltageLevelId} setVoltageLevelId={setVoltageLevelId}
                                params={params} setParams={setParams}
                                onSelectScenario={handleSelectScenario}
                                lang={lang}
                                t={t}
                                EVN_TARIFFS={EVN_TARIFFS}
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
                                currentFinance={currentFinance}
                                estimatedLosses={estimatedLosses}
                                formatMoney={formatMoney}
                                lang={lang}
                                t={t}
                            />
                        )}
                    </div>
                </div>
            </main>

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
                className="premium-slider w-full h-2 rounded-lg cursor-pointer"
            />
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={localKwp || 0}
                    onChange={(e) => setLocalKwp(Number(e.target.value))}
                    className="w-16 text-center text-sm font-bold text-blue-700 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 px-1 py-0.5"
                />
                <span className="text-xs text-slate-500 font-bold">kWp</span>
            </div>
        </>
    );
};

// Helper Component for Text Input
const DebouncedInput = ({ value, onChange, placeholder, className }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localValue !== value) {
                onChange(localValue);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [localValue, value, onChange]);

    return (
        <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder={placeholder}
            className={className}
        />
    );
};

export default SolarOptimizer;
