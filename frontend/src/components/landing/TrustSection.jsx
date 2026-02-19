import React from 'react';
import { Users, FileCheck, ShieldAlert, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const TrustSection = () => {

    const metrics = [
        { label: "Verified Partners", value: "Govt. & NGO", icon: FileCheck },
        { label: "Logistics Accuracy", value: "99.8%", icon: BarChart3 },
        { label: "Community Network", value: "50+ Hubs", icon: Users },
        { label: "Incident Response", value: "24/7 Monitored", icon: ShieldAlert }
    ];

    return (
        <section className="py-12 bg-slate-900 border-b border-slate-800 text-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-800/50">
                    {metrics.map((metric, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="flex flex-col items-center text-center px-4"
                        >
                            <metric.icon className="text-emerald-500 mb-3" size={24} />
                            <h3 className="text-lg font-bold text-white mb-1">{metric.value}</h3>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{metric.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustSection;
