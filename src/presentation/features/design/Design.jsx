import { useEffect } from 'react';
import { Zap, RefreshCw, BatteryCharging, Coins, Settings, Wand2, Target, ChevronDown, ShieldCheck, HelpCircle } from 'lucide-react';
import { EVN_TARIFFS, getTariffOptions, getVoltageLevelOptions } from '../../../data/evn_tariffs';
import { execute as verifyTechnicalConfig } from '../../../domain/usecases/VerifyTechnicalConfig';
import { INVERTER_DB, PANEL_SPECS } from '../../../data/sources/HardwareDatabase';

export const Design = ({
    inv1Id, setInv1Id,
    inv1Qty, setInv1Qty,
    inv2Id, setInv2Id,
    inv2Qty, setInv2Qty,
    customInv1Power, setCustomInv1Power,
    customInv2Power, setCustomInv2Power,
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
    handleSuggestSafeCapacity,
    isGridCharge, setIsGridCharge,
    bessStrategy, setBessStrategy,
    handleOptimize,
    handleOptimizeNoBess,
    handleOptimizeBess,
    processedData,
    params, setParams,
    finParams, setFinParams,
    tariffCategory, setTariffCategory,
    voltageLevel, setVoltageLevel,
    lang,
    t
}) => {
    // Auto-update prices when tariff or voltage level changes
    useEffect(() => {
        if (!tariffCategory) return;

        const tariff = EVN_TARIFFS[tariffCategory];
        if (tariff) {
            // If voltageLevel is missing or not in the current tariff category, 
            // auto-select the first available one to prevent empty selection
            const isValidLevel = tariff.voltage_levels.some(v => v.id === voltageLevel);

            if (!voltageLevel || !isValidLevel) {
                if (tariff.voltage_levels.length > 0) {
                    const firstLevel = tariff.voltage_levels[0];
                    setVoltageLevel(firstLevel.id);
                    setParams(p => ({
                        ...p,
                        pricePeak: firstLevel.prices.peak,
                        priceNormal: firstLevel.prices.normal,
                        priceOffPeak: firstLevel.prices.off_peak
                    }));
                }
                return;
            }

            // Normal update when valid level exists
            const level = tariff.voltage_levels.find(v => v.id === voltageLevel);
            if (level && level.prices) {
                setParams(p => ({
                    ...p,
                    pricePeak: level.prices.peak,
                    priceNormal: level.prices.normal,
                    priceOffPeak: level.prices.off_peak
                }));
            }
        }
    }, [tariffCategory, voltageLevel, setVoltageLevel, setParams]);

    const dt = {
        vi: {
            title_inverter: "Cấu hình Inverter",
            auto_select: "Tự động chọn Inverter theo DC/AC ~ 1.25",
            main_machine: "MÁY CHÍNH",
            sub_machine: "MÁY PHỤ (TÙY CHỌN)",
            none: "-- Không --",
            qty: "SL",
            ac_sync_msg: "Công suất AC tối đa được đồng bộ theo cấu hình Inverter",
            title_bess: "Lưu trữ năng lượng",
            bess_model: "MODEL PIN LƯU TRỮ",
            capacity: "DUNG LƯỢNG (kWh)",
            suggest_btn: "Gợi ý",
            power: "CÔNG SUẤT (kW)",
            grid_charge: "Cho phép sạc lưới (Giờ thấp điểm)",
            title_finance: "Giả định Giá điện & O&M",
            price_peak: "GIÁ CAO ĐIỂM",
            price_normal: "BÌNH THƯỜNG",
            price_low: "THẤP ĐIỂM",
            tariff_category: "LOẠI BIỂU GIÁ",
            retail_group: "GIÁ BÁN LẺ",
            wholesale_group: "GIÁ BÁN BUÔN",
            voltage_level: "CẤP ĐIỆN ÁP",
            om_cost_capex: "CHI PHÍ O&M (% Capex)",
            inflation: "LẠM PHÁT ĐIỆN (%/Năm)",
            title_tech: "Tham số Kỹ thuật & Tổn thất",
            export_price: "GIÁ BÁN ĐIỆN DƯ (VNĐ)",
            total_derate: "Total Derate",
            bess_strategy: "CHIẾN LƯỢC XẢ PIN",
            strat_self: "Tự dùng (Tiêu thụ tại chỗ)",
            strat_shaving: "Cắt giảm cao điểm",
            optimize_btn: "Tự động tối ưu",
            optimize_fixed_btn: "Tối ưu theo CS chọn",
            magic_btn: "Tính toán Thông minh",
            optimize_no_bess: "Tối ưu (Không lưu trữ)",
            bess_none: "Không dùng",
            bess_custom: "Tùy chỉnh",
            custom_inv: "Tùy chỉnh",
            power_per_unit: "CÔNG SUẤT MỖI MÁY (kW)",
            expert_suggest_btn: "Gợi ý Chuyên gia (Safe Fit)",
            tip_dc_ac: "Tỷ lệ DC/AC > 1 giúp tối ưu hiệu quả đầu tư, tận dụng công suất phát khi nắng yếu.",
            tip_bess_eff: "Hiệu suất nạp/xả khứ hồi. Ví dụ: Nạp 10kWh, lấy ra được 9kWh = 90%.",
            tip_dod: "Mức xả sâu tối đa cho phép để bảo vệ tuổi thọ pin. DoD 90% = Chỉ xả 90% dung lượng.",
            tip_magic: "Tự chọn Inverter phù hợp (DC/AC ~ 1.25) và gợi ý Pin lưu trữ cơ bản (~20% công suất hệ mặt trời).",
            tip_expert: "Tính toán theo tải thực tế thấp nhất (tháng thấp nhất, giờ nắng đỉnh 11-13h) để đảm bảo hệ thống không bị thừa điện, ngay cả khi không có Pin.",
            tip_opt_no_bess: "Tự động quét và chọn quy mô lắp đặt mặt trời mang lại hiệu quả kinh tế (NPV/IRR) cao nhất mà không cần lắp Pin lưu trữ.",
            tip_opt_bess_fixed: "Giữ nguyên công suất mặt trời hiện tại, chỉ tìm quy mô Pin lưu trữ (kWh) tối ưu nhất về mặt tài chính.",
            tip_opt_all: "Tự động tìm kiếm sự kết hợp hoàn hảo giữa công suất mặt trời và Pin lưu trữ để đạt lợi nhuận cao nhất.",
            dc_ac_ratio: "Tỷ lệ DC/AC (Oversizing)",
            weather_derate: "Hệ số Thời tiết (%)",
            bess_rt_eff: "Hiệu suất (RT) %",
            bess_dod_limit: "DoD Giới hạn %",
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
            tariff_category: "TARIFF CATEGORY",
            retail_group: "RETAIL PRICE",
            wholesale_group: "WHOLESALE PRICE",
            voltage_level: "VOLTAGE LEVEL",
            om_cost_capex: "O&M COST (% Capex)",
            inflation: "ESCALATION (%/Year)",
            title_tech: "Technical Params & Losses",
            export_price: "GRID FEED-IN PRICE (VND)",
            total_derate: "Total Derate",
            bess_strategy: "DISCHARGE STRATEGY",
            strat_self: "Self-consumption",
            strat_shaving: "Peak Shaving",
            optimize_btn: "Auto Optimize",
            optimize_fixed_btn: "Optimize by Selection",
            magic_btn: "Smart Suggest",
            optimize_no_bess: "Optimize (No BESS)",
            bess_none: "None",
            bess_custom: "Custom",
            custom_inv: "Custom Size",
            power_per_unit: "POWER PER UNIT (kW)",
            expert_suggest_btn: "Expert Suggest (Safe Fit)",
            tip_dc_ac: "DC/AC ratio > 1 optimizes investment by utilizing generation during low irradiation conditions.",
            tip_bess_eff: "Round-trip efficiency. E.g., Charge 10kWh, discharge 9kWh = 90%.",
            tip_dod: "Depth of Discharge: Max percentage of battery capacity that can be discharged to protect battery life.",
            tip_magic: "Auto-select matching Inverter (DC/AC ~ 1.25) and suggest basic BESS (~20% of solar capacity).",
            tip_expert: "Calculates based on lowest actual load (min month, peak sun 11-13h) to ensure zero energy waste, even without batteries.",
            tip_opt_no_bess: "Automatically scans and selects the solar capacity that yields the highest financial return (NPV/IRR) without BESS.",
            tip_opt_bess_fixed: "Keeps current solar capacity fixed, and only finds the most financially optimal BESS size (kWh).",
            tip_opt_all: "Automatically searches for the perfect combination of solar and storage capacity for maximum profitability.",
            dc_ac_ratio: "DC/AC Ratio (Oversizing)",
            weather_derate: "Weather Derate (%)",
            bess_rt_eff: "Round-trip Eff. (RT) %",
            bess_dod_limit: "DoD Limit %",
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
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold transition shadow-sm group relative cursor-help"
                            >
                                <Wand2 size={12} />
                                <span>{dt.magic_btn}</span>
                                <div className="absolute top-full mt-2 left-0 w-48 p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight whitespace-normal">
                                    {dt.tip_magic}
                                    <div className="absolute bottom-full left-4 border-4 border-transparent border-b-slate-800"></div>
                                </div>
                            </button>
                            <button
                                onClick={() => handleSuggestSafeCapacity(processedData)}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[10px] font-bold transition shadow-sm group relative cursor-help"
                            >
                                <ShieldCheck size={12} />
                                <span>{dt.expert_suggest_btn}</span>
                                <div className="absolute top-full mt-2 left-0 w-48 p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight whitespace-normal">
                                    {dt.tip_expert}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800"></div>
                                </div>
                            </button>
                            <button
                                onClick={() => handleOptimizeNoBess(processedData, params, finParams)}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition shadow-sm group relative cursor-help"
                            >
                                <Target size={12} />
                                <span>{dt.optimize_no_bess}</span>
                                <div className="absolute top-full mt-2 right-0 w-48 p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight whitespace-normal">
                                    {dt.tip_opt_no_bess}
                                    <div className="absolute bottom-full right-4 border-4 border-transparent border-b-slate-800"></div>
                                </div>
                            </button>
                            <div className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-500 font-medium whitespace-nowrap group relative cursor-help">
                                <span>DC/AC: {totalACPower > 0 ? (targetKwp / totalACPower).toFixed(2) : 'N/A'}</span>
                                <div className="absolute top-full mt-2 right-0 w-48 p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight whitespace-normal">
                                    {dt.tip_dc_ac}
                                    <div className="absolute bottom-full right-4 border-4 border-transparent border-b-slate-800"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
                        {/* MAIN INVERTER */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 block mb-1">{dt.main_machine}</label>
                                    <select value={inv1Id} onChange={(e) => setInv1Id(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500">
                                        <option value="custom" className="font-bold text-blue-600">{dt.custom_inv}</option>
                                        <option disabled>──────────</option>
                                        {INVERTER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div className="w-16">
                                    <label className="text-[10px] font-bold text-slate-400 block mb-1 text-center">{dt.qty}</label>
                                    <input type="number" min="0" value={inv1Qty} onChange={(e) => setInv1Qty(Number(e.target.value))} className="w-full p-1.5 border border-slate-300 rounded bg-white text-center text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>
                            </div>
                            {inv1Id === 'custom' && (
                                <div>
                                    <label className="text-[10px] font-bold text-blue-500 block mb-1">{dt.power_per_unit}</label>
                                    <input type="number" min="0" value={customInv1Power} onChange={(e) => setCustomInv1Power(Number(e.target.value))} className="w-full p-1.5 border border-blue-300 rounded bg-blue-50 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>
                            )}
                        </div>

                        {/* SECONDARY INVERTER */}
                        <div className="space-y-2 pt-2 border-t border-slate-200">
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 block mb-1">{dt.sub_machine}</label>
                                    <select value={inv2Id} onChange={(e) => setInv2Id(e.target.value)} className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-semibold outline-none focus:ring-1 focus:ring-blue-500">
                                        <option value="">{dt.none}</option>
                                        <option value="custom" className="font-bold text-blue-600">{dt.custom_inv}</option>
                                        <option disabled>──────────</option>
                                        {INVERTER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                                <div className="w-16">
                                    <label className="text-[10px] font-bold text-slate-400 block mb-1 text-center">{dt.qty}</label>
                                    <input type="number" min="0" value={inv2Qty} onChange={(e) => setInv2Qty(Number(e.target.value))} className="w-full p-1.5 border border-slate-300 rounded bg-white text-center text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>
                            </div>
                            {inv2Id === 'custom' && (
                                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                    <label className="text-[10px] font-bold text-blue-500 block mb-1">{dt.power_per_unit}</label>
                                    <input type="number" min="0" value={customInv2Power} onChange={(e) => setCustomInv2Power(Number(e.target.value))} className="w-full p-1.5 border border-blue-300 rounded bg-blue-50 text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>
                            )}
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 italic">
                            <span>{dt.ac_sync_msg} ({new Intl.NumberFormat('vi-VN').format(totalACPower)} kW)</span>
                        </div>

                        {/* TECHNICAL VALIDATION WARNINGS */}
                        {(() => {
                            const selectedInv = INVERTER_DB.find(i => i.id === inv1Id);
                            const validation = verifyTechnicalConfig(selectedInv, PANEL_SPECS, {
                                totalPanels: Math.ceil((targetKwp * 1000) / PANEL_SPECS.power), // Estimate panels based on kWp
                                inverterQty: inv1Qty
                            });

                            // DEBUG:
                            // console.log('Validation:', validation);

                            return (
                                <div className="mt-2 space-y-1">
                                    {/* DEBUG INFO - REMOVE LATER */}
                                    {/* <div className="text-[9px] text-gray-400">
                                        Panels: {Math.ceil((targetKwp * 1000) / PANEL_SPECS.power)} | 
                                        InvQty: {inv1Qty} | 
                                        Valid: {validation.isValid ? 'Yes' : 'No'} | 
                                        Warns: {validation.warnings.length}
                                    </div> */}

                                    {validation.warnings.length > 0 ? (
                                        validation.warnings.map((w, idx) => (
                                            <div key={idx} className={`text-[10px] flex items-center gap-1.5 p-1.5 rounded ${w.level === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                <ShieldCheck size={12} />
                                                <span className="font-bold">{w.msg}</span>
                                            </div>
                                        ))
                                    ) : (
                                        // Force show if high ratio but no warning (sanity check)
                                        (targetKwp / totalACPower > 1.5) && (
                                            <div className="text-[10px] flex items-center gap-1.5 p-1.5 rounded bg-orange-50 text-orange-600 border border-orange-100">
                                                <ShieldCheck size={12} />
                                                <span className="font-bold">Check: Ratio {(targetKwp / totalACPower).toFixed(2)} is High</span>
                                            </div>
                                        )
                                    )}
                                </div>
                            );
                        })()}
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
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
                            <label className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1 group relative cursor-help">
                                {dt.dc_ac_ratio} <HelpCircle size={8} />
                                <div className="absolute bottom-full mb-2 left-0 w-48 p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight">
                                    Tỷ lệ giữa công suất Pin và Inverter. Mặc định 1.25 (Oversizing 25%). Tăng lên để tối ưu hiệu quả đầu tư, giảm xuống để tránh cắt ngọn (clipping).
                                    <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                                </div>
                            </label>
                            <input
                                type="number"
                                step="0.05"
                                min="1.0"
                                max="2.0"
                                value={techParams.oversizingRatio || 1.25}
                                onChange={(e) => setTechParams(prev => ({ ...prev, oversizingRatio: Number(e.target.value) }))}
                                className="w-16 p-1 border border-slate-300 rounded text-right text-xs font-bold text-slate-600 outline-none focus:border-blue-500"
                            />
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
                            <label className="text-[9px] font-bold text-blue-500 block">{dt.weather_derate}</label>
                            <div className="relative w-20">
                                <input
                                    type="number"
                                    min="0" max="100"
                                    value={Math.round(techParams.weatherDerate * 100)}
                                    onChange={(e) => setTechParams(prev => ({ ...prev, weatherDerate: Number(e.target.value) / 100 }))}
                                    className="w-full p-1 pr-5 border border-blue-200 rounded text-right text-xs font-bold text-blue-600 outline-none"
                                />
                                <span className="absolute right-1.5 top-1.5 text-[9px] text-slate-400 select-none">%</span>
                            </div>
                        </div>
                        <div className="text-right text-[10px] font-bold text-slate-400 mt-1">
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
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded text-[10px] font-bold transition shadow-sm group relative cursor-help"
                            >
                                <Target size={12} /> {dt.optimize_fixed_btn}
                                <div className="absolute top-full mt-2 left-0 w-48 p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight whitespace-normal">
                                    {dt.tip_opt_bess_fixed}
                                    <div className="absolute bottom-full left-4 border-4 border-transparent border-b-slate-800"></div>
                                </div>
                            </button>
                            <button
                                onClick={() => handleOptimize(processedData, params, finParams)}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold transition shadow-sm group relative cursor-help"
                            >
                                <Zap size={12} /> {dt.optimize_btn}
                                <div className="absolute top-full mt-2 right-0 w-48 p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight whitespace-normal">
                                    {dt.tip_opt_all}
                                    <div className="absolute bottom-full right-4 border-4 border-transparent border-b-slate-800"></div>
                                </div>
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

                        {/* BESS Advanced Params */}
                        {selectedBess !== 'none' && (
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                                <div className="flex justify-between items-center bg-white p-1.5 px-2 rounded border border-slate-200">
                                    <label className="text-[9px] font-bold text-slate-500 flex items-center gap-1 group relative cursor-help">
                                        {dt.bess_rt_eff} <HelpCircle size={8} />
                                        <div className="absolute bottom-full mb-2 left-0 w-40 p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight">
                                            {dt.tip_bess_eff}
                                            <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                                        </div>
                                    </label>
                                    <input
                                        type="number"
                                        value={Math.round((techParams.bessEffRoundTrip || 0.90) * 100)}
                                        onChange={(e) => setTechParams(prev => ({ ...prev, bessEffRoundTrip: Number(e.target.value) / 100 }))}
                                        className="w-12 text-right text-[10px] font-bold text-emerald-600 outline-none border-b border-emerald-100 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="flex justify-between items-center bg-white p-1.5 px-2 rounded border border-slate-200">
                                    <label className="text-[9px] font-bold text-slate-500 flex items-center gap-1 group relative cursor-help">
                                        {dt.bess_dod_limit} <HelpCircle size={8} />
                                        <div className="absolute bottom-full mb-2 right-0 w-40 p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight">
                                            {dt.tip_dod}
                                            <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800"></div>
                                        </div>
                                    </label>
                                    <input
                                        type="number"
                                        value={Math.round((techParams.bessDod || 0.90) * 100)}
                                        onChange={(e) => setTechParams(prev => ({ ...prev, bessDod: Number(e.target.value) / 100 }))}
                                        className="w-12 text-right text-[10px] font-bold text-emerald-600 outline-none border-b border-emerald-100 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        )}

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
                        {/* Tariff Category & Voltage Level Selectors */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase">{dt.tariff_category}</label>
                                <div className="relative">
                                    <select
                                        value={tariffCategory || 'retail_manufacturing'}
                                        onChange={(e) => {
                                            const newCategory = e.target.value;
                                            setTariffCategory(newCategory);
                                            // Auto-select first voltage level and update prices
                                            const tariff = EVN_TARIFFS[newCategory];
                                            if (tariff && tariff.voltage_levels.length > 0) {
                                                const firstLevel = tariff.voltage_levels[0];
                                                setVoltageLevel(firstLevel.id);
                                                setParams(p => ({
                                                    ...p,
                                                    pricePeak: firstLevel.prices.peak,
                                                    priceNormal: firstLevel.prices.normal,
                                                    priceOffPeak: firstLevel.prices.off_peak
                                                }));
                                            }
                                        }}
                                        className="w-full pl-3 pr-8 py-1.5 border border-slate-300 rounded bg-white text-xs font-semibold outline-none focus:ring-1 focus:ring-yellow-500 appearance-none"
                                    >
                                        <optgroup label={dt.retail_group}>
                                            {getTariffOptions(lang).retail.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label={dt.wholesale_group}>
                                            {getTariffOptions(lang).wholesale.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold text-slate-500 uppercase">{dt.voltage_level}</label>
                                <select
                                    value={voltageLevel || ''}
                                    onChange={(e) => {
                                        const newLevel = e.target.value;
                                        setVoltageLevel(newLevel);
                                        // Update prices based on selected voltage level
                                        const tariff = EVN_TARIFFS[tariffCategory || 'retail_manufacturing'];
                                        if (tariff) {
                                            const level = tariff.voltage_levels.find(v => v.id === newLevel);
                                            if (level) {
                                                setParams(p => ({
                                                    ...p,
                                                    pricePeak: level.prices.peak,
                                                    priceNormal: level.prices.normal,
                                                    priceOffPeak: level.prices.off_peak
                                                }));
                                            }
                                        }
                                    }}
                                    className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-semibold outline-none focus:ring-1 focus:ring-yellow-500"
                                >
                                    {getVoltageLevelOptions(tariffCategory || 'retail_manufacturing', lang).map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 block uppercase">{dt.price_peak}</label>
                                <input type="number" value={params.pricePeak} onChange={(e) => setParams(p => ({ ...p, pricePeak: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1 border border-slate-300 rounded bg-white text-xs text-center" />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 block uppercase">{dt.price_normal}</label>
                                <input type="number" value={params.priceNormal} onChange={(e) => setParams(p => ({ ...p, priceNormal: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1 border border-slate-300 rounded bg-white text-xs text-center" />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 block uppercase">{dt.price_low}</label>
                                <input type="number" value={params.priceOffPeak} onChange={(e) => setParams(p => ({ ...p, priceOffPeak: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1 border border-slate-300 rounded bg-white text-xs text-center" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 block uppercase">{dt.om_cost_capex}</label>
                                <input type="number" step="0.1" value={finParams.omPercent} onChange={(e) => setFinParams(p => ({ ...p, omPercent: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1 border border-slate-300 rounded bg-white text-xs text-center" />
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 block uppercase">{dt.inflation}</label>
                                <input type="number" step="0.1" value={finParams.escalation} onChange={(e) => setFinParams(p => ({ ...p, escalation: e.target.value === '' ? '' : Number(e.target.value) }))} className="w-full p-1 border border-slate-300 rounded bg-white text-xs text-center" />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
