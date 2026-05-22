"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import WhatsappBotConfigView from "./WhatsappBotConfigView";
import WhatsappBotInboxView from "./WhatsappBotInboxView";
import WhatsappBotLayout from "./WhatsappBotLayout";
import {
  WhatsappBotAutomationsView,
  WhatsappBotCampanasView,
  WhatsappBotCatalogoView,
  WhatsappBotContactosView,
  WhatsappBotMetricasView,
  WhatsappBotResumenView,
} from "./WhatsappBotSections";
import type {
  AiHealth,
  BotConfig,
  ConversationRow,
  FilterTab,
  LeadRow,
  MessageRow,
  SessionState,
  WaNavId,
} from "./types";
import "./whatsapp-bot-pro.css";

export default function WhatsappBotProView() {
  const [activeNav, setActiveNav] = useState<WaNavId>("conversaciones");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionState | null>(null);
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [savingConfig, setSavingConfig] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [aiHealth, setAiHealth] = useState<AiHealth | null>(null);
  const [chatScrollTrigger, setChatScrollTrigger] = useState(0);
  const selectedIdRef = useRef(selectedId);

  selectedIdRef.current = selectedId;
  const connStatus = session?.status ?? "disconnected";

  const loadMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/seller/whatsapp-bot/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [sessRes, convRes, leadsRes, healthRes] = await Promise.all([
        fetch("/api/seller/whatsapp-bot/session"),
        fetch("/api/seller/whatsapp-bot/conversations"),
        fetch("/api/seller/whatsapp-bot/leads"),
        fetch("/api/seller/whatsapp-bot/health"),
      ]);
      if (sessRes.ok) {
        const data = await sessRes.json();
        setSession(data.session);
        setConfig(data.config);
        if (data.session?.status === "connected") setQrCode(null);
      }
      if (convRes.ok) {
        const data = await convRes.json();
        const list: ConversationRow[] = data.conversations ?? [];
        setConversations(list);
        const sid = selectedIdRef.current;
        if (!sid && list.length > 0) setSelectedId(list[0].id);
      }
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.leads ?? []);
      }
      if (healthRes.ok) {
        const h = await healthRes.json();
        setAiHealth(h.ai ?? null);
      }
    } catch {
      toast.error("No se pudo cargar el bot de WhatsApp");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (session?.status !== "qr_pending") return;
    const poll = setInterval(loadAll, 4000);
    return () => clearInterval(poll);
  }, [session?.status, loadAll]);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);
    const t = setInterval(() => loadMessages(selectedId), 5000);
    return () => clearInterval(t);
  }, [selectedId, loadMessages]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/seller/whatsapp-bot/session", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message?.slice(0, 200) ?? "Error al conectar con Evolution");
        return;
      }
      toast.success("Mostrá el QR para vincular WhatsApp");
      await loadAll();
      await handleShowQr();
    } finally {
      setConnecting(false);
    }
  }

  async function handleShowQr() {
    setQrLoading(true);
    try {
      const res = await fetch("/api/seller/whatsapp-bot/session/qr");
      const data = await res.json();
      if (!res.ok) {
        toast.error("QR no disponible");
        return;
      }
      setQrCode(data.qrCode ?? null);
      if (data.status === "connected") {
        toast.success("WhatsApp conectado");
        setQrCode(null);
      }
      await loadAll();
    } finally {
      setQrLoading(false);
    }
  }

  async function handleDisconnect() {
    const res = await fetch("/api/seller/whatsapp-bot/session", { method: "DELETE" });
    if (res.ok) {
      toast.success("Desconectado");
      setQrCode(null);
      await loadAll();
    }
  }

  async function patchConfig(partial: Record<string, unknown>) {
    setSavingConfig(true);
    try {
      const res = await fetch("/api/seller/whatsapp-bot/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        toast.success("Guardado");
      }
    } finally {
      setSavingConfig(false);
    }
  }

  async function handoff(conversationId: string) {
    const res = await fetch(`/api/seller/whatsapp-bot/conversations/${conversationId}/handoff`, {
      method: "POST",
    });
    if (res.ok) {
      toast.success("Modo humano activado");
      await loadAll();
      loadMessages(conversationId);
    }
  }

  async function reactivate(conversationId: string) {
    const res = await fetch(`/api/seller/whatsapp-bot/conversations/${conversationId}/reactivate`, {
      method: "POST",
    });
    if (res.ok) {
      toast.success("Bot reactivado");
      await loadAll();
    }
  }

  async function sendReply() {
    if (!selectedId || !replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/seller/whatsapp-bot/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          typeof data.message === "string"
            ? data.message.slice(0, 220)
            : data.error === "whatsapp_not_connected"
              ? "WhatsApp no conectado. Vinculá Evolution en Configuración."
              : "No se pudo enviar el mensaje"
        );
        return;
      }
      setReplyText("");
      await loadMessages(selectedId);
      await loadAll();
      setChatScrollTrigger((n) => n + 1);
    } finally {
      setSending(false);
    }
  }

  async function patchLead(leadId: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/seller/whatsapp-bot/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      await loadAll();
      toast.success("Contacto actualizado");
    }
  }

  async function updateLeadStatus(leadId: string, status: string) {
    await patchLead(leadId, { status });
  }

  function openConversationByPhone(phone: string) {
    const digits = phone.replace(/\D/g, "");
    const conv = conversations.find(
      (c) => c.phone.replace(/\D/g, "") === digits || c.phone.includes(digits)
    );
    setActiveNav("conversaciones");
    if (conv) setSelectedId(conv.id);
    else toast.info("Sin conversación activa para este teléfono todavía");
  }

  if (loading) {
    return (
      <div className="whatsapp-bot-pro flex w-full max-w-none min-h-screen items-center justify-center gap-2 py-20 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando CRM de WhatsApp…
      </div>
    );
  }

  return (
    <div className="whatsapp-bot-pro w-full max-w-none overflow-x-hidden min-h-screen">
      <WhatsappBotLayout
        activeNav={activeNav}
        conversationCount={conversations.length}
        onNavigate={setActiveNav}
      >
        {activeNav === "resumen" ? (
          <WhatsappBotResumenView onOpenConversation={openConversationByPhone} />
        ) : activeNav === "contactos" ? (
          <WhatsappBotContactosView onOpenConversation={openConversationByPhone} />
        ) : activeNav === "automatizaciones" ? (
          <WhatsappBotAutomationsView />
        ) : activeNav === "catalogo" ? (
          <WhatsappBotCatalogoView />
        ) : activeNav === "campanas" ? (
          <WhatsappBotCampanasView />
        ) : activeNav === "metricas" ? (
          <WhatsappBotMetricasView />
        ) : activeNav === "configuracion" ? (
          <WhatsappBotConfigView
            session={session}
            config={config}
            aiHealth={aiHealth}
            qrCode={qrCode}
            qrLoading={qrLoading}
            connecting={connecting}
            savingConfig={savingConfig}
            connStatus={connStatus}
            leads={leads}
            conversations={conversations}
            onConnect={handleConnect}
            onShowQr={handleShowQr}
            onDisconnect={handleDisconnect}
            onPatchConfig={patchConfig}
            setConfig={setConfig}
          />
        ) : (
          <WhatsappBotInboxView
            session={session}
            conversations={conversations}
            leads={leads}
            search={search}
            filter={filter}
            selectedId={selectedId}
            messages={messages}
            messagesLoading={messagesLoading}
            replyText={replyText}
            sending={sending}
            connStatus={connStatus}
            onSearchChange={setSearch}
            onFilterChange={setFilter}
            onSelectConversation={setSelectedId}
            onReplyChange={setReplyText}
            onSendReply={sendReply}
            onHandoff={handoff}
            onReactivate={reactivate}
            onUpdateLeadStatus={updateLeadStatus}
            onPatchLead={patchLead}
            onRefresh={loadAll}
            chatScrollTrigger={chatScrollTrigger}
          />
        )}
      </WhatsappBotLayout>
    </div>
  );
}
