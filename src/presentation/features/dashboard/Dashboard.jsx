import React from 'react';
import { ResponsiveContainer, ComposedChart, Area, Bar, Line, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ScatterChart, Scatter, AreaChart } from 'recharts';
import { Sun, Zap, TrendingUp, PieChart, BatteryCharging, Info } from 'lucide-react';
import { StatCard } from '../../components/StatCard';

export const Dashboard = ({
    customStats,
    formatNumber,
    params,
    bessKwh,
    averageDayData,
    solarMetadata,
    correlationData,
    monthlyDetails,
    monthlyPowerCurves
}) => {
    if (!customStats) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Sun} label="Sản lượng PV" value={formatNumber(customStats.totalSolarGen / 1000)} unit="MWh/năm" colorClass="text-emerald-600" bgClass="bg-white" />
                <StatCard icon={Zap} label="Năng lượng Solar" value={formatNumber(customStats.totalUsed / 1000)} unit="MWh/năm" subtext={`${(customStats.totalUsed / customStats.totalSolarGen * 100).toFixed(1)}% Hiệu suất`} colorClass="text-blue-600" bgClass="bg-white" />
                <StatCard icon={TrendingUp} label="Tiết kiệm" value={formatNumber(((customStats.totalUsed * params.priceNormal) - (customStats.totalGridCharge * params.priceOffPeak)) / 1000000)} unit="Triệu VNĐ" colorClass="text-indigo-600" bgClass="bg-white" />
                <StatCard icon={PieChart} label="Tự dùng" value={(customStats.selfConsumptionRate * 100).toFixed(1)} unit="%" colorClass="text-amber-600" bgClass="bg-white" />
            </div>

            {/* BESS Overview Chart */}
            {bessKwh > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <BatteryCharging size={20} className="text-emerald-600" />
                        Biểu đồ Điều độ Năng lượng (Solar - Load - BESS)
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={averageDayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSolarBess" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorLoadDispatch" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val) => [`${Math.round(val)} kW`]} />
                                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} iconSize={10} />

                                <Area type="monotone" dataKey="solarProfile" name="Solar" fill="url(#colorSolarBess)" stroke="#f59e0b" strokeWidth={2} />
                                <Bar dataKey="avgBessCharge" name="BESS Sạc" fill="#10b981" barSize={20} stackId="bess" />
                                <Bar dataKey="avgBessDischarge" name="BESS Xả" fill="#f43f5e" barSize={20} stackId="bess" />
                                <Area type="monotone" dataKey="avgLoad" name="Phụ tải (Load)" stroke="#3b82f6" strokeWidth={3} fill="url(#colorLoadDispatch)" dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {solarMetadata && (solarMetadata.sourceType === 'MET_SYNTHETIC' || (solarMetadata.sourceType && solarMetadata.sourceType.includes('PDF'))) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3"><Info className="text-amber-600 shrink-0 mt-0.5" size={18} /><div><h4 className="font-bold text-amber-800 text-sm">Đang sử dụng dữ liệu Tổng hợp (Synthetic)</h4><p className="text-xs text-amber-700 mt-1">File dữ liệu (PDF/MET) chứa dữ liệu tháng. Hệ thống đã tự động đọc dữ liệu <strong>Tổng xạ tháng (GlobalH)</strong> để tái tạo lại biểu đồ nắng giả lập (Synthetic Profile). Kết quả mô phỏng sẽ chính xác theo sản lượng tháng, nhưng biểu đồ giờ là giả lập (Sine wave).</p></div></div>
                )}

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-800">Phân tích Tương thích Phụ tải & Solar</h3><div className="flex gap-2"><div className="flex items-center gap-1 text-xs text-slate-500"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> T2-T7</div><div className="flex items-center gap-1 text-xs text-slate-500"><span className="w-3 h-3 bg-red-500 rounded-full"></span> CN</div><div className="flex items-center gap-1 text-xs text-slate-500"><span className="w-3 h-3 bg-purple-600 rounded-full"></span> Solar</div></div></div>
                    <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={averageDayData}><defs><linearGradient id="colorWeekdayOverview" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient><linearGradient id="colorWeekendOverview" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient><linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} /><stop offset="95%" stopColor="#9333ea" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#94a3b8" /><YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" /><RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /><Area type="monotone" dataKey="weekday" stroke="#3b82f6" fill="url(#colorWeekdayOverview)" fillOpacity={1} name="Load T2-T7" /><Area type="monotone" dataKey="weekend" stroke="#ef4444" fill="url(#colorWeekendOverview)" fillOpacity={1} name="Load CN" /><Area type="monotone" dataKey="solarProfile" stroke="#9333ea" fill="url(#colorSolar)" strokeWidth={3} fillOpacity={1} dot={false} name="Solar TB" /></ComposedChart></ResponsiveContainer></div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Tương quan Load và Solar</h3>
                    <div className={`grid gap-6 ${bessKwh > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                        {/* 1. Original Load vs Solar */}
                        <div className="h-64 w-full">
                            <h4 className="text-xs font-semibold text-slate-500 mb-2 text-center uppercase">Load Consumption vs Solar</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" dataKey="solar" name="Solar" unit="kW" tick={{ fontSize: 10 }} label={{ value: 'Solar Generation (kW)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                                    <YAxis type="number" dataKey="load" name="Load" unit="kW" tick={{ fontSize: 10 }} label={{ value: 'Load Consumption (kW)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                                    <Scatter name="Load" data={correlationData} fill="#8884d8" fillOpacity={0.5} />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>

                        {/* 2. New Grid Import vs Solar (BESS Active) */}
                        {bessKwh > 0 && (
                            <div className="h-64 w-full border-l border-slate-100 pl-4 md:pl-6">
                                <h4 className="text-xs font-semibold text-slate-500 mb-2 text-center uppercase">Grid Import vs Solar (with BESS)</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" dataKey="solar" name="Solar" unit="kW" tick={{ fontSize: 10 }} label={{ value: 'Solar Generation (kW)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                                        <YAxis type="number" dataKey="gridImport" name="Grid Import" unit="kW" tick={{ fontSize: 10 }} label={{ value: 'Grid Import (kW)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                                        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                                        <Scatter name="Grid Import" data={correlationData} fill="#10b981" fillOpacity={0.5} />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Tổng quan Năng lượng Hàng tháng</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyDetails}>
                                <defs>
                                    <linearGradient id="colorUsedDashboard" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.8} /><stop offset="100%" stopColor="#059669" stopOpacity={0.8} /></linearGradient>
                                    <linearGradient id="colorCurtailedDashboard" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} /><stop offset="100%" stopColor="#b91c1c" stopOpacity={0.8} /></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val) => formatNumber(Number(val))} />
                                <Legend wrapperStyle={{ paddingTop: '5px', fontSize: '10px' }} />
                                <Bar dataKey="used" stackId="solar" name="Năng lượng Solar (Sử dụng)" fill="url(#colorUsedDashboard)" />
                                <Bar dataKey="curtailed" stackId="solar" name="Cắt giảm (Dư thừa)" fill="url(#colorCurtailedDashboard)" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="load" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, strokeWidth: 1 }} name="Tổng Tải (Load)" />
                                <Area type="monotone" dataKey="gridImport" fill="#64748b" stroke="#64748b" fillOpacity={0.1} strokeDasharray="5 5" strokeWidth={2} name="Mua lưới (Import)" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Biểu đồ Load & Solar 12 Tháng</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {monthlyPowerCurves.map((mItem, idx) => (
                            <div key={idx} className="border border-slate-200 rounded p-2 bg-slate-50 h-48">
                                <div className="text-xs font-bold text-slate-500 mb-1 text-center uppercase">{mItem.month}</div>
                                <div className="h-32 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={mItem.data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id={`colorWeekdaySmallDb-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id={`colorWeekendSmallDb-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id={`colorSolarSmallDb-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="hour" tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} interval={6} tickFormatter={(val) => `${val}h`} />
                                            <YAxis tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} width={25} tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                                            <RechartsTooltip contentStyle={{ fontSize: '10px', padding: '4px', borderRadius: '4px', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} labelStyle={{ display: 'none' }} formatter={(val) => `${Math.round(Number(val))} kW`} />
                                            <Area type="monotone" dataKey="weekday" stroke="#3b82f6" strokeWidth={1.5} fill={`url(#colorWeekdaySmallDb-${idx})`} dot={false} />
                                            <Area type="monotone" dataKey="weekend" stroke="#ef4444" strokeWidth={1.5} fill={`url(#colorWeekendSmallDb-${idx})`} dot={false} strokeDasharray="3 3" />
                                            <Area type="monotone" dataKey="solar" stroke="#eab308" strokeWidth={1.5} fill={`url(#colorSolarSmallDb-${idx})`} dot={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center items-center gap-2 mt-1 w-full text-[9px] text-slate-500">
                                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> T2-T7</div>
                                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> CN</div>
                                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div> Solar</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
