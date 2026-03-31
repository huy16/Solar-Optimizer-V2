import React, { useState } from 'react';
import { Info, Image as ImageIcon, FileSpreadsheet, ClipboardList, Zap, Calendar, Coins, ChevronDown, ChevronUp } from 'lucide-react';

const LossCard = ({ label, value }) => (
    <div className="flex flex-col items-center justify-center p-2 bg-white border border-slate-200 rounded shadow-sm">
        <span className="text-[10px] text-slate-500 font-bold uppercase">{label}</span>
        <span className="text-sm font-bold text-slate-700">{typeof value === 'number' ? value.toFixed(1) : value}%</span>
    </div>
);

export const Report = ({
    customStats,
    scenarios,
    targetKwp,
    formatNumber,
    detailedSpecsList,
    handleDownloadImage,
    handleDownloadExcelTable,
    monthlyDetails,
    onSelectScenario,
    onShowFormulas,
    currentFinance,
    estimatedLosses,
    formatMoney,
    lang,
    t
}) => {
    const dt = {
        vi: {
            analysis_title: "Phân tích Năng lượng theo Khung giờ & Kịch bản",
            analysis_desc: "Chi tiết sản lượng tự dùng và cắt giảm phân theo giờ Cao điểm (Peak) và Bình thường (Normal).",
            scenario: "Kịch bản",
            self_use: "Tự dùng (Self-Use)",
            excess: "Dư thừa (Export / Curtail)",
            peak: "Cao điểm (Peak)",
            normal: "Bình thường",
            selecting: "Đang chọn",
            tech_specs_title: "Thông số Kỹ thuật chi tiết (Kịch bản hiện tại)",
            losses_title: "Chi tiết Tổn thất (System Losses Breakdown)",
            monthly_table_title: "Bảng dữ liệu Sản lượng Solar & Tải (12 Tháng) (kWh)",
            cashflow_title: "Phân tích Dòng tiền Chi tiết (VND)",
            year: "Năm",
            year_0: "Năm 0",
            capex_tooltip: "Vốn đầu tư ban đầu (CAPEX)",
            revenue: "Doanh thu (Tiết kiệm)",
            om_cost: "Chi phí O&M",
            replacement: "Thay thế (Pin/Inv)",
            debt: "Trả nợ (Gốc+Lãi)",
            tax: "Thuế TNDN",
            net_flow: "Dòng tiền ròng",
            accumulated: "Tích lũy",
            col_month: "Tháng",
            col_pv_yield: "Sản lượng PV (kWh)",
            col_load: "Tổng Tải (kWh)",
            col_self_consumption: "Tự dùng (kWh)",
            col_self_consumption_rate: "Tỷ lệ Tự dùng %"
        },
        en: {
            analysis_title: "Energy Analysis by Time-of-Use & Scenario",
            analysis_desc: "Detailed self-consumption and curtailment breakdown by Peak and Normal hours.",
            scenario: "Scenario",
            self_use: "Self-consumption",
            excess: "Excess (Export / Curtail)",
            peak: "Peak",
            normal: "Normal",
            selecting: "Selected",
            tech_specs_title: "Detailed Technical Specifications (Current Scenario)",
            losses_title: "System Losses Breakdown",
            monthly_table_title: "Monthly Solar & Load Data Table (12 Months) (kWh)",
            cashflow_title: "Detailed Cash Flow Analysis (VND)",
            year: "Year",
            year_0: "Year 0",
            capex_tooltip: "Initial Capital Expenditure (CAPEX)",
            revenue: "Revenue (Savings)",
            om_cost: "O&M Cost",
            replacement: "Replacement (BESS/Inv)",
            debt: "Debt Service (Principal+Int)",
            tax: "Corporate Tax",
            net_flow: "Net Cash Flow",
            accumulated: "Cumulative",
            col_month: "Month",
            col_pv_yield: "PV Yield (kWh)",
            col_load: "Load (kWh)",
            col_self_consumption: "Self-consumption (kWh)",
            col_self_consumption_rate: "Self-consumption Rate %"
        }
    }[lang];

    const [showDetailedSpecs, setShowDetailedSpecs] = useState(false);
    const [showMonthlyData, setShowMonthlyData] = useState(false);

    if (!customStats) return null;

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Zap size={18} className="text-amber-500" /> {dt.analysis_title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{dt.analysis_desc}</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                                <th rowSpan={2} className="px-6 py-3 border-r border-slate-200">{dt.scenario}</th>
                                <th colSpan={2} className="px-6 py-2 border-r border-slate-200 text-center bg-blue-50 text-blue-700 border-b border-slate-200">{dt.self_use}</th>
                                <th colSpan={2} className="px-6 py-2 text-center bg-amber-50 text-amber-700 border-b border-slate-200">{dt.excess}</th>
                            </tr>
                            <tr>
                                <th className="px-6 py-2 border-r border-slate-200 text-center text-blue-600">{dt.peak}</th>
                                <th className="px-6 py-2 border-r border-slate-200 text-center text-blue-600">{dt.normal}</th>
                                <th className="px-6 py-2 border-r border-slate-200 text-center text-amber-600">{dt.peak}</th>
                                <th className="px-6 py-2 text-center text-amber-600">{dt.normal}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {scenarios.map((s, i) => (
                                <tr key={i}
                                    onClick={() => onSelectScenario && onSelectScenario(s)}
                                    className={`hover:bg-slate-50 transition cursor-pointer ${targetKwp === s.kwp ? 'bg-indigo-50/30 font-medium' : ''}`}
                                >
                                    <td className="px-6 py-3 border-r border-slate-200">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="flex items-center gap-2">
                                                {s.label}
                                                {targetKwp === s.kwp && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">{dt.selecting}</span>}
                                            </span>
                                            <span className="text-slate-500 font-mono text-xs">({s.kwp} kWp)</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-right text-blue-700 border-r border-slate-200">{formatNumber(s.stats.usedPeak)}</td>
                                    <td className="px-6 py-3 text-right text-blue-700 border-r border-slate-200">{formatNumber(s.stats.usedNormal)}</td>
                                    <td className="px-6 py-3 text-right text-amber-700 border-r border-slate-200">{formatNumber(s.stats.curtailedPeak + (s.stats.exportedPeak || 0))}</td>
                                    <td className="px-6 py-3 text-right text-amber-700">{formatNumber(s.stats.curtailedNormal + (s.stats.exportedNormal || 0))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>



            <div id="detailed-specs-dashboard" className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex justify-between items-center transition-colors hover:bg-slate-100 cursor-pointer" onClick={() => setShowDetailedSpecs(!showDetailedSpecs)}>
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <ClipboardList size={18} className="text-slate-500" />
                        {dt.tech_specs_title}
                        {showDetailedSpecs ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </h3>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleDownloadImage('detailed-specs-dashboard', 'Detailed_Specs')} className="text-slate-600 hover:text-blue-600 hover:bg-white p-1.5 rounded transition flex items-center gap-1 text-xs border border-transparent hover:border-slate-200" title="Tải ảnh">
                            <ImageIcon size={16} />
                        </button>
                        <button onClick={onShowFormulas} className="text-slate-600 hover:text-purple-600 hover:bg-white p-1.5 rounded transition flex items-center gap-1 text-xs border border-transparent hover:border-slate-200" title="Xem công thức tính">
                            <Info size={16} />
                        </button>
                        <button onClick={() => handleDownloadExcelTable(detailedSpecsList, 'Detailed_Specs', 'Specs')} className="text-slate-600 hover:text-green-600 hover:bg-white p-1.5 rounded transition flex items-center gap-1 text-xs border border-transparent hover:border-slate-200" title="Xuất Excel">
                            <FileSpreadsheet size={16} />
                        </button>
                    </div>
                </div>

                {showDetailedSpecs && (
                    <div className="p-4 animate-in fade-in slide-in-from-top-2">
                        {(() => {
                            const activeStats = customStats;
                            const displayList = [
                                { id: 1, label: t.tech_labels.pv_total, value: activeStats.totalSolarGen, unit: 'kWh', formula: 'Σ ( Monthly Solar Generation )' },
                                { id: 2, label: t.tech_labels.pv_used, value: activeStats.totalUsed, unit: 'kWh', highlight: true, color: 'text-green-600', formula: 'Σ Min( Solar, Load )' },
                                { id: 3, label: t.tech_labels.pv_used_pct, value: activeStats.totalSolarGen > 0 ? (activeStats.totalUsed / activeStats.totalSolarGen * 100).toFixed(2) : 0, unit: '%', highlight: true, color: 'text-green-600', formula: '( PV Used / PV Total ) * 100' },
                                { id: 4, label: t.tech_labels.pv_curtailed, value: activeStats.totalCurtailed + (activeStats.totalExported || 0), unit: 'kWh', highlight: true, color: 'text-red-500', formula: 'PV Total - PV Used' },
                                { id: 5, label: t.tech_labels.pv_curtailed_pct, value: activeStats.totalSolarGen > 0 ? ((activeStats.totalCurtailed + (activeStats.totalExported || 0)) / activeStats.totalSolarGen * 100).toFixed(2) : 0, unit: '%', highlight: true, color: 'text-red-500', formula: '( PV Curtailed / PV Total ) * 100' },
                                { id: 6, label: t.tech_labels.grid_import, value: (activeStats.totalLoad + (activeStats.totalGridCharge || 0)) - activeStats.totalUsed, unit: 'kWh', formula: 'Total Load - PV Used' },
                                { id: 7, label: t.tech_labels.total_load, value: activeStats.totalLoad, unit: 'kWh', formula: 'Σ ( Monthly Load Consumption )' },
                                { id: 8, label: t.tech_labels.loss_pct, value: detailedSpecsList.find(x => x.id === 8)?.value || 0, unit: '%', formula: '( 1 - Total Derate Factor ) * 100' },
                                { id: 9, label: t.tech_labels.pv_used_normal, value: activeStats.usedNormal, unit: 'kWh', formula: 'Σ PV Used (Normal Hours)' },
                                { id: 10, label: t.tech_labels.pv_used_normal_pct, value: activeStats.totalUsed > 0 ? (activeStats.usedNormal / activeStats.totalUsed * 100).toFixed(2) : 0, unit: '%', formula: '( PV Used Normal / Total PV Used ) * 100' },
                                { id: 11, label: t.tech_labels.pv_used_peak, value: activeStats.usedPeak, unit: 'kWh', formula: 'Σ PV Used (Peak Hours)' },
                                { id: 12, label: t.tech_labels.pv_used_peak_pct, value: activeStats.totalUsed > 0 ? (activeStats.usedPeak / activeStats.totalUsed * 100).toFixed(2) : 0, unit: '%', formula: '( PV Used Peak / Total PV Used ) * 100' },
                                { id: 13, label: t.tech_labels.curtailed_normal, value: activeStats.curtailedNormal + (activeStats.exportedNormal || 0), unit: 'kWh', formula: 'Σ PV Curtailed (Normal Hours)' },
                                { id: 14, label: t.tech_labels.curtailed_normal_pct, value: (activeStats.totalCurtailed + activeStats.totalExported) > 0 ? ((activeStats.curtailedNormal + (activeStats.exportedNormal || 0)) / (activeStats.totalCurtailed + activeStats.totalExported) * 100).toFixed(2) : 0, unit: '%', formula: '( Curtailed Normal / Total Curtailed ) * 100' },
                                { id: 15, label: t.tech_labels.curtailed_peak, value: activeStats.curtailedPeak + (activeStats.exportedPeak || 0), unit: 'kWh', formula: 'Σ PV Curtailed (Peak Hours)' },
                                { id: 16, label: t.tech_labels.curtailed_peak_pct, value: (activeStats.totalCurtailed + activeStats.totalExported) > 0 ? ((activeStats.curtailedPeak + (activeStats.exportedPeak || 0)) / (activeStats.totalCurtailed + activeStats.totalExported) * 100).toFixed(2) : 0, unit: '%', formula: '( Curtailed Peak / Total Curtailed ) * 100' },
                            ];

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                                    {displayList.map((row) => (
                                        <div key={row.id} className="bg-slate-50 rounded p-2.5 border border-slate-100 flex flex-col justify-between hover:border-blue-200 transition group/item">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                                    #{row.id}
                                                    {row.formula && (
                                                        <div className="group relative">
                                                            <Info size={10} className="text-slate-300 cursor-help hover:text-blue-500" />
                                                            <div className="absolute bottom-full left-0 mb-1 w-max px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-sm font-mono whitespace-nowrap">
                                                                {row.formula}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 font-medium line-clamp-2 min-h-[32px]" title={row.label}>{row.label}</div>
                                                <div className={`text-sm font-bold mt-0.5 flex items-baseline gap-1 ${row.highlight && row.color ? row.color : 'text-slate-800'}`}>
                                                    {typeof row.value === 'number' ? formatNumber(row.value) : row.value}
                                                    <span className="text-[10px] font-normal text-slate-400">{row.unit}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        {estimatedLosses && estimatedLosses.breakdown && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <h4 className="font-bold text-slate-700 text-xs mb-3 flex items-center gap-2">
                                    {dt.losses_title}
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    < LossCard label={t.loss_labels.temp} value={estimatedLosses.breakdown.temp} />
                                    < LossCard label={t.loss_labels.soiling} value={estimatedLosses.breakdown.soiling} />
                                    < LossCard label={t.loss_labels.cable} value={estimatedLosses.breakdown.cable} />
                                    < LossCard label={t.loss_labels.inverter} value={estimatedLosses.breakdown.inverter} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div id="monthly-data-dashboard" className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex justify-between items-center transition-colors hover:bg-slate-100 cursor-pointer" onClick={() => setShowMonthlyData(!showMonthlyData)}>
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Calendar size={18} className="text-blue-500" />
                        {dt.monthly_table_title}
                        {showMonthlyData ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </h3>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleDownloadImage('monthly-data-dashboard', 'Monthly_Solar_Data')} className="text-slate-600 hover:text-blue-600 hover:bg-white p-1.5 rounded transition flex items-center gap-1 text-xs border border-transparent hover:border-slate-200" title="Tải ảnh">
                            <ImageIcon size={16} />
                        </button>
                        <button onClick={() => handleDownloadExcelTable(monthlyDetails, 'Monthly_Solar_Data', 'Data')} className="text-slate-600 hover:text-green-600 hover:bg-white p-1.5 rounded transition flex items-center gap-1 text-xs border border-transparent hover:border-slate-200" title="Xuất Excel">
                            <FileSpreadsheet size={16} />
                        </button>
                    </div>
                </div>
                {showMonthlyData && (
                    <div className="overflow-x-auto animate-in fade-in slide-in-from-top-2">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-indigo-50 font-bold text-indigo-900 border-b border-indigo-100">
                                <tr>
                                    <th className="p-3 border-b border-indigo-100 text-center">{dt.col_month}</th>
                                    <th className="p-3 border-b border-indigo-100 text-right">{dt.col_pv_yield}</th>
                                    <th className="p-3 border-b border-indigo-100 text-right">{dt.col_load}</th>
                                    <th className="p-3 border-b border-indigo-100 text-right">{dt.col_self_consumption}</th>
                                    <th className="p-3 border-b border-indigo-100 text-center">{dt.col_self_consumption_rate}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyDetails.map((row, idx) => (
                                    <tr key={idx} className={`hover:bg-indigo-50/30 border-b border-slate-100 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                        <td className="p-3 text-center font-bold text-indigo-900">{row.month}</td>
                                        <td className="p-3 text-right font-medium text-amber-600">{formatNumber(row.solar)}</td>
                                        <td className="p-3 text-right font-medium text-blue-600">{formatNumber(row.load)}</td>
                                        <td className="p-3 text-right font-medium text-emerald-600">{formatNumber(row.used)}</td>
                                        <td className="p-3 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${row.solar > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {row.solar > 0 ? ((row.used / row.solar) * 100).toFixed(0) : '0'}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 4. FINANCIAL DETAIL SECTION */}
            {currentFinance && currentFinance.cumulativeData && (
                <div id="financial-detail-dashboard" className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Coins size={18} className="text-emerald-500" /> {dt.cashflow_title}</h3>
                        <div className="flex gap-2">
                            <button onClick={() => handleDownloadImage('financial-detail-dashboard', 'Financial_CashFlow')} className="text-slate-600 hover:text-blue-600 hover:bg-white p-1.5 rounded transition flex items-center gap-1 text-xs border border-transparent hover:border-slate-200" title="Tải ảnh">
                                <ImageIcon size={16} />
                            </button>
                            <button onClick={() => handleDownloadExcelTable(currentFinance.cumulativeData, 'Financial_Yearly', 'CashFlow')} className="text-slate-600 hover:text-green-600 hover:bg-white p-1.5 rounded transition flex items-center gap-1 text-xs border border-transparent hover:border-slate-200" title="Xuất Excel">
                                <FileSpreadsheet size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 border-r border-slate-200 w-20">{dt.year}</th>
                                    <th className="px-4 py-3 border-r border-slate-200 text-right">{dt.revenue}</th>
                                    <th className="px-4 py-3 border-r border-slate-200 text-right">{dt.om_cost}</th>
                                    <th className="px-4 py-3 border-r border-slate-200 text-right">{dt.replacement}</th>
                                    <th className="px-4 py-3 border-r border-slate-200 text-right text-red-600">{dt.debt}</th>
                                    <th className="px-4 py-3 border-r border-slate-200 text-right text-orange-600">{dt.tax}</th>
                                    <th className="px-4 py-3 border-r border-slate-200 text-right text-blue-700">{dt.net_flow}</th>
                                    <th className="px-4 py-3 text-right text-green-700">{dt.accumulated}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {currentFinance.cumulativeData.map((y, i) => (
                                    <tr key={i} className={`hover:bg-slate-50 transition border-b border-slate-100 ${y.year === 0 ? 'bg-orange-50' : ''} ${y.replace < 0 ? 'bg-red-50' : ''}`}>
                                        <td className="px-4 py-2 font-medium">
                                            {y.year === 0 ? (
                                                <div className="flex items-center gap-1 whitespace-nowrap">
                                                    {dt.year_0}
                                                    <div className="group relative">
                                                        <Info size={12} className="text-slate-400 cursor-help" />
                                                        <div className="absolute left-0 bottom-full mb-2 w-max px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-sm whitespace-nowrap">
                                                            {dt.capex_tooltip}
                                                            <div className="absolute top-full left-2 border-4 border-transparent border-t-slate-800"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : `${dt.year} ${y.year}`}
                                        </td>
                                        <td className="px-4 py-2 text-right">{y.revenue > 0 ? formatMoney(y.revenue) : '-'}</td>
                                        <td className="px-4 py-2 text-right text-slate-500">{y.om < 0 ? formatMoney(y.om) : (y.opex < 0 ? formatMoney(y.opex) : '-')}</td>
                                        <td className="px-4 py-2 text-right text-red-500 font-medium">{y.replace < 0 ? formatMoney(y.replace) : '-'}</td>
                                        <td className="px-4 py-2 text-right text-red-600">{y.debt < 0 ? formatMoney(y.debt) : '-'}</td>
                                        <td className="px-4 py-2 text-right text-orange-600">{y.tax < 0 ? formatMoney(y.tax) : '-'}</td>
                                        <td className="px-4 py-2 text-right font-bold text-blue-700">{formatMoney(y.net)}</td>
                                        <td className={`px-4 py-2 text-right font-bold ${y.acc >= 0 ? 'text-green-600' : 'text-orange-600'}`}>{formatMoney(y.acc)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
