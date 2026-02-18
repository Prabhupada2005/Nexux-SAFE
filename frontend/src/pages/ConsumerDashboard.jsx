import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, MessageCircle, Send, Bot, Utensils, ThumbsUp, Globe, Mic, MicOff, AlertTriangle, Navigation, Truck 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useTranslation } from 'react-i18next';

// --- Icon Config ---
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const FOOD_CENTERS = [
    {id: 1, name:"Moirang Bazar Food Center", address:"Moirang Bazar, Bishnupur", lat:24.5167, lng:93.7667, status:"open", crowd: "High", items: 45, cookedFood: true},
    {id: 2, name:"Imphal Community Kitchen", address:"Thangal Bazar, Imphal West", lat:24.8170, lng:93.9368, status:"open", crowd: "Low", items: 62, cookedFood: true},
    {id: 3, name:"Thoubal Relief Center", address:"Thoubal Bazar, Thoubal", lat:24.6340, lng:93.9856, status:"open", crowd: "Medium", items: 38, cookedFood: true},
    {id: 4, name:"Churachandpur Food Hub", address:"Tuibong, Churachandpur", lat:24.3333, lng:93.6833, status:"open", crowd: "Low", items: 52, cookedFood: true},
    {id: 5, name:"Kakching Distribution Center", address:"Kakching Khunou, Kakching", lat:24.4980, lng:93.9810, status:"open", crowd: "Medium", items: 41, cookedFood: false},
    {id: 6, name:"Ukhrul Relief Station", address:"Ukhrul Town, Ukhrul", lat:25.0500, lng:94.3600, status:"open", crowd: "High", items: 29, cookedFood: true},
    {id: 7, name:"Senapati Emergency Kitchen", address:"Senapati Bazar, Senapati", lat:25.2667, lng:94.0167, status:"open", crowd: "Low", items: 55, cookedFood: true},
    {id: 8, name:"Jiribam Food Point", address:"Jiribam Town, Jiribam", lat:24.8050, lng:93.1100, status:"open", crowd: "Medium", items: 34, cookedFood: false},
];

const ConsumerDashboard = () => {
    const { t, i18n } = useTranslation();
    const [userLoc, setUserLoc] = useState(null);
    const [centers] = useState(FOOD_CENTERS);
    const navigate = useNavigate();
    const chatEndRef = useRef(null);

    // Modal & Feature States
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [reqItem, setReqItem] = useState({ name: '', quantity: '1' });
    const [feedbackText, setFeedbackText] = useState('');
    const [isListening, setIsListening] = useState(false);
    
    // Routing States
    const [routePath, setRoutePath] = useState([]); // Stores the road coordinates
    const [routeInfo, setRouteInfo] = useState(null); // Stores distance/duration
    const [truckPosition, setTruckPosition] = useState(null); // Live truck location
    const [truckProgress, setTruckProgress] = useState(0); // 0-100% progress

    // Chat States
    const [activeChat, setActiveChat] = useState(null); 
    const [msgText, setMsgText] = useState("");
    const [supplierMessages, setSupplierMessages] = useState([]);
    const [aiMessages, setAiMessages] = useState([{ sender: 'AI Bot', content: 'Hello! I am your FoodTech Assistant.', self: false }]);

    const toggleLanguage = () => {
        const langs = ['en', 'hi', 'mni', 'or'];
        const current = langs.indexOf(i18n.language) > -1 ? langs.indexOf(i18n.language) : 0;
        const next = (current + 1) % langs.length;
        i18n.changeLanguage(langs[next]);
    };

    const scrollToBottom = () => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(() => { scrollToBottom(); }, [supplierMessages, aiMessages, activeChat]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => alert("Please enable location for routing.")
            );
        }
        const interval = setInterval(() => {
            axios.get('http://localhost:8000/messages').then(res => setSupplierMessages(res.data.reverse()));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // --- Voice Command ---
    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { alert("Browser not supported."); return; }
        const recognition = new SpeechRecognition();
        recognition.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-US';
        setIsListening(true);
        recognition.start();

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const numberMatch = transcript.match(/(\d+)/);
            let quantity = '1';
            let name = transcript;
            if (numberMatch) {
                quantity = numberMatch[0];
                name = transcript.replace(quantity, '').replace('kg', '').replace('litres', '').trim();
            }
            setReqItem({ name: name, quantity: quantity });
            setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);
    };

    const handleSOS = async () => { if (confirm("Send SOS?")) alert(t('sos_sent')); };

    // --- FETCH DYNAMIC ROAD ROUTE (OSRM API) ---
    const getRoadRoute = async (start, end) => {
        try {
            // OSRM Public API (Free, No Key Needed)
            const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
            const response = await axios.get(url);
            
            if (response.data.routes && response.data.routes.length > 0) {
                const route = response.data.routes[0];
                
                // Convert [lon, lat] to [lat, lon] for Leaflet
                const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                setRoutePath(coordinates);
                
                // Set Info
                setRouteInfo({
                    distance: (route.distance / 1000).toFixed(1) + " km",
                    duration: (route.duration / 60).toFixed(0) + " min"
                });

                // Start truck animation from food center
                setTruckPosition(coordinates[0]);
                setTruckProgress(0);
                animateTruck(coordinates);
            }
        } catch (error) {
            console.error("Routing Error:", error);
            // Fallback to straight line if API fails
            setRoutePath([[start.lat, start.lng], [end.lat, end.lng]]);
        }
    };

    // Animate truck moving along route
    const animateTruck = (coordinates) => {
        let step = 0;
        const totalSteps = coordinates.length;
        const interval = setInterval(() => {
            if (step < totalSteps) {
                setTruckPosition(coordinates[step]);
                setTruckProgress(Math.round((step / totalSteps) * 100));
                step++;
            } else {
                clearInterval(interval);
            }
        }, 200); // Update every 200ms for smooth animation
    };

    const handleRequestFood = async () => {
        if(!reqItem.name) return;
        const user = JSON.parse(localStorage.getItem('foodtech_user'));
        
        try {
            await axios.post('http://localhost:8000/request-food', {
                consumer_name: user.name, item_name: reqItem.name, quantity: parseFloat(reqItem.quantity)
            });
            setShowRequestModal(false);
            setReqItem({ name: '', quantity: '1' });

            // --- CALCULATE DYNAMIC ROUTE ---
            if (userLoc) {
                const center = centers[1]; // Defaulting to Imphal Center
                await getRoadRoute(center, userLoc);
                alert(`Request Sent! Showing road path from ${center.name}`);
            } else {
                alert("Request Sent! (Enable location to see route)");
            }

        } catch (e) { alert("Error sending request."); }
    };

    const openGoogleMaps = () => {
        if(userLoc && centers[1]) {
            const url = `https://www.google.com/maps/dir/?api=1&origin=${centers[1].lat},${centers[1].lng}&destination=${userLoc.lat},${userLoc.lng}&travelmode=driving`;
            window.open(url, '_blank');
        }
    };

    const handleFeedback = async () => { alert("Feedback Sent!"); setShowFeedbackModal(false); };

    const sendChatMessage = async (e) => {
        e.preventDefault();
        if(!msgText) return;
        const user = JSON.parse(localStorage.getItem('foodtech_user'));
        if (activeChat === 'supplier') {
            await axios.post('http://localhost:8000/messages', { sender: user.name, content: msgText });
            const res = await axios.get('http://localhost:8000/messages');
            setSupplierMessages(res.data.reverse()); 
        } else {
            setAiMessages(prev => [...prev, { sender: 'You', content: msgText, self: true }]);
            setTimeout(() => setAiMessages(prev => [...prev, { sender: 'AI Bot', content: "I can help you find food centers.", self: false }]), 1000);
        }
        setMsgText("");
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white p-4 flex justify-between items-center shadow-xl z-20">
                <h1 className="text-xl font-bold flex gap-2 items-center drop-shadow-md"><MapPin className="animate-pulse"/> {t('consumer_app')}</h1>
                <div className="flex gap-2 items-center">
                    <button onClick={toggleLanguage} className="bg-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold hover:bg-emerald-800">
                        <Globe size={14}/> {i18n.language === 'en' ? 'EN' : i18n.language === 'hi' ? 'HI' : i18n.language === 'mni' ? 'MNI' : 'OR'}
                    </button>
                    <button onClick={handleSOS} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg font-bold flex items-center gap-2 animate-pulse"><AlertTriangle size={18} /> {t('sos_btn')}</button>
                    <button onClick={() => navigate('/login')} className="bg-emerald-700 px-3 py-1 rounded text-sm">{t('logout')}</button>
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row relative">
                {/* Premium Sidebar */}
                <div className="w-full md:w-[420px] bg-gradient-to-b from-slate-50 to-white shadow-2xl z-10 flex flex-col overflow-y-auto border-r border-slate-200">
                    <div className="p-6 space-y-5">
                        
                        {/* ROUTE INFO CARD WITH TRUCK TRACKING */}
                        {routePath.length > 0 && routeInfo && (
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 shadow-xl animate-in fade-in slide-in-from-left duration-500 border border-emerald-400">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xs text-emerald-100 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                            <Truck size={14} className="animate-bounce"/> Delivery Truck En Route
                                        </p>
                                        <h3 className="text-3xl font-black text-white">{routeInfo.duration}</h3>
                                        <p className="text-sm text-emerald-100 mt-1">{routeInfo.distance} away</p>
                                    </div>
                                    <button onClick={openGoogleMaps} className="bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-xl hover:bg-white/30 text-xs font-bold flex items-center gap-1.5 border border-white/30 transition-all">
                                        <Navigation size={14}/> Open
                                    </button>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs text-white/90 mb-1">
                                        <span>Progress</span>
                                        <span className="font-bold">{truckProgress}%</span>
                                    </div>
                                    <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                                        <div 
                                            className="bg-white h-full rounded-full transition-all duration-300 ease-linear"
                                            style={{width: `${truckProgress}%`}}
                                        ></div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-white/90 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> 
                                    {truckProgress < 100 ? 'Truck is on the way to your location' : 'Truck has arrived!'}
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setShowRequestModal(true)} className="group relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white py-5 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all overflow-hidden">
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <Utensils size={28} className="relative z-10"/>
                                <span className="text-sm relative z-10">{t('request_food')}</span>
                            </button>
                            <button onClick={() => setActiveChat('ai')} className="group relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white py-5 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all overflow-hidden">
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <Bot size={28} className="relative z-10"/>
                                <span className="text-sm relative z-10">{t('ai_help')}</span>
                            </button>
                        </div>

                        {/* Centers List */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="font-black text-slate-800 text-base uppercase tracking-tight flex items-center gap-2">
                                    <span className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></span>
                                    {t('nearest_centers')}
                                </h3>
                                <button onClick={() => setShowFeedbackModal(true)} className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-semibold transition-colors">
                                    <ThumbsUp size={13}/> {t('feedback')}
                                </button>
                            </div>
                            {centers.map(center => (
                                <div key={center.id} className="group relative bg-white rounded-2xl p-5 border-2 border-slate-100 hover:border-emerald-300 transition-all shadow-sm hover:shadow-xl">
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4">
                                        <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider shadow-md ${
                                            center.status === 'open' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                                        }`}>{center.status === 'open' ? '● OPEN' : '● CLOSED'}</span>
                                    </div>
                                    
                                    {/* Center Info */}
                                    <div className="pr-20 mb-4">
                                        <h4 className="font-bold text-[16px] text-slate-900 leading-tight mb-2">{center.name}</h4>
                                        <p className="text-[12px] text-slate-500 flex items-center gap-1.5">
                                            <MapPin size={12} className="text-emerald-600 flex-shrink-0"/>
                                            <span>{center.address}</span>
                                        </p>
                                    </div>
                                    
                                    {/* Stats Row */}
                                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                                            <div className={`w-2.5 h-2.5 rounded-full ${
                                                center.crowd === 'High' ? 'bg-red-500 animate-pulse' : center.crowd === 'Medium' ? 'bg-amber-500' : 'bg-green-500'
                                            }`}></div>
                                            <span className="text-[11px] font-bold text-slate-700">{center.crowd}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                                            <span className="text-[11px] font-bold text-slate-700">📦 {center.items}</span>
                                        </div>
                                        {center.cookedFood && (
                                            <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-1.5 rounded-lg border border-orange-200">
                                                <span className="text-[11px] font-black text-orange-700">🍛 Hot Meals</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Action Button */}
                                    <button 
                                        onClick={() => setActiveChat('supplier')} 
                                        className="w-full text-[12px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all group-hover:scale-[1.02]"
                                    >
                                        <MessageCircle size={14}/> {t('chat_supplier')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div className="flex-1 relative z-0">
                    <MapContainer center={[24.8170, 93.9368]} zoom={10} style={{ height: "100%", width: "100%" }}>
                        <TileLayer 
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        {centers.map(c => ( 
                            <Marker 
                                key={c.id} 
                                position={[c.lat, c.lng]}
                                icon={L.divIcon({
                                    className: 'custom-marker',
                                    html: `<div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); width: 40px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 18px;">📍</div></div>`,
                                    iconSize: [40, 40],
                                    iconAnchor: [20, 40]
                                })}
                            >
                                <Popup className="custom-popup">
                                    <div style="min-width: 200px;">
                                        <h3 style="font-weight: bold; font-size: 14px; margin-bottom: 6px; color: #059669;">{c.name}</h3>
                                        <p style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">{c.address}</p>
                                        <div style="display: flex; gap: 8px; font-size: 10px; margin-bottom: 8px; flex-wrap: wrap;">
                                            <span style="background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 12px; font-weight: 600;">{c.status.toUpperCase()}</span>
                                            <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-weight: 600;">{c.crowd} Crowd</span>
                                            {c.cookedFood && <span style="background: #ffedd5; color: #c2410c; padding: 2px 8px; border-radius: 12px; font-weight: 600;">🍛 Hot Meals</span>}
                                        </div>
                                        <p style="font-size: 11px; font-weight: 600; color: #374151;">📦 {c.items} Items Available</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                        {userLoc && <Marker position={[userLoc.lat, userLoc.lng]} icon={L.icon({iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png', iconSize:[40,40], iconAnchor:[20,40]})}><Popup><b style="color: #2563eb;">{t('you')}</b><br/><span style="font-size: 11px; color: #6b7280;">Your Current Location</span></Popup></Marker>}
                        
                        {/* LIVE TRUCK MARKER */}
                        {truckPosition && (
                            <Marker 
                                position={truckPosition}
                                icon={L.divIcon({
                                    className: 'truck-marker',
                                    html: `<div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); width: 48px; height: 48px; border-radius: 50%; border: 4px solid white; box-shadow: 0 6px 20px rgba(249,115,22,0.5); display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;"><div style="color: white; font-size: 24px;">🚚</div></div>`,
                                    iconSize: [48, 48],
                                    iconAnchor: [24, 24]
                                })}
                            >
                                <Popup>
                                    <div style="min-width: 160px; text-align: center;">
                                        <h3 style="font-weight: bold; font-size: 13px; margin-bottom: 4px; color: #f97316;">🚚 Delivery Truck</h3>
                                        <p style="font-size: 11px; color: #374151; font-weight: 600;">Progress: {truckProgress}%</p>
                                        <p style="font-size: 10px; color: #6b7280; margin-top: 4px;">{truckProgress < 100 ? 'On the way to you' : 'Arrived!'}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        )}
                        
                        {/* --- DYNAMIC ROAD PATH (Premium Gradient) --- */}
                        {routePath.length > 0 && (
                            <Polyline 
                                positions={routePath} 
                                color="#8b5cf6"
                                weight={6} 
                                opacity={0.9}
                                dashArray="10, 5"
                            />
                        )}
                    </MapContainer>
                </div>
            </div>

            {/* Chat Widget & Modals (Preserved) */}
            {activeChat && (
                <div className="fixed bottom-4 right-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
                    <div className={`${activeChat === 'ai' ? 'bg-blue-600' : 'bg-emerald-600'} text-white p-3 flex justify-between items-center`}>
                        <span className="font-bold flex gap-2 text-sm items-center">{activeChat === 'ai' ? <Bot size={18}/> : <MessageCircle size={18}/>}{activeChat === 'ai' ? t('ai_assistant') : t('supplier_support')}</span>
                        <button onClick={() => setActiveChat(null)} className="hover:bg-white/20 rounded p-1">×</button>
                    </div>
                    <div className="h-64 p-3 overflow-y-auto bg-gray-50 space-y-2">
                         {activeChat === 'supplier' ? supplierMessages.map((m, i) => <div key={i} className={`p-2 rounded-lg text-xs max-w-[80%] ${m.sender === (JSON.parse(localStorage.getItem('foodtech_user'))?.name) ? 'bg-emerald-100 ml-auto' : 'bg-gray-200'}`}>{m.content}</div>) : aiMessages.map((m, i) => <div key={i} className={`p-2 rounded-lg text-xs max-w-[80%] ${m.self ? 'bg-blue-100 ml-auto' : 'bg-gray-200'}`}>{m.content}</div>)}
                         <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={sendChatMessage} className="p-2 border-t flex gap-2 bg-white"><input value={msgText} onChange={e=>setMsgText(e.target.value)} className="flex-1 text-sm outline-none px-2" placeholder={t('type_message')}/><button type="submit"><Send size={18}/></button></form>
                </div>
            )}

            {showRequestModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-80 shadow-2xl">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-orange-600 flex items-center gap-2"><Utensils size={20}/> {t('request_food')}</h3><button onClick={startListening} className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100'}`}>{isListening ? <MicOff size={18}/> : <Mic size={18}/>}</button></div>
                        {isListening && <p className="text-xs text-center text-red-500 font-bold mb-2">Listening...</p>}
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500">{t('food_type')}</label>
                                <select className="w-full border p-2 rounded mt-1" onChange={(e) => setReqItem({...reqItem, name: e.target.value})} value={reqItem.name}>
                                    <option value="">-- Select Food --</option>
                                    <optgroup label="🍛 Cooked Food (Ready to Eat)">
                                        <option value="Rice Meals">Rice Meals</option>
                                        <option value="Dal Chawal">Dal Chawal</option>
                                        <option value="Khichdi">Khichdi</option>
                                        <option value="Vegetable Curry">Vegetable Curry</option>
                                        <option value="Chapati Pack">Chapati Pack</option>
                                        <option value="Hot Soup">Hot Soup</option>
                                    </optgroup>
                                    <optgroup label="🥬 Raw Vegetables">
                                        <option value="Onion">Onion</option>
                                        <option value="Potato">Potato</option>
                                        <option value="Tomato">Tomato</option>
                                    </optgroup>
                                    <optgroup label="🌾 Grains & Staples">
                                        <option value="Rice">Rice</option>
                                        <option value="Dal">Dal</option>
                                        <option value="Wheat Flour">Wheat Flour</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div><label className="text-xs font-bold text-gray-500">{t('quantity')}</label><input type="number" className="w-full border p-2 rounded mt-1" value={reqItem.quantity} onChange={e => setReqItem({...reqItem, quantity: e.target.value})}/></div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6"><button onClick={() => setShowRequestModal(false)} className="px-4 py-2 text-gray-500 text-sm">{t('cancel')}</button><button onClick={handleRequestFood} className="bg-orange-500 text-white px-4 py-2 rounded text-sm font-bold">{t('send_request')}</button></div>
                    </div>
                </div>
            )}
            
            {showFeedbackModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-80 shadow-2xl">
                        <h3 className="font-bold text-lg mb-4 text-blue-600 flex items-center gap-2"><ThumbsUp size={20}/> {t('send_feedback')}</h3><textarea className="w-full border p-2 rounded h-24 text-sm" value={feedbackText} onChange={e => setFeedbackText(e.target.value)}/><div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowFeedbackModal(false)} className="px-4 py-2 text-gray-500 text-sm">{t('cancel')}</button><button onClick={handleFeedback} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">{t('submit')}</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsumerDashboard;