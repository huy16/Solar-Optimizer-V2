import { Info } from 'lucide-react';

export const StatCard = ({ icon: Icon, label, value, unit, subtext, colorClass = "text-gray-900", bgClass = "bg-white", tip }) => (
    <div className={`p-5 rounded-2xl border border-slate-100 shadow-sm ${bgClass} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] group cursor-default relative z-10 bg-gradient-to-br from-white to-slate-50/50`}>
        <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10 transition-colors group-hover:bg-opacity-20`}>
                <Icon size={22} className={`${colorClass} transition-transform group-hover:scale-110`} />
            </div>
            <div className="flex-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                    {label}
                    {tip && (
                        <div className="group/tip relative ml-1">
                            <Info size={12} className="text-slate-300 hover:text-blue-500 cursor-help transition-colors" />
                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-[100] font-normal leading-tight normal-case tracking-normal shadow-xl">
                                {tip}
                                <div className="absolute top-full right-1 border-4 border-transparent border-t-slate-800"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        <div className="flex items-baseline gap-1.5">
            <div className={`text-2xl font-black tracking-tight ${colorClass}`}>{value}</div>
            <div className="text-[11px] text-slate-400 font-bold">{unit}</div>
        </div>
        {subtext && <div className="text-[10px] text-slate-400 mt-2 font-medium bg-slate-100/50 px-2 py-0.5 rounded-full w-fit">{subtext}</div>}
    </div>
);
