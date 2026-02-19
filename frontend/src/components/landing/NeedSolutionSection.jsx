import React from 'react';
import { AlertTriangle, MapPin, Activity, ShieldCheck, Thermometer, Truck, Zap } from 'lucide-react';

const NeedSolutionSection = () => {
    const cards = [
        {
            icon: Truck,
            title: "Smart Logistics & Navigation",
            desc: "Locates nearest relief centers instantly with optimized safe routes.",
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            icon: AlertTriangle,
            title: "Real-Time Risk Detection",
            desc: "Identify danger zones early to prevent accidents during food transports.",
            color: "text-amber-600",
            bg: "bg-amber-50"
        },
        {
            icon: Thermometer,
            title: "Automated Food Safety",
            desc: "IoT Sensors monitor temperature, humidity, and gases to prevent food spoilage.",
            color: "text-emerald-600",
            bg: "bg-emerald-50"
        },
        {
            icon: Zap,
            title: "Rapid, Safe & Reliable Relief",
            desc: "Combines location intelligence and quality for faster, safer aid delivery.",
            color: "text-purple-600",
            bg: "bg-purple-50"
        }
    ];

    return (
        <section className="py-20 px-6 bg-white">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="text-center mb-16">
                    <span className="text-emerald-600 font-bold tracking-wider uppercase text-sm mb-2 block">NEXUS</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">The Need of a Smart Solution</h2>
                    <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        In Disaster situations, delayed logistics, unsafe routes, and spoiled food supplies can turn relief efforts into life-threatening risks.
                    </p>
                </div>

                {/* Grid Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                    {cards.map((card, idx) => (
                        <div key={idx} className="p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white group">
                            <div className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center mb-6 text-slate-700 group-hover:scale-110 transition-transform duration-300`}>
                                <card.icon size={28} className={card.color} />
                            </div>
                            <h3 className="font-bold text-xl text-slate-900 mb-3 leading-tight group-hover:text-emerald-700 transition-colors">{card.title}</h3>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">{card.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Comparison Section */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* Problem */}
                    <div className="bg-red-50/50 rounded-2xl p-8 border border-red-100">
                        <h3 className="text-xl font-bold text-red-900 mb-6 flex items-center gap-2">
                            <AlertTriangle size={20} className="text-red-600" />
                            Problem Today
                        </h3>
                        <ul className="space-y-4">
                            {[
                                "Inefficient monitoring",
                                "High food spoilage",
                                "Delayed response"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-red-800 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Solution */}
                    <div className="bg-emerald-50/50 rounded-2xl p-8 border border-emerald-100">
                        <h3 className="text-xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-emerald-600" />
                            What is Needed
                        </h3>
                        <ul className="space-y-4">
                            {[
                                "IoT Automation",
                                "Data-Driven response",
                                "Secure distribution"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-emerald-800 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer Quote */}
                <div className="text-center border-t border-slate-100 pt-10">
                    <p className="text-slate-500 italic font-medium">
                        "A significance amount of disaster relief food is lost due to poor storage and logistics"
                    </p>
                </div>

            </div>
        </section>
    );
};

export default NeedSolutionSection;
