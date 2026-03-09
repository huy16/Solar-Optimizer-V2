import { useEffect } from 'react';
import { Zap, RefreshCw, BatteryCharging, Coins, Settings, Wand2, Target, ChevronDown, ShieldCheck, HelpCircle } from 'lucide-react';
import { EVN_TARIFFS, TWO_PART_TARIFF, getTariffOptions, getVoltageLevelOptions, getTwoPartTariff } from '../../../data/evn_tariffs';
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
    enableTwoPartTariff, setEnableTwoPartTariff,
    peakShavingResult,
    lang,
    t,
    formatMoney
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
            tip_strategy: "Chọn cách hệ thống vận hành Pin lưu trữ: ưu tiên tiêu dùng nội bộ (Self-consumption) hoặc cắt giảm chi phí công suất đỉnh (Peak Shaving).",
            tip_grid_charge: "Cho phép Pin lưu trữ sạc từ lưới điện vào các khung giờ có giá thấp (Off-peak) để xả vào lúc giá cao hoặc giờ cao điểm."
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
            tip_strategy: "Choose the operating mode for BESS: prioritize self-consumption or shave peak demand to reduce capacity charges.",
            tip_grid_charge: "Allow the battery to charge from the grid during off-peak hours to discharge during high-price or peak hours."
        }
    }[lang];
    return (
        <div className="space-y-4">
            {/* MAIN LAYOUT GRID: 2x2 Grid with equal size cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* INVERTER SECTION */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 min-h-[200px]">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Zap size={16} className="text-amber-500" /> {dt.title_inverter}
                        </h4>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleMagicSuggest}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded text-[10px] font-bold transition shadow-sm group relative cursor-help"
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
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-[10px] font-bold transition shadow-sm group relative cursor-help"
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
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] font-bold transition shadow-sm group relative cursor-help"
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
                                        // Check for Ratio warnings if no strict tech warning
                                        (() => {
                                            const ratio = targetKwp / totalACPower;
                                            if (ratio > 1.45) {
                                                return (
                                                    <div className="text-[10px] flex items-center gap-1.5 p-1.5 rounded bg-orange-50 text-orange-600 border border-orange-100">
                                                        <ShieldCheck size={12} />
                                                        <span className="font-bold">
                                                            {lang === 'vi' ? `Lưu ý: DC/AC Ratio (${ratio.toFixed(2)}) đang khá CAO (Thiếu công suất Inverter)` : `Check: DC/AC Ratio (${ratio.toFixed(2)}) is HIGH (Undersized Inverter)`}
                                                        </span>
                                                    </div>
                                                );
                                            }
                                            if (ratio > 0 && ratio < 1.15) {
                                                return (
                                                    <div className="text-[10px] flex items-center gap-1.5 p-1.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                                                        <ShieldCheck size={12} />
                                                        <span className="font-bold">
                                                            {lang === 'vi' ? `Lưu ý: DC/AC Ratio (${ratio.toFixed(2)}) đang khá THẤP (Thừa công suất Inverter)` : `Check: DC/AC Ratio (${ratio.toFixed(2)}) is LOW (Oversized Inverter)`}
                                                        </span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()
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
                                    {lang === 'vi' ? 'Tỷ lệ giữa công suất Pin và Inverter. Mặc định 1.25 (Oversizing 25%). Tăng lên để tối ưu hiệu quả đầu tư, giảm xuống để tránh cắt ngọn (clipping).' : 'Ratio between panel DC power and inverter AC power. Default 1.25 (25% oversizing). Increase to optimize investment, decrease to avoid clipping.'}
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
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 min-h-[200px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <BatteryCharging size={18} className="text-emerald-500" /> {dt.title_bess}
                        </h4>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleOptimizeBess(processedData, params, finParams)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-[10px] font-bold transition shadow-sm group relative cursor-help"
                            >
                                <Target size={14} /> {dt.optimize_fixed_btn}
                                <div className="absolute top-full mt-2 left-0 w-48 p-2 bg-slate-800 text-white text-[9px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight whitespace-normal">
                                    {dt.tip_opt_bess_fixed}
                                    <div className="absolute bottom-full left-4 border-4 border-transparent border-b-slate-800"></div>
                                </div>
                            </button>
                            <button
                                onClick={() => handleOptimize(processedData, params, finParams)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-[10px] font-bold transition shadow-sm group relative cursor-help"
                            >
                                <Zap size={14} /> {dt.optimize_btn}
                                <div className="absolute top-full mt-2 right-0 w-48 p-2 bg-slate-800 text-white text-[9px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight whitespace-normal">
                                    {dt.tip_opt_all}
                                    <div className="absolute bottom-full right-4 border-4 border-transparent border-b-slate-800"></div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        {/* 1. CẤU HÌNH THIẾT BỊ LƯU TRỮ */}
                        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5">
                            <div className="flex items-center gap-2 mb-3 border-b border-slate-200/80 pb-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{lang === 'vi' ? '1. Cấu hình phần cứng' : '1. Hardware Config'}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 block mb-1.5">{dt.bess_model}</label>
                                    <select value={selectedBess} onChange={(e) => handleBessSelect(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm">
                                        {BESS_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.value === 'none' ? dt.bess_none : (opt.value === 'custom' ? dt.bess_custom : opt.label)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1.5 group relative cursor-help">
                                        {dt.bess_strategy} <HelpCircle size={10} className="text-slate-400" />
                                        <div className="absolute bottom-full mb-2 right-0 w-48 p-2 bg-slate-800 text-white text-[9px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight">
                                            {dt.tip_strategy}
                                            <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800"></div>
                                        </div>
                                    </label>
                                    <select value={bessStrategy} onChange={(e) => setBessStrategy(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm">
                                        <option value="self-consumption">{dt.strat_self}</option>
                                        <option value="peak-shaving">{dt.strat_shaving}</option>
                                    </select>
                                </div>
                            </div>

                            {selectedBess === 'custom' && (
                                <div className="grid grid-cols-2 gap-4 mt-3 animate-in fade-in slide-in-from-top-1">
                                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                                        <label className="text-[10px] font-bold text-slate-500">{dt.capacity}</label>
                                        <input
                                            type="number"
                                            value={bessKwh}
                                            onChange={(e) => setBessKwh(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="w-16 text-right text-xs font-black text-slate-700 outline-none bg-slate-50 rounded p-1 focus:ring-1 focus:ring-emerald-300"
                                        />
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                                        <label className="text-[10px] font-bold text-slate-500">{dt.power}</label>
                                        <input
                                            type="number"
                                            value={bessMaxPower}
                                            onChange={(e) => setBessMaxPower(e.target.value === '' ? '' : Number(e.target.value))}
                                            className="w-16 text-right text-xs font-black text-slate-700 outline-none bg-slate-50 rounded p-1 focus:ring-1 focus:ring-emerald-300"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. THAM SỐ VẬN HÀNH */}
                        {selectedBess !== 'none' && (
                            <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-3.5 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-2 mb-3 border-b border-blue-100 pb-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">{lang === 'vi' ? '2. Tham số vận hành' : '2. Operating Params'}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-3 rounded-lg border border-blue-100 flex justify-between items-center shadow-sm">
                                        <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 group relative cursor-help">
                                            {dt.bess_rt_eff} <HelpCircle size={10} className="text-slate-400" />
                                            <div className="absolute bottom-full mb-2 left-0 w-48 p-2 bg-slate-800 text-white text-[9px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight">
                                                {dt.tip_bess_eff}
                                                <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                                            </div>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={Math.round((techParams.bessEffRoundTrip || 0.90) * 100)}
                                                onChange={(e) => setTechParams(prev => ({ ...prev, bessEffRoundTrip: Number(e.target.value) / 100 }))}
                                                className="w-16 text-right text-xs font-black text-blue-600 outline-none bg-blue-50/50 rounded p-1 pr-4 focus:ring-1 focus:ring-blue-300"
                                            />
                                            <span className="absolute right-1.5 top-1.5 text-[8px] font-bold text-blue-400 select-none pointer-events-none">%</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-blue-100 flex justify-between items-center shadow-sm">
                                        <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 group relative cursor-help">
                                            {dt.bess_dod_limit} <HelpCircle size={10} className="text-slate-400" />
                                            <div className="absolute bottom-full mb-2 right-0 w-48 p-2 bg-slate-800 text-white text-[9px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight">
                                                {dt.tip_dod}
                                                <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800"></div>
                                            </div>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={Math.round((techParams.bessDod || 0.90) * 100)}
                                                onChange={(e) => setTechParams(prev => ({ ...prev, bessDod: Number(e.target.value) / 100 }))}
                                                className="w-16 text-right text-xs font-black text-blue-600 outline-none bg-blue-50/50 rounded p-1 pr-4 focus:ring-1 focus:ring-blue-300"
                                            />
                                            <span className="absolute right-1.5 top-1.5 text-[8px] font-bold text-blue-400 select-none pointer-events-none">%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                                    <label className="flex items-center gap-3 cursor-pointer w-fit">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" checked={isGridCharge} onChange={(e) => setIsGridCharge(e.target.checked)} className="peer sr-only" />
                                            <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 group relative cursor-help">
                                            {dt.grid_charge} <HelpCircle size={10} className="text-slate-400" />
                                            <div className="absolute bottom-full mb-2 left-0 w-48 p-2 bg-slate-800 text-white text-[9px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight">
                                                {dt.tip_grid_charge}
                                                <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                                            </div>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* 3. CƠ CHẾ GIÁ 2 THÀNH PHẦN */}
                        {selectedBess !== 'none' && bessKwh > 0 && (
                            <div className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-3.5 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center justify-between mb-3 border-b border-amber-200/50 pb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white">
                                            <Zap size={10} fill="currentColor" />
                                        </span>
                                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                                            {lang === 'vi' ? '3. Giá điện 2 Thành phần (Kịch bản)' : '3. 2-Part Tariff (Scenario)'}
                                        </span>
                                    </div>
                                    <label className="relative flex items-center cursor-pointer">
                                        <input type="checkbox" checked={enableTwoPartTariff || false} onChange={(e) => setEnableTwoPartTariff && setEnableTwoPartTariff(e.target.checked)} className="peer sr-only" />
                                        <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500"></div>
                                    </label>
                                </div>

                                {enableTwoPartTariff && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        {/* Validation check for manufacturing tariff */}
                                        {(!TWO_PART_TARIFF || !voltageLevel || !TWO_PART_TARIFF[voltageLevel]) ? (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                                                <p className="text-[10px] font-bold text-red-600 flex items-center justify-center gap-1.5"><ShieldCheck size={14} /> {lang === 'vi' ? 'Giá 2 thành phần chỉ hỗ trợ Biểu giá Sản xuất' : '2-Part Tariff only supports Manufacturing tariff'}</p>
                                                <p className="text-[9px] text-red-500 mt-1">{lang === 'vi' ? `Vui lòng xuống mục "${dt.title_finance}" chọn loại biểu giá "Sản xuất" để sử dụng.` : `Please go to "${dt.title_finance}" section and select a Manufacturing tariff.`}</p>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-[10px] text-amber-700/80 font-bold bg-amber-100/50 w-fit px-2 py-0.5 rounded group relative cursor-help">
                                                    TC = Cp × Pmax + Ca × Ap
                                                    <div className="absolute bottom-full mb-2 left-0 w-56 p-2 bg-slate-800 text-white text-[9px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight">
                                                        {lang === 'vi' ? 'Tổng chi phí = Giá công suất × Công suất đỉnh + Giá điện năng × Sản lượng tiêu thụ' : 'Total Cost = Demand Charge × Peak Demand + Energy Charge × Energy Consumed'}
                                                        <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                                                    </div>
                                                </p>

                                                {/* Tariff rates */}
                                                <div className="grid grid-cols-4 gap-2">
                                                    <div className="bg-white rounded-lg p-2 text-center border border-amber-200 shadow-sm relative overflow-visible group cursor-help">
                                                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-44 p-2 bg-slate-800 text-white text-[9px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight text-center">
                                                            {lang === 'vi' ? 'Giá công suất hàng tháng, tính theo kW đỉnh đo được' : 'Monthly demand charge based on measured peak kW'}
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                        </div>
                                                        <p className="text-[8px] text-amber-600 font-bold uppercase tracking-wider mt-1">{lang === 'vi' ? 'CÔNG SUẤT (Cp)' : 'DEMAND (Cp)'}</p>
                                                        <p className="text-xs font-black text-amber-900 mt-0.5">{new Intl.NumberFormat().format(TWO_PART_TARIFF[voltageLevel].cp)}</p>
                                                        <p className="text-[7px] text-amber-500/80 font-medium">đ/kW/{lang === 'vi' ? 'tháng' : 'mo'}</p>
                                                    </div>
                                                    <div className="bg-white rounded-lg p-2 text-center border border-slate-200 shadow-sm relative overflow-visible group cursor-help">
                                                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-44 p-2 bg-slate-800 text-white text-[9px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight text-center">
                                                            {lang === 'vi' ? 'Giá điện năng khung giờ cao điểm (9:30-11:30, 17:00-20:00)' : 'Energy rate during peak hours (9:30-11:30, 17:00-20:00)'}
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                        </div>
                                                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1">{lang === 'vi' ? 'Đ.NĂNG CAO' : 'PEAK Ca'}</p>
                                                        <p className="text-xs font-black text-slate-800 mt-0.5">{new Intl.NumberFormat().format(TWO_PART_TARIFF[voltageLevel].peak)}</p>
                                                        <p className="text-[7px] text-slate-400 font-medium">đ/kWh</p>
                                                    </div>
                                                    <div className="bg-white rounded-lg p-2 text-center border border-slate-200 shadow-sm relative overflow-visible group cursor-help">
                                                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-44 p-2 bg-slate-800 text-white text-[9px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight text-center">
                                                            {lang === 'vi' ? 'Giá điện năng khung giờ bình thường (còn lại trong ngày)' : 'Energy rate during normal hours (remaining daytime)'}
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                        </div>
                                                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1">{lang === 'vi' ? 'Đ.NĂNG B.THƯỜNG' : 'NORMAL Ca'}</p>
                                                        <p className="text-xs font-black text-slate-800 mt-0.5">{new Intl.NumberFormat().format(TWO_PART_TARIFF[voltageLevel].normal)}</p>
                                                        <p className="text-[7px] text-slate-400 font-medium">đ/kWh</p>
                                                    </div>
                                                    <div className="bg-white rounded-lg p-2 text-center border border-slate-200 shadow-sm relative overflow-visible group cursor-help">
                                                        <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-44 p-2 bg-slate-800 text-white text-[9px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight text-center">
                                                            {lang === 'vi' ? 'Giá điện năng khung giờ thấp điểm (22:00-4:00)' : 'Energy rate during off-peak hours (22:00-4:00)'}
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                        </div>
                                                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1">{lang === 'vi' ? 'Đ.NĂNG THẤP' : 'OFF.P Ca'}</p>
                                                        <p className="text-xs font-black text-slate-800 mt-0.5">{new Intl.NumberFormat().format(TWO_PART_TARIFF[voltageLevel].offPeak)}</p>
                                                        <p className="text-[7px] text-slate-400 font-medium">đ/kWh</p>
                                                    </div>
                                                </div>

                                                {/* Peak Shaving Results */}
                                                {peakShavingResult ? (
                                                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-amber-200/50">
                                                        <div className="bg-white rounded-lg p-2.5 text-center border border-slate-200 shadow-sm group relative cursor-help">
                                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 p-2 bg-slate-800 text-white text-[9px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight text-center">
                                                                {lang === 'vi' ? 'Công suất tiêu thụ đỉnh (kW) cao nhất đo được từ lưới điện. Đây là giá trị điện lực dùng để tính phí công suất Cp hàng tháng.' : 'Maximum peak demand (kW) measured from the grid. This value is used by the utility to calculate the monthly demand charge Cp.'}
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                            </div>
                                                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Pmax {lang === 'vi' ? 'Gốc' : 'Before'}</p>
                                                            <p className="text-[16px] font-black text-slate-800 leading-tight my-0.5">{peakShavingResult.pmaxBefore}</p>
                                                            <p className="text-[8px] font-bold text-slate-400">kW</p>
                                                        </div>
                                                        <div className="bg-emerald-50 rounded-lg p-2.5 text-center border border-emerald-200 shadow-sm relative group cursor-help">
                                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 p-2 bg-slate-800 text-white text-[9px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight text-center">
                                                                {lang === 'vi' ? 'Công suất đỉnh sau khi BESS xả điện vào giờ cao điểm để san phẳng phụ tải. BESS dung lượng lớn hơn cắt được nhiều hơn, nhưng hiệu quả kinh tế giảm dần khi đỉnh đã san phẳng.' : 'Peak demand after BESS discharges during peak hours to flatten the load curve. Larger BESS cuts more, but economic efficiency diminishes as the peak flattens.'}
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                            </div>
                                                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-slate-300">
                                                                <Zap size={10} className="fill-current" />
                                                            </div>
                                                            <p className="text-[8px] text-emerald-700 font-bold uppercase tracking-wider">Pmax {lang === 'vi' ? 'Sau BESS' : 'After BESS'}</p>
                                                            <p className="text-[16px] font-black text-emerald-600 leading-tight my-0.5">{peakShavingResult.pmaxAfter}</p>
                                                            <p className="text-[8px] font-bold text-emerald-500 bg-emerald-100/50 rounded inline-block px-1">↓ {peakShavingResult.annualDemandReduction} kW</p>
                                                        </div>
                                                        <div className="bg-amber-100/50 rounded-lg p-2.5 text-center border-2 border-amber-300 shadow-sm relative group cursor-help">
                                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 p-2 bg-slate-800 text-white text-[9px] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case leading-tight text-center">
                                                                {lang === 'vi' ? 'Tiền tiết kiệm hàng năm từ việc giảm phí công suất. Công thức: (Pmax gốc − Pmax sau BESS) × Cp × 12 tháng. Đây chỉ là phần tiết kiệm Cp, chưa tính tiết kiệm điện năng.' : 'Annual savings from demand charge reduction. Formula: (Pmax before − Pmax after BESS) × Cp × 12 months. This is only the demand charge savings, not including energy savings.'}
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                            </div>
                                                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-slate-300">
                                                                <div className="w-1.5 h-px bg-slate-300"></div>
                                                            </div>
                                                            <p className="text-[8px] text-amber-800 font-bold uppercase tracking-wider">{lang === 'vi' ? 'Tiết kiệm Cp/Năm' : 'Demand Save/Yr'}</p>
                                                            <p className="text-sm font-black text-amber-600 my-0.5">
                                                                {formatMoney ? formatMoney(peakShavingResult.annualDemandReduction * TWO_PART_TARIFF[voltageLevel].cp * 12) : new Intl.NumberFormat().format(peakShavingResult.annualDemandReduction * TWO_PART_TARIFF[voltageLevel].cp * 12)}
                                                            </p>
                                                            <p className="text-[8px] font-bold text-amber-500">VNĐ</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4 bg-white/50 rounded-lg border border-amber-100 border-dashed">
                                                        <RefreshCw size={14} className="animate-spin text-amber-400 mx-auto mb-1" />
                                                        <span className="text-[9px] font-medium text-amber-600">{lang === 'vi' ? 'Hệ thống đang mô phỏng Peak Shaving...' : 'Simulating Peak Shaving...'}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
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
