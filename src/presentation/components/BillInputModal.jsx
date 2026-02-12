import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Zap, Calendar, Snowflake, ArrowBigRight, BarChart3, AlertCircle, Info, MapPin, Table, RefreshCw, Activity, Flame, TrendingUp, Car, HardHat, Sparkles, ChevronDown, Copy } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LOAD_PROFILES } from '../../utils/loadProfileGenerator';
import ALL_PROVINCES from '../../data/provinces.json';
import { EVN_TARIFFS, calculateBlendedPrice } from '../../data/evn_tariffs';

export const BillInputModal = ({ onClose, onComplete, title = "Advanced EVN Bill Input", lang = 'vi' }) => {
    // Basic Data State
    const [monthlyData, setMonthlyData] = useState(Array(12).fill(0));

    // Advanced Configuration State
    const [province, setProvince] = useState('TP. Hồ Chí Minh');
    const [customerGroup, setCustomerGroup] = useState('retail_manufacturing'); // business, manufacture, admin
    const [voltageLevel, setVoltageLevel] = useState('22kv_110kv'); // 110kv_plus, 22kv_110kv, 6kv_22kv, under_6kv

    // Default to a valid key from LOAD_PROFILES if possible, or fallback
    const [profileSector, setProfileSector] = useState(Object.keys(LOAD_PROFILES)[0] || "");
    const [workSchedule, setWorkSchedule] = useState('mon_sat'); // mon_fri, mon_sat, all_days

    const [seasonalCooling, setSeasonalCooling] = useState(false);
    const [viewMode, setViewMode] = useState('kwh'); // kwh, vnd
    const [chartTab, setChartTab] = useState('year'); // year, day
    const [manualPrice, setManualPrice] = useState('');
    const [isManualPrice, setIsManualPrice] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showProvinceList, setShowProvinceList] = useState(false);
    const [priceEscalation, setPriceEscalation] = useState(3);
    const [evCharging, setEvCharging] = useState(false);
    const [extraLoadType, setExtraLoadType] = useState('none'); // none, heatpump, machinery
    const dropdownRef = useRef(null);

    const dt = {
        vi: {
            config: "Cấu hình",
            evn_tariff: "Cài đặt Biểu giá EVN",
            evn_desc: "Cấu hình đối tượng và cấp điện áp",
            location: "Vị trí dự án",
            customer_group: "Nhóm khách hàng",
            business: "Kinh doanh",
            manufacture: "Sản xuất",
            admin: "Hành chính sự nghiệp",
            voltage_level: "Cấp điện áp",
            "110kv_plus": "Cao thế (> 110kV)",
            "22kv_110kv": "Trung thế (22kV - 110kV)",
            "6kv_22kv": "Trung thế (6kV - 22kV)",
            "under_6kv": "Hạ thế (< 6kV)",
            est_price: "Đơn giá dự tính",
            custom_price: "Tùy chỉnh",
            apply_custom: "Dùng giá này",
            op_profile: "Hồ sơ vận hành",
            unit_kwh: "Đơn vị: kWh",
            unit_vnd: "Đơn vị: VNĐ",
            fill_all: "Dàn đều",
            distribute: "Phân bổ mùa",
            sector: "Lĩnh vực / Đặc thù",
            sector_help: "Dùng để giả lập biểu đồ tải (Load Curve) dựa trên tổng điện năng tháng.",
            sector_help: "Dùng để giả lập biểu đồ tải (Load Curve) dựa trên tổng điện năng tháng.",
            // specific sectors removed, utilizing dynamic keys from LOAD_PROFILES directly
            schedule: "Lịch làm việc",
            mon_fri: "T2 - T6",
            mon_sat: "T2 - T7",
            all_days: "Cả tuần",
            seasonal: "Làm mát theo mùa",
            seasonal_desc: "Tăng tải 15-20% vào mùa hè",
            ov_title: "Tổng quan Tiêu thụ",
            ov_desc: "Xu hướng sử dụng điện trong năm",
            no_data: "Chưa có dữ liệu",
            monthly_inputs: "Nhập số liệu tháng (kWh)",
            total_energy: "Tổng năng lượng",
            monthly_avg: "Trung bình tháng",
            back: "Quay lại",
            generate: "Tạo Profile",
            view_year: "Năm",
            view_day: "Ngày (Mẫu)",
            distribute: "Phân bổ\nmùa",
            hourly_weights: "Tỷ trọng tiêu thụ theo giờ",
            months: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
            price_escalation: "Tăng giá điện dự kiến",
            ev_charging: "Giả lập Sạc xe điện",
            ev_desc: "Tăng đỉnh tải vào 18h - 22h",
            extra_load: "Phụ tải bổ sung",
            extra_load_help: "Giả lập phụ tải: Bơm nhiệt (tải nền 24/7) hoặc Máy sản xuất (tăng tải giờ hành chính).",
            none: "Không có",
            heatpump: "Bơm nhiệt",
            machinery: "Sản Xuất",
            schedule_help: "Xác định các ngày có tải tiêu thụ. Ngày nghỉ sẽ được giả lập với mức tải tối giản (tải nền).",
            mon_fri_tip: "Thứ 2-6: 100% tải. Thứ 7: 40% tải nền. CN: 30% tải nền.",
            mon_sat_tip: "Thứ 2-7: 100% tải. Chủ nhật: 30% tải nền.",
            all_days_tip: "Cả tuần: 100% tải.",
            auto_fill: "Bù tháng\nthiếu",
            auto_fill_tip: "Dựa vào các tháng đã nhập để tính trung bình cho các tháng còn trống.",
            region_north: "Miền Bắc",
            region_central: "Miền Trung",
            region_south: "Miền Nam"
        },
        en: {
            config: "Configuration",
            evn_tariff: "EVN Tariff Settings",
            evn_desc: "Configure customer type & voltage",
            location: "Project Location",
            customer_group: "Customer Group",
            business: "Business",
            manufacture: "Manufacturing",
            admin: "Administrative",
            voltage_level: "Voltage Level",
            "110kv_plus": "High Voltage (> 110kV)",
            "22kv_110kv": "Medium Voltage (22kV - 110kV)",
            "6kv_22kv": "Medium Voltage (6kV - 22kV)",
            "under_6kv": "Low Voltage (< 6kV)",
            est_price: "Estimated Price",
            custom_price: "Custom",
            apply_custom: "Use this price",
            op_profile: "Operation Profile",
            unit_kwh: "Unit: kWh",
            unit_vnd: "Unit: VNĐ",
            fill_all: "Fill All",
            distribute: "Seasonal Dist",
            sector: "Business Sector / Type",
            sector_help: "Determines the daily load curve shape for simulation (since only monthly total is known).",
            office: "Office Building (8am-5pm)",
            supermarket: "Supermarket / Mall",
            factory_1: "Factory - 1 Shift",
            factory_2: "Factory - 2 Shifts",
            factory_3: "Factory - 24/7",
            schedule: "Work Schedule",
            mon_fri: "Mon - Fri",
            mon_sat: "Mon - Sat",
            all_days: "All Days",
            seasonal: "Seasonal Cooling",
            seasonal_desc: "Boost load by 15-20% during Summer",
            ov_title: "Consumption Overview",
            ov_desc: "Visualizing usage trend across the year",
            no_data: "No data inputs yet",
            monthly_inputs: "Monthly Inputs (kWh)",
            total_energy: "Total Energy",
            monthly_avg: "Monthly Avg",
            back: "Back",
            generate: "Generate Profile",
            view_year: "Year",
            view_day: "Day (Pattern)",
            hourly_weights: "Hourly consumption weights",
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            price_escalation: "Annual Price Escalation",
            ev_charging: "EV Charging Simulation",
            ev_desc: "Adds load peaks from 18:00 - 22:00",
            extra_load: "Additional Load Profiles",
            extra_load_help: "Simulate specific loads: Heat Pumps (24/7 base) or Machinery (boosts 8am-5pm).",
            auto_fill: "Auto-fill Missing",
            auto_fill_tip: "Calculate the average of entered months and apply to remaining zero entries.",
            none: "None",
            heatpump: "Heat Pump (24/7 Base)",
            machinery: "Industrial Machinery",
            schedule_help: "Defines which days have consumption. Non-working days will be simulated with minimal base load.",
            mon_fri_tip: "Mon-Fri: 100% load. Sat: 40% base. Sun: 30% base.",
            mon_sat_tip: "Mon-Sat: 100% load. Sunday: 30% base load.",
            all_days_tip: "All days: 100% load.",
            region_north: "North",
            region_central: "Central",
            region_south: "South"
        }
    };

    const t = dt[lang] || dt.vi;

    // Province List from JSON
    const PROVINCES = useMemo(() => {
        return [...ALL_PROVINCES]
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [searchTerm]);

    // Handle Click Outside for Dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProvinceList(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Constants for estimation (Fake Price for UI Demo)
    const SCHEDULE_MAP = {
        mon_fri: [1, 1, 1, 1, 1, 0, 0],
        mon_sat: [1, 1, 1, 1, 1, 1, 0],
        all_days: [1, 1, 1, 1, 1, 1, 1]
    };

    const autoPrice = useMemo(() => {
        return calculateBlendedPrice(customerGroup, voltageLevel);
    }, [customerGroup, voltageLevel]);
    const currentPrice = isManualPrice ? (Number(manualPrice) || autoPrice) : autoPrice;

    // Derived Metrics
    const totalEnergy = useMemo(() => {
        return monthlyData.reduce((acc, val) => {
            const num = Number(val);
            return acc + (isNaN(num) ? 0 : num);
        }, 0);
    }, [monthlyData]);

    const formatCompact = (val, type = 'kwh') => {
        if (!val || val === 0) return '0';
        if (type === 'vnd') {
            if (val >= 1000000000) return (val / 1000000000).toFixed(val % 1000000000 === 0 ? 0 : 1) + ' Tỷ';
            if (val >= 1000000) return (val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1) + ' Tr';
            return val.toLocaleString();
        } else {
            if (val >= 1000000) return (val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1) + ' M';
            if (val >= 1000) return (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + ' k';
            return val.toLocaleString();
        }
    };

    const monthlyAvg = useMemo(() => totalEnergy / 12, [totalEnergy]);

    const chartData = useMemo(() => {
        return t.months.map((m, i) => {
            const val = Number(monthlyData[i]) || 0;
            return {
                name: m,
                value: val,
                cost: val * currentPrice
            };
        });
    }, [monthlyData, currentPrice, t.months]);

    const dailyPreviewData = useMemo(() => {
        const profileEntry = LOAD_PROFILES[profileSector] || LOAD_PROFILES[Object.keys(LOAD_PROFILES)[0]] || {};
        const weights = Array.isArray(profileEntry) ? profileEntry : (profileEntry.weights || []);
        const intervalMins = profileEntry.intervalMins || 60;
        const isDualDay = profileEntry.isDualDay || false;

        const dummyDailyTotal = 100;
        const stepsPerDay = Math.floor(1440 / intervalMins);

        // For DualDay, we only preview the first day (Weekday)
        const previewWeights = isDualDay ? weights.slice(0, stepsPerDay) : weights;

        return previewWeights.map((w, i) => {
            let loadKw = dummyDailyTotal * w;

            const hourOfPoint = (i * (intervalMins / 60));

            // 1. EV Charging (Peak at Evening 18:00 - 22:00)
            if (evCharging && hourOfPoint >= 18 && hourOfPoint <= 22) {
                loadKw += (dummyDailyTotal / 24) * 0.15;
            }

            // 2. Extra Load Types
            if (extraLoadType === 'heatpump') {
                loadKw += (dummyDailyTotal / 24) * 0.05;
            } else if (extraLoadType === 'machinery' && hourOfPoint >= 8 && hourOfPoint <= 17) {
                loadKw += (dummyDailyTotal / 24) * 0.15;
            }

            const hh = Math.floor(hourOfPoint);
            const mm = Math.round((hourOfPoint * 60) % 60);
            const timeLabel = mm === 0 ? `${hh}:00` : `${hh}:${mm}`;

            return {
                hour: timeLabel,
                weight: loadKw / dummyDailyTotal
            };
        });
    }, [profileSector, evCharging, extraLoadType]);

    const handleInputChange = (index, value) => {
        const newData = [...monthlyData];
        newData[index] = value === '' ? 0 : parseInt(value);
        setMonthlyData(newData);
    };

    const handleFillAll = (value) => {
        const numValue = value === '' ? 0 : parseInt(value);
        setMonthlyData(Array(12).fill(numValue));
    };

    const [region, setRegion] = useState('north'); // north, central, south

    const handleSeasonalDist = (value) => {
        const base = value === '' ? 0 : parseInt(value);
        if (base === 0) return;

        let coefficients = [];

        if (region === 'north') {
            // MOVED: North - Summer Peak (May-Aug)
            coefficients = [0.85, 0.82, 0.9, 1.05, 1.15, 1.25, 1.3, 1.28, 1.15, 1.05, 0.95, 0.9];
        } else if (region === 'central') {
            // Central - Summer Peak (May-Aug) similar to North but maybe sharper?
            // Let's use a slightly modified curve or same for now if not specified.
            // "May-August Peak" - using similar to North for now.
            coefficients = [0.9, 0.9, 0.95, 1.1, 1.2, 1.25, 1.25, 1.2, 1.1, 1.0, 0.95, 0.9];
        } else {
            // South - Dry Season Peak (Mar-May) / Rainy Season Low (Aug-Oct) - but relatively flat
            // "Flat / Slight Dry Season Peak"
            coefficients = [0.98, 0.98, 1.05, 1.1, 1.1, 1.05, 1.0, 0.98, 0.98, 0.98, 0.98, 0.98];
        }

        // Normalize to keep average ~ base? Or base = Jan? 
        // Existing logic: "Normalize so that base (Jan) is approx 0.85 of peak?" -> No, logic was "Input is Jan".
        // Code: `const newData = coefficients.map(c => Math.round((base / coefficients[0]) * c));` 
        // Wait, original code was: `Math.round((base / 0.85) * c)`. 0.85 was the first coeff.
        // So generic formula: `Math.round((base / coefficients[0]) * c)`

        const newData = coefficients.map(c => Math.round((base / coefficients[0]) * c));
        setMonthlyData(newData);
    };

    // Handle Paste (Excel/Text)
    const handlePaste = (startIndex, e) => {
        const clipboardData = e.clipboardData.getData('text');
        if (!clipboardData) return;

        // Split by common delimiters: Tab, Newline, Comma, Space
        const values = clipboardData.split(/[\t\n, ]+/).filter(v => v.trim() !== '');

        // If only 1 value, let default behavior handle it (unless it needs cleaning)
        if (values.length <= 1) return;

        e.preventDefault();

        // Parse and update state
        const newData = [...monthlyData];
        let hasChanges = false;

        values.forEach((val, i) => {
            const targetIndex = startIndex + i;
            if (targetIndex < 12) {
                const num = Number(val.replace(/,/g, '').trim()); // Remove commas if any
                if (!isNaN(num)) {
                    newData[targetIndex] = num;
                    hasChanges = true;
                }
            }
        });

        if (hasChanges) {
            setMonthlyData(newData);
        }
    };

    // Handle Copy (To Excel/Text)
    const handleCopy = () => {
        const text = monthlyData.join('\t');
        navigator.clipboard.writeText(text).then(() => {
            // Optional: UI feedback
            console.log('Copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };

    const handleAutoCompleteMissing = () => {
        const coefficients = [0.85, 0.82, 0.9, 1.05, 1.15, 1.25, 1.3, 1.28, 1.15, 1.05, 0.95, 0.9];

        // Find non-zero indices
        const activeIndices = monthlyData
            .map((v, i) => (Number(v) > 0 ? i : -1))
            .filter(i => i !== -1);

        if (activeIndices.length === 0) return;

        // Estimate 'normalized base' from existing entries
        // Base = Value / Coeff
        const totalBase = activeIndices.reduce((acc, idx) => {
            return acc + (Number(monthlyData[idx]) / coefficients[idx]);
        }, 0);
        const avgBase = totalBase / activeIndices.length;

        // Fill only zero entries using the seasonal curve
        const newData = monthlyData.map((v, i) => {
            if (Number(v) === 0) {
                return Math.round(avgBase * coefficients[i]);
            }
            return v;
        });
        setMonthlyData(newData);
    };

    const handleComplete = () => {
        // Find the full province object to pass along
        const selectedProvObj = PROVINCES.find(p => p.name === province);

        // Prepare options object
        const options = {
            province: province,
            provinceData: selectedProvObj,
            customerGroup,
            voltageLevel,
            profileSector,
            workSchedule: SCHEDULE_MAP[workSchedule] || SCHEDULE_MAP.mon_sat,
            seasonalCooling,
            customPrice: currentPrice,
            isManualPrice,
            priceEscalation,
            evCharging,
            extraLoadType
        };

        // Use the selected sector/profile directly as the profileType key
        // This maps directly to keys in LOAD_PROFILES (e.g., "Kinh doanh - Dinh ban ngay")
        const profileType = profileSector;

        onComplete(monthlyData, profileType, options);
    };

    // Helper for input focus
    const handleFocus = (e) => e.target.select();

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col relative my-auto border border-white/20">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 z-50 p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-all text-slate-500 hover:scale-110 active:scale-95 shadow-sm"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-1 overflow-hidden h-full">
                    {/* LEFT SIDEBAR: CONFIGURATION */}
                    <div className="w-[300px] bg-white border-r border-slate-100 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-6 py-8 pt-12 space-y-5 custom-scrollbar">
                            {/* Header */}
                            <div>
                                <div className="flex items-center gap-2 mb-1.5 opacity-60">
                                    <Zap size={14} className="text-blue-600 fill-current" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t.config_label || "CẤU HÌNH"}</span>
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tighter leading-tight">
                                    {t.evn_tariff}
                                </h2>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-relaxed">
                                    {t.evn_desc}
                                </p>
                            </div>

                            {/* 1. Location Selector */}
                            <div className="space-y-2 relative" ref={dropdownRef}>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.location}</label>
                                <div
                                    onClick={() => setShowProvinceList(!showProvinceList)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 text-[11px] font-bold cursor-pointer hover:border-blue-400 transition-all shadow-sm flex items-center justify-between group"
                                >
                                    <span className={province ? 'text-slate-800' : 'text-slate-400'}>
                                        {province || "Chọn tỉnh thành..."}
                                    </span>
                                    <MapPin size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                                {showProvinceList && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[20px] shadow-2xl z-[70] overflow-hidden flex flex-col max-h-[250px] animate-in slide-in-from-top-2">
                                        <div className="p-3 border-b bg-slate-50/50">
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Tìm kiếm..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full px-4 py-2 text-xs border border-slate-200 bg-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                                            {PROVINCES.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => { setProvince(p.name); setShowProvinceList(false); setSearchTerm(''); }}
                                                    className="px-5 py-3 text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors border-b border-slate-50/50 last:border-0 font-medium"
                                                >
                                                    {p.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 2. Customer Group Selector */}
                            <div className="space-y-2 pt-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.customer_group}</label>
                                <div className="relative">
                                    <select
                                        value={customerGroup}
                                        onChange={(e) => {
                                            const newGroup = e.target.value;
                                            setCustomerGroup(newGroup);
                                            // Auto-select first voltage level
                                            const firstLevel = EVN_TARIFFS[newGroup]?.voltage_levels[0]?.id;
                                            if (firstLevel) setVoltageLevel(firstLevel);
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all appearance-none cursor-pointer"
                                    >
                                        <optgroup label="GIÁ BÁN LẺ">
                                            {Object.entries(EVN_TARIFFS)
                                                .filter(([_, g]) => g.group === 'retail')
                                                .map(([key, group]) => (
                                                    <option key={key} value={key}>
                                                        {lang === 'vi' ? group.label_vi : group.label_en}
                                                    </option>
                                                ))}
                                        </optgroup>
                                        <optgroup label="GIÁ BÁN BUÔN">
                                            {Object.entries(EVN_TARIFFS)
                                                .filter(([_, g]) => g.group === 'wholesale')
                                                .map(([key, group]) => (
                                                    <option key={key} value={key}>
                                                        {lang === 'vi' ? group.label_vi : group.label_en}
                                                    </option>
                                                ))}
                                        </optgroup>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                            </div>

                            {/* 3. Voltage Level Selector */}
                            <div className="space-y-2 pt-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.voltage_level}</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {EVN_TARIFFS[customerGroup]?.voltage_levels.map(v => (
                                        <button
                                            key={v.id}
                                            onClick={() => setVoltageLevel(v.id)}
                                            className={`px-3 py-2 text-[10px] font-bold rounded-xl border transition-all text-left flex items-start gap-2 ${voltageLevel === v.id ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'}`}
                                        >
                                            <div className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${voltageLevel === v.id ? 'bg-white' : 'bg-slate-300'}`}></div>
                                            <span className="leading-tight">{lang === 'vi' ? v.label_vi : v.label_en}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.op_profile}</label>

                                <div className="grid grid-cols-2 gap-2">
                                    {/* EV Charging */}
                                    <div
                                        onClick={() => setEvCharging(!evCharging)}
                                        title={t.ev_desc}
                                        className={`cursor-pointer border rounded-xl p-2 flex items-center justify-between transition-all ${evCharging ? 'bg-blue-50 border-blue-200 ring-4 ring-blue-500/5' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${evCharging ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-50 text-slate-400'}`}>
                                                <Car size={12} />
                                            </div>
                                            <div className={`text-[10px] font-black ${evCharging ? 'text-blue-700' : 'text-slate-600'}`}>{t.ev_charging}</div>
                                        </div>
                                        <Info size={10} className="text-slate-300" />
                                    </div>

                                    {/* Cooling */}
                                    <div
                                        onClick={() => setSeasonalCooling(!seasonalCooling)}
                                        title={t.seasonal_desc}
                                        className={`cursor-pointer border rounded-xl p-2 flex items-center justify-between transition-all ${seasonalCooling ? 'bg-blue-50 border-blue-200 ring-4 ring-blue-500/5' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${seasonalCooling ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-50 text-slate-400'}`}>
                                                <Snowflake size={12} />
                                            </div>
                                            <div className={`text-[10px] font-black ${seasonalCooling ? 'text-blue-700' : 'text-slate-600'}`}>{t.seasonal}</div>
                                        </div>
                                        <Info size={10} className="text-slate-300" />
                                    </div>

                                    {/* Heat Pump */}
                                    <div
                                        onClick={() => setExtraLoadType(extraLoadType === 'heatpump' ? 'none' : 'heatpump')}
                                        title={t.extra_load_help}
                                        className={`cursor-pointer border rounded-xl p-2 flex items-center justify-between transition-all ${extraLoadType === 'heatpump' ? 'bg-emerald-50 border-emerald-200 ring-4 ring-emerald-500/5' : 'bg-white border-slate-200 hover:border-emerald-300'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${extraLoadType === 'heatpump' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-50 text-slate-400'}`}>
                                                <Flame size={12} />
                                            </div>
                                            <div className={`text-[10px] font-black ${extraLoadType === 'heatpump' ? 'text-emerald-700' : 'text-slate-600'}`}>{t.heatpump}</div>
                                        </div>
                                        <Info size={10} className="text-slate-300" />
                                    </div>

                                    {/* Machinery */}
                                    <div
                                        onClick={() => setExtraLoadType(extraLoadType === 'machinery' ? 'none' : 'machinery')}
                                        title={t.extra_load_help}
                                        className={`cursor-pointer border rounded-xl p-2 flex items-center justify-between transition-all ${extraLoadType === 'machinery' ? 'bg-amber-50 border-amber-200 ring-4 ring-amber-500/5' : 'bg-white border-slate-200 hover:border-amber-300'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${extraLoadType === 'machinery' ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-50 text-slate-400'}`}>
                                                <HardHat size={12} />
                                            </div>
                                            <div className={`text-[10px] font-black ${extraLoadType === 'machinery' ? 'text-amber-700' : 'text-slate-600'}`}>{t.machinery}</div>
                                        </div>
                                        <Info size={10} className="text-slate-300" />
                                    </div>
                                </div>

                                {/* Sector & Schedule */}
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div className="space-y-2">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.sector}</label>
                                            <select
                                                value={profileSector}
                                                onChange={(e) => {
                                                    setProfileSector(e.target.value);
                                                    setChartTab('day'); // Auto-switch to Day view to show the change
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all appearance-none"
                                            >
                                                {Object.keys(LOAD_PROFILES).map((key) => <option key={key} value={key}>{key}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.schedule}</label>
                                        <div className="grid grid-cols-3 gap-1">
                                            {[
                                                { id: 'mon_fri', label: t.mon_fri },
                                                { id: 'mon_sat', label: t.mon_sat },
                                                { id: 'all_days', label: t.all_days },
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    title={t[opt.id + '_tip']}
                                                    onClick={() => setWorkSchedule(opt.id)}
                                                    className={`py-1.5 rounded-lg text-[9px] font-black transition-all border ${workSchedule === opt.id ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MAIN WORKSPACE: DATA & VIZ */}
                    <div className="flex-1 bg-white flex flex-col overflow-hidden relative">
                        <div className="flex-1 overflow-y-auto px-8 py-8 pt-12 space-y-6 custom-scrollbar">
                            {/* 1. Visualization Header */}
                            <div className="flex items-center justify-between pr-14">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{t.ov_title}</h3>
                                    <div className="flex items-center gap-2 mt-1 px-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{t.ov_desc} <span className="opacity-50 ml-2">beta v2.7 (Min 15-day Logic)</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
                                        <button onClick={() => setChartTab('year')} className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${chartTab === 'year' ? 'bg-white text-blue-600 shadow-sm outline outline-1 outline-blue-100' : 'text-slate-500 hover:text-slate-700'}`}>{t.view_year}</button>
                                        <button onClick={() => setChartTab('day')} className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${chartTab === 'day' ? 'bg-white text-blue-600 shadow-sm outline outline-1 outline-blue-100' : 'text-slate-500 hover:text-slate-700'}`}>{t.view_day}</button>
                                    </div>
                                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
                                        <button onClick={() => setViewMode('kwh')} className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${viewMode === 'kwh' ? 'bg-white text-blue-600 shadow-sm outline outline-1 outline-blue-100' : 'text-slate-500'}`}>kWh</button>
                                        <button onClick={() => setViewMode('vnd')} className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${viewMode === 'vnd' ? 'bg-white text-emerald-600 shadow-sm outline outline-1 outline-emerald-100' : 'text-slate-500'}`}>VND</button>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Chart Area */}
                            <div className="w-full bg-white rounded-[32px] border border-slate-100 p-8 h-[360px] relative transition-all shadow-sm">
                                {chartTab === 'year' ? (
                                    totalEnergy === 0 ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-4">
                                            <BarChart3 size={80} strokeWidth={1} className="opacity-20 translate-y-2" />
                                            <div className="text-xs font-black uppercase tracking-[0.2em]">{t.no_data}</div>
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 25 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} tickFormatter={(val) => formatCompact(val, viewMode)} width={40} />
                                                <Tooltip cursor={{ fill: '#f1f5f9', radius: 10 }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', padding: '16px' }} />
                                                <Bar dataKey={viewMode === 'kwh' ? 'value' : 'cost'} radius={[10, 10, 0, 0]} isAnimationActive={true} animationDuration={1000}>
                                                    {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={viewMode === 'kwh' ? '#3b82f6' : '#10b981'} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dailyPreviewData} margin={{ top: 10, right: 10, left: 20, bottom: 25 }}>
                                            <defs>
                                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.4} />
                                            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} interval={3} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} hide />
                                            <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', padding: '16px' }} />
                                            <Area type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" isAnimationActive={true} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            {/* 3. Monthly Input Grid */}
                            <div className="bg-white rounded-[32px] border border-slate-100 p-6 space-y-6 shadow-sm">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl shadow-sm border border-blue-100 shrink-0">
                                            <Table size={14} />
                                        </div>
                                        <h4 className="text-[11px] font-black text-slate-700 tracking-tight uppercase leading-tight">{t.monthly_inputs}</h4>
                                    </div>

                                    <div className="flex items-center flex-nowrap gap-1.5 shrink-0">
                                        <select
                                            value={region}
                                            onChange={(e) => setRegion(e.target.value)}
                                            className="px-2 py-2 bg-emerald-50/50 border border-emerald-100 rounded-xl text-[10px] font-bold text-emerald-700 outline-none cursor-pointer hover:bg-emerald-100 transition-colors"
                                            title={lang === 'vi' ? "Chọn vùng để phân bổ mùa" : "Select region for seasonal distribution"}
                                        >
                                            <option value="north">{t.region_north}</option>
                                            <option value="central">{t.region_central}</option>
                                            <option value="south">{t.region_south}</option>
                                        </select>
                                        <button
                                            onClick={handleCopy}
                                            title="Copy dữ liệu 12 tháng (để backup hoặc paste lại sau)"
                                            className="flex items-center shrink-0 gap-1.5 px-3 py-2 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-600 font-black text-[10px] hover:bg-slate-600 hover:text-white hover:border-slate-600 transition-all shadow-sm group whitespace-nowrap"
                                        >
                                            <Copy size={16} className="group-hover:scale-110 transition-transform" /> Copy
                                        </button>
                                        <button
                                            onClick={handleAutoCompleteMissing}
                                            title={t.auto_fill_tip}
                                            className="flex items-center shrink-0 gap-1.5 px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-600 font-bold text-[10px] hover:bg-blue-600 hover:text-white transition-all shadow-sm group text-left leading-tight"
                                        >
                                            <Sparkles size={14} className="group-hover:animate-spin shrink-0" />
                                            <div className="flex flex-col">
                                                {t.auto_fill.split('\n').map((line, idx) => (
                                                    <span key={idx} className="whitespace-nowrap">{line}</span>
                                                ))}
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => handleFillAll(monthlyData[0])}
                                            className="flex items-center shrink-0 gap-1.5 px-3 py-2 bg-slate-50/80 border border-slate-200/60 rounded-xl text-slate-600 font-black text-[10px] hover:bg-slate-600 hover:text-white hover:border-slate-600 transition-all shadow-sm group whitespace-nowrap"
                                        >
                                            <RefreshCw size={14} className="group-hover:animate-spin transition-transform" /> {t.fill_all}
                                        </button>
                                        <button
                                            onClick={() => handleSeasonalDist(monthlyData[0])}
                                            className="flex items-center shrink-0 gap-1.5 px-3 py-2 bg-emerald-50/50 border border-emerald-100 rounded-xl text-emerald-600 font-black text-[10px] hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm group text-left leading-tight"
                                        >
                                            <div className="relative w-3.5 h-3.5 overflow-hidden shrink-0">
                                                <div className="flex absolute top-0 left-0 animate-scrolling-ekg-hover opacity-70 group-hover:opacity-100 transition-opacity">
                                                    <Activity size={14} className="shrink-0" />
                                                    <Activity size={14} className="shrink-0" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                {t.distribute.split('\n').map((line, idx) => (
                                                    <span key={idx} className="whitespace-nowrap">{line}</span>
                                                ))}
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 mt-4 px-1">

                                    {monthlyData.map((val, i) => (
                                        <div key={i} className="space-y-1.5 text-center group">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1 group-hover:text-blue-500 transition-colors">
                                                {t.months[i]}
                                                {seasonalCooling && (i >= 4 && i <= 7) && <Flame size={8} className="text-orange-500 fill-current animate-pulse" />}
                                            </label>
                                            <input
                                                type="number"
                                                value={val || ''}
                                                onChange={(e) => handleInputChange(i, e.target.value)}
                                                onFocus={handleFocus}
                                                onPaste={(e) => handlePaste(i, e)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-0 py-2.5 text-[11px] font-black text-slate-800 text-center focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>



                {/* 4. Final Footer/Summary (Sticky) */}
                <div className="px-8 py-4 border-t border-slate-100 bg-white/95 backdrop-blur-md relative z-20">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        {/* Summary Stats */}
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                    <Zap size={20} className="fill-current" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.total_energy}</div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl font-black text-blue-600 tracking-tight">{(totalEnergy).toLocaleString()}</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase">kWh</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.monthly_avg}</div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl font-black text-emerald-500 tracking-tight">{(totalEnergy / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase">kWh</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-8">
                            <button
                                onClick={onClose}
                                className="text-slate-500 font-black text-sm hover:text-slate-800 transition-colors"
                            >
                                {t.back}
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={totalEnergy === 0}
                                className={`flex items-center gap-3 px-8 py-3.5 rounded-[24px] text-base font-black transition-all shadow-xl relative overflow-hidden group ${totalEnergy === 0 ? 'bg-slate-100/80 text-slate-300 shadow-none cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 shadow-blue-200'}`}
                            >
                                <Zap size={20} className="fill-current" />
                                <span>{t.generate}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
};
export default BillInputModal;
