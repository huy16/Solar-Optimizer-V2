import React, { useState } from 'react';
import { ResponsiveContainer, ComposedChart, Area, Bar, Line, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ScatterChart, Scatter, AreaChart, BarChart } from 'recharts';
import { Sun, Zap, TrendingUp, PieChart, BatteryCharging, Info, Activity, BarChart2, Calendar, Layers, RefreshCw } from 'lucide-react';
import { StatCard } from '../../components/StatCard';

const TOOLTIP_STYLE = { borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' };
const SMALL_TOOLTIP_STYLE = { fontSize: '10px', padding: '4px', borderRadius: '4px', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };
const formatKw = (val) => [`${Math.round(val)} kW`];
const formatKwShort = (val) => `${Math.round(Number(val))} kW`;
const formatKValue = (val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val;
const formatHour = (val) => `${val}h`;

export const Dashboard = ({
    customStats,
    isSimulating,
    formatNumber,
    params,
    bessKwh,
    averageDayData,
    solarMetadata,
    correlationData,
    monthlyDetails,
    monthlyPowerCurves,
    dailyStats,
    lang,
    t
}) => {
    const [energyViewMode, setEnergyViewMode] = useState('day');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        if (dailyStats && dailyStats.length > 0) return dailyStats[0].fullDate.getMonth();
        return new Date().getMonth();
    });
    const [selectedYear, setSelectedYear] = useState(() => {
        if (dailyStats && dailyStats.length > 0) return dailyStats[0].fullDate.getFullYear();
        return new Date().getFullYear();
    });

    // Extract available years and months from data
    const availableYears = React.useMemo(() => {
        const years = new Set();
        dailyStats.forEach(d => years.add(d.fullDate.getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
    }, [dailyStats]);

    const availableMonths = React.useMemo(() => {
        const months = new Set();
        dailyStats.forEach(d => {
            if (d.fullDate.getFullYear() === selectedYear) {
                months.add(d.fullDate.getMonth());
            }
        });
        return Array.from(months).sort((a, b) => a - b);
    }, [dailyStats, selectedYear]);

    // Padding logic for full month view (1-31 days)
    const monthlyChartData = React.useMemo(() => {
        if (energyViewMode !== 'month') return [];

        const daysInSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const dataMap = new Map();

        dailyStats.forEach(d => {
            if (d.fullDate.getFullYear() === selectedYear && d.fullDate.getMonth() === selectedMonth) {
                dataMap.set(d.fullDate.getDate(), d);
            }
        });

        const paddedData = [];
        for (let day = 1; day <= daysInSelectedMonth; day++) {
            if (dataMap.has(day)) {
                paddedData.push({
                    ...dataMap.get(day),
                    displayDay: day.toString()
                });
            } else {
                paddedData.push({
                    displayDay: day.toString(),
                    solar: 0,
                    used: 0,
                    gridImport: 0,
                    curtailed: 0,
                    date: `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
                });
            }
        }
        return paddedData;
    }, [dailyStats, selectedMonth, selectedYear, energyViewMode]);

    // If averageDayData is empty, we haven't even processed basic files yet
    if (!averageDayData || averageDayData.length === 0) return null;

    const dt = {
        vi: {
            calculating: "Đang tính toán mô phỏng...",
            bess_chart_title: "Biểu đồ Điều độ Năng lượng (Solar - Load - BESS)",
            bess_charge: "BESS Sạc",
            bess_discharge: "BESS Xả",
            load: "Phụ tải (Load)",
            load_compatibility: "Phân tích Tương thích Phụ tải & Solar",
            weekend: "CN",
            solar_avg: "Solar TB",
            correlation_title: "Tương quan Load và Solar",
            grid_import_bess: "Grid Import vs Solar (với BESS)",
            monthly_overview: "Tổng quan Năng lượng Hàng tháng",
            solar_used: "Sản lượng tự dùng",
            curtailed: "Phát lên lưới/Cắt giảm",
            grid_import: "Điện mua lưới",
            load_solar_12m: "Biểu đồ Load & Solar 12 Tháng",
            synthetic_msg: "Đang sử dụng dữ liệu Tổng hợp (Synthetic)",
            synthetic_desc: "File dữ liệu (PDF/MET) chứa dữ liệu tháng. Hệ thống đã tự động đọc dữ liệu Tổng xạ tháng (GlobalH) để tái tạo lại biểu đồ nắng giả lập (Synthetic Profile). Kết quả mô phỏng sẽ chính xác theo sản lượng tháng, nhưng biểu đồ giờ là giả lập (Sine wave).",
            weekday: "T2-T7",
            m_vnd: "Triệu VNĐ",
            solar_gen_kw: "Sản lượng Solar (kW)",
            load_cons_kw: "Tải tiêu thụ (kW)",
            grid_import_kw: "Điện mua lưới (kW)",
            load_vs_solar: "Tiêu thụ Load vs Solar",
            m_units: "MWh/năm",
            energy_management: "Quản lý Năng lượng",
            view_day: "Ngày",
            view_month: "Tháng",
            view_year: "Năm",
            view_day_lc: "ngày",
            view_month_lc: "tháng",
            view_year_lc: "năm",
            solar_production: "Sản lượng Solar",
            solar_tooltip: "Giá trị trung bình hàng",
            solar_tooltip_suffix: "tính trên toàn bộ dữ liệu 1 năm.",
            self_consumed: "Tự dùng:",
            grid_exported: "Phát lên lưới:",
            consumption: "Tiêu thụ",
            consumption_tooltip: "Phụ tải tiêu thụ trung bình hàng",
            from_solar: "Từ Solar:",
            from_grid: "Từ lưới:",
            chart_solar: "Solar",
            chart_weekend_load: "Tải cuối tuần",
            chart_weekday_load: "Phụ tải (T2-T7)",
            chart_solar_yield: "Sản lượng Solar",
            chart_self_use: "Sản lượng tự dùng",
            chart_grid_import: "Điện mua lưới"
        },
        en: {
            calculating: "Simulation calculating...",
            bess_chart_title: "Energy Dispatch Plot (Solar - Load - BESS)",
            bess_charge: "BESS Charge",
            bess_discharge: "BESS Discharge",
            load: "Load",
            load_compatibility: "Load & Solar Compatibility Analysis",
            weekend: "Sun",
            solar_avg: "Solar Avg",
            correlation_title: "Load vs Solar Correlation",
            grid_import_bess: "Grid Import vs Solar (with BESS)",
            monthly_overview: "Monthly Energy Overview",
            solar_used: "Solar Energy (Used)",
            curtailed: "Curtailment / Excess",
            grid_import: "Grid Import",
            load_solar_12m: "12-Month Load & Solar Curves",
            synthetic_msg: "Using Synthetic Data",
            synthetic_desc: "The data file (PDF/MET) contains monthly values. The system automatically used Monthly Global Irradiation (GlobalH) to reconstruct a synthetic profile. Monthly totals are accurate, but hourly curves are simulated (Sine wave).",
            weekday: "Mon-Sat",
            m_vnd: "M VND",
            solar_gen_kw: "Solar Generation (kW)",
            load_cons_kw: "Load Consumption (kW)",
            grid_import_kw: "Grid Import (kW)",
            load_vs_solar: "Load vs Solar",
            m_units: "MWh/year",
            energy_management: "Energy Management",
            view_day: "Day",
            view_month: "Month",
            view_year: "Year",
            view_day_lc: "day",
            view_month_lc: "month",
            view_year_lc: "year",
            solar_production: "Solar Production",
            solar_tooltip: "Average value per",
            solar_tooltip_suffix: "calculated over the entire year.",
            self_consumed: "Self-consumption:",
            grid_exported: "Grid Export:",
            consumption: "Consumption",
            consumption_tooltip: "Average consumption per",
            from_solar: "From Solar:",
            from_grid: "From Grid:",
            chart_solar: "Solar",
            chart_weekend_load: "Weekend Load",
            chart_weekday_load: "Weekday Load",
            chart_solar_yield: "Solar Production",
            chart_self_use: "Self-consumption",
            chart_grid_import: "Grid Import"
        }
    }[lang];

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-16 relative px-4 sm:px-6">
            {isSimulating && (
                <div className="sticky top-4 z-50 flex items-center justify-center p-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-lg shadow-sm animate-pulse">
                    <RefreshCw size={14} className="mr-2 animate-spin" />
                    {dt.calculating}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Sun}
                    label={t.stats.pv_yield}
                    value={customStats ? formatNumber(customStats.totalSolarGen / 1000) : "..."}
                    unit={dt.m_units}
                    colorClass="text-emerald-600"
                    bgClass="bg-white"
                />
                <StatCard
                    icon={Zap}
                    label={t.stats.solar_energy}
                    value={customStats ? formatNumber(customStats.totalUsed / 1000) : "..."}
                    unit={dt.m_units}
                    subtext={customStats ? `${(customStats.totalUsed / customStats.totalSolarGen * 100).toFixed(1)}% ${t.stats.efficiency}` : ""}
                    colorClass="text-blue-600"
                    bgClass="bg-white"
                />
                <StatCard
                    icon={TrendingUp}
                    label={t.stats.savings}
                    value={customStats ? formatNumber(((customStats.totalUsed * params.priceNormal) - (customStats.totalGridCharge * params.priceOffPeak)) / 1000000) : "..."}
                    unit={dt.m_vnd}
                    colorClass="text-indigo-600"
                    bgClass="bg-white"
                />
                <StatCard
                    icon={PieChart}
                    label={t.stats.self_consumption}
                    value={customStats ? (customStats.selfConsumptionRate * 100).toFixed(1) : "..."}
                    unit="%"
                    colorClass="text-amber-600"
                    bgClass="bg-white"
                />
            </div>

            {/* BESS Overview Chart */}
            {bessKwh > 0 && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 bg-gradient-to-br from-white to-slate-50/30">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <BatteryCharging size={20} />
                        </div>
                        {dt.bess_chart_title}
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={averageDayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSolarBess" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorLoadDispatch" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.8} />
                                <XAxis dataKey="hour" tick={{ fontSize: 9 }} />
                                <YAxis tick={{ fontSize: 9 }} />
                                <RechartsTooltip contentStyle={TOOLTIP_STYLE} formatter={formatKw} />
                                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} iconSize={10} />

                                <Area type="monotone" dataKey="solarProfile" name="Solar" fill="url(#colorSolarBess)" stroke="#f59e0b" strokeWidth={2} isAnimationActive={false} />
                                <Bar dataKey="avgBessCharge" name={dt.bess_charge} fill="#10b981" barSize={20} stackId="bess" isAnimationActive={false} />
                                <Bar dataKey="avgBessDischarge" name={dt.bess_discharge} fill="#f43f5e" barSize={20} stackId="bess" isAnimationActive={false} />
                                <Area type="monotone" dataKey="avgLoad" name={dt.load} stroke="#3b82f6" strokeWidth={1.5} fill="url(#colorLoadDispatch)" dot={false} isAnimationActive={false} />
                                <Line type="monotone" dataKey="weekend" name={`${dt.load} (${dt.weekend})`} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {solarMetadata && (solarMetadata.sourceType === 'MET_SYNTHETIC' || (solarMetadata.sourceType && solarMetadata.sourceType.includes('PDF'))) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3"><Info className="text-amber-600 shrink-0 mt-0.5" size={18} /><div><h4 className="font-bold text-amber-800 text-sm">{dt.synthetic_msg}</h4><p className="text-xs text-amber-700 mt-1">{dt.synthetic_desc}</p></div></div>
                )}

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 bg-gradient-to-br from-white to-sky-50/20">
                    {/* ENERGY MANAGEMENT HEADER */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                                    <Activity size={20} />
                                </div>
                                {dt.energy_management}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {energyViewMode === 'year' && availableYears.length > 1 && (
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="text-xs font-bold px-2 py-1 rounded bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        {availableYears.map(y => <option key={y} value={y}>{dt.view_year} {y}</option>)}
                                    </select>
                                )}
                                {energyViewMode === 'month' && (
                                    <div className="flex gap-1">
                                        {availableYears.length > 1 && (
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => {
                                                    setSelectedYear(Number(e.target.value));
                                                    // Reset month if not available in new year
                                                    const validMonths = new Set();
                                                    dailyStats.forEach(d => {
                                                        if (d.fullDate.getFullYear() === Number(e.target.value)) validMonths.add(d.fullDate.getMonth());
                                                    });
                                                    if (!validMonths.has(selectedMonth)) setSelectedMonth(Array.from(validMonths)[0]);
                                                }}
                                                className="text-xs font-bold px-2 py-1 rounded bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                {availableYears.map(y => <option key={y} value={y}>{dt.view_year} {y}</option>)}
                                            </select>
                                        )}
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                            className="text-xs font-bold px-2 py-1 rounded bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            {availableMonths.map(m => <option key={m} value={m}>{t.months ? t.months[m] : `Tháng ${m + 1}`}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div className="flex gap-1 bg-slate-100 p-0.5 rounded">
                                    <button
                                        onClick={() => setEnergyViewMode('day')}
                                        className={`text-xs font-bold px-3 py-1 rounded transition ${energyViewMode === 'day' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {dt.view_day}
                                    </button>
                                    <button
                                        onClick={() => setEnergyViewMode('month')}
                                        className={`text-xs font-bold px-3 py-1 rounded transition ${energyViewMode === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {dt.view_month}
                                    </button>
                                    <button
                                        onClick={() => setEnergyViewMode('year')}
                                        className={`text-xs font-bold px-3 py-1 rounded transition ${energyViewMode === 'year' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {dt.view_year}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* DYNAMIC STATS BASED ON VIEW */}
                        {(() => {
                            const filteredDays = dailyStats.filter(d => {
                                if (energyViewMode === 'day') return true;
                                if (energyViewMode === 'month') return d.fullDate.getMonth() === selectedMonth && d.fullDate.getFullYear() === selectedYear;
                                if (energyViewMode === 'year') return d.fullDate.getFullYear() === selectedYear;
                                return true;
                            });

                            let totalSolar = 0, totalLoad = 0, totalUsed = 0, totalExported = 0;
                            filteredDays.forEach(d => {
                                totalSolar += (d.solar || 0);
                                totalLoad += (d.load || 0);
                                totalUsed += (d.used || 0);
                                totalExported += (d.curtailed || 0) + (d.gridExport || 0);
                            });

                            let statSolar = totalSolar;
                            let statLoad = totalLoad;
                            let statUsed = totalUsed;
                            let statExported = totalExported;

                            if (energyViewMode === 'day') {
                                // Average Daily
                                statSolar /= (filteredDays.length || 1);
                                statLoad /= (filteredDays.length || 1);
                                statUsed /= (filteredDays.length || 1);
                                statExported /= (filteredDays.length || 1);
                            } else if (energyViewMode === 'month') {
                                // Average Monthly
                                statSolar /= 12; statLoad /= 12; statUsed /= 12; statExported /= 12;
                            }

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                    {/* LEFT: GENERATED */}
                                    <div>
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                {dt.solar_production} ({energyViewMode === 'day' ? dt.view_day_lc : energyViewMode === 'month' ? dt.view_month_lc : dt.view_year_lc})
                                                <div className="group relative">
                                                    <Info size={12} className="text-slate-400 cursor-help" />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                                                        {dt.solar_tooltip} {energyViewMode === 'day' ? dt.view_day_lc : energyViewMode === 'month' ? dt.view_month_lc : dt.view_year_lc} {dt.solar_tooltip_suffix}
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                    </div>
                                                </div>
                                            </span>
                                            <span className="text-base font-bold text-slate-800">{formatNumber(statSolar)} <span className="text-[10px] font-normal text-slate-500">kWh</span></span>
                                        </div>
                                        <div className="flex justify-between text-[11px] mb-2 font-medium">
                                            <div className="flex items-center gap-1.5 text-green-600">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                {dt.self_consumed} {formatNumber(statUsed)} kWh
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                                {dt.grid_exported} {formatNumber(statExported)} kWh
                                            </div>
                                        </div>
                                        {/* PROGRESS BAR */}
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex relative">
                                            {statSolar > 0 && (
                                                <>
                                                    <div style={{ width: `${(statUsed / statSolar) * 100}%` }} className="h-full bg-green-500"></div>
                                                    <div className="flex-1 h-full bg-slate-300/30"></div>
                                                </>
                                            )}
                                            <div className="absolute inset-0 flex justify-between px-2 items-center text-[8px] font-bold text-white drop-shadow-sm">
                                                <span>{statSolar > 0 ? ((statUsed / statSolar) * 100).toFixed(1) : 0.0}%</span>
                                                <span className="text-slate-500">{statSolar > 0 ? ((statExported / statSolar) * 100).toFixed(1) : 0.0}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT: CONSUMED */}
                                    <div>
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                {dt.consumption} ({energyViewMode === 'day' ? dt.view_day_lc : energyViewMode === 'month' ? dt.view_month_lc : dt.view_year_lc})
                                                <div className="group relative">
                                                    <Info size={12} className="text-slate-400 cursor-help" />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                                                        {dt.consumption_tooltip} {energyViewMode === 'day' ? dt.view_day_lc : energyViewMode === 'month' ? dt.view_month_lc : dt.view_year_lc}.
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                    </div>
                                                </div>
                                            </span>
                                            <span className="text-base font-bold text-slate-800">{formatNumber(statLoad)} <span className="text-[10px] font-normal text-slate-500">kWh</span></span>
                                        </div>
                                        <div className="flex justify-between text-[11px] mb-2 font-medium">
                                            <div className="flex items-center gap-1.5 text-orange-600">
                                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                {dt.from_solar} {formatNumber(statUsed)} kWh
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                                {dt.from_grid} {formatNumber(statLoad - statUsed)} kWh
                                            </div>
                                        </div>
                                        {/* PROGRESS BAR */}
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex relative">
                                            {statLoad > 0 && (
                                                <>
                                                    <div style={{ width: `${(statUsed / statLoad) * 100}%` }} className="h-full bg-orange-500"></div>
                                                    <div className="flex-1 h-full bg-slate-400/30"></div>
                                                </>
                                            )}
                                            <div className="absolute inset-0 flex justify-between px-2 items-center text-[8px] font-bold text-white drop-shadow-sm">
                                                <span>{statLoad > 0 ? ((statUsed / statLoad) * 100).toFixed(1) : 0.0}%</span>
                                                <span className="text-slate-500">{statLoad > 0 ? (100 - (statUsed / statLoad) * 100).toFixed(1) : 0.0}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* DYNAMIC CHART */}
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {energyViewMode === 'day' ? (
                                <ComposedChart data={averageDayData} margin={{ top: 10, right: 0, left: 0, bottom: 10 }}>
                                    <defs>
                                        <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} /></linearGradient>
                                        <linearGradient id="colorWeekend" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} /></linearGradient>
                                        <linearGradient id="colorSolarRef" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4} /><stop offset="95%" stopColor="#10b981" stopOpacity={0.1} /></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.8} />
                                    <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                    <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                    <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} iconSize={10} />
                                    {/* Order in legend: 1. Solar, 2. Cuối Tuần, 3. Phụ tải (T2-T7) */}
                                    <Area type="monotone" dataKey="solarProfile" stroke="#22c55e" fill="url(#colorSolarRef)" strokeWidth={2} fillOpacity={1} dot={false} name={dt.chart_solar} isAnimationActive={false} />
                                    <Area type="monotone" dataKey="weekend" stroke="#ef4444" fill="url(#colorWeekend)" fillOpacity={1} name={dt.chart_weekend_load} strokeWidth={2} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
                                    <Area type="monotone" dataKey="weekday" stroke="#3b82f6" fill="url(#colorLoad)" fillOpacity={1} strokeWidth={1.5} dot={false} name={dt.chart_weekday_load} isAnimationActive={false} />
                                </ComposedChart>
                            ) : energyViewMode === 'month' ? (
                                <BarChart data={monthlyChartData} margin={{ top: 10, right: 0, left: 0, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.8} />
                                    <XAxis dataKey="displayDay" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                    <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                    <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} />
                                    <Bar dataKey="solar" name={dt.chart_solar_yield} fill="#22c55e" stackId="a" isAnimationActive={false} />
                                    <Bar dataKey="used" name={dt.chart_self_use} fill="#f97316" stackId="b" isAnimationActive={false} />
                                    <Bar dataKey="gridImport" name={dt.chart_grid_import} fill="#94a3b8" stackId="b" isAnimationActive={false} />
                                </BarChart>
                            ) : (
                                <BarChart data={monthlyDetails} margin={{ top: 10, right: 0, left: 0, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.8} />
                                    <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                    <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                    <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} />
                                    <Bar dataKey="solar" name={dt.chart_solar_yield} fill="#22c55e" stackId="a" isAnimationActive={false} />
                                    <Bar dataKey="used" name={dt.chart_self_use} fill="#f97316" stackId="b" isAnimationActive={false} />
                                    <Bar dataKey="gridImport" name={dt.chart_grid_import} fill="#94a3b8" stackId="b" isAnimationActive={false} />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>


                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500">
                            <Calendar size={20} />
                        </div>
                        {dt.monthly_overview}
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyDetails}>
                                <defs>
                                    <linearGradient id="colorUsedDashboard" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity={0.9} /><stop offset="100%" stopColor="#ea580c" stopOpacity={0.7} /></linearGradient>
                                    <linearGradient id="colorCurtailedDashboard" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={0.6} /><stop offset="100%" stopColor="#16a34a" stopOpacity={0.4} /></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.8} />
                                <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                                <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" tickFormatter={formatKValue} />
                                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={TOOLTIP_STYLE} formatter={formatNumber} />
                                <Legend wrapperStyle={{ paddingTop: '5px', fontSize: '10px' }} />
                                <Bar dataKey="used" stackId="solar" name={dt.solar_used} fill="#f97316" isAnimationActive={false} />
                                <Bar dataKey="curtailed" stackId="solar" name={dt.curtailed} fill="#22c55e" fillOpacity={0.6} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                                <Line type="monotone" dataKey="load" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, strokeWidth: 1 }} name={dt.load} connectNulls isAnimationActive={false} />
                                <Line type="monotone" dataKey="gridImport" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} name={dt.grid_import} connectNulls isAnimationActive={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-500">
                            <Layers size={20} />
                        </div>
                        {dt.load_solar_12m}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {monthlyPowerCurves.map((mItem, idx) => (
                            <div key={idx} className="border border-slate-200 rounded p-2 bg-slate-50 h-48">
                                <div className="text-xs font-bold text-slate-500 mb-1 text-center uppercase">{mItem.month}</div>
                                <div className="h-32 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={mItem.data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id={`colorWeekdaySmallDb-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id={`colorWeekendSmallDb-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id={`colorSolarSmallDb-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.8} />
                                            <XAxis dataKey="hour" tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} interval={6} tickFormatter={formatHour} />
                                            <YAxis tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} width={25} tickFormatter={formatKValue} />
                                            <RechartsTooltip contentStyle={SMALL_TOOLTIP_STYLE} labelStyle={{ display: 'none' }} formatter={formatKwShort} />
                                            <Area type="monotone" dataKey="weekday" stroke="#3b82f6" strokeWidth={1.5} fill={`url(#colorWeekdaySmallDb-${idx})`} dot={false} isAnimationActive={false} />
                                            <Area type="monotone" dataKey="weekend" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" fill={`url(#colorWeekendSmallDb-${idx})`} dot={false} isAnimationActive={false} />
                                            <Area type="monotone" dataKey="solar" stroke="#eab308" strokeWidth={1.5} fill={`url(#colorSolarSmallDb-${idx})`} dot={false} isAnimationActive={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center items-center gap-2 mt-1 w-full text-[9px] text-slate-500">
                                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> {dt.weekday}</div>
                                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {dt.weekend}</div>
                                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div> Solar</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
