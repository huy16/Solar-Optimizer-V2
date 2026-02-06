import { Zap, RefreshCw, BatteryCharging, Coins, Settings, Wand2, Target } from 'lucide-react';

export const Design = ({
    inv1Id, setInv1Id,
    inv1Qty, setInv1Qty,
    inv2Id, setInv2Id,
    inv2Qty, setInv2Qty,
    INVERTER_OPTIONS,
    totalACPower,
    targetKwp,
    handleMagicSuggest,
    techParams, setTechParams,
    selectedBess, handleBessSelect,
    BESS_OPTIONS,
    bessKwh, setBessKwh,
    bessMaxPower, setBessMaxPower,
    handleSuggestBessSize,
    isGridCharge, setIsGridCharge,
    bessStrategy, setBessStrategy,
    handleOptimize,
    handleOptimizeBess,
    processedData,
    params, setParams,
    finParams, setFinParams,
    lang,
    t
}) => {
    const dt = {
        vi: {
            title_inverter: "Cấu hình Inverter",
            auto_select: "Tự động chọn Inverter theo DC/AC ~ 1.25",
            main_machine: "MÁY CHÍNH",
            sub_machine: "MÁY PHỤ (OPTIONAL)",
            none: "-- Không --",
            qty: "SL",
            ac_sync_msg: "Công suất AC tối đa được đồng bộ theo cấu hình Inverter",
            title_bess: "Lưu trữ (BESS)",
            bess_model: "MODEL PIN LƯU TRỮ",
            capacity: "DUNG LƯỢNG (kWh)",
            suggest_btn: "Gợi ý",
            power: "CÔNG SUẤT (kW)",
            grid_charge: "Cho phép sạc lưới (Giờ thấp điểm)",
            title_finance: "Giả định Giá điện & O&M",
            price_peak: "GIÁ CAO ĐIỂM",
            price_normal: "BÌNH THƯỜNG",
            price_low: "THẤP ĐIỂM",
            om_cost_capex: "CHI PHÍ O&M (% Capex)",
            inflation: "LẠM PHÁT ĐIỆN (%/Năm)",
            title_tech: "Tham số Kỹ thuật & Tổn thất",
            export_price: "GIÁ BÁN ĐIỆN DƯ (VNĐ)",
            total_derate: "Total Derate",
            bess_strategy: "CHIẾN LƯỢC XẢ PIN",
            strat_self: "Tự dùng (Self-consumption)",
            strat_shaving: "Tiết kiệm Cao điểm (Peak Shaving)",
            optimize_btn: "Tự động tối ưu",
            optimize_fixed_btn: "Tối ưu theo CS chọn",
            magic_btn: "Tính toán Thông minh",
            bess_none: "Không dùng",
            bess_custom: "Tùy chỉnh"
        },
        en: {
            title_inverter: "Inverter Configuration",
            auto_select: "Auto-select Inverter based on DC/AC ~ 1.25",
            main_machine: "MAIN INVERTER",
            sub_machine: "SECONDARY (OPTIONAL)",
            none: "-- None --",
            qty: "QTY",
            ac_sync_msg: "Max AC power synchronized with Inverter configuration",
            title_bess: "Energy Storage (BESS)",
            bess_model: "BATTERY MODEL",
            capacity: "CAPACITY (kWh)",
            suggest_btn: "Suggest",
            power: "POWER (kW)",
            grid_charge: "Allow Grid Charging (Off-peak)",
            title_finance: "Electricity Price & O&M Assumptions",
            price_peak: "PEAK PRICE",
            price_normal: "NORMAL",
            price_low: "OFF-PEAK",
            om_cost_capex: "O&M COST (% Capex)",
            inflation: "POWER ESCALATION (%/Year)",
            title_tech: "Technical Params & Losses",
            export_price: "GRID FEED-IN PRICE (VND)",
            total_derate: "Total Derate",
            bess_strategy: "DISCHARGE STRATEGY",
            strat_self: "Self-consumption",
            strat_shaving: "Peak Shaving",
            optimize_btn: "Auto Optimize",
            optimize_fixed_btn: "Optimize by Selection",
            magic_btn: "Smart Suggest",
            bess_none: "None",
            bess_custom: "Custom"
        }
    }[lang];
    return (
        <div className="space-y-4">
            {/* MAIN LAYOUT GRID: 2x2 Grid with equal size cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-fr">

                {/* INVERTER SECTION */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 min-h-[200px]">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Zap size={16} className="text-amber-500" /> {dt.title_inverter}
                        </h4>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleMagicSuggest}
                                title={dt.magic_btn}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold transition shadow-sm"
                            >
                                <Wand2 size={12} />
                                <span>{dt.magic_btn}</span>
                            </button>
                            <div className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-medium whitespace-nowrap">
                                DC/AC: {totalACPower > 0 ? (targetKwp / totalACPower).toFixed(2) : 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">{dt.main_machine}</label>
                                <select value={inv1Id} onChange={(e) => setInv1Id(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500">
                                    {INVERTER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div className="w-16">
                                <label className="text-[10px] font-bold text-slate-400 block mb-1 text-center">{dt.qty}</label>
                                <input type="number" min="0" value={inv1Qty} onChange={(e) => setInv1Qty(Number(e.target.value))} className="w-full p-1.5 border border-slate-300 rounded bg-white text-center text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">{dt.sub_machine}</label>
                                <select value={inv2Id} onChange={(e) => setInv2Id(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500">
                                    <option value="">{dt.none}</option>
                                    {INVERTER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div className="w-16">
                                <label className="text-[10px] font-bold text-slate-400 block mb-1 text-center">{dt.qty}</label>
                                <input type="number" min="0" value={inv2Qty} onChange={(e) => setInv2Qty(Number(e.target.value))} className="w-full p-1.5 border border-slate-300 rounded bg-white text-center text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 italic">
                            <span>{dt.ac_sync_msg} ({new Intl.NumberFormat('vi-VN').format(totalACPower)} kW)</span>
                        </div>
                    </div>
                </div>

                {/* TECHNICAL PARAMS */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 min-h-[200px]">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Settings size={16} className="text-slate-500" /> {dt.title_tech}
                    </h3>
                    <div className="space-y-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-semibold text-slate-500 uppercase">{dt.export_price}</label>
                            <input type="number" value={techParams.gridInjectionPrice} onChange={(e) => setTechParams(prev => ({ ...prev, gridInjectionPrice: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-24 p-1 border border-slate-300 rounded text-right text-xs font-bold text-emerald-600" />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {['temp', 'soiling', 'cable', 'inverter'].map(k => (
                                <div key={k}>
                                    <label className="text-[9px] font-bold text-slate-400 block">{t.loss_labels[k]}</label>
                                    <input type="number" step="0.1" value={techParams.losses[k]} onChange={(e) => setTechParams(prev => ({ ...prev, losses: { ...prev.losses, [k]: e.target.value === '' ? '' : Number(e.target.value) } }))} className="w-full p-1 border border-slate-300 rounded text-xs text-center bg-white" />
                                </div>
                            ))}
                        </div>
                        <div className="text-right text-[10px] font-bold text-slate-400">
                            {t.loss_labels.total_derate}: <span className="text-slate-500">{((1 - (Object.values(techParams.losses).reduce((a, b) => a + b, 0) / 100)) * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                {/* BESS SECTION */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 min-h-[200px]">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <BatteryCharging size={16} className="text-emerald-500" /> {dt.title_bess}
                        </h4>
                        <div className="flex gap-1.5 align-middle">
                            <button
                                onClick={() => handleOptimizeBess(processedData, params, finParams)}
                                title={dt.optimize_fixed_btn}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded text-[10px] font-bold transition shadow-sm"
                            >
                                <Target size={12} /> {dt.optimize_fixed_btn}
                            </button>
                            <button
                                onClick={() => handleOptimize(processedData, params, finParams)}
                                title={dt.optimize_btn}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold transition shadow-sm"
                            >
                                <Zap size={12} /> {dt.optimize_btn}
                            </button>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">{dt.bess_model}</label>
                                <select value={selectedBess} onChange={(e) => handleBessSelect(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500">
                                    {BESS_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.value === 'none' ? dt.bess_none : (opt.value === 'custom' ? dt.bess_custom : opt.label)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">{dt.bess_strategy}</label>
                                <select value={bessStrategy} onChange={(e) => setBessStrategy(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500">
                                    <option value="self-consumption">{dt.strat_self}</option>
                                    <option value="peak-shaving">{dt.strat_shaving}</option>
                                </select>
                            </div>
                        </div>

                        {selectedBess === 'custom' && (
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-bold text-slate-400 block">{dt.capacity}</label>
                                        <button
                                            onClick={() => handleSuggestBessSize(processedData)}
                                            className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                                        >
                                            <Wand2 size={10} /> {dt.suggest_btn}
                                        </button>
                                    </div>
                                    <input type="number" value={bessKwh} onChange={(e) => setBessKwh(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border border-slate-200 rounded text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 block mb-1">{dt.power}</label>
                                    <input type="number" value={bessMaxPower} onChange={(e) => setBessMaxPower(e.target.value === '' ? '' : Number(e.target.value))} className="w-full p-1.5 border border-slate-200 rounded text-xs font-bold outline-none focus:ring-1 focus:ring-emerald-500" />
                                </div>
                            </div>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer mt-1">
                            <div className="relative flex items-center">
                                <input type="checkbox" checked={isGridCharge} onChange={(e) => setIsGridCharge(e.target.checked)} className="peer sr-only" />
                                <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                            </div>
                            <span className="text-xs font-medium text-slate-600">{dt.grid_charge}</span>
                        </label>
                    </div>
                </div>

                {/* FINANCIAL & PRICING */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 min-h-[200px]">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Coins size={16} className="text-yellow-600" /> {dt.title_finance}
                    </h3>
                    <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 block">{dt.price_peak}</label>
                                <input type="number" value={params.pricePeak} onChange={(e) => setParams(p => ({ ...p, pricePeak: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-bold" />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 block">{dt.price_normal}</label>
                                <input type="number" value={params.priceNormal} onChange={(e) => setParams(p => ({ ...p, priceNormal: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-bold" />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 block">{dt.price_low}</label>
                                <input type="number" value={params.priceOffPeak} onChange={(e) => setParams(p => ({ ...p, priceOffPeak: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-bold" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 block">{dt.om_cost_capex}</label>
                                <input type="number" step="0.1" value={finParams.omPercent} onChange={(e) => setFinParams(p => ({ ...p, omPercent: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-bold" />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 block">{dt.inflation}</label>
                                <input type="number" step="0.1" value={finParams.escalation} onChange={(e) => setFinParams(p => ({ ...p, escalation: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-bold" />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
