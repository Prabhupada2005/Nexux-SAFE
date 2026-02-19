import React from 'react';
import { ShieldCheck, Package, Smartphone, Navigation, Languages, AlertTriangle, Map as MapIcon, Thermometer } from 'lucide-react';

const features = [
    {
        icon: Navigation,
        title: 'Intelligent Routing',
        desc: 'Dynamic route optimization algorithms that account for road hazards and conflict zones in real-time.',
    },
    {
        icon: ShieldCheck,
        title: 'Risk Management',
        desc: 'Automated threat assessment utilizing crowdsourced data and official reports to ensure convoy safety.',
    },
    {
        icon: Package,
        title: 'Smart Inventory Management',
        desc: 'Real-time tracking of relief supplies with automated low-stock alerts and predicted demand to prevent shortages.',
    },
    {
        icon: Smartphone,
        title: 'PWA Web Platform',
        desc: 'Universal access via any browser. No installation needed. Features offline mode and low-data usage for reliability.',
    },
    {
        icon: Languages,
        title: 'Native Multilingual',
        desc: 'Built-in support for regional languages including Manipuri (Meetei Mayek) and other languages to ensure inclusive communication.',
    },
    {
        icon: AlertTriangle,
        title: 'SOS Emergency Distress',
        desc: 'Instant distress signal generation for consumers in crisis, triggering immediate alerts to the nearest relief centers.',
    },
    {
        icon: MapIcon,
        title: 'Real-Time Crisis Visibility',
        desc: 'Suppliers can view active crisis zones and SOS alerts on a live map to prioritize supply distribution.',
    },
    {
        icon: Thermometer,
        title: 'IoT Quality Monitoring',
        desc: 'Automated spoilage detection using IoT sensors to track temperature and humidity of perishable stock.',
    }
];

const FeaturesSection = () => {
    return (
        <section id="features" className="py-24 px-6 bg-slate-50 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-emerald-100/50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-100/50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-20 text-center">
                    <span className="text-emerald-600 font-bold tracking-wider uppercase text-sm mb-3 block">System Capabilities</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                        Powering <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Resilient Logistics</span>
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Enterprise-grade features engineered for the chaos of disaster response, ensuring food security when it matters most.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(180px,auto)]">
                    {/* Feature 1: Intelligent Routing (Large) */}
                    <div className="col-span-1 md:col-span-2 row-span-2 group relative p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700"></div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                                <Navigation size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">Intelligent Routing Engine</h3>
                                <p className="text-slate-600 leading-relaxed text-lg">
                                    Adaptive pathfinding algorithms that avoid hazard zones, road blockages, and conflict areas in real-time. Ensures safe and fastest delivery of critical supplies.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2: SOS (Tall) */}
                    <div className="col-span-1 row-span-2 group relative p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden hover:-translate-y-2 transition-transform duration-300">
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10 h-full flex flex-col items-center text-center justify-center">
                            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 animate-pulse group-hover:animate-none border border-red-500/20">
                                <AlertTriangle size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Emergency SOS</h3>
                            <p className="text-slate-400 text-sm">Instant distress signal broadcast to nearest operational hubs.</p>
                            <button className="mt-6 px-6 py-2 bg-red-600 text-white rounded-full text-sm font-bold shadow-lg shadow-red-900/50 hover:bg-red-500 transition-colors">
                                Trigger Alert
                            </button>
                        </div>
                    </div>

                    {/* Feature 3: Inventory */}
                    <div className="group p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                <Package size={24} />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Smart Inventory</h3>
                        <p className="text-sm text-slate-600">Automated stock tracking with low-supply prediction.</p>
                    </div>

                    {/* Feature 4: Crisis Map */}
                    <div className="group p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                                <MapIcon size={24} />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Live Crisis Map</h3>
                        <p className="text-sm text-slate-600">Visual heatmaps of active shortage and danger zones.</p>
                    </div>

                    {/* Feature 6: PWA (Moved to maximize flow) */}
                    <div className="group p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">
                                <Smartphone size={24} />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Offline-First PWA</h3>
                        <p className="text-sm text-slate-600">Works on any device, even with unstable internet.</p>
                    </div>

                    {/* Feature 5: Multilingual (Wide) */}
                    <div className="col-span-1 md:col-span-2 group relative p-8 bg-gradient-to-r from-emerald-50 to-white rounded-3xl border border-emerald-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row items-center gap-6">
                        <div className="w-16 h-16 bg-white text-emerald-600 rounded-2xl flex items-center justify-center shadow-md shrink-0">
                            <Languages size={32} />
                        </div>
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Native Multilingual Support</h3>
                            <p className="text-slate-600 text-sm">Removing language barriers with built-in support for regional languages including Manipuri (Meetei Mayek), ensuring every request is understood.</p>
                        </div>
                    </div>

                    {/* Feature 7: Verified Sources (New) */}
                    <div className="group p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                                <ShieldCheck size={24} />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Verified Sources</h3>
                        <p className="text-sm text-slate-600">Strict verification protocols for all suppliers and volunteers.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
