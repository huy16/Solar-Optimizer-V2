import React from 'react';

export const StatCard = ({ icon: Icon, label, value, unit, subtext, colorClass = "text-gray-900", bgClass = "bg-white" }) => (
    <div className={`p-5 rounded-2xl border border-slate-100 shadow-sm ${bgClass} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] group cursor-default relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50`}>
        <div className="flex items-center gap-3 mb-3">
            <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10 transition-colors group-hover:bg-opacity-20`}>
                <Icon size={22} className={`${colorClass} transition-transform group-hover:scale-110`} />
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
        </div>
        <div className="flex items-baseline gap-1.5">
            <div className={`text-2xl font-black tracking-tight ${colorClass}`}>{value}</div>
            <div className="text-[11px] text-slate-400 font-bold">{unit}</div>
        </div>
        {subtext && <div className="text-[10px] text-slate-400 mt-2 font-medium bg-slate-100/50 px-2 py-0.5 rounded-full w-fit">{subtext}</div>}
    </div>
);
