import React, { useState } from 'react';
import { supabase } from '../../../infra/supabaseClient';
import { Lock, Mail, Loader2, Zap, ArrowRight } from 'lucide-react';
import casLogo from '../../../assets/cas_logo_new.png';

const LoginPage = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            onLoginSuccess(data.user);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans">

            {/* Background Image - HD from Unsplash */}
            <div className="absolute inset-0">
                <img
                    src="https://plus.unsplash.com/premium_photo-1679917152396-4b18accacb9d?w=1920&auto=format&fit=crop&q=90"
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center 60%' }}
                />
                {/* Dark Overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-slate-900/40 to-black/55"></div>
            </div>

            {/* Subtle floating particles */}
            {[...Array(4)].map((_, i) => (
                <div key={i} className="absolute rounded-full" style={{
                    width: `${4 + i * 2}px`,
                    height: `${4 + i * 2}px`,
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.3)' : 'rgba(245,158,11,0.4)',
                    left: `${20 + i * 18}%`,
                    top: `${25 + (i % 3) * 20}%`,
                    animation: `float ${6 + i * 2}s ease-in-out infinite ${i * 1}s`,
                    filter: 'blur(1px)'
                }}></div>
            ))}

            <div className="w-full max-w-[420px] px-6 relative z-10">
                {/* Main Card */}
                <div className="rounded-[28px] p-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent">
                    <div className="bg-[#0f172a]/80 backdrop-blur-2xl rounded-[27px] p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)]">

                        {/* Logo Area */}
                        <div className="flex flex-col items-center mb-5 text-center">
                            {/* Company Logo */}
                            <div className="relative mb-[2px] leading-none">
                                <div className="relative w-[160px] h-[40px] flex items-center justify-center">
                                    <img src={casLogo} alt="CAS Logo" className="max-w-full max-h-full object-contain filter drop-shadow-sm" />
                                </div>
                            </div>

                            <h1 className="text-[26px] font-extrabold tracking-tight leading-none animate-gradient-x select-none" style={{
                                backgroundImage: 'linear-gradient(90deg, #ffffff 0%, #fbd38d 25%, #ffffff 50%, #fbd38d 75%, #ffffff 100%)',
                                backgroundSize: '200% auto',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                color: 'transparent',
                                display: 'block'
                            }}>SOLAR OPTIMIZER</h1>
                            <p className="text-slate-500 text-[13px] mt-0.5 font-medium tracking-wide">CAS Energy Solutions</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
                                <div className="relative group">
                                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                                        <Mail className="text-slate-600 group-focus-within:text-amber-400 transition-colors duration-300" size={17} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(245,158,11,0.08)] transition-all duration-300"
                                        placeholder="name@company.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Mật khẩu</label>
                                <div className="relative group">
                                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                                        <Lock className="text-slate-600 group-focus-within:text-amber-400 transition-colors duration-300" size={17} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(245,158,11,0.08)] transition-all duration-300"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-500/8 border border-red-500/15 text-red-400 text-[12px] px-4 py-3 rounded-xl flex items-center gap-2.5">
                                    <Zap size={14} className="shrink-0" />
                                    <span>{error === 'Invalid login credentials' ? 'Email hoặc mật khẩu không chính xác' : error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative overflow-hidden disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-[0_8px_24px_-4px_rgba(245,158,11,0.35)] transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2.5 mt-3 group"
                                style={{
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <span className="text-sm tracking-wider">ĐĂNG NHẬP</span>
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="mt-10 pt-6 border-t border-white/[0.06] text-center">
                            <p className="text-slate-600 text-[11px] tracking-wide">
                                © 2026 CAS Energy Solutions • Solar Optimizer v2.0
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
