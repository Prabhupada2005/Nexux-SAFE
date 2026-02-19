import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

const ContactSection = () => {
    return (
        <section id="contact" className="py-24 px-6 bg-slate-900 text-white">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16">
                <div>
                    <h2 className="text-3xl font-bold mb-6">Emergency Coordination</h2>
                    <p className="text-slate-400 mb-10 text-lg leading-relaxed">
                        For immediate logistical support or to report critical shortages, contact our 24/7 command center.
                    </p>

                    <div className="space-y-8">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-emerald-600/20 text-emerald-500 rounded-lg flex items-center justify-center shrink-0 border border-emerald-500/30">
                                <Phone size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Crisis Hotline (Toll Free)</p>
                                <p className="text-2xl font-bold text-white mt-1">1800-SAFE-HELP</p>
                                <p className="text-xs text-slate-500 mt-1">Available 24/7</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-600/20 text-blue-500 rounded-lg flex items-center justify-center shrink-0 border border-blue-500/30">
                                <Mail size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Support Desk</p>
                                <p className="text-xl font-bold text-white mt-1">coordination@safe.org</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-lg flex items-center justify-center shrink-0 border border-slate-700">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Headquarter</p>
                                <p className="text-lg font-bold text-white mt-1">Imphal Langol, Manipur</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
                    <h3 className="text-xl font-bold mb-6">Logistics Inquiry</h3>
                    <form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300">Full Name</label>
                                <input type="text" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500 text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300">Organization</label>
                                <input type="text" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500 text-white" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Email Address</label>
                            <input type="email" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500 text-white" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Inquiry Type</label>
                            <select className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500 text-white">
                                <option>Relief Supply Request</option>
                                <option>Logistics Support</option>
                                <option>Volunteer Registration</option>
                                <option>Technical Issue</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Message</label>
                            <textarea rows="4" className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500 text-white resize-none"></textarea>
                        </div>
                        <button className="w-full py-4 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors">
                            Submit Inquiry
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;
