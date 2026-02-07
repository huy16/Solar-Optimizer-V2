import React, { useState, useRef, useEffect } from 'react';
import { Upload, Zap, Sun, BarChart3, FileSpreadsheet, ArrowRight, CheckCircle2, Globe, FileText } from 'lucide-react';
import { BillInputModal } from './BillInputModal';
import casLogo from '../../assets/cas_logo.png';

// Import Slides (as JPG)
import slide1 from '../../assets/slides/dong_nai_agri.jpg';
import slide2 from '../../assets/slides/ninh_thuan_wind.jpg';
import slide4 from '../../assets/slides/cas_regreen.jpg';
import slide5 from '../../assets/slides/bach_hoa_xanh.jpg';
import slide6 from '../../assets/slides/dien_may_xanh.jpg';

const SLIDE_TRANSLATIONS = {
    vi: [
        { id: 1, title: 'Nhà máy CAS REGreen với EcoSolar', sub: 'Năng lượng tái tạo, Phát triển dự án' },
        { id: 2, title: 'Hệ thống Bách Hóa XANH', sub: 'Năng lượng tái tạo, Phát triển dự án' },
        { id: 3, title: 'Hệ thống Điện Máy XANH', sub: 'Năng lượng tái tạo, Phát triển dự án' },
        { id: 5, title: 'Nông nghiệp kết hợp Solar Ninh Thuận', sub: 'Năng lượng tái tạo, Phát triển dự án' },
        { id: 6, title: 'Nông nghiệp kết hợp Solar Đồng Nai', sub: 'Năng lượng tái tạo, Phát triển dự án' },
    ],
    en: [
        { id: 1, title: 'CAS REGreen Factory With EcoSolar', sub: 'Renewable Energy, Projects Development' },
        { id: 2, title: 'Bach Hoa XANH Stores', sub: 'Renewable Energy, Projects Development' },
        { id: 3, title: 'Dien May XANH Stores', sub: 'Renewable Energy, Projects Development' },
        { id: 5, title: 'Ninh Thuan Agri-PV Farm', sub: 'Renewable Energy, Projects Development' },
        { id: 6, title: 'Dong Nai Agri-PV Farm', sub: 'Renewable Energy, Projects Development' },
    ]
};

const SLIDES_BASE = [
    { id: 1, img: slide4 },
    { id: 2, img: slide5 },
    { id: 3, img: slide6 },
    { id: 5, img: slide2 },
    { id: 6, img: slide1 },
];

const TRANSLATIONS = {
    vi: {
        platform: "Nền tảng Quản lý Năng lượng v2.0",
        headline_prefix: "Tối ưu vận hành,",
        headline_highlight: "Dẫn dắt chuyển dịch xanh",
        headline_suffix: "",
        description: "",
        btn_profile_sub: "Đã có dữ liệu?",
        btn_profile_main: "Chọn file Load Profile",
        btn_bill_sub: "Chưa có dữ liệu?",
        btn_bill_main: "Nhập Hóa đơn EVN",
        feature_1: "Phân tích hệ thống thông minh",
        feature_2: "Tối ưu hóa Pin lưu trữ (BESS)",
        feature_3: "Báo cáo chuẩn ESG & Tài chính",
        bill_modal_title: "Nhập Hóa đơn Tiền điện",
        stats: [
            { label: "Năm kinh nghiệm", value: "20+" },
            { label: "Dự án triển khai", value: "500+" },
            { label: "Giảm phát thải", value: "1000+", unit: "tấn CO2" }
        ]
    },
    en: {
        platform: "Solar Management Platform v2.0",
        headline_prefix: "Optimize your business,",
        headline_highlight: "Lead the green transition",
        headline_suffix: "",
        description: "",
        btn_profile_sub: "Have data?",
        btn_profile_main: "Select Load Profile",
        btn_bill_sub: "No data?",
        btn_bill_main: "Input EVN Bill",
        feature_1: "Smart System Analysis",
        feature_2: "BESS Optimization",
        feature_3: "ESG & Financial Reports",
        bill_modal_title: "Input Electricity Bill",
        stats: [
            { label: "Years Experience", value: "20+" },
            { label: "Projects Completed", value: "500+" },
            { label: "Carbon Reduction", value: "1000+", unit: "tons CO2" }
        ]
    }
};

export const SmartDesignSelector = ({ onSelect, lang, setLang }) => {
    const [showBillModal, setShowBillModal] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const fileInputRef = useRef(null);

    const t = TRANSLATIONS[lang];
    const slides = SLIDES_BASE.map((s, idx) => ({
        ...s,
        ...SLIDE_TRANSLATIONS[lang][idx]
    }));

    // Auto-advance slides
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % slides.length);
        }, 5000); // 5 Seconds per slide
        return () => clearInterval(timer);
    }, [slides.length]);

    const handleBillComplete = (monthlyData, profileType, options) => {
        setShowBillModal(false);
        onSelect('manual', monthlyData, profileType, options);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onSelect('profile', file);
        }
    };

    return (
        <div className="w-full h-screen bg-slate-50 flex items-center justify-center p-6 md:p-12 overflow-hidden relative font-sans">

            {/* Dynamic Mesh Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {/* Animated Gradient Mesh */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/60 to-orange-50/40 animate-gradient-xy bg-[length:400%_400%]"></div>

                {/* Floating Blobs */}
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-sky-200/40 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-0"></div>
                <div className="absolute top-[20%] right-[0%] w-[40%] h-[60%] bg-blue-100/40 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[0%] left-[20%] w-[30%] h-[40%] bg-indigo-200/40 rounded-full blur-[80px] mix-blend-multiply animate-blob animation-delay-4000"></div>

                {/* Subtle Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '32px 32px' }}
                ></div>
            </div>

            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-50">
                <button
                    onClick={() => setLang(prev => prev === 'vi' ? 'en' : 'vi')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full shadow-sm border border-slate-200 transition-all text-sm font-bold text-slate-600 hover:text-blue-600"
                >
                    <Globe size={16} />
                    <span>{lang === 'vi' ? 'TIẾNG VIỆT' : 'ENGLISH'}</span>
                </button>
            </div>

            {showBillModal && (
                <BillInputModal
                    onClose={() => setShowBillModal(false)}
                    onComplete={handleBillComplete}
                    title={t.bill_modal_title}
                    lang={lang}
                />
            )}

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".xlsx,.xls,.csv,.met,.pdf"
            />

            <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">

                {/* Left Column: Content */}
                <div className="flex flex-col">
                    <div className="space-y-6">
                        {/* Logo Section - Stagger 1 */}
                        <div className="w-48 md:w-60 group perspective-1000 animate-fade-in-up [animation-delay:0ms]">
                            <img
                                src={casLogo}
                                alt="CAS Energy"
                                className="w-full h-auto drop-shadow-sm transition-all duration-500 transform group-hover:scale-105 group-hover:drop-shadow-xl group-hover:-translate-y-1"
                            />
                        </div>

                        {/* Headline - Stagger 3 */}
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.1] tracking-tight animate-fade-in-up [animation-delay:400ms]">
                            {t.headline_prefix}<br />
                            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-sky-500 to-blue-600 bg-[length:200%_auto] animate-gradient-x py-1">
                                {t.headline_highlight}
                                {/* Underline decoration */}
                                <svg className="absolute w-full h-3 -bottom-1 left-0 text-blue-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" opacity="0.4" />
                                </svg>
                            </span> {t.headline_suffix}
                        </h1>

                        {/* Description - Stagger 4 */}
                        <p className="text-base md:text-lg text-slate-600 max-w-xl leading-relaxed font-normal animate-fade-in-up [animation-delay:600ms]">
                            {t.description}
                        </p>

                        {/* Brand Stats Section */}
                        <div className="grid grid-cols-3 gap-8 pt-4 pb-2 animate-fade-in-up [animation-delay:700ms]">
                            {t.stats.map((stat, i) => (
                                <div key={i} className="flex flex-col border-l-2 border-blue-500 pl-4 py-1">
                                    <div className="text-2xl font-black text-slate-800 tracking-tight">{stat.value}</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</div>
                                    {stat.unit && <div className="text-[9px] text-blue-600 font-medium italic mt-0.5">{stat.unit}</div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-2 animate-fade-in-up [animation-delay:800ms]">
                        {/* Primary Button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="group relative overflow-hidden bg-gradient-to-r from-[#004e92] to-[#000428] hover:from-[#005FA3] hover:to-[#002a5c] text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                            <div className="flex items-center gap-3 relative z-10">
                                <span className="p-1.5 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors"><Upload size={20} /></span>
                                <div className="text-left">
                                    <div className="text-xs font-normal opacity-80">{t.btn_profile_sub}</div>
                                    <div className="text-sm md:text-base">{t.btn_profile_main}</div>
                                </div>
                                <ArrowRight className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" size={18} />
                            </div>
                        </button>

                        {/* Secondary Button */}
                        <button
                            onClick={() => setShowBillModal(true)}
                            className="group bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-300 px-8 py-4 rounded-2xl font-bold shadow-lg shadow-blue-50 transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="flex items-center gap-3">
                                <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors"><FileText size={20} /></span>
                                <div className="text-left">
                                    <div className="text-xs font-normal text-slate-400 group-hover:text-blue-700/70">{t.btn_bill_sub}</div>
                                    <div className="text-sm md:text-base text-slate-800 group-hover:text-blue-800">{t.btn_bill_main}</div>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="pt-6 border-t border-slate-200/60 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-slate-500 animate-fade-in-up [animation-delay:1000ms]">
                        <div className="flex items-center gap-2 whitespace-nowrap"><CheckCircle2 size={16} className="text-blue-500" /> {t.feature_1}</div>
                        <div className="flex items-center gap-2 whitespace-nowrap"><CheckCircle2 size={16} className="text-blue-500" /> {t.feature_2}</div>
                        <div className="flex items-center gap-2 whitespace-nowrap"><CheckCircle2 size={16} className="text-blue-500" /> {t.feature_3}</div>
                    </div>
                </div>

                {/* Right Column: Automated Slideshow */}
                <div className="hidden lg:block relative">
                    {/* Floating Elements decoration */}
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-blue-400 to-sky-500 rounded-2xl shadow-2xl opacity-80 skew-y-6 animate-float-slow z-0"></div>
                    <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-gradient-to-br from-blue-400 to-sky-500 rounded-full shadow-xl opacity-80 animate-float-delayed z-20"></div>

                    {/* FIX: Removed rotation here (was rotate-[-2deg]) */}
                    <div className="relative bg-white/40 backdrop-blur-xl border border-white/50 p-2 rounded-3xl shadow-2xl shadow-blue-900/10 transform transition-transform duration-700 ease-out z-10 hover:z-20">
                        <div className="relative rounded-[20px] overflow-hidden border border-white/60 shadow-inner group bg-slate-100 aspect-video">

                            {/* Glass Sheen / Mirror Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent z-20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none skew-x-12 opacity-80"></div>

                            {/* Slides */}
                            {slides.map((slide, index) => (
                                <div
                                    key={slide.id}
                                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                >
                                    <img
                                        src={slide.img}
                                        alt={slide.title}
                                        className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-105 transition-transform duration-[8s] ease-linear"
                                    />

                                    {/* Overlay Content */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-16">
                                        <div className="transform translate-y-0 transition-all duration-700">
                                            <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">{slide.sub}</div>
                                            <div className="font-bold text-white text-lg md:text-xl leading-tight">{slide.title}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Slide Indicators */}
                            <div className="absolute top-4 right-4 z-20 flex gap-1.5 bg-black/30 backdrop-blur-sm p-1.5 rounded-full">
                                {slides.map((_, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setCurrentSlide(idx)}
                                        className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${idx === currentSlide ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/80'}`}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
