import React from 'react';
import { Database, RefreshCw, Server, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const OfflineSection = () => {
    return (
        <section className="py-24 px-6 bg-slate-50 border-y border-slate-200" id="network">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="inline-flex items-center gap-2 text-emerald-700 font-bold uppercase tracking-widest text-xs mb-4">
                        <Server size={14} />
                        <span>Infrastructure Reliability</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                        Engineered for <br />
                        Unstable Environments
                    </h2>

                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                        Standard web platforms fail when connectivity drops. SAFE utilizes Progressive Web App (PWA) architecture to ensure critical logistics data remains accessible to field operatives regardless of network conditions.
                    </p>

                    <div className="space-y-6">
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm text-emerald-600">
                                <Database size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-base">Local Data Persistence</h4>
                                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                    Maps, inventory, and route data are cached locally on the device, allowing full operational capability without an active internet connection.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm text-blue-600">
                                <RefreshCw size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-base">Intelligent Synchronization</h4>
                                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                    Field inputs are queued securely and synchronized automatically with the central server the moment connectivity is restored.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm text-purple-600">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-base">Zero-Installation Deployment</h4>
                                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                    Deployable instantly via any modern browser without store downloads or heavy installations.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 relative"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Database size={120} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-6">System Architecture</h3>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-bold text-slate-700">Core Services</span>
                                    <span className="text-xs text-emerald-600 font-mono">ONLINE</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full text-xs"></div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-bold text-slate-700">Local Cache</span>
                                    <span className="text-xs text-emerald-600 font-mono">SYNCED</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full w-full"></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                            <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-bold text-slate-700">Field Network</span>
                                    <span className="text-xs text-orange-600 font-mono">INTERMITTENT</span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">PWA Protocol Active: Data queueing enabled.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400 font-mono">System Status: r.2.4.1-stable</p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default OfflineSection;
