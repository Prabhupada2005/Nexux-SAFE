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
  Download,
  Radio,
  FileText,
  Printer,
  WifiOff,
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

function SoftCard({ title, right, children, className = "", ...props }) {
  return (
    <section
      {...props}
      className={[
        "bg-white rounded-2xl border border-slate-200/70",
        "shadow-[0_8px_24px_rgba(15,23,42,0.06)]",
        "dark:bg-slate-800 dark:border-slate-600",
        "min-h-[260px]",
        className,
      ].join(" ")}
    >
      <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {right}
      </div>
      <div className="p-6 dark:text-slate-300">{children}</div>
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
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 shadow-sm">
      <div className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-[18px] font-extrabold text-slate-900 dark:text-white leading-none">{value}</div>
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
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('supplier_inventory');
    return saved ? JSON.parse(saved) : [];
  });
  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem('supplier_requests');
    return saved ? JSON.parse(saved) : [];
  });
  const [iotData, setIotData] = useState([]);
  const [riskZones, setRiskZones] = useState([]);
  const [lastSync, setLastSync] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRiskMap, setShowRiskMap] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Add item form
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    unit: "packets",
    category: "Cooked Food",
  });

  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([
    { sender: "AI", content: "Hi Supplier 👋 I'm your Nexus Smart Assistant. Ask me about low stock, incoming orders from the **Consumer Dashboard**, or spoilage risks.", type: "received" },
  ]);
  const [isAiTyping, setIsAiAiTyping] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
  const darkMode = false;
  const chatEndRef = useRef(null);

  // Crisis Alerts State - Show only recent/active alerts
  const [crisisAlerts] = useState([
    { id: 1, source: 'News API', location: 'Ukhrul', type: 'Communal Crisis', severity: 'critical', time: '18 min ago', affected: 3200 },
  ]);

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

  const fetchData = async () => {
    try {
      // Fake loading delay for demo
      await new Promise(resolve => setTimeout(resolve, 2000));

      const [invRes, reqRes, iotRes, riskRes] = await Promise.all([
        axios.get(`${API}/inventory`),
        axios.get(`${API}/food-requests`),
        axios.get(`${API}/iot/spoilage`),
        axios.get(`${API}/risk-zones`),
      ]);

      if (invRes.data) {
        setInventory(invRes.data);
        localStorage.setItem('supplier_inventory', JSON.stringify(invRes.data));
      }

      if (reqRes.data) {
        setRequests(reqRes.data);
        localStorage.setItem('supplier_requests', JSON.stringify(reqRes.data));
      }

      setIotData(iotRes.data || []);
      setRiskZones(riskRes.data || []);
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
    // return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages.length]);

  // Orders - filter out rejected requests
  const orders = useMemo(() => {
    return (requests || []).filter(r => r.status !== 'rejected').map((r) => {
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

      // Optimistic update for offline feel
      const updated = [...inventory, { ...newItem, id: Date.now(), quantity: parseFloat(newItem.quantity) }];
      setInventory(updated);
      localStorage.setItem('supplier_inventory', JSON.stringify(updated));

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

  const handleReject = async (id) => {
    const reason = prompt("Enter reason for rejection:");
    if (!reason || !reason.trim()) {
      toast("error", "Rejection cancelled", "Reason is required");
      return;
    }

    try {
      await axios.post(`${API}/reject-request/${id}`, { reason: reason.trim() });
      toast("success", "Request Rejected", "Consumer will be notified");
      fetchData();
    } catch (err) {
      toast("error", "Reject failed", err?.response?.data?.detail || "Check backend.");
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

  // AI Chat
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userText = aiInput.trim();
    setAiInput("");
    setAiMessages((p) => [...p, { sender: "You", content: userText, type: "sent" }]);
    setIsAiAiTyping(true);

    // Simulate AI thinking and streaming
    setTimeout(async () => {
      const q = userText.toLowerCase();
      let reply = "I'm monitoring the system. You can ask me about low stock, orders pending from the **Consumer Dashboard**, spoilage risk levels, or request a restock plan.";

      if (q.includes("stock") || q.includes("low")) {
        reply = lowStockItems.length
          ? `I've analyzed your inventory. You have ${lowStockItems.length} items running low: ${lowStockItems.map((x) => x.name).slice(0, 6).join(", ")}. I recommend restocking these soon to meet demands from the **Consumer Dashboard**.`
          : "Great news! All stock levels are currently within safe margins. No immediate restock required.";
      } else if (q.includes("spoil") || q.includes("risk") || q.includes("quality")) {
        const bad = spoilageRows.filter((x) => x.risk);
        reply = bad.length
          ? `Alert: Spoilage risk detected for ${bad.map((x) => x.location).join(", ")}. The IoT sensors indicate unfavorable conditions. You should prioritize these for the next batch of orders.`
          : "All storage units are operating at optimal temperature and humidity. Spoilage risk is minimal.";
      } else if (q.includes("order")) {
        reply = orders.length
          ? `You currently have ${orders.length} active orders processed via the **Consumer Dashboard**. Please fulfill the pending ones to maintain high supplier ratings.`
          : "There are no new orders from the **Consumer Dashboard** at the moment. Keep your inventory ready for the next peak period.";
      }

      // Create empty message to stream into
      setAiMessages((p) => [...p, { sender: "AI", content: "", type: "received" }]);
      setIsAiAiTyping(false);

      // Streaming effect
      let currentContent = "";
      const words = reply.split(" ");
      for (let i = 0; i < words.length; i++) {
        currentContent += (i === 0 ? "" : " ") + words[i];
        setAiMessages((p) => {
          const updated = [...p];
          updated[updated.length - 1].content = currentContent;
          return updated;
        });
        await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 40));
      }
    }, 800);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-900 to-slate-900"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 mb-6 relative">
            <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <Package className="absolute inset-0 m-auto text-emerald-400" size={24} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 tracking-wide">Loading supplier data...</h2>
          <div className="flex items-center gap-2 text-emerald-400/60 text-xs font-mono uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Syncing IoT Nodes
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'dark bg-slate-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} p-4 md:p-0 overflow-hidden`}>
      <ToastStack toasts={toasts} remove={removeToast} />

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="absolute top-0 left-0 w-full bg-amber-600/90 backdrop-blur-md text-white py-1 px-4 text-center text-xs font-bold z-[100] flex items-center justify-center gap-2 border-b border-amber-500/50">
          <WifiOff size={14} />
          {t('offline_msg', "You're offline - Sync paused")}
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden rounded-3xl md:rounded-none shadow-2xl md:shadow-none bg-white/95 backdrop-blur-xl w-full h-full border border-slate-200 md:border-none">
      {/* Modern Gradient Sidebar - Responsive Bottom/Side Bar */}
      <aside className={`order-2 md:order-1 w-full h-16 md:h-auto md:w-20 ${darkMode ? 'bg-slate-900/95' : 'bg-white/95'} border-t md:border-t-0 md:border-r ${darkMode ? 'border-slate-700' : 'border-slate-200'} flex md:flex-col flex-row items-center justify-around md:justify-start py-2 md:py-6 gap-1 z-40`}>
        <button
          onClick={() => scrollToSection("inventory")}
          title="Inventory"
          className={`group relative w-12 h-12 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-700 hover:text-emerald-600'} hover:bg-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20`}
        >
          <Package size={22} className="group-hover:scale-110 transition-transform" />
          <div className="absolute left-0 w-1 h-0 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-r-full group-hover:h-8 transition-all"></div>
        </button>
        <button
          onClick={() => scrollToSection("orders")}
          title="Orders"
          className={`group relative w-12 h-12 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'} hover:bg-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20`}
        >
          <Truck size={22} className="group-hover:scale-110 transition-transform" />
          <div className="absolute left-0 w-1 h-0 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full group-hover:h-8 transition-all"></div>
        </button>
        <button
          onClick={() => scrollToSection("alerts")}
          title="Alerts"
          className={`group relative w-12 h-12 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-amber-400' : 'text-slate-700 hover:text-amber-600'} hover:bg-amber-500/10 hover:shadow-lg hover:shadow-amber-500/20`}
        >
          <AlertTriangle size={22} className="group-hover:scale-110 transition-transform" />
          <div className="absolute left-0 w-1 h-0 bg-gradient-to-b from-amber-400 to-amber-600 rounded-r-full group-hover:h-8 transition-all"></div>
        </button>
        <button
          onClick={() => scrollToSection("spoilage")}
          title="Spoilage Monitor"
          className={`group relative w-12 h-12 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-rose-400' : 'text-slate-700 hover:text-rose-600'} hover:bg-rose-500/10 hover:shadow-lg hover:shadow-rose-500/20`}
        >
          <Thermometer size={22} className="group-hover:scale-110 transition-transform" />
          <div className="absolute left-0 w-1 h-0 bg-gradient-to-b from-rose-400 to-rose-600 rounded-r-full group-hover:h-8 transition-all"></div>
        </button>
        <button
          onClick={() => setShowRiskMap(true)}
          title="Risk Zones"
          className={`group relative w-12 h-12 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-red-400' : 'text-slate-700 hover:text-red-600'} hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/20`}
        >
          <MapIcon size={22} className="group-hover:scale-110 transition-transform" />
          <div className="absolute left-0 w-1 h-0 bg-gradient-to-b from-red-400 to-red-600 rounded-r-full group-hover:h-8 transition-all"></div>
        </button>

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
          onClick={() => setShowTeamModal(true)}
          title="Team"
          className={`group relative w-12 h-12 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-700 hover:text-indigo-600'} hover:bg-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20`}
        >
          <Users size={22} className="group-hover:scale-110 transition-transform" />
          <div className="absolute left-0 w-1 h-0 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-r-full group-hover:h-8 transition-all"></div>
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setShowSettingsModal(true)}
          title="Settings"
          className={`group relative w-12 h-12 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-700 hover:text-slate-800'} ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100'} hover:shadow-lg`}
        >
          <Settings size={22} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </aside>

      {/* Main Content - 65-95% */}
      <main className={`order-1 md:order-2 transition-all duration-300 flex-1 ${chatOpen ? 'mr-0 md:mr-80' : ''} overflow-y-auto`}>
        <div className={`${darkMode ? 'bg-slate-900' : 'bg-white/70 backdrop-blur'} border-r ${darkMode ? 'border-slate-800' : 'border-slate-200'} h-auto min-h-[160px]`}>

          {/* FIXED ALERT BAR */}
          {crisisAlerts.length > 0 && (
            <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between shadow-md sticky top-0 z-30">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/20 rounded-full animate-pulse">
                  <ShieldAlert size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    CRISIS ALERT: {crisisAlerts[0].type}
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">{crisisAlerts[0].severity}</span>
                  </div>
                  <div className="text-xs text-red-100 flex items-center gap-3">
                    <span className="flex items-center gap-1"><MapIcon size={10} /> {crisisAlerts[0].location}</span>
                    <span>•</span>
                    <span>{crisisAlerts[0].time}</span>
                    <span>•</span>
                    <span>{formatNumber(crisisAlerts[0].affected, lang)} affected</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowRiskMap(true)} className="bg-white text-red-600 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-red-50 transition-colors shadow-sm">
                View on Map
              </button>
            </div>
          )}

          {/* Premium Header */}
          <header className="px-4 py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-md">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-sm">
                  <Package size={18} />
                </div>
                <div>
                  <div className="text-lg font-black drop-shadow-sm leading-tight">Supplier Control Panel</div>
                  <div className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider opacity-90">Live Monitoring System</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* LIVE STATUS INDICATOR */}
                <div className="hidden lg:block text-right mr-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                    </span>
                    <span className="text-xs font-bold text-white drop-shadow-sm">System Active</span>
                  </div>
                  <div className="text-[10px] text-emerald-100 font-bold opacity-90 mt-0.5">
                    Last updated 1 min ago
                  </div>
                </div>

                <button
                  onClick={toggleLanguage}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-2 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-all"
                  type="button"
                >
                  <Globe size={14} />
                  {lang === "en" ? "EN" : lang === "hi" ? "HI" : lang === "mni" ? "MNI" : "OR"}
                </button>

                <button
                  onClick={() => setShowSOSModal(true)}
                  className="bg-red-600 hover:bg-red-700 backdrop-blur-sm border border-red-500 px-2 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-all animate-pulse"
                  type="button"
                  title="Emergency SOS"
                >
                  <ShieldAlert size={14} /> SOS
                </button>

                <button
                  onClick={() => setShowExport(true)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 p-1.5 rounded-lg transition-all"
                  type="button"
                  title="Export Reports"
                >
                  <Download size={16} />
                </button>

                <button
                  onClick={() => setShowBroadcast(true)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 p-1.5 rounded-lg transition-all"
                  type="button"
                  title="Emergency Broadcast"
                >
                  <Radio size={16} />
                </button>

                <button
                  onClick={() => navigate("/login")}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 p-1.5 rounded-lg transition-all"
                  type="button"
                  title={t("logout", { defaultValue: "Logout" })}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </header>



          {/* Content */}
          <div className={`p-4 md:p-8 space-y-6 md:space-y-8 ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-b from-blue-50/50 to-indigo-50/50'}`}>

            {/* Quick KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SmallStat label="Total Items" value={totalItems} />
              <SmallStat label="Pending Requests" value={formatNumber(orders.length, lang)} />
              <SmallStat label="Risk Alerts" value={formatNumber(spoilageRows.filter(s => s.risk).length, lang)} />
            </div>

            <div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></span>
                {t("quick_actions", { defaultValue: "⚡ Quick Actions" })}
              </div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">{t("quick_desc", { defaultValue: "Monitor inventory, orders, spoilage and chat in real time." })}</div>
            </div>

            {/* MAIN DASHBOARD GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 items-start">

              {/* LEFT COLUMN: Inventory + Monitoring */}
              <div className="space-y-4">
                {/* Inventory */}
                <div id="inventory" className="scroll-mt-24">
                  <SoftCard
                    title={t("inventory_mgmt", { defaultValue: "📦 Inventory Management" })}
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
                          className="text-sm font-semibold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-2"
                          type="button"
                        >
                          <Plus size={16} />
                          {t("add_item", { defaultValue: "Add Item" })}
                        </button>
                      </div>
                    }
                  >
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                          <tr className="text-slate-500 dark:text-slate-400">
                            <th className="text-left px-4 py-3 font-semibold">{t("col_item", { defaultValue: "Item" })}</th>
                            <th className="text-left px-4 py-3 font-semibold">{t("col_qty", { defaultValue: "Quantity" })}</th>
                            <th className="text-left px-4 py-3 font-semibold">{t("col_action", { defaultValue: "Action" })}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={3} className="px-4 py-10 text-left text-slate-400">
                                Loading…
                              </td>
                            </tr>
                          ) : inventory.length ? (
                            inventory.map((it) => (
                              <tr key={it.id} className="border-t border-slate-100 hover:bg-slate-50/70 dark:border-slate-700 dark:hover:bg-slate-700/50 transition">
                                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200">{it.name}</td>
                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                  {formatNumber(it.quantity, lang)} {it.unit}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <IconBtn title="Edit" onClick={() => handleUpdate(it)} variant="slate">
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
                              <td colSpan={3} className="px-4 py-10 text-left text-slate-400">
                                {t("inventory_empty", { defaultValue: "Inventory Empty" })}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </SoftCard>
                </div>

                {/* Live Spoilage Monitor */}
                <SoftCard id="spoilage" title={t("live_spoilage", { defaultValue: "🥗 Live Spoilage Monitor" })} right={<Thermometer className="text-indigo-500" />}>
                  <div className="space-y-4">
                    {spoilageRows.slice(0, 3).map((s, idx) => (
                      <div key={s.id ?? idx} className="rounded-2xl border border-slate-200/70 bg-white dark:bg-slate-700/50 dark:border-slate-600 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-200">{s.location || "Warehouse"}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {s.risk
                                ? localizeDigits(`Spoil in ${s.hours} hours`, lang)
                                : localizeDigits("Safe for 2 days", lang)}
                            </div>

                            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                              <span className="inline-flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${s.risk ? "bg-rose-500" : "bg-emerald-500"}`} />
                                Temp: <span className="font-semibold">{localizeDigits(`${s.temp}°C`, lang)}</span> • Hum:{" "}
                                <span className="font-semibold">{localizeDigits(`${s.humidity}%`, lang)}</span>
                              </span>
                            </div>
                          </div>

                          <div className="text-left">
                            <div className="text-xs text-slate-500 dark:text-slate-400">{localizeDigits(`${s.percent}%`, lang)}</div>
                            <Pill variant={s.risk ? "red" : "green"}>{s.risk ? t("risk", { defaultValue: "Risk" }) : t("safe", { defaultValue: "Safe" })}</Pill>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SoftCard>
              </div>

              {/* RIGHT COLUMN: Requests + Alerts */}
              <div className="space-y-4">

                {/* Supplier Orders */}
                <SoftCard
                  id="orders"
                  title={t("supplier_orders", { defaultValue: "📋 Food Requests" })}
                  right={<div className="text-[11px] font-semibold text-slate-400 uppercase">{formatNumber(orders.length, lang)} {t("pending_requests", { defaultValue: "REQUESTS" })}</div>}
                >
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <PackageCheck className="mx-auto text-slate-300 mb-3" size={48} />
                      <div className="text-sm font-semibold text-slate-600">No pending requests</div>
                      <div className="text-xs text-slate-400 mt-1">Food requests from consumers will appear here</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((o) => {
                        const variant = o.status === "Status" ? "red" : o.status === "Accepted" ? "green" : "blue";

                        return (
                          <div key={o.id} className="rounded-2xl border border-slate-200/70 bg-white dark:bg-slate-700/50 dark:border-slate-600 shadow-sm p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-slate-200">{o.consumer_name || "Consumer"}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  Requested: <span className="font-semibold">{formatNumber(o.quantity, lang)}</span>{" "}
                                  {t("units", { defaultValue: "units" })} • <span className="text-slate-700 dark:text-slate-300">{o.item_name}</span>
                                </div>

                                <div className="mt-2 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                                  <span className="inline-flex items-center gap-1">
                                    <Timer size={14} className="text-amber-600" />
                                    {localizeDigits("Just now", lang)}
                                  </span>
                                </div>
                              </div>

                              <Pill variant={variant}>
                                {o.status === "Delivered" ? <PackageCheck size={14} /> : o.status === "Accepted" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                {o.status === "Status" ? t("pending", { defaultValue: "Pending" }) : o.status}
                              </Pill>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-600">
                              {o.status !== "Delivered" ? (
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => handleReject(o.id)}
                                    className="flex-1 h-[42px] px-4 rounded-xl border-2 border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:border-rose-200 transition-all uppercase tracking-wider flex items-center justify-center"
                                    type="button"
                                  >
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => handleFulfill(o.id)}
                                    className="flex-1 h-[42px] px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                                    type="button"
                                  >
                                    <CheckCircle2 size={16} />
                                    Approve
                                  </button>
                                </div>
                              ) : (
                                <div className="w-full py-3 text-center px-4 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-xl dark:bg-sky-900/30 dark:border-sky-800 dark:text-sky-300">
                                  ✓ Delivered
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SoftCard>

                {/* Stock Alerts */}
                <div id="alerts" className="scroll-mt-24">
                  <SoftCard title={t("stock_alerts", { defaultValue: "⚠ Stock Alerts" })}>
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                          <tr className="text-slate-500 dark:text-slate-400">
                            <th className="text-left px-4 py-3 font-semibold">{t("col_item", { defaultValue: "Item" })}</th>
                            <th className="text-left px-4 py-3 font-semibold">{t("col_temp", { defaultValue: "Temperature" })}</th>
                            <th className="text-left px-4 py-3 font-semibold">{t("col_spoil", { defaultValue: "Spoilage" })}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockRows.map((row) => (
                            <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/70 dark:border-slate-700 dark:hover:bg-slate-700/50 transition">
                              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200">{row.name}</td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{localizeDigits(row.temp, lang)}</td>
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
                </div>

              </div>
            </div>

            {/* Section 3: Quick Stats Summary */}
            <div id="summary" className="space-y-6 scroll-mt-24">
              <div className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {t("quick_summary", { defaultValue: "📊 Quick Summary" })}
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
                <div className="bg-[#dcfce7] border border-[#86efac] rounded-2xl p-5 dark:bg-slate-800 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-emerald-800 font-bold uppercase dark:text-emerald-200">{t("total_inventory", { defaultValue: "Total Inventory" })}</div>
                      <div className="text-2xl font-extrabold text-emerald-950 mt-1 dark:text-white">{formatNumber(inventory.length, lang)}</div>
                      <div className="text-xs text-emerald-700 mt-1 dark:text-emerald-300">{t("items_in_stock", { defaultValue: "items in stock" })}</div>
                    </div>
                    <Package className="text-emerald-700 dark:text-emerald-400" size={32} />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-5 dark:from-slate-800 dark:to-slate-800 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-amber-700 font-semibold uppercase dark:text-amber-200">{t("low_stock_items", { defaultValue: "Low Stock Items" })}</div>
                      <div className="text-2xl font-extrabold text-amber-900 mt-1 dark:text-white">{formatNumber(lowStockItems.length, lang)}</div>
                      <div className="text-xs text-amber-600 mt-1 dark:text-amber-300">{t("need_attention", { defaultValue: "need attention" })}</div>
                    </div>
                    <AlertTriangle className="text-amber-600 dark:text-amber-400" size={32} />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-2xl p-5 dark:from-slate-800 dark:to-slate-800 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-rose-700 font-semibold uppercase dark:text-rose-200">{t("spoilage_risk", { defaultValue: "Spoilage Risk" })}</div>
                      <div className="text-2xl font-extrabold text-rose-900 mt-1 dark:text-white">{formatNumber(spoilageRows.filter(s => s.risk).length, lang)}</div>
                      <div className="text-xs text-rose-600 mt-1 dark:text-rose-300">{t("items_at_risk", { defaultValue: "items at risk" })}</div>
                    </div>
                    <Thermometer className="text-rose-600 dark:text-rose-400" size={32} />
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
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-6 flex items-center justify-between">
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



      {/* Notifications Panel */}
      <aside className={`fixed right-0 top-0 h-screen bg-white border-l border-slate-200 shadow-2xl transition-all duration-300 z-50 flex flex-col ${notificationsOpen ? 'w-full md:w-[350px]' : 'w-0'}`}>
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

      {/* Premium Chat Sidebar */}
      <aside className={`fixed top-0 right-0 h-full w-80 md:w-96 bg-white/80 backdrop-blur-xl border-l border-slate-200/50 shadow-2xl z-50 transform transition-all duration-500 ease-in-out flex flex-col ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {chatOpen && (
          <>
            {/* Chat Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <div className="font-bold text-sm tracking-tight">Nexus Assistant</div>
                  <div className="text-[10px] text-emerald-100 font-medium uppercase tracking-widest opacity-80">
                    AI Intelligence
                  </div>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide bg-slate-50/30">
              {aiMessages.map((m, idx) => (
                <div key={idx} className={`flex flex-col ${m.type === "sent" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ring-1 ring-black/5 ${m.type === "sent"
                      ? "bg-emerald-600 text-white rounded-tr-none"
                      : "bg-white text-slate-800 rounded-tl-none border-l-4 border-emerald-500 border border-slate-200"
                    }`}>
                    {m.content || (
                      <div className="flex gap-1 py-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-150"></span>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 text-[10px] font-bold text-slate-400 px-1 uppercase tracking-tighter">
                    {m.sender} • {m.type === "sent" ? "User" : "Nexus Assistant"}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex flex-col items-start translate-y-2 opacity-100 transition-all duration-300">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border-l-4 border-emerald-500 border border-slate-200">
                    <div className="flex gap-1.5 items-center">
                      <span className="text-emerald-500 italic text-xs font-semibold">Nexus is analyzing system state...</span>
                      <span className="flex gap-0.5">
                        <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></span>
                        <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse delay-75"></span>
                        <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse delay-150"></span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Area */}
            <div className="p-5 bg-white border-t border-slate-100">
              <form onSubmit={handleSendChat} className="flex flex-col gap-3">
                <div className="relative group">
                  <input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Ask Nexus AI about inventory..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder-slate-400 group-hover:bg-slate-100/50 pr-14"
                  />
                  <button
                    type="submit"
                    disabled={!aiInput.trim() || isAiTyping}
                    className={`absolute right-2 top-2 p-2.5 rounded-xl transition-all ${aiInput.trim() && !isAiTyping
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                  >
                    <Send size={18} />
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 text-center font-bold tracking-tight uppercase opacity-70">
                  AI aggregates data across Nexus Platform
                </div>
              </form>
            </div>
          </>
        )}
      </aside>

      {/* Chat Toggle Button */}
      {!chatOpen && !showAddModal && (
        <button
          onClick={() => setChatOpen(true)}
          className="absolute right-6 bottom-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all z-50 flex items-center gap-2"
          type="button"
        >
          <MessageSquare size={24} />
        </button>
      )}
      </div>

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
            <h3 className="text-lg font-semibold mb-4 text-slate-900">{t("add_item", { defaultValue: "➕ Add Item" })}</h3>

            <form onSubmit={handleAddItem} className="space-y-3">
              <input
                className="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder={t("item_name", { defaultValue: "Item name" })}
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />

              <input
                className="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200"
                type="number"
                placeholder={t("quantity", { defaultValue: "Quantity" })}
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              />

              <select
                className="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200"
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
                <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700">
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
                      <div className="text-left">
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

      {/* TEAM MODAL */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-[92%] max-w-md shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">👥 Team Management</h3>
              <button onClick={() => setShowTeamModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">B</div>
                <div>
                  <div className="font-bold text-sm">Breny</div>
                  <div className="text-xs text-slate-500">Logistics Manager</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">S</div>
                <div>
                  <div className="font-bold text-sm">Sinthoiba</div>
                  <div className="text-xs text-slate-500">Inventory Specialist</div>
                </div>
              </div>
              <button className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-semibold hover:bg-slate-50 hover:border-slate-400 transition">
                + Add Team Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-2xl w-[92%] max-w-md shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">⚙️ Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="space-y-4">

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg"><Bell size={18} /></div>
                  <span className="font-medium text-slate-700">Notifications</span>
                </div>
                <button onClick={() => setNotificationsEnabled(!notificationsEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${notificationsEnabled ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Globe size={18} /></div>
                  <span className="font-medium text-slate-700">Language</span>
                </div>
                <select
                  value={lang}
                  onChange={(e) => {
                    i18n.changeLanguage(e.target.value);
                    toast("info", "Language changed", `Now using: ${e.target.value.toUpperCase()}`);
                  }}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="mni">Manipuri</option>
                  <option value="or">Odia</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
