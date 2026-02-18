import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  MapPin, Utensils, TrendingUp, Shield, Users, Heart, 
  ArrowRight, Menu, X, Phone, Mail, MapPinned, ChevronDown,
  Package, Zap, Globe, CheckCircle, Thermometer, Truck
} from 'lucide-react';

// Fix Leaflet default icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

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

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const stats = [
    { label: 'Food Centers', value: '8+', icon: MapPinned },
    { label: 'Meals Distributed', value: '50K+', icon: Utensils },
    { label: 'Active Suppliers', value: '120+', icon: Package },
    { label: 'Communities Served', value: '15+', icon: Users }
  ];

  const features = [
    { 
      icon: MapPin, 
      title: 'Smart Logistics & Navigation', 
      desc: 'Locates nearest relief centers instantly with optimized safe routes',
      color: 'emerald'
    },
    { 
      icon: Shield, 
      title: 'Real-Time Risk Detection', 
      desc: 'Identify danger zones early to prevent accidents during food transport',
      color: 'red'
    },
    { 
      icon: Thermometer, 
      title: 'Automated Food Safety', 
      desc: 'IoT sensors monitor temperature, humidity, and gases to prevent spoilage',
      color: 'blue'
    },
    { 
      icon: Truck, 
      title: 'Rapid, Safe & Reliable Relief', 
      desc: 'Combines location intelligence and quality monitoring for faster, safer aid delivery',
      color: 'purple'
    }
  ];

  const howItWorks = [
    { step: '1', title: 'Register', desc: 'Sign up as Consumer or Supplier', icon: Users },
    { step: '2', title: 'Request Food', desc: 'Browse centers and request items', icon: Utensils },
    { step: '3', title: 'Track Delivery', desc: 'Real-time route tracking on map', icon: MapPin },
    { step: '4', title: 'Receive Help', desc: 'Get food delivered to your location', icon: Heart }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Utensils className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">SAFE</h1>
              <p className="text-[10px] text-slate-500 font-semibold">Smart Aid for Food Emergencies</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-sm font-semibold text-slate-700 hover:text-emerald-600 transition">About</a>
            <a href="#features" className="text-sm font-semibold text-slate-700 hover:text-emerald-600 transition">Features</a>
            <a href="#how-it-works" className="text-sm font-semibold text-slate-700 hover:text-emerald-600 transition">How It Works</a>
            <a href="#contact" className="text-sm font-semibold text-slate-700 hover:text-emerald-600 transition">Contact</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-emerald-600 transition">
              Login
            </button>
            <button onClick={() => navigate('/register')} className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200 p-6 space-y-4">
            <a href="#about" className="block text-sm font-semibold text-slate-700">About</a>
            <a href="#features" className="block text-sm font-semibold text-slate-700">Features</a>
            <a href="#how-it-works" className="block text-sm font-semibold text-slate-700">How It Works</a>
            <a href="#contact" className="block text-sm font-semibold text-slate-700">Contact</a>
            <button onClick={() => navigate('/login')} className="w-full px-4 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl">Login</button>
            <button onClick={() => navigate('/register')} className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm">Get Started</button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-xs font-bold mb-6">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Active in India • Focus: Manipur Crisis
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-6">
                <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">SAFE</span><br/>
                Food Relief During Crisis
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                A Web & IoT platform designed to map safe food locations and prevent spoilage during disasters. When delayed logistics, unsafe routes, and spoiled food supplies turn relief efforts into life-threatening risks, SAFE provides the smart solution.
              </p>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => navigate('/register')} className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all flex items-center gap-2">
                  Get Started <ArrowRight size={20} />
                </button>
                <button onClick={() => navigate('/login')} className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold hover:border-emerald-300 transition-all">
                  Sign In
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl p-8 shadow-2xl">
                <img src="https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600" alt="Food Distribution" className="rounded-2xl shadow-lg" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Utensils className="text-white" size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">Hot Meals Ready</p>
                    <p className="text-lg font-black text-slate-900">8 Centers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-emerald-600 to-teal-700">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="mx-auto mb-3 text-white" size={32} />
                <h3 className="text-4xl font-black text-white mb-2">{stat.value}</h3>
                <p className="text-emerald-100 font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Map Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Live Food Centers Map</h2>
            <p className="text-lg text-slate-600">Currently active in Manipur with 8 relief centers responding to the ongoing crisis</p>
          </div>
          <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl p-4 shadow-2xl border border-slate-200">
            <div className="h-[500px] rounded-2xl overflow-hidden">
              <MapContainer center={[24.8170, 93.9368]} zoom={9} style={{ height: "100%", width: "100%" }}>
                <TileLayer 
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                  attribution='&copy; OpenStreetMap'
                />
                {FOOD_CENTERS.map(center => (
                  <Marker 
                    key={center.id} 
                    position={[center.lat, center.lng]}
                    icon={L.divIcon({
                      className: 'custom-marker',
                      html: `<div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 16px;">📍</div></div>`,
                      iconSize: [36, 36],
                      iconAnchor: [18, 36]
                    })}
                  >
                    <Popup>
                      <div style="min-width: 180px;">
                        <h3 style="font-weight: bold; font-size: 13px; margin-bottom: 4px; color: #059669;">{center.name}</h3>
                        <p style="font-size: 11px; font-weight: 600; color: #374151;">📦 {center.items} Items Available</p>
                        <p style="font-size: 10px; color: #6b7280; margin-top: 4px;">🍛 Hot meals ready</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-slate-600 font-semibold">Active Centers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-semibold">Total: {FOOD_CENTERS.length} Locations</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">About SAFE</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              <span className="font-bold text-emerald-600">Smart Aid for Food Emergencies</span> - When delayed logistics, unsafe routes, and spoiled food supplies turn relief efforts into life-threatening risks, SAFE provides the smart solution with Web & IoT technology.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-200">
              <Heart className="text-emerald-600 mb-4" size={40} />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Problems Today</h3>
              <p className="text-slate-600">Inefficient monitoring, high food spoilage, delayed response. A significant amount of disaster relief food is lost due to poor storage and logistics.</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <Shield className="text-blue-600 mb-4" size={40} />
              <h3 className="text-xl font-bold text-slate-900 mb-3">SAFE Solution</h3>
              <p className="text-slate-600">Smart logistics with optimized routes, real-time risk detection, automated IoT food safety monitoring, and truck delivery tracking for rapid, safe, and reliable relief.</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-8 border border-orange-200">
              <Users className="text-orange-600 mb-4" size={40} />
              <h3 className="text-xl font-bold text-slate-900 mb-3">For India, Focus: Manipur</h3>
              <p className="text-slate-600">Built for disaster relief across India, currently deployed in Manipur to address the ongoing communal crisis. Supporting English, Hindi, Manipuri (Meitei Mayek), and Odia.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Powerful Features</h2>
            <p className="text-lg text-slate-600">Everything you need for crisis food management</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-slate-200">
                <div className={`w-14 h-14 bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="text-white" size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">How It Works</h2>
            <p className="text-lg text-slate-600">Get food assistance in 4 simple steps</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((item, i) => (
              <div key={i} className="relative">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <item.icon className="text-white" size={32} />
                  </div>
                  <div className="absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-emerald-200 to-teal-200 -z-10 hidden md:block" style={{display: i === 3 ? 'none' : 'block'}}></div>
                  <div className="bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3 font-black text-sm">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl font-black mb-6">Get In Touch</h2>
              <p className="text-slate-300 mb-8">Have questions? Need help? We're here 24/7 during crisis situations.</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Emergency Hotline</p>
                    <p className="font-bold">+91-XXXX-XXXXXX</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Email Support</p>
                    <p className="font-bold">support@foodtechnexus.org</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                    <MapPinned size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Headquarters</p>
                    <p className="font-bold">Imphal, Manipur, India</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold mb-6">Send a Message</h3>
              <form className="space-y-4">
                <input type="text" placeholder="Your Name" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500" />
                <input type="email" placeholder="Your Email" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500" />
                <textarea placeholder="Your Message" rows="4" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"></textarea>
                <button type="submit" className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Utensils className="text-white" size={16} />
                </div>
                <h3 className="text-white font-bold">SAFE</h3>
              </div>
              <p className="text-sm">Web & IoT platform for disaster relief in India. Currently active in Manipur.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="hover:text-emerald-500 transition">About Us</a></li>
                <li><a href="#features" className="hover:text-emerald-500 transition">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-emerald-500 transition">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#contact" className="hover:text-emerald-500 transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-emerald-500 transition">FAQ</a></li>
                <li><a href="#" className="hover:text-emerald-500 transition">Help Center</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-emerald-500 transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-emerald-500 transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-emerald-500 transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2024 SAFE - Smart Aid for Food Emergencies. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Globe size={16} />
              <span className="text-sm">Available in: EN | HI | MNI | OR</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
