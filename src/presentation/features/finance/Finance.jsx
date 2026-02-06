import React, { useState } from 'react';
import { Coins, AlertCircle, Wallet, DollarSign, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ReferenceLine, Bar, Cell, Line } from 'recharts';

export const Finance = ({
    finParams, setFinParams,
    bessKwh,
    currentFinance,
    formatMoney,
    scenarios,
    targetKwp, setTargetKwp,
    onSelectScenario,
    lang,
    t
}) => {
    const dt = {
        vi: {
            title_finance: "Bản đồ Tài chính Dự án",
            cycle: "VÒNG ĐỜI (Năm)",
            escalation: "LẠM PHÁT ĐIỆN",
            degradation: "SUY HAO PV",
            discount: "LÃI CHIẾT KHẤU",
            om: "CHI PHÍ O&M",
            battery_life: "TUỔI THỌ PIN",
            battery_replace_pct: "PHÍ THAY PIN (% GIÁ GỐC)",
            no_battery_msg: "Chưa có Pin (0 kWh). Phí thay pin sẽ không tính.",
            total_capex_manual: "Cấu hình Vốn đầu tư",
            auto_calc_placeholder: "Tự động tính...",
            manual_override_msg: "* Nhập số để ghi đè giá trị tính toán tự động",
            title_loan: "Cấu hình Vay vốn",
            loan_ratio: "TỶ LỆ VAY (%)",
            equity: "Vốn tự có",
            interest_rate: "LÃI SUẤT (%/Năm)",
            loan_term: "THỜI HẠN (Năm)",
            no_lever_msg: "Không sử dụng đòn bẩy tài chính",
            cashflow_chart_title: "Biểu đồ Dòng tiền",
            net_flow: "Dòng tiền ròng",
            accumulated: "Tích lũy",
            year: "Năm",
            year_0: "Đầu tư (Năm 0)",
            revenue: "Doanh thu (Tiết kiệm)",
            om_cost: "Chi phí O&M",
            replacement: "Thay thế Thiết bị",
            analysis_title: "Phân tích Hiệu quả Đầu tư (So sánh Kịch bản)",
            analysis_desc: "So sánh các chỉ số tài chính nâng cao (NPV, ROI, IRR) dựa trên các kịch bản công suất.",
            col_scenario: "Kịch bản",
            col_capacity: "Công suất",
            col_capex: "Vốn (CAPEX)",
            col_saving: "Tiết kiệm (Năm 1)",
            col_npv: "NPV",
            col_irr: "IRR",
            col_payback: "Hoàn vốn",
            btn_select: "Chọn",
            unit_year: "Năm"
        },
        en: {
            title_finance: "Project Financial Map",
            cycle: "PROJECT LIFE (Years)",
            escalation: "POWER ESCALATION",
            degradation: "PV DEGRADATION",
            discount: "DISCOUNT RATE",
            om: "O&M COST",
            battery_life: "BATTERY LIFE",
            battery_replace_pct: "BATTERY REPLACEMENT (% OF CAPEX)",
            no_battery_msg: "No Battery (0 kWh). Replacement cost not applied.",
            total_capex_manual: "Investment Capital Configuration",
            auto_calc_placeholder: "Auto-calculated...",
            manual_override_msg: "* Enter amount to override automatic calculation",
            title_loan: "Loan Configuration",
            loan_ratio: "LOAN RATIO (%)",
            equity: "Equity",
            interest_rate: "INTEREST RATE (%/Year)",
            loan_term: "LOAN TERM (Years)",
            no_lever_msg: "No financial leverage used",
            cashflow_chart_title: "Cash Flow Chart",
            net_flow: "Net Cash Flow",
            accumulated: "Cumulative",
            year: "Year",
            year_0: "Investment (Year 0)",
            revenue: "Revenue (Savings)",
            om_cost: "O&M Cost",
            replacement: "Equipment Replacement",
            analysis_title: "Investment Performance Analysis (Scenario Comparison)",
            analysis_desc: "Compare advanced financial metrics (NPV, ROI, IRR) across different capacity scenarios.",
            col_scenario: "Scenario",
            col_capacity: "Capacity",
            col_capex: "CAPEX",
            col_saving: "Savings (Year 1)",
            col_npv: "NPV",
            col_irr: "IRR",
            col_payback: "Payback",
            btn_select: "Select",
            unit_year: "Years"
        }
    }[lang];

    const [showDetailTable, setShowDetailTable] = useState(false);
    const [showFinanceMap, setShowFinanceMap] = useState(false);

    return (
        <div className="space-y-6">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                <div className={`flex justify-between items-center ${showFinanceMap ? 'mb-2' : ''}`}>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Coins size={16} className="text-emerald-600" /> {dt.title_finance}</h3>
                    <label className="inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showFinanceMap}
                            onChange={(e) => setShowFinanceMap(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="relative w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                </div>

                {showFinanceMap && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            {[{ l: dt.cycle, k: 'years', u: dt.unit_year, v: finParams.years, step: 1 }, { l: dt.escalation, k: 'escalation', u: '%/Năm', v: finParams.escalation, step: 0.1 }, { l: dt.degradation, k: 'degradation', u: '%/Năm', v: finParams.degradation, step: 0.05 }, { l: dt.discount, k: 'discountRate', u: '%', v: finParams.discountRate, step: 0.1 }, { l: dt.om, k: 'omPercent', u: '%/Năm', v: finParams.omPercent, step: 0.1 }, { l: dt.battery_life, k: 'batteryLife', u: dt.unit_year, v: finParams.batteryLife, step: 1 },].map((p, i) => (
                                <div key={i}><label className="text-[9px] text-slate-400 font-bold block mb-0.5">{p.l}</label><div className="relative"><input type="number" step={p.step} value={p.v} onChange={(e) => setFinParams(prev => ({ ...prev, [p.k]: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1.5 text-xs border rounded bg-white pr-6 font-bold text-slate-700 focus:ring-1 focus:ring-blue-200 outline-none" /><span className="absolute right-1.5 top-1.5 text-[10px] text-slate-400 select-none">{p.u}</span></div></div>
                            ))}
                        </div>
                        <div className="mt-2 text-right"><label className="text-[9px] text-slate-400 font-bold block mb-0.5">{dt.battery_replace_pct}</label><div className="relative inline-block w-full"><input type="number" step={1} value={finParams.batteryReplaceCost} onChange={(e) => setFinParams(prev => ({ ...prev, batteryReplaceCost: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1.5 text-xs border rounded bg-white font-bold text-slate-700 outline-none" /><span className="absolute right-2 top-1.5 text-[10px] text-slate-400 select-none">%</span></div></div>
                        {bessKwh === 0 && (<div className="mt-2 bg-orange-50 border border-orange-100 rounded p-2 flex items-center gap-2"><AlertCircle size={12} className="text-orange-500" /><span className="text-[10px] text-orange-700">{dt.no_battery_msg}</span></div>)}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* NEW: Investment Capital (Capex) */}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <div className={`flex justify-between items-center ${(finParams.manualCapex !== '' && finParams.manualCapex !== null && finParams.manualCapex !== undefined) ? 'mb-3' : ''}`}>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><DollarSign size={16} className="text-blue-600" /> {dt.total_capex_manual}</h3>
                        <label className="inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={finParams.manualCapex !== '' && finParams.manualCapex !== null && finParams.manualCapex !== undefined}
                                onChange={(e) => setFinParams(prev => ({ ...prev, manualCapex: e.target.checked ? 0 : '' }))}
                                className="sr-only peer"
                            />
                            <div className="relative w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {(finParams.manualCapex !== '' && finParams.manualCapex !== null && finParams.manualCapex !== undefined) && (
                        <div className="animate-in fade-in slide-in-from-top-2 mt-auto">
                            <div className="relative">
                                <input
                                    type="number"
                                    value={finParams.manualCapex}
                                    onChange={(e) => setFinParams(prev => ({ ...prev, manualCapex: e.target.value === '' ? '' : Number(e.target.value) }))}
                                    placeholder={dt.auto_calc_placeholder}
                                    className="w-full p-2 text-sm border rounded bg-blue-50/50 font-bold text-blue-800 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-300 outline-none"
                                />
                                <span className="absolute right-2 top-2 text-[10px] text-blue-400 select-none font-bold">VND</span>
                            </div>
                            <p className="text-[9px] text-slate-400 mt-1 italic">{dt.manual_override_msg}</p>
                        </div>
                    )}
                </div>

                {/* LOAN CONFIG */}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                    <div className={`flex justify-between items-center ${finParams.loan.enable ? 'mb-3' : ''}`}>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Wallet size={16} className="text-blue-600" /> {dt.title_loan}</h3>
                        <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={finParams.loan.enable} onChange={(e) => setFinParams(prev => ({ ...prev, loan: { ...prev.loan, enable: e.target.checked } }))} className="sr-only peer" />
                            <div className="relative w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {finParams.loan.enable && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[9px] font-bold text-slate-400 block mb-0.5">{dt.loan_ratio}</label><input type="number" value={finParams.loan.ratio} onChange={(e) => setFinParams(prev => ({ ...prev, loan: { ...prev.loan, ratio: e.target.value === '' ? '' : Number(e.target.value) } }))} className="w-full p-1.5 border rounded bg-blue-50 text-blue-900 text-xs font-bold outline-none" /></div>
                                <div className="pt-4 text-[10px] text-slate-400">{dt.equity}: <span className="font-bold text-slate-700">{100 - finParams.loan.ratio}%</span></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[9px] font-bold text-slate-400 block mb-0.5">{dt.interest_rate}</label><input type="number" step="0.1" value={finParams.loan.rate} onChange={(e) => setFinParams(prev => ({ ...prev, loan: { ...prev.loan, rate: e.target.value === '' ? '' : Number(e.target.value) } }))} className="w-full p-1.5 border rounded text-xs font-bold outline-none" /></div>
                                <div><label className="text-[9px] font-bold text-slate-400 block mb-0.5">{dt.loan_term}</label><input type="number" value={finParams.loan.term} onChange={(e) => setFinParams(prev => ({ ...prev, loan: { ...prev.loan, term: e.target.value === '' ? '' : Number(e.target.value) } }))} className="w-full p-1.5 border rounded text-xs font-bold outline-none" /></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {currentFinance && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <BarChart2 size={16} className="text-blue-600" />
                            {dt.cashflow_chart_title}
                        </h3>
                        <button
                            onClick={() => setShowDetailTable(!showDetailTable)}
                            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
                        >
                            {showDetailTable ? (
                                <><ChevronUp size={14} /> {lang === 'vi' ? 'Thu gọn' : 'Collapse'}</>
                            ) : (
                                <><ChevronDown size={14} /> {lang === 'vi' ? 'Xem bảng chi tiết' : 'Show Detailed Table'}</>
                            )}
                        </button>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={currentFinance.cumulativeData} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.8} />
                                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 10 }} width={50} tickFormatter={(val) => Math.abs(val) >= 1e9 ? `${(val / 1e9).toFixed(1)} ${lang === 'vi' ? 'Tỷ' : 'B'}` : Math.abs(val) >= 1e6 ? `${(val / 1e6).toFixed(0)} ${lang === 'vi' ? 'Tr' : 'M'}` : val} label={{ value: dt.net_flow, angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: '#64748b' } }} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} width={50} tickFormatter={(val) => Math.abs(val) >= 1e9 ? `${(val / 1e9).toFixed(1)} ${lang === 'vi' ? 'Tỷ' : 'B'}` : Math.abs(val) >= 1e6 ? `${(val / 1e6).toFixed(0)} ${lang === 'vi' ? 'Tr' : 'M'}` : val} label={{ value: dt.accumulated, angle: 90, position: 'insideRight', offset: 10, style: { fontSize: 10, fill: '#64748b' } }} />
                                <RechartsTooltip formatter={(value) => formatMoney(Number(value))} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                                <ReferenceLine yAxisId="left" y={0} stroke="#94a3b8" />
                                <Bar yAxisId="left" dataKey="net" name={dt.net_flow} barSize={20} isAnimationActive={false}>
                                    {currentFinance.cumulativeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.net >= 0 ? '#3b82f6' : '#ef4444'} />
                                    ))}
                                </Bar>
                                <Line yAxisId="right" type="monotone" dataKey="acc" name={dt.accumulated} stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {showDetailTable && (
                        <div className="mt-6 overflow-x-auto border rounded-lg border-slate-200 animate-in fade-in slide-in-from-top-4">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 font-bold text-slate-600">
                                    <tr>
                                        <th className="p-2 border-b">{dt.year}</th>
                                        <th className="p-2 border-b text-right">{dt.revenue}</th>
                                        <th className="p-2 border-b text-right">{dt.om_cost}</th>
                                        <th className="p-2 border-b text-right">{dt.replacement}</th>
                                        <th className="p-2 border-b text-right text-blue-700">{dt.net_flow}</th>
                                        <th className="p-2 border-b text-right text-green-700">{dt.accumulated}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentFinance.cumulativeData.map((y, i) => (
                                        <tr key={i} className={`hover:bg-slate-50 border-b border-slate-100 ${y.year === 0 ? 'bg-orange-50' : ''} ${y.isReplacement ? 'bg-red-50' : ''}`}>
                                            <td className="p-2 font-medium">{y.year === 0 ? dt.year_0 : `${dt.year} ${y.year}`}</td>
                                            <td className="p-2 text-right">{formatMoney(y.revenue)}</td>
                                            <td className="p-2 text-right text-slate-500">{y.year > 0 ? formatMoney(y.om) : '-'}</td>
                                            <td className="p-2 text-right text-red-500">{y.replace < 0 ? formatMoney(y.replace) : '-'}</td>
                                            <td className="p-2 text-right font-bold text-blue-700">{formatMoney(y.net)}</td>
                                            <td className={`p-2 text-right font-bold ${y.acc >= 0 ? 'text-green-600' : 'text-orange-600'}`}>{formatMoney(y.acc)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100"><h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><BarChart2 size={18} className="text-slate-500" /> {dt.analysis_title}</h3><p className="text-sm text-slate-500">{dt.analysis_desc}</p></div>
                <div className="overflow-x-auto"><table className="w-full text-xs text-left"><thead className="bg-slate-50 text-slate-500 uppercase text-[10px]"><tr><th className="px-4 py-2 font-medium">{dt.col_scenario}</th><th className="px-4 py-2 font-medium text-center">{dt.col_capacity}</th><th className="px-4 py-2 font-medium text-right">{dt.col_capex}</th><th className="px-4 py-2 font-medium text-right">{dt.col_saving}</th><th className="px-4 py-2 font-medium text-right text-emerald-600">{dt.col_npv}</th><th className="px-4 py-2 font-medium text-right text-blue-600">{dt.col_irr}</th><th className="px-4 py-2 font-medium text-right">{dt.col_payback}</th><th className="px-4 py-2"></th></tr></thead><tbody className="divide-y divide-slate-100">{scenarios.map((s, i) => (<tr key={i} className={`hover:bg-slate-50 transition ${targetKwp === s.kwp ? 'bg-indigo-50/50' : ''}`}><td className="px-4 py-2.5 font-medium text-slate-700">{s.label}</td><td className="px-4 py-2.5 text-center font-bold">{s.kwp} kWp</td><td className="px-4 py-2.5 text-right text-slate-600">{formatMoney(s.capex)}</td><td className="px-4 py-2.5 text-right text-slate-600">{formatMoney(s.annualSaving)}</td><td className="px-4 py-2.5 text-right font-bold text-emerald-600">{formatMoney(s.npv)}</td><td className="px-4 py-2.5 text-right font-bold text-blue-600">{s.irr.toFixed(1)}%</td><td className="px-4 py-2.5 text-right font-bold text-slate-800">{s.paybackYears.toFixed(1)} {dt.unit_year}</td><td className="px-4 py-2.5 text-right"><button onClick={() => onSelectScenario ? onSelectScenario(s) : setTargetKwp(s.kwp)} className={`text-[10px] px-2.5 py-1 rounded-full border transition ${targetKwp === s.kwp ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 hover:bg-white hover:border-indigo-500 text-slate-500'}`}>{dt.btn_select}</button></td></tr>))}</tbody></table></div>
            </div>
        </div>
    );
};
