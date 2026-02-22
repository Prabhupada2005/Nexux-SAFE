import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
    MapPin, MessageCircle, Send, Bot, Utensils, ThumbsUp, Globe, Mic, MicOff, AlertTriangle, Navigation, Truck, Search, WifiOff
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
    { id: 1, name: "Moirang Bazar Food Center", address: "Moirang Bazar, Bishnupur", lat: 24.5167, lng: 93.7667, status: "open", crowd: "High", items: 45, cookedFood: true, menu: ["Rice Meals", "Dal Chawal", "Khichdi", "Vegetable Curry", "Chapati Pack"] },
    { id: 2, name: "Imphal Community Kitchen", address: "Thangal Bazar, Imphal West", lat: 24.8170, lng: 93.9368, status: "open", crowd: "Low", items: 62, cookedFood: true, menu: ["Rice Meals", "Dal Chawal", "Hot Soup", "Chapati Pack", "Vegetable Curry"] },
    { id: 3, name: "Thoubal Relief Center", address: "Thoubal Bazar, Thoubal", lat: 24.6340, lng: 93.9856, status: "open", crowd: "Medium", items: 38, cookedFood: true, menu: ["Khichdi", "Dal Chawal", "Rice Meals", "Hot Soup"] },
    { id: 4, name: "Churachandpur Food Hub", address: "Tuibong, Churachandpur", lat: 24.3333, lng: 93.6833, status: "open", crowd: "Low", items: 52, cookedFood: true, menu: ["Rice Meals", "Vegetable Curry", "Chapati Pack", "Dal Chawal", "Khichdi"] },
    { id: 5, name: "Kakching Distribution Center", address: "Kakching Khunou, Kakching", lat: 24.4980, lng: 93.9810, status: "open", crowd: "Medium", items: 41, cookedFood: false, menu: ["Rice", "Dal", "Wheat Flour", "Onion", "Potato", "Tomato"] },
    { id: 6, name: "Ukhrul Relief Station", address: "Ukhrul Town, Ukhrul", lat: 25.0500, lng: 94.3600, status: "open", crowd: "High", items: 29, cookedFood: true, menu: ["Rice Meals", "Dal Chawal", "Chapati Pack"] },
    { id: 7, name: "Senapati Emergency Kitchen", address: "Senapati Bazar, Senapati", lat: 25.2667, lng: 94.0167, status: "open", crowd: "Low", items: 55, cookedFood: true, menu: ["Rice Meals", "Khichdi", "Hot Soup", "Vegetable Curry", "Dal Chawal"] },
    { id: 8, name: "Jiribam Food Point", address: "Jiribam Town, Jiribam", lat: 24.8050, lng: 93.1100, status: "open", crowd: "Medium", items: 34, cookedFood: false, menu: ["Rice", "Dal", "Wheat Flour", "Potato", "Onion"] },
];

const ConsumerDashboard = () => {
    const { t, i18n } = useTranslation();
    const [userLoc, setUserLoc] = useState(null);
    const [centers, setCenters] = useState(() => {
        const saved = localStorage.getItem('consumer_centers');
        return saved ? JSON.parse(saved) : FOOD_CENTERS;
    });
    const navigate = useNavigate();
    const chatEndRef = useRef(null);

    // Modal & Feature States
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showSOSModal, setShowSOSModal] = useState(false);
    const [sosReason, setSOSReason] = useState('');
    const [selectedCenter, setSelectedCenter] = useState(null);
    const [reqItem, setReqItem] = useState({ name: '', quantity: '1', plateSize: 'full', deliveryType: 'pickup', unit: 'kg' });
    const [feedbackText, setFeedbackText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState({});

    // Routing States
    const [routePath, setRoutePath] = useState([]); // Stores the road coordinates
    const [routeInfo, setRouteInfo] = useState(null); // Stores distance/duration
    const [truckPosition, setTruckPosition] = useState(null); // Live truck location
    const [truckProgress, setTruckProgress] = useState(0); // 0-100% progress
    const [activePickupCenter, setActivePickupCenter] = useState(null); // Track which center has active pickup
    const [riskZones, setRiskZones] = useState(() => {
        const saved = localStorage.getItem('consumer_riskZones');
        return saved ? JSON.parse(saved) : [];
    }); // Danger zones

    // Calculate nearest low-crowded center
    const nearestCenter = useMemo(() => {
        if (!userLoc) return null;

        // Filter out closed centers
        const availableCenters = centers.filter(c => c.status === 'open');

        if (availableCenters.length === 0) return null;

        // Calculate distance and find nearest
        const centersWithDistance = availableCenters.map(center => {
            const R = 6371; // Earth radius in km
            const dLat = (center.lat - userLoc.lat) * Math.PI / 180;
            const dLng = (center.lng - userLoc.lng) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(userLoc.lat * Math.PI / 180) * Math.cos(center.lat * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            return { ...center, distance: distance.toFixed(1) };
        });

        // Sort by distance and return nearest
        return centersWithDistance.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))[0];
    }, [userLoc, centers]);

    // Chat States
    const [activeChat, setActiveChat] = useState(null);
    const [activeChatCenter, setActiveChatCenter] = useState(null);
    const [msgText, setMsgText] = useState("");
    const [centerMessages, setCenterMessages] = useState(() => {
        const saved = localStorage.getItem('consumer_messages');
        return saved ? JSON.parse(saved) : {};
    });
    const [aiMessages, setAiMessages] = useState([{ sender: 'AI Bot', content: 'Hello! I am your FoodTech Assistant.', self: false }]);
    // Search & Filter UI states
    const [searchTerm, setSearchTerm] = useState('');
    const [activeChip, setActiveChip] = useState(null); // 'open' | 'nearest' | 'low' | 'hot' | null
    const [isTyping, setIsTyping] = useState(false);

    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const toggleLanguage = () => {
        const langs = ['en', 'hi', 'mni', 'or'];
        const current = langs.indexOf(i18n.language) > -1 ? langs.indexOf(i18n.language) : 0;
        const next = (current + 1) % langs.length;
        i18n.changeLanguage(langs[next]);
    };

    const scrollToBottom = () => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(() => { scrollToBottom(); }, [centerMessages, aiMessages, activeChat, isTyping]);

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

    useEffect(() => {
        if (i18n.addResourceBundle) {
            i18n.addResourceBundle('en', 'translation', {
                'quantity': 'Quantity'
            }, true, true);
            i18n.addResourceBundle('hi', 'translation', {
                'nearest_center': 'निकटतम केंद्र', 'crowd': 'भीड़', 'hot_meals': 'गर्म भोजन', 'menu_available': 'मेनू उपलब्ध', 'delivery_truck': 'डिलीवरी ट्रक रास्ते में है', 'directions': 'केंद्र के लिए दिशा-निर्देश', 'away': 'दूर', 'progress': 'प्रगति', 'truck_on_way': 'ट्रक आपके स्थान के रास्ते पर है', 'truck_arrived': 'ट्रक आ गया है!', 'follow_route': 'खाद्य केंद्र तक पहुंचने के लिए नीले मार्ग का अनुसरण करें', 'request_delivery': 'डिलीवरी का अनुरोध करें', 'ai_help': 'एआई सहायता', 'nearest_centers': 'निकटतम केंद्र', 'feedback': 'प्रतिक्रिया', 'open': 'खुला', 'closed': 'बंद', 'cancel_pickup': 'पिकअप रद्द करें', 'request_pickup': 'पिकअप का अनुरोध करें', 'chat': 'चैट', 'you': 'आप', 'danger_zone': 'खतरा क्षेत्र', 'avoid_area': 'इस क्षेत्र से बचें', 'do_not_enter': 'प्रवेश न करें', 'ai_assistant': 'एआई सहायक', 'supplier_support': 'आपूर्तिकर्ता सहायता', 'type_message': 'संदेश टाइप करें...', 'request_food': 'भोजन का अनुरोध करें', 'collection_method': 'संग्रह विधि', 'pickup_at_center': 'केंद्र पर पिकअप', 'delivery': 'डिलीवरी', 'delivery_warning': 'डिलीवरी केवल तभी उपलब्ध है जब ट्रक खाली हो। तत्काल जरूरतों के लिए, पिकअप चुनें।', 'food_type': 'भोजन का प्रकार', 'select_food': '-- भोजन चुनें --', 'cooked_food': 'पकाया हुआ भोजन (खाने के लिए तैयार)', 'raw_veg': 'कच्ची सब्जियां', 'grains': 'अनाज और स्टेपल', 'plate_size': 'प्लेट का आकार', 'half_plate': 'हाफ प्लेट', 'full_plate': 'फुल प्लेट', 'quantity': 'मात्रा', 'cancel': 'रद्द करें', 'send_request': 'अनुरोध भेजें', 'send_feedback': 'प्रतिक्रिया भेजें', 'submit': 'जमा करें', 'emergency_sos': 'आपातकालीन एसओएस', 'sos_desc': 'आपका स्थान आपातकालीन कमांड सेंटर को भेजा जाएगा', 'describe_emergency': 'आपातकाल का वर्णन करें (हिंसा, बाढ़, आग, चिकित्सा आपातकाल, आदि)...', 'send_sos': 'एसओएस भेजें', 'logout': 'लॉग आउट', 'consumer_app': 'उपभोक्ता पोर्टल', 'sos_btn': 'एसओएस'
            }, true, true);
            i18n.addResourceBundle('mni', 'translation', {
                'nearest_center': 'ꯈ꯭ꯋꯥꯏꯗꯒꯤ ꯅꯛꯄ ꯁꯦꯟꯇꯔ', 'crowd': 'ꯃꯤꯌꯥꯝ', 'hot_meals': 'ꯑꯁꯥꯕ ꯆꯥꯛ', 'menu_available': 'ꯃꯦꯅꯨ ꯐꯪꯉꯤ', 'delivery_truck': 'ꯗꯦꯂꯤꯕꯔꯤ ꯇ꯭ꯔꯛ ꯂꯥꯛꯂꯤ', 'directions': 'ꯂꯝꯕꯤ ꯇꯥꯛꯄ', 'away': 'ꯂꯥꯞꯄ', 'progress': 'ꯆꯪꯁꯤꯟꯕ', 'truck_on_way': 'ꯇ꯭ꯔꯛ ꯂꯥꯛꯂꯤ', 'truck_arrived': 'ꯇ꯭ꯔꯛ ꯌꯧꯔꯛꯂꯦ!', 'follow_route': 'ꯁꯦꯟꯇꯔ ꯌꯧꯅꯕ ꯍꯤꯒꯣꯛ ꯃꯆꯨꯒꯤ ꯂꯝꯕꯤ ꯏꯟꯕꯤꯌꯨ', 'request_delivery': 'ꯗꯦꯂꯤꯕꯔꯤ ꯅꯤꯕ', 'ai_help': 'AI ꯃꯇꯦꯡ', 'nearest_centers': 'ꯅꯛꯅꯕ ꯁꯦꯟꯇꯔꯁꯤꯡ', 'feedback': 'ꯐꯤꯗꯕꯦꯛ', 'open': 'ꯍꯥꯡꯉꯤ', 'closed': 'ꯊꯤꯡꯉꯤ', 'cancel_pickup': 'ꯄꯤꯛꯑꯞ ꯇꯣꯛꯄ', 'request_pickup': 'ꯄꯤꯛꯑꯞ ꯅꯤꯕ', 'chat': 'ꯋꯥꯔꯤ ꯁꯥꯟꯅꯕ', 'you': 'ꯅꯍꯥꯛ', 'danger_zone': 'ꯈꯨꯗꯣꯡꯊꯤꯕ ꯃꯐꯝ', 'avoid_area': 'ꯃꯐꯝ ꯑꯁꯤꯗꯒꯤ ꯂꯥꯞꯊꯣꯛꯎ', 'do_not_enter': 'ꯆꯪꯒꯅꯨ', 'ai_assistant': 'AI ꯑꯦꯁꯤꯁꯇꯦꯟ', 'supplier_support': 'ꯁꯄ꯭ꯂꯥꯏꯌꯔ ꯁꯄꯣꯔꯠ', 'type_message': 'ꯃꯦꯁꯦꯖ ꯏꯕ...', 'request_food': 'ꯆꯥꯛ-ꯊꯨꯝ ꯅꯤꯕ', 'collection_method': 'ꯂꯧꯕꯒꯤ ꯃꯑꯣꯡ', 'pickup_at_center': 'ꯁꯦꯟꯇꯔꯗ ꯂꯧꯕ', 'delivery': 'ꯗꯦꯂꯤꯕꯔꯤ', 'delivery_warning': 'ꯇ꯭ꯔꯛ ꯂꯩꯕ ꯃꯇꯝꯗꯈꯛ ꯗꯦꯂꯤꯕꯔꯤ ꯐꯪꯒꯅꯤ꯫ ꯊꯨꯅ ꯗꯔꯀꯥꯔ ꯑꯣꯏꯔꯕꯗꯤ ꯄꯤꯛꯑꯞ ꯈꯟꯕꯤꯌꯨ꯫', 'food_type': 'ꯆꯥꯛ-ꯊꯨꯝ ꯃꯈꯜ', 'select_food': '-- ꯈꯟꯕꯤꯌꯨ --', 'cooked_food': 'ꯊꯣꯡꯂꯕ ꯆꯥꯛ', 'raw_veg': 'ꯍꯤꯗꯥꯛ-ꯅꯥꯄꯤ', 'grains': 'ꯆꯦꯡ-ꯍꯋꯥꯏ', 'plate_size': 'ꯄ꯭ꯂꯦꯠ ꯁꯥꯏꯖ', 'half_plate': 'ꯍꯥꯐ ꯄ꯭ꯂꯦꯠ', 'full_plate': 'ꯐꯨꯜ ꯄ꯭ꯂꯦꯠ', 'quantity': 'ꯃꯁꯤꯡ', 'cancel': 'ꯇꯣꯛꯄ', 'send_request': 'ꯔꯤꯀ꯭ꯋꯦꯁ ꯊꯥꯕ', 'send_feedback': 'ꯐꯤꯗꯕꯦꯛ ꯊꯥꯕ', 'submit': 'ꯁꯕꯃꯤꯠ ꯇꯧꯕ', 'emergency_sos': 'ꯏꯃꯔꯖꯦꯟꯁꯤ SOS', 'sos_desc': 'ꯅꯍꯥꯛꯀꯤ ꯂꯩꯐꯝ ꯏꯃꯔꯖꯦꯟꯁꯤ ꯀꯃꯥꯟ ꯁꯦꯟꯇꯔꯗ ꯌꯧꯍꯟꯒꯅꯤ', 'describe_emergency': 'ꯈꯨꯗꯣꯡꯊꯤꯕ ꯃꯇꯧ ꯇꯥꯛꯄ (ꯏꯁꯤꯡ ꯏꯆꯥꯎ, ꯃꯩ ꯆꯥꯛꯄ, ꯑꯅꯥ-ꯂꯥꯌꯦꯡ, ꯑꯁꯤꯅꯆꯤꯡꯕ)...', 'send_sos': 'SOS ꯊꯥꯕ', 'logout': 'ꯂꯣꯒ ꯑꯥꯎꯠ', 'consumer_app': 'ꯀꯟꯁꯨꯃꯔ ꯑꯦꯞ', 'sos_btn': 'SOS'
            }, true, true);
            i18n.addResourceBundle('or', 'translation', {
                'nearest_center': 'ନିକଟତମ କେନ୍ଦ୍ର', 'crowd': 'ଭିଡ଼', 'hot_meals': 'ଗରମ ଖାଦ୍ୟ', 'menu_available': 'ମେନୁ ଉପଲବ୍ଧ', 'delivery_truck': 'ଡେଲିଭରି ଟ୍ରକ୍ ରାସ୍ତାରେ ଅଛି', 'directions': 'କେନ୍ଦ୍ରକୁ ଦିଗ', 'away': 'ଦୂର', 'progress': 'ଅଗ୍ରଗତି', 'truck_on_way': 'ଟ୍ରକ୍ ଆପଣଙ୍କ ସ୍ଥାନକୁ ଆସୁଛି', 'truck_arrived': 'ଟ୍ରକ୍ ପହଞ୍ଚିଛି!', 'follow_route': 'ଖାଦ୍ୟ କେନ୍ଦ୍ରରେ ପହଞ୍ଚିବା ପାଇଁ ନୀଳ ରାସ୍ତା ଅନୁସରଣ କରନ୍ତୁ', 'request_delivery': 'ଡେଲିଭରି ଅନୁରୋଧ କରନ୍ତୁ', 'ai_help': 'AI ସାହାଯ୍ୟ', 'nearest_centers': 'ନିକଟତମ କେନ୍ଦ୍ର', 'feedback': 'ମତାମତ', 'open': 'ଖୋଲା', 'closed': 'ବନ୍ଦ', 'cancel_pickup': 'ପିକଅପ୍ ବାତିଲ୍ କରନ୍ତୁ', 'request_pickup': 'ପିକଅପ୍ ଅନୁରୋଧ କରନ୍ତୁ', 'chat': 'ଚାଟ୍', 'you': 'ଆପଣ', 'danger_zone': 'ବିପଦ ଅଞ୍ଚଳ', 'avoid_area': 'ଏହି ଅଞ୍ଚଳରୁ ଦୂରେଇ ରୁହନ୍ତୁ', 'do_not_enter': 'ପ୍ରବେଶ କରନ୍ତୁ ନାହିଁ', 'ai_assistant': 'AI ସହାୟକ', 'supplier_support': 'ଯୋଗାଣକାରୀ ସହାୟତା', 'type_message': 'ବାର୍ତ୍ତା ଟାଇପ୍ କରନ୍ତୁ...', 'request_food': 'ଖାଦ୍ୟ ଅନୁରୋଧ କରନ୍ତୁ', 'collection_method': 'ସଂଗ୍ରହ ପଦ୍ଧତି', 'pickup_at_center': 'କେନ୍ଦ୍ରରେ ପିକଅପ୍', 'delivery': 'ଡେଲିଭରି', 'delivery_warning': 'ଟ୍ରକ୍ ଖାଲି ଥିଲେ ହିଁ ଡେଲିଭରି ଉପଲବ୍ଧ। ଜରୁରୀ ଆବଶ୍ୟକତା ପାଇଁ, ପିକଅପ୍ ବାଛନ୍ତୁ।', 'food_type': 'ଖାଦ୍ୟ ପ୍ରକାର', 'select_food': '-- ଖାଦ୍ୟ ବାଛନ୍ତୁ --', 'cooked_food': 'ରନ୍ଧା ଖାଦ୍ୟ', 'raw_veg': 'କଞ୍ଚା ପରିବା', 'grains': 'ଶସ୍ୟ', 'plate_size': 'ପ୍ଲେଟ୍ ଆକାର', 'half_plate': 'ହାଫ୍ ପ୍ଲେଟ୍', 'full_plate': 'ଫୁଲ୍ ପ୍ଲେଟ୍', 'quantity': 'ପରିମାଣ', 'cancel': 'ବାତିଲ୍ କରନ୍ତୁ', 'send_request': 'ଅନୁରୋଧ ପଠାନ୍ତୁ', 'send_feedback': 'ମତାମତ ପଠାନ୍ତୁ', 'submit': 'ଦାଖଲ କରନ୍ତୁ', 'emergency_sos': 'ଜରୁରୀକାଳୀନ SOS', 'sos_desc': 'ଆପଣଙ୍କ ସ୍ଥାନ ଜରୁରୀକାଳୀନ କମାଣ୍ଡ ସେଣ୍ଟରକୁ ପଠାଯିବ', 'describe_emergency': 'ଜରୁରୀକାଳୀନ ପରିସ୍ଥିତି ବର୍ଣ୍ଣନା କରନ୍ତୁ...', 'send_sos': 'SOS ପଠାନ୍ତୁ', 'logout': 'ଲଗ୍ ଆଉଟ୍', 'consumer_app': 'ଉପଭୋକ୍ତା ଆପ୍', 'sos_btn': 'SOS'
            }, true, true);
        }
    }, [i18n]);

    useEffect(() => {
        const initDashboard = async () => {
            try {
                // Fake loading delay for smooth transition
                await new Promise(resolve => setTimeout(resolve, 2000));

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                        () => console.log("Location access denied")
                    );
                }

                // Fetch registered centers from backend
                try {
                    const res = await axios.get('http://localhost:8000/centers');
                    if (res.data && res.data.length > 0) {
                        const newCenters = res.data.map(c => ({
                            ...c,
                            cookedFood: c.menu?.some(item => ['Rice Meals', 'Dal Chawal', 'Khichdi'].includes(item))
                        }));
                        setCenters(newCenters);
                        localStorage.setItem('consumer_centers', JSON.stringify(newCenters));
                    }
                } catch (e) { console.log('No registered centers yet'); }

                // Fetch risk zones
                try {
                    const res = await axios.get('http://localhost:8000/risk-zones');
                    setRiskZones(res.data);
                    localStorage.setItem('consumer_riskZones', JSON.stringify(res.data));
                } catch (e) { console.log('No risk zones'); }

            } catch (err) {
                console.error("Dashboard init error", err);
            } finally {
                setLoading(false);
            }
        };

        initDashboard();
    }, []);

    // Poll messages separately
    useEffect(() => {
        if (loading) return;
        const interval = setInterval(() => {
            centers.forEach(center => {
                axios.get(`http://localhost:8000/messages/${center.id}`)
                    .then(res => {
                        setCenterMessages(prev => {
                            const newState = { ...prev, [center.id]: res.data.reverse() };
                            localStorage.setItem('consumer_messages', JSON.stringify(newState));
                            return newState;
                        });
                    })
                    .catch(err => console.log(`No messages for center ${center.id}`));
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [centers, loading]);

    // Filtered centers for UI (search + chips)
    const filteredCenters = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        // start from all centers
        let list = centers.slice();

        // Apply text search (name, address, menu)
        if (term) {
            list = list.filter(c => {
                const inName = c.name.toLowerCase().includes(term);
                const inAddr = c.address.toLowerCase().includes(term);
                const inMenu = c.menu && c.menu.some(m => m.toLowerCase().includes(term));
                return inName || inAddr || inMenu;
            });
        }

        // Apply chip filters
        if (activeChip === 'open') {
            list = list.filter(c => c.status === 'open');
        } else if (activeChip === 'low') {
            list = list.filter(c => c.crowd === 'Low');
        } else if (activeChip === 'hot') {
            list = list.filter(c => c.cookedFood);
        }

        // Nearest acts as a sort (requires location)
        if (activeChip === 'nearest' && userLoc) {
            const R = 6371;
            list = list.map(center => {
                const dLat = (center.lat - userLoc.lat) * Math.PI / 180;
                const dLng = (center.lng - userLoc.lng) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(userLoc.lat * Math.PI / 180) * Math.cos(center.lat * Math.PI / 180) *
                    Math.sin(dLng / 2) * Math.sin(dLng / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distance = R * c;
                return { ...center, __distance: distance };
            }).sort((a, b) => a.__distance - b.__distance);
        }

        return list;
    }, [centers, searchTerm, activeChip, userLoc]);

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

    const handleSOS = async () => {
        setShowSOSModal(true);
    };

    const sendSOSAlert = async () => {
        if (!sosReason.trim()) {
            alert('Please describe the emergency');
            return;
        }

        if (!userLoc) {
            alert('Location access required to send SOS');
            return;
        }

        const user = JSON.parse(localStorage.getItem('foodtech_user'));

        try {
            await axios.post('http://localhost:8000/sos-alert', {
                lat: userLoc.lat,
                lng: userLoc.lng,
                reason: sosReason,
                sender_name: user.name,
                sender_type: 'consumer'
            });

            setShowSOSModal(false);
            setSOSReason('');
            alert('SOS Alert sent to Emergency Command Center! Help is on the way.');
        } catch (err) {
            alert('Failed to send SOS. Please try again.');
        }
    };

    // --- FETCH DYNAMIC ROAD ROUTE (OSRM API) ---
    const getRoadRoute = async (start, end, showTruck = true) => {
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

                // Start truck animation only if showTruck is true (for delivery)
                if (showTruck) {
                    setTruckPosition(coordinates[0]);
                    setTruckProgress(0);
                    animateTruck(coordinates);
                } else {
                    // For pickup, don't show truck
                    setTruckPosition(null);
                    setTruckProgress(0);
                }
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
        if (!reqItem.name) return;
        const user = JSON.parse(localStorage.getItem('foodtech_user'));

        try {
            await axios.post('http://localhost:8000/request-food', {
                consumer_name: user.name,
                item_name: reqItem.name,
                quantity: parseFloat(reqItem.quantity),
                center_id: selectedCenter?.id,
                center_name: selectedCenter?.name,
                delivery_type: reqItem.deliveryType
            });
            setShowRequestModal(false);

            // Show route for both pickup and delivery
            if (userLoc && selectedCenter) {
                if (reqItem.deliveryType === 'delivery') {
                    // Delivery: truck goes from center to user (with truck animation)
                    await getRoadRoute(selectedCenter, userLoc, true);
                    alert(`Delivery Request Sent! Truck will deliver from ${selectedCenter.name}. Track on map.`);
                } else {
                    // Pickup: user goes from their location to center (no truck, just directions)
                    await getRoadRoute(userLoc, selectedCenter, false);
                    setActivePickupCenter(selectedCenter.id); // Mark this center as having active pickup
                    alert(`Pickup Request Confirmed! Follow the blue route on map to reach ${selectedCenter.name}.`);
                }
            } else {
                alert(reqItem.deliveryType === 'delivery' ? "Delivery Request Sent!" : "Pickup Request Confirmed!");
            }

            setReqItem({ name: '', quantity: '1', plateSize: 'full', deliveryType: 'pickup', unit: 'kg' });
            setSelectedCenter(null);

        } catch (e) { alert("Error sending request."); }
    };

    const handleCancelPickup = (centerId) => {
        setRoutePath([]);
        setRouteInfo(null);
        setActivePickupCenter(null);
        alert('Pickup request cancelled. Route cleared.');
    };

    const openGoogleMaps = () => {
        if (userLoc && centers[1]) {
            const url = `https://www.google.com/maps/dir/?api=1&origin=${centers[1].lat},${centers[1].lng}&destination=${userLoc.lat},${userLoc.lng}&travelmode=driving`;
            window.open(url, '_blank');
        }
    };

    const handleFeedback = async () => { alert("Feedback Sent!"); setShowFeedbackModal(false); };

    // Helper: determine if selected food is a cooked/plate item
    const isCookedFood = (name) => {
        if (!name) return false;
        const cookedList = ['rice meals', 'dal chawal', 'khichdi', 'vegetable curry', 'chapati pack', 'hot soup'];
        return cookedList.some(k => name.toLowerCase().includes(k));
    };

    // When user picks a cooked food, clear unit (kg/l/units) since it's plate-based
    useEffect(() => {
        if (isCookedFood(reqItem.name)) {
            setReqItem(prev => ({ ...prev, unit: '' }));
        } else if (!reqItem.unit) {
            // ensure default unit for non-cooked items
            setReqItem(prev => ({ ...prev, unit: prev.unit || 'kg' }));
        }
    }, [reqItem.name]);

    const sendChatMessage = async (e) => {
        e.preventDefault();
        if (!msgText) return;
        const user = JSON.parse(localStorage.getItem('foodtech_user'));
        if (activeChat === 'supplier' && activeChatCenter) {
            try {
                await axios.post(`http://localhost:8000/messages/${activeChatCenter.id}`, {
                    sender: user.name,
                    content: msgText,
                    sender_type: 'consumer'
                });
                const res = await axios.get(`http://localhost:8000/messages/${activeChatCenter.id}`);
                setCenterMessages(prev => {
                    const newState = {
                        ...prev,
                        [activeChatCenter.id]: res.data.reverse()
                    };
                    localStorage.setItem('consumer_messages', JSON.stringify(newState));
                    return newState;
                });
                setMsgText(""); // Clear input after sending
            } catch (err) {
                console.log('Message send failed:', err);
                alert('Could not send message. Check if backend is running.');
            }
        } else {
            // Add user message
            setAiMessages(prev => [...prev, { sender: 'You', content: msgText, self: true }]);
            const userQuery = msgText;
            setMsgText("");
            setIsTyping(true);

            // AI Response Logic
            try {
                // Attempt to call backend AI service
                const response = await axios.post('http://localhost:8000/ai-chat', {
                    query: userQuery,
                    context: {
                        user_location: userLoc,
                        centers: centers
                    }
                });
                setAiMessages(prev => [...prev, { sender: 'AI Bot', content: response.data.response, self: false }]);
                setIsTyping(false);
            } catch (error) {
                // --- GEMINI API INTEGRATION (Fallback) ---
                // TODO: Get a free API key from https://aistudio.google.com/app/apikey and paste it below
                const GEMINI_API_KEY = "";

                if (GEMINI_API_KEY) {
                    try {
                        // 1. Prepare Context (Centers + Distance)
                        const contextCenters = centers.map(c => {
                            let dist = "unknown";
                            if (userLoc) {
                                const R = 6371; // Earth radius km
                                const dLat = (c.lat - userLoc.lat) * Math.PI / 180;
                                const dLng = (c.lng - userLoc.lng) * Math.PI / 180;
                                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(userLoc.lat * Math.PI / 180) * Math.cos(c.lat * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
                                dist = (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1) + " km";
                            }
                            return { name: c.name, status: c.status, crowd: c.crowd, menu: c.menu, distance: dist, hotMeals: c.cookedFood };
                        });

                        // 2. Call Gemini API
                        const prompt = `You are the Nexus FoodTech AI Assistant. Help the consumer find food centers.
Context:
- User Location: ${userLoc ? `Lat ${userLoc.lat}, Lng ${userLoc.lng}` : 'Unknown'}
- Centers Data: ${JSON.stringify(contextCenters)}

User Query: "${userQuery}"

Answer concisely, helpfully, and naturally. If asking for nearest, check the calculated distances.`;

                        const res = await axios.post(
                            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                            { contents: [{ parts: [{ text: prompt }] }] }
                        );

                        const aiText = res.data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (aiText) {
                            setAiMessages(prev => [...prev, { sender: 'AI Bot', content: aiText, self: false }]);
                            setIsTyping(false);
                            return; // Stop here, don't use local fallback
                        }
                    } catch (gErr) {
                        console.warn("Gemini API failed, falling back to local logic.", gErr);
                    }
                }

                console.warn("AI Backend/Gemini unreachable, using local fallback logic.");
                setTimeout(() => {
                    let aiResponse = "";
                    const lowerQuery = userQuery.toLowerCase();

                    // Food center queries
                    if (lowerQuery.includes('nearest') || lowerQuery.includes('closest') || lowerQuery.includes('near')) {
                        if (nearestCenter) {
                            aiResponse = `The nearest food center is ${nearestCenter.name}, located ${nearestCenter.distance} km away. It has ${nearestCenter.crowd} crowd and ${nearestCenter.items} items available. ${nearestCenter.cookedFood ? 'Hot meals are available!' : ''}`;
                        } else {
                            aiResponse = "Please enable location access to find the nearest center.";
                        }
                    }
                    // Open centers
                    else if (lowerQuery.includes('open') || lowerQuery.includes('available')) {
                        const openCenters = centers.filter(c => c.status === 'open');
                        aiResponse = `Currently ${openCenters.length} centers are open: ${openCenters.slice(0, 3).map(c => c.name).join(', ')}${openCenters.length > 3 ? ' and more.' : '.'}`;
                    }
                    // Low crowd centers
                    else if (lowerQuery.includes('crowd') || lowerQuery.includes('busy') || lowerQuery.includes('wait')) {
                        const lowCrowd = centers.filter(c => c.crowd === 'Low' && c.status === 'open');
                        if (lowCrowd.length > 0) {
                            aiResponse = `Centers with low crowd: ${lowCrowd.map(c => c.name).join(', ')}. You can visit these for faster service.`;
                        } else {
                            aiResponse = "All centers are currently busy. Please try again later or request delivery.";
                        }
                    }
                    // Hot meals
                    else if (lowerQuery.includes('hot') || lowerQuery.includes('cooked') || lowerQuery.includes('meal')) {
                        const hotMealCenters = centers.filter(c => c.cookedFood && c.status === 'open');
                        aiResponse = `${hotMealCenters.length} centers serve hot meals: ${hotMealCenters.slice(0, 3).map(c => c.name).join(', ')}.`;
                    }
                    // Request food help
                    else if (lowerQuery.includes('request') || lowerQuery.includes('order') || lowerQuery.includes('need food')) {
                        aiResponse = "To request food, click the 'Request Food' button. You can choose from cooked meals, vegetables, or grains. Use the microphone icon for voice ordering!";
                    }
                    // Location help
                    else if (lowerQuery.includes('location') || lowerQuery.includes('address')) {
                        aiResponse = "All food centers are marked on the map. Click any marker to see the full address and details. You can also get directions by clicking 'Get Directions'.";
                    }
                    // Delivery tracking
                    else if (lowerQuery.includes('track') || lowerQuery.includes('delivery') || lowerQuery.includes('truck')) {
                        if (routePath.length > 0) {
                            aiResponse = `Your delivery is ${truckProgress}% complete. Estimated time: ${routeInfo?.duration}. You can track the truck on the map in real-time.`;
                        } else {
                            aiResponse = "No active delivery. Request food first, and you'll be able to track the delivery truck on the map.";
                        }
                    }
                    // Emergency/SOS
                    else if (lowerQuery.includes('emergency') || lowerQuery.includes('sos') || lowerQuery.includes('urgent')) {
                        aiResponse = "For emergencies, click the red SOS button in the header. This will send an immediate alert to all nearby centers.";
                    }
                    // Language help
                    else if (lowerQuery.includes('language') || lowerQuery.includes('hindi') || lowerQuery.includes('translate')) {
                        aiResponse = "You can change the language using the globe icon in the header. We support English, Hindi, Manipuri, and Odia.";
                    }
                    // List all centers
                    else if (lowerQuery.includes('list') || lowerQuery.includes('all centers') || lowerQuery.includes('show all')) {
                        aiResponse = `We have ${centers.length} food centers: ${centers.map(c => c.name).join(', ')}. Check the map or scroll down to see details.`;
                    }
                    // Greetings
                    else if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey')) {
                        aiResponse = "Hello! I'm your FoodTech AI Assistant. I can help you find food centers, track deliveries, and answer questions. What do you need?";
                    }
                    // Help/What can you do
                    else if (lowerQuery.includes('help') || lowerQuery.includes('what can you') || lowerQuery.includes('how to')) {
                        aiResponse = "I can help you with:\n• Finding nearest food centers\n• Checking which centers are open\n• Locating centers with hot meals\n• Tracking your delivery\n• Requesting food\n• Emergency assistance\n\nJust ask me anything!";
                    }
                    // Stuck/Lost/Confused
                    else if (lowerQuery.includes('stuck') || lowerQuery.includes('lost') || lowerQuery.includes('confused') || lowerQuery.includes('don\'t know')) {
                        aiResponse = "Don't worry! Here's how to use the app:\n\n1. Click 'Request Delivery' to order food from the nearest center\n2. Use the map to see all food centers and danger zones\n3. Click any center's 'Request Pickup' to collect food yourself\n4. Use 'Chat' to message a specific center\n5. Click the red SOS button for emergencies\n\nWhat would you like to do?";
                    }
                    // Default response
                    else {
                        aiResponse = "I can help you find food centers, check availability, track deliveries, and more. Try asking: 'Which center is nearest?' or 'Where can I get hot meals?'";
                    }

                    setAiMessages(prev => [...prev, { sender: 'AI Bot', content: aiResponse, self: false }]);
                    setIsTyping(false);
                }, 800);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-200/20 via-slate-50 to-slate-50"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 mb-6 relative">
                        <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        <MapPin className="absolute inset-0 m-auto text-green-500" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2 tracking-wide">Loading consumer data...</h2>
                    <div className="flex items-center gap-2 text-green-600/60 text-xs font-mono uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Locating nearby centers
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 relative overflow-hidden">
            {/* Offline Indicator */}
            {!isOnline && (
                <div className="absolute top-0 w-full bg-amber-600/90 backdrop-blur-md text-white py-1 px-4 text-center text-xs font-bold z-[60] flex items-center justify-center gap-2 border-b border-amber-500/50">
                    <WifiOff size={14} />
                    {t('offline_msg', "You're offline - Some features may be limited")}
                </div>
            )}

            {/* Premium Header */}
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md text-slate-800 px-4 h-14 flex flex-row justify-between items-center shadow-sm border-b border-slate-200">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <MapPin className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base md:text-xl font-black tracking-tight text-slate-900">{t('consumer_app', 'Consumer Portal')}</h1>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <button onClick={toggleLanguage} className="bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-bold hover:bg-slate-200 transition-all text-slate-700">
                        <Globe size={14} /> {i18n.language === 'en' ? 'EN' : i18n.language === 'hi' ? 'HI' : i18n.language === 'mni' ? 'MNI' : 'OR'}
                    </button>
                    <button onClick={() => { localStorage.removeItem('foodtech_user'); navigate('/login'); }} className="bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all text-slate-700">{t('logout')}</button>
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden h-full">

                {/* Premium Sidebar */}
                <div className="w-full flex-1 md:flex-none md:w-[400px] md:h-full z-20 bg-white md:bg-white/90 md:backdrop-blur-xl border-t md:border-t-0 md:border-r border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] md:shadow-none order-2 md:order-1 flex flex-col overflow-hidden">
                    <div className="w-full h-full overflow-y-auto p-4 md:p-6 space-y-4">

                        {/* NEAREST CENTER RECOMMENDATION */}
                        {nearestCenter && (
                            <div className="bg-white rounded-[20px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100 animate-in fade-in slide-in-from-bottom duration-500">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                                            <Navigation size={20} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('nearest_center', 'Nearest Center')}</p>
                                            <p className="text-lg font-black text-slate-900">
                                                Nearest Food: <span className="text-emerald-600">{nearestCenter.distance} {t('km', 'km')}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-100 px-3 py-1.5 rounded-full">
                                        <span className={`text-xs font-black ${nearestCenter.crowd === 'High' ? 'text-red-600' : nearestCenter.crowd === 'Medium' ? 'text-orange-600' : 'text-emerald-600'} flex items-center gap-1`}>
                                            <span className={`w-2 h-2 rounded-full ${nearestCenter.crowd === 'High' ? 'bg-red-500' : nearestCenter.crowd === 'Medium' ? 'bg-orange-500' : 'bg-emerald-500'} animate-pulse`}></span>
                                            {nearestCenter.crowd} {t('crowd', 'Crowd')}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100">
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">{t(`center_names.${nearestCenter.id}`, nearestCenter.name)}</h4>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <MapPin size={11} className="text-slate-400" />
                                        {nearestCenter.address}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                    {nearestCenter.cookedFood && (
                                        <div className="bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                                            <span className="text-xs font-bold text-orange-700">🍛 {t('hot_meals', 'Hot Meals')}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Menu Available */}
                                {nearestCenter.menu && nearestCenter.menu.length > 0 && (
                                    <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100">
                                        <button
                                            onClick={() => setExpandedMenus(prev => ({ ...prev, [nearestCenter.id]: !prev[nearestCenter.id] }))}
                                            className="w-full text-left"
                                        >
                                            <p className="text-xs text-slate-500 font-bold mb-2 flex items-center justify-between">
                                                📋 {t('menu_available', 'Menu Available')} ({nearestCenter.menu.length})
                                                <span className="text-[10px]">{expandedMenus[nearestCenter.id] ? '▼' : '▶'}</span>
                                            </p>
                                        </button>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(expandedMenus[nearestCenter.id] ? nearestCenter.menu : nearestCenter.menu.slice(0, 4)).map((item, idx) => (
                                                <span key={idx} className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-600 font-semibold">{item}</span>
                                            ))}
                                            {!expandedMenus[nearestCenter.id] && nearestCenter.menu.length > 4 && (
                                                <button
                                                    onClick={() => setExpandedMenus(prev => ({ ...prev, [nearestCenter.id]: true }))}
                                                    className="text-[10px] text-emerald-600 underline"
                                                >
                                                    +{nearestCenter.menu.length - 4} more
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons for Nearest Center */}
                                <div className="flex flex-col gap-3 mt-4">
                                    <button
                                        onClick={() => {
                                            setSelectedCenter(nearestCenter);
                                            setReqItem({ ...reqItem, deliveryType: 'delivery' });
                                            setShowRequestModal(true);
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all w-full"
                                    >
                                        🚚 {t('request_delivery', 'Request Delivery')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedCenter(nearestCenter);
                                            setReqItem({ ...reqItem, deliveryType: 'pickup' });
                                            setShowRequestModal(true);
                                        }}
                                        className="bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 py-3 rounded-xl font-bold text-sm transition-all w-full"
                                    >
                                        {t('request_pickup', 'Pickup')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ROUTE INFO CARD WITH TRUCK TRACKING */}
                        {routePath.length > 0 && routeInfo && (
                            <div className="bg-white rounded-[20px] p-5 shadow-xl animate-in fade-in slide-in-from-left duration-500 border border-slate-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                            {truckPosition ? (
                                                <><Truck size={14} className="animate-bounce" /> {t('delivery_truck', 'Delivery Truck En Route')}</>
                                            ) : (
                                                <><Navigation size={14} /> {t('directions', 'Directions to Center')}</>
                                            )}
                                        </p>
                                        <h3 className="text-2xl md:text-3xl font-black text-slate-900">{routeInfo.duration}</h3>
                                        <p className="text-sm text-slate-500 mt-1">{routeInfo.distance} {t('away', 'away')}</p>
                                    </div>
                                    <button onClick={openGoogleMaps} className="bg-blue-50 text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 border border-blue-100 transition-all">
                                        <Navigation size={14} /> Open
                                    </button>
                                </div>

                                {/* Progress Bar - Only show for delivery */}
                                {truckPosition && (
                                    <>
                                        <div className="mb-3">
                                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                <span>{t('progress', 'Progress')}</span>
                                                <span className="font-bold">{truckProgress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-linear"
                                                    style={{ width: `${truckProgress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            {truckProgress < 100 ? t('truck_on_way', 'Truck is on the way to your location') : t('truck_arrived', 'Truck has arrived!')}
                                        </div>
                                    </>
                                )}

                                {/* Pickup directions message */}
                                {!truckPosition && (
                                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                        {t('follow_route', 'Follow the blue route to reach the food center')}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Centers List - Visible on Mobile with padding */}
                        <div className="space-y-4 pb-24 md:pb-0">
                            {/* Search + Filter */}
                            <div className="mb-3 mt-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        placeholder="Search centers, areas, or meals…"
                                        className="w-full border-2 border-slate-200 pl-10 pr-3 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition placeholder-slate-500"
                                    />
                                </div>
                                {searchTerm ? (
                                    <p className="text-xs text-emerald-600 font-bold mt-2 animate-pulse">Showing nearest matching centers...</p>
                                ) : (
                                    <p className="text-xs text-slate-400 mt-2">Try: Imphal / Moirang / Hot meals</p>
                                )}

                                <div className="flex gap-2 mt-3 flex-wrap">
                                    {[
                                        { key: null, label: 'All' },
                                        { key: 'open', label: 'Open now' },
                                        { key: 'nearest', label: 'Nearest' },
                                        { key: 'low', label: 'Low crowd' },
                                        { key: 'hot', label: 'Hot meals' },
                                    ].map(chip => (
                                        <button
                                            key={String(chip.key)}
                                            onClick={() => setActiveChip(prev => prev === chip.key ? null : chip.key)}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-full border ${activeChip === chip.key ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200'}`}
                                        >
                                            {chip.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-between items-center px-1">
                                <h3 className="font-black text-slate-800 text-base uppercase tracking-tight flex items-center gap-2">
                                    <span className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></span>
                                    {t('nearest_centers')}
                                </h3>
                                <button onClick={() => setShowFeedbackModal(true)} className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-semibold transition-colors">
                                    <ThumbsUp size={13} /> {t('feedback')}
                                </button>
                            </div>
                            {filteredCenters.map(center => (
                                <div key={center.id} className="group relative bg-gradient-to-br from-white to-slate-50/50 rounded-2xl p-5 border-2 border-slate-100 hover:border-emerald-300 transition-all shadow-md hover:shadow-2xl hover:scale-[1.02]">
                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4">
                                        <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider shadow-md ${center.status === 'open' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                                            }`}>{center.status === 'open' ? `● ${t('open', 'OPEN')}` : `● ${t('closed', 'CLOSED')}`}</span>
                                    </div>

                                    {/* Center Info */}
                                    <div className="pr-20 mb-4">
                                        <h4 className="font-bold text-sm md:text-[16px] text-slate-900 leading-tight mb-2">{t(`center_names.${center.id}`, center.name)}</h4>
                                        <p className="text-[12px] text-slate-500 flex items-center gap-1.5">
                                            <MapPin size={12} className="text-emerald-600 flex-shrink-0" />
                                            <span>{center.address}</span>
                                        </p>
                                    </div>

                                    {/* Stats Row */}
                                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                                            <div className={`w-2.5 h-2.5 rounded-full ${center.crowd === 'High' ? 'bg-red-500 animate-pulse' : center.crowd === 'Medium' ? 'bg-amber-500' : 'bg-green-500'
                                                }`}></div>
                                            <span className="text-[11px] font-bold text-slate-700">{center.crowd} {t('crowd', 'Crowd')}</span>
                                        </div>
                                        {center.cookedFood && (
                                            <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-1.5 rounded-lg border border-orange-200">
                                                <span className="text-[11px] font-black text-orange-700">🍛 {t('hot_meals', 'Hot Meals')}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Menu Available */}
                                    {center.menu && center.menu.length > 0 && (
                                        <div className="mb-4 bg-slate-50 rounded-xl p-3">
                                            <button
                                                onClick={() => setExpandedMenus(prev => ({ ...prev, [center.id]: !prev[center.id] }))}
                                                className="w-full text-left"
                                            >
                                                <p className="text-[10px] text-slate-600 font-bold mb-2 uppercase tracking-wider flex items-center justify-between">
                                                    📋 {t('menu_available', 'Available Menu')} ({center.menu.length})
                                                    <span className="text-[10px]">{expandedMenus[center.id] ? '▼' : '▶'}</span>
                                                </p>
                                            </button>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(expandedMenus[center.id] ? center.menu : center.menu.slice(0, 5)).map((item, idx) => (
                                                    <span key={idx} className="text-[9px] bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-700 font-semibold">{item}</span>
                                                ))}
                                                {!expandedMenus[center.id] && center.menu.length > 5 && (
                                                    <button
                                                        onClick={() => setExpandedMenus(prev => ({ ...prev, [center.id]: true }))}
                                                        className="text-[9px] text-slate-500 font-semibold underline"
                                                    >
                                                        +{center.menu.length - 5} more
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {activePickupCenter === center.id ? (
                                            <button
                                                onClick={() => handleCancelPickup(center.id)}
                                                className="text-[12px] bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all"
                                            >
                                                ✕ {t('cancel_pickup', 'Cancel Pickup')}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => { setSelectedCenter(center); setReqItem({ ...reqItem, deliveryType: 'pickup' }); setShowRequestModal(true); }}
                                                className="text-[12px] bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-3 py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all"
                                            >
                                                <Utensils size={13} /> {t('request_pickup', 'Request Pickup')}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setActiveChat('supplier');
                                                setActiveChatCenter(center);
                                                setMsgText(""); // Clear input when switching centers
                                            }}
                                            className="text-[12px] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all"
                                        >
                                            <MessageCircle size={13} /> {t('chat', 'Chat')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div className="h-[60vh] md:h-full md:flex-1 z-0 order-1 md:order-2 relative">
                    <style>
                        {`
                            .leaflet-control-zoom { margin-top: 80px !important; }
                            @media (min-width: 768px) { .leaflet-control-zoom { transform: scale(1.3); margin-top: 60px !important; } }
                        `}
                    </style>
                    <MapContainer center={[24.8170, 93.9368]} zoom={10} style={{ height: "100%", width: "100%" }} zoomControl={true}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        {filteredCenters.map(c => (
                            <Marker
                                key={c.id}
                                position={[c.lat, c.lng]}
                                icon={L.divIcon({
                                    className: 'custom-marker',
                                    html: `<div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); width: 40px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 18px;">📍</div></div>`,
                                    iconSize: [40, 40],
                                    iconAnchor: [20, 40]
                                })}
                                eventHandlers={{
                                    popupopen: (e) => {
                                        setTimeout(() => e.target.closePopup(), 5000);
                                    }
                                }}
                            >
                                <Popup className="custom-popup">
                                    <div className="bg-white rounded-lg p-3 min-w-[200px]">
                                        <h3 className="font-bold text-green-600 text-sm mb-2">{t(`center_names.${c.id}`, c.name)}</h3>
                                        <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                                            <span className="text-green-500">📍</span> {c.address}
                                        </p>
                                        <div className="flex gap-2 flex-wrap mb-2">
                                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">{c.status === 'open' ? t('open', 'OPEN') : t('closed', 'CLOSED')}</span>
                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">{c.crowd} {t('crowd', 'Crowd')}</span>
                                            {c.cookedFood && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">🍛 {t('hot_meals', 'Hot Meals')}</span>}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                        {userLoc && <Marker position={[userLoc.lat, userLoc.lng]} icon={L.icon({ iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png', iconSize: [40, 40], iconAnchor: [20, 40] })} eventHandlers={{
                            popupopen: (e) => {
                                setTimeout(() => e.target.closePopup(), 5000);
                            }
                        }}>
                            <Popup>
                                <div className="bg-white rounded-lg p-3 text-center min-w-[150px]">
                                    <h3 className="font-bold text-green-600 text-sm mb-1">📍 {t('you')}</h3>
                                    <p className="text-xs text-gray-600">Your Current Location</p>
                                </div>
                            </Popup>
                        </Marker>}

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
                                eventHandlers={{
                                    popupopen: (e) => {
                                        setTimeout(() => e.target.closePopup(), 5000);
                                    }
                                }}
                            >
                                <Popup>
                                    <div className="bg-white rounded-lg p-3 text-center min-w-[160px]">
                                        <h3 className="font-bold text-orange-600 text-sm mb-2">🚚 {t('delivery_truck', 'Delivery Truck')}</h3>
                                        <p className="text-xs font-semibold text-gray-700 mb-1">{t('progress', 'Progress')}: {truckProgress}%</p>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                            <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${truckProgress}%` }}></div>
                                        </div>
                                        <p className="text-xs text-gray-600">{truckProgress < 100 ? `🚀 ${t('truck_on_way', 'On the way to you')}` : `✅ ${t('truck_arrived', 'Arrived!')}`}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* --- DYNAMIC ROAD PATH (Premium Gradient) --- */}
                        {routePath.length > 0 && (
                            <Polyline
                                positions={routePath}
                                color="#10b981"
                                weight={6}
                                opacity={0.9}
                                dashArray="10, 5"
                            />
                        )}

                        {/* DANGER ZONES */}
                        {riskZones.map(zone => (
                            <React.Fragment key={zone.id}>
                                <Circle
                                    center={[zone.lat, zone.lng]}
                                    radius={zone.radius}
                                    pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.3, weight: 2 }}
                                    eventHandlers={{
                                        popupopen: (e) => {
                                            setTimeout(() => e.target.closePopup(), 5000);
                                        }
                                    }}
                                >
                                    <Popup>
                                        <div className="bg-white rounded-lg p-3 min-w-[180px]">
                                            <h3 className="font-bold text-red-600 text-sm mb-2">⚠️ {t('danger_zone', 'DANGER ZONE')}</h3>
                                            <p className="text-xs text-gray-700 mb-2">{zone.reason}</p>
                                            <p className="text-xs text-gray-600 mb-2">Radius: {zone.radius}m</p>
                                            <p className="text-xs font-bold text-red-600">⚠️ {t('avoid_area', 'Avoid this area')}</p>
                                        </div>
                                    </Popup>
                                </Circle>
                                <Marker
                                    position={[zone.lat, zone.lng]}
                                    icon={L.divIcon({
                                        className: 'danger-marker',
                                        html: `<div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); width: 44px; height: 44px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 16px rgba(220,38,38,0.6); display: flex; align-items: center; justify-content: center;"><div style="color: white; font-size: 24px;">⚠️</div></div>`,
                                        iconSize: [44, 44],
                                        iconAnchor: [22, 22]
                                    })}
                                    eventHandlers={{
                                        popupopen: (e) => {
                                            setTimeout(() => e.target.closePopup(), 5000);
                                        }
                                    }}
                                >
                                    <Popup>
                                        <div className="bg-white rounded-lg p-3 text-center min-w-[180px]">
                                            <h3 className="font-bold text-red-600 text-sm mb-2">⚠️ {t('danger_zone', 'DANGER ZONE')}</h3>
                                            <p className="text-xs font-semibold text-gray-800 mb-2">{zone.reason}</p>
                                            <p className="text-xs text-gray-600 mb-2">Affected Radius: {zone.radius}m</p>
                                            <div className="bg-red-50 border border-red-200 rounded px-2 py-1">
                                                <p className="text-xs font-bold text-red-700">🚫 {t('do_not_enter', 'DO NOT ENTER')}</p>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            </React.Fragment>
                        ))}
                    </MapContainer>

                    {/* FLOATING AI BUTTON (Above SOS) */}
                    <button
                        onClick={() => setActiveChat('ai')}
                        className="absolute bottom-24 right-4 z-[400] bg-emerald-600 hover:bg-emerald-700 text-white w-12 h-12 rounded-full shadow-lg shadow-emerald-500/40 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border-2 border-white"
                    >
                        <Bot size={24} />
                    </button>

                    {/* FLOATING SOS BUTTON (Bottom Right) */}
                    <button
                        onClick={handleSOS}
                        className="absolute bottom-6 right-4 z-[400] bg-red-600 hover:bg-red-700 text-white w-16 h-16 rounded-full shadow-[0_8px_30px_rgba(220,38,38,0.5)] flex flex-col items-center justify-center animate-pulse border-4 border-white transition-transform hover:scale-110 active:scale-95"
                    >
                        <AlertTriangle size={24} fill="currentColor" className="mb-0.5" />
                        <span className="text-[10px] font-black">SOS</span>
                    </button>
                </div>
            </div>

            {/* Chat Widget & Modals (Preserved) */}
            {activeChat && (
                <div className="fixed bottom-0 left-0 right-0 w-full md:w-96 md:bottom-6 md:right-6 md:left-auto bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border-2 border-slate-200 flex flex-col z-50 overflow-hidden h-[50vh] md:h-auto">
                    <div className={`${activeChat === 'ai' ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-green-600 to-emerald-600'} text-white p-4 flex justify-between items-center`}>
                        <div>
                            <span className="font-black flex gap-2 text-base items-center">
                                {activeChat === 'ai' ? <Bot size={20} /> : <MessageCircle size={20} />}
                                {activeChat === 'ai' ? t('ai_assistant', 'AI Assistant') : (activeChatCenter ? t(`center_names.${activeChatCenter.id}`, activeChatCenter.name) : t('supplier_support', 'Supplier Support'))}
                            </span>
                            {activeChat === 'supplier' && activeChatCenter && (
                                <p className="text-xs text-green-100 mt-1">📍 {activeChatCenter.address}</p>
                            )}
                        </div>
                        <button onClick={() => { setActiveChat(null); setActiveChatCenter(null); }} className="hover:bg-white/20 rounded-lg p-2 transition-all"><span className="text-xl">×</span></button>
                    </div>
                    <div className="h-80 p-4 overflow-y-auto bg-gradient-to-b from-slate-50 to-white space-y-3">
                        {activeChat === 'supplier' ? (
                            activeChatCenter && centerMessages[activeChatCenter.id] ? (
                                centerMessages[activeChatCenter.id].map((m, i) => (
                                    <div key={i} className={`p-3 rounded-2xl text-sm max-w-[80%] shadow-sm ${m.sender_type === 'consumer' ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white ml-auto' : 'bg-white border border-slate-200'}`}>
                                        <div className="text-[10px] opacity-70 mb-1">{m.sender}</div>
                                        {m.content}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-slate-400 text-sm py-8">{t('no_messages', 'No messages yet. Start the conversation!')}</div>
                            )
                        ) : (
                            <>
                                {aiMessages.map((m, i) => <div key={i} className={`p-3 rounded-2xl text-sm max-w-[80%] shadow-sm ${m.self ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white ml-auto' : 'bg-white border border-slate-200'}`}>{m.sender === 'You' ? t('you', 'You') : t('ai_assistant', 'AI Bot')}: {m.content}</div>)}
                                {isTyping && (
                                    <div className="p-3 rounded-2xl text-sm max-w-[80%] shadow-sm bg-white border border-slate-200 mr-auto w-16">
                                        <div className="flex gap-1 items-center h-full pl-1">
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={sendChatMessage} className="p-4 border-t-2 border-slate-100 flex gap-3 bg-white">
                        <input
                            value={msgText}
                            onChange={e => setMsgText(e.target.value)}
                            className="flex-1 text-sm outline-none px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all"
                            placeholder={t('type_message', 'Type message...')}
                        />
                        <button
                            type="submit"
                            className={`${activeChat === 'ai' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'} text-white p-3 rounded-xl shadow-md hover:shadow-lg transition-all`}
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}

            {showRequestModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-3xl w-96 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-black text-2xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Utensils size={24} className="text-white" />
                                    </div>
                                    {t('request_food')}
                                </h3>
                                {selectedCenter && (
                                    <p className="text-xs text-slate-600 mt-2 ml-16">📍 From: <span className="font-bold text-green-600">{t(`center_names.${selectedCenter.id}`, selectedCenter.name)}</span></p>
                                )}
                            </div>
                            <button onClick={startListening} className={`p-3 rounded-xl transition-all shadow-md ${isListening ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse' : 'bg-slate-100 hover:bg-slate-200'}`}>{isListening ? <MicOff size={20} /> : <Mic size={20} />}</button>
                        </div>
                        {isListening && <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-center"><p className="text-sm text-red-600 font-bold flex items-center justify-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>Listening...</p></div>}
                        <div className="space-y-4">
                            {/* Delivery Type Selection */}
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">{t('collection_method', 'Collection Method')}</label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => setReqItem({ ...reqItem, deliveryType: 'pickup' })}
                                        className={`py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all ${reqItem.deliveryType === 'pickup'
                                            ? 'bg-green-500 text-white border-green-500'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                                            }`}
                                    >
                                        🏪 {t('pickup_at_center', 'Pickup at Center')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReqItem({ ...reqItem, deliveryType: 'delivery' })}
                                        className={`py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all ${reqItem.deliveryType === 'delivery'
                                            ? 'bg-orange-500 text-white border-orange-500'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                                            }`}
                                    >
                                        🚚 {t('delivery', 'Delivery')}
                                    </button>
                                </div>
                                {reqItem.deliveryType === 'delivery' && (
                                    <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
                                        ⚠️ {t('delivery_warning', 'Delivery only available when truck is free. For urgent needs, choose pickup.')}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">{t('food_type')}</label>
                                <select className="w-full border-2 border-slate-200 p-3 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all" onChange={(e) => setReqItem({ ...reqItem, name: e.target.value })} value={reqItem.name}>
                                    <option value="">{t('select_food', '-- Select Food --')}</option>
                                    {selectedCenter && selectedCenter.menu ? (
                                        <optgroup label={`📋 ${t('menu_available', 'Available')} at ${t(`center_names.${selectedCenter.id}`, selectedCenter.name)}`}>
                                            {selectedCenter.menu.map((item, idx) => (
                                                <option key={idx} value={item}>{item}</option>
                                            ))}
                                        </optgroup>
                                    ) : (
                                        <>
                                            <optgroup label={`🍛 ${t('cooked_food', 'Cooked Food (Ready to Eat)')}`}>
                                                <option value="Rice Meals">Rice Meals</option>
                                                <option value="Dal Chawal">Dal Chawal</option>
                                                <option value="Khichdi">Khichdi</option>
                                                <option value="Vegetable Curry">Vegetable Curry</option>
                                                <option value="Chapati Pack">Chapati Pack</option>
                                                <option value="Hot Soup">Hot Soup</option>
                                            </optgroup>
                                            <optgroup label={`🥬 ${t('raw_veg', 'Raw Vegetables')}`}>
                                                <option value="Onion">Onion</option>
                                                <option value="Potato">Potato</option>
                                                <option value="Tomato">Tomato</option>
                                            </optgroup>
                                            <optgroup label={`🌾 ${t('grains', 'Grains & Staples')}`}>
                                                <option value="Rice">Rice</option>
                                                <option value="Dal">Dal</option>
                                                <option value="Wheat Flour">Wheat Flour</option>
                                            </optgroup>
                                        </>
                                    )}
                                </select>
                            </div>

                            {/* Plate Size Selection (Only for Cooked Food) */}
                            {['Rice Meals', 'Dal Chawal', 'Khichdi', 'Vegetable Curry', 'Chapati Pack', 'Hot Soup'].includes(reqItem.name) && (
                                <div>
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">{t('plate_size', 'Plate Size')}</label>
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <button
                                            type="button"
                                            onClick={() => setReqItem({ ...reqItem, plateSize: 'half' })}
                                            className={`py-2 px-4 rounded-lg border-2 font-semibold text-sm transition-all ${reqItem.plateSize === 'half'
                                                ? 'bg-orange-500 text-white border-orange-500'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                                                }`}
                                        >
                                            🍽️ {t('half_plate', 'Half Plate')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setReqItem({ ...reqItem, plateSize: 'full' })}
                                            className={`py-2 px-4 rounded-lg border-2 font-semibold text-sm transition-all ${reqItem.plateSize === 'full'
                                                ? 'bg-orange-500 text-white border-orange-500'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                                                }`}
                                        >
                                            🍽️ {t('full_plate', 'Full Plate')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                                    {t('quantity')}
                                    {!isCookedFood(reqItem.name) && (
                                        <span className="text-xs"> (kg/L)</span>
                                    )}
                                </label>
                                <div className="flex gap-2">
                                    <input type="number" min={isCookedFood(reqItem.name) ? 1 : 0} className="flex-1 border-2 border-slate-200 p-3 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all" value={reqItem.quantity} onChange={e => setReqItem({ ...reqItem, quantity: e.target.value })} />
                                    {!isCookedFood(reqItem.name) && (
                                        <select
                                            className="w-24 border-2 border-slate-200 p-3 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all bg-white"
                                            value={reqItem.unit}
                                            onChange={e => setReqItem({ ...reqItem, unit: e.target.value })}
                                        >
                                            <option value="kg">kg</option>
                                            <option value="l">l</option>
                                            <option value="units">units</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8"><button onClick={() => setShowRequestModal(false)} className="px-6 py-3 text-slate-600 text-sm font-bold hover:bg-slate-100 rounded-xl transition-all">{t('cancel')}</button><button onClick={handleRequestFood} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all">{t('send_request')}</button></div>
                    </div>
                </div>
            )}

            {showFeedbackModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-3xl w-96 shadow-2xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <ThumbsUp size={24} className="text-white" />
                            </div>
                            <h3 className="font-black text-2xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{t('send_feedback')}</h3>
                        </div>
                        <textarea className="w-full border-2 border-slate-200 p-4 rounded-xl h-32 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all resize-none" placeholder="Share your experience..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
                        <div className="flex justify-end gap-3 mt-6"><button onClick={() => setShowFeedbackModal(false)} className="px-6 py-3 text-slate-600 text-sm font-bold hover:bg-slate-100 rounded-xl transition-all">{t('cancel')}</button><button onClick={handleFeedback} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all">{t('submit')}</button></div>
                    </div>
                </div>
            )}

            {/* SOS Alert Modal */}
            {showSOSModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-3xl w-96 shadow-2xl border-2 border-red-500">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                                <AlertTriangle size={24} className="text-white" />
                            </div>
                            <h3 className="font-black text-2xl bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">{t('emergency_sos', 'Emergency SOS')}</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">{t('sos_desc', 'Your location will be sent to Emergency Command Center')}</p>
                        <textarea
                            className="w-full border-2 border-red-200 p-4 rounded-xl h-32 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all resize-none"
                            placeholder={t('describe_emergency', 'Describe the emergency (violence, flood, fire, medical emergency, etc.)...')}
                            value={sosReason}
                            onChange={e => setSOSReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => { setShowSOSModal(false); setSOSReason(''); }} className="px-6 py-3 text-slate-600 text-sm font-bold hover:bg-slate-100 rounded-xl transition-all">{t('cancel', 'Cancel')}</button>
                            <button onClick={sendSOSAlert} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                                <AlertTriangle size={18} /> {t('send_sos', 'Send SOS')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsumerDashboard;