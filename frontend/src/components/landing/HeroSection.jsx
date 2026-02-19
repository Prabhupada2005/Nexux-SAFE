import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Info, ShieldCheck, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import LiveActivityFeed from './LiveActivityFeed';
import { useTranslation } from 'react-i18next';

const HeroSection = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <section className="relative pt-40 pb-24 px-6 overflow-hidden min-h-[90vh] flex items-center bg-white">
            {/* Subtle Background Pattern */}
            {/* Premium Background Elements */}
            <div className="absolute inset-0 bg-slate-50">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/80"></div>
            </div>

            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 relative z-10 items-center">

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-8"
                >
                    <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t('system_operational')}</span>
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                        {t('hero_title')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">{t('hero_subtitle')}</span>
                    </h1>

                    <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                        {t('hero_desc')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <button
                            onClick={() => navigate('/register')}
                            className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold text-base hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-1"
                        >
                            Get Started
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-base hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                        >
                            {t('learn_more')}
                            <Info className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-8 pt-6 border-t border-slate-100">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-slate-900">8+</span>
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{t('active_centers')}</span>
                        </div>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-slate-900">100%</span>
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{t('verified_source')}</span>
                        </div>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-slate-900">&lt;15m</span>
                            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{t('data_latency')}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Visual Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative"
                >
                    {/* Main Dashboard Mockup */}
                    <div className="relative z-10 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden ring-1 ring-slate-900/5">
                        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <div className="mx-auto bg-white border border-slate-200 px-3 py-1 rounded-md text-[10px] text-slate-400 font-mono">
                                safe-platform.org/dashboard/live
                            </div>
                        </div>
                        <div className="relative">
                            <img
                                src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1600&auto=format&fit=crop"
                                alt="Analytical Dashboard"
                                className="w-full h-[400px] object-cover opacity-90 grayscale-[20%]"
                            />
                            <div className="absolute inset-0 bg-slate-900/10"></div>

                            {/* Simulated UI Overlays */}
                            <div className="absolute top-6 left-6 bg-white/95 backdrop-blur p-4 rounded-lg shadow-lg border border-slate-100 max-w-[160px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity size={14} className="text-emerald-500" />
                                    <span className="text-xs font-bold text-slate-700">Stock Levels</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
                                    <div className="bg-emerald-500 h-full w-[70%]"></div>
                                </div>
                                <p className="text-[10px] text-slate-500 text-right">Updated 2m ago</p>
                            </div>
                        </div>
                    </div>

                    {/* Floating Logic Feed */}
                    <div className="absolute -bottom-6 -right-6 z-20 w-80 hidden lg:block shadow-2xl shadow-slate-300">
                        <LiveActivityFeed />
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;
