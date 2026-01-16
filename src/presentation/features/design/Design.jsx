import React from 'react';
import { Zap, RefreshCw, BatteryCharging, Coins, Settings } from 'lucide-react';

export const Design = ({
    inv1Id, setInv1Id,
    inv1Qty, setInv1Qty,
    inv2Id, setInv2Id,
    inv2Qty, setInv2Qty,
    INVERTER_OPTIONS,
    totalACPower,
    targetKwp,
    handleAutoSelectInverter,
    techParams, setTechParams,
    selectedBess, handleBessSelect,
    BESS_OPTIONS,
    bessKwh, setBessKwh,
    bessMaxPower, setBessMaxPower,
    isGridCharge, setIsGridCharge,
    params, setParams,
    finParams, setFinParams
}) => {
    return (
        <div className="space-y-4">
            {/* SYSTEM & BESS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* INVERTER SECTION */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Zap size={16} className="text-amber-500" /> Cấu hình Inverter
                        </h4>
                        <div className="flex items-center gap-2">
                            <button onClick={handleAutoSelectInverter} title="Tự động chọn Inverter theo DC/AC ~ 1.25" className="p-1 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition">
                                <RefreshCw size={14} />
                            </button>
                            <div className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-medium whitespace-nowrap">
                                DC/AC: {totalACPower > 0 ? (targetKwp / totalACPower).toFixed(2) : 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">MÁY CHÍNH</label>
                                <select value={inv1Id} onChange={(e) => setInv1Id(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500">
                                    {INVERTER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div className="w-16">
                                <label className="text-[10px] font-bold text-slate-400 block mb-1 text-center">SL</label>
                                <input type="number" min="0" value={inv1Qty} onChange={(e) => setInv1Qty(Number(e.target.value))} className="w-full p-1.5 border border-slate-300 rounded bg-white text-center text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">MÁY PHỤ (OPTIONAL)</label>
                                <select value={inv2Id} onChange={(e) => setInv2Id(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500">
                                    <option value="">-- Không --</option>
                                    {INVERTER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div className="w-16">
                                <label className="text-[10px] font-bold text-slate-400 block mb-1 text-center">SL</label>
                                <input type="number" min="0" value={inv2Qty} onChange={(e) => setInv2Qty(Number(e.target.value))} className="w-full p-1.5 border border-slate-300 rounded bg-white text-center text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 italic">
                            <span>Công suất AC tối đa được đồng bộ theo cấu hình Inverter ({new Intl.NumberFormat('vi-VN').format(totalACPower)} kW)</span>
                        </div>
                    </div>
                </div>

                {/* BESS SECTION */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <BatteryCharging size={16} className="text-emerald-500" /> Lưu trữ (BESS)
                    </h4>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 block mb-1">MODEL PIN LƯU TRỮ</label>
                            <select value={selectedBess} onChange={(e) => handleBessSelect(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500">
                                {BESS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>

                        {selectedBess === 'custom' && (
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 block mb-1">DUNG LƯỢNG (kWh)</label>
                                    <input type="number" value={bessKwh} onChange={(e) => setBessKwh(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border border-slate-200 rounded text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 block mb-1">CÔNG SUẤT (kW)</label>
                                    <input type="number" value={bessMaxPower} onChange={(e) => setBessMaxPower(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border border-slate-200 rounded text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500" />
                                </div>
                            </div>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer mt-1">
                            <div className="relative flex items-center">
                                <input type="checkbox" checked={isGridCharge} onChange={(e) => setIsGridCharge(e.target.checked)} className="peer sr-only" />
                                <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                            </div>
                            <span className="text-xs font-medium text-slate-600">Cho phép sạc lưới (Giờ thấp điểm)</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* FINANCIAL & TECHNICAL PARAMS COMPACT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Coins size={16} className="text-yellow-600" /> Giả định Giá điện & O&M
                    </h3>
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <div><label className="text-[9px] font-bold text-slate-400 block">GIÁ CAO ĐIỂM</label><input type="number" value={params.pricePeak} onChange={(e) => setParams(p => ({ ...p, pricePeak: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1.5 border rounded text-xs font-bold" /></div>
                            <div><label className="text-[9px] font-bold text-slate-400 block">BÌNH THƯỜNG</label><input type="number" value={params.priceNormal} onChange={(e) => setParams(p => ({ ...p, priceNormal: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1.5 border rounded text-xs font-bold" /></div>
                            <div><label className="text-[9px] font-bold text-slate-400 block">THẤP ĐIỂM</label><input type="number" value={params.priceOffPeak} onChange={(e) => setParams(p => ({ ...p, priceOffPeak: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1.5 border rounded text-xs font-bold" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-[9px] font-bold text-slate-400 block">CHI PHÍ O&M (% Capex)</label><input type="number" step="0.1" value={finParams.omPercent} onChange={(e) => setFinParams(p => ({ ...p, omPercent: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1.5 border rounded text-xs font-bold" /></div>
                            <div><label className="text-[9px] font-bold text-slate-400 block">LẠM PHÁT ĐIỆN (%/Năm)</label><input type="number" step="0.1" value={finParams.escalation} onChange={(e) => setFinParams(p => ({ ...p, escalation: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1.5 border rounded text-xs font-bold" /></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Settings size={16} className="text-slate-500" /> Tham số Kỹ thuật & Tổn thất
                    </h3>
                    <div className="space-y-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center"><label className="text-[10px] font-semibold text-slate-500">GIÁ BÁN ĐIỆN DƯ (VNĐ)</label><input type="number" value={techParams.gridInjectionPrice} onChange={(e) => setTechParams(prev => ({ ...prev, gridInjectionPrice: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-24 p-1 border rounded text-right text-xs font-bold text-emerald-600" /></div>
                        <div className="grid grid-cols-4 gap-2">
                            {['temp', 'soiling', 'cable', 'inverter'].map(k => (
                                <div key={k}><label className="text-[9px] font-bold text-slate-400 block capitalize">{k} Loss</label><input type="number" step="0.1" value={techParams.losses[k]} onChange={(e) => setTechParams(prev => ({ ...prev, losses: { ...prev.losses, [k]: e.target.value === '' ? '' : Number(e.target.value) } }))} className="w-full p-1 border rounded text-xs text-center" /></div>
                            ))}
                        </div>
                        <div className="text-right text-[10px] font-bold text-slate-400">Total Derate: {((1 - (Object.values(techParams.losses).reduce((a, b) => a + b, 0) / 100)) * 100).toFixed(1)}%</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
