import React, { useState } from 'react';
import { Coins, AlertCircle, Wallet, DollarSign, ChevronDown, ChevronUp, BarChart2, HelpCircle, Settings, X, Wrench } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ReferenceLine, Bar, Cell, Line } from 'recharts';

export const Finance = ({
    finParams, setFinParams,
    bessKwh,
    currentFinance,
    formatMoney,
    scenarios,
    targetKwp, setTargetKwp,
    params, setParams,
    onSelectScenario,
    lang
}) => {
    const dt = {
        vi: {
            title_finance: "Bản đồ Tài chính Dự án",
            cycle: "VÒNG ĐỜI",
            escalation: "LẠM PHÁT ĐIỆN",
            degradation: "SUY HAO PV",
            discount: "LÃI CHIẾT KHẤU",
            om: "CHI PHÍ O&M",
            battery_life: "TUỔI THỌ PIN",
            major_repair_title: "SỬA CHỮA LỚN",
            major_repair_add: "+ Thêm đợt sửa chữa",
            major_repair_event_label: "Đợt #",
            major_repair_year: "Năm",
            carbon_credit: "TÍN CHỈ CARBON",
            exchange_rate: "TỶ GIÁ USD/VND",
            no_battery_msg: "Chưa có Pin (0 kWh). Phí thay pin sẽ không tính.",
            om_schedule_title: "CHI PHÍ O&M BỔ SUNG",
            om_year: "Năm",
            om_amount: "Số tiền",
            om_add: "+ Bổ sung chi phí",
            total_capex_manual: "Cấu hình Vốn đầu tư",
            auto_calc_placeholder: "Tự động tính...",
            manual_override_msg: "* Nhập số để ghi đè giá trị tính toán tự động",
            tax_rate: "THUẾ TNDN",
            depreciation: "KHẤU HAO",
            insurance: "BẢO HIỂM",
            title_loan: "Cấu hình Vay vốn",
            loan_ratio: "TỶ LỆ VAY",
            equity: "Vốn tự có",
            interest_rate: "LÃI SUẤT",
            loan_term: "THỜI HẠN",
            no_lever_msg: "Không sử dụng đòn bẩy tài chính",
            cashflow_chart_title: "Biểu đồ Dòng tiền (VND)",
            net_flow: "Dòng tiền ròng",
            accumulated: "Tích lũy",
            year: "Năm",
            year_0: "Đầu tư (Năm 0)",
            revenue: "Doanh thu (Tiết kiệm)",
            om_cost: "Chi phí O&M",
            replacement: "Thay thế Thiết bị",
            legend_net_flow: "Dòng tiền ròng trong năm",
            legend_acc_invest: "Vốn đầu tư ban đầu",
            legend_acc_recover: "Đang thu hồi vốn",
            legend_acc_profit: "Đã sinh lời",
            analysis_title: "Phân tích Hiệu quả Đầu tư",
            analysis_desc: "So sánh các chỉ số tài chính nâng cao (NPV, ROI, IRR) dựa trên các kịch bản công suất.",
            col_scenario: "Kịch bản",
            col_capacity: "Công suất",
            col_capex: "Vốn (CAPEX) (VND)",
            col_saving: "Tiết kiệm (Năm 1) (VND)",
            col_npv: "NPV (VND)",
            col_irr: "IRR",
            col_payback: "Hoàn vốn",
            btn_select: "Chọn",
            unit_year: "Năm",
            unit_percent_year: "%/Năm",
            unit_vnd_kwp: "đ/kWp",
            unit_vnd_kwh: "đ/kWh",
            unit_exchange: "đ/$",
            unit_vnd: "VNĐ",
            system_price: "SUẤT ĐẦU TƯ SOLAR",
            bess_price: "SUẤT ĐẦU TƯ BESS",
            co2_factor: "HỆ SỐ CO2",
            inverter_life: "TUỔI THỌ INVERTER",
            inverter_replace_cost: "CHI PHÍ THAY THẾ INVERTER",
            col_lcoe: "LCOE (VNĐ/kWh)",
            tip_capex: "Tổng mức đầu tư ban đầu\n= {Công suất × Giá Solar} + {Dung lượng × Giá BESS}",
            tip_saving: "Tiền tiết kiệm năm 1\n= (Sản lượng tiết kiệm × Giá điện lưới) + (Sản lượng dư thừa × Giá xuất lưới)",
            tip_lcoe: "LCOE\n= Phân bổ ròng Tổng chi phí (Đầu tư + Vận hành + Lãi vay) / Phân bổ ròng Sản lượng điện (Suốt vòng đời)",
            tip_npv: "Giá trị Hiện tại Ròng (NPV)\n= Tổng {Dòng tiền ròng t / (1 + Lãi chiết khấu)^t} - Vốn tự có",
            tip_irr: "Tỷ suất Hoàn vốn Nội bộ (IRR)\n= Mức Lãi chiết khấu làm cho NPV bằng 0",
            tip_payback: "Thời gian hoàn vốn\n= Năm(t) khi Dòng tiền tích lũy >= 0 (Tức bồi hoàn toàn bộ mức đầu tư + Lãi tài trợ)",
            tip_discount: "Lãi chiết khấu (r)\n= Tỷ suất sinh lời kỳ vọng hoặc Lãi suất phi rủi ro + Phần bù rủi ro (thường 8-12%)",
            tip_carbon: "Giá bán tín chỉ Carbon\n= Doanh thu từ việc giảm phát thải CO2 (thường $5-15/tCO2)",
            tip_exchange: "Tỷ giá hối đoái VND/USD\n= Dùng để quy đổi các chi phí/doanh thu ngoại tệ",
            tip_escalation: "Lạm phát giá điện\n= Tỷ lệ tăng doanh thu tiết kiệm kỳ vọng hằng năm (thường 2-5%)",
            tip_om: "Chi phí O&M năm t\n= (% OM × CAPEX) × (1 + Tỷ lệ lạm phát)^t",
            tip_cycle: "Vòng đời dự án\n= Số năm đánh giá dòng tiền tài chính (thường 20-25 năm)",
            tip_deg: "Suy hao PV\n= Mức giảm sản lượng (Sản lượng năm t = Sản lượng năm 1 × (1 - Suy hao)^(t-1))",
            tip_revenue_table: "Doanh thu tiết kiệm hằng năm từ việc giảm mua điện lưới hoặc xuất bán điện.",
            tip_om_table: "Chi phí vận hành, bảo trì và bảo dưỡng định kỳ hệ thống.",
            tip_replacement_table: "Chi phí trích lập dự phòng để thay thế Inverter hoặc Pin lưu trữ (nếu có).",
            tip_net_flow_table: "Dòng tiền giữ lại được trong năm\n= Doanh thu - O&M - Thay thế thiết bị - Lãi & Gốc vay (nếu có).\n\nHệ thống vay 100% nhưng vẫn có dòng tiền DƯƠNG nghĩa là tiền thu về thừa sức trả nợ ngân hàng hằng năm.",
            tip_acc_table: "Lợi nhuận gộp tích lũy qua các năm. Khi giá trị > 0 nghĩa là túi tiền của bạn đã thực sự có lãi."
        },
        en: {
            title_finance: "Project Financial Map",
            cycle: "PROJECT LIFE",
            escalation: "POWER ESCALATION",
            degradation: "PV DEGRADATION",
            discount: "DISCOUNT RATE",
            om: "O&M COST",
            battery_life: "BATTERY LIFE",
            major_repair_title: "MAJOR REPAIR EVENTS",
            major_repair_add: "+ Add repair event",
            major_repair_event_label: "Repair #",
            major_repair_year: "Year",
            carbon_credit: "CARBON CREDIT",
            exchange_rate: "USD/VND RATE",
            no_battery_msg: "No Battery (0 kWh). Replacement cost not applied.",
            om_schedule_title: "SCHEDULED O&M COSTS",
            om_year: "Year",
            om_amount: "Amount",
            om_add: "+ Add Cost",
            total_capex_manual: "Investment Capital Configuration",
            auto_calc_placeholder: "Auto-calculated...",
            manual_override_msg: "* Enter amount to override automatic calculation",
            title_loan: "Loan Configuration",
            loan_ratio: "LOAN RATIO",
            equity: "Equity",
            interest_rate: "INTEREST RATE",
            loan_term: "LOAN TERM",
            no_lever_msg: "No financial leverage used",
            cashflow_chart_title: "Cash Flow Chart (VND)",
            net_flow: "Net Cash Flow",
            accumulated: "Cumulative",
            year: "Year",
            year_0: "Investment (Year 0)",
            revenue: "Revenue (Savings)",
            om_cost: "O&M Cost",
            replacement: "Equipment Replacement",
            legend_net_flow: "Annual Net Cash Flow",
            legend_acc_invest: "Initial Investment",
            legend_acc_recover: "Recovering Capital",
            legend_acc_profit: "Profitable",
            analysis_title: "Investment Performance Analysis (Scenario Comparison) (VND)",
            analysis_desc: "Compare advanced financial metrics (NPV, ROI, IRR) across different capacity scenarios.",
            col_scenario: "Scenario",
            col_capacity: "Capacity",
            col_capex: "CAPEX (VND)",
            col_saving: "Savings (Year 1) (VND)",
            col_npv: "NPV (VND)",
            col_irr: "IRR",
            col_payback: "Payback",
            btn_select: "Select",
            unit_year: "Year",
            unit_percent_year: "%/Year",
            unit_vnd_kwp: "VND/kWp",
            unit_vnd_kwh: "VND/kWh",
            unit_exchange: "VND/$",
            unit_vnd: "VND",
            system_price: "SOLAR INVESTMENT",
            bess_price: "BESS INVESTMENT",
            co2_factor: "CO2 EMISSION FACTOR",
            inverter_life: "INVERTER LIFE",
            inverter_replace_cost: "INVERTER REPLACEMENT COST",
            col_lcoe: "LCOE (VND/kWh)",
            tip_capex: "Initial Capital Expenditure (CAPEX)\n= (Solar Capacity × Solar Price) + (BESS Capacity × BESS Price)",
            tip_saving: "Year 1 Savings\n= (Self-consumption × Grid Price) + (Grid Export × FIT Price)",
            tip_lcoe: "Levelized Cost of Energy (LCOE)\nThe average minimum electricity price at which the project breaks even over its lifetime.",
            tip_npv: "Net Present Value (NPV)\nThe sum of future cash flows discounted back to the present, minus the initial investment.",
            tip_irr: "Internal Rate of Return (IRR)\nThe discount rate at which the NPV of the project equals zero. Higher IRR indicates a more profitable project.",
            tip_payback: "Payback Period\nThe point in time when the cumulative cash flow becomes positive (initial investment recovered).",
            tip_discount: "Discount Rate (r)\nThe rate used to convert future cash flows to present value (Typically 8-12%).",
            tip_escalation: "Electricity Price Escalation\nAssumed annual increase in grid electricity prices (Typically 2-5%).",
            tip_om: "Annual Operation & Maintenance (O&M) Cost\n= (% O&M × CAPEX) × (1 + Inflation Rate)^t",
            tip_cycle: "Project Life\nThe expected operational lifespan of the solar system (Typically 20-25 years).",
            tip_deg: "PV Degradation\nAnnual reduction in solar panel efficiency (Typically 0.5-0.8%/year).",
            tip_exchange: "USD/VND Exchange Rate used to convert prices entered in USD (e.g., Carbon Credits).",
            tip_carbon: "Expected Carbon Credit price per ton of CO2 emission reduction.",
            tip_battery_life: "Expected operational lifespan of the Battery Energy Storage System (BESS) before replacement.",
            tip_inverter_life: "Average operational lifespan of the Inverter before replacement (Typically 10-12 years).",
            tip_inverter_replace_cost: "Cost of replacing with a new Inverter (calculated as a % of the initial Solar capacity unit price).",
            tip_equity: "The owner's portion of the project investment (equity).",
            tip_revenue_table: "Annual savings generated from reduced grid purchases or excess energy sales.",
            tip_om_table: "Cost of annual operation, maintenance, and periodic cleaning of the system.",
            tip_replacement_table: "Provisions for the cost of replacing major equipment like Inverters or Batteries.",
            tip_net_flow_table: "Annual Net Cash Flow\n= Revenue - O&M - Replacement Costs - Debt Service (if any).",
            tip_acc_table: "Cumulative net cash flow. When this value becomes positive, it indicates the payback year."
        }
    }[lang];

    const [showDetailTable, setShowDetailTable] = useState(false);
    const [showFinanceMap, setShowFinanceMap] = useState(false);

    // Create a version of the data specifically for the chart to prevent Year 0 'net' from skewing the Y-axis
    const chartData = React.useMemo(() => {
        if (!currentFinance?.cumulativeData) return [];
        const loanAmount = currentFinance.loanAmount || 0;

        return currentFinance.cumulativeData.map(d => ({
            ...d,
            // We set net to 0 (or null) for Year 0 so Recharts doesn't auto-expand the left Y-axis
            chartNet: d.year === 0 ? 0 : d.net,
            // Explicitly map Debt/Loan for visual breakdown
            chartDebt: d.year === 0 ? -loanAmount : (d.debt || 0)
        }));
    }, [currentFinance]);

    const unifiedDomain = React.useMemo(() => {
        if (!chartData || chartData.length === 0) return ['auto', 'auto'];

        let min = 0, max = 0;

        chartData.forEach(d => {
            // We consider all chartNet values, including Year 0 if it's negative
            // chartNet at Year 0 is basically -equity. If equity is 0, chartNet is 0.
            min = Math.min(min, d.chartNet);
            max = Math.max(max, d.chartNet);

            // also consider accumulated flow
            min = Math.min(min, d.acc);
            max = Math.max(max, d.acc);

            // also consider debt columns
            if (d.chartDebt) min = Math.min(min, d.chartDebt);
            if (d.chartDebt) max = Math.max(max, d.chartDebt);
        });

        if (max === 0 && min === 0) return [0, 1];

        // Ensure we provide some padding below the minimum value so bottom bars aren't cut off
        return [min < 0 ? min * 1.05 : 0, max * 1.05];
    }, [chartData]);

    // Custom Legend to explain the different colors
    const renderCustomLegend = () => {
        return (
            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-[11px] text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                    <span>{dt.legend_net_flow}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                    <span>{lang === 'vi' ? 'Vốn đầu tư ban đầu' : 'Initial Investment'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-orange-400 rounded-sm"></div>
                    <span>{lang === 'vi' ? 'Đang thu hồi vốn' : 'Recovering Capital'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                    <span>{lang === 'vi' ? 'Đã sinh lời' : 'Profitable'}</span>
                </div>
                {finParams.loan.enable && (
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-amber-400 rounded-sm"></div>
                        <span>{lang === 'vi' ? 'Vốn vay / Trả nợ' : 'Loan / Debt'}</span>
                    </div>
                )}
            </div>
        );
    };

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
                        {/* 1. UNIT PRICES & CO2 */}
                        <div className="grid grid-cols-3 gap-2 mb-2 pb-2 border-b border-slate-100">
                            <div>
                                <label className="text-[9px] text-blue-500 font-bold block mb-0.5 flex items-center gap-1 group relative cursor-help w-fit">
                                    {dt.system_price} <HelpCircle size={12} className="text-slate-300" />
                                    <div className="absolute bottom-full mb-2 left-0 w-max max-w-[200px] p-2 bg-slate-800 text-white text-[9px] rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] font-normal normal-case leading-tight">
                                        {dt.tip_capex}
                                        <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                                    </div>
                                </label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={params.systemPrice === '' ? '' : Number(params.systemPrice).toLocaleString('vi-VN')} 
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\./g, '');
                                            if (val === '' || /^\d+$/.test(val)) setParams(prev => ({ ...prev, systemPrice: val === '' ? '' : Number(val) }));
                                        }} 
                                        onFocus={(e) => { if (params.systemPrice === 0 || params.systemPrice === '0') setParams(prev => ({ ...prev, systemPrice: '' })); e.target.select(); }} 
                                        className="w-full p-1.5 text-xs border border-blue-200 rounded bg-blue-50/50 pr-12 font-bold text-blue-700 focus:ring-1 focus:ring-blue-300 outline-none" 
                                    />
                                     <span className="absolute right-2 top-1.5 text-[9px] text-blue-400 select-none">{dt.unit_vnd_kwp}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] text-amber-500 font-bold block mb-0.5 flex items-center gap-1 group relative cursor-help w-fit">
                                    {dt.carbon_credit} <HelpCircle size={12} className="text-slate-300" />
                                    <div className="absolute bottom-full mb-2 left-0 w-max max-w-[200px] p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] font-normal normal-case leading-tight">
                                        {dt.tip_carbon}
                                        <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                                    </div>
                                </label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={finParams.carbonPrice === '' ? '' : Number(finParams.carbonPrice).toLocaleString('vi-VN')} 
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\./g, '');
                                            if (val === '' || /^\d+$/.test(val)) setFinParams(prev => ({ ...prev, carbonPrice: val === '' ? '' : Number(val) }));
                                        }} 
                                        onFocus={(e) => { if (finParams.carbonPrice === 0 || finParams.carbonPrice === '0') setFinParams(prev => ({ ...prev, carbonPrice: '' })); e.target.select(); }} 
                                        className="w-full p-1.5 text-xs border border-amber-200 rounded bg-amber-50/50 pr-20 font-bold text-amber-700 focus:ring-1 focus:ring-amber-300 outline-none" 
                                    />
                                    <span className="absolute right-2 top-1.5 text-[9px] text-amber-400 select-none">$/tCO2</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] text-emerald-500 font-bold block mb-0.5 flex items-center gap-1 group relative cursor-help w-fit">
                                    {dt.co2_factor} <HelpCircle size={12} className="text-slate-300" />
                                    <div className="absolute bottom-full mb-2 left-0 w-max max-w-[200px] p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] font-normal normal-case leading-tight text-left">
                                        {lang === 'vi' ? 'Hệ số phát thải khí nhà kính của lưới điện Việt Nam.' : 'Greenhouse gas emission factor of the Vietnam national grid.'}
                                        <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                                    </div>
                                </label>
                                <div className="relative"><input type="number" step={0.001} value={params.co2Factor} onChange={(e) => setParams(prev => ({ ...prev, co2Factor: Number(e.target.value) }))} onFocus={(e) => { if (e.target.value === '0') setParams(prev => ({ ...prev, co2Factor: '' })); e.target.select(); }} className="w-full p-1.5 text-xs border border-emerald-200 rounded bg-emerald-50/50 pr-20 font-bold text-emerald-700 focus:ring-1 focus:ring-emerald-300 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" /><span className="absolute right-2 top-1.5 text-[9px] text-emerald-400 select-none">kg/kWh</span></div>
                            </div>
                        </div>

                        {bessKwh > 0 && (
                             <div className="grid grid-cols-3 gap-2 mb-2 pb-2 border-b border-slate-100">
                                <div>
                                    <label className="text-[9px] text-blue-500 font-bold block mb-0.5">{dt.bess_price}</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={params.bessPrice === '' ? '' : Number(params.bessPrice).toLocaleString('vi-VN')} 
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\./g, '');
                                                if (val === '' || /^\d+$/.test(val)) setParams(prev => ({ ...prev, bessPrice: val === '' ? '' : Number(val) }));
                                            }} 
                                            onFocus={(e) => { if (params.bessPrice === 0 || params.bessPrice === '0') setParams(prev => ({ ...prev, bessPrice: '' })); e.target.select(); }} 
                                            className="w-full p-1.5 text-xs border border-blue-200 rounded bg-blue-50/50 pr-16 font-bold text-blue-700 focus:ring-1 focus:ring-blue-300 outline-none" 
                                        />
                                         <span className="absolute right-2 top-1.5 text-[9px] text-blue-400 select-none">{dt.unit_vnd_kwh}</span>
                                    </div>
                                </div>
                                <div className="col-span-2"></div>
                            </div>
                        )}

                        {/* 2. FINANCIAL PARAMS */}
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            {[
                                { l: dt.cycle, k: 'years', u: dt.unit_year, v: finParams.years, step: 1, tip: dt.tip_cycle },
                                { l: dt.escalation, k: 'escalation', u: dt.unit_percent_year, v: finParams.escalation, step: 0.1, tip: dt.tip_escalation },
                                { l: dt.degradation, k: 'degradation', u: dt.unit_percent_year, v: finParams.degradation, step: 0.05, tip: dt.tip_deg },
                                { l: dt.discount, k: 'discountRate', u: '%', v: finParams.discountRate, step: 0.1, tip: dt.tip_discount },
                                { l: dt.om, k: 'omPercent', u: dt.unit_percent_year, v: finParams.omPercent, step: 0.1, tip: dt.tip_om },
                                { l: dt.battery_life, k: 'batteryLife', u: dt.unit_year, v: finParams.batteryLife, step: 1, tip: dt.tip_battery_life, hide: bessKwh === 0 },
                                { l: dt.inverter_life, k: 'inverterLife', u: dt.unit_year, v: finParams.inverterLife, step: 1, tip: dt.tip_inverter_life },
                                { l: dt.inverter_replace_cost, k: 'inverterReplaceCost', u: '%', v: finParams.inverterReplaceCost, step: 1, tip: dt.tip_inverter_replace_cost },
                                 { l: dt.exchange_rate, k: 'usdExchangeRate', u: dt.unit_exchange, v: finParams.usdExchangeRate, step: 100, tip: dt.tip_exchange, isMoney: true }
                            ].filter(p => !p.hide).map((p, i) => (
                                <div key={i} className={p.dis ? 'opacity-40' : ''}>
                                    <label className="text-[9px] text-slate-400 font-bold mb-0.5 flex items-center gap-1 group/tip relative cursor-help w-fit">
                                        {p.l} {p.tip && <HelpCircle size={12} className="text-slate-300" />}
                                        {p.tip && (
                                            <div className="absolute bottom-full left-0 mb-2 w-max max-w-[320px] p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-[100] font-normal normal-case leading-tight">
                                                {p.tip}
                                                <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800"></div>
                                            </div>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type={p.isMoney ? "text" : "number"}
                                            step={p.step} 
                                            value={p.isMoney ? (p.v === '' ? '' : Number(p.v).toLocaleString('vi-VN')) : p.v} 
                                            disabled={p.dis} 
                                            onChange={(e) => {
                                                const val = p.isMoney ? e.target.value.replace(/\./g, '') : e.target.value;
                                                if (!p.isMoney || val === '' || /^\d+$/.test(val)) {
                                                    setFinParams(prev => ({ ...prev, [p.k]: val === '' ? '' : Number(val) }));
                                                }
                                            }}
                                            onFocus={(e) => { 
                                                if (p.v === 0 || p.v === '0') setFinParams(prev => ({ ...prev, [p.k]: '' })); 
                                                e.target.select(); 
                                            }}
                                            className={`w-full p-1.5 text-xs border rounded font-bold focus:ring-1 focus:ring-blue-200 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${p.u.length > 3 ? 'pr-20' : 'pr-12'} ${p.dis ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700'}`} 
                                        />
                                        <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 select-none">{p.u}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 2.5 DYNAMIC MAJOR REPAIR EVENTS */}
                        <div className="mt-4 pt-4 border-t border-slate-100">
                             <div className="flex justify-between items-center mb-3">
                                <label className="text-[10px] text-slate-600 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                                    <div className="p-1 bg-amber-100 text-amber-600 rounded-md shadow-sm"><Wrench size={10} /></div> {dt.major_repair_title}
                                </label>
                                <button
                                    onClick={() => setFinParams(prev => ({ ...prev, majorRepairs: [...(prev.majorRepairs || []), { id: Date.now(), year: '', pct: '' }] }))}
                                    className="text-[9px] bg-amber-50 text-amber-600 hover:bg-amber-100 px-3 py-1.5 rounded-md font-bold transition-all border border-amber-200 cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1 min-w-[130px]"
                                >
                                    {dt.major_repair_add}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {(finParams.majorRepairs || []).map((mr, idx) => (
                                    <div key={mr.id || idx} className="grid grid-cols-12 gap-3 items-end p-3 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="col-span-2">
                                            <div className="text-[9px] text-slate-400 font-extrabold uppercase mb-1">{dt.major_repair_event_label} {idx + 1}</div>
                                            <div className="h-9 flex items-center justify-center bg-white border border-slate-200 rounded-md shadow-sm font-bold text-slate-500 text-xs">
                                                #{idx + 1}
                                            </div>
                                        </div>
                                        <div className="col-span-4">
                                            <label className="text-[9px] text-slate-400 font-bold ml-1 mb-1 block">{dt.major_repair_year}</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={mr.year}
                                                    onChange={(e) => {
                                                        const newRepairs = [...finParams.majorRepairs];
                                                        newRepairs[idx].year = e.target.value === '' ? '' : Number(e.target.value);
                                                        setFinParams(prev => ({ ...prev, majorRepairs: newRepairs }));
                                                    }}
                                                    className="w-full p-2 text-xs border border-slate-200 rounded-md pr-12 font-bold bg-white text-slate-700 focus:ring-1 focus:ring-amber-300 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    placeholder="--"
                                                />
                                                <span className="absolute right-2 top-2.5 text-[9px] text-slate-400 font-bold">{dt.unit_year}</span>
                                            </div>
                                        </div>
                                        <div className="col-span-4">
                                            <label className="text-[9px] text-slate-400 font-bold ml-1 mb-1 block">% CAPEX</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={mr.pct}
                                                    onChange={(e) => {
                                                        const newRepairs = [...finParams.majorRepairs];
                                                        newRepairs[idx].pct = e.target.value === '' ? '' : Number(e.target.value);
                                                        setFinParams(prev => ({ ...prev, majorRepairs: newRepairs }));
                                                    }}
                                                    className="w-full p-2 text-xs border border-slate-200 rounded-md pr-12 font-bold bg-white text-amber-700 focus:ring-1 focus:ring-amber-300 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    placeholder="0"
                                                />
                                                <span className="absolute right-2 top-2.5 text-[10px] text-slate-400 font-bold">%</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 flex justify-end">
                                            <button
                                                onClick={() => {
                                                    const newRepairs = finParams.majorRepairs.filter((_, i) => i !== idx);
                                                    setFinParams(prev => ({ ...prev, majorRepairs: newRepairs }));
                                                }}
                                                className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-all border border-red-100 cursor-pointer shadow-sm"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. SCHEDULED O&M */}
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-[10px] text-slate-600 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                                    <div className="p-1 bg-blue-100 text-blue-600 rounded-md shadow-sm"><Settings size={10} /></div> {dt.om_schedule_title}
                                </label>
                                <button
                                    onClick={() => setFinParams(prev => ({ ...prev, omSchedule: [...(prev.omSchedule || []), { year: '', amount: '' }] }))}
                                    className="text-[9px] bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-md font-bold transition-all border border-blue-200 cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-1 min-w-[130px]"
                                >
                                    {dt.om_add}
                                </button>
                            </div>

                            {(finParams.omSchedule || []).length > 0 && (
                                <div className="space-y-3">
                                    {(finParams.omSchedule || []).map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-3 items-end p-3 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                                            <div className="col-span-2">
                                                <div className="text-[9px] text-slate-400 font-extrabold uppercase mb-1">#{idx + 1}</div>
                                                <div className="h-9 flex items-center justify-center bg-white border border-slate-200 rounded-md shadow-sm font-bold text-slate-500 text-xs">
                                                    #{idx + 1}
                                                </div>
                                            </div>
                                            <div className="col-span-4">
                                                <label className="text-[9px] text-slate-400 font-bold ml-1 mb-1 block">{dt.om_year}</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={item.year}
                                                        placeholder="--"
                                                        onChange={(e) => {
                                                            const newSchedule = [...finParams.omSchedule];
                                                            newSchedule[idx].year = e.target.value;
                                                            setFinParams(prev => ({ ...prev, omSchedule: newSchedule }));
                                                        }}
                                                        className="w-full p-2 text-xs border border-slate-200 rounded-md pr-12 font-bold bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-300 transition-all shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <span className="absolute right-2 top-2.5 text-[9px] text-slate-400 font-bold">{dt.unit_year}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-4">
                                                <label className="text-[9px] text-slate-400 font-bold ml-1 mb-1 block">{dt.om_amount}</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={item.amount === '' ? '' : Number(item.amount).toLocaleString('vi-VN')}
                                                        placeholder="0"
                                                        onChange={(e) => {
                                                            const rawValue = e.target.value.replace(/\./g, '');
                                                            if (rawValue === '' || /^\d+$/.test(rawValue)) {
                                                                const newSchedule = [...finParams.omSchedule];
                                                                newSchedule[idx].amount = rawValue === '' ? '' : Number(rawValue);
                                                                setFinParams(prev => ({ ...prev, omSchedule: newSchedule }));
                                                            }
                                                        }}
                                                        onFocus={(e) => { 
                                                            if (item.amount === 0 || item.amount === '0') {
                                                                const newSchedule = [...finParams.omSchedule];
                                                                newSchedule[idx].amount = '';
                                                                setFinParams(prev => ({ ...prev, omSchedule: newSchedule }));
                                                            }
                                                            e.target.select(); 
                                                        }}
                                                        className="w-full p-2 text-xs border border-slate-200 rounded-md pr-16 font-bold bg-white text-blue-700 outline-none focus:ring-1 focus:ring-blue-300 transition-all shadow-sm"
                                                    />
                                                    <span className="absolute right-2 top-2.5 text-[9px] text-slate-400 font-medium">{dt.unit_vnd}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-2 flex justify-end">
                                                <button
                                                    onClick={() => {
                                                        const newSchedule = finParams.omSchedule.filter((_, i) => i !== idx);
                                                        setFinParams(prev => ({ ...prev, omSchedule: newSchedule }));
                                                    }}
                                                    className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-md transition-all border border-red-100 cursor-pointer shadow-sm"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* NEW: Investment Capital (Capex) */}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
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
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 block mb-0.5 uppercase">{lang === 'vi' ? 'Số tiền' : 'Amount'}</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={finParams.manualCapex === '' || finParams.manualCapex === null ? '' : Number(finParams.manualCapex).toLocaleString('vi-VN')}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\./g, '');
                                            if (val === '' || /^\d+$/.test(val)) setFinParams(prev => ({ ...prev, manualCapex: val === '' ? '' : Number(val) }));
                                        }}
                                        onFocus={(e) => { if (finParams.manualCapex === 0 || finParams.manualCapex === '0') setFinParams(prev => ({ ...prev, manualCapex: '' })); e.target.select(); }}
                                        placeholder={dt.auto_calc_placeholder}
                                        className="w-full p-1.5 text-xs border rounded bg-blue-50/50 font-bold text-blue-800 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-300 outline-none"
                                    />
                                    <span className="absolute right-2 top-1.5 text-[10px] text-blue-400 select-none font-bold">VND</span>
                                </div>
                                <p className="text-[9px] text-slate-400 mt-1 italic">{dt.manual_override_msg}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* LOAN CONFIG */}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 relative z-20">
                    <div className={`flex justify-between items-center ${finParams.loan.enable ? 'mb-3' : ''}`}>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Wallet size={16} className="text-blue-600" /> {dt.title_loan}</h3>
                        <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={finParams.loan.enable} onChange={(e) => setFinParams(prev => ({ ...prev, loan: { ...prev.loan, enable: e.target.checked } }))} className="sr-only peer" />
                            <div className="relative w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {finParams.loan.enable && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 relative z-30">
                             <div className="grid grid-cols-2 gap-3">
                                 <div>
                                     <label className="text-[9px] font-bold text-slate-400 mb-0.5 block uppercase">
                                         {dt.loan_ratio}
                                     </label>
                                     <div className="relative">
                                         <input type="number" value={finParams.loan.ratio} onChange={(e) => setFinParams(prev => ({ ...prev, loan: { ...prev.loan, ratio: e.target.value === '' ? '' : Number(e.target.value) } }))} onFocus={(e) => e.target.select()} className="w-full p-1.5 border rounded bg-blue-50 text-blue-900 text-xs font-bold outline-none pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                         <span className="absolute right-2 top-1.5 text-[10px] text-blue-400 select-none font-bold">%</span>
                                     </div>
                                 </div>
                                 <div className="pt-4 text-[10px] text-slate-400">{dt.equity}: <span className="font-bold text-slate-700">{100 - finParams.loan.ratio}%</span></div>
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                 <div>
                                     <label className="text-[9px] font-bold text-slate-400 mb-0.5 block uppercase">
                                         {dt.interest_rate}
                                     </label>
                                     <div className="relative">
                                         <input type="number" step="0.1" value={finParams.loan.rate} onChange={(e) => setFinParams(prev => ({ ...prev, loan: { ...prev.loan, rate: e.target.value === '' ? '' : Number(e.target.value) } }))} onFocus={(e) => e.target.select()} className="w-full p-1.5 border rounded text-xs font-bold outline-none pr-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                         <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 select-none font-bold">{dt.unit_percent_year}</span>
                                     </div>
                                 </div>
                                 <div>
                                     <label className="text-[9px] font-bold text-slate-400 mb-0.5 block uppercase">
                                         {dt.loan_term}
                                     </label>
                                     <div className="relative">
                                         <input type="number" value={finParams.loan.term} onChange={(e) => setFinParams(prev => ({ ...prev, loan: { ...prev.loan, term: e.target.value === '' ? '' : Number(e.target.value) } }))} onFocus={(e) => e.target.select()} className="w-full p-1.5 border rounded text-xs font-bold outline-none pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                         <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 select-none font-bold">{dt.unit_year}</span>
                                     </div>
                                 </div>
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
                            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 25 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" strokeOpacity={0.8} />
                                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                                <YAxis domain={unifiedDomain} yAxisId="left" tick={{ fontSize: 10 }} width={60} tickFormatter={(val) => Math.abs(val) >= 1e9 ? `${(val / 1e9).toFixed(1)} ${lang === 'vi' ? 'Tỷ' : 'B'}` : Math.abs(val) >= 1e6 ? `${(val / 1e6).toFixed(0)} ${lang === 'vi' ? 'Tr' : 'M'}` : val} />
                                <RechartsTooltip formatter={(value) => formatMoney(Number(value))} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend content={renderCustomLegend} verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
                                <ReferenceLine yAxisId="left" y={0} stroke="#94a3b8" />
                                <Bar yAxisId="left" dataKey="chartNet" name={dt.net_flow} barSize={16} isAnimationActive={false}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`net-${index}`} fill={entry.year === 0 ? 'transparent' : (entry.chartNet >= 0 ? '#3b82f6' : '#ef4444')} />
                                    ))}
                                </Bar>
                                {finParams.loan.enable && (
                                    <Bar yAxisId="left" dataKey="chartDebt" name={lang === 'vi' ? 'Vốn vay / Trả nợ' : 'Loan / Debt'} barSize={16} isAnimationActive={false}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`debt-${index}`} fill={'#fbbf24'} />
                                        ))}
                                    </Bar>
                                )}
                                <Bar yAxisId="left" dataKey="acc" name={dt.accumulated} barSize={16} isAnimationActive={false}>
                                    {chartData.map((entry, index) => {
                                        let fillColor = '#10b981'; // green for profit
                                        if (entry.year === 0) fillColor = '#ef4444'; // red for initial capex
                                        else if (entry.acc < 0) fillColor = '#fb923c'; // orange for recovering
                                        return <Cell key={`acc-${index}`} fill={fillColor} />;
                                    })}
                                </Bar>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    {showDetailTable && (
                        <div className="mt-6 overflow-x-auto border rounded-lg border-slate-200 animate-in fade-in slide-in-from-top-4">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 font-bold text-slate-500 text-[10px] uppercase">
                                    <tr>
                                        <th className="p-3 border-b">{dt.year}</th>
                                        <th className="p-3 border-b group relative cursor-help"><div className="flex items-center justify-center gap-1"><span>{dt.revenue}</span><HelpCircle size={10} /></div><div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-max max-w-[300px] p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] font-normal whitespace-pre-line leading-tight text-left">{dt.tip_revenue_table}<div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800"></div></div></th>
                                        <th className="p-3 border-b group relative cursor-help"><div className="flex items-center justify-center gap-1"><span>{dt.om_cost}</span><HelpCircle size={10} /></div><div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-max max-w-[300px] p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] font-normal whitespace-pre-line leading-tight text-left">{dt.tip_om_table}<div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800"></div></div></th>
                                        <th className="p-3 border-b text-red-600 group relative cursor-help"><div className="flex items-center justify-center gap-1"><span>{dt.replacement}</span><HelpCircle size={10} /></div><div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-max max-w-[300px] p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] font-normal whitespace-pre-line leading-tight text-left">{dt.tip_replacement_table}<div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800"></div></div></th>
                                        <th className="p-3 border-b text-blue-600 group relative cursor-help"><div className="flex items-center justify-center gap-1"><span>{dt.net_flow}</span><HelpCircle size={10} /></div><div className="absolute top-full mt-2 right-0 w-max max-w-[300px] p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] font-normal whitespace-pre-line leading-tight text-left">{dt.tip_net_flow_table}<div className="absolute bottom-full right-4 border-4 border-transparent border-b-slate-800"></div></div></th>
                                        <th className="p-3 border-b text-emerald-600 group relative cursor-help"><div className="flex items-center justify-center gap-1"><span>{dt.accumulated}</span><HelpCircle size={10} /></div><div className="absolute top-full mt-2 right-0 w-max max-w-[300px] p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] font-normal whitespace-pre-line leading-tight text-left">{dt.tip_acc_table}<div className="absolute bottom-full right-4 border-4 border-transparent border-b-slate-800"></div></div></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentFinance.cumulativeData.map((y, i) => (
                                        <tr key={i} className={`hover:bg-slate-50 border-b border-slate-100 ${y.year === 0 ? 'bg-orange-50' : ''} ${y.isReplacement ? 'bg-red-50' : ''}`}>
                                            <td className="p-3 font-bold text-slate-700">{y.year === 0 ? dt.year_0 : `${dt.year} ${y.year}`}</td>
                                            <td className="p-3 text-center font-medium text-slate-700">{y.year > 0 ? formatMoney(y.revenue) : '-'}</td>
                                            <td className="p-3 text-center font-medium text-slate-500">{y.year > 0 ? formatMoney(y.om) : '-'}</td>
                                            <td className="p-3 text-center font-bold text-red-500">{y.replace < 0 ? formatMoney(y.replace) : '-'}</td>
                                            <td className="p-3 text-center font-bold text-blue-600">{formatMoney(y.net)}</td>
                                            <td className={`p-3 text-center font-bold ${y.acc >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>{formatMoney(y.acc)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}



            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-100"><h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><BarChart2 size={18} className="text-slate-500" /> {dt.analysis_title}</h3><p className="text-sm text-slate-500">{dt.analysis_desc}</p></div>
                <div className="overflow-x-visible pb-12"><table className="w-full text-xs text-left border-collapse"><thead className="bg-slate-50 text-slate-500 uppercase text-[10px]"><tr>
                    <th className="px-4 py-2 font-medium bg-slate-50 sticky top-0 z-10">{dt.col_scenario}</th>
                    <th className="px-4 py-2 font-medium text-center bg-slate-50 sticky top-0 z-10">{dt.col_capacity}</th>
                    <th className="px-4 py-2 font-medium text-right bg-slate-50 sticky top-0 z-10 group relative cursor-help"><div className="flex items-center justify-end gap-1"><span>{dt.col_capex}</span><HelpCircle size={10} /></div><div className="absolute bottom-full mb-2 right-0 w-max max-w-[300px] p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] font-normal whitespace-pre-line leading-tight text-left">{dt.tip_capex}<div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800"></div></div></th>
                    <th className="px-4 py-2 font-medium text-right bg-slate-50 sticky top-0 z-10 group relative cursor-help"><div className="flex items-center justify-end gap-1"><span>{dt.col_saving}</span><HelpCircle size={10} /></div><div className="absolute bottom-full mb-2 right-0 w-max max-w-[300px] p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] font-normal whitespace-pre-line leading-tight text-left">{dt.tip_saving}<div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800"></div></div></th>
                    <th className="px-4 py-2 font-medium text-right text-purple-600 bg-slate-50 sticky top-0 z-10 group relative cursor-help"><div className="flex items-center justify-end gap-1"><span>{dt.col_lcoe}</span><HelpCircle size={10} /></div><div className="absolute bottom-full mb-2 right-0 w-max max-w-[300px] p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] font-normal whitespace-pre-line leading-tight text-left">{dt.tip_lcoe}<div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800"></div></div></th>
                    <th className="px-4 py-2 font-medium text-right text-emerald-600 bg-slate-50 sticky top-0 z-10 group relative cursor-help"><div className="flex items-center justify-end gap-1"><span>{dt.col_npv}</span><HelpCircle size={10} /></div><div className="absolute bottom-full mb-2 right-0 w-max max-w-[300px] p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] font-normal whitespace-pre-line leading-tight text-left">{dt.tip_npv}<div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800"></div></div></th>
                    <th className="px-4 py-2 font-medium text-right text-blue-600 bg-slate-50 sticky top-0 z-10 group relative cursor-help"><div className="flex items-center justify-end gap-1"><span>{dt.col_irr}</span><HelpCircle size={10} /></div><div className="absolute bottom-full mb-2 right-0 w-max max-w-[300px] p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] font-normal whitespace-pre-line leading-tight text-left">{dt.tip_irr}<div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800"></div></div></th>
                    <th className="px-4 py-2 font-medium text-right bg-slate-50 sticky top-0 z-10 group relative cursor-help"><div className="flex items-center justify-end gap-1"><span>{dt.col_payback}</span><HelpCircle size={10} /></div><div className="absolute bottom-full mb-2 right-0 w-max max-w-[300px] p-2 bg-slate-800 text-white text-[9px] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] font-normal whitespace-pre-line leading-tight text-left">{dt.tip_payback}<div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800"></div></div></th>
                    <th className="px-4 py-2 bg-slate-50 sticky top-0 z-10"></th>
                </tr></thead><tbody className="divide-y divide-slate-100">{scenarios.map((s, i) => (<tr key={i} className={`hover:bg-slate-50 transition ${targetKwp === s.kwp ? 'bg-indigo-50/50' : ''}`}><td className="px-4 py-2.5 font-medium text-slate-700">{s.label}</td><td className="px-4 py-2.5 text-center font-bold">{s.kwp} <small className="text-[10px] font-normal text-slate-400">kWp</small></td><td className="px-4 py-2.5 text-right text-slate-600">{formatMoney(s.capex)}</td><td className="px-4 py-2.5 text-right text-slate-600">{formatMoney(s.annualSaving)}</td><td className="px-4 py-2.5 text-right font-bold text-purple-600">{formatMoney(s.lcoe)}</td><td className="px-4 py-2.5 text-right font-bold text-emerald-600">{formatMoney(s.npv)}</td><td className="px-4 py-2.5 text-right font-bold text-blue-600">{s.irr.toFixed(1)}<small className="text-[10px] font-normal">%</small></td><td className="px-4 py-2.5 text-right font-bold text-slate-800">{s.paybackYears.toFixed(1)} <small className="text-[10px] font-normal text-slate-500">{dt.unit_year}</small></td><td className="px-4 py-2.5 text-right"><button onClick={() => onSelectScenario ? onSelectScenario(s) : setTargetKwp(s.kwp)} className={`text-[10px] px-2.5 py-1 rounded-full border transition ${targetKwp === s.kwp ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 hover:bg-white hover:border-indigo-500 text-slate-500'}`}>{dt.btn_select}</button></td></tr>))}</tbody></table></div>
            </div>
        </div>
    );
};
