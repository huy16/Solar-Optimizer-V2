import React from 'react';

export const StatCard = ({ icon: Icon, label, value, unit, subtext, colorClass = "text-gray-900", bgClass = "bg-white" }) => (
    <div className={`p-4 rounded-xl border border-slate-100 shadow-sm ${bgClass} transition hover:shadow-md`}>
        <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}><Icon size={20} className={colorClass.replace('text-', 'text-opacity-80 ')} /></div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
        </div>
        <div className="flex items-baseline gap-1"><div className={`text-2xl font-bold ${colorClass}`}>{value}</div><div className="text-xs text-slate-400 font-medium">{unit}</div></div>
        {subtext && <div className="text-[10px] text-slate-400 mt-1">{subtext}</div>}
    </div>
);
