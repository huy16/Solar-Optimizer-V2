import React from 'react';
import { Coins, AlertCircle, Wallet } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ReferenceLine, Bar, Cell, Line } from 'recharts';

export const Finance = ({
    finParams, setFinParams,
    bessKwh,
    currentFinance,
    formatMoney,
    scenarios,
    targetKwp, setTargetKwp,
    onSelectScenario
}) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><Coins size={16} className="text-emerald-600" /> Bản đồ Tài chính Dự án</h3>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                        {[{ l: 'VÒNG ĐỜI (Năm)', k: 'years', u: 'Năm', v: finParams.years, step: 1 }, { l: 'LẠM PHÁT ĐIỆN', k: 'escalation', u: '%/Năm', v: finParams.escalation, step: 0.1 }, { l: 'SUY HAO PV', k: 'degradation', u: '%/Năm', v: finParams.degradation, step: 0.05 }, { l: 'LÃI CHIẾT KHẤU', k: 'discountRate', u: '%', v: finParams.discountRate, step: 0.1 }, { l: 'CHI PHÍ O&M', k: 'omPercent', u: '%/Năm', v: finParams.omPercent, step: 0.1 }, { l: 'TUỔI THỌ PIN', k: 'batteryLife', u: 'Năm', v: finParams.batteryLife, step: 1 },].map((p, i) => (
                            <div key={i}><label className="text-[9px] text-slate-400 font-bold block mb-0.5">{p.l}</label><div className="relative"><input type="number" step={p.step} value={p.v} onChange={(e) => setFinParams(prev => ({ ...prev, [p.k]: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1.5 text-xs border rounded bg-white pr-6 font-bold text-slate-700 focus:ring-1 focus:ring-blue-200 outline-none" /><span className="absolute right-1.5 top-1.5 text-[10px] text-slate-400 select-none">{p.u}</span></div></div>
                        ))}
                    </div>
                    <div className="mt-2 text-right"><label className="text-[9px] text-slate-400 font-bold block mb-0.5">PHÍ THAY PIN (% GIÁ GỐC)</label><div className="relative inline-block w-full"><input type="number" step={1} value={finParams.batteryReplaceCost} onChange={(e) => setFinParams(prev => ({ ...prev, batteryReplaceCost: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1.5 text-xs border rounded bg-white font-bold text-slate-700 outline-none" /><span className="absolute right-2 top-1.5 text-[10px] text-slate-400 select-none">%</span></div></div>
                    {bessKwh === 0 && (<div className="mt-2 bg-orange-50 border border-orange-100 rounded p-2 flex items-center gap-2"><AlertCircle size={12} className="text-orange-500" /><span className="text-[10px] text-orange-700">Chưa có Pin (0 kWh). Phí thay pin sẽ không tính.</span></div>)}

                    <div className="mt-4 pt-3 border-t border-slate-100">
                        <label className="text-[10px] text-blue-600 font-bold block mb-1">TỔNG VỐN ĐẦU TƯ (NHẬP TAY)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={finParams.manualCapex || ''}
                                onChange={(e) => setFinParams(prev => ({ ...prev, manualCapex: e.target.value }))}
                                placeholder="Tự động tính..."
                                className="w-full p-2 text-sm border rounded bg-blue-50/50 font-bold text-blue-800 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-300 outline-none"
                            />
                            <span className="absolute right-2 top-2 text-[10px] text-blue-400 select-none font-bold">VND</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1 italic">* Nhập số để ghi đè giá trị tính toán tự động</p>
                    </div>
                </div>

                {/* NEW: Loan Configuration */}
                {/* LOAN CONFIG */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Wallet size={16} className="text-blue-600" /> Cấu hình Vay vốn</h3>
                        <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={finParams.loan.enable} onChange={(e) => setFinParams(prev => ({ ...prev, loan: { ...prev.loan, enable: e.target.checked } }))} className="sr-only peer" />
                            <div className="relative w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {finParams.loan.enable ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[9px] font-bold text-slate-400 block mb-0.5">TỶ LỆ VAY (%)</label><input type="number" value={finParams.loan.ratio} onChange={(e) => setFinParams(prev => ({ ...prev, loan: { ...prev.loan, ratio: e.target.value === '' ? '' : Number(e.target.value) } }))} className="w-full p-1.5 border rounded bg-blue-50 text-blue-900 text-xs font-bold outline-none" /></div>
                                <div className="pt-4 text-[10px] text-slate-400">Vốn tự có: <span className="font-bold text-slate-700">{100 - finParams.loan.ratio}%</span></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[9px] font-bold text-slate-400 block mb-0.5">LÃI SUẤT (%/Năm)</label><input type="number" step="0.1" value={finParams.loan.rate} onChange={(e) => setFinParams(prev => ({ ...prev, loan: { ...prev.loan, rate: e.target.value === '' ? '' : Number(e.target.value) } }))} className="w-full p-1.5 border rounded text-xs font-bold outline-none" /></div>
                                <div><label className="text-[9px] font-bold text-slate-400 block mb-0.5">THỜI HẠN (Năm)</label><input type="number" value={finParams.loan.term} onChange={(e) => setFinParams(prev => ({ ...prev, loan: { ...prev.loan, term: e.target.value === '' ? '' : Number(e.target.value) } }))} className="w-full p-1.5 border rounded text-xs font-bold outline-none" /></div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-24 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex flex-col justify-center items-center text-slate-400 text-xs gap-1">
                            <Wallet size={20} className="opacity-20" />
                            <span>Không sử dụng đòn bẩy tài chính</span>
                        </div>
                    )}
                </div>
            </div>

            {currentFinance && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"><h3 className="text-lg font-bold text-slate-800 mb-2">Biểu đồ Dòng tiền (Cashflow)</h3><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={currentFinance.cumulativeData} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" tick={{ fontSize: 10 }} /><YAxis yAxisId="left" tick={{ fontSize: 10 }} width={50} tickFormatter={(val) => Math.abs(val) >= 1e9 ? `${(val / 1e9).toFixed(1)} Tỷ` : Math.abs(val) >= 1e6 ? `${(val / 1e6).toFixed(0)} Tr` : val} label={{ value: 'Dòng tiền', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: '#64748b' } }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} width={50} tickFormatter={(val) => Math.abs(val) >= 1e9 ? `${(val / 1e9).toFixed(1)} Tỷ` : Math.abs(val) >= 1e6 ? `${(val / 1e6).toFixed(0)} Tr` : val} label={{ value: 'Tích lũy', angle: 90, position: 'insideRight', offset: 10, style: { fontSize: 10, fill: '#64748b' } }} /><RechartsTooltip formatter={(value) => formatMoney(Number(value))} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /><Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} /><ReferenceLine yAxisId="left" y={0} stroke="#94a3b8" /><Bar yAxisId="left" dataKey="net" name="Dòng tiền ròng" barSize={20}>{currentFinance.cumulativeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.net >= 0 ? '#3b82f6' : '#ef4444'} />))}</Bar><Line yAxisId="right" type="monotone" dataKey="acc" name="Tích lũy" stroke="#10b981" strokeWidth={3} dot={false} /></ComposedChart></ResponsiveContainer></div>
                    <div className="mt-6 overflow-x-auto border rounded-lg border-slate-200"><table className="w-full text-xs text-left"><thead className="bg-slate-50 font-bold text-slate-600"><tr><th className="p-2 border-b">Năm</th><th className="p-2 border-b text-right">Doanh thu (Tiết kiệm)</th><th className="p-2 border-b text-right">Chi phí O&M</th><th className="p-2 border-b text-right">Thay thế Thiết bị</th><th className="p-2 border-b text-right text-blue-700">Dòng tiền Ròng</th><th className="p-2 border-b text-right text-green-700">Tích lũy</th></tr></thead><tbody>{currentFinance.cumulativeData.map((y, i) => (<tr key={i} className={`hover:bg-slate-50 border-b border-slate-100 ${y.year === 0 ? 'bg-orange-50' : ''} ${y.isReplacement ? 'bg-red-50' : ''}`}><td className="p-2 font-medium">{y.year === 0 ? 'Đầu tư (Năm 0)' : `Năm ${y.year}`}</td><td className="p-2 text-right">{formatMoney(y.revenue)}</td><td className="p-2 text-right text-slate-500">{y.year > 0 ? formatMoney(y.om) : '-'}</td><td className="p-2 text-right text-red-500">{y.replace < 0 ? formatMoney(y.replace) : '-'}</td><td className="p-2 text-right font-bold text-blue-700">{formatMoney(y.net)}</td><td className={`p-2 text-right font-bold ${y.acc >= 0 ? 'text-green-600' : 'text-orange-600'}`}>{formatMoney(y.acc)}</td></tr>))}</tbody></table></div></div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800">Phân tích Hiệu quả Đầu tư (So sánh Kịch bản)</h3><p className="text-sm text-slate-500">So sánh các chỉ số tài chính nâng cao (NPV, ROI, IRR) dựa trên các kịch bản công suất.</p></div>
                <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 uppercase text-xs"><tr><th className="px-6 py-3 font-medium">Kịch bản</th><th className="px-6 py-3 font-medium text-center">Công suất</th><th className="px-6 py-3 font-medium text-right">Vốn (CAPEX)</th><th className="px-6 py-3 font-medium text-right">Tiết kiệm (Năm 1)</th><th className="px-6 py-3 font-medium text-right text-emerald-600">NPV</th><th className="px-6 py-3 font-medium text-right text-blue-600">IRR</th><th className="px-6 py-3 font-medium text-right">Hoàn vốn</th><th className="px-6 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100">{scenarios.map((s, i) => (<tr key={i} className={`hover:bg-slate-50 transition ${targetKwp === s.kwp ? 'bg-indigo-50/50' : ''}`}><td className="px-6 py-4 font-medium text-slate-700">{s.label}</td><td className="px-6 py-4 text-center font-bold">{s.kwp} kWp</td><td className="px-6 py-4 text-right text-slate-600">{formatMoney(s.capex)}</td><td className="px-6 py-4 text-right text-slate-600">{formatMoney(s.annualSaving)}</td><td className="px-6 py-4 text-right font-bold text-emerald-600">{formatMoney(s.npv)}</td><td className="px-6 py-4 text-right font-bold text-blue-600">{s.irr.toFixed(1)}%</td><td className="px-6 py-4 text-right font-bold text-slate-800">{s.paybackYears.toFixed(1)} Năm</td><td className="px-6 py-4 text-right"><button onClick={() => onSelectScenario ? onSelectScenario(s) : setTargetKwp(s.kwp)} className={`text-xs px-3 py-1.5 rounded-full border transition ${targetKwp === s.kwp ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 hover:bg-white hover:border-indigo-500 text-slate-500'}`}>Chọn</button></td></tr>))}</tbody></table></div>
            </div>
        </div>
    );
};
