import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Lock, Mail, ChevronRight, AlertCircle, User, Phone,
  ShoppingBag, Truck, Siren, Globe, KeyRound, X, Download 
} from 'lucide-react';

// --- 1. FULL ANIMATED CONSUMER BACKGROUND (Organic Flow) ---
const ConsumerBackground = () => (
  <div className="absolute inset-0 bg-green-900 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-900 opacity-90" />
    {/* Floating Orbs */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute bg-white/10 rounded-full blur-3xl"
        initial={{ 
          x: Math.random() * 100 + "%", 
          y: Math.random() * 100 + "%", 
          scale: Math.random() * 0.5 + 0.5 
        }}
        animate={{ 
          x: [null, Math.random() * 100 + "%"], 
          y: [null, Math.random() * 100 + "%"],
          rotate: [0, 180] 
        }}
        transition={{ 
          duration: 15 + Math.random() * 10, 
          repeat: Infinity, 
          repeatType: "reverse",
          ease: "easeInOut" 
        }}
        style={{ width: `${300 + Math.random() * 200}px`, height: `${300 + Math.random() * 200}px` }}
      />
    ))}
    {/* Floating Particles */}
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={`p-${i}`}
        className="absolute bg-green-200 rounded-full opacity-20"
        initial={{ y: "110vh", x: Math.random() * 100 + "vw" }}
        animate={{ y: "-10vh" }}
        transition={{ 
          duration: 10 + Math.random() * 15, 
          repeat: Infinity, 
          delay: Math.random() * 5,
          ease: "linear"
        }}
        style={{ width: Math.random() * 10 + "px", height: Math.random() * 10 + "px" }}
      />
    ))}
  </div>
);

// --- 2. FULL ANIMATED SUPPLIER BACKGROUND (Logistics Grid) ---
const SupplierBackground = () => (
  <div className="absolute inset-0 bg-slate-900 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-900 opacity-90" />
    
    {/* Moving Grid Lines */}
    <div className="absolute inset-0" style={{ perspective: '1000px' }}>
      <motion.div 
        className="absolute inset-0 opacity-20"
        style={{ 
            backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', 
            backgroundSize: '50px 50px',
            transform: 'rotateX(60deg) scale(2)'
        }}
        animate={{ backgroundPositionY: ['0px', '50px'] }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>

    {/* Moving Boxes/Packets */}
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute border border-blue-300/30 bg-blue-500/10 backdrop-blur-sm rounded"
        initial={{ x: "-10%", y: Math.random() * 100 + "%", opacity: 0 }}
        animate={{ x: "110%", opacity: [0, 1, 1, 0] }}
        transition={{ 
          duration: 8 + Math.random() * 5, 
          repeat: Infinity, 
          delay: Math.random() * 5,
          ease: "linear" 
        }}
        style={{ 
          width: `${40 + Math.random() * 40}px`, 
          height: `${40 + Math.random() * 40}px`,
          top: Math.random() * 100 + "%" 
        }}
      />
    ))}
  </div>
);

// --- 3. FULL ANIMATED EMERGENCY BACKGROUND (Radar Pulse) ---
const EmergencyBackground = () => (
  <div className="absolute inset-0 bg-red-950 overflow-hidden flex items-center justify-center">
    <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-rose-900 opacity-80" />
    
    {/* Concentric Radar Rings */}
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute border border-red-400/30 rounded-full"
        initial={{ width: "0vw", height: "0vw", opacity: 1 }}
        animate={{ width: "150vw", height: "150vw", opacity: 0 }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          delay: i * 1.3,
          ease: "linear" 
        }}
      />
    ))}

    {/* Spinning Alert Light Effect */}
    <motion.div 
        className="absolute w-[200vw] h-[200vw] bg-gradient-to-t from-transparent via-red-500/10 to-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    />
  </div>
);

const Login = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState(location.state?.role || 'consumer'); 
  
  // PWA & Online State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Login/Register Form Data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    age: '',
    familyMembers: ''
  });

  // Forgot Password Data
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetData, setResetData] = useState({ email: '', newPassword: '' });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 4-Language Toggle Logic
  const toggleLanguage = () => {
    const langs = ['en', 'hi', 'mni', 'or'];
    const current = langs.indexOf(i18n.language) > -1 ? langs.indexOf(i18n.language) : 0;
    const next = (current + 1) % langs.length;
    i18n.changeLanguage(langs[next]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isRegistering) {
        if (activeTab === 'emergency') {
            setError(t('restricted_reg'));
            setIsLoading(false);
            return;
        }

        await axios.post('http://localhost:8000/register', {
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          phone: formData.phone,
          age: parseInt(formData.age) || 0,
          family_members: parseInt(formData.familyMembers) || 1,
          role: activeTab 
        });
        
        alert("Account created! Please sign in.");
        setIsRegistering(false);
      } else {
        const res = await axios.post('http://localhost:8000/login', {
          email: formData.email,
          password: formData.password
        });

        if (res.data.success) {
          const userRole = res.data.user.role;
          
          if (activeTab !== 'emergency' && userRole !== activeTab && userRole !== 'admin') {
             setError(`Account mismatch: This email is registered as '${userRole}', but you're trying to login as '${activeTab}'. Please select the correct role tab.`);
             setIsLoading(false);
             return;
          }
          if (activeTab === 'emergency' && userRole !== 'emergency' && userRole !== 'admin') {
             setError('Access Denied: This account does not have emergency access permissions. Emergency login is restricted to authorized personnel only.');
             setIsLoading(false);
             return;
          }

          localStorage.setItem('foodtech_user', JSON.stringify(res.data.user));
          if (userRole === 'consumer') navigate('/consumer');
          else if (userRole === 'supplier') navigate('/supplier');
          else if (userRole === 'emergency') navigate('/emergency');
          else if (userRole === 'admin') navigate('/consumer');
        } else {
          setError('Login failed: Invalid email or password. Please check your credentials and try again.');
        }
      }
    } catch (err) {
      // More specific error messages
      if (err.response?.status === 404) {
        setError('Account not found: No account exists with this email address. Please check the email or register a new account.');
      } else if (err.response?.status === 401) {
        if (activeTab === 'emergency') {
          setError('Invalid credentials: The password you entered is incorrect. Please contact your system administrator for emergency access.');
        } else {
          setError('Invalid credentials: The password you entered is incorrect. Please try again or use "Forgot Password".');
        }
      } else if (err.response?.data?.detail) {
        setError(`Error: ${err.response.data.detail}`);
      } else {
        setError('Connection failed: Unable to connect to server. Please check your internet connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Real Password Reset Handler
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if(!resetData.email || !resetData.newPassword) return;
    
    try {
        await axios.put('http://localhost:8000/reset-password', {
            email: resetData.email,
            new_password: resetData.newPassword
        });
        alert(t('pass_updated'));
        setShowForgotModal(false);
        setResetData({ email: '', newPassword: '' });
    } catch (err) {
        alert(t('email_not_found'));
    }
  };

  // Select UI Configuration based on active tab
  const getThemeConfig = () => {
    switch(activeTab) {
        case 'supplier': return {
            icon: Truck, color: 'text-blue-600', 
            shadow: 'shadow-blue-500/30', btn: 'bg-blue-600 hover:bg-blue-700',
            bgComponent: <SupplierBackground />,
            title: t('role_supplier'), subtitle: t('sub_supplier')
        };
        case 'emergency': return {
            icon: Siren, color: 'text-red-600', 
            shadow: 'shadow-red-500/30', btn: 'bg-red-600 hover:bg-red-700',
            bgComponent: <EmergencyBackground />,
            title: t('role_emergency'), subtitle: t('sub_emergency')
        };
        default: return {
            icon: ShoppingBag, color: 'text-green-600', 
            shadow: 'shadow-green-500/30', btn: 'bg-green-600 hover:bg-green-700',
            bgComponent: <ConsumerBackground />,
            title: t('role_consumer'), subtitle: t('sub_consumer')
        };
    }
  };

  const theme = getThemeConfig();

  return (
    <div className="h-screen flex flex-col bg-slate-50 relative overflow-hidden p-4 md:p-0">
      <div className="flex-1 flex flex-col relative overflow-hidden rounded-3xl md:rounded-none shadow-2xl md:shadow-none bg-white w-full h-full border border-slate-200 md:border-none items-center justify-center transition-all duration-700">
      
      {/* Dynamic Animated Background */}
      <AnimatePresence mode='wait'>
        <motion.div 
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-0"
        >
            {theme.bgComponent}
        </motion.div>
      </AnimatePresence>

      {/* Language Switcher (Top Right) */}
      <button 
        onClick={toggleLanguage}
        className="absolute top-6 right-6 z-50 bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white/30 transition shadow-lg font-bold"
      >
        <Globe size={18} />
        {i18n.language === 'en' ? 'English' : 
         i18n.language === 'hi' ? 'हिंदी' : 
         i18n.language === 'mni' ? 'ꯃꯤꯇꯩꯂꯣꯟ' : 'ଓଡ଼ିଆ'}
      </button>

      {/* PWA Install Button (Top Left) */}
      {deferredPrompt && (
        <button 
          onClick={handleInstallClick}
          className="absolute top-6 left-6 z-50 bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white/30 transition shadow-lg font-bold"
        >
          <Download size={18} />
          {t('install', { defaultValue: 'Install' })}
        </button>
      )}

      {/* Main Card */}
      <motion.div 
        layout
        className="w-full max-w-md z-10 p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Role Selector */}
        <div className="flex justify-center gap-2 md:gap-4 mb-6 flex-wrap">
            {['consumer', 'supplier', 'emergency'].map((role) => (
                <button
                    key={role}
                    type="button"
                    onClick={() => { 
                        setActiveTab(role); 
                        setError(''); 
                        if(role === 'emergency') setIsRegistering(false); 
                    }}
                    className={`flex flex-col items-center gap-2 p-2 md:p-3 rounded-xl transition-all duration-300 w-20 md:w-24 border
                        ${activeTab === role 
                            ? 'bg-white/90 backdrop-blur-md shadow-xl scale-110 border-white/50 text-gray-800' 
                            : 'bg-black/20 hover:bg-black/30 text-white/70 border-transparent scale-100'}
                    `}
                >
                    {role === 'consumer' && <ShoppingBag size={20} />}
                    {role === 'supplier' && <Truck size={20} />}
                    {role === 'emergency' && <Siren size={20} />}
                    <span className="text-xs font-bold uppercase tracking-wider">{t(role)}</span>
                </button>
            ))}
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/60">
          
          <div className={`p-8 pb-2 text-center ${theme.color}`}>
            <motion.div 
                key={activeTab + "-icon"}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 shadow-inner"
            >
                <theme.icon size={32} />
            </motion.div>
            <h2 className="text-2xl font-black tracking-tight uppercase">
                {theme.title}
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1">
                {isRegistering ? t('create_account') : theme.subtitle}
            </p>
          </div>

          <div className="p-8 pt-4">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-center gap-2 text-xs font-bold"
              >
                <AlertCircle size={14} /> {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <AnimatePresence>
                {isRegistering && activeTab !== 'emergency' && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                    >
                        <div className="relative group">
                            <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <input 
                                name="fullName"
                                type="text" 
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-opacity-50 transition-all text-sm font-medium focus:bg-white"
                                placeholder={t('full_name')}
                                value={formData.fullName}
                                onChange={handleChange}
                                required={isRegistering}
                            />
                        </div>
                        <div className="relative group">
                            <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <input 
                                name="phone"
                                type="text" 
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-opacity-50 transition-all text-sm font-medium focus:bg-white"
                                placeholder={t('phone')}
                                value={formData.phone}
                                onChange={handleChange}
                                required={isRegistering}
                            />
                        </div>
                        {activeTab === 'consumer' && (
                            <>
                                <div className="relative group">
                                    <input 
                                        name="age"
                                        type="number" 
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-opacity-50 transition-all text-sm font-medium focus:bg-white"
                                        placeholder="Age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        required={isRegistering}
                                        min="1"
                                    />
                                </div>
                                <div className="relative group">
                                    <input 
                                        name="familyMembers"
                                        type="number" 
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-opacity-50 transition-all text-sm font-medium focus:bg-white"
                                        placeholder="Number of Family Members"
                                        value={formData.familyMembers}
                                        onChange={handleChange}
                                        required={isRegistering}
                                        min="1"
                                    />
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
              </AnimatePresence>

              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input 
                  name="email"
                  type="email" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-opacity-50 transition-all text-sm font-medium focus:bg-white"
                  placeholder={t('email')}
                  value={formData.email}
                  onChange={handleChange}
                  required 
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input 
                  name="password"
                  type="password" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-opacity-50 transition-all text-sm font-medium focus:bg-white"
                  placeholder={t('password')}
                  value={formData.password}
                  onChange={handleChange}
                  required 
                />
              </div>

              {/* Forgot Password Link (Hidden during registration and for emergency) */}
              {!isRegistering && activeTab !== 'emergency' && (
                  <div className="flex justify-end">
                    <button 
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      {i18n.language === 'en' ? 'Forgot Password?' : 
                       i18n.language === 'hi' ? 'पासवर्ड भूल गए?' :
                       i18n.language === 'mni' ? 'ꯄꯥꯁꯋꯥꯔꯗ ꯀꯥꯑꯣꯈ꯭ꯔꯕ꯭ꯔꯥ?' : 'ପାସୱାର୍ଡ ଭୁଲିଗଲେ କି?'}
                    </button>
                  </div>
              )}

              <button 
                disabled={isLoading}
                className={`w-full text-white py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-6
                  ${theme.btn} ${theme.shadow}`}
              >
                {isLoading ? t('processing') : (isRegistering ? t('create_account') : t('signin'))}
                {!isLoading && <ChevronRight size={18} />}
              </button>
            </form>

            {activeTab !== 'emergency' ? (
                <div className="mt-6 text-center">
                    <button 
                        onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                        className="text-xs font-bold text-gray-400 hover:text-gray-800 transition-colors uppercase tracking-wide"
                    >
                        {isRegistering ? t('back_login') : t('new_here')}
                    </button>
                </div>
            ) : (
                <div className="mt-6 text-center">
                    <p className="text-[10px] text-red-500 bg-red-50 p-2 rounded border border-red-100 font-medium">
                        {t('official_only')}
                    </p>
                </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* --- FORGOT PASSWORD MODAL (Connected to Backend) --- */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-6 rounded-2xl w-80 shadow-2xl relative"
            >
                <button onClick={() => setShowForgotModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                    <X size={20}/>
                </button>
                
                <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 text-blue-600">
                        <KeyRound size={24}/>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">{t('reset_password')}</h3>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">{t('enter_email')}</label>
                        <input 
                            type="email" 
                            className="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={resetData.email}
                            onChange={e => setResetData({...resetData, email: e.target.value})}
                            required 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500">{t('new_password')}</label>
                        <input 
                            type="password" 
                            className="w-full border p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={resetData.newPassword}
                            onChange={e => setResetData({...resetData, newPassword: e.target.value})}
                            required 
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg">
                        {t('update_pass')}
                    </button>
                </form>
            </motion.div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Login;