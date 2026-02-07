import React from 'react';
import { Zap, Activity, BatteryCharging, Coins, ShieldCheck, X } from 'lucide-react';

export const FormulaModal = ({ onClose, lang }) => {
    const t = {
        vi: {
            title: "Bảng Các Công Thức Tính Toán",
            btn_close: "Đóng",
            self_use: {
                title: "1. Tỷ lệ tự dùng (Self-Consumption)",
                formula: "Self-Consumption (%) = ( Tổng lượng Solar tự dùng / Tổng sản lượng Solar ) * 100",
                desc: "Đánh giá bao nhiêu % điện mặt trời sinh ra được tiêu thụ tại chỗ (không bị phát ngược/cắt giảm)."
            },
            curtailment: {
                title: "1.1 Tỷ lệ cắt giảm (Curtailment Rate)",
                formula: "Curtailment Rate (%) = ( Tổng lượng điện thừa bị giới hạn / Tổng sản lượng Solar ) * 100",
                desc: "Lượng điện thừa = Solar sinh ra - (Tải tiêu thụ + Sạc pin). Nếu không cho phép phát lưới (Zero Export), lượng điện thừa này sẽ bị Inverter tự động giảm công suất (Cắt giảm)."
            },
            losses: {
                title: "2. Tổn thất Hệ thống (Losses)",
                desc: "Các hệ số mặc định: Temp (6.5%), Soiling (4.0%), Mismatch (1.5%), Ohmic (1.5%), Inverter (2.0%)."
            },
            bess: {
                title: "3. Lưu trữ BESS (Mới cập nhật)",
                charge: "Sạc thực tế = Năng lượng vào * Hiệu suất sạc (95%)",
                discharge: "Xả thực tế = Năng lượng ra / Hiệu suất xả (95%)",
                dod: "Giới hạn xả sâu (DoD): 90% (Ngắt khi còn 10%)",
                desc: "Mô phỏng thực tế tổn thất năng lượng khi đi qua pin lưu trữ và bảo vệ tuổi thọ pin."
            },
            finance: {
                title: "4. Chỉ số Tài chính (Nâng cao)",
                net_flow: "Dòng tiền ròng (Net Cashflow) =",
                revenue: "Doanh thu (Tiết kiệm điện)",
                om: "Chi phí O&M (Vận hành)",
                insurance: "Phí Bảo hiểm (Insurance 0.5%)",
                tax: "Thuế TNDN (CIT 20%)",
                replacement: "Chi phí Thay thế (Pin & Inverter)",
                tax_title: "Thuế TNDN (Corporate Tax):",
                tax_formula: "Thu nhập chịu thuế = Doanh thu - O&M - Bảo hiểm - Khấu hao (20 năm)",
                tax_calc: "Thuế phải nộp = Max(0, Thu nhập chịu thuế * 20%)",
                tax_desc: "Khấu hao tài sản cố định đóng vai trò là \"Lá chắn thuế\" (Tax Shield) giúp giảm thuế phải đóng.",
                efficiency: "Chỉ số Hiệu quả:",
                payback_desc: "Payback = Thời gian để Tổng dòng tiền tích lũy >= 0"
            },
            assumptions: {
                title: "5. Các giả định Chi phí khác",
                escalation: "Lạm phát năng lượng (Escalation): 2.0% / năm.",
                degradation: "Suy hao tấm pin (Degradation): 0.55% / năm.",
                insurance: "Bảo hiểm hệ thống: 0.5% CAPEX / năm.",
                inv_replace: "Thay Inverter: Năm thứ 10 (10% System Capex).",
                bess_replace: "Thay Pin lưu trữ: Năm thứ 10 (60% Battery Capex)."
            }
        },
        en: {
            title: "Calculation Formulas",
            btn_close: "Close",
            self_use: {
                title: "1. Self-Consumption Rate",
                formula: "Self-Consumption (%) = ( Total Solar Consumed / Total Solar Yield ) * 100",
                desc: "Evaluates what % of generated solar power is consumed on-site (not exported or curtailed)."
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
            finance: {
                title: "4. Financial Metrics (Advanced)",
                net_flow: "Net Cashflow =",
                revenue: "Revenue (Power Savings)",
                om: "O&M Costs (Operational)",
                insurance: "Insurance Fee (0.5%)",
                tax: "Corporate Income Tax (CIT 20%)",
                replacement: "Replacement Costs (Battery & Inverter)",
                tax_title: "Corporate Tax (CIT):",
                tax_formula: "Taxable Income = Revenue - O&M - Insurance - Depreciation (20 years)",
                tax_calc: "Tax Due = Max(0, Taxable Income * 20%)",
                tax_desc: "Fixed asset depreciation acts as a \"Tax Shield\", reducing the taxable amount.",
                efficiency: "Performance Indices:",
                payback_desc: "Payback = Time when Cumulative Cashflow >= 0"
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

                    {/* 1. TY LE TU DUNG */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><Zap size={14} className="text-blue-600" /> {t.self_use.title}</h4>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs font-mono text-slate-700">
                            {t.self_use.formula}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 italic">{t.self_use.desc}</p>
                    </div>

                    {/* 1.1 TY LE CAT GIAM */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><Activity size={14} className="text-red-500" /> {t.curtailment.title}</h4>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs font-mono text-slate-700">
                            {t.curtailment.formula}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 italic">{t.curtailment.desc}</p>
                    </div>

                    {/* 2. HIEU SUAT HE THONG */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><Activity size={14} className="text-emerald-600" /> {t.losses.title}</h4>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs space-y-1">
                            <div className="font-mono text-slate-700">Total Derate = (1 - Temp) * (1 - Soiling) * (1 - Mismatch) * (1 - Ohmic) * (1 - Inverter)</div>
                            <div className="font-mono text-slate-700 mt-1">Loss Percent = (1 - Total Derate) * 100</div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 italic">{t.losses.desc}</p>
                    </div>

                    {/* 3. LUU TRU BESS */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><BatteryCharging size={14} className="text-orange-600" /> {t.bess.title}</h4>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs space-y-1">
                            <div className="font-mono text-slate-700">{t.bess.charge}</div>
                            <div className="font-mono text-slate-700">{t.bess.discharge}</div>
                            <div className="font-mono text-slate-700 mt-1 font-bold">{t.bess.dod}</div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 italic">{t.bess.desc}</p>
                    </div>

                    {/* 4. TAI CHINH NPV (Advanced) */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><Coins size={14} className="text-purple-600" /> {t.finance.title}</h4>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs space-y-2">
                            <div>
                                <span className="font-bold text-slate-700 block mb-1">{t.finance.net_flow}</span>
                                <div className="pl-3 font-mono text-xs text-slate-600 border-l-2 border-slate-300">
                                    {t.finance.revenue} <br />
                                    - {t.finance.om} <br />
                                    - {t.finance.insurance} <br />
                                    - {t.finance.tax} <br />
                                    - {t.finance.replacement}
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200">
                                <span className="font-bold text-slate-700 block mb-1">{t.finance.tax_title}</span>
                                <div className="font-mono text-xs text-slate-600 pl-3 border-l-2 border-slate-300">
                                    {t.finance.tax_formula} <br />
                                    {t.finance.tax_calc}
                                </div>
                                <p className="text-[10px] text-slate-500 italic mt-1">{t.finance.tax_desc}</p>
                            </div>

                            <div className="pt-2 border-t border-slate-200">
                                <span className="font-bold text-slate-700 block mb-1">{t.finance.efficiency}</span>
                                <div className="font-mono text-xs text-slate-600 pl-3 border-l-2 border-slate-300">
                                    NPV = Σ [ Net Cashflow / (1 + DiscountRate)^n ] <br />
                                    {t.finance.payback_desc}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. CAC CHI PHI KHAC */}
                    <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><ShieldCheck size={14} className="text-slate-600" /> {t.assumptions.title}</h4>
                        <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">
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
