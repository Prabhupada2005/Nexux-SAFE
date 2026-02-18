import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Siren, LogOut, Map as MapIcon, ShieldAlert, Radio, Activity, Globe 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';

const EmergencyDashboard = () => {
    const { t, i18n } = useTranslation();
    const [riskZones, setRiskZones] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch risk zones
        axios.get('http://localhost:8000/risk-zones').then(res => setRiskZones(res.data));
    }, []);

    const toggleLanguage = () => {
        const langs = ['en', 'hi', 'mni', 'or'];
        const current = langs.indexOf(i18n.language) > -1 ? langs.indexOf(i18n.language) : 0;
        const next = (current + 1) % langs.length;
        i18n.changeLanguage(langs[next]);
    };

    return (
        <div className="min-h-screen bg-gray-900 font-sans text-gray-100">
            <nav className="bg-red-900 text-white px-6 py-4 flex justify-between items-center shadow-lg border-b border-red-700">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold flex items-center gap-2 tracking-wider"><Siren className="animate-pulse"/> EMERGENCY COMMAND</h1>
                    <span className="text-xs bg-red-950 px-2 py-1 rounded text-red-200 border border-red-800">OFFICIAL USE ONLY</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={toggleLanguage} className="bg-red-800 px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold hover:bg-red-700">
                        <Globe size={14}/> {i18n.language === 'en' ? 'EN' : i18n.language === 'hi' ? 'HI' : i18n.language === 'mni' ? 'MNI' : 'OR'}
                    </button>
                    <button onClick={() => navigate('/login')} className="bg-red-800 hover:bg-red-700 px-4 py-2 rounded-lg flex gap-2 text-sm border border-red-700">
                        <LogOut size={16}/> {t('logout')}
                    </button>
                </div>
            </nav>

            <div className="flex h-[calc(100vh-70px)]">
                {/* Sidebar */}
                <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 space-y-4">
                    <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
                        <h2 className="text-red-400 font-bold flex items-center gap-2 mb-2"><Radio size={18}/> Active Alerts</h2>
                        <div className="text-sm text-gray-400">No active SOS signals detected.</div>
                    </div>
                    
                    <div className="p-4 bg-gray-700/30 border border-gray-600 rounded-lg">
                        <h2 className="text-blue-400 font-bold flex items-center gap-2 mb-2"><Activity size={18}/> System Status</h2>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between"><span>Database:</span> <span className="text-green-400">Online</span></div>
                            <div className="flex justify-between"><span>IoT Sensors:</span> <span className="text-green-400">Active</span></div>
                            <div className="flex justify-between"><span>Risk Zones:</span> <span className="text-yellow-400">{riskZones.length} Active</span></div>
                        </div>
                    </div>
                </div>

                {/* Main Map */}
                <div className="flex-1 relative">
                    <MapContainer center={[24.8170, 93.9368]} zoom={11} style={{ height: "100%", width: "100%" }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {riskZones.map(zone => (
                            <Circle 
                                key={zone.id} 
                                center={[zone.lat, zone.lng]} 
                                radius={zone.radius}
                                pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.4 }}
                            >
                                <Popup>
                                    <div className="text-center">
                                        <b className="text-red-600 uppercase">RISK ZONE</b><br/>
                                        {zone.reason}
                                    </div>
                                </Popup>
                            </Circle>
                        ))}
                    </MapContainer>
                    <div className="absolute top-4 right-4 z-[400] bg-black/80 text-white p-2 rounded text-xs border border-gray-600">
                        Live Strategic Map
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmergencyDashboard;