import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  MapPin, Utensils, TrendingUp, Shield, Users, Heart, 
  ArrowRight, Menu, X, Phone, Mail, MapPinned, ChevronDown,
  Package, Zap, Globe, CheckCircle, Thermometer, Truck, Download, WifiOff, ShieldAlert
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const FOOD_CENTERS = [
  {id: 1, name:"Moirang Bazar Food Center", lat:24.5167, lng:93.7667, items: 45},
  {id: 2, name:"Imphal Community Kitchen", lat:24.8170, lng:93.9368, items: 62},
  {id: 3, name:"Thoubal Relief Center", lat:24.6340, lng:93.9856, items: 38},
  {id: 4, name:"Churachandpur Food Hub", lat:24.3333, lng:93.6833, items: 52},
  {id: 5, name:"Kakching Distribution Center", lat:24.4980, lng:93.9810, items: 41},
  {id: 6, name:"Ukhrul Relief Station", lat:25.0500, lng:94.3600, items: 29},
  {id: 7, name:"Senapati Emergency Kitchen", lat:25.2667, lng:94.0167, items: 55},
  {id: 8, name:"Jiribam Food Point", lat:24.8050, lng:93.1100, items: 34},
];

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

// GeolocationMap Component (kept for legacy absolute-overlay rendering)
const GeolocationMap = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [nearestCenters, setNearestCenters] = useState([]);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setPermissionDenied(false);

          // Calculate distances to all centers and sort
          const centersWithDistance = FOOD_CENTERS.map(center => ({
            ...center,
            distance: calculateDistance(latitude, longitude, center.lat, center.lng)
          })).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

          setNearestCenters(centersWithDistance.slice(0, 3));
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setPermissionDenied(true);
            setErrorMsg('Please enable location access in your browser settings');
          } else {
            setErrorMsg('Unable to get your location');
          }
          // Use a default center location if geolocation fails
          setUserLocation({ lat: 24.8170, lng: 93.9368 });
        }
      );
    }
  }, []);

  // Map coordinates to screen percentage
  const latMin = 24.0, latMax = 25.5, lngMin = 92.8, lngMax = 94.8;
  const mapUserPosition = (lat, lng) => {
    const xPercent = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    const yPercent = ((latMax - lat) / (latMax - latMin)) * 100;
    return { xPercent, yPercent };
  };

  return (
    <>
      {/* User Location Marker */}
      {userLocation && (
        <div
          className="absolute group"
          style={{
            left: `${mapUserPosition(userLocation.lat, userLocation.lng).xPercent}%`,
            top: `${mapUserPosition(userLocation.lat, userLocation.lng).yPercent}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 50
          }}
        >
          {/* Animated pulse circles */}
          <div className="absolute w-20 h-20 border-2 border-blue-400 rounded-full -ml-10 -mt-10 animate-pulse opacity-60"></div>
          <div className="absolute w-12 h-12 border-2 border-blue-500 rounded-full -ml-6 -mt-6 animate-pulse opacity-40" style={{animationDelay: '0.3s'}}></div>
          
          {/* User location pin */}
          <div className="w-8 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-lg shadow-blue-500/60 flex items-center justify-center border-3 border-white relative z-20 transform hover:scale-125 transition-transform">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 bg-white/95 text-slate-900 px-4 py-3 rounded-lg whitespace-nowrap text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl z-30 border border-blue-400/50">
            {permissionDenied ? 'Location Access Needed' : 'Your Location'}
            {userLocation && !permissionDenied && (
              <div className="text-xs text-slate-500 mt-1">{userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</div>
            )}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white/95"></div>
          </div>
        </div>
      )}

      {/* Nearest Centers Markers */}
      {nearestCenters.map((center, i) => {
        const pos = mapUserPosition(center.lat, center.lng);
        return (
          <div
            key={center.id}
            className="absolute group cursor-pointer"
            style={{
              left: `${pos.xPercent}%`,
              top: `${pos.yPercent}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 40 - i
            }}
          >
            {/* Animated pulse ring */}
            <div 
              className="absolute border-2 border-emerald-400 rounded-full"
              style={{
                width: '36px',
                height: '36px',
                left: '-18px',
                top: '-18px',
                animation: `pulse-expand 2.5s ease-out infinite`,
                animationDelay: `${i * 0.3}s`
              }}
            ></div>
            
            {/* Center marker pin */}
            <div className="w-10 h-10 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full shadow-lg shadow-emerald-500/60 flex items-center justify-center border-3 border-white transform transition-all duration-300 group-hover:scale-125 group-hover:shadow-emerald-500/80 relative z-20 hover:from-emerald-300 hover:to-emerald-500">
              <Utensils className="w-5 h-5 text-white" size={18} />
            </div>

            {/* Info Tooltip */}
            <div className="absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 bg-white/95 text-slate-900 px-4 py-3 rounded-lg whitespace-nowrap text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl z-30 border border-emerald-500/30">
              <div className="font-bold text-emerald-700">{center.name}</div>
              <div className="text-xs text-slate-600 mt-1">📦 {center.items} items | 📏 {center.distance} km away</div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white/95"></div>
            </div>
          </div>
        );
      })}

      {/* All Other Centers (smaller markers) */}
      {FOOD_CENTERS.filter(center => !nearestCenters.find(nc => nc.id === center.id)).map((center) => {
        const pos = mapUserPosition(center.lat, center.lng);
        return (
          <div
            key={center.id}
            className="absolute group cursor-pointer"
            style={{
              left: `${pos.xPercent}%`,
              top: `${pos.yPercent}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 30
            }}
          >
            <div className="w-6 h-6 bg-emerald-500 rounded-full shadow-md shadow-emerald-400/60 flex items-center justify-center border-2 border-white transform transition-all duration-300 group-hover:scale-150 relative">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>

            {/* Small tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-emerald-900/90 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-30 whitespace-nowrap">
              {center.name}
            </div>
          </div>
        );
      })}
    </>
  );
};

// Leaflet interactive coverage map used in Live Relief Coverage section
const LeafletCoverageMap = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [nearestCenters, setNearestCenters] = useState([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setPermissionDenied(false);

          const centersWithDistance = FOOD_CENTERS.map(center => ({
            ...center,
            distance: calculateDistance(latitude, longitude, center.lat, center.lng)
          })).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

          setNearestCenters(centersWithDistance.slice(0, 3));
        },
        (err) => {
          setPermissionDenied(true);
          setUserLocation({ lat: 24.8170, lng: 93.9368 });
        }
      );
    } else {
      setUserLocation({ lat: 24.8170, lng: 93.9368 });
    }
  }, []);

  // Prepare polylines connecting a few centers to simulate network
  const networkLines = [
    [FOOD_CENTERS[0], FOOD_CENTERS[1]],
    [FOOD_CENTERS[1], FOOD_CENTERS[2]],
    [FOOD_CENTERS[2], FOOD_CENTERS[3]],
    [FOOD_CENTERS[3], FOOD_CENTERS[4]],
    [FOOD_CENTERS[4], FOOD_CENTERS[5]],
  ].map(pair => pair.map(c => [c.lat, c.lng]));

  return (
    <MapContainer center={userLocation ? [userLocation.lat, userLocation.lng] : [24.8170, 93.9368]} zoom={9} scrollWheelZoom={false} className="absolute inset-0 w-full h-full z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Coverage circles and center markers */}
      {FOOD_CENTERS.map(center => (
        <React.Fragment key={`center-${center.id}`}>
          <Circle center={[center.lat, center.lng]} pathOptions={{ color: '#10b981', weight: 1, dashArray: '4' }} radius={7000} />
          <CircleMarker center={[center.lat, center.lng]} radius={8} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.9 }}>
            <Popup>
              <div className="text-sm font-bold">{center.name}</div>
              <div className="text-xs">{center.items} kg available</div>
            </Popup>
          </CircleMarker>
        </React.Fragment>
      ))}

      {/* Network polylines */}
      {networkLines.map((coords, i) => (
        <Polyline key={`line-${i}`} positions={coords} pathOptions={{ color: '#06b6d4', weight: 3, opacity: 0.6 }} />
      ))}

      {/* User location and links to nearest centers */}
      {userLocation && (
        <>
          <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={7} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.9 }}>
            <Popup>Your location</Popup>
          </CircleMarker>

          {nearestCenters.map((c, idx) => (
            <Polyline key={`to-${c.id}`} positions={[[userLocation.lat, userLocation.lng], [c.lat, c.lng]]} pathOptions={{ color: '#34d399', weight: 2, dashArray: '6' }} />
          ))}
        </>
      )}
    </MapContainer>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleScroll = () => setScrolled(window.scrollY > 50);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('scroll', handleScroll);

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Hackathon Demo: Inject translations dynamically so language switching works immediately
  useEffect(() => {
    if (i18n.addResourceBundle) {
      i18n.addResourceBundle('hi', 'translation', {
        'active_india': '🇮🇳 भारत में सक्रिय • फोकस: मणिपुर संकट',
        'smart_aid': 'स्मार्ट सहायता',
        'food_emergency': 'खाद्य आपातकाल',
        'hero_desc': 'आपदाओं के दौरान सुरक्षित भोजन स्थानों को मैप करने और खराब होने से रोकने के लिए डिज़ाइन किया गया एक वेब और IoT प्लेटफ़ॉर्म।',
        'get_started': 'मुफ्त में शुरू करें',
        'signin': 'साइन इन करें',
        'live_map': 'लाइव खाद्य केंद्र मानचित्र',
        'map_desc': 'वर्तमान में मणिपुर में 8 राहत केंद्रों के साथ सक्रिय',
        'about_title': 'SAFE के बारे में',
        'about_desc': 'स्मार्ट एड फॉर फूड इमरजेंसी - जब विलंबित रसद और असुरक्षित मार्ग राहत प्रयासों को जोखिम में डालते हैं, तो SAFE वेब और IoT तकनीक के साथ स्मार्ट समाधान प्रदान करता है।',
        'features_title': 'शक्तिशाली विशेषताएं',
        'how_it_works_title': 'यह काम किस प्रकार करता है',
        'offline_msg': 'आप ऑफ़लाइन हैं - कुछ सुविधाएँ सीमित हो सकती हैं',
        'install_msg': 'ऑफ़लाइन एक्सेस और तेज़ प्रदर्शन के लिए SAFE वेबसाइट इंस्टॉल करें',
        'install_btn': 'इंस्टॉल करें',
        'iot_enabled': 'IoT सक्षम',
        'realtime_tracking': 'रियल-टाइम ट्रैकिंग',
        'multilang': 'बहु-भाषा',
        'hot_meals_ready': 'गर्म भोजन तैयार',
        'people_helped': 'लोगों की मदद की',
        'live_ops': 'लाइव ऑपरेशन',
        'active_centers_lbl': 'सक्रिय केंद्र',
        'relief_status_lbl': 'राहत स्थिति',
        'sync_active': 'रियल-टाइम डेटा सिंक सक्रिय',
        'problems_today': 'आज की समस्याएं',
        'problems_desc': 'अकुशल निगरानी, उच्च खाद्य खराब होना, विलंबित प्रतिक्रिया। खराब भंडारण और रसद के कारण आपदा राहत भोजन की एक महत्वपूर्ण मात्रा खो जाती है।',
        'safe_solution': 'SAFE समाधान',
        'solution_desc': 'अनुकूलित मार्गों, वास्तविक समय जोखिम का पता लगाने, स्वचालित IoT खाद्य सुरक्षा निगरानी और तेजी से, सुरक्षित और विश्वसनीय राहत के लिए ट्रक वितरण ट्रैकिंग के साथ स्मार्ट रसद।',
        'focus_india': 'भारत के लिए, फोकस: मणिपुर',
        'focus_desc': 'पूरे भारत में आपदा राहत के लिए बनाया गया, वर्तमान में चल रहे सांप्रदायिक संकट को दूर करने के लिए मणिपुर में तैनात है। अंग्रेजी, हिंदी, मणिपुरी (मेतेई मयेक) और उड़िया का समर्थन करना।',
        'everything_needed': 'संकट खाद्य प्रबंधन के लिए आपको जो कुछ भी चाहिए',
        'get_assistance': '4 सरल चरणों में खाद्य सहायता प्राप्त करें',
        'get_in_touch': 'संपर्क करें',
        'contact_sub': 'कोई सवाल? मदद चाहिए? हम संकट की स्थितियों के दौरान 24/7 यहां हैं।',
        'emergency_hotline': 'आपातकालीन हॉटलाइन',
        'email_support': 'ईमेल समर्थन',
        'headquarters': 'मुख्यालय',
        'send_message': 'संदेश भेजें',
        'your_name': 'आपका नाम',
        'your_email': 'आपका ईमेल',
        'your_message': 'आपका संदेश',
        'send_btn': 'संदेश भेजें',
        'footer_desc': 'भारत में आपदा राहत के लिए वेब और IoT प्लेटफॉर्म। वर्तमान में मणिपुर में सक्रिय है।',
        'platform': 'प्लेटफ़ॉर्म',
        'support': 'समर्थन',
        'legal': 'कानूनी',
        'privacy': 'गोपनीयता नीति',
        'terms': 'सेवा की शर्तें',
        'cookie': 'कुकी नीति',
        'rights': '© 2024 SAFE - खाद्य आपात स्थिति के लिए स्मार्ट सहायता। सर्वाधिकार सुरक्षित।',
        'available_in': 'उपलब्ध: EN | HI | MNI | OR',
        'items_available': 'उपलब्ध वस्तुएं',
        'hot_meals_ready_small': 'गर्म भोजन तैयार',
        'locations': 'स्थान',
        'active': 'सक्रिय',
        'about_us': 'हमारे बारे में',
        'process': 'प्रक्रिया',
        'faq': 'अक्सर पूछे जाने वाले प्रश्न',
        'help_center': 'सहायता केंद्र'
      }, true, true);

      // Manipuri (Meitei Mayek)
      i18n.addResourceBundle('mni', 'translation', {
        'active_india': '🇮🇳 ꯏꯟꯗꯤꯌꯥꯗ ꯑꯦꯛꯇꯤꯕ ꯑꯣꯏ • ꯃꯅꯤꯄꯨꯔꯒꯤ ꯈꯨꯗꯣꯡꯊꯤꯕ',
        'smart_aid': 'ꯁ꯭ꯃꯥꯔꯠ ꯑꯦꯏꯗ',
        'food_emergency': 'ꯆꯥꯛ-ꯊꯨꯝꯒꯤ ꯈꯨꯗꯣꯡꯊꯤꯕ',
        'hero_desc': 'ꯈꯨꯗꯣꯡꯊꯤꯕ ꯃꯇꯝꯗ ꯑꯅꯥ-ꯑꯌꯦꯛ ꯌꯥꯎꯗꯕ ꯆꯥꯛ-ꯊꯨꯝ ꯐꯪꯐꯝ ꯃꯐꯝꯁꯤꯡ ꯃꯦꯞ ꯇꯧꯕ ꯑꯃꯁꯨꯡ ꯃꯥꯡꯍꯟꯗꯅꯕ ꯁꯦꯝꯕ ꯋꯦꯕ ꯑꯃꯁꯨꯡ IoT ꯄ꯭ꯂꯦꯠꯐꯣꯔꯝ ꯑꯃꯅꯤ꯫',
        'get_started': 'ꯍꯧꯗꯣꯛꯄ',
        'signin': 'ꯆꯪꯕ',
        'live_map': 'ꯂꯥꯏꯕ ꯐꯨꯗ ꯁꯦꯟꯇꯔ ꯃꯦꯞ',
        'map_desc': 'ꯍꯧꯖꯤꯛ ꯃꯅꯤꯄꯨꯔꯗ ꯈꯨꯗꯣꯡꯊꯤꯕ ꯊꯦꯡꯅꯅꯕ ꯔꯤꯂꯤꯐ ꯁꯦꯟꯇꯔ ꯸ ꯂꯩꯔꯤ',
        'about_title': 'SAFE ꯒꯤ ꯃꯔꯝꯗ',
        'about_desc': 'Smart Aid for Food Emergency - ꯆꯥꯛ-ꯊꯨꯝ ꯊꯨꯡꯍꯟꯕꯗ ꯊꯦꯡꯊꯕ ꯑꯃꯁꯨꯡ ꯈꯨꯗꯣꯡꯊꯤꯕ ꯂꯝꯪꯅ ꯔꯤꯂꯤꯐꯀꯤ ꯊꯕꯛꯁꯤꯡꯗ ꯑꯀꯥꯏꯕ ꯄꯤꯔꯛꯄ ꯃꯇꯝꯗ, SAFE ꯅ Web ꯑꯃꯁꯨꯡ IoT ꯇꯦꯛꯅꯣꯂꯣꯖꯤꯒ ꯂꯣꯏꯅꯅ ꯁ꯭ꯃꯥꯔꯠ ꯑꯣꯏꯕ ꯄꯥꯝꯕꯩ ꯄꯤꯔꯤ꯫',
        'features_title': 'ꯃꯄꯥꯡꯒꯜ ꯀꯟꯕ ꯃꯁꯛꯁꯤꯡ',
        'how_it_works_title': 'ꯃꯁꯤꯅ ꯀꯔꯝꯅ ꯊꯕꯛ ꯇꯧꯕꯒꯦ',
        'stats': { 'food_centers': 'ꯆꯥꯛ-ꯊꯨꯝ ꯁꯦꯟꯇꯔ', 'meals_distributed': 'ꯌꯦꯟꯊꯣꯛꯈ꯭ꯔꯕ ꯆꯥꯛꯂꯦꯟ', 'active_suppliers': 'ꯁꯄ꯭ꯂꯥꯏꯌꯔꯁꯤꯡ', 'communities_served': 'ꯀꯝꯝꯌꯨꯅꯤꯇꯤꯁꯤꯡ' },
        'features': {
            'logistics': 'ꯁ꯭ꯃꯥꯔꯠ ꯂꯣꯖꯤꯁꯇꯤꯛꯁ', 'logistics_desc': 'ꯈ꯭ꯋꯥꯏꯗꯒꯤ ꯅꯛꯄ ꯔꯤꯂꯤꯐ ꯁꯦꯟꯇꯔꯁꯤꯡ ꯊꯨꯅ ꯈꯪꯗꯣꯛꯏ',
            'risk': 'ꯈꯨꯗꯣꯡꯊꯤꯕ ꯈꯪꯗꯣꯛꯄ', 'risk_desc': 'ꯈꯨꯗꯣꯡꯊꯤꯕ ꯌꯥꯕ ꯃꯐꯝꯁꯤꯡ ꯃꯇꯝ ꯆꯥꯅ ꯈꯪꯗꯣꯛꯄ',
            'safety': 'ꯆꯥꯛ-ꯊꯨꯝ ꯉꯥꯛ-ꯁꯦꯟꯕ', 'safety_desc': 'IoT ꯁꯦꯟꯁꯔꯅ ꯑꯁꯥ-ꯑꯪꯒ ꯌꯦꯡꯁꯤꯟꯏ',
            'relief': 'ꯊꯨꯅ ꯃꯇꯦꯡ ꯄꯪꯕ', 'relief_desc': 'ꯌꯥꯡꯅ ꯑꯃꯁꯨꯡ ꯆꯨꯝꯅ ꯃꯇꯦꯡ ꯄꯥꯡꯕ',
            'language': 'ꯂꯣꯟ ꯀꯌꯥꯒꯤ ꯈꯨꯗꯣꯡꯆꯥꯕ', 'language_desc': 'ꯏꯪꯂꯤꯁ, ꯍꯤꯟꯗꯤ, ꯃꯅꯤꯄꯨꯔꯤ ꯑꯃꯁꯨꯡ ꯑꯣꯗꯤꯌꯥꯗ ꯐꯪꯒꯅꯤ',
            'pwa': 'PWA - ꯑꯣꯐꯂꯥꯏꯟ', 'pwa_desc': 'ꯏꯟꯇꯔꯅꯦꯠ ꯐꯠꯇꯕ ꯃꯐꯝꯁꯤꯡꯒꯤꯗꯃꯛ ꯌꯥꯝꯅ ꯐꯩ'
        },
        'steps': {
            'register': 'ꯔꯦꯖꯤꯁꯇꯔ ꯇꯧꯕ', 'register_desc': 'ꯁꯥꯏꯟ ꯑꯞ ꯇꯧꯕ',
            'request': 'ꯆꯥꯛ-ꯊꯨꯝ ꯅꯤꯕ', 'request_desc': 'ꯁꯦꯟꯇꯔꯁꯤꯡ ꯌꯦꯡꯕ',
            'track': 'ꯗꯦꯂꯤꯕꯔꯤ ꯇ꯭ꯔꯦꯛ', 'track_desc': 'ꯃꯦꯞꯇ ꯔꯤꯌꯦꯜ-ꯇꯥꯏꯝ ꯇ꯭ꯔꯦꯀꯤꯡ',
            'help': 'ꯃꯇꯦꯡ ꯐꯪꯕ', 'help_desc': 'ꯅꯍꯥꯛꯀꯤ ꯃꯐꯝꯗ ꯆꯥꯛ-ꯊꯨꯝ ꯐꯪꯍꯟꯕ'
        },
        'nav': { 'about': 'ꯃꯔꯝꯗ', 'features': 'ꯃꯁꯛꯁꯤꯡ', 'how_it_works': 'ꯃꯇꯧ ꯀꯔꯝꯅ', 'contact': 'ꯄꯥꯎ ꯐꯥꯎꯅꯕ' },
        'contact': 'ꯄꯥꯎ ꯐꯥꯎꯅꯕꯤꯌꯨ',
        'send_message': 'ꯏꯁꯨꯡ ꯑꯣꯀꯄ',
        'your_name': 'ꯗꯤꯅ ꯃꯤꯠꯥ',
        'your_email': 'ꯗꯤꯅ ꯏꯃꯦꯌꯂ',
        'your_message': 'ꯗꯤꯅ ꯏꯁꯨꯡ',
        'send_btn': 'ꯏꯁꯨꯡ ꯑꯣꯀꯄ',
        'about_us': 'ꯗꯥꯎꯗꯨꯅꯁꯤ ꯍꯥꯟꯅꯕ',
        'process': 'ꯐꯤꯔꯦꯝ',
        'faq': 'ꯑꯌꯥꯕ ꯋꯥꯔꯒꯠꯄꯗ ꯄꯔꯀꯠꯄａ',
        'help_center': 'ꯃꯇꯧ ꯂꯣꯏꯁꯛ',
      }, true, true);

      // Odia
      i18n.addResourceBundle('or', 'translation', {
        'active_india': '🇮🇳 ଭାରତରେ ସକ୍ରିୟ • ଫୋକସ୍: ମଣିପୁର ସଙ୍କଟ',
        'smart_aid': 'ସ୍ମାର୍ଟ ସହାୟତା',
        'food_emergency': 'ଖାଦ୍ୟ ଜରୁରୀକାଳୀନ ପରିସ୍ଥିତି',
        'hero_desc': 'ବିପର୍ଯ୍ୟୟ ସମୟରେ ନିରାପଦ ଖାଦ୍ୟ ସ୍ଥାନ ଚିହ୍ନଟ କରିବା ଏବଂ ନଷ୍ଟ ହେବା ରୋକିବା ପାଇଁ ଏକ ୱେବ୍ ଏବଂ IoT ପ୍ଲାଟଫର୍ମ।',
        'get_started': 'ମାଗଣାରେ ଆରମ୍ଭ କରନ୍ତୁ',
        'signin': 'ସାଇନ୍ ଇନ୍',
        'live_map': 'ଲାଇଭ୍ ଖାଦ୍ୟ କେନ୍ଦ୍ର ମାନଚିତ୍ର',
        'map_desc': 'ବର୍ତ୍ତମାନ ମଣିପୁରରେ ୮ଟି ରିଲିଫ୍ କେନ୍ଦ୍ର ସହିତ ସକ୍ରିୟ',
        'about_title': 'SAFE ବିଷୟରେ',
        'about_desc': 'ଖାଦ୍ୟ ଜରୁରୀକାଳୀନ ପରିସ୍ଥିତି ପାଇଁ ସ୍ମାର୍ଟ ସହାୟତା - ଯେତେବେଳେ ବିଳମ୍ବିତ ଲଜିଷ୍ଟିକ୍ସ ଏବଂ ଅସୁରକ୍ଷିତ ରାସ୍ତା ରିଲିଫ୍ କାର୍ଯ୍ୟକୁ ବିପଦରେ ପକାଏ, SAFE ସ୍ମାର୍ଟ ସମାଧାନ ପ୍ରଦାନ କରେ।',
        'features_title': 'ଶକ୍ତିଶାଳୀ ବୈଶିଷ୍ଟ୍ୟଗୁଡିକ',
        'how_it_works_title': 'ଏହା କିପରି କାମ କରେ',
        'stats': {
            'food_centers': 'ଖାଦ୍ୟ କେନ୍ଦ୍ର',
            'meals_distributed': 'ଖାଦ୍ୟ ବଣ୍ଟନ',
            'active_suppliers': 'ସକ୍ରିୟ ଯୋଗାଣକାରୀ',
            'communities_served': 'ସମ୍ପ୍ରଦାୟ ସେବା'
        },
        'features': {
            'logistics': 'ସ୍ମାର୍ଟ ଲଜିଷ୍ଟିକ୍ସ',
            'logistics_desc': 'ନିକଟତମ ରିଲିଫ୍ କେନ୍ଦ୍ରଗୁଡିକୁ ତୁରନ୍ତ ଖୋଜେ',
            'risk': 'ବିପଦ ଚିହ୍ନଟ',
            'risk_desc': 'ବିପଦପୂର୍ଣ୍ଣ ଅଞ୍ଚଳ ଚିହ୍ନଟ କରନ୍ତୁ',
            'safety': 'ଖାଦ୍ୟ ସୁରକ୍ଷା',
            'safety_desc': 'IoT ସେନ୍ସର ତାପମାତ୍ରା ଉପରେ ନଜର ରଖେ',
            'relief': 'ଦ୍ରୁତ ରିଲିଫ୍',
            'relief_desc': 'ଦ୍ରୁତ ଏବଂ ନିରାପଦ ସହାୟତା',
            'language': 'ବହୁ-ଭାଷା ସମର୍ଥନ',
            'language_desc': 'ଇଂରାଜୀ, ହିନ୍ଦୀ, ମଣିପୁରୀ ଏବଂ ଓଡିଆରେ ଉପଲବ୍ଧ',
            'pwa': 'PWA - ଅଫଲାଇନ୍ କାମ କରେ',
            'pwa_desc': 'କମ୍ ସଂଯୋଗ ଥିବା ଅଞ୍ଚଳ ପାଇଁ ଉପଯୁକ୍ତ'
        },
        'steps': {
            'register': 'ପଞ୍ଜୀକରଣ କରନ୍ତୁ',
            'register_desc': 'ଗ୍ରାହକ କିମ୍ବା ଯୋଗାଣକାରୀ ଭାବରେ ସାଇନ୍ ଅପ୍ କରନ୍ତୁ',
            'request': 'ଖାଦ୍ୟ ଅନୁରୋଧ',
            'request_desc': 'କେନ୍ଦ୍ରଗୁଡିକ ବ୍ରାଉଜ୍ କରନ୍ତୁ',
            'track': 'ଟ୍ରାକ୍ ଡେଲିଭରି',
            'track_desc': 'ମାନଚିତ୍ରରେ ରିଅଲ୍-ଟାଇମ୍ ଟ୍ରାକିଂ',
            'help': 'ସାହାଯ୍ୟ ପାଆନ୍ତୁ',
            'help_desc': 'ଆପଣଙ୍କ ସ୍ଥାନରେ ଖାଦ୍ୟ ପାଆନ୍ତୁ'
        },
        'nav': { 'about': 'ବିଷୟରେ', 'features': 'ବୈଶିଷ୍ଟ୍ୟ', 'how_it_works': 'କିପରି କାମ କରେ', 'contact': 'ଯୋଗାଯୋଗ' },
        'contact': 'ଯୋଗାଯୋଗ କରନ୍ତୁ',
        'about_us': 'ଆମ ବିଷୟରେ',
        'process': 'ପ୍ରକ୍ରିୟା',
        'faq': 'ବାରମ୍ବାର ପଚାଯାଉଥିବା ପ୍ରଶ୍ନ',
        'help_center': 'ଖାଦ୍ୟ ସହାୟତା କେନ୍ଦ୍ର',
      }, true, true);
    }
  }, [i18n]);

  const toggleLanguage = () => {
    const langs = ['en', 'hi', 'mni', 'or'];
    const current = langs.indexOf(i18n.language) > -1 ? langs.indexOf(i18n.language) : 0;
    const next = (current + 1) % langs.length;
    i18n.changeLanguage(langs[next]);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const stats = [
    { label: t('stats.food_centers', 'Food Centers'), value: '8+', icon: MapPinned },
    { label: t('stats.meals_distributed', 'Meals Distributed'), value: '50K+', icon: Utensils },
    { label: t('stats.active_suppliers', 'Active Suppliers'), value: '120+', icon: Package },
    { label: t('stats.communities_served', 'Communities Served'), value: '15+', icon: Users }
  ];

  const features = [
    { 
      icon: MapPin, 
      title: t('features.logistics', 'Smart Logistics & Navigation'), 
      desc: t('features.logistics_desc', 'Locates nearest relief centers instantly with optimized safe routes'),
      color: 'emerald'
    },
    { 
      icon: Truck, 
      title: t('features.relief', 'Rapid, Safe & Reliable Relief'), 
      desc: t('features.relief_desc', 'Combines location intelligence and quality monitoring for faster, safer aid delivery'),
      color: 'purple'
    },
    { 
      icon: Shield, 
      title: t('features.risk', 'Real-Time Risk Detection'), 
      desc: t('features.risk_desc', 'Identify danger zones early to prevent accidents during food transport'),
      color: 'red'
    },
    { 
      icon: Thermometer, 
      title: t('features.safety', 'Automated Food Safety'), 
      desc: t('features.safety_desc', 'IoT sensors monitor temperature, humidity, and gases to prevent spoilage'),
      color: 'blue'
    },
    { 
      icon: Globe, 
      title: t('features.language', 'Multi-Language Support'), 
      desc: t('features.language_desc', 'Available in English, Hindi, Manipuri (Meitei Mayek), and Odia for wider accessibility'),
      color: 'indigo'
    },
    { 
      icon: Download, 
      title: t('features.pwa', 'PWA - Works Offline'), 
      desc: t('features.pwa_desc', 'Install as website shortcut, works offline with cached data, perfect for low-connectivity areas'),
      color: 'teal'
    }
  ];

  const howItWorks = [
    { step: '0', title: t('steps.emergency', 'Emergency Access'), desc: t('steps.emergency_desc', 'Immediate SOS & Map access without login'), icon: ShieldAlert },
    { step: '1', title: t('steps.register', 'Register'), desc: t('steps.register_desc', 'Sign up as Consumer or Supplier'), icon: Users },
    { step: '2', title: t('steps.request', 'Request Food'), desc: t('steps.request_desc', 'Browse centers and request items'), icon: Utensils },
    { step: '3', title: t('steps.track', 'Track Delivery'), desc: t('steps.track_desc', 'Real-time route tracking on map'), icon: MapPin },
    { step: '4', title: t('steps.help', 'Receive Help'), desc: t('steps.help_desc', 'Get food delivered to your location'), icon: Heart }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden relative">
      {/* Premium Gradient Background with Mixed Colors & Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100"></div>
        
        {/* Grid Pattern Overlay - Visible in beginning/hero area */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ 
               backgroundImage: 'linear-gradient(#0f172a 1px, transparent 1px), linear-gradient(90deg, #0f172a 1px, transparent 1px)', 
               backgroundSize: '40px 40px',
               maskImage: 'linear-gradient(to bottom, black 0%, transparent 60%)',
               WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 60%)'
             }}>
        </div>

        {/* Premium Mixed Color Blobs */}
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-gradient-to-br from-emerald-400/20 via-teal-300/20 to-transparent rounded-full blur-[100px] animate-blob mix-blend-multiply"></div>
        <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-purple-400/20 via-indigo-300/20 to-transparent rounded-full blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-gradient-to-br from-blue-400/20 via-cyan-300/20 to-transparent rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-multiply"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-orange-300/20 via-pink-300/20 to-transparent rounded-full blur-[100px] animate-blob animation-delay-3000 mix-blend-multiply"></div>
      </div>

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 w-full bg-amber-600/80 backdrop-blur-md text-white py-2 px-4 text-center text-sm font-semibold z-50 flex items-center justify-center gap-2 border-b border-amber-500/50">
          <WifiOff size={16} />
          {t('offline_msg', "You're offline - Some features may be limited")}
        </div>
      )}

      {/* PWA Install Banner */}
      {deferredPrompt && (
        <div className="fixed top-0 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 z-50 flex items-center justify-between shadow-2xl shadow-emerald-500/30" style={{top: isOnline ? '0' : '36px'}}>
          <div className="flex items-center gap-3">
            <Download size={20} />
            <span className="text-sm font-semibold">{t('install_msg', 'Install SAFE website for offline access & faster performance')}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleInstallClick} className="px-4 py-1.5 bg-white text-emerald-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition duration-200">
              {t('install_btn', 'Install')}
            </button>
            <button onClick={() => setDeferredPrompt(null)} className="px-3 py-1.5 text-white hover:bg-white/20 rounded-lg transition duration-200">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Premium Header */}
      <header className={`fixed w-full z-40 transition-all duration-500 ${scrolled ? 'bg-white/85 backdrop-blur-2xl border-b border-emerald-100/50 py-3 shadow-2xl shadow-slate-900/5' : 'bg-transparent py-6'}`} style={{top: deferredPrompt ? (isOnline ? '48px' : '84px') : (isOnline ? '0' : '36px')}}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-400/50 transform hover:scale-110 transition-all duration-300 hover:shadow-emerald-400/70 hover:-translate-y-1">
              <Utensils className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">SAFE</h1>
              <p className="text-[10px] text-slate-500 font-semibold">Smart Aid for Food Emergency</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#about" className="hover:text-emerald-600 transition-colors duration-200">{t('nav.about', 'About')}</a>
            <a href="#features" className="hover:text-emerald-600 transition-colors duration-200">{t('nav.features', 'Features')}</a>
            <a href="#how-it-works" className="hover:text-emerald-600 transition-colors duration-200">{t('nav.how_it_works', 'How It Works')}</a>
            <a href="#contact" className="hover:text-emerald-600 transition-colors duration-200">{t('nav.contact', 'Contact')}</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={toggleLanguage} className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200 text-sm font-bold" title={t('switch_lang', 'Switch Language')}>
              <Globe size={16} /> {i18n.language === 'en' ? 'EN' : i18n.language === 'hi' ? 'HI' : i18n.language === 'mni' ? 'MNI' : 'OR'}
            </button>

            <button onClick={() => navigate('/login', { state: { role: 'emergency' } })} className="px-5 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white shadow-lg shadow-red-300/40 transition-all duration-200 transform hover:scale-105 text-sm font-extrabold border border-red-700/30 flex items-center gap-2 justify-center">
              🚨 {t('emergency_access', 'Emergency Access')}
            </button>

            <button onClick={() => navigate('/login')} className="px-6 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-600 hover:bg-slate-50 transition-all duration-200 text-sm font-bold">
              {t('signin', 'Login')}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-900">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 p-6 space-y-4 backdrop-blur-xl shadow-lg">
            <a href="#about" className="block text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors">{t('nav.about', 'About')}</a>
            <a href="#features" className="block text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors">{t('nav.features', 'Features')}</a>
            <a href="#how-it-works" className="block text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors">{t('nav.how_it_works', 'How It Works')}</a>
            <a href="#contact" className="block text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors">{t('nav.contact', 'Contact')}</a>

            <button onClick={() => navigate('/login', { state: { role: 'emergency' } })} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-extrabold text-white rounded-xl bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 transition-colors">🚨 {t('emergency_access', 'Emergency Access')}</button>

            <button onClick={toggleLanguage} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-emerald-50 transition-colors">
              <Globe size={16} /> {t('switch_lang', 'Switch Language')} ({i18n.language?.toUpperCase()})
            </button>
            <button onClick={() => navigate('/login')} className="w-full px-4 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">{t('signin', 'Login')}</button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pb-20 px-6 relative overflow-hidden pt-24 md:pt-32 lg:pt-48 z-10" style={{paddingTop: deferredPrompt ? (isOnline ? '180px' : '216px') : (isOnline ? '160px' : '196px')}}>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up relative">
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-emerald-50/80 via-cyan-50/80 to-emerald-50/80 border border-emerald-300/60 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-8 shadow-lg shadow-emerald-200/30 hover:shadow-emerald-200/50 transition-all duration-300 backdrop-blur-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {t('active_india', '🇮🇳 Active in India • Focus: Manipur Crisis')}
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.1] text-slate-900">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-cyan-500 to-blue-600">SAFE</span><br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-700 font-black">{t('smart_aid', 'Smart Aid for')}</span><br/>
                <span className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 bg-clip-text text-transparent font-black drop-shadow-lg">{t('food_emergency', 'Food Emergency')}</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-6 leading-relaxed max-w-lg font-medium">
                {t('hero_desc', 'Locate nearby relief centers, track food deliveries in real time, and receive safe emergency assistance instantly.')}
              </p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-10 flex items-center gap-2">
                <span className="w-6 h-0.5 bg-emerald-500 rounded-full"></span>
                {t('hero_sub', 'Built for disaster response and humanitarian logistics across India')}
              </p>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => navigate('/register')} className="group px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-2xl font-bold shadow-2xl shadow-emerald-400/50 hover:shadow-2xl hover:shadow-emerald-500/60 transition-all duration-300 flex items-center gap-2 hover:scale-105 transform border border-emerald-400/20">
                  {t('get_started', 'Get Started Free')}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              {/* Trust Badges */}
              <div className="mt-12 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 group hover:scale-110 transition-transform duration-300">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-200 transition-colors"><CheckCircle size={16} /></div>
                  <span className="text-sm font-bold text-slate-700">{t('iot_enabled', 'IoT Enabled')}</span>
                </div>
                <div className="flex items-center gap-2 group hover:scale-110 transition-transform duration-300">
                  <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 group-hover:bg-cyan-200 transition-colors"><CheckCircle size={16} /></div>
                  <span className="text-sm font-bold text-slate-700">{t('realtime_tracking', 'Real-time Tracking')}</span>
                </div>
                <div className="flex items-center gap-2 group hover:scale-110 transition-transform duration-300">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-200 transition-colors"><CheckCircle size={16} /></div>
                  <span className="text-sm font-bold text-slate-700">{t('multilang', 'Multi-language')}</span>
                </div>
              </div>
            </div>
            
            <div className="relative animate-fade-in-right">
              {/* Real Dashboard Preview - Consumer + Supplier Combined */}
              <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-[2.5rem] p-2 shadow-2xl shadow-emerald-500/30 transform hover:scale-[1.02] transition-all duration-500 border border-emerald-400/40">
                <div className="bg-gradient-to-b from-slate-950 to-black rounded-[2rem] overflow-hidden relative aspect-video border border-slate-700/50">
                  {/* Window Header */}
                  <div className="h-10 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/50 flex items-center px-4 gap-2 sticky top-0 z-10">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                    <div className="ml-auto text-xs text-slate-400 font-mono">SAFE Dashboard</div>
                  </div>
                  
                  {/* Dashboard Grid Content */}
                  <div className="flex h-full">
                    {/* LEFT: Consumer View - Map & Centers */}
                    <div className="flex-1 flex flex-col border-r border-slate-700/30 bg-slate-900/50">
                      {/* Tabs */}
                      <div className="flex border-b border-slate-700/30 px-3 bg-slate-900/30">
                        <div className="px-3 py-2 text-xs font-bold text-emerald-400 border-b-2 border-emerald-400">📍 Map</div>
                        <div className="px-3 py-2 text-xs font-bold text-slate-500">🏪 Centers</div>
                      </div>

                      {/* Map Area */}
                      <div className="flex-1 relative bg-slate-900 overflow-hidden">
                        {/* Interactive Leaflet map (react-leaflet) */}
                        <MapContainer center={[24.82, 93.94]} zoom={8} scrollWheelZoom={false} className="absolute inset-0 w-full h-full z-0">
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />

                          {FOOD_CENTERS.map(center => (
                            <CircleMarker
                              key={center.id}
                              center={[center.lat, center.lng]}
                              radius={8}
                              pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.9 }}
                            >
                              <Popup>
                                <div className="text-sm font-bold">{center.name}</div>
                                <div className="text-xs">{center.items} kg available</div>
                              </Popup>
                            </CircleMarker>
                          ))}
                        </MapContainer>

                        {/* Top Status */}
                        <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-2 py-1 rounded text-[10px] text-emerald-300 font-bold z-10">
                          ● LIVE RELIEF NETWORK
                        </div>

                        {/* Stats Overlay */}
                        <div className="absolute bottom-2 left-2 right-2 flex gap-2 text-[10px] z-10">
                          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-2 py-1 rounded text-slate-300">
                            <span className="text-emerald-400 font-bold">8</span> Centers
                          </div>
                          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-2 py-1 rounded text-slate-300">
                            <span className="text-cyan-400 font-bold">12</span> Active
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: Supplier View - Inventory */}
                    <div className="w-48 flex flex-col border-l border-slate-700/30 bg-slate-950/50 overflow-hidden">
                      {/* Right Tabs */}
                      <div className="flex border-b border-slate-700/30 px-2 bg-slate-900/30">
                        <div className="px-2 py-2 text-xs font-bold text-slate-500">📊 Orders</div>
                        <div className="px-2 py-2 text-xs font-bold text-emerald-400 border-b-2 border-emerald-400 ml-auto">📦 Stock</div>
                      </div>

                      {/* Inventory Items */}
                      <div className="flex-1 overflow-y-auto space-y-2 p-2">
                        {/* Inventory Item 1 */}
                        <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-2">
                          <div className="flex items-start justify-between mb-1">
                            <div className="text-[10px] font-bold text-slate-200">Rice</div>
                            <div className="text-[9px] text-emerald-400">45 kg</div>
                          </div>
                          <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-4/5"></div>
                          </div>
                        </div>

                        {/* Inventory Item 2 */}
                        <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-2">
                          <div className="flex items-start justify-between mb-1">
                            <div className="text-[10px] font-bold text-slate-200">Dal</div>
                            <div className="text-[9px] text-amber-400">28 kg</div>
                          </div>
                          <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full w-2/3"></div>
                          </div>
                        </div>

                        {/* Inventory Item 3 */}
                        <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg p-2">
                          <div className="flex items-start justify-between mb-1">
                            <div className="text-[10px] font-bold text-slate-200">Vegetables</div>
                            <div className="text-[9px] text-cyan-400">62 kg</div>
                          </div>
                          <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
                            <div className="bg-cyan-500 h-full w-11/12"></div>
                          </div>
                        </div>

                        {/* Alert Box */}
                        <div className="bg-amber-900/30 border border-amber-700/40 rounded-lg p-2 mt-3">
                          <div className="text-[10px] font-bold text-amber-300">⚠ Alert</div>
                          <div className="text-[9px] text-amber-200 mt-0.5">High temp zone detected</div>
                        </div>
                      </div>

                      {/* Bottom Status */}
                      <div className="border-t border-slate-700/30 px-2 py-2 bg-slate-900/30 text-[9px] text-slate-400">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          All systems operational
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Real Stats Floating Cards */}
              <div className="absolute -bottom-6 -left-6 bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-emerald-200/50 border border-emerald-100 animate-float hover:shadow-2xl hover:shadow-emerald-300/60 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-400/50">
                    <MapPin className="text-white" size={28} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Live Tracking</p>
                    <p className="text-2xl font-black text-emerald-600">8 Centers</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-6 -right-6 bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-cyan-200/50 border border-cyan-100 animate-float animation-delay-2000 hover:shadow-2xl hover:shadow-cyan-300/60 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-400/50">
                    <Package className="text-white" size={28} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Inventory</p>
                    <p className="text-2xl font-black text-cyan-600">156 kg</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fade-in-right {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animate-float { animation: float 3s ease-in-out infinite; }
          .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
          .animate-fade-in-right { animation: fade-in-right 0.8s ease-out; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
        `}</style>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 relative overflow-hidden z-10">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center group cursor-pointer">
                <div className="bg-white rounded-2xl p-8 border border-slate-100 hover:border-emerald-300 shadow-md hover:shadow-2xl hover:shadow-emerald-200/40 transition-all duration-300 transform hover:scale-110 hover:-translate-y-2">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all border border-emerald-100">
                    <stat.icon className="text-emerald-600" size={36} />
                  </div>
                  <h3 className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent mb-2">{stat.value}</h3>
                  <p className="text-slate-600 font-bold text-sm uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-8 font-medium italic">
            * Demo simulation data for prototype
          </p>
        </div>
      </section>

      {/* Geolocation Network Map Section */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">{t('live_map', 'Live Relief Coverage Map')}</h2>
            <p className="text-lg text-slate-600">{t('map_desc', 'Enable geolocation to discover relief centers closest to your location. Real-time network visualization.')}</p>
          </div>
          
          {/* Geolocation Network Map */}
          <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-emerald-200/40 border border-emerald-100 group">
            <div className="relative w-full h-[700px] bg-slate-900 overflow-hidden">
              {/* Interactive Leaflet coverage map */}
              <LeafletCoverageMap />

              {/* Top Status Bar */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-white/95 via-white/80 to-transparent backdrop-blur-sm p-6 border-b border-emerald-100">
                <div className="max-w-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"></div>
                    <span className="font-bold text-slate-900 text-sm">Live Relief Coverage</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-300">{FOOD_CENTERS.length} Centers</span>
                  </div>
                </div>
              </div>

              {/* Info Card - Bottom Left */}
              <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-xl border border-emerald-200 p-5 rounded-2xl shadow-lg max-w-xs">
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  How It Works
                </h4>
                <div className="space-y-2">
                  <p className="text-xs text-slate-600">🎯 <strong>Your Location:</strong> Enabled by your browser</p>
                  <p className="text-xs text-slate-600">📍 <strong>Relief Centers:</strong> Shows all active centers</p>
                  <p className="text-xs text-slate-600">📏 <strong>Distance:</strong> Real distance in kilometers</p>
                  <p className="text-xs text-slate-600">⚡ <strong>Network:</strong> Connected supply routes</p>
                </div>
              </div>

              {/* Network Legend - Bottom Right */}
              <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-xl border border-emerald-200 p-5 rounded-2xl shadow-lg">
                <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-widest">Legend</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/60"></div>
                    <span className="text-xs text-slate-600 font-medium">Your Location</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/60"></div>
                    <span className="text-xs text-slate-600 font-medium">Relief Center</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                    <span className="text-xs text-slate-600 font-medium">Supply Route</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-0.5 border-2 border-dashed border-emerald-400"></div>
                    <span className="text-xs text-slate-600 font-medium">Coverage Zone</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nearest Centers Info */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-200 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Your Location</p>
                  <h3 className="text-lg font-black text-slate-900">Geolocation Enabled</h3>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="text-blue-600" size={24} />
                </div>
              </div>
              <p className="text-sm text-slate-600">Allow location access in your browser to see relief centers closest to you</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border border-emerald-200 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Relief Network</p>
                  <h3 className="text-lg font-black text-slate-900">{FOOD_CENTERS.length} Active Centers</h3>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Utensils className="text-emerald-600" size={24} />
                </div>
              </div>
              <p className="text-sm text-slate-600">Distributed across Manipur to ensure quick access to food aid</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-white rounded-2xl p-6 border border-cyan-200 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-1">Supply Routes</p>
                  <h3 className="text-lg font-black text-slate-900">Real-Time Tracking</h3>
                </div>
                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-cyan-600" size={24} />
                </div>
              </div>
              <p className="text-sm text-slate-600">Connected network for efficient supply chain management</p>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes pulse-ring {
            0% {
              r: 0;
              opacity: 0.8;
            }
            100% {
              r: 40px;
              opacity: 0;
            }
          }
        `}</style>
      </section>

      {/* Who Uses SAFE Section */}
      <section className="py-24 px-6 relative z-10 bg-gradient-to-b from-transparent via-cyan-50/30 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6">
              Who Uses <span className="bg-gradient-to-r from-emerald-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">SAFE</span>
            </h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
              Designed for real disaster response coordination.
            </p>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              A focused ecosystem connecting consumers and suppliers in emergency food relief.
            </p>
          </div>

          {/* User Personas Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
            {/* Consumers */}
            <div className="group bg-gradient-to-br from-blue-50 via-white to-blue-50/50 rounded-3xl p-8 border border-blue-200/60 hover:border-blue-400 shadow-lg hover:shadow-2xl hover:shadow-blue-300/40 transition-all duration-300 transform hover:-translate-y-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-300/60 shadow-md shadow-blue-200/40">
                  <Users className="text-blue-600" size={32} />
                </div>
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 font-bold text-sm">👤</div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Consumers</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                People in crisis areas requesting food assistance through the platform
              </p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">Find nearby centers</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">Request & track delivery</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">Multi-language support</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">Emergency SOS alerts</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-blue-200/50">
                <div className="inline-flex px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">Consumer Portal</div>
              </div>
            </div>

            {/* Suppliers */}
            <div className="group bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 rounded-3xl p-8 border border-emerald-200/60 hover:border-emerald-400 shadow-lg hover:shadow-2xl hover:shadow-emerald-300/40 transition-all duration-300 transform hover:-translate-y-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-300/60 shadow-md shadow-emerald-200/40">
                  <Package className="text-emerald-600" size={32} />
                </div>
                <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full text-emerald-600 font-bold text-sm">🏪</div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">Suppliers</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Food storage facilities and suppliers managing inventory and distribution
              </p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">Inventory management</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">IoT spoilage monitoring</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">Demand forecasting</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700 font-medium">Real-time analytics</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-emerald-200/50">
                <div className="inline-flex px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">Supplier Portal</div>
              </div>
            </div>
          </div>

          {/* Ecosystem Overview */}
          <div className="mt-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-12 border border-slate-700/50 overflow-hidden relative">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="grid md:grid-cols-4 gap-8 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">1,200+</h4>
                    <p className="text-sm text-slate-400">Active Citizens</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Package className="text-emerald-400" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">8</h4>
                    <p className="text-sm text-slate-400">Operating Centers</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Truck className="text-amber-400" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">24</h4>
                    <p className="text-sm text-slate-400">Relief Vehicles</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="text-purple-400" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">5</h4>
                    <p className="text-sm text-slate-400">Partner Agencies</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-700/50 pt-8">
                <h3 className="text-2xl font-black text-white mb-4">Complete Ecosystem</h3>
                <p className="text-slate-300 max-w-2xl">
                  SAFE connects all stakeholders in the relief supply chain - from citizens in crisis areas to the authorities coordinating response. Every user role has specific tools designed for their needs, creating an integrated, transparent, and efficient disaster relief network.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-300/50 text-emerald-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-emerald-200/30 backdrop-blur-sm">{t('about_us', 'About Us')}</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6">
              About <span className="bg-gradient-to-r from-emerald-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">SAFE</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              <span className="font-bold bg-gradient-to-r from-emerald-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">Smart Aid for Food Emergency</span> - When delayed logistics, unsafe routes, and spoiled food supplies turn relief efforts into life-threatening risks, SAFE provides the smart solution with <span className="font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">cutting-edge Web & IoT technology</span>.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-gradient-to-br from-white to-emerald-50/30 rounded-3xl p-8 border border-emerald-100/60 hover:border-emerald-300 shadow-lg hover:shadow-2xl hover:shadow-emerald-300/50 transition-all duration-300 transform hover:-translate-y-3 backdrop-blur-sm">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-emerald-100">
                <Heart className="text-emerald-600" size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">{t('problems_today', 'Problems Today')}</h3>
              <p className="text-slate-600 leading-relaxed">{t('problems_desc', 'Inefficient monitoring, high food spoilage, delayed response. A significant amount of disaster relief food is lost due to poor storage and logistics.')}</p>
            </div>
            <div className="group bg-gradient-to-br from-white to-cyan-50/30 rounded-3xl p-8 border border-cyan-100/60 hover:border-cyan-300 shadow-lg hover:shadow-2xl hover:shadow-cyan-300/50 transition-all duration-300 transform hover:-translate-y-3 backdrop-blur-sm">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-cyan-200/60 shadow-lg shadow-cyan-200/30">
                <Shield className="text-cyan-600" size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">{t('safe_solution', 'SAFE Solution')}</h3>
              <p className="text-slate-600 leading-relaxed">{t('solution_desc', 'Smart logistics with optimized routes, real-time risk detection, automated IoT food safety monitoring, and truck delivery tracking for rapid, safe, and reliable relief.')}</p>
            </div>
            <div className="group bg-gradient-to-br from-white to-purple-50/30 rounded-3xl p-8 border border-purple-100/60 hover:border-purple-300 shadow-lg hover:shadow-2xl hover:shadow-purple-300/50 transition-all duration-300 transform hover:-translate-y-3 backdrop-blur-sm">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-purple-200/60 shadow-lg shadow-purple-200/30">
                <Users className="text-purple-600" size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">{t('focus_india', 'For India, Focus: Manipur')}</h3>
              <p className="text-slate-600 leading-relaxed">{t('focus_desc', 'Built for disaster relief across India, currently deployed in Manipur to address the ongoing communal crisis. Supporting English, Hindi, Manipuri (Meitei Mayek), and Odia.')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* System Flow Section */}
      <section className="py-16 px-6 relative z-10 bg-slate-50/50 border-y border-slate-200/60">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/50 text-blue-700 text-xs font-bold uppercase tracking-widest mb-10 border border-blue-200/50">
            <Zap size={14} className="fill-current" /> Real-Time System Flow
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            {/* Citizen */}
            <div className="flex flex-col items-center gap-4 group">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
                <Users size={32} />
              </div>
              <div className="bg-white px-4 py-1 rounded-full shadow-sm border border-slate-100 text-sm font-bold text-slate-700">Citizen</div>
            </div>

            {/* Arrow */}
            <div className="text-slate-300">
              <ArrowRight size={32} className="rotate-90 md:rotate-0" />
            </div>

            {/* Platform */}
            <div className="flex flex-col items-center gap-4 group">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-2xl shadow-emerald-200 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 border-4 border-white relative z-10">
                <Shield size={40} />
                <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm">AI Core</div>
              </div>
              <div className="bg-emerald-100 px-4 py-1 rounded-full shadow-sm border border-emerald-200 text-sm font-bold text-emerald-800">SAFE Platform</div>
            </div>

            {/* Arrow */}
            <div className="text-slate-300">
              <ArrowRight size={32} className="rotate-90 md:rotate-0" />
            </div>

            {/* Supplier */}
            <div className="flex flex-col items-center gap-4 group">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform duration-300">
                <Truck size={32} />
              </div>
              <div className="bg-white px-4 py-1 rounded-full shadow-sm border border-slate-100 text-sm font-bold text-slate-700">Supplier</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">{t('features_title', 'Powerful Features')}</h2>
            <p className="text-lg text-slate-600">{t('everything_needed', 'Everything you need for crisis food management')}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const colorClasses = {
                emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:border-emerald-200',
                red: 'text-red-600 bg-red-50 border-red-100 hover:border-red-200',
                blue: 'text-blue-600 bg-blue-50 border-blue-100 hover:border-blue-200',
                purple: 'text-purple-600 bg-purple-50 border-purple-100 hover:border-purple-200',
                indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:border-indigo-200',
                teal: 'text-teal-600 bg-teal-50 border-teal-100 hover:border-teal-200'
              };
              
              return (
                <div key={i} className={`bg-gradient-to-br from-white to-opacity-30 rounded-2xl p-8 shadow-md hover:shadow-2xl transition-all border ${colorClasses[feature.color]} duration-300 group hover:-translate-y-2 cursor-pointer backdrop-blur-sm hover:scale-105`}>
                  <div className={`w-14 h-14 ${colorClasses[feature.color].split(' ')[1]} rounded-xl flex items-center justify-center mb-4 group-hover:scale-125 transition-all duration-300 border ${colorClasses[feature.color].split(' ')[2]} shadow-lg`}>
                    <feature.icon size={28} className={colorClasses[feature.color].split(' ')[0]} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-300/50 text-purple-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-purple-200/30 backdrop-blur-sm">{t('process', 'Process')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">{t('how_it_works_title', 'How It Works')}</h2>
            <p className="text-lg text-slate-600">{t('get_assistance', 'Get food assistance in 4 simple steps')}</p>
          </div>

          {/* Horizontal Layout - Premium Design */}
          <div className="grid md:grid-cols-5 gap-4 relative">
            {/* Connecting Line */}
            <div className="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 hidden md:block" style={{display: 'none'}}></div>
            
            {howItWorks.map((item, i) => (
              <div key={i} className="group relative">
                <div className="bg-gradient-to-br from-white to-emerald-50/20 rounded-2xl p-6 border border-emerald-100/60 shadow-lg hover:shadow-2xl hover:shadow-emerald-300/40 transition-all duration-300 transform hover:-translate-y-3 group-hover:border-emerald-300 backdrop-blur-sm h-full">
                  {/* Step Circle */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-400/60 border border-emerald-400/30 group-hover:shadow-emerald-500/80 transition-all transform group-hover:scale-110">
                        {item.step}
                      </div>
                      {/* Connector dot to next */}
                      {i !== howItWorks.length - 1 && (
                        <div className="absolute -right-8 top-1/2 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-md hidden md:block transform -translate-y-1/2"></div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-cyan-100 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="text-emerald-600" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">{item.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="inline-block mb-4">
                <span className="bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-300/50 text-pink-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-pink-200/30 backdrop-blur-sm">Contact</span>
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-6">{t('get_in_touch', 'Get In Touch')}</h2>
              <p className="text-slate-600 mb-8 text-lg">{t('contact_sub', "Have questions? Need help? We're here 24/7 during crisis situations.")}</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 group cursor-pointer hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-400/60 group-hover:shadow-emerald-500/80 transition-all duration-300 border border-emerald-400/30">
                    <Phone size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t('emergency_hotline', 'Emergency Hotline')}</p>
                    <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">+91-XXXX-XXXXXX</p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-amber-600 font-semibold">Emergency support available 24/7 during disaster situations</p>
                </div>
                <div className="flex items-center gap-4 group cursor-pointer hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-400/60 group-hover:shadow-blue-500/80 transition-all duration-300 border border-blue-400/30">
                    <Mail size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t('email_support', 'Email Support')}</p>
                    <p className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">support@foodtechnexus.org</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group cursor-pointer hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-400 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-400/60 group-hover:shadow-purple-500/80 transition-all duration-300 border border-purple-400/30">
                    <MapPinned size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t('headquarters', 'Headquarters')}</p>
                    <p className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Imphal, Manipur, India</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-emerald-50/20 rounded-3xl p-8 border border-emerald-100/60 shadow-lg hover:shadow-2xl hover:shadow-emerald-300/50 transition-all duration-300 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">{t('send_message', 'Send a Message')}</h3>
              <form className="space-y-4">
                <input type="text" placeholder={t('your_name', 'Your Name')} className="w-full px-4 py-3 bg-white/70 border border-emerald-100 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all focus:shadow-lg focus:shadow-emerald-200/30 backdrop-blur-sm" />
                <input type="email" placeholder={t('your_email', 'Your Email')} className="w-full px-4 py-3 bg-white/70 border border-emerald-100 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all focus:shadow-lg focus:shadow-emerald-200/30 backdrop-blur-sm" />
                <textarea placeholder={t('your_message', 'Your Message')} rows="4" className="w-full px-4 py-3 bg-white/70 border border-emerald-100 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all focus:shadow-lg focus:shadow-emerald-200/30 resize-none backdrop-blur-sm"></textarea>
                <button type="submit" className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-400/60 hover:shadow-xl hover:shadow-emerald-500/80 transition-all duration-300 transform hover:scale-105 border border-emerald-400/30">
                  {t('send_btn', 'Send Message')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-300 py-12 px-6 border-t border-slate-700/50 relative z-10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 via-teal-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-400/60">
                  <Utensils className="text-white" size={16} />
                </div>
                <h3 className="text-white font-bold text-lg">SAFE</h3>
              </div>
              <p className="text-sm text-slate-400">{t('footer_desc', 'Web & IoT platform for disaster relief in India. Currently active in Manipur.')}</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">{t('platform', 'Platform')}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="text-slate-300 hover:text-emerald-400 transition-colors duration-200">{t('about_us', 'About Us')}</a></li>
                <li><a href="#features" className="text-slate-300 hover:text-emerald-400 transition-colors duration-200">{t('nav.features', 'Features')}</a></li>
                <li><a href="#how-it-works" className="text-slate-300 hover:text-emerald-400 transition-colors duration-200">{t('nav.how_it_works', 'How It Works')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">{t('support', 'Support')}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#contact" className="text-slate-300 hover:text-emerald-400 transition-colors duration-200">{t('nav.contact', 'Contact Us')}</a></li>
                <li><a href="#" className="text-slate-300 hover:text-emerald-400 transition-colors duration-200">{t('faq', 'FAQ')}</a></li>
                <li><a href="#" className="text-slate-300 hover:text-emerald-400 transition-colors duration-200">{t('help_center', 'Help Center')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">{t('legal', 'Legal')}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-300 hover:text-emerald-400 transition-colors duration-200">{t('privacy', 'Privacy Policy')}</a></li>
                <li><a href="#" className="text-slate-300 hover:text-emerald-400 transition-colors duration-200">{t('terms', 'Terms of Service')}</a></li>
                <li><a href="#" className="text-slate-300 hover:text-emerald-400 transition-colors duration-200">{t('cookie', 'Cookie Policy')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">{t('rights', '© 2024 SAFE - Smart Aid for Food Emergencies. All rights reserved.')}</p>
            <div className="flex items-center gap-4">
              <Globe size={16} className="text-slate-400" />
              <span className="text-sm text-slate-400">{t('available_in', 'Available in: EN | HI | MNI | OR')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
