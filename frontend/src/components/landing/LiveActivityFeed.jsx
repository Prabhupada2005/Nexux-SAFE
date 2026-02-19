import React, { useState, useEffect } from 'react';
import { Package, Truck, User, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LiveActivityFeed = () => {
    const [activities, setActivities] = useState([
        { id: 1, type: 'delivery', text: '120 meals delivered', loc: 'Imphal West', time: '2m ago' },
        { id: 2, type: 'supplier', text: 'New supplier joined', loc: 'Bishnupur', time: '5m ago' },
        { id: 3, type: 'request', text: 'Urgent request: 50L Water', loc: 'Thoubal', time: '12m ago' },
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            const newActivity = generateRandomActivity();
            setActivities(prev => [newActivity, ...prev.slice(0, 3)]);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    const generateRandomActivity = () => {
        const types = [
            { type: 'delivery', text: 'Relief dispatched', icon: Truck },
            { type: 'request', text: 'New aid request', icon: User },
            { type: 'stock', text: 'Stock updated', icon: Package },
            { type: 'alert', text: 'Route cleared', icon: Clock }
        ];
        const locs = ['Kakching', 'Ukhrul', 'Senapati', 'Churachandpur', 'Jiribam'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomLoc = locs[Math.floor(Math.random() * locs.length)];

        return {
            id: Date.now(),
            type: randomType.type,
            text: randomType.text,
            loc: randomLoc,
            time: 'Just now'
        };
    };

    const getIcon = (type) => {
        switch (type) {
            case 'delivery': return <Truck size={14} className="text-blue-500" />;
            case 'request': return <User size={14} className="text-orange-500" />;
            default: return <Package size={14} className="text-emerald-500" />;
        }
    };

    return (
        <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-xl border border-slate-200 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Live Network Activity
                </h3>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Real-time</span>
            </div>

            <div className="space-y-3 relative h-48 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white/90 to-transparent z-10 pointer-events-none"></div>
                <AnimatePresence initial={false} mode='popLayout'>
                    {activities.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: 'auto' }}
                            exit={{ opacity: 0, x: 20, height: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 24 }}
                            className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100"
                        >
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                                {getIcon(item.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{item.text}</p>
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] text-slate-500 font-medium truncate">{item.loc}</p>
                                    <p className="text-[10px] text-slate-400">{item.time}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>
            </div>
        </div>
    );
};

export default LiveActivityFeed;
