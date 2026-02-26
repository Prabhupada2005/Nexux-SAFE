import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Siren, LogOut, Map as MapIcon, ShieldAlert, Radio, Activity, Globe, CheckCircle, XCircle, AlertTriangle, Clock, WifiOff 
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
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const getAddress = async (lat, lng, alertId) => {
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const addr = res.data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setAddresses(prev => ({ ...prev, [alertId]: addr }));
        } catch {
            setAddresses(prev => ({ ...prev, [alertId]: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }));
        }
    };

    const fetchData = async () => {
        try {
          const [invRes, reqRes, msgRes, riskRes] = await Promise.all([
            axios.get('http://localhost:8000/inventory'),
            axios.get('http://localhost:8000/food-requests'),
            // Notice we removed the IoT axios call here!
            axios.get('http://localhost:8000/messages'),
            axios.get('http://localhost:8000/risk-zones')
          ]);
    
          setInventory(invRes.data);
          setRequests(reqRes.data);
          if (msgRes.data.length !== messages.length) {
              setMessages(msgRes.data.reverse());
          }
          setRiskZones(riskRes.data);
          setLastSync(new Date());
        } catch (err) { console.error("Sync Error:", err); }
      };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Inject translations for Emergency Dashboard
    useEffect(() => {
        if (i18n.addResourceBundle) {
            i18n.addResourceBundle('hi', 'translation', {
                'offline_msg': 'ऑफ़लाइन मोड - लाइव अपडेट रुके हुए हैं', 'logout': 'लॉग आउट'
            }, true, true);

            i18n.addResourceBundle('mni', 'translation', {
                'offline_msg': 'ꯑꯣꯐꯂꯥꯏꯟ ꯃꯣꯗ - ꯂꯥꯏꯕ ꯑꯞꯗꯦꯠ ꯂꯦꯞꯂꯤ', 'logout': 'ꯂꯣꯒ ꯑꯥꯎꯠ'
            }, true, true);

            i18n.addResourceBundle('or', 'translation', {
                'offline_msg': 'ଅଫଲାଇନ୍ ମୋଡ୍ - ଲାଇଭ୍ ଅପଡେଟ୍ ବନ୍ଦ ଅଛି', 'logout': 'ଲଗ୍ ଆଉଟ୍'
            }, true, true);
        }
    }, [i18n]);

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

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.removeItem('foodtech_user');
            navigate('/login');
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-900 font-sans text-gray-100 p-4 md:p-0 overflow-hidden">
            {/* Offline Indicator */}
            {!isOnline && (
                <div className="absolute top-0 left-0 w-full bg-red-600/90 backdrop-blur-md text-white py-1 px-4 text-center text-xs font-bold z-[100] flex items-center justify-center gap-2 border-b border-red-500/50">
                    <WifiOff size={14} />
                    {t('offline_msg', "OFFLINE MODE - Live updates paused")}
                </div>
            )}

            <div className="flex-1 flex flex-col relative overflow-hidden rounded-3xl md:rounded-none shadow-2xl md:shadow-none bg-gray-800 w-full h-full border border-gray-700 md:border-none">
            <nav className="bg-red-900 text-white px-4 py-3 md:px-6 md:py-4 flex flex-col md:flex-row justify-between items-center shadow-lg border-b border-red-700 gap-3 md:gap-0">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <h1 className="text-xl font-bold flex items-center gap-2 tracking-wider"><Siren className="animate-pulse"/> EMERGENCY COMMAND</h1>
                    <span className="text-xs bg-red-950 px-2 py-1 rounded text-red-200 border border-red-800">OFFICIAL USE ONLY</span>
                </div>
                <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
                    <button onClick={toggleLanguage} className="bg-red-800 px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold hover:bg-red-700">
                        <Globe size={14}/> {i18n.language === 'en' ? 'EN' : i18n.language === 'hi' ? 'HI' : i18n.language === 'mni' ? 'MNI' : 'OR'}
                    </button>
                    <button onClick={handleLogout} className="bg-red-800 hover:bg-red-700 px-4 py-2 rounded-lg flex gap-2 text-sm border border-red-700">
                        <LogOut size={16}/> {t('logout')}
                    </button>
                </div>
            </nav>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-full md:w-96 h-[40%] md:h-full bg-gray-800 border-r border-gray-700 p-4 space-y-4 overflow-y-auto order-2 md:order-1">
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
                <div className="flex-1 relative h-[60%] md:h-full order-1 md:order-2">
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
        </div>
    );
};

export default EmergencyDashboard;