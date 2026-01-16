import React from 'react';
import { Info, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';

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
    onShowFormulas // NEW PROP
}) => {
    if (!customStats) return null;

    return (
        <div className="space-y-6">
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-700">Phân tích Năng lượng theo Khung giờ & Kịch bản</h3>
                    <p className="text-xs text-slate-500 mt-1">Chi tiết sản lượng tự dùng và cắt giảm phân theo giờ Cao điểm (Peak) và Bình thường (Normal).</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                                <th rowSpan={2} className="px-6 py-3 border-r border-slate-200">Kịch bản</th>
                                <th colSpan={2} className="px-6 py-2 border-r border-slate-200 text-center bg-blue-50 text-blue-700 border-b">Tự dùng (Self-Use)</th>
                                <th colSpan={2} className="px-6 py-2 text-center bg-amber-50 text-amber-700 border-b">Dư thừa (Export / Curtail)</th>
                            </tr>
                            <tr>
                                <th className="px-6 py-2 border-r border-slate-200 text-center text-blue-600">Cao điểm (Peak)</th>
                                <th className="px-6 py-2 border-r border-slate-200 text-center text-blue-600">Bình thường</th>
                                <th className="px-6 py-2 border-r border-slate-200 text-center text-amber-600">Cao điểm (Peak)</th>
                                <th className="px-6 py-2 text-center text-amber-600">Bình thường</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {scenarios.map((s, i) => (
                                <tr key={i}
                                    onClick={() => onSelectScenario && onSelectScenario(s)}
                                    className={`hover:bg-slate-50 transition cursor-pointer ${targetKwp === s.kwp ? 'bg-indigo-50/30 font-medium' : ''}`}
                                >
                                    <td className="px-6 py-3 border-r border-slate-200">{s.label} ({s.kwp} kWp) {targetKwp === s.kwp && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Đang chọn</span>}</td>
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

            <div id="detailed-specs-dashboard" className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Thông số Kỹ thuật chi tiết (Kịch bản hiện tại)</h3>
                    <div className="flex gap-2">
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
                <div className="p-0">
                    <table className="w-full text-sm">
                        <tbody className="divide-y divide-slate-100">
                            {(() => {
                                // Check if current targetKwp matches a scenario (for UI highlighting only)
                                const matchingScenario = scenarios.find(s => s.kwp === targetKwp);
                                // ALWAYS use global customStats to reflect real-time adjustments (Capacity, Battery, etc.)
                                // Do not lock to Scenario Stats which are pre-calculated with Zero Export/No Battery.
                                const activeStats = customStats;

                                // Need to recalculate specific formulas based on the ACTIVE stats
                                const displayList = [
                                    { id: 1, label: 'PV Total (Tổng sản lượng PV)', value: activeStats.totalSolarGen, unit: 'kWh', formula: 'Σ ( Monthly Solar Generation )' },
                                    { id: 2, label: 'PV Used by Loads (Năng lượng Solar)', value: activeStats.totalUsed, unit: 'kWh', highlight: true, color: 'text-green-600', formula: 'Σ Min( Solar, Load )' },
                                    { id: 3, label: 'PV Used by Loads %', value: activeStats.totalSolarGen > 0 ? (activeStats.totalUsed / activeStats.totalSolarGen * 100).toFixed(2) : 0, unit: '%', highlight: true, color: 'text-green-600', formula: '( PV Used / PV Total ) * 100' },
                                    { id: 4, label: 'PV Curtailed (Cắt giảm)', value: activeStats.totalCurtailed + (activeStats.totalExported || 0), unit: 'kWh', highlight: true, color: 'text-red-500', formula: 'PV Total - PV Used' },
                                    { id: 5, label: 'PV Curtailed %', value: activeStats.totalSolarGen > 0 ? ((activeStats.totalCurtailed + (activeStats.totalExported || 0)) / activeStats.totalSolarGen * 100).toFixed(2) : 0, unit: '%', highlight: true, color: 'text-red-500', formula: '( PV Curtailed / PV Total ) * 100' },
                                    { id: 6, label: 'Grid Import (Mua lưới)', value: (activeStats.totalLoad + (activeStats.totalGridCharge || 0)) - activeStats.totalUsed, unit: 'kWh', formula: 'Total Load - PV Used' },
                                    { id: 7, label: 'Load Consumption (Tổng tải)', value: activeStats.totalLoad, unit: 'kWh', formula: 'Σ ( Monthly Load Consumption )' },
                                    { id: 8, label: 'Loss Percent (Tổng tổn thất)', value: detailedSpecsList.find(x => x.id === 8)?.value || 0, unit: '%', formula: '( 1 - Total Derate Factor ) * 100' }, // Keep global loss
                                    { id: 9, label: 'PV Used (Giờ Bình thường)', value: activeStats.usedNormal, unit: 'kWh', formula: 'Σ PV Used (Normal Hours)' },
                                    { id: 10, label: 'PV Used (Giờ BT) %', value: activeStats.totalUsed > 0 ? (activeStats.usedNormal / activeStats.totalUsed * 100).toFixed(2) : 0, unit: '%', formula: '( PV Used Normal / Total PV Used ) * 100' },
                                    { id: 11, label: 'PV Used (Giờ Cao điểm)', value: activeStats.usedPeak, unit: 'kWh', formula: 'Σ PV Used (Peak Hours)' },
                                    { id: 12, label: 'PV Used (Giờ CĐ) %', value: activeStats.totalUsed > 0 ? (activeStats.usedPeak / activeStats.totalUsed * 100).toFixed(2) : 0, unit: '%', formula: '( PV Used Peak / Total PV Used ) * 100' },
                                    { id: 13, label: 'PV Curtailed (Giờ Bình thường)', value: activeStats.curtailedNormal + (activeStats.exportedNormal || 0), unit: 'kWh', formula: 'Σ PV Curtailed (Normal Hours)' },
                                    { id: 14, label: 'PV Curtailed (Giờ BT) %', value: (activeStats.totalCurtailed + activeStats.totalExported) > 0 ? ((activeStats.curtailedNormal + (activeStats.exportedNormal || 0)) / (activeStats.totalCurtailed + activeStats.totalExported) * 100).toFixed(2) : 0, unit: '%', formula: '( Curtailed Normal / Total Curtailed ) * 100' },
                                    { id: 15, label: 'PV Curtailed (Giờ Cao điểm)', value: activeStats.curtailedPeak + (activeStats.exportedPeak || 0), unit: 'kWh', formula: 'Σ PV Curtailed (Peak Hours)' },
                                    { id: 16, label: 'PV Curtailed (Giờ CĐ) %', value: (activeStats.totalCurtailed + activeStats.totalExported) > 0 ? ((activeStats.curtailedPeak + (activeStats.exportedPeak || 0)) / (activeStats.totalCurtailed + activeStats.totalExported) * 100).toFixed(2) : 0, unit: '%', formula: '( Curtailed Peak / Total Curtailed ) * 100' },


                                ];

                                return displayList.map((row) => (
                                    <tr key={row.id} className={`hover:bg-slate-50 border-b border-slate-50 last:border-0 ${matchingScenario ? 'bg-indigo-50/10' : ''}`}>
                                        <td className="px-6 py-3 text-slate-400 w-12 text-center text-xs">{row.id}</td>
                                        <td className="px-6 py-3 text-slate-600 font-medium">
                                            <div className="flex items-center gap-1.5 group relative w-fit">
                                                {row.label}
                                                {row.formula && (
                                                    <>
                                                        <Info size={12} className="text-slate-400 cursor-help hover:text-blue-500 transition" />
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-sm font-mono whitespace-nowrap">
                                                            {row.formula}
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className={`px-6 py-3 text-right font-bold ${row.highlight && row.color ? row.color : 'text-slate-800'}`}>{typeof row.value === 'number' ? formatNumber(row.value) : row.value}</td>
                                        <td className="px-6 py-3 text-slate-400 text-xs w-16">{row.unit}</td>
                                    </tr>
                                ));
                            })()}
                        </tbody>

                    </table>
                </div>
            </div>

            <div id="monthly-data-dashboard" className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Bảng dữ liệu Sản lượng Solar & Tải (12 Tháng)</h3>
                    <div className="flex gap-2">
                        <button onClick={() => handleDownloadImage('monthly-data-dashboard', 'Monthly_Solar_Data')} className="text-slate-600 hover:text-blue-600 hover:bg-white p-1.5 rounded transition flex items-center gap-1 text-xs border border-transparent hover:border-slate-200" title="Tải ảnh">
                            <ImageIcon size={16} />
                        </button>
                        <button onClick={() => handleDownloadExcelTable(monthlyDetails, 'Monthly_Solar_Data', 'Data')} className="text-slate-600 hover:text-green-600 hover:bg-white p-1.5 rounded transition flex items-center gap-1 text-xs border border-transparent hover:border-slate-200" title="Xuất Excel">
                            <FileSpreadsheet size={16} />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                            <tr>
                                <th className="p-3 border-b border-slate-200 text-center">Month</th>
                                <th className="p-3 border-b border-slate-200 text-right">PV Yield (kWh)</th>
                                <th className="p-3 border-b border-slate-200 text-right">Load Consumption (kWh)</th>
                                <th className="p-3 border-b border-slate-200 text-right">Self-consumption (kWh)</th>
                                <th className="p-3 border-b border-slate-200 text-center">Self-consumption Rate %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyDetails.map((row, idx) => (
                                <tr key={idx} className={`hover:bg-slate-50 border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                    <td className="p-3 text-center font-medium text-slate-700">{row.month}</td>
                                    <td className="p-3 text-right text-slate-700">{formatNumber(row.solar)}</td>
                                    <td className="p-3 text-right text-slate-700">{formatNumber(row.load)}</td>
                                    <td className="p-3 text-right text-slate-700">{formatNumber(row.used)}</td>
                                    <td className="p-3 text-center font-bold text-green-700">
                                        {row.solar > 0 ? ((row.used / row.solar) * 100).toFixed(0) : '0'}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
