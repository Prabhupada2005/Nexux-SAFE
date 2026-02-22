import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Siren, LogOut, Map as MapIcon, ShieldAlert, Radio, Activity, Globe, CheckCircle, XCircle, AlertTriangle, Clock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';

const EmergencyDashboard = () => {
    const { t, i18n } = useTranslation();
    const [riskZones, setRiskZones] = useState(() => {
        const saved = localStorage.getItem('emergency_riskZones');
        return saved ? JSON.parse(saved) : [];
    });
    const [pendingAlerts, setPendingAlerts] = useState(() => {
        const saved = localStorage.getItem('emergency_pendingAlerts');
        return saved ? JSON.parse(saved) : [];
    });
    const [allAlerts, setAllAlerts] = useState(() => {
        const saved = localStorage.getItem('emergency_allAlerts');
        return saved ? JSON.parse(saved) : [];
    });
    const [addresses, setAddresses] = useState({});
    const navigate = useNavigate();

    const getAddress = async (lat, lng, alertId) => {
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const addr = res.data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setAddresses(prev => ({ ...prev, [alertId]: addr }));
        } catch {
            setAddresses(prev => ({ ...prev, [alertId]: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }));
        }
    };

    const fetchData = () => {
        axios.get('http://localhost:8000/risk-zones').then(res => {
            setRiskZones(res.data);
            localStorage.setItem('emergency_riskZones', JSON.stringify(res.data));
        });
        axios.get('http://localhost:8000/sos-alerts/pending').then(res => {
            setPendingAlerts(res.data);
            localStorage.setItem('emergency_pendingAlerts', JSON.stringify(res.data));
            res.data.forEach(alert => getAddress(alert.lat, alert.lng, alert.id));
        });
        axios.get('http://localhost:8000/sos-alerts').then(res => {
            setAllAlerts(res.data);
            localStorage.setItem('emergency_allAlerts', JSON.stringify(res.data));
        });
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleVerify = async (alertId) => {
        try {
            await axios.post(`http://localhost:8000/sos-alerts/${alertId}/verify`);
            fetchData();
        } catch (err) {
            console.error('Verify failed:', err);
        }
    };

    const handleReject = async (alertId) => {
        try {
            await axios.post(`http://localhost:8000/sos-alerts/${alertId}/reject`);
            fetchData();
        } catch (err) {
            console.error('Reject failed:', err);
        }
    };

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
                <div className="w-96 bg-gray-800 border-r border-gray-700 p-4 space-y-4 overflow-y-auto">
                    <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
                        <h2 className="text-red-400 font-bold flex items-center gap-2 mb-3"><AlertTriangle size={18}/> Pending Alerts ({pendingAlerts.length})</h2>
                        {pendingAlerts.length === 0 ? (
                            <div className="text-sm text-gray-400">No pending alerts</div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {pendingAlerts.map(alert => (
                                    <div key={alert.id} className="bg-gray-900/50 p-3 rounded border border-red-500/30">
                                        <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                            <Clock size={12}/> {new Date(alert.timestamp).toLocaleString()}
                                        </div>
                                        <div className="text-sm font-semibold text-white mb-1">{alert.sender_name}</div>
                                        <div className="text-xs text-gray-300 mb-2">{alert.reason}</div>
                                        <div className="text-xs text-gray-500 mb-2">{addresses[alert.id] || 'Loading address...'}</div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleVerify(alert.id)} className="flex-1 bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs flex items-center justify-center gap-1">
                                                <CheckCircle size={12}/> Verify
                                            </button>
                                            <button onClick={() => handleReject(alert.id)} className="flex-1 bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs flex items-center justify-center gap-1">
                                                <XCircle size={12}/> Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-4 bg-gray-700/30 border border-gray-600 rounded-lg">
                        <h2 className="text-blue-400 font-bold flex items-center gap-2 mb-2"><Activity size={18}/> System Status</h2>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between"><span>Database:</span> <span className="text-green-400">Online</span></div>
                            <div className="flex justify-between"><span>Total Alerts:</span> <span className="text-yellow-400">{allAlerts.length}</span></div>
                            <div className="flex justify-between"><span>Pending:</span> <span className="text-orange-400">{pendingAlerts.length}</span></div>
                            <div className="flex justify-between"><span>Risk Zones:</span> <span className="text-red-400">{riskZones.length} Active</span></div>
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
                                        <b className="text-red-600 uppercase">DANGER ZONE</b><br/>
                                        {zone.reason}<br/>
                                        <span className="text-xs text-gray-600">Radius: {zone.radius}m</span>
                                    </div>
                                </Popup>
                            </Circle>
                        ))}
                        {allAlerts.filter(a => a.status === 'verified').map(alert => (
                            <Marker key={`alert-${alert.id}`} position={[alert.lat, alert.lng]} icon={L.divIcon({
                                className: 'custom-icon',
                                html: `<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 16px;">⚠</span></div>`
                            })}>
                                <Popup>
                                    <div>
                                        <b className="text-red-600">Verified Alert</b><br/>
                                        <span className="text-xs">{alert.sender_name}</span><br/>
                                        <span className="text-xs">{alert.reason}</span><br/>
                                        <span className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleString()}</span>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                    <div className="absolute top-4 right-4 z-[400] bg-black/80 text-white p-2 rounded text-xs border border-gray-600">
                        Live Strategic Map - {riskZones.length} Danger Zones
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmergencyDashboard;