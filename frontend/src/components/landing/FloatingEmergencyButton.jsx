import React, { useState } from 'react';
import { AlertTriangle, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingEmergencyButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const [formData, setFormData] = useState({
        location: '',
        type: 'Food Packets',
        quantity: '',
        contact: ''
    });

    const handleBroadcast = () => {
        if (!formData.location || !formData.contact) {
            alert("Please fill in Location and Contact Number.");
            return;
        }

        // Valid Indian Mobile Number check (Starts with 6,7,8,9)
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(formData.contact.replace(/\D/g, ''))) {
            alert("Please enter a valid Indian Mobile Number (10 digits, starting with 6-9).");
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSent(true);
            setTimeout(() => {
                setSent(false);
                setIsOpen(false);
                setFormData({ location: '', type: 'Food Packets', quantity: '', contact: '' });
            }, 3000);
        }, 2000);
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-4 rounded-full shadow-[0_10px_30px_rgba(225,29,72,0.4)] flex items-center gap-3 font-bold animate-pulse hover:animate-none group border border-red-400/50 backdrop-blur-sm"
            >
                <AlertTriangle className="animate-bounce" />
                <span className="hidden md:inline drop-shadow-md">Request Emergency Food</span>
                <span className="md:hidden">SOS</span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white/95 backdrop-blur-xl rounded-3xl p-0 w-full max-w-md shadow-2xl relative overflow-hidden border border-white/50"
                        >
                            {loading && (
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-rose-400 to-red-500 animate-loading-bar z-20"></div>
                            )}

                            {/* Premium Header */}
                            <div className="bg-gradient-to-br from-slate-50 to-white p-6 border-b border-slate-100 flex justify-between items-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-inner border border-red-100">
                                        <AlertTriangle size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Emergency SOS</h3>
                                        <p className="text-xs text-red-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                            Live Channel
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors relative z-10"
                                >
                                    <X size={20} className="text-slate-400 hover:text-slate-600" />
                                </button>
                            </div>

                            <div className="p-6">
                                {sent ? (
                                    <div className="text-center py-8">
                                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100 border border-emerald-100">
                                            <Send size={36} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-2">SOS Broadcasted!</h3>
                                        <p className="text-slate-500">Help is on the way. Keep your phone line open.</p>
                                        <div className="mt-6 inline-block px-4 py-2 bg-slate-50 rounded-full text-xs font-mono text-slate-400 border border-slate-100">
                                            ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl text-sm text-red-800 flex items-start gap-3">
                                            <div className="mt-0.5 min-w-[4px] h-[4px] rounded-full bg-red-500"></div>
                                            Priority Alert: Your request will be routed to the nearest operational control room immediately.
                                        </div>

                                        <div className="space-y-4">
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    placeholder="Your Location / Drop Point"
                                                    value={formData.location}
                                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-semibold text-slate-800 focus:border-red-400 focus:ring-4 focus:ring-red-100 outline-none transition-all placeholder:text-slate-400"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <select
                                                    value={formData.type}
                                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 appearance-none"
                                                >
                                                    <option>Food Packets</option>
                                                    <option>Water</option>
                                                    <option>Baby Food</option>
                                                    <option>Medical Aid</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    placeholder="Qty"
                                                    value={formData.quantity}
                                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 placeholder:text-slate-400"
                                                />
                                            </div>

                                            <input
                                                type="tel"
                                                placeholder="Contact Number (10 digits)"
                                                value={formData.contact}
                                                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 placeholder:text-slate-400"
                                            />
                                        </div>

                                        <button
                                            onClick={handleBroadcast}
                                            disabled={loading}
                                            className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                                        >
                                            {loading ? 'Broadcasting Signal...' : (
                                                <>
                                                    <Send size={20} />
                                                    Broadcast SOS
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FloatingEmergencyButton;
