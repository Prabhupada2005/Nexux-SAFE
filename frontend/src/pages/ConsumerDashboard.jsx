import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
    MapPin, MessageCircle, Send, Bot, Utensils, ThumbsUp, Globe, Mic, MicOff, AlertTriangle, Navigation, Truck, Search, Filter, Bell, User, Clock, Loader, ChevronUp, ChevronDown, ChevronLeft, ChevronRight
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

// Pan Control Component
const PanControl = () => {
    const map = useMap();
    const panDistance = 100;

    const handlePan = (direction) => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const pixelDistance = panDistance / Math.pow(2, zoom);

        switch(direction) {
            case 'up':
                map.panTo([center.lat + pixelDistance, center.lng]);
                break;
            case 'down':
                map.panTo([center.lat - pixelDistance, center.lng]);
                break;
            case 'left':
                map.panTo([center.lat, center.lng - pixelDistance]);
                break;
            case 'right':
                map.panTo([center.lat, center.lng + pixelDistance]);
                break;
        }
    };

    return (
        <div className="leaflet-top leaflet-right" style={{marginTop: '80px', marginRight: '10px'}}>
            <div className="leaflet-control" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <button onClick={() => handlePan('up')} className="bg-white hover:bg-gray-100 border-2 border-gray-300 rounded-lg p-2 shadow-md transition" style={{width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <ChevronUp size={20} className="text-gray-700" />
                </button>
                <div style={{display: 'flex', gap: '4px'}}>
                    <button onClick={() => handlePan('left')} className="bg-white hover:bg-gray-100 border-2 border-gray-300 rounded-lg p-2 shadow-md transition" style={{width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <ChevronLeft size={20} className="text-gray-700" />
                    </button>
                    <button onClick={() => handlePan('right')} className="bg-white hover:bg-gray-100 border-2 border-gray-300 rounded-lg p-2 shadow-md transition" style={{width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <ChevronRight size={20} className="text-gray-700" />
                    </button>
                </div>
                <button onClick={() => handlePan('down')} className="bg-white hover:bg-gray-100 border-2 border-gray-300 rounded-lg p-2 shadow-md transition" style={{width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <ChevronDown size={20} className="text-gray-700" />
                </button>
            </div>
        </div>
    );
};

const FOOD_CENTERS = [
    { id: 1, name: "Moirang Bazar Food Center", address: "Moirang Bazar, Bishnupur", lat: 24.5167, lng: 93.7667, status: "open", crowd: "High", crowdCount: 85, cookedFood: true, itemsList: ["Rice Meals", "Dal Chawal", "Khichdi", "Vegetable Curry", "Chapati Pack", "Hot Soup", "Onion", "Potato", "Tomato", "Rice", "Dal", "Wheat Flour", "Water", "Milk", "Cooking Oil", "Salt", "Sugar", "Tea", "Biscuits", "Bread", "Eggs", "Carrot", "Cabbage", "Spinach", "Garlic", "Ginger", "Green Chili", "Coriander", "Turmeric", "Red Chili Powder", "Cumin", "Mustard Oil", "Ghee", "Paneer", "Yogurt", "Butter", "Cheese", "Noodles", "Pasta", "Corn Flakes", "Oats", "Honey", "Jam", "Peanut Butter", "Pickle"] },
    { id: 2, name: "Imphal Community Kitchen", address: "Thangal Bazar, Imphal West", lat: 24.8170, lng: 93.9368, status: "open", crowd: "Low", crowdCount: 12, cookedFood: true, itemsList: ["Rice Meals", "Dal Chawal", "Khichdi", "Vegetable Curry", "Chapati Pack", "Hot Soup", "Onion", "Potato", "Tomato", "Carrot", "Cabbage", "Rice", "Dal", "Wheat Flour", "Water", "Milk", "Tea", "Sugar", "Salt", "Cooking Oil", "Biscuits", "Bread", "Eggs", "Spinach", "Garlic", "Ginger", "Green Chili", "Coriander", "Turmeric", "Red Chili Powder", "Cumin", "Mustard Oil", "Ghee", "Paneer", "Yogurt", "Butter", "Cheese", "Noodles", "Pasta", "Corn Flakes", "Oats", "Honey", "Jam", "Peanut Butter", "Pickle", "Soy Sauce", "Vinegar", "Ketchup", "Mayonnaise", "Chutney", "Papad", "Vermicelli", "Semolina", "Besan", "Maida", "Cornflour", "Baking Powder", "Baking Soda", "Yeast", "Vanilla Essence", "Cocoa Powder", "Chocolate"] },
    { id: 3, name: "Thoubal Relief Center", address: "Thoubal Bazar, Thoubal", lat: 24.6340, lng: 93.9856, status: "open", crowd: "Medium", crowdCount: 45, cookedFood: true, itemsList: ["Rice Meals", "Dal Chawal", "Khichdi", "Vegetable Curry", "Onion", "Potato", "Tomato", "Rice", "Dal", "Wheat Flour", "Water", "Cooking Oil", "Biscuits", "Bread", "Salt", "Sugar", "Tea", "Milk", "Eggs", "Carrot", "Cabbage", "Spinach", "Garlic", "Ginger", "Green Chili", "Coriander", "Turmeric", "Red Chili Powder", "Cumin", "Mustard Oil", "Ghee", "Paneer", "Yogurt", "Butter", "Noodles", "Pasta", "Oats", "Honey"] },
    { id: 4, name: "Churachandpur Food Hub", address: "Tuibong, Churachandpur", lat: 24.3333, lng: 93.6833, status: "open", crowd: "Low", crowdCount: 18, cookedFood: true, itemsList: ["Rice Meals", "Dal Chawal", "Khichdi", "Vegetable Curry", "Chapati Pack", "Hot Soup", "Onion", "Potato", "Tomato", "Rice", "Dal", "Wheat Flour", "Water", "Milk", "Eggs", "Cooking Oil", "Spices", "Salt", "Sugar", "Tea", "Biscuits", "Bread", "Carrot", "Cabbage", "Spinach", "Garlic", "Ginger", "Green Chili", "Coriander", "Turmeric", "Red Chili Powder", "Cumin", "Mustard Oil", "Ghee", "Paneer", "Yogurt", "Butter", "Cheese", "Noodles", "Pasta", "Corn Flakes", "Oats", "Honey", "Jam", "Peanut Butter", "Pickle", "Papad", "Vermicelli", "Semolina", "Besan", "Maida", "Cornflour", "Baking Powder"] },
    { id: 5, name: "Kakching Distribution Center", address: "Kakching Khunou, Kakching", lat: 24.4980, lng: 93.9810, status: "open", crowd: "Medium", crowdCount: 52, cookedFood: false, itemsList: ["Onion", "Potato", "Tomato", "Carrot", "Cabbage", "Rice", "Dal", "Wheat Flour", "Water", "Cooking Oil", "Salt", "Sugar", "Tea", "Biscuits", "Bread", "Eggs", "Spinach", "Garlic", "Ginger", "Green Chili", "Coriander", "Turmeric", "Red Chili Powder", "Cumin", "Mustard Oil", "Ghee", "Paneer", "Yogurt", "Butter", "Cheese", "Noodles", "Pasta", "Oats", "Honey", "Jam", "Pickle", "Papad", "Vermicelli", "Semolina", "Besan", "Maida"] },
    { id: 6, name: "Ukhrul Relief Station", address: "Ukhrul Town, Ukhrul", lat: 25.0500, lng: 94.3600, status: "open", crowd: "High", crowdCount: 92, cookedFood: true, itemsList: ["Rice Meals", "Dal Chawal", "Khichdi", "Vegetable Curry", "Chapati Pack", "Onion", "Potato", "Rice", "Dal", "Water", "Cooking Oil", "Salt", "Sugar", "Tea", "Biscuits", "Bread", "Milk", "Eggs", "Tomato", "Carrot", "Cabbage", "Spinach", "Garlic", "Ginger", "Green Chili", "Coriander", "Turmeric", "Red Chili Powder", "Cumin"] },
    { id: 7, name: "Senapati Emergency Kitchen", address: "Senapati Bazar, Senapati", lat: 25.2667, lng: 94.0167, status: "open", crowd: "Low", crowdCount: 8, cookedFood: true, itemsList: ["Rice Meals", "Dal Chawal", "Khichdi", "Vegetable Curry", "Chapati Pack", "Hot Soup", "Onion", "Potato", "Tomato", "Rice", "Dal", "Wheat Flour", "Water", "Milk", "Cooking Oil", "Spices", "Salt", "Sugar", "Tea", "Biscuits", "Bread", "Eggs", "Carrot", "Cabbage", "Spinach", "Garlic", "Ginger", "Green Chili", "Coriander", "Turmeric", "Red Chili Powder", "Cumin", "Mustard Oil", "Ghee", "Paneer", "Yogurt", "Butter", "Cheese", "Noodles", "Pasta", "Corn Flakes", "Oats", "Honey", "Jam", "Peanut Butter", "Pickle", "Papad", "Vermicelli", "Semolina", "Besan", "Maida", "Cornflour", "Baking Powder", "Baking Soda", "Yeast", "Vanilla Essence"] },
    { id: 8, name: "Jiribam Food Point", address: "Jiribam Town, Jiribam", lat: 24.8050, lng: 93.1100, status: "open", crowd: "Medium", crowdCount: 38, cookedFood: false, itemsList: ["Onion", "Potato", "Tomato", "Rice", "Dal", "Wheat Flour", "Water", "Cooking Oil", "Salt", "Sugar", "Biscuits", "Bread", "Tea", "Milk", "Eggs", "Carrot", "Cabbage", "Spinach", "Garlic", "Ginger", "Green Chili", "Coriander", "Turmeric", "Red Chili Powder", "Cumin", "Mustard Oil", "Ghee", "Paneer", "Yogurt", "Butter", "Noodles", "Pasta", "Oats", "Honey"] },
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
    const [reqItem, setReqItem] = useState({ name: '', quantity: '1', plateSize: 'full' });
    const [feedbackText, setFeedbackText] = useState('');
    const [isListening, setIsListening] = useState(false);

    // Routing States
    const [routePath, setRoutePath] = useState([]); // Stores the road coordinates
    const [routeInfo, setRouteInfo] = useState(null); // Stores distance/duration
    const [truckPosition, setTruckPosition] = useState(null); // Live truck location
    const [truckProgress, setTruckProgress] = useState(0); // 0-100% progress

    // Calculate nearest low-crowded center
    const nearestCenter = useMemo(() => {
        if (!userLoc) return null;

        // Filter out high-crowded centers
        const availableCenters = centers.filter(c => c.crowd !== 'High' && c.status === 'open');

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
    const [msgText, setMsgText] = useState("");
    const [supplierMessages, setSupplierMessages] = useState([]);
    const [aiMessages, setAiMessages] = useState([{ sender: 'AI Bot', content: 'Hello! I am your FoodTech Assistant. How can I help you today?', self: false }]);
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [filters, setFilters] = useState({ openNow: false, nearest: false, hotMeals: false, lowStock: false });
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [showItemsModal, setShowItemsModal] = useState(false);
    const [selectedCenter, setSelectedCenter] = useState(null);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showDirectionsModal, setShowDirectionsModal] = useState(false);

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
            setLastUpdated(new Date());
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // --- Voice Command ---
    const startListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { 
            alert("Speech recognition not supported in this browser. Please use Chrome or Edge."); 
            return; 
        }
        
        const recognition = new SpeechRecognition();
        recognition.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        setIsListening(true);
        
        recognition.onstart = () => {
            console.log('Voice recognition started - speak now');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();
            console.log('You said:', transcript);
            
            // Map of common food items for better matching
            const foodItems = [
                'Rice Meals', 'Dal Chawal', 'Khichdi', 'Vegetable Curry', 'Chapati Pack', 'Hot Soup',
                'Onion', 'Potato', 'Tomato', 'Rice', 'Dal', 'Wheat Flour'
            ];
            
            // Try to find matching food item
            let matchedItem = '';
            const lowerTranscript = transcript.toLowerCase();
            
            for (let item of foodItems) {
                if (lowerTranscript.includes(item.toLowerCase())) {
                    matchedItem = item;
                    break;
                }
            }
            
            // Extract quantity if mentioned
            const numberMatch = transcript.match(/(\d+)/);
            const quantity = numberMatch ? numberMatch[0] : '1';
            
            // Update the form with recognized values
            setReqItem({ 
                ...reqItem, 
                name: matchedItem || transcript, // Use matched item or full transcript
                quantity: quantity 
            });
            
            setIsListening(false);
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                alert('Microphone access denied. Please allow microphone access in your browser settings.');
            } else if (event.error === 'no-speech') {
                alert('No speech detected. Please try again and speak clearly.');
            } else {
                alert('Voice recognition error: ' + event.error);
            }
        };
        
        recognition.onend = () => {
            console.log('Voice recognition ended');
            setIsListening(false);
        };
        
        try {
            recognition.start();
        } catch (error) {
            console.error('Failed to start recognition:', error);
            setIsListening(false);
            alert('Failed to start voice recognition. Please try again.');
        }
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
        if (!reqItem.name) return;
        const user = JSON.parse(localStorage.getItem('foodtech_user'));

        try {
            await axios.post('http://localhost:8000/request-food', {
                consumer_name: user.full_name || user.name,
                consumer_age: user.age || 0,
                consumer_family_members: user.family_members || 1,
                consumer_phone: user.phone || '',
                item_name: reqItem.name,
                quantity: parseFloat(reqItem.quantity),
                plate_size: reqItem.plateSize,
                delivery_requested: reqItem.deliveryRequested || false,
                center_name: reqItem.centerName || ''
            });
            setShowRequestModal(false);
            setReqItem({ name: '', quantity: '1', plateSize: 'full' });

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

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setShowItemsModal(false);
        setShowDeliveryModal(true);
    };

    const handleDeliveryChoice = async (wantsDelivery) => {
        const user = JSON.parse(localStorage.getItem('foodtech_user'));
        
        try {
            await axios.post('http://localhost:8000/request-food', {
                consumer_name: user.full_name || user.name,
                consumer_age: user.age || 0,
                consumer_family_members: user.family_members || 1,
                consumer_phone: user.phone || '',
                item_name: selectedItem,
                quantity: 1,
                delivery_requested: wantsDelivery,
                center_name: selectedCenter.name,
                status: 'pending'
            });
            
            setShowDeliveryModal(false);
            setSelectedItem(null);
            
            if (wantsDelivery) {
                alert(`Delivery request sent for ${selectedItem}! Supplier will check availability and confirm.`);
            } else {
                if (userLoc && selectedCenter) {
                    await getRoadRoute(selectedCenter, userLoc);
                    alert(`Pickup request sent! Route to ${selectedCenter.name} is now displayed on the map.`);
                } else {
                    alert(`Pickup request sent for ${selectedItem}! You can collect from ${selectedCenter.name}.`);
                }
            }
        } catch (e) {
            alert("Error sending request.");
        }
    };

    const handleDirectionsChoice = async (wantsDelivery) => {
        setShowDirectionsModal(false);
        
        if (wantsDelivery) {
            // Simulate supplier confirmation (in real app, this would be an API call)
            const canDeliver = Math.random() > 0.3; // 70% success rate
            
            if (canDeliver) {
                alert(`Delivery confirmed! Supplier will deliver to your location.`);
                if (userLoc && selectedCenter) {
                    await getRoadRoute(selectedCenter, userLoc);
                }
            } else {
                alert(`Sorry, delivery is not available for your location. Please choose pickup option.`);
            }
        } else {
            // Show route without truck animation
            if (userLoc && selectedCenter) {
                try {
                    const url = `https://router.project-osrm.org/route/v1/driving/${selectedCenter.lng},${selectedCenter.lat};${userLoc.lng},${userLoc.lat}?overview=full&geometries=geojson`;
                    const response = await axios.get(url);
                    
                    if (response.data.routes && response.data.routes.length > 0) {
                        const route = response.data.routes[0];
                        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                        setRoutePath(coordinates);
                        setRouteInfo({
                            distance: (route.distance / 1000).toFixed(1) + " km",
                            duration: (route.duration / 60).toFixed(0) + " min"
                        });
                        // Don't set truck position for pickup
                        setTruckPosition(null);
                        setTruckProgress(0);
                        alert(`Route to ${selectedCenter.name} is now displayed. Follow the path on the map.`);
                    }
                } catch (error) {
                    setRoutePath([[selectedCenter.lat, selectedCenter.lng], [userLoc.lat, userLoc.lng]]);
                }
            }
        }
    };

    const openGoogleMaps = () => {
        if (userLoc && centers[1]) {
            const url = `https://www.google.com/maps/dir/?api=1&origin=${centers[1].lat},${centers[1].lng}&destination=${userLoc.lat},${userLoc.lng}&travelmode=driving`;
            window.open(url, '_blank');
        }
    };

    const handleFeedback = async () => { alert("Feedback Sent!"); setShowFeedbackModal(false); };

    const sendChatMessage = async (e) => {
        e.preventDefault();
        if (!msgText) return;
        const user = JSON.parse(localStorage.getItem('foodtech_user'));
        if (activeChat === 'supplier') {
            await axios.post('http://localhost:8000/messages', { sender: user.name, content: msgText });
            const res = await axios.get('http://localhost:8000/messages');
            setSupplierMessages(res.data.reverse());
        } else {
            setAiMessages(prev => [...prev, { sender: 'You', content: msgText, self: true }]);
            setIsAiTyping(true);
            
            // Simulate AI response with realistic delay
            setTimeout(() => {
                const responses = [
                    "I can help you find the nearest food center. Would you like me to show you?",
                    "Based on your location, I recommend visiting Imphal Community Kitchen - it has low crowd and hot meals available.",
                    "You can request food by clicking the 'Request Food' button. What would you like to order?",
                    "All our food centers are currently open. The nearest one is " + (nearestCenter ? nearestCenter.distance + " km away." : "being calculated."),
                    "I can assist you with food requests, finding centers, or answering questions about our service."
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                setAiMessages(prev => [...prev, { sender: 'AI Bot', content: randomResponse, self: false }]);
                setIsAiTyping(false);
            }, 1500);
        }
        setMsgText("");
    };

    // Filter centers
    const filteredCenters = useMemo(() => {
        let result = centers;
        if (searchQuery) {
            result = result.filter(c => 
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.address.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (filters.openNow) result = result.filter(c => c.status === 'open');
        if (filters.hotMeals) result = result.filter(c => c.cookedFood);
        if (filters.lowStock) result = result.filter(c => c.items < 40);
        if (filters.nearest && userLoc) {
            result = result.sort((a, b) => {
                const distA = Math.sqrt(Math.pow(a.lat - userLoc.lat, 2) + Math.pow(a.lng - userLoc.lng, 2));
                const distB = Math.sqrt(Math.pow(b.lat - userLoc.lat, 2) + Math.pow(b.lng - userLoc.lng, 2));
                return distA - distB;
            });
        }
        return result;
    }, [centers, searchQuery, filters, userLoc]);

    return (
        <div className="h-screen flex flex-col bg-[#F5F7FA]" style={{fontFamily: 'Inter, system-ui, sans-serif'}}>
            {/* Modern Header */}
            <header className="bg-white border-b border-[#E0E0E0] px-6 py-4 flex justify-between items-center shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#1B5E20] rounded-xl flex items-center justify-center">
                        <Utensils size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">SAFE Platform</h1>
                        <p className="text-xs text-gray-500">Consumer Dashboard</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={toggleLanguage} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
                        <Globe size={18} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">{i18n.language.toUpperCase()}</span>
                    </button>
                    <button className="relative p-2 rounded-lg hover:bg-gray-100 transition">
                        <Bell size={20} className="text-gray-600" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                    <button onClick={handleSOS} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm">
                        <AlertTriangle size={16} />
                        SOS
                    </button>
                    <button onClick={() => navigate('/login')} className="p-2 rounded-lg hover:bg-gray-100 transition">
                        <User size={20} className="text-gray-600" />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden" style={{position: 'relative', zIndex: 1}}>
                {/* Left Sidebar */}
                <div className="w-1/2 bg-white border-r border-[#E0E0E0] flex flex-col" style={{zIndex: 10}}>
                    <div className="p-5 space-y-4 overflow-y-auto h-full">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search food centers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-[#E0E0E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B5E20] text-sm"
                            />
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => setFilters({...filters, openNow: !filters.openNow})} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filters.openNow ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                Open Now
                            </button>
                            <button onClick={() => setFilters({...filters, nearest: !filters.nearest})} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filters.nearest ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                Nearest
                            </button>
                            <button onClick={() => setFilters({...filters, hotMeals: !filters.hotMeals})} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filters.hotMeals ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                Hot Meals
                            </button>
                            <button onClick={() => setFilters({...filters, lowStock: !filters.lowStock})} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filters.lowStock ? 'bg-[#1B5E20] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                                Low Stock
                            </button>
                        </div>

                        {/* Info Bar */}
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Showing {filteredCenters.length} nearby centers</span>
                            <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {lastUpdated.toLocaleTimeString()}
                            </span>
                        </div>

                        {/* NEAREST CENTER RECOMMENDATION */}
                        {nearestCenter && (
                            <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-2xl p-5 shadow-xl border border-green-400 animate-in fade-in slide-in-from-top duration-500">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                            <Navigation size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-green-100 font-bold uppercase tracking-wider">Nearest Center</p>
                                            <p className="text-2xl font-black text-white">{nearestCenter.distance} km</p>
                                        </div>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                        <span className="text-xs font-black text-white flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                            {nearestCenter.crowd}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-3">
                                    <h4 className="font-bold text-white text-sm mb-1">{nearestCenter.name}</h4>
                                    <p className="text-xs text-green-100 flex items-center gap-1">
                                        <MapPin size={11} />
                                        {nearestCenter.address}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-white">📦 {nearestCenter.items} items</span>
                                    </div>
                                    {nearestCenter.cookedFood && (
                                        <div className="bg-orange-500/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-orange-300/50">
                                            <span className="text-xs font-bold text-white">🍛 Hot Meals</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedCenter(nearestCenter);
                                        setShowDirectionsModal(true);
                                    }}
                                    className="w-full bg-white hover:bg-green-50 text-green-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                                >
                                    <Truck size={16} />
                                    Get Directions
                                </button>
                            </div>
                        )}

                        {/* ROUTE INFO CARD WITH TRUCK TRACKING - Only for Delivery */}
                        {routePath.length > 0 && routeInfo && truckPosition && (
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 shadow-xl animate-in fade-in slide-in-from-left duration-500 border border-emerald-400">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xs text-emerald-100 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                            <Truck size={14} className="animate-bounce" /> Delivery Truck En Route
                                        </p>
                                        <h3 className="text-3xl font-black text-white">{routeInfo.duration}</h3>
                                        <p className="text-sm text-emerald-100 mt-1">{routeInfo.distance} away</p>
                                    </div>
                                    <button onClick={openGoogleMaps} className="bg-white/20 backdrop-blur-sm text-white px-3 py-2 rounded-xl hover:bg-white/30 text-xs font-bold flex items-center gap-1.5 border border-white/30 transition-all">
                                        <Navigation size={14} /> Open
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
                                            style={{ width: `${truckProgress}%` }}
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
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setShowRequestModal(true)} className="bg-[#1B5E20] hover:bg-[#145018] text-white py-4 rounded-xl font-medium flex flex-col items-center justify-center gap-2 shadow-sm transition">
                                <Utensils size={22} />
                                <span className="text-sm">{t('request_food')}</span>
                            </button>
                            <button onClick={() => setActiveChat('ai')} className="bg-[#1B5E20] hover:bg-[#145018] text-white py-4 rounded-xl font-medium flex flex-col items-center justify-center gap-2 shadow-sm transition">
                                <Bot size={22} />
                                <span className="text-sm">{t('ai_help')}</span>
                            </button>
                        </div>

                        {/* Centers List */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-900 text-sm">{t('nearest_centers')}</h3>
                            {filteredCenters.map(center => (
                                <div key={center.id} className="bg-white border border-[#E0E0E0] rounded-xl p-4 hover:shadow-md transition">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-semibold text-gray-900 text-sm">{center.name}</h4>
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${center.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {center.status === 'open' ? 'OPEN' : 'CLOSED'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                                        <MapPin size={11} />
                                        {center.address}
                                    </p>
                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                        <span className={`text-[10px] px-2 py-1 rounded-lg font-medium flex items-center gap-1 ${center.crowd === 'High' ? 'bg-red-50 text-red-700' : center.crowd === 'Medium' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                                            👥 {center.crowdCount} people
                                        </span>
                                        <button 
                                            onClick={() => { setSelectedCenter(center); setShowItemsModal(true); }}
                                            className="text-[10px] px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition cursor-pointer"
                                        >
                                            📦 {center.itemsList.length} items
                                        </button>
                                        {center.cookedFood && (
                                            <span className="text-[10px] px-2 py-1 rounded-lg bg-orange-50 text-orange-700 font-medium">
                                                🍛 Hot Meals
                                            </span>
                                        )}
                                    </div>
                                    <button onClick={() => setActiveChat('supplier')} className="w-full bg-[#1B5E20] hover:bg-[#145018] text-white py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2">
                                        <MessageCircle size={14} />
                                        {t('chat_supplier')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side - Map */}
                <div className="flex-1 relative" style={{zIndex: 1}}>
                    <MapContainer 
                        center={[24.8170, 93.9368]} 
                        zoom={10} 
                        style={{ height: "100%", width: "100%", background: "#f5f5f5" }}
                        scrollWheelZoom={true}
                        dragging={true}
                        touchZoom={true}
                        doubleClickZoom={true}
                        zoomControl={true}
                        minZoom={8}
                        maxZoom={18}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap'
                        />
                        <PanControl />
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
                        {userLoc && <Marker position={[userLoc.lat, userLoc.lng]} icon={L.icon({ iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png', iconSize: [40, 40], iconAnchor: [20, 40] })}><Popup><b style="color: #16a34a;">{t('you')}</b><br /><span style="font-size: 11px; color: #6b7280;">Your Current Location</span></Popup></Marker>}

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

                        {/* --- DYNAMIC ROAD PATH --- */}
                        {routePath.length > 0 && (
                            <Polyline
                                positions={routePath}
                                color={truckPosition ? "#10b981" : "#3b82f6"}
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
                <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border-2 border-slate-200 flex flex-col z-[100] overflow-hidden">
                    <div className={`${activeChat === 'ai' ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-green-600 to-emerald-600'} text-white p-4 flex justify-between items-center`}>
                        <span className="font-black flex gap-2 text-base items-center">{activeChat === 'ai' ? <Bot size={20} /> : <MessageCircle size={20} />}{activeChat === 'ai' ? t('ai_assistant') : t('supplier_support')}</span>
                        <button onClick={() => setActiveChat(null)} className="hover:bg-white/20 rounded-lg p-2 transition-all"><span className="text-xl">×</span></button>
                    </div>
                    <div className="h-80 p-4 overflow-y-auto bg-gradient-to-b from-slate-50 to-white space-y-3">
                        {activeChat === 'supplier' ? supplierMessages.map((m, i) => <div key={i} className={`p-3 rounded-2xl text-sm max-w-[80%] shadow-sm ${m.sender === (JSON.parse(localStorage.getItem('foodtech_user'))?.name) ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white ml-auto' : 'bg-white border border-slate-200'}`}>{m.content}</div>) : aiMessages.map((m, i) => <div key={i} className={`p-3 rounded-2xl text-sm max-w-[80%] shadow-sm ${m.self ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white ml-auto' : 'bg-white border border-slate-200'}`}>{m.content}</div>)}
                        {isAiTyping && activeChat === 'ai' && (
                            <div className="p-3 rounded-2xl text-sm max-w-[80%] bg-white border border-slate-200 flex items-center gap-2">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                                </div>
                                <span className="text-slate-500 text-xs">AI is typing...</span>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={sendChatMessage} className="p-4 border-t-2 border-slate-100 flex gap-3 bg-white"><input value={msgText} onChange={e => setMsgText(e.target.value)} className="flex-1 text-sm outline-none px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all" placeholder={t('type_message')} /><button type="submit" className={`${activeChat === 'ai' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'} text-white p-3 rounded-xl shadow-md hover:shadow-lg transition-all`}><Send size={18} /></button></form>
                </div>
            )}

            {showRequestModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white p-8 rounded-3xl w-96 shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-2xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Utensils size={24} className="text-white" />
                                </div>
                                {t('request_food')}
                            </h3>
                            <button onClick={startListening} className={`p-3 rounded-xl transition-all shadow-md ${isListening ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse' : 'bg-slate-100 hover:bg-slate-200'}`}>{isListening ? <MicOff size={20} /> : <Mic size={20} />}</button>
                        </div>
                        {isListening && <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-center"><p className="text-sm text-red-600 font-bold flex items-center justify-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>Listening...</p></div>}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">{t('food_type')}</label>
                                <select className="w-full border-2 border-slate-200 p-3 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all" onChange={(e) => setReqItem({ ...reqItem, name: e.target.value })} value={reqItem.name}>
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

                            {/* Plate Size Selection (Only for Cooked Food) */}
                            {['Rice Meals', 'Dal Chawal', 'Khichdi', 'Vegetable Curry', 'Chapati Pack', 'Hot Soup'].includes(reqItem.name) && (
                                <div>
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Plate Size</label>
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <button
                                            type="button"
                                            onClick={() => setReqItem({ ...reqItem, plateSize: 'half' })}
                                            className={`py-2 px-4 rounded-lg border-2 font-semibold text-sm transition-all ${reqItem.plateSize === 'half'
                                                    ? 'bg-orange-500 text-white border-orange-500'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                                                }`}
                                        >
                                            🍽️ Half Plate
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setReqItem({ ...reqItem, plateSize: 'full' })}
                                            className={`py-2 px-4 rounded-lg border-2 font-semibold text-sm transition-all ${reqItem.plateSize === 'full'
                                                    ? 'bg-orange-500 text-white border-orange-500'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                                                }`}
                                        >
                                            🍽️ Full Plate
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Quantity (Only for Raw Items) */}
                            {!['Rice Meals', 'Dal Chawal', 'Khichdi', 'Vegetable Curry', 'Chapati Pack', 'Hot Soup'].includes(reqItem.name) && reqItem.name && (
                                <div><label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">{t('quantity')} (kg/L)</label><input type="number" className="w-full border-2 border-slate-200 p-3 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all" value={reqItem.quantity} onChange={e => setReqItem({ ...reqItem, quantity: e.target.value })} /></div>
                            )}

                            {/* Number of Plates (Only for Cooked Food) */}
                            {['Rice Meals', 'Dal Chawal', 'Khichdi', 'Vegetable Curry', 'Chapati Pack', 'Hot Soup'].includes(reqItem.name) && (
                                <div><label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Number of Plates</label><input type="number" className="w-full border-2 border-slate-200 p-3 rounded-xl mt-1 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all" value={reqItem.quantity} onChange={e => setReqItem({ ...reqItem, quantity: e.target.value })} min="1" /></div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 mt-8"><button onClick={() => setShowRequestModal(false)} className="px-6 py-3 text-slate-600 text-sm font-bold hover:bg-slate-100 rounded-xl transition-all">{t('cancel')}</button><button onClick={handleRequestFood} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all">{t('send_request')}</button></div>
                    </div>
                </div>
            )}

            {showFeedbackModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
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

            {/* Items List Modal */}
            {showItemsModal && selectedCenter && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Utensils size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-gray-900">{selectedCenter.name}</h3>
                                    <p className="text-xs text-gray-500">{selectedCenter.itemsList.length} items available - Click to request</p>
                                </div>
                            </div>
                            <button onClick={() => setShowItemsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                                <span className="text-2xl text-gray-500">×</span>
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {selectedCenter.itemsList.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleItemClick(item)}
                                    className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-3 hover:shadow-md hover:border-blue-300 transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">
                                            {['Rice Meals', 'Dal Chawal', 'Khichdi', 'Vegetable Curry', 'Chapati Pack', 'Hot Soup'].includes(item) ? '🍛' : 
                                             ['Onion', 'Potato', 'Tomato', 'Carrot', 'Cabbage'].includes(item) ? '🥬' : 
                                             ['Rice', 'Dal', 'Wheat Flour'].includes(item) ? '🌾' : 
                                             ['Water', 'Milk', 'Tea'].includes(item) ? '🥤' : '📦'}
                                        </span>
                                        <span className="text-sm font-semibold text-gray-800">{item}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setShowItemsModal(false)} className="px-6 py-3 bg-[#1B5E20] hover:bg-[#145018] text-white rounded-xl font-medium transition">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delivery Choice Modal */}
            {showDeliveryModal && selectedItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Truck size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-gray-900">Delivery Option</h3>
                                <p className="text-xs text-gray-500">Choose how to receive: {selectedItem}</p>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                            <p className="text-sm text-blue-800">
                                <span className="font-bold">From:</span> {selectedCenter.name}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                {selectedCenter.address}
                            </p>
                        </div>

                        <div className="space-y-3 mb-6">
                            <button
                                onClick={() => handleDeliveryChoice(true)}
                                className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold flex items-center justify-between transition shadow-md hover:shadow-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <Truck size={20} />
                                    <div className="text-left">
                                        <div className="font-bold">Deliver to Me</div>
                                        <div className="text-xs opacity-90">Supplier will check availability</div>
                                    </div>
                                </div>
                                <span className="text-2xl">→</span>
                            </button>

                            <button
                                onClick={() => handleDeliveryChoice(false)}
                                className="w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold flex items-center justify-between transition shadow-md hover:shadow-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <MapPin size={20} />
                                    <div className="text-left">
                                        <div className="font-bold">I'll Pick Up</div>
                                        <div className="text-xs opacity-90">Collect from center</div>
                                    </div>
                                </div>
                                <span className="text-2xl">→</span>
                            </button>
                        </div>

                        <button
                            onClick={() => { setShowDeliveryModal(false); setShowItemsModal(true); }}
                            className="w-full px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition"
                        >
                            Back to Items
                        </button>
                    </div>
                </div>
            )}

            {/* Directions Choice Modal */}
            {showDirectionsModal && selectedCenter && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Navigation size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-gray-900">Get Directions</h3>
                                <p className="text-xs text-gray-500">How would you like to receive food?</p>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                            <p className="text-sm text-green-800">
                                <span className="font-bold">To:</span> {selectedCenter.name}
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                                {selectedCenter.address}
                            </p>
                            <p className="text-xs text-green-700 mt-2 font-semibold">
                                📍 {selectedCenter.distance} km away
                            </p>
                        </div>

                        <div className="space-y-3 mb-6">
                            <button
                                onClick={() => handleDirectionsChoice(true)}
                                className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold flex items-center justify-between transition shadow-md hover:shadow-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <Truck size={20} />
                                    <div className="text-left">
                                        <div className="font-bold">Request Delivery</div>
                                        <div className="text-xs opacity-90">We'll check if delivery is available</div>
                                    </div>
                                </div>
                                <span className="text-2xl">→</span>
                            </button>

                            <button
                                onClick={() => handleDirectionsChoice(false)}
                                className="w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold flex items-center justify-between transition shadow-md hover:shadow-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <MapPin size={20} />
                                    <div className="text-left">
                                        <div className="font-bold">I'll Pick Up</div>
                                        <div className="text-xs opacity-90">Show me directions to center</div>
                                    </div>
                                </div>
                                <span className="text-2xl">→</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowDirectionsModal(false)}
                            className="w-full px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsumerDashboard;