import React from 'react';
import { Smartphone, Cpu, Map, PackageCheck, ArrowRight, ShieldCheck, BarChart } from 'lucide-react';
import { motion } from 'framer-motion';

const HowItWorks = () => {

    const steps = [
        {
            num: '01',
            title: 'Alert Reception',
            desc: 'System captures SOS signals or food requests via App, SMS, or IVR.',
            icon: Smartphone, // Imported
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            border: 'border-rose-200'
        },
        {
            num: '02',
            title: 'AI Verification',
            desc: 'AI filters spam and prioritizes requests based on urgency and location.',
            icon: Cpu, // Imported
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-200'
        },
        {
            num: '03',
            title: 'Smart Allocation',
            desc: 'Demand is matched with the nearest available surplus inventory automatically.',
            icon: PackageCheck, // Imported
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            border: 'border-purple-200'
        },
        {
            num: '04',
            title: 'Logistics Activation',
            desc: 'Optimal route generated. Driver assigned. Tracking link sent to user.',
            icon: Map, // Imported
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-200'
        },
        {
            num: '05',
            title: 'Secure Delivery',
            desc: 'Goods handed over via OTP/QR verification to ensure right beneficiary.',
            icon: ShieldCheck, // Imported
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200'
        },
        {
            num: '06',
            title: 'Impact Analytics',
            desc: 'Delivery data updates the Crisis Map for real-time relief monitoring.',
            icon: BarChart, // Imported
            color: 'text-cyan-600',
            bg: 'bg-cyan-50',
            border: 'border-cyan-200'
        }
    ];

    return (
        <section id="process" className="py-24 px-6 bg-slate-50 border-t border-slate-200">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4">
                        System Architecture
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Operational Workflow</h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        A seamless, automated protocol ensuring rapid response from distress signal to final delivery.
                    </p>
                </div>

                <div className="relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-0 w-full h-1 bg-gradient-to-r from-slate-200 via-emerald-200 to-slate-200 -z-10 rounded-full"></div>

                    <div className="grid md:grid-cols-3 gap-8 gap-y-16">
                        {steps.map((step, i) => (
                            <div key={i} className="relative group perspective-1000">
                                <div className={`w-24 h-24 mx-auto ${step.bg} rounded-full border-4 border-white shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative z-10 ring-1 ring-slate-100`}>
                                    <step.icon size={32} className={step.color} />
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold border-4 border-white shadow-sm">
                                        {step.num}
                                    </div>
                                </div>
                                <div className="text-center px-2">
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                                </div>
                                {/* Mobile Connector */}
                                {i < steps.length - 1 && (
                                    <div className="md:hidden w-0.5 h-12 bg-slate-200 mx-auto my-4"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>


            </div>
        </section>
    );
};

export default HowItWorks;
