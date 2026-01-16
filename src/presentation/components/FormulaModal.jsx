import React from 'react';
import { Zap, Activity, BatteryCharging, Coins, ShieldCheck, X } from 'lucide-react';

export const FormulaModal = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2"><Zap size={18} className="text-blue-600" /> Bảng Các Công Thức Tính Toán</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1 rounded transition"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

                {/* 1. TY LE TU DUNG */}
                <div>
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><Zap size={14} className="text-blue-600" /> 1. Tỷ lệ tự dùng (Self-Consumption)</h4>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs font-mono text-slate-700">
                        Self-Consumption (%) = ( Tổng lượng Solar tự dùng / Tổng sản lượng Solar ) * 100
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 italic">Đánh giá bao nhiêu % điện mặt trời sinh ra được tiêu thụ tại chỗ (không bị phát ngược/cắt giảm).</p>
                </div>

                {/* 1.1 TY LE CAT GIAM */}
                <div>
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><Activity size={14} className="text-red-500" /> 1.1 Tỷ lệ cắt giảm (Curtailment Rate)</h4>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs font-mono text-slate-700">
                        Curtailment Rate (%) = ( Tổng lượng điện thừa bị giới hạn / Tổng sản lượng Solar ) * 100
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 italic">
                        Lượng điện thừa = Solar sinh ra - (Tải tiêu thụ + Sạc pin).<br />
                        Nếu không cho phép phát lưới (Zero Export), lượng điện thừa này sẽ bị Inverter tự động giảm công suất (Cắt giảm).
                    </p>
                </div>

                {/* 2. HIEU SUAT HE THONG */}
                <div>
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><Activity size={14} className="text-emerald-600" /> 2. Tổn thất Hệ thống (Losses)</h4>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs space-y-1">
                        <div className="font-mono text-slate-700">Total Derate = (1 - Temp) * (1 - Soiling) * (1 - Mismatch) * (1 - Ohmic) * (1 - Inverter)</div>
                        <div className="font-mono text-slate-700 mt-1">Loss Percent = (1 - Total Derate) * 100</div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 italic">Các hệ số mặc định: Temp (6.5%), Soiling (4.0%), Mismatch (1.5%), Ohmic (1.5%), Inverter (2.0%).</p>
                </div>

                {/* 3. LUU TRU BESS */}
                <div>
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><BatteryCharging size={14} className="text-orange-600" /> 3. Lưu trữ BESS (Mới cập nhật)</h4>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs space-y-1">
                        <div className="font-mono text-slate-700">Sạc thực tế = Năng lượng vào * Hiệu suất sạc (95%)</div>
                        <div className="font-mono text-slate-700">Xả thực tế = Năng lượng ra / Hiệu suất xả (95%)</div>
                        <div className="font-mono text-slate-700 mt-1 font-bold">Giới hạn xả sâu (DoD): 90% (Ngắt khi còn 10%)</div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 italic">Mô phỏng thực tế tổn thất năng lượng khi đi qua pin lưu trữ và bảo vệ tuổi thọ pin.</p>
                </div>

                {/* 4. TAI CHINH NPV (Advanced) */}
                <div>
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><Coins size={14} className="text-purple-600" /> 4. Chỉ số Tài chính (Nâng cao)</h4>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs space-y-2">
                        <div>
                            <span className="font-bold text-slate-700 block mb-1">Dòng tiền ròng (Net Cashflow) =</span>
                            <div className="pl-3 font-mono text-xs text-slate-600 border-l-2 border-slate-300">
                                Doanh thu (Tiết kiệm điện) <br />
                                - Chi phí O&M (Vận hành) <br />
                                - Phí Bảo hiểm (Insurance 0.5%) <br />
                                - Thuế TNDN (CIT 20%) <br />
                                - Chi phí Thay thế (Pin & Inverter)
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                            <span className="font-bold text-slate-700 block mb-1">Thuế TNDN (Corporate Tax):</span>
                            <div className="font-mono text-xs text-slate-600 pl-3 border-l-2 border-slate-300">
                                Thu nhập chịu thuế = Doanh thu - O&M - Bảo hiểm - Khấu hao (20 năm)<br />
                                Thuế phải nộp = Max(0, Thu nhập chịu thuế * 20%)
                            </div>
                            <p className="text-[10px] text-slate-500 italic mt-1">Khấu hao tài sản cố định đóng vai trò là "Lá chắn thuế" (Tax Shield) giúp giảm thuế phải đóng.</p>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                            <span className="font-bold text-slate-700 block mb-1">Chỉ số Hiệu quả:</span>
                            <div className="font-mono text-xs text-slate-600 pl-3 border-l-2 border-slate-300">
                                NPV = Σ [ Net Cashflow / (1 + DiscountRate)^n ] <br />
                                Payback = Thời gian để Tổng dòng tiền tích lũy {'>'}= 0
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. CAC CHI PHI KHAC */}
                <div>
                    <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-1.5 flex items-center gap-2"><ShieldCheck size={14} className="text-slate-600" /> 5. Các giả định Chi phí khác</h4>
                    <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">
                        <li><strong>Lạm phát năng lượng (Escalation):</strong> 2.0% / năm.</li>
                        <li><strong>Suy hao tấm pin (Degradation):</strong> 0.55% / năm.</li>
                        <li><strong>Bảo hiểm hệ thống:</strong> 0.5% CAPEX / năm.</li>
                        <li><strong>Thay Inverter:</strong> Năm thứ 10 (10% System Capex).</li>
                        <li><strong>Thay Pin lưu trữ:</strong> Năm thứ 10 (60% Battery Capex).</li>
                    </ul>
                </div>

            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-right">
                <button onClick={onClose} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition shadow-sm">Đóng</button>
            </div>
        </div>
    </div>
);
