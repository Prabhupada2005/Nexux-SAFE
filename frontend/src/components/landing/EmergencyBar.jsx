import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmergencyBar = () => {
    const [activeAlert, setActiveAlert] = useState(0);

    const alerts = [
        { type: 'success', text: "All relief routes operational in Imphal East", icon: CheckCircle2 },
        { type: 'warning', text: "2 centers require urgent supply - Bishnupur Sector", icon: AlertCircle },
        { type: 'info', text: "New supplier joined from Churachandpur", icon: CheckCircle2 }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveAlert((prev) => (prev + 1) % alerts.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-slate-900 text-white text-xs md:text-sm py-2 overflow-hidden relative z-[60]">
            <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-bold tracking-wider text-emerald-400 uppercase text-[10px] md:text-xs">System Live</span>
                </div>

                <div className="flex-1 mx-4 md:mx-12 h-5 relative">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={activeAlert}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute w-full flex justify-center items-center gap-2"
                        >
                            {React.createElement(alerts[activeAlert].icon, {
                                size: 14,
                                className: alerts[activeAlert].type === 'warning' ? 'text-red-400' : 'text-emerald-400'
                            })}
                            <span className="font-medium truncate">{alerts[activeAlert].text}</span>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="hidden md:flex gap-4 text-slate-400 text-xs">
                    <span>Updates: Real-time</span>
                    <span>Priority: High</span>
                </div>
            </div>
        </div>
    );
};

export default EmergencyBar;
