import React from 'react';
import { Globe, Languages, Accessibility, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MultilingualSection = () => {
    const { t } = useTranslation();

    return (
        <section className="py-20 px-6 bg-white border-t border-slate-100">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-6">
                        <Globe size={14} />
                        <span>Inclusive Design</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-6">Built for Every Community</h2>
                    <p className="text-slate-600 mb-8 leading-relaxed text-lg">
                        Effective crisis response requires clear communication. SAFE removes language barriers by providing a fully localized interface for diverse regional communities, including <strong>Hindi, Manipuri, Assamese, Bengali, Odia, and Tamil</strong>.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                                <span className="text-xl">A/अ</span>
                                <span>English / Hindi</span>
                            </div>
                            <p className="text-xs text-slate-500">Universal Interface</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                                <span className="text-xl">ꯃꯤꯇꯩꯂꯣꯟ</span>
                                <span>Manipuri (Meitei)</span>
                            </div>
                            <p className="text-xs text-slate-500">Regional Support</p>
                        </div>

                    </div>

                    <a href="#" className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
                        View Accessibility Report <ChevronRight size={16} />
                    </a>
                </div>

                <div className="bg-slate-900 rounded-2xl p-1 shadow-2xl border border-slate-700 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
                    <div className="bg-slate-800/50 p-3 flex items-center justify-between">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">safe-translate-v2.0</div>
                    </div>

                    <div className="p-6 space-y-6 font-mono relative">
                        {/* Source */}
                        <div className="relative">
                            <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                INPUT_SOURCE [EN]
                            </div>
                            <div className="p-4 bg-slate-800/50 rounded-lg border-l-2 border-blue-500 text-slate-300">
                                "Emergency supplies arriving at Sector 4 in 15 mins."
                            </div>
                        </div>

                        {/* Processing Arrow */}
                        <div className="flex justify-center -my-2 opacity-50">
                            <ChevronRight className="rotate-90 text-slate-600" />
                        </div>

                        {/* Target */}
                        <div className="relative">
                            <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                OUTPUT_TARGET [{t('demo_status_label').split('(')[1]?.replace(')', '') || 'DETECTED'}]
                            </div>
                            <div className="p-4 bg-emerald-900/20 rounded-lg border-l-2 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                "{t('demo_status_text')}"
                                <span className="inline-block w-2 h-4 bg-emerald-500 ml-2 animate-pulse align-middle"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MultilingualSection;
