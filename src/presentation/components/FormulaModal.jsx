import React from 'react';
import { Zap, Activity, BatteryCharging, Coins, ShieldCheck, X, Database, Cpu, CloudRain } from 'lucide-react';

export const FormulaModal = ({ onClose, lang }) => {
    const t = {
        vi: {
            title: "Bảng Các Công Thức Tính Toán",
            btn_close: "Đóng",
            data_processing: {
                title: "0. Chuẩn hóa dữ liệu phụ tải (Data Processing)",
                desc1: "Dữ liệu điện năng gốc (chu kỳ 15 phút hoặc 30 phút) được hệ thống tự động nội suy thành dữ liệu hàng giờ để phân tích sự đồng bộ với dải bức xạ Mặt Trời.",
                desc2: "Mô phỏng ngày nghỉ: Nếu dữ liệu vắng mặt các ngày Chủ Nhật, Tool sẽ tự động trích xuất trung bình phụ tải của các ngày làm việc (T2-T7) để lấp đầy, đảm bảo kết quả tính toán dòng tiền không bị sai lệch."
            },
            auto_sizing: {
                title: "0.1 Algorit Gợi ý Cấu hình Tự động (Auto-Sizing)",
                desc_inv: "Tỷ số DC/AC (Oversizing): Khuyến nghị cấu hình biến tần với tỷ số lắp quá tải DC/AC là 1.25. Điều này giúp tối ưu hóa công suất phát của Inverter trong suốt thời gian có nắng.",
                desc_bess: "Gợi ý Lưu trữ BESS: Hệ thống quét dữ liệu mô phỏng để tìm ra năng lượng dư thừa (Curtailment) ở mức phân vị thứ 75. Dung lượng Pin được đề xuất ở mức này giúp tối đa hóa khả năng lưu trữ điện thừa mà không gây lãng phí đầu tư (CAPEX) vào những ngày nắng cực đại hiếm hoi."
            },
            weather: {
                title: "0.2 Mô phỏng Kịch bản Thời tiết",
                desc: "Hệ thống áp dụng hệ số suy giảm (Derate Factor) trên tổng bức xạ Mặt Trời để mô phỏng tính khả thi của dự án dưới các điều kiện thời tiết khác nhau:",
                normal: "Năm cường độ bức xạ Tiêu chuẩn: Đạt 100% sản lượng dự kiến.",
                rainy: "Kịch bản Mưa nhiều: Ước tính sản lượng giảm xuống còn 85%.",
                bad: "Kịch bản Thời tiết Xấu (Mây, bão): Sản lượng giảm xuống còn 75%.",
                extreme: "Kịch bản Cực đoan: Sản lượng giảm xuống mức đáy 70%."
            },
            self_use: {
                title: "1. Tỷ lệ tự dùng (Self-Consumption)",
                formula: "Self-Consumption (%) = ( Tổng lượng Solar tiêu thụ tại chỗ / Tổng sản lượng Solar ) * 100",
                desc: "Chỉ số đánh giá mức độ hấp thụ năng lượng Mặt Trời của phụ tải nhà máy. Tỷ lệ này càng cao, chi phí năng lượng lãng phí càng thấp."
            },
            autarky: {
                title: "1.2 Tỷ lệ độc lập lưới (Autarky Rate)",
                formula: "Autarky (%) = ( Năng lượng mua lưới ròng giảm được / Tổng nhu cầu Phụ tải ) * 100",
                desc: "Chỉ số này thể hiện mức độ độc lập năng lượng của Nhà máy đối với điện lưới EVN khi trang bị hệ thống Solar kết hợp BESS."
            },
            curtailment: {
                title: "1.1 Tỷ lệ cắt giảm (Curtailment Rate)",
                formula: "Curtailment Rate (%) = ( Tổng lượng điện thừa bị cắt giảm / Tổng sản lượng Solar ) * 100",
                desc: "Lượng điện phát dư = Tổng phát Solar - (Tải tiêu thụ + Công suất Sạc). Trong mô hình Không phát lưới (Zero Export), lượng điện dư này sẽ bị Inverter điều tiết giảm công suất phát để bảo vệ hệ thống."
            },
            losses: {
                title: "2. Tổn thất Hệ thống (System Losses)",
                desc: "Các hệ số suy hao vật lý đặc trưng: Tổn hao do nhiệt độ (6.5%), bụi bẩn (4.0%), sai lệch quang sai (1.5%), tổn thất dây dẫn (1.5%), và tổn hao chuyển đổi của Inverter (2.0%)."
            },
            bess: {
                title: "3. Lưu trữ BESS (Battery Energy Storage System)",
                charge: "Năng lượng lưu trữ thực tế = Năng lượng nạp * Hiệu suất sạc (95%)",
                discharge: "Năng lượng xả thực tế = Năng lượng xả / Hiệu suất xả (95%)",
                dod: "Độ sâu xả (Depth of Discharge - DoD): Giới hạn ở mức 90% (Ngừng xả khi SOC còn 10%).",
                desc: "Việc thiết lập DoD và hiệu suất sạc/xả giúp mô phỏng chính xác tổn thất điện năng và đảm bảo tuổi thọ thiết kế của khối pin."
            },
            pmax: {
                title: "3.1 Cắt đỉnh phụ tải (Peak Shaving / Demand Response)",
                pmax_origin: "Pmax Gốc = Giá trị Max của (Tải tiêu thụ - Điện mặt trời phát) trong kỳ ghi nhận",
                pmax_desc: "Là Công suất Cực đại thực tế mà nhà máy phải kéo từ lưới sau khi đã bù trừ bởi hệ thống điện mặt trời tại thời điểm đó.",
                pmax_bess: "Pmax sau BESS = Khởi chạy thuật toán dò tìm mức trần công suất lưới tối ưu (Binary Search)",
                pmax_bess_desc: "Hệ thống BESS sẽ xả công suất để gánh phần phụ tải vượt mức trần mục tiêu. Lưu ý: Độ hiệu quả của việc giảm Pmax phụ thuộc vào độ rộng (thời lượng) của đỉnh tải. Nếu đỉnh kéo dài, BESS có thể cạn kiệt dung lượng (chạm ngưỡng DoD) và không thể duy trì mức trần."
            },
            finance: {
                title: "4. Chỉ số Tài chính Cơ bản",
                net_flow: "Trình tự tính Dòng tiền ròng (Net Cashflow) =",
                revenue: "Doanh thu (Khoản chi phí điện tiết kiệm được)",
                om: "Trừ đi: Chi phí Vận hành & Bảo dưỡng (O&M)",
                insurance: "Trừ đi: Phí Bảo hiểm hệ thống (Mặc định 0.5% CAPEX)",
                tax: "Trừ đi: Thuế Thu nhập Doanh nghiệp (CIT)",
                replacement: "Trừ đi: Chi phí Thay thế (Inverter & Pin theo chu kỳ)",
                loan: "Trừ đi: Chi phí Trả nợ Gốc & Lãi (Nếu sử dụng vốn vay)",
                tax_title: "Cơ chế Thuế TNDN (Corporate Tax):",
                tax_formula: "Lợi nhuận trước thuế = Doanh thu tiết kiệm - Khấu hao tài sản (20 năm) - Lãi vay - O&M - Bảo hiểm",
                tax_calc: "Thuế phải nộp = Max(0, Lợi nhuận trước thuế * Thuế suất 20%)",
                tax_desc: "Lưu ý: Khấu hao tài sản cố định và Lãi vay đóng vai trò là \"Lá chắn thuế\" (Tax Shield), giúp giảm nghĩa vụ nộp thuế hợp pháp.",
                efficiency: "Chỉ số Hiệu quả Đầu tư:",
                payback_desc: "Payback Period (Thời gian hoàn vốn) = Thời điểm Tổng Dòng Tiền Tích Lũy chuyển từ âm sang dương.",
                irr: "IRR = Tỷ suất Hoàn vốn Nội bộ (Tỷ lệ chiết khấu làm cho NPV = 0).",
                lcoe: "LCOE = Chi phí Quy dẫn (Giá thành tạo ra 1 kWh điện xuyên suốt vòng đời dự án)."
            },
            advanced_finance: {
                title: "4.1 Cơ chế Tài chính Nâng cao",
                ppa: "Mô hình ESCO/PPA (Hợp đồng Mua bán điện):",
                ppa_desc: "Doanh thu của Nhà đầu tư = Sản lượng điện tiêu thụ x Đơn giá lưới x (1 - Tỷ lệ chiết khấu PPA). Ví dụ: Chiết khấu 10% nghĩa là nhà máy mua điện rẻ hơn EVN 10%.",
                loan: "Cơ chế Trả nợ Vay vốn (Dư nợ giảm dần):",
                loan_desc: "Lãi suất được tính trên Dư nợ gốc còn lại thực tế. Khi dư nợ giảm, phần lãi vay hàng năm cũng sẽ giảm tương ứng, hỗ trợ tối ưu hóa dòng tiền các năm sau.",
                net_billing: "Cơ chế Bán điện dư lên lưới (Net Billing):",
                net_billing_desc: "Doanh thu Bán lưới = Lượng điện phát ngược (Exported) x Giá mua FIT hiện hành. Mặc định hệ thống sẽ áp dụng Zero Export nếu không thiết lập giá bán.",
                two_part: "Cơ chế Biểu giá 2 Thành Phần (Demand Charge Savings):",
                two_part_desc: "Khoản tiết kiệm Công suất = (Pmax Gốc - Pmax Sau BESS) x Đơn giá Công suất hiện hành. Lợi ích tài chính này chỉ phát sinh khi hệ thống có tích hợp BESS để cắt đỉnh."
            },
            assumptions: {
                title: "5. Các Giả định Cơ sở (Assumptions)",
                escalation: "Hệ số Trượt giá Điện (Escalation): Giả định giá điện tăng lũy tiến 2.0% mỗi năm.",
                degradation: "Độ suy hao Quang năng (Degradation): Tấm pin suy giảm hiệu suất 0.55% mỗi năm.",
                insurance: "Bảo hiểm tài sản: Trích lập 0.5% trên tổng mức đầu tư hệ thống (CAPEX).",
                inv_replace: "Bảo trì Inverter: Dự phóng thay thế tại năm thứ 10 (Ước tính 10% CAPEX ban đầu).",
                bess_replace: "Bảo trì BESS: Dự phóng thay thế cell pin tại năm thứ 10 (Ước tính 60% CAPEX BESS ban đầu)."
            }
        },
        en: {
            title: "Calculation Formulas",
            btn_close: "Close",
            data_processing: {
                title: "0. Load Data Processing",
                desc1: "Raw energy data (15-min/30-min intervals) is interpolated into hourly data to synchronize with hourly solar irradiance simulation.",
                desc2: "Weekend Simulation: The tool automatically replaces missing Sunday data with the average weekday load profile to ensure an uninterrupted baseline."
            },
            auto_sizing: {
                title: "0.1 Automatic Sizing Logic",
                desc_inv: "DC/AC Oversizing: Recommends an inverter configuration with a default DC/AC ratio of 1.25. The tool automatically matches primary and secondary inverters to hit the target AC capacity.",
                desc_bess: "BESS Suggestion: Scans 30-day simulations to find the highest curtailed-energy days (using the 75th percentile) to propose an optimal battery size, minimizing wasted investment."
            },
            weather: {
                title: "0.2 Weather Simulator",
                desc: "Adjusts the Solar Irradiation Derate Factor to stress-test the system's performance:",
                normal: "Normal: 100% yield",
                rainy: "Rainy Year: 85% yield",
                bad: "Bad Weather: 75% yield",
                extreme: "Extreme: 70% yield"
            },
            self_use: {
                title: "1. Self-Consumption Rate",
                formula: "Self-Consumption (%) = ( Total Solar Consumed / Total Solar Yield ) * 100",
                desc: "Evaluates what % of generated solar power is consumed on-site (not exported or curtailed)."
            },
            autarky: {
                title: "1.2 Grid Independence (Autarky Rate)",
                formula: "Autarky (%) = ( Grid Import Reduction / Total Load Demand ) * 100",
                desc: "Showcases how much the system (Solar + BESS) helps the facility become independent from the utility grid."
            },
            curtailment: {
                title: "1.1 Curtailment Rate",
                formula: "Curtailment Rate (%) = ( Total Excess Energy Clipped / Total Solar Yield ) * 100",
                desc: "Excess Energy = Solar Gen - (Load + Battery Charge). Under Zero Export, this excess is lost as the inverter reduces power (Curtailment)."
            },
            losses: {
                title: "2. System Losses",
                desc: "Default factors: Temp (6.5%), Soiling (4.0%), Mismatch (1.5%), Ohmic (1.5%), Inverter (2.0%)."
            },
            bess: {
                title: "3. BESS Storage (Updated)",
                charge: "Actual Charge = Energy In * Charging Efficiency (95%)",
                discharge: "Actual Discharge = Energy Out / Discharging Efficiency (95%)",
                dod: "Depth of Discharge (DoD): 90% (Stops at 10% SOC)",
                desc: "Simulates actual energy losses through the battery system and protection of battery lifespan."
            },
            pmax: {
                title: "3.1 Peak Shaving (Demand Charge)",
                pmax_origin: "Original Pmax = Max(Gross Load - Solar Generation) in a month",
                pmax_desc: "The highest power threshold pulled from the grid AFTER subtracting solar self-consumption. If load is 100kW & solar provides 40kW -> Grid pulls 60kW.",
                pmax_bess: "Pmax after BESS = Lowest grid threshold sustained by BESS without depletion",
                pmax_bess_desc: "Algorithm runs a 30-day binary search simulation. BESS discharges to shave peaks and charges during low load. If increasing BESS doesn't reduce Pmax, your peak is too 'Wide' (lasting many hours), depleting the battery mid-peak."
            },
            finance: {
                title: "4. Core Financial Metrics",
                net_flow: "Net Cashflow =",
                revenue: "Revenue (Power Savings)",
                om: "O&M Costs (Operational)",
                insurance: "Insurance Fee (0.5%)",
                tax: "Corporate Income Tax (CIT 20%)",
                replacement: "Replacement Costs (Battery & Inverter)",
                loan: "Debt Service (If financed)",
                tax_title: "Corporate Tax (CIT):",
                tax_formula: "Taxable Income = Revenue - O&M - Insurance - Interest Expense - Depreciation (20 years)",
                tax_calc: "Tax Due = Max(0, Taxable Income * 20%)",
                tax_desc: "Depreciation and Interest expenses act as a \"Tax Shield\", reducing the taxable amount.",
                efficiency: "Investment Performance:",
                payback_desc: "Payback = Time when Cumulative Cashflow >= 0",
                irr: "IRR = Internal Rate of Return (Point where NPV = 0)",
                lcoe: "LCOE = Levelized Cost of Energy (Discounted Costs / Discounted Gen)"
            },
            advanced_finance: {
                title: "4.1 Advanced Mechanisms",
                ppa: "ESCO/PPA Model:",
                ppa_desc: "Investor Revenue = Energy Sold x Regional Grid Tariff x (1 - PPA Discount%). A 90% PPA means selling 10% cheaper than the grid.",
                loan: "Bank Financing (Declining Balance):",
                loan_desc: "Annual Principal Repayment = Total Loan / Tenure. Interest = Remaining Balance x Interest Rate. Interest decreases annually.",
                net_billing: "Export to Grid (Net Billing):",
                net_billing_desc: "Export Revenue = Exported Energy x FIT Price (ex: 1,624 VND). Defaults to Zero Export if price = 0.",
                two_part: "Two-Part Tariff (Demand Charge Saving):",
                two_part_desc: "Demand Charge Savings = (Original Pmax - Pmax after BESS) x Capacity Price (VND/kW/Month). Only applicable when BESS is configured."
            },
            assumptions: {
                title: "5. Other Cost Assumptions",
                escalation: "Energy Escalation (Inflation): 2.0% / year.",
                degradation: "Panel Degradation: 0.55% / year.",
                insurance: "System Insurance: 0.5% CAPEX / year.",
                inv_replace: "Inverter Replacement: Year 10 (10% System Capex).",
                bess_replace: "Battery Replacement: Year 10 (60% Battery Capex)."
            }
        }
    }[lang];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2"><Zap size={18} className="text-blue-600" /> {t.title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded transition"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

                    {/* 0. CHUAN HOA DU LIEU */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><Database size={14} className="text-teal-600" /> {t.data_processing.title}</h4>
                        <ul className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] text-slate-600 space-y-1.5 list-disc list-inside">
                            <li>{t.data_processing.desc1}</li>
                            <li>{t.data_processing.desc2}</li>
                        </ul>
                    </div>

                    {/* 0.1 AUTO SIZING */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><Cpu size={14} className="text-indigo-600" /> {t.auto_sizing.title}</h4>
                        <ul className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] text-slate-600 space-y-1.5 list-disc list-inside">
                            <li>{t.auto_sizing.desc_inv}</li>
                            <li>{t.auto_sizing.desc_bess}</li>
                        </ul>
                    </div>

                    {/* 0.2 WEATHER SIMULATOR */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><CloudRain size={14} className="text-sky-600" /> {t.weather.title}</h4>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] text-slate-600">
                            <p className="mb-1.5 text-slate-700">{t.weather.desc}</p>
                            <ul className="space-y-1 pl-4 border-l-2 border-sky-200 font-mono">
                                <li>☀️ {t.weather.normal}</li>
                                <li>🌦️ {t.weather.rainy}</li>
                                <li>🌧️ {t.weather.bad}</li>
                                <li>⛈️ {t.weather.extreme}</li>
                            </ul>
                        </div>
                    </div>

                    {/* 1. TY LE TU DUNG */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><Zap size={14} className="text-blue-600" /> {t.self_use.title}</h4>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] font-mono text-slate-700">
                            {t.self_use.formula}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 italic">{t.self_use.desc}</p>
                    </div>

                    {/* 1.1 TY LE CAT GIAM */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><Activity size={14} className="text-red-500" /> {t.curtailment.title}</h4>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] font-mono text-slate-700">
                            {t.curtailment.formula}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 italic">{t.curtailment.desc}</p>
                    </div>

                    {/* 1.2 AUTARKY RATE */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500" /> {t.autarky.title}</h4>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] font-mono text-slate-700">
                            {t.autarky.formula}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 italic">{t.autarky.desc}</p>
                    </div>

                    {/* 2. HIEU SUAT HE THONG */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><Activity size={14} className="text-emerald-600" /> {t.losses.title}</h4>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] space-y-1">
                            <div className="font-mono text-slate-700">System Derate = (1 - Temp) * (1 - Soiling) ... * (1 - Inverter)</div>
                            <div className="font-mono text-slate-700 font-bold">Total Eff = System Derate * Weather Derate (%)</div>
                            <div className="font-mono text-slate-700 mt-1">Loss Percent = (1 - Total Eff) * 100</div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 italic">{t.losses.desc} Thêm hệ số "Weather Derate" tùy chỉnh.</p>
                    </div>

                    {/* 3. LUU TRU BESS */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><BatteryCharging size={14} className="text-orange-600" /> {t.bess.title}</h4>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] space-y-1">
                            <div className="font-mono text-slate-700">{t.bess.charge}</div>
                            <div className="font-mono text-slate-700">{t.bess.discharge}</div>
                            <div className="font-mono text-slate-700 mt-1 font-bold">{t.bess.dod}</div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 italic">{t.bess.desc}</p>
                    </div>

                    {/* 3.1 PMAX & PEAK SHAVING */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><Activity size={14} className="text-indigo-600" /> {t.pmax.title}</h4>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] space-y-3">
                            <div>
                                <div className="font-mono font-bold text-blue-700">{t.pmax.pmax_origin}</div>
                                <p className="text-[11px] text-slate-600 mt-1">{t.pmax.pmax_desc}</p>
                            </div>
                            <div className="pt-2 border-t border-slate-200">
                                <div className="font-mono font-bold text-emerald-700">{t.pmax.pmax_bess}</div>
                                <p className="text-[11px] text-slate-600 mt-1">{t.pmax.pmax_bess_desc}</p>
                            </div>
                        </div>
                    </div>

                    {/* 4. TAI CHINH NPV (Advanced) */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><Coins size={14} className="text-purple-600" /> {t.finance.title}</h4>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] space-y-2">
                            <div>
                                <span className="font-bold text-slate-700 block mb-1">{t.finance.net_flow}</span>
                                <div className="pl-3 font-mono text-[11px] text-slate-600 border-l-2 border-slate-300">
                                    {t.finance.revenue} <br />
                                    - {t.finance.om} <br />
                                    - {t.finance.insurance} <br />
                                    - {t.finance.tax} <br />
                                    - {t.finance.loan} <br />
                                    - {t.finance.replacement}
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200">
                                <span className="font-bold text-slate-700 block mb-1">{t.finance.tax_title}</span>
                                <div className="font-mono text-[11px] text-slate-600 pl-3 border-l-2 border-slate-300">
                                    {t.finance.tax_formula} <br />
                                    {t.finance.tax_calc}
                                </div>
                                <p className="text-[11px] text-slate-500 italic mt-1">{t.finance.tax_desc}</p>
                            </div>

                            <div className="pt-2 border-t border-slate-200">
                                <span className="font-bold text-slate-700 block mb-1">{t.finance.efficiency}</span>
                                <div className="font-mono text-[11px] text-slate-600 pl-3 border-l-2 border-slate-300">
                                    NPV = Σ [ Net Cashflow / (1 + DiscountRate)^n ] <br />
                                    {t.finance.payback_desc} <br />
                                    {t.finance.irr} <br />
                                    {t.finance.lcoe}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4.1 ADVANCED FINANCE */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><Database size={14} className="text-pink-600" /> {t.advanced_finance.title}</h4>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] space-y-3">
                            <div>
                                <div className="font-mono font-bold text-rose-700">{t.advanced_finance.ppa}</div>
                                <p className="text-[11px] text-slate-600 mt-1">{t.advanced_finance.ppa_desc}</p>
                            </div>
                            <div className="pt-2 border-t border-slate-200">
                                <div className="font-mono font-bold text-indigo-700">{t.advanced_finance.loan}</div>
                                <p className="text-[11px] text-slate-600 mt-1">{t.advanced_finance.loan_desc}</p>
                            </div>
                            <div className="pt-2 border-t border-slate-200">
                                <div className="font-mono font-bold text-teal-700">{t.advanced_finance.net_billing}</div>
                                <p className="text-[11px] text-slate-600 mt-1">{t.advanced_finance.net_billing_desc}</p>
                            </div>
                            <div className="pt-2 border-t border-slate-200">
                                <div className="font-mono font-bold text-orange-700">{t.advanced_finance.two_part}</div>
                                <p className="text-[11px] text-slate-600 mt-1">{t.advanced_finance.two_part_desc}</p>
                            </div>
                        </div>
                    </div>

                    {/* 5. CAC CHI PHI KHAC */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><ShieldCheck size={14} className="text-slate-600" /> {t.assumptions.title}</h4>
                        <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">
                            <li>{t.assumptions.escalation}</li>
                            <li>{t.assumptions.degradation}</li>
                            <li>{t.assumptions.insurance}</li>
                            <li>{t.assumptions.inv_replace}</li>
                            <li>{t.assumptions.bess_replace}</li>
                        </ul>
                    </div>

                </div>
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-right">
                    <button onClick={onClose} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition shadow-sm">{t.btn_close}</button>
                </div>
            </div>
        </div>
    );
};
