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
    { sender: "AI", content: "Hi Supplier 👋 Ask me about low stock, orders, or spoilage risk.", type: "received" },
  ]);
  const chatEndRef = useRef(null);

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
      setLoading(false);
      toast("error", "Sync failed", "Check backend server is running.");
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

  // Spoilage rows (with localized digits)
  const spoilageRows = useMemo(() => {
    const base =
      iotData?.length > 0
        ? iotData
        : [
            { id: 1, location: "Tomatoes", temp: 22, humidity: 78, status: "warning", food_quality: "Risk" },
            { id: 2, location: "Milk", temp: 6, humidity: 70, status: "ok", food_quality: "Good" },
            { id: 3, location: "Spinach", temp: 10, humidity: 66, status: "ok", food_quality: "Good" },
          ];

    return base.map((s, idx) => {
      const risk = s.status === "warning" || s.food_quality !== "Good";
      const hours = risk ? 8 + (idx % 4) * 2 : 48;
      const percent = risk ? 68 : 66;
      return { ...s, risk, hours, percent };
    });
  }, [iotData]);

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
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100">
      <ToastStack toasts={toasts} remove={removeToast} />

      <main className="max-w-6xl mx-auto p-6">
        <div className="bg-white/70 backdrop-blur rounded-[28px] border border-slate-200 shadow-[0_18px_60px_rgba(15,23,42,0.12)] overflow-hidden">
          {/* Header */}
          <header className="px-7 py-5 bg-gradient-to-r from-[#1F4E8C] to-[#234F86] text-white">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Package />
                </div>
                <div>
                  <div className="text-[22px] font-extrabold">{t("supplier_dashboard", { defaultValue: "Supplier Dashboard" })}</div>
                  <div className="text-xs text-white/70">
                    {t("live_sync", { defaultValue: "Live Sync" })}: {localizeDigits(lastSync.toLocaleTimeString(), lang)}
                  </div>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-3">
                <SmallStat label={t("orders_completed", { defaultValue: "ORDERS COMPLETED" })} value={ordersCompleted} />
                <SmallStat label={t("items", { defaultValue: "ITEMS" })} value={totalItems} />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleLanguage}
                  className="bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2"
                  type="button"
                >
                  <Globe size={16} />
                  {lang === "en" ? "EN" : lang === "hi" ? "HI" : lang === "mni" ? "MNI" : "OR"}
                </button>

                <button
                  onClick={() => navigate("/login")}
                  className="bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
                  type="button"
                >
                  <LogOut size={16} />
                  {t("logout", { defaultValue: "Logout" })}
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="p-7 space-y-6">
            <div>
              <div className="text-sm font-semibold text-slate-900">{t("quick_actions", { defaultValue: "Quick Actions" })}</div>
              <div className="mt-1 text-xs text-slate-500">{t("quick_desc", { defaultValue: "Monitor inventory, orders, spoilage and chat in real time." })}</div>
            </div>

            {/* Section 1: Inventory & Orders */}
            <div id="inventory" className="space-y-6 scroll-mt-24">
              <div className="text-sm font-semibold text-slate-900">{t("inventory_orders", { defaultValue: "📦 Inventory & Orders" })}</div>
              
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
              <div className="text-sm font-semibold text-slate-900">{t("monitoring_alerts", { defaultValue: "⚠️ Monitoring & Alerts" })}</div>
              
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

            {/* Section 3: Communication & Summary */}
            <div id="chat" className="space-y-6 scroll-mt-24">
              <div className="text-sm font-semibold text-slate-900">{t("communication_summary", { defaultValue: "💬 Communication & Summary" })}</div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chat - Left Side */}
                <SoftCard
                  title={t("supplier_chat", { defaultValue: "Chat" })}
                  right={
                    <div className="flex gap-2">
                      <button
                        onClick={() => setChatMode("consumer")}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1 border ${
                          chatMode === "consumer"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                        type="button"
                      >
                        <MessageSquare size={12} /> Consumer
                      </button>
                      <button
                        onClick={() => setChatMode("ai")}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1 border ${
                          chatMode === "ai"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                        type="button"
                      >
                        <Bot size={12} /> AI Help
                      </button>
                    </div>
                  }
                >
                <div className="h-48 overflow-y-auto space-y-3 pr-2">
                  {chatMode === "consumer" ? (
                    <>
                      {messages.length === 0 && <div className="text-sm text-slate-400 italic">{t("no_messages", { defaultValue: "No messages yet." })}</div>}
                      {messages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border ${
                            m.sender === "Supplier"
                              ? "bg-sky-50 border-sky-200 ml-20 text-right"
                              : "bg-slate-50 border-slate-200 mr-20"
                          }`}
                        >
                          <div className={`text-[10px] font-semibold mb-1 ${m.sender === "Supplier" ? "text-sky-700" : "text-slate-500"}`}>{m.sender}</div>
                          <div className="text-xs text-slate-800">{m.content}</div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      {aiMessages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border ${
                            m.type === "sent"
                              ? "bg-purple-50 border-purple-200 ml-20 text-right"
                              : "bg-slate-50 border-slate-200 mr-20"
                          }`}
                        >
                          <div className={`text-[10px] font-semibold mb-1 ${m.type === "sent" ? "text-purple-700" : "text-slate-500"}`}>{m.sender}</div>
                          <div className="text-xs text-slate-800">{m.content}</div>
                        </div>
                      ))}
                    </>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendChat} className="flex gap-2 mt-4 border-t border-slate-200 pt-4">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={t("type_reply", { defaultValue: "Type message..." })}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                  <button
                    type="submit"
                    className={`px-4 rounded-xl font-semibold text-white inline-flex items-center gap-2 ${
                      chatMode === "consumer" ? "bg-sky-600 hover:bg-sky-700" : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    <Send size={16} /> {t("send", { defaultValue: "Send" })}
                  </button>
                </form>
                </SoftCard>

                {/* Quick Stats Summary - Right Side */}
                <div className="space-y-4">
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
        </div>
      </main>

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
