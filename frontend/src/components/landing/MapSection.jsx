import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Clock, Package } from 'lucide-react';

// Fix Leaflet default icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const FOOD_CENTERS = [
    { id: 1, name: "Moirang Bazar Food Center", lat: 24.5167, lng: 93.7667, items: 45, status: 'active' },
    { id: 2, name: "Imphal Community Kitchen", lat: 24.8170, lng: 93.9368, items: 62, status: 'active' },
    { id: 3, name: "Thoubal Relief Center", lat: 24.6340, lng: 93.9856, items: 38, status: 'low' },
    { id: 4, name: "Churachandpur Hub", lat: 24.3333, lng: 93.6833, items: 52, status: 'active' },
    { id: 5, name: "Kakching Distribution", lat: 24.4980, lng: 93.9810, items: 12, status: 'critical' },
    { id: 6, name: "Ukhrul Relief Station", lat: 25.0500, lng: 94.3600, items: 29, status: 'low' },
];

const MapSection = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate map loading
        const timer = setTimeout(() => setLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const getMarkerColor = (status) => {
        switch (status) {
            case 'active': return '#10b981'; // emerald-500
            case 'low': return '#eab308'; // yellow-500
            case 'critical': return '#ef4444'; // red-500
            default: return '#3b82f6';
        }
    };

    const createCustomIcon = (status) => {
        const color = getMarkerColor(status);
        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
        background: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 8px; height: 8px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
      </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        });
    };

    return (
        <section className="py-24 px-6 bg-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block mb-4"
                    >
                        <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100">
                            Live Coverage
                        </span>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-black text-slate-900 mb-6"
                    >
                        Real-Time Relief Map
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-600 max-w-2xl mx-auto"
                    >
                        Interactive visualization of active food centers, stock levels, and safe routes across the crisis region.
                    </motion.p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Map Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="lg:col-span-2 bg-slate-100 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 h-[500px] relative"
                    >
                        {loading ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 animate-pulse">
                                <MapPin className="w-12 h-12 text-slate-300 mb-4" />
                                <p className="text-slate-400 font-medium">Loading geospatial data...</p>
                            </div>
                        ) : (
                            <MapContainer center={[24.75, 93.95]} zoom={9} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                />
                                {FOOD_CENTERS.map(center => (
                                    <Marker
                                        key={center.id}
                                        position={[center.lat, center.lng]}
                                        icon={createCustomIcon(center.status)}
                                    >
                                        <Popup className="custom-popup">
                                            <div className="p-1">
                                                <h3 className="font-bold text-slate-800 text-sm mb-1">{center.name}</h3>
                                                <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                                                    <Package size={12} />
                                                    <span>{center.items} Items Stock</span>
                                                </div>
                                                <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full inline-block ${center.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                        center.status === 'low' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {center.status === 'active' ? 'Operational' : center.status === 'low' ? 'Low Stock' : 'Critical Low'}
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        )}
                    </motion.div>

                    {/* Sidebar Stats */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Navigation className="w-5 h-5 text-blue-500" />
                                Live Stats
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                    <span className="text-sm text-slate-600 font-medium">Active Centers</span>
                                    <span className="text-lg font-bold text-emerald-600">8</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                    <span className="text-sm text-slate-600 font-medium">People Served</span>
                                    <span className="text-lg font-bold text-blue-600">1,240+</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                    <span className="text-sm text-slate-600 font-medium">Avg Response</span>
                                    <span className="text-lg font-bold text-purple-600">~12m</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-lg text-white">
                            <Clock className="w-8 h-8 mb-4 opacity-80" />
                            <h3 className="text-xl font-bold mb-2">Routes Optimized</h3>
                            <p className="text-emerald-100 text-sm mb-4">
                                AI-driven route planning avoids conflict zones and flooded areas in real-time.
                            </p>
                            <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition-colors">
                                View Logistics Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MapSection;
