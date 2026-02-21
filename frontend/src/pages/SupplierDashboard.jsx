import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Package,
  LogOut,
  Plus,
  Globe,
  ShieldAlert,
  Map as MapIcon,
  Pencil,
  Trash,
  AlertTriangle,
  CheckCircle2,
  Thermometer,
  Timer,
  PackageCheck,
  Truck,
  MessageSquare,
  Bot,
  Send,
  X,
  BarChart3,
  Settings,
  Bell,
  Users,
  Moon,
  Sun,
  Download,
  Radio,
  FileText,
  Printer,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer, Circle, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API = "http://localhost:8000";

/* -------------------- DIGIT + CURRENCY LOCALIZATION (ALL LANGS) -------------------- */
// en: 0-9, hi: ०-९, or: ୦-୯, mni (Meitei Mayek): ꯰-꯹
const DIGIT_MAP = {
  en: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  hi: ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"],
  or: ["୦", "୧", "୨", "୩", "୪", "୫", "୬", "୭", "୮", "୯"],
  mni: ["꯰", "꯱", "꯲", "꯳", "꯴", "꯵", "꯶", "꯷", "꯸", "꯹"],
};

function localizeDigits(str, lang) {
  const key = (lang || "en").split("-")[0]; // handles en-IN, hi-IN etc.
  const map = DIGIT_MAP[key] || DIGIT_MAP.en;
  return String(str).replace(/\d/g, (d) => map[Number(d)]);
}

function formatNumber(n, lang) {
  const base = new Intl.NumberFormat("en-IN").format(Number(n) || 0);
  return localizeDigits(base, lang);
}

function formatCurrencyINR(amount, lang) {
  const base = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

  return localizeDigits(base, lang);
}

/* --------------------------- Toast (no library) -------------------------- */
function ToastStack({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            "w-[320px] rounded-2xl border shadow-[0_16px_40px_rgba(15,23,42,0.18)]",
            "backdrop-blur bg-white/90 px-4 py-3 flex items-start gap-3",
            t.type === "success"
              ? "border-emerald-200"
              : t.type === "error"
                ? "border-rose-200"
                : "border-slate-200",
          ].join(" ")}
        >
          <div className="mt-0.5">
            {t.type === "success" ? (
              <CheckCircle2 className="text-emerald-600" size={18} />
            ) : t.type === "error" ? (
              <AlertTriangle className="text-rose-600" size={18} />
            ) : (
              <Timer className="text-slate-600" size={18} />
            )}
          </div>

          <div className="flex-1">
            <div className="text-sm font-semibold text-slate-900">{t.title}</div>
            {t.message ? <div className="text-xs text-slate-600 mt-0.5">{t.message}</div> : null}
          </div>

          <button
            onClick={() => remove(t.id)}
            className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 inline-flex items-center justify-center"
            type="button"
          >
            <X size={14} className="text-slate-600" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------- Small UI Helpers --------------------------- */
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

function SoftCard({ title, right, children, className = "" }) {
  return (
    <section
      className={[
        "bg-white rounded-2xl border border-slate-200/70",
        "shadow-[0_8px_24px_rgba(15,23,42,0.06)]",
        className,
      ].join(" ")}
    >
      <div className="px-6 py-4 border-b border-slate-200/60 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        {right}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Pill({ variant = "gray", children }) {
  const map = {
    gray: "bg-slate-100 text-slate-700 border-slate-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${map[variant] || map.gray}`}>
      {children}
    </span>
  );
}

function SmallStat({ label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 border border-white/10">
      <div className="text-[10px] uppercase tracking-wide text-white/70">{label}</div>
      <div className="text-[18px] font-extrabold text-white leading-none">{value}</div>
    </div>
  );
}

function IconBtn({ title, onClick, variant = "slate", children }) {
  const map = {
    slate: "border-slate-200 text-slate-700 hover:bg-slate-50",
    blue: "border-sky-200 text-sky-700 hover:bg-sky-50",
    red: "border-rose-200 text-rose-700 hover:bg-rose-50",
  };
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border transition ${map[variant] || map.slate}`}
    >
      {children}
    </button>
  );
}

/* ------------------------------ Component ------------------------------ */
export default function SupplierDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = (i18n.language || "en").split("-")[0];

  // Data
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [iotData, setIotData] = useState([]);
  const [riskZones, setRiskZones] = useState([]);
  const [messages, setMessages] = useState([]);
  const [lastSync, setLastSync] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRiskMap, setShowRiskMap] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Add item form
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    unit: "packets",
    category: "Cooked Food",
  });

  // Chat
  const [chatMode, setChatMode] = useState("consumer"); // consumer | ai
  const [replyText, setReplyText] = useState("");
  const [aiMessages, setAiMessages] = useState([
    { sender: "AI", content: "Hi Supplier 👋 I'm your AI assistant. Ask me about inventory, orders, or anything else!", type: "received" },
  ]);
   const [isTyping, setIsTyping] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosReason, setSOSReason] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'warning', title: 'Low Stock Alert', message: 'Tomatoes below 30 units', time: '2 min ago', read: false },
    { id: 2, type: 'success', title: 'Order Fulfilled', message: 'Order #123 delivered successfully', time: '5 min ago', read: false },
    { id: 3, type: 'error', title: 'Spoilage Risk', message: 'Milk temperature rising', time: '10 min ago', read: true },
  ]);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const chatEndRef = useRef(null);

  // Crisis Alerts State - Show only recent/active alerts
  const [crisisAlerts] = useState([
    { id: 1, source: 'News API', location: 'Ukhrul', type: 'Communal Crisis', severity: 'critical', time: '18 min ago', affected: 3200 },
  ]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    toast('success', newMode ? 'Dark Mode Enabled' : 'Light Mode Enabled', '🌙 Theme updated');
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast('success', 'Notifications Cleared', 'All notifications removed');
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // Spoilage rows (with localized digits) - MOVED UP
  const spoilageRows = useMemo(() => {
    const base =
      iotData?.length > 0
        ? iotData
        : [
          { id: 1, location: "Tomatoes", temp: 22, humidity: 78, status: "warning", food_quality: "Risk" },
          { id: 2, location: "Milk", temp: 6, humidity: 70, status: "ok", food_quality: "Good" },
          { id: 3, location: "Spinach", temp: 10, humidity: 66, status: "ok", food_quality: "Good" },
          { id: 4, location: "Water", temp: 18, humidity: 55, status: "ok", food_quality: "Good" },
        ];

    return base.map((s, idx) => {
      const risk = s.status === "warning" || s.food_quality !== "Good";
      const hours = risk ? 8 + (idx % 4) * 2 : 48;
      const percent = risk ? 68 : 66;
      return { ...s, risk, hours, percent };
    });
  }, [iotData]);

  // Analytics data
  const analyticsData = useMemo(() => {
    const last7Days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const orderTrend = [12, 19, 15, 25, 22, 30, 28];
    const inventoryTrend = [145, 142, 138, 135, 148, 150, inventory.length || 145];
    const spoilageRate = [5, 3, 4, 2, 3, 1, spoilageRows.filter(s => s.risk).length];

    return { last7Days, orderTrend, inventoryTrend, spoilageRate };
  }, [inventory.length, spoilageRows]);

  // Export functions
  const exportToCSV = (type) => {
    let csvContent = '';
    let filename = '';

    if (type === 'inventory') {
      csvContent = 'Item,Quantity,Unit,Category\n';
      inventory.forEach(item => {
        csvContent += `${item.name},${item.quantity},${item.unit},${item.category}\n`;
      });
      filename = 'inventory_report.csv';
    } else if (type === 'orders') {
      csvContent = 'Order ID,Consumer,Item,Quantity,Status\n';
      orders.forEach(order => {
        csvContent += `${order.id},${order.consumer_name},${order.item_name},${order.quantity},${order.status}\n`;
      });
      filename = 'orders_report.csv';
    } else if (type === 'spoilage') {
      csvContent = 'Location,Temperature,Humidity,Status,Risk Level\n';
      spoilageRows.forEach(item => {
        csvContent += `${item.location},${item.temp}°C,${item.humidity}%,${item.status},${item.risk ? 'High' : 'Low'}\n`;
      });
      filename = 'spoilage_report.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    toast('success', 'Report Exported', `${filename} downloaded successfully`);
  };

  const sendBroadcast = () => {
    if (!broadcastMessage.trim()) {
      toast('error', 'Empty Message', 'Please enter a broadcast message');
      return;
    }

    // Simulate broadcast
    toast('success', 'Broadcast Sent', `Message sent to all ${formatNumber(1247, lang)} consumers`);
    setBroadcastMessage('');
    setShowBroadcast(false);

    // Add to notifications
    const newNotif = {
      id: Date.now(),
      type: 'success',
      title: 'Broadcast Sent',
      message: broadcastMessage.substring(0, 50) + '...',
      time: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const sendSOSAlert = async () => {
    if (!sosReason.trim()) {
      toast('error', 'Empty Message', 'Please describe the emergency');
      return;
    }

    try {
      // Get supplier location (you can use a fixed location or get from user)
      const supplierLocation = { lat: 24.8170, lng: 93.9368 }; // Default to Imphal
      
      await axios.post('http://localhost:8000/sos-alert', {
        lat: supplierLocation.lat,
        lng: supplierLocation.lng,
        reason: sosReason,
        sender_name: 'Supplier',
        sender_type: 'supplier'
      });
      
      setShowSOSModal(false);
      setSOSReason('');
      toast('success', 'SOS Alert Sent', 'Emergency Command Center notified. Danger zone created on map.');
    } catch (err) {
      toast('error', 'SOS Failed', 'Could not send alert. Check backend connection.');
    }
  };

  // Toasts
  const [toasts, setToasts] = useState([]);
  const toast = (type, title, message = "") => {
    const id = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
    setToasts((p) => [{ id, type, title, message }, ...p].slice(0, 4));
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 2600);
  };
  const removeToast = (id) => setToasts((p) => p.filter((x) => x.id !== id));

  const toggleLanguage = () => {
    const langs = ["en", "hi", "mni", "or"];
    const current = langs.indexOf(lang) > -1 ? langs.indexOf(lang) : 0;
    const next = (current + 1) % langs.length;
    i18n.changeLanguage(langs[next]);
    toast("info", "Language changed", `Now using: ${langs[next].toUpperCase()}`);
  };

  const fetchData = async () => {
    try {
      const [invRes, reqRes, iotRes, riskRes, msgRes] = await Promise.all([
        axios.get(`${API}/inventory`),
        axios.get(`${API}/food-requests`),
        axios.get(`${API}/iot/spoilage`),
        axios.get(`${API}/risk-zones`),
        axios.get(`${API}/messages`),
      ]);

      setInventory(invRes.data || []);
      setRequests(reqRes.data || []);
      setIotData(iotRes.data || []);
      setRiskZones(riskRes.data || []);
      setMessages(Array.isArray(msgRes.data) ? msgRes.data.slice().reverse() : []);
      setLastSync(new Date());
      setLoading(false);
    } catch (err) {
      console.error("Sync Error:", err);
      // Set loading to false even on error so page shows
      setLoading(false);
      // Don't show error toast on first load
      if (inventory.length > 0 || requests.length > 0) {
        toast("error", "Sync failed", "Check backend server is running.");
      }
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMode, messages.length, aiMessages.length]);

  // Orders with mock status
  const orders = useMemo(() => {
    return (requests || []).map((r) => {
      const mod = (r.id ?? 0) % 3;
      const status = mod === 0 ? "Status" : mod === 1 ? "Accepted" : "Delivered";
      return { ...r, status };
    });
  }, [requests]);

  const lowStockItems = useMemo(() => (inventory || []).filter((i) => Number(i.quantity) < 30), [inventory]);

  // Stats (localized digits)
  const todaysSalesAmount = 5400;
  const todaysSales = formatCurrencyINR(todaysSalesAmount, lang);
  const ordersCompleted = formatNumber(orders.filter((o) => o.status === "Delivered").length || 12, lang);
  const totalItems = formatNumber(inventory.length || 145, lang);

  // Inventory CRUD
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || newItem.quantity === "") return toast("error", "Missing fields", "Enter name + quantity.");

    try {
      await axios.post(`${API}/inventory`, { ...newItem, quantity: parseFloat(newItem.quantity) });
      setShowAddModal(false);
      setNewItem({ name: "", quantity: "", unit: "kg", category: "Vegetables" });
      toast("success", "Item added");
      fetchData();
    } catch (err) {
      toast("error", "Add failed", err?.response?.data?.detail || "Check backend.");
    }
  };

  const handleUpdate = async (item) => {
    const newQty = prompt(`Enter new quantity for ${item.name}:`, item.quantity);
    if (newQty === null) return;
    if (newQty === "" || isNaN(newQty)) return toast("error", "Invalid quantity", "Enter a number.");

    try {
      await axios.put(`${API}/inventory/${item.id}`, {
        name: item.name,
        quantity: parseFloat(newQty),
        unit: item.unit,
        category: item.category,
      });
      toast("success", "Updated quantity");
      fetchData();
    } catch (err) {
      toast("error", "Update failed", err?.response?.data?.detail || "Check backend.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/inventory/${deleteId}`);
      setDeleteId(null);
      toast("success", "Item deleted");
      fetchData();
    } catch (err) {
      toast("error", "Delete failed", "Check backend.");
    }
  };

  const addDefaults = async () => {
    const defaults = [
      { name: t("item.onion", { defaultValue: "Onion" }), quantity: 50, unit: "kg", category: "Vegetables" },
      { name: t("item.ginger", { defaultValue: "Ginger" }), quantity: 15, unit: "kg", category: "Vegetables" },
      { name: t("item.dal", { defaultValue: "Dal" }), quantity: 30, unit: "kg", category: "Grains" },
      { name: t("item.rice_meals", { defaultValue: "Rice Meals" }), quantity: 100, unit: "packets", category: "Cooked Food" },
      { name: t("item.dal_chawal", { defaultValue: "Dal Chawal" }), quantity: 80, unit: "packets", category: "Cooked Food" },
      { name: t("item.water", { defaultValue: "Water" }), quantity: 200, unit: "bottles", category: "Beverages" },
    ];
    try {
      for (const it of defaults) await axios.post(`${API}/inventory`, it);
      toast("success", "Defaults added", "Onion + Ginger + Dal");
      fetchData();
    } catch (e) {
      toast("error", "Defaults failed", "Check backend.");
    }
  };

  const handleFulfill = async (id) => {
    try {
      const res = await axios.post(`${API}/fulfill-request/${id}`);
      toast("success", "Fulfilled", res?.data?.message || "Order fulfilled.");
      fetchData();
    } catch (err) {
      toast("error", "Fulfill failed", err?.response?.data?.detail || "Check backend.");
    }
  };

  // Risk zones
  const handleMapClick = async (latlng) => {
    const reason = prompt("Enter reason for Risk Zone:");
    if (!reason) return;

    try {
      await axios.post(`${API}/risk-zones`, { lat: latlng.lat, lng: latlng.lng, radius: 500, reason });
      toast("success", "Risk zone added");
      fetchData();
    } catch (err) {
      toast("error", "Add zone failed");
    }
  };

  const handleDeleteZone = async (id) => {
    if (!confirm("Remove this risk zone?")) return;
    try {
      await axios.delete(`${API}/risk-zones/${id}`);
      toast("success", "Zone removed");
      fetchData();
    } catch (err) {
      toast("error", "Delete zone failed");
    }
  };



  // Stock rows (localized)
  const stockRows = useMemo(() => {
    const base = inventory.length
      ? inventory.slice(0, 3).map((x) => ({ id: x.id, name: x.name }))
      : [
        { id: 1, name: "Tomatoes" },
        { id: 2, name: "Milk" },
        { id: 3, name: "Spinach" },
      ];
    return base.map((r, idx) => {
      const temp = idx === 0 ? "22°C" : idx === 1 ? "8°C" : "6°C";
      const risk = idx === 0;
      return { ...r, temp, risk };
    });
  }, [inventory]);

  // Chat
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    if (chatMode === "consumer") {
      try {
        await axios.post(`${API}/messages`, { sender: "Supplier", content: replyText.trim() });
        setReplyText("");
        fetchData();
        toast("success", "Message sent");
      } catch {
        toast("error", "Message failed");
      }
      return;
    }

    const userText = replyText.trim();
    setReplyText("");
    setAiMessages((p) => [...p, { sender: "You", content: userText, type: "sent" }]);
    setIsTyping(true);

    try {
      const response = await axios.post(`${API}/ai-chat`, {
        query: userText,
        context: {
          role: 'supplier',
          inventory: inventory,
          orders: orders,
          low_stock: lowStockItems,
          spoilage: spoilageRows.filter(s => s.risk)
        }
      });
      setAiMessages((p) => [...p, { sender: "AI", content: response.data.response, type: "received" }]);
      setIsTyping(false);
    } catch (error) {
      console.warn("AI Backend unreachable, using local fallback logic.");
      setTimeout(() => {
        const q = userText.toLowerCase();
        let reply = "Ask me: low stock, orders, spoilage risk, or restock plan.";

        if (q.includes("stock") || q.includes("low")) {
          reply = lowStockItems.length
            ? `Low stock: ${lowStockItems.map((x) => x.name).slice(0, 6).join(", ")}`
            : "All stock looks healthy ✅";
        } else if (q.includes("spoil") || q.includes("risk") || q.includes("quality")) {
          const bad = spoilageRows.filter((x) => x.risk);
          reply = bad.length ? `Risk items: ${bad.map((x) => x.location).join(", ")}` : "No current spoilage risk ✅";
        } else if (q.includes("order")) {
          reply = orders.length ? `You have ${orders.length} orders. Fulfill pending first.` : "No orders yet.";
        }

        setAiMessages((p) => [...p, { sender: "AI", content: reply, type: "received" }]);
        setIsTyping(false);
      }, 600);
    }
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <ToastStack toasts={toasts} remove={removeToast} />

      {/* Modern Gradient Sidebar - 5% */}
      <aside className={`w-[5%] ${darkMode ? 'bg-slate-900/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl'} border-r ${darkMode ? 'border-slate-700' : 'border-slate-200'} flex flex-col items-center py-6 gap-1 shadow-2xl`}>
        <a
          href="#inventory"
          title="Inventory"
          className={`group relative w-12 h-12 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-700 hover:text-emerald-600'} hover:bg-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20`}
        >
          <Package size={22} className="group-hover:scale-110 transition-transform" />
          <div className="absolute left-0 w-1 h-0 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-r-full group-hover:h-8 transition-all"></div>
        </a>
        <a
          href="#orders"
          title="Orders"
          className={`group relative w-12 h-12 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'} hover:bg-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20`}
        >
          <Truck size={22} className="group-hover:scale-110 transition-transform" />
          <div className="absolute left-0 w-1 h-0 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full group-hover:h-8 transition-all"></div>
        </a>
        <a
          href="#alerts"
          title="Alerts"
          className={`group relative w-12 h-12 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-amber-400' : 'text-slate-700 hover:text-amber-600'} hover:bg-amber-500/10 hover:shadow-lg hover:shadow-amber-500/20`}
        >
          <AlertTriangle size={22} className="group-hover:scale-110 transition-transform" />
          <div className="absolute left-0 w-1 h-0 bg-gradient-to-b from-amber-400 to-amber-600 rounded-r-full group-hover:h-8 transition-all"></div>
        </a>
        <a
          href="#spoilage"
          title="Spoilage Monitor"
          className={`group relative w-12 h-12 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-rose-400' : 'text-slate-700 hover:text-rose-600'} hover:bg-rose-500/10 hover:shadow-lg hover:shadow-rose-500/20`}
        >
          <Thermometer size={22} className="group-hover:scale-110 transition-transform" />
          <div className="absolute left-0 w-1 h-0 bg-gradient-to-b from-rose-400 to-rose-600 rounded-r-full group-hover:h-8 transition-all"></div>
        </a>
        <button
          onClick={() => setShowRiskMap(true)}
          title="Risk Zones"
          className={`group relative w-12 h-12 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-red-400' : 'text-slate-700 hover:text-red-600'} hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/20`}
        >
          <MapIcon size={22} className="group-hover:scale-110 transition-transform" />
          <div className="absolute left-0 w-1 h-0 bg-gradient-to-b from-red-400 to-red-600 rounded-r-full group-hover:h-8 transition-all"></div>
        </button>
        <a
          href="#summary"
          onClick={(e) => { e.preventDefault(); setShowAnalytics(true); }}
          title="Analytics"
          className={`group relative w-12 h-12 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-purple-400' : 'text-slate-700 hover:text-purple-600'} hover:bg-purple-500/10 hover:shadow-lg hover:shadow-purple-500/20`}
        >
          <BarChart3 size={22} className="group-hover:scale-110 transition-transform" />
          <div className="absolute left-0 w-1 h-0 bg-gradient-to-b from-purple-400 to-purple-600 rounded-r-full group-hover:h-8 transition-all"></div>
        </a>
        <button
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          title="Notifications"
          className={`group relative w-12 h-12 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-700 hover:text-cyan-600'} hover:bg-cyan-500/10 hover:shadow-lg hover:shadow-cyan-500/20`}
        >
          <Bell size={22} className="group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
          <div className="absolute left-0 w-1 h-0 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-r-full group-hover:h-8 transition-all"></div>
        </button>
        <button
          onClick={() => toast('info', 'Team', 'Team management coming soon')}
          title="Team"
          className={`group relative w-12 h-12 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-700 hover:text-indigo-600'} hover:bg-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20`}
        >
          <Users size={22} className="group-hover:scale-110 transition-transform" />
          <div className="absolute left-0 w-1 h-0 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-r-full group-hover:h-8 transition-all"></div>
        </button>
        <div className="flex-1" />
        <button
          onClick={toggleDarkMode}
          title={darkMode ? "Light Mode" : "Dark Mode"}
          className={`group relative w-12 h-12 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-yellow-400' : 'text-slate-700 hover:text-yellow-600'} hover:bg-yellow-500/10 hover:shadow-lg hover:shadow-yellow-500/20`}
        >
          {darkMode ? <Sun size={22} className="group-hover:rotate-180 transition-transform duration-500" /> : <Moon size={22} className="group-hover:rotate-12 transition-transform" />}
          <div className="absolute left-0 w-1 h-0 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-r-full group-hover:h-8 transition-all"></div>
        </button>
        <button
          onClick={() => toast('info', 'Settings', 'Settings panel coming soon')}
          title="Settings"
          className={`group relative w-12 h-12 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-700 hover:text-slate-800'} ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} hover:shadow-lg`}
        >
          <Settings size={22} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
        <button
          onClick={() => setShowAddModal(true)}
          title="Add Item"
          className="w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-105"
        >
          <Plus size={24} className="font-bold" />
        </button>
      </aside>

      {/* Main Content - 65-95% */}
      <main className={`transition-all duration-300 ${chatOpen ? 'w-[65%]' : 'w-[95%]'} overflow-y-auto`}>
        <div className={`${darkMode ? 'bg-slate-900' : 'bg-white/70 backdrop-blur'} border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'} min-h-screen`}>
          {/* Premium Header */}
          <header className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg">
                  <Package size={24} />
                </div>
                <div>
                  <div className="text-[24px] font-black drop-shadow-md">{t("supplier_dashboard", { defaultValue: "Supplier Dashboard" })}</div>
                  <div className="bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs text-blue-100 font-semibold flex items-center gap-2 shadow-sm">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></span>
                    {t("live_sync", { defaultValue: "Live Sync" })}: {localizeDigits(lastSync.toLocaleTimeString(), lang)}
                  </div>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                  <PackageCheck className="text-emerald-100" size={18} />
                  <div>
                    <div className="text-[10px] text-emerald-100 font-semibold uppercase tracking-wide">{t("orders_completed", { defaultValue: "Orders" })}</div>
                    <div className="text-lg font-black leading-none">{ordersCompleted}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                  <Package className="text-emerald-100" size={18} />
                  <div>
                    <div className="text-[10px] text-emerald-100 font-semibold uppercase tracking-wide">{t("items", { defaultValue: "Items" })}</div>
                    <div className="text-lg font-black leading-none">{totalItems}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleLanguage}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shadow-sm"
                  type="button"
                >
                  <Globe size={16} />
                  {lang === "en" ? "EN" : lang === "hi" ? "HI" : lang === "mni" ? "MNI" : "OR"}
                </button>

                <button
                  onClick={() => setShowSOSModal(true)}
                  className="bg-red-600 hover:bg-red-700 backdrop-blur-sm border border-red-500 px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shadow-sm animate-pulse"
                  type="button"
                  title="Emergency SOS"
                >
                  <ShieldAlert size={16} /> SOS
                </button>

                <button
                  onClick={() => setShowExport(true)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shadow-sm"
                  type="button"
                  title="Export Reports"
                >
                  <Download size={16} />
                </button>

                <button
                  onClick={() => setShowBroadcast(true)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shadow-sm"
                  type="button"
                  title="Emergency Broadcast"
                >
                  <Radio size={16} />
                </button>

                <button
                  onClick={() => { localStorage.removeItem('foodtech_user'); navigate("/login"); }}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2 transition-all shadow-sm"
                  type="button"
                >
                  <LogOut size={16} />
                  {t("logout", { defaultValue: "Logout" })}
                </button>
              </div>
            </div>
          </header>



          {/* Content */}
          <div className={`p-6 md:p-8 space-y-8 ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-b from-blue-50/50 to-indigo-50/50'}`}>

            {/* CRISIS ALERTS SECTION - TOP PRIORITY */}
            <div className="bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 rounded-3xl p-6 border-2 border-red-200 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                    <ShieldAlert className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      🚨 Crisis Detection System
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold">Multi-source real-time monitoring • NDMA • News • SOS • Police</p>
                  </div>
                </div>
                <div className="bg-red-600 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                  {crisisAlerts.length} Active Alerts
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {crisisAlerts.map((alert) => (
                  <div key={alert.id} className={`bg-white rounded-2xl p-4 border-2 ${alert.severity === 'critical' ? 'border-red-500 shadow-lg shadow-red-200' :
                      alert.severity === 'high' ? 'border-orange-400 shadow-lg shadow-orange-200' :
                        'border-amber-300 shadow-md'
                    } hover:scale-105 transition-transform`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${alert.severity === 'critical' ? 'bg-red-600' :
                            alert.severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'
                          }`}></div>
                        <span className={`text-xs font-black uppercase px-2 py-1 rounded-full ${alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                            alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                              'bg-amber-100 text-amber-700'
                          }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">{alert.time}</span>
                    </div>

                    <h3 className="font-bold text-slate-900 mb-1 text-sm">{alert.type}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                      <MapIcon size={12} className="text-red-600" />
                      <span className="font-semibold">{alert.location}</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-[10px] font-bold">
                          📡 {alert.source}
                        </div>
                        <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-[10px] font-bold">
                          👥 {formatNumber(alert.affected, lang)} affected
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-slate-200">
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p>
                    <span className="font-bold">How we detect crises:</span> We use a multi-channel approach combining Government APIs (NDMA), real-time news monitoring, crowdsourced SOS reports from consumers, police emergency reports, and manual verification by authorities.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></span>
                {t("quick_actions", { defaultValue: "Quick Actions" })}
              </div>
              <div className="mt-1 text-sm text-slate-500">{t("quick_desc", { defaultValue: "Monitor inventory, orders, spoilage and chat in real time." })}</div>
            </div>

            {/* Section 1: Inventory & Orders */}
            <div id="inventory" className="space-y-6 scroll-mt-24">
              <div className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="text-2xl">📦</span>
                {t("inventory_orders", { defaultValue: "Inventory & Orders" })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inventory */}
                <SoftCard
                  title={t("inventory_mgmt", { defaultValue: "Inventory Management" })}
                  right={
                    <div className="flex items-center gap-2">
                      <button
                        onClick={addDefaults}
                        className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                        type="button"
                      >
                        + {t("add_defaults", { defaultValue: "Add Defaults" })}
                      </button>

                      <button
                        onClick={() => setShowAddModal(true)}
                        className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#2F6FED] hover:bg-[#295fcb] text-white inline-flex items-center gap-2"
                        type="button"
                      >
                        <Plus size={16} />
                        {t("add_item", { defaultValue: "Add Item" })}
                      </button>
                    </div>
                  }
                >
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-slate-500">
                          <th className="text-left px-4 py-3 font-semibold">{t("col_item", { defaultValue: "Item" })}</th>
                          <th className="text-left px-4 py-3 font-semibold">{t("col_qty", { defaultValue: "Quantity" })}</th>
                          <th className="text-left px-4 py-3 font-semibold">{t("col_action", { defaultValue: "Action" })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-10 text-center text-slate-400">
                              Loading…
                            </td>
                          </tr>
                        ) : inventory.length ? (
                          inventory.map((it) => (
                            <tr key={it.id} className="border-t border-slate-100 hover:bg-slate-50/70 transition">
                              <td className="px-4 py-3 font-semibold text-slate-900">{it.name}</td>
                              <td className="px-4 py-3 text-slate-700">
                                {formatNumber(it.quantity, lang)} {it.unit}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <IconBtn title="Edit" onClick={() => handleUpdate(it)} variant="blue">
                                    <Pencil size={16} />
                                  </IconBtn>

                                  <button
                                    onClick={() => setDeleteId(it.id)}
                                    className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-2"
                                    type="button"
                                  >
                                    <Trash size={14} />
                                    {t("delete", { defaultValue: "Delete" })}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-4 py-10 text-center text-slate-400">
                              {t("inventory_empty", { defaultValue: "Inventory Empty" })}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </SoftCard>

                {/* Supplier Orders */}
                <SoftCard
                  id="orders"
                  title={t("supplier_orders", { defaultValue: "Food Requests" })}
                  right={<div className="text-[11px] font-semibold text-slate-400 uppercase">{t("pending_requests", { defaultValue: "PENDING REQUESTS" })}</div>}
                >
                  <div className="space-y-4">
                    {(orders.length ? orders : [{ id: 1, consumer_name: "FreshBite Cafe", item_name: "Tomatoes", quantity: 15, status: "Status" }])
                      .slice(0, 3)
                      .map((o) => {
                        const variant = o.status === "Status" ? "red" : o.status === "Accepted" ? "green" : "blue";

                        return (
                          <div key={o.id} className="rounded-2xl border border-slate-200/70 bg-white shadow-sm p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-slate-900">{o.consumer_name || "Client"}</div>
                                <div className="text-xs text-slate-500 mt-1">
                                  {(o.status === "Delivered"
                                    ? t("delivered_order", { defaultValue: "Delivered order" })
                                    : o.status === "Accepted"
                                      ? t("accepted_order", { defaultValue: "Accepted order" })
                                      : t("discovered_order", { defaultValue: "Discovered order" }))}{" "}
                                  : <span className="font-semibold">{formatNumber(o.quantity, lang)}</span>{" "}
                                  {t("units", { defaultValue: "units" })} • <span className="text-slate-700">{o.item_name}</span>
                                </div>

                                <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                                  <span className="inline-flex items-center gap-1">
                                    <CheckCircle2 size={14} className="text-emerald-600" />
                                    {formatNumber(Math.max(10, Number(o.quantity) || 15), lang)} {t("lbs", { defaultValue: "lbs" })}
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <Timer size={14} className="text-amber-600" />
                                    {localizeDigits(t("time_ago", { defaultValue: "1 min • 30 ago" }), lang)}
                                  </span>
                                </div>
                              </div>

                              <Pill variant={variant}>
                                {o.status === "Delivered" ? <PackageCheck size={14} /> : o.status === "Accepted" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                {o.status === "Status" ? t("status", { defaultValue: "Status" }) : o.status}
                              </Pill>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <div className="text-xs text-slate-400">{localizeDigits(t("order_id", { defaultValue: "21 Ago" }), lang)}</div>

                              {o.status !== "Delivered" ? (
                                <button
                                  onClick={() => handleFulfill(o.id)}
                                  className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 inline-flex items-center gap-2"
                                  type="button"
                                >
                                  <Truck size={14} />
                                  {t("fulfill", { defaultValue: "Fulfill" })}
                                </button>
                              ) : (
                                <div className="text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2">
                                  {localizeDigits(t("eta", { defaultValue: "ETA 10 Mins" }), lang)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </SoftCard>
              </div>
            </div>

            {/* Section 2: Monitoring & Alerts */}
            <div id="alerts" className="space-y-6 scroll-mt-24">
              <div className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="text-2xl">⚠️</span>
                {t("monitoring_alerts", { defaultValue: "Monitoring & Alerts" })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stock Alerts */}
                <SoftCard title={t("stock_alerts", { defaultValue: "Stock Alerts" })}>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr className="text-slate-500">
                          <th className="text-left px-4 py-3 font-semibold">{t("col_item", { defaultValue: "Item" })}</th>
                          <th className="text-left px-4 py-3 font-semibold">{t("col_temp", { defaultValue: "Temperature" })}</th>
                          <th className="text-left px-4 py-3 font-semibold">{t("col_spoil", { defaultValue: "Spoilage" })}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockRows.map((row) => (
                          <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td>
                            <td className="px-4 py-3 text-slate-700">{localizeDigits(row.temp, lang)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Pill variant={row.risk ? "red" : "green"}>
                                  {row.risk ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                                  {row.risk ? t("risk", { defaultValue: "Risk" }) : t("safe", { defaultValue: "Safe" })}
                                </Pill>
                                <span className="text-xs text-slate-500">
                                  {row.risk
                                    ? localizeDigits(t("spoil_in", { defaultValue: "Spoil in 8 hrs" }), lang)
                                    : localizeDigits(t("safe_for", { defaultValue: "Safe for 2 days" }), lang)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {lowStockItems.length === 0 && (
                    <div className="mt-4 text-xs text-slate-500 inline-flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      {t("stock_healthy", { defaultValue: "Stock levels healthy." })}
                    </div>
                  )}
                </SoftCard>

                {/* Live Spoilage Monitor */}
                <SoftCard id="spoilage" title={t("live_spoilage", { defaultValue: "Live Spoilage Monitor" })} right={<Thermometer className="text-indigo-500" />}>
                  <div className="space-y-4">
                    {spoilageRows.slice(0, 3).map((s, idx) => (
                      <div key={s.id ?? idx} className="rounded-2xl border border-slate-200/70 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-900">{s.location || "Warehouse"}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              {s.risk
                                ? localizeDigits(`Spoil in ${s.hours} hours`, lang)
                                : localizeDigits("Safe for 2 days", lang)}
                            </div>

                            <div className="mt-2 text-xs text-slate-600">
                              <span className="inline-flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${s.risk ? "bg-rose-500" : "bg-emerald-500"}`} />
                                Temp: <span className="font-semibold">{localizeDigits(`${s.temp}°C`, lang)}</span> • Hum:{" "}
                                <span className="font-semibold">{localizeDigits(`${s.humidity}%`, lang)}</span>
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs text-slate-500">{localizeDigits(`${s.percent}%`, lang)}</div>
                            <Pill variant={s.risk ? "red" : "green"}>{s.risk ? t("risk", { defaultValue: "Risk" }) : t("safe", { defaultValue: "Safe" })}</Pill>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setShowRiskMap(true)}
                      className="bg-[#E14B4B] hover:bg-[#d24242] text-white px-5 py-3 rounded-2xl font-semibold shadow-sm inline-flex items-center gap-2"
                      type="button"
                    >
                      <ShieldAlert size={18} />
                      {t("manage_risk", { defaultValue: "Manage Risk Zones" })}
                    </button>
                  </div>
                </SoftCard>
              </div>
            </div>

            {/* Section 3: Quick Stats Summary */}
            <div id="summary" className="space-y-6 scroll-mt-24">
              <div className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                {t("quick_summary", { defaultValue: "Quick Summary" })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-emerald-700 font-semibold uppercase">{t("total_inventory", { defaultValue: "Total Inventory" })}</div>
                      <div className="text-2xl font-extrabold text-emerald-900 mt-1">{formatNumber(inventory.length, lang)}</div>
                      <div className="text-xs text-emerald-600 mt-1">{t("items_in_stock", { defaultValue: "items in stock" })}</div>
                    </div>
                    <Package className="text-emerald-600" size={32} />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-amber-700 font-semibold uppercase">{t("low_stock_items", { defaultValue: "Low Stock Items" })}</div>
                      <div className="text-2xl font-extrabold text-amber-900 mt-1">{formatNumber(lowStockItems.length, lang)}</div>
                      <div className="text-xs text-amber-600 mt-1">{t("need_attention", { defaultValue: "need attention" })}</div>
                    </div>
                    <AlertTriangle className="text-amber-600" size={32} />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-rose-700 font-semibold uppercase">{t("spoilage_risk", { defaultValue: "Spoilage Risk" })}</div>
                      <div className="text-2xl font-extrabold text-rose-900 mt-1">{formatNumber(spoilageRows.filter(s => s.risk).length, lang)}</div>
                      <div className="text-xs text-rose-600 mt-1">{t("items_at_risk", { defaultValue: "items at risk" })}</div>
                    </div>
                    <Thermometer className="text-rose-600" size={32} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Export Reports Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Download size={28} />
                <div>
                  <h2 className="text-2xl font-black">Export Reports</h2>
                  <p className="text-sm text-indigo-100 mt-1">Download data in CSV format</p>
                </div>
              </div>
              <button
                onClick={() => setShowExport(false)}
                className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-4">
              <button
                onClick={() => exportToCSV('inventory')}
                className="w-full p-6 rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 bg-emerald-50 hover:bg-emerald-100 transition-all group"
                type="button"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-emerald-500 flex items-center justify-center">
                      <Package size={28} className="text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-bold text-slate-900">Inventory Report</div>
                      <div className="text-sm text-slate-600 mt-1">{formatNumber(inventory.length || 145, lang)} items • Full stock details</div>
                    </div>
                  </div>
                  <FileText size={24} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                </div>
              </button>

              <button
                onClick={() => exportToCSV('orders')}
                className="w-full p-6 rounded-2xl border-2 border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 transition-all group"
                type="button"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center">
                      <Truck size={28} className="text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-bold text-slate-900">Orders Report</div>
                      <div className="text-sm text-slate-600 mt-1">{formatNumber(orders.length || 28, lang)} orders • Fulfillment status</div>
                    </div>
                  </div>
                  <FileText size={24} className="text-blue-600 group-hover:scale-110 transition-transform" />
                </div>
              </button>

              <button
                onClick={() => exportToCSV('spoilage')}
                className="w-full p-6 rounded-2xl border-2 border-rose-200 hover:border-rose-400 bg-rose-50 hover:bg-rose-100 transition-all group"
                type="button"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-rose-500 flex items-center justify-center">
                      <Thermometer size={28} className="text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-bold text-slate-900">Spoilage Report</div>
                      <div className="text-sm text-slate-600 mt-1">IoT monitoring • Temperature & humidity data</div>
                    </div>
                  </div>
                  <FileText size={24} className="text-rose-600 group-hover:scale-110 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Broadcast Modal */}
      {showBroadcast && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Radio size={28} className="animate-pulse" />
                <div>
                  <h2 className="text-2xl font-black">Emergency Broadcast</h2>
                  <p className="text-sm text-red-100 mt-1">Send urgent message to all consumers</p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcast(false)}
                className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <div className="font-bold mb-1">Crisis Alert System</div>
                    This will send an immediate notification to <span className="font-bold">{formatNumber(1247, lang)} active consumers</span> in Manipur region.
                  </div>
                </div>
              </div>

              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Enter emergency message (e.g., New food center opened at Imphal East, Road blockage at NH-2, Weather alert)..."
                className="w-full h-32 border-2 border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none"
              />

              <div className="flex items-center justify-between mt-6">
                <div className="text-xs text-slate-500">
                  {broadcastMessage.length}/500 characters
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBroadcast(false)}
                    className="px-6 py-3 rounded-xl border-2 border-slate-200 hover:bg-slate-50 font-semibold transition"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendBroadcast}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    type="button"
                  >
                    <Radio size={18} />
                    Send Broadcast
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SOS Alert Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border-2 border-red-500">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ShieldAlert size={28} className="animate-pulse" />
                <div>
                  <h2 className="text-2xl font-black">Emergency SOS</h2>
                  <p className="text-sm text-red-100 mt-1">Report danger zone</p>
                </div>
              </div>
              <button
                onClick={() => { setShowSOSModal(false); setSOSReason(''); }}
                className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <div className="font-bold mb-1">Official Alert</div>
                    As a supplier, your alert will be <span className="font-bold">immediately verified</span> and added as a danger zone on the map.
                  </div>
                </div>
              </div>

              <textarea
                value={sosReason}
                onChange={(e) => setSOSReason(e.target.value)}
                placeholder="Describe the danger (violence, flood, road blockage, fire, etc.)..."
                className="w-full h-32 border-2 border-red-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none"
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => { setShowSOSModal(false); setSOSReason(''); }}
                  className="px-6 py-3 rounded-xl border-2 border-slate-200 hover:bg-slate-50 font-semibold transition"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={sendSOSAlert}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  type="button"
                >
                  <ShieldAlert size={18} />
                  Send SOS Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
          <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <BarChart3 size={28} />
                <div>
                  <h2 className="text-2xl font-black">Analytics Dashboard</h2>
                  <p className="text-sm text-purple-100 mt-1">Last 7 days performance metrics</p>
                </div>
              </div>
              <button
                onClick={() => setShowAnalytics(false)}
                className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)] space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-5">
                  <div className="text-xs text-emerald-700 font-semibold uppercase mb-2">Total Orders</div>
                  <div className="text-3xl font-black text-emerald-900">{formatNumber(orders.length || 28, lang)}</div>
                  <div className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                    <span className="text-emerald-500">↗</span> +12% from last week
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-5">
                  <div className="text-xs text-blue-700 font-semibold uppercase mb-2">Inventory Items</div>
                  <div className="text-3xl font-black text-blue-900">{formatNumber(inventory.length || 145, lang)}</div>
                  <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                    <span className="text-blue-500">↗</span> +5 items added
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-5">
                  <div className="text-xs text-amber-700 font-semibold uppercase mb-2">Spoilage Rate</div>
                  <div className="text-3xl font-black text-amber-900">2.3%</div>
                  <div className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <span className="text-emerald-500">↘</span> -1.2% improvement
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-5">
                  <div className="text-xs text-purple-700 font-semibold uppercase mb-2">Efficiency</div>
                  <div className="text-3xl font-black text-purple-900">94%</div>
                  <div className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                    <span className="text-emerald-500">↗</span> +3% this week
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Trend Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Truck size={20} className="text-blue-600" />
                    Order Fulfillment Trend
                  </h3>
                  <div className="h-48 flex items-end justify-between gap-2">
                    {analyticsData.orderTrend.map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer relative group" style={{ height: `${(val / 30) * 100}%` }}>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            {formatNumber(val, lang)} orders
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 font-semibold">{analyticsData.last7Days[idx]}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inventory Trend Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Package size={20} className="text-emerald-600" />
                    Inventory Level Trend
                  </h3>
                  <div className="h-48 flex items-end justify-between gap-2">
                    {analyticsData.inventoryTrend.map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg hover:from-emerald-600 hover:to-emerald-500 transition-all cursor-pointer relative group" style={{ height: `${(val / 150) * 100}%` }}>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            {formatNumber(val, lang)} items
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 font-semibold">{analyticsData.last7Days[idx]}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spoilage Rate Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Thermometer size={20} className="text-rose-600" />
                    Spoilage Risk Trend
                  </h3>
                  <div className="h-48 flex items-end justify-between gap-2">
                    {analyticsData.spoilageRate.map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-gradient-to-t from-rose-500 to-rose-400 rounded-t-lg hover:from-rose-600 hover:to-rose-500 transition-all cursor-pointer relative group" style={{ height: `${(val / 5) * 100}%` }}>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            {formatNumber(val, lang)} at risk
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 font-semibold">{analyticsData.last7Days[idx]}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <PackageCheck size={20} className="text-purple-600" />
                    Category Distribution
                  </h3>
                  <div className="space-y-3">
                    {['Cooked Food', 'Vegetables', 'Grains', 'Beverages', 'Oil'].map((cat, idx) => {
                      const percent = [30, 25, 20, 15, 10][idx];
                      const colors = ['bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-slate-500'][idx];
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-semibold text-slate-700">{cat}</span>
                            <span className="text-slate-500">{percent}%</span>
                          </div>
                          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${colors} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      <aside className={`fixed right-0 top-0 h-screen bg-white border-l border-slate-200 shadow-2xl transition-all duration-300 z-50 flex flex-col ${notificationsOpen ? 'w-[350px]' : 'w-0'}`}>
        {notificationsOpen && (
          <>
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={20} />
                <h3 className="font-bold text-lg">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{unreadCount}</span>
                )}
              </div>
              <button
                onClick={() => setNotificationsOpen(false)}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Bell size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${notif.read
                        ? 'bg-white border-slate-200 opacity-60'
                        : 'bg-white border-slate-300 shadow-md hover:shadow-lg'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${notif.type === 'warning' ? 'bg-amber-500' :
                          notif.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                        } ${!notif.read && 'animate-pulse'}`} />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-slate-900">{notif.title}</div>
                        <div className="text-xs text-slate-600 mt-1">{notif.message}</div>
                        <div className="text-[10px] text-slate-400 mt-2">{notif.time}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 bg-white border-t border-slate-200">
                <button
                  onClick={clearAllNotifications}
                  className="w-full py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition"
                  type="button"
                >
                  Clear All
                </button>
              </div>
            )}
          </>
        )}
      </aside>

      {/* Chat Sidebar - 30% */}
      <aside className={`fixed right-0 top-0 h-screen bg-white border-l border-slate-200 shadow-2xl transition-all duration-300 z-40 flex flex-col ${chatOpen ? 'w-[30%]' : 'w-0'}`}>
        {chatOpen && (
          <>
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare size={20} />
                <h3 className="font-bold text-lg">{t("chat", { defaultValue: "Chat" })}</h3>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Mode Toggle */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex gap-2">
              <button
                onClick={() => setChatMode("consumer")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition inline-flex items-center justify-center gap-2 ${chatMode === "consumer"
                    ? "bg-sky-600 text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                type="button"
              >
                <MessageSquare size={14} /> Consumer
              </button>
              <button
                onClick={() => setChatMode("ai")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition inline-flex items-center justify-center gap-2 ${chatMode === "ai"
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                type="button"
              >
                <Bot size={14} /> AI Help
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {chatMode === "consumer" ? (
                <>
                  {messages.length === 0 && (
                    <div className="text-center text-sm text-slate-400 italic py-8">
                      {t("no_messages", { defaultValue: "No messages yet." })}
                    </div>
                  )}
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl shadow-sm ${m.sender === "Supplier"
                          ? "bg-sky-600 text-white ml-12"
                          : "bg-white text-slate-800 mr-12"
                        }`}
                    >
                      <div className={`text-[10px] font-bold mb-1 ${m.sender === "Supplier" ? "text-sky-100" : "text-slate-500"
                        }`}>
                        {m.sender}
                      </div>
                      <div className="text-sm">{m.content}</div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {aiMessages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl shadow-sm ${m.type === "sent"
                          ? "bg-purple-600 text-white ml-12"
                          : "bg-white text-slate-800 mr-12"
                        }`}
                    >
                      <div className={`text-[10px] font-bold mb-1 ${m.type === "sent" ? "text-purple-100" : "text-slate-500"
                        }`}>
                        {m.sender}
                      </div>
                      <div className="text-sm">{m.content}</div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="p-3 rounded-xl shadow-sm bg-white text-slate-800 mr-12">
                      <div className="text-[10px] font-bold mb-1 text-slate-500">AI</div>
                      <div className="text-sm flex gap-1">
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

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-4 bg-white border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t("type_reply", { defaultValue: "Type message..." })}
                  className="flex-1 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  type="submit"
                  className={`px-4 py-3 rounded-xl font-semibold text-white inline-flex items-center gap-2 shadow-md hover:shadow-lg transition ${chatMode === "consumer" ? "bg-sky-600 hover:bg-sky-700" : "bg-purple-600 hover:bg-purple-700"
                    }`}
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </>
        )}
      </aside>

      {/* Chat Toggle Button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed right-6 bottom-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all z-50 flex items-center gap-2"
          type="button"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* DELETE MODAL */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[92%] max-w-md shadow-2xl border border-slate-200">
            <div className="font-semibold text-slate-900 text-lg">{t("delete_item", { defaultValue: "Delete item?" })}</div>
            <div className="text-sm text-slate-500 mt-2">{t("delete_desc", { defaultValue: "This will remove the item from inventory." })}</div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-xl border border-slate-200 font-semibold hover:bg-slate-50" type="button">
                {t("cancel", { defaultValue: "Cancel" })}
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700" type="button">
                {t("delete", { defaultValue: "Delete" })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-[92%] max-w-md shadow-2xl border border-slate-200">
            <h3 className="text-lg font-semibold mb-4 text-slate-900">{t("add_item", { defaultValue: "Add Item" })}</h3>

            <form onSubmit={handleAddItem} className="space-y-3">
              <input
                className="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder={t("item_name", { defaultValue: "Item name" })}
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />

              <input
                className="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200"
                type="number"
                placeholder={t("quantity", { defaultValue: "Quantity" })}
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              />

              <select
                className="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              >
                <option>Vegetables</option>
                <option>Grains</option>
                <option>Oil</option>
                <option>Cooked Food</option>
                <option>Beverages</option>
                <option>Medicine</option>
              </select>

              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl">
                  {t("cancel", { defaultValue: "Cancel" })}
                </button>
                <button type="submit" className="px-5 py-2 bg-[#2F6FED] text-white rounded-xl font-semibold hover:bg-[#295fcb]">
                  {t("submit", { defaultValue: "Submit" })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RISK MAP MODAL */}
      {showRiskMap && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[92%] h-[92%] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="bg-[#E14B4B] text-white px-5 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShieldAlert /> {t("risk_manager", { defaultValue: "Risk Zone Manager" })}
              </h2>
              <button onClick={() => setShowRiskMap(false)} className="bg-white/15 hover:bg-white/20 px-4 py-2 rounded-xl font-semibold" type="button">
                {t("close", { defaultValue: "Close" })}
              </button>
            </div>

            <div className="flex-1 relative">
              <MapContainer center={[24.817, 93.9368]} zoom={11} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickHandler onMapClick={handleMapClick} />

                {riskZones.map((zone) => (
                  <Circle
                    key={zone.id}
                    center={[zone.lat, zone.lng]}
                    radius={zone.radius}
                    pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.3 }}
                    eventHandlers={{ click: () => handleDeleteZone(zone.id) }}
                  >
                    <Popup>
                      <div className="text-center">
                        <b className="text-red-600 uppercase">{t("risk_zone", { defaultValue: "RISK ZONE" })}</b>
                        <div className="mt-1">{zone.reason}</div>
                        <div className="mt-2 text-xs text-slate-500">({t("click_delete", { defaultValue: "Click circle to delete" })})</div>
                      </div>
                    </Popup>
                  </Circle>
                ))}
              </MapContainer>

              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur px-4 py-3 rounded-2xl shadow border border-slate-200">
                <div className="text-sm font-semibold text-slate-900">{t("tip", { defaultValue: "Tip" })}</div>
                <div className="text-xs text-slate-600 mt-1">
                  {t("risk_tip", { defaultValue: "Click on map to add a risk zone. Click a circle to delete." })}
                </div>
              </div>

              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-4 py-3 rounded-2xl shadow border border-slate-200">
                <div className="text-xs font-semibold text-slate-800 inline-flex items-center gap-2">
                  <MapIcon size={16} /> {t("map_help", { defaultValue: "Click map to add zone" })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
