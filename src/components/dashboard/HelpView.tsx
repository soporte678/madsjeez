"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Search, ChevronRight, ChevronDown, MessageCircle, Package,
  RotateCcw, Tag, Clock, HelpCircle, ArrowLeft, Send, X,
  Loader2, CheckCircle2, AlertCircle, Plus
} from "lucide-react";

// --- TIPOS ---
interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  messages: { id: string; content: string; isAgent: boolean; createdAt: string }[];
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    items: { product: { title: string; images: { url: string }[] } }[];
  } | null;
}

interface Message {
  id: string;
  content: string;
  isAgent: boolean;
  createdAt: string;
  sender: { name: string | null; image: string | null };
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface LastOrder {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  total: number;
  items: { product: { title: string; images: { url: string }[] } }[];
}

interface HelpViewProps {
  userData?: { name: string } | null;
  onNavigate?: (section: string) => void;
}

// --- HELPERS ---
const statusLabel: Record<string, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En progreso",
  WAITING_USER: "Esperando respuesta",
  RESOLVED: "Resuelta",
  CLOSED: "Cerrada",
};

const statusColor: Record<string, string> = {
  OPEN: "text-blue-600 bg-blue-50",
  IN_PROGRESS: "text-yellow-600 bg-yellow-50",
  WAITING_USER: "text-orange-600 bg-orange-50",
  RESOLVED: "text-green-600 bg-green-50",
  CLOSED: "text-gray-500 bg-gray-100",
};

const orderStatusLabel: Record<string, { text: string; color: string }> = {
  PENDING: { text: "Pendiente", color: "text-yellow-600" },
  CONFIRMED: { text: "Confirmado", color: "text-blue-600" },
  SHIPPED: { text: "Enviado", color: "text-blue-600" },
  DELIVERED: { text: "Entregado", color: "text-[#00a650]" },
  CANCELLED: { text: "Cancelado", color: "text-red-600" },
  REFUNDED: { text: "Reembolsado", color: "text-gray-600" },
};

const categoryLabel: Record<string, string> = {
  COMPRAS: "Compras",
  VENTAS: "Ventas",
  ENVIOS: "Envíos",
  PAGOS: "Pagos",
  CUENTA: "Mi cuenta",
  RECLAMOS: "Reclamos",
  OTROS: "Otros",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function HelpView({ userData, onNavigate }: HelpViewProps) {
  const user = userData || { name: "Usuario" };

  // --- ESTADOS ---
  const [view, setView] = useState<"home" | "tickets" | "chat" | "new" | "faq">("home");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [faqCategories, setFaqCategories] = useState<string[]>([]);
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [newTicket, setNewTicket] = useState({ subject: "", message: "", category: "OTROS" });
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- FETCHERS ---
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/support");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchMessages = async (ticketId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/support/messages?ticketId=${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchFaqs = async (q = "") => {
    try {
      const res = await fetch(`/api/dashboard/faq?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setFaqs(data.faqs || []);
        setFaqCategories(data.categories || []);
      }
    } catch (e) { console.error(e); }
  };

  const fetchLastOrder = async () => {
    try {
      const res = await fetch("/api/dashboard/orders?limit=1&role=buyer");
      if (res.ok) {
        const data = await res.json();
        if (data.orders?.length > 0) setLastOrder(data.orders[0]);
      }
    } catch (e) { console.error(e); }
  };

  // --- EFFECTS ---
  useEffect(() => {
    fetchTickets();
    fetchLastOrder();
    fetchFaqs();
  }, []);

  useEffect(() => {
    if (activeTicket) {
      fetchMessages(activeTicket.id);
    }
  }, [activeTicket]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- ACCIONES ---
  const sendMessage = async () => {
    if (!chatInput.trim() || !activeTicket || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/dashboard/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: activeTicket.id, content: chatInput }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setChatInput("");
      }
    } catch (e) { console.error(e); }
    setSending(false);
  };

  const createTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });
      if (res.ok) {
        const data = await res.json();
        setNewTicket({ subject: "", message: "", category: "OTROS" });
        setActiveTicket(data.ticket);
        setView("chat");
        fetchTickets();
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const closeTicket = async (id: string) => {
    try {
      await fetch("/api/dashboard/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "CLOSED" }),
      });
      fetchTickets();
      if (activeTicket?.id === id) setView("tickets");
    } catch (e) { console.error(e); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchFaqs(searchQuery);
      setView("faq");
    }
  };

  // ==========================================
  // VISTAS
  // ==========================================

  // --- CHAT VIEW ---
  if (view === "chat" && activeTicket) {
    return (
      <div className="flex flex-col w-full max-w-4xl mx-auto h-[calc(100vh-200px)] min-h-[500px]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <button onClick={() => { setView("tickets"); setActiveTicket(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-gray-800">{activeTicket.subject}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${statusColor[activeTicket.status] || "text-gray-500 bg-gray-100"}`}>
                {statusLabel[activeTicket.status] || activeTicket.status}
              </span>
              <span className="text-xs text-gray-400">{categoryLabel[activeTicket.category] || activeTicket.category}</span>
            </div>
          </div>
          {activeTicket.status !== "CLOSED" && (
            <button onClick={() => closeTicket(activeTicket.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold px-3 py-1.5 hover:bg-red-50 rounded-lg">
              Cerrar consulta
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-400 py-10">No hay mensajes aún</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isAgent ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.isAgent ? "bg-gray-100 text-gray-800" : "bg-[#3483fa] text-white"}`}>
                  {msg.isAgent && (
                    <p className="text-[11px] font-bold mb-1 text-gray-500">Soporte Madsjeez</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1 text-right ${msg.isAgent ? "text-gray-400" : "text-blue-200"}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        {activeTicket.status !== "CLOSED" && (
          <div className="border-t border-gray-100 pt-3 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Escribí tu mensaje..."
              className="flex-1 px-4 py-3 bg-gray-50 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3483fa]"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !chatInput.trim()}
              className="bg-[#3483fa] text-white p-3 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- NUEVA CONSULTA ---
  if (view === "new") {
    return (
      <div className="flex flex-col w-full max-w-2xl mx-auto pb-20">
        <div className="flex items-center gap-3 pb-6">
          <button onClick={() => setView("home")} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Nueva consulta</h2>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={newTicket.category}
              onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3483fa]"
            >
              {Object.entries(categoryLabel).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
            <input
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              placeholder="Ej: No recibí mi pedido"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3483fa]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Describí tu problema</label>
            <textarea
              value={newTicket.message}
              onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
              placeholder="Contanos con detalle qué pasó..."
              rows={5}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3483fa] resize-none"
            />
          </div>

          <button
            onClick={createTicket}
            disabled={loading || !newTicket.subject.trim() || !newTicket.message.trim()}
            className="w-full bg-[#3483fa] text-white py-3 rounded-lg font-bold text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            Enviar consulta
          </button>
        </div>
      </div>
    );
  }

  // --- TODAS LAS CONSULTAS ---
  if (view === "tickets") {
    return (
      <div className="flex flex-col w-full max-w-4xl mx-auto pb-20">
        <div className="flex items-center gap-3 pb-6">
          <button onClick={() => setView("home")} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-800 flex-1">Mis consultas</h2>
          <button onClick={() => setView("new")} className="bg-[#3483fa] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 flex items-center gap-2">
            <Plus size={16} /> Nueva consulta
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" size={28} /></div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No tenés consultas aún</p>
            <button onClick={() => setView("new")} className="mt-4 text-[#3483fa] font-semibold text-sm hover:underline">
              Crear tu primera consulta
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => { setActiveTicket(t); setView("chat"); }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${statusColor[t.status] || "text-gray-500 bg-gray-100"}`}>
                        {statusLabel[t.status] || t.status}
                      </span>
                      <span className="text-[11px] text-gray-400">{categoryLabel[t.category] || t.category}</span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm">{t.subject}</h3>
                    {t.messages[0] && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{t.messages[0].content}</p>
                    )}
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="text-[11px] text-gray-400">{formatDate(t.updatedAt)}</p>
                    <ChevronRight size={16} className="text-gray-300 ml-auto mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- FAQ VIEW ---
  if (view === "faq") {
    return (
      <div className="flex flex-col w-full max-w-4xl mx-auto pb-20">
        <div className="flex items-center gap-3 pb-6">
          <button onClick={() => setView("home")} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Preguntas frecuentes</h2>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); fetchFaqs(searchQuery); }} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en preguntas frecuentes..."
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3483fa]"
            />
          </div>
        </form>

        {faqs.length === 0 ? (
          <div className="text-center py-16">
            <HelpCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No encontramos resultados</p>
            <p className="text-gray-400 text-sm mt-1">Probá con otras palabras o creá una consulta</p>
            <button onClick={() => setView("new")} className="mt-4 text-[#3483fa] font-semibold text-sm hover:underline">
              Crear consulta
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {faqs.map((faq) => (
              <div key={faq.id} className="border-b border-gray-50 last:border-0">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-800 pr-4">{faq.question}</span>
                  <ChevronDown size={18} className={`text-gray-400 shrink-0 transition-transform ${expandedFaq === faq.id ? "rotate-180" : ""}`} />
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // HOME VIEW (principal)
  // ==========================================
  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto pb-20">

      {/* --- SALUDO Y BUSCADOR --- */}
      <div className="text-center py-10 flex flex-col items-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Hola, {user.name}. <br />
          <span className="text-gray-900 font-black text-3xl">¿Con qué te ayudamos?</span>
        </h1>

        <form onSubmit={handleSearch} className="relative w-full max-w-xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#3483fa]" size={20} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder="Buscá tu pregunta..."
            className="w-full pl-14 pr-6 py-4 bg-white rounded-full shadow-lg border border-gray-100 text-lg focus:outline-none focus:ring-2 focus:ring-[#3483fa] transition-all"
          />
        </form>
      </div>

      {/* --- CONSULTAS RECIENTES --- */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-lg font-bold text-gray-800">Consultas recientes</h2>
          <button onClick={() => setView("tickets")} className="text-[#3483fa] text-sm font-semibold hover:underline">
            {tickets.length > 0 ? "Mostrar todas" : "Ver consultas"}
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <MessageCircle size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">No tenés consultas recientes</p>
            <button onClick={() => setView("new")} className="mt-3 text-[#3483fa] text-sm font-semibold hover:underline">
              Crear una consulta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.slice(0, 2).map((t) => (
              <div
                key={t.id}
                onClick={() => { setActiveTicket(t); setView("chat"); }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col h-full hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${statusColor[t.status] || "text-gray-500 bg-gray-100"}`}>
                    {statusLabel[t.status] || t.status}
                  </span>
                  <span className="text-[11px] text-gray-400">{formatDate(t.updatedAt)}</span>
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 shrink-0">
                    <HelpCircle size={20} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-800">{t.subject}</p>
                    {t.messages[0] && (
                      <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-2">{t.messages[0].content}</p>
                    )}
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-gray-50">
                  <span className="text-[#3483fa] text-[13px] font-bold hover:underline">Ir a la consulta</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- ESTADO DE TU COMPRA --- */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-lg font-bold text-gray-800">Estado de tu compra</h2>
          <button onClick={() => onNavigate?.("compras")} className="text-[#3483fa] text-sm font-semibold hover:underline">
            Ir a Mis Compras
          </button>
        </div>

        {lastOrder ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                {lastOrder.items[0]?.product?.images?.[0]?.url ? (
                  <img src={lastOrder.items[0].product.images[0].url} alt="Producto" className="object-cover w-full h-full" />
                ) : (
                  <Package size={24} className="text-gray-400" />
                )}
              </div>
              <div className="flex flex-col">
                <span className={`${orderStatusLabel[lastOrder.status]?.color || "text-gray-600"} font-bold text-sm uppercase tracking-wide`}>
                  {orderStatusLabel[lastOrder.status]?.text || lastOrder.status}
                </span>
                <span className="text-gray-800 font-bold text-base">
                  {lastOrder.items[0]?.product?.title || `Pedido #${lastOrder.orderNumber}`}
                </span>
                <p className="text-xs text-gray-400 mt-0.5">Pedido del {formatDate(lastOrder.createdAt)}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <Package size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm font-medium">No tenés compras recientes</p>
          </div>
        )}
      </section>

      {/* --- ATAJOS PERSONALIZADOS --- */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4 px-2">Atajos personalizados</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <AtajoItem icon={<RotateCcw size={18} />} label="Devolver una compra" onClick={() => onNavigate?.("compras")} />
          <AtajoItem icon={<Tag size={18} />} label="Gestionar ventas, envíos y etiquetas" onClick={() => onNavigate?.("publicaciones")} />
          <AtajoItem icon={<Clock size={18} />} label="Cuándo llegan mis compras" onClick={() => onNavigate?.("compras")} />
          <AtajoItem icon={<MessageCircle size={18} />} label="Iniciar o seguir un reclamo" onClick={() => setView("tickets")} />
          <AtajoItem icon={<HelpCircle size={18} />} label="Explorá las preguntas frecuentes" onClick={() => setView("faq")} hasBorder={false} />
        </div>
      </section>

      {/* --- NECESITAS MAS AYUDA? --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-lg">¿Necesitás más ayuda?</h3>
        <button
          onClick={() => setView("new")}
          className="bg-blue-50 text-[#3483fa] px-6 py-3 rounded-md font-bold text-sm flex items-center gap-2 hover:bg-blue-100 transition-colors shadow-sm"
        >
          <MessageCircle size={20} />
          Contactanos
        </button>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTES ---

function AtajoItem({ icon, label, onClick, hasBorder = true }: { icon: React.ReactNode; label: string; onClick?: () => void; hasBorder?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors ${hasBorder ? "border-b border-gray-50" : ""}`}
    >
      <div className="flex items-center gap-4 text-gray-600">
        <div className="w-8 h-8 flex items-center justify-center">{icon}</div>
        <span className="text-[15px] font-medium text-gray-800">{label}</span>
      </div>
      <ChevronRight size={18} className="text-gray-300" />
    </div>
  );
}
