"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  MessageCircle,
  QrCode,
  Power,
  PowerOff,
  UserRound,
  Bot,
  RefreshCw,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_BUSINESS_HOURS, type BusinessHoursConfig } from "@/lib/whatsapp-bot/business-hours";

type SessionState = {
  id: string;
  status: string;
  phoneNumber: string | null;
  hasQr: boolean;
  lastConnectedAt: string | null;
  lastError: string | null;
};

type BotConfig = {
  enabled: boolean;
  tone: string;
  customInstructions: string | null;
  humanHandoffEnabled: boolean;
  autoReplyEnabled: boolean;
  maxAutoMessagesBeforeHandoff: number;
  businessHoursEnabled: boolean;
  businessHours: BusinessHoursConfig | null;
};

type ConversationRow = {
  id: string;
  phone: string;
  status: string;
  leadStatus: string;
  leadId?: string;
  lastMessageAt: string | null;
  lastMessage: { content: string; senderType: string } | null;
};

type MessageRow = {
  id: string;
  direction: string;
  senderType: string;
  content: string;
  createdAt: string;
};

type LeadRow = {
  id: string;
  phone: string;
  status: string;
  intent: string | null;
  lastMessageAt: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  disconnected: "Desconectado",
  qr_pending: "Esperando QR",
  connected: "Conectado",
  error: "Error",
};

const LEAD_LABEL: Record<string, string> = {
  new: "Nuevo",
  warm: "Tibio",
  hot: "Caliente",
  customer: "Cliente",
  closed: "Cerrado",
  lost: "Perdido",
};

const LEAD_STATUSES = ["new", "warm", "hot", "customer", "closed", "lost"] as const;

export default function WhatsappBotView() {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

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
      const [sessRes, convRes, leadsRes] = await Promise.all([
        fetch("/api/seller/whatsapp-bot/session"),
        fetch("/api/seller/whatsapp-bot/conversations"),
        fetch("/api/seller/whatsapp-bot/leads"),
      ]);
      if (sessRes.ok) {
        const data = await sessRes.json();
        setSession(data.session);
        setConfig(data.config);
        if (data.session?.status === "connected") {
          setQrCode(null);
        }
      }
      if (convRes.ok) {
        const data = await convRes.json();
        setConversations(data.conversations ?? []);
      }
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.leads ?? []);
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
    const st = session?.status;
    if (st !== "qr_pending") return;
    const poll = setInterval(() => {
      loadAll();
    }, 4000);
    return () => clearInterval(poll);
  }, [session?.status, loadAll]);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);
    const t = setInterval(() => loadMessages(selectedId), 5000);
    return () => clearInterval(t);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/seller/whatsapp-bot/session", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = typeof data.message === "string" ? data.message : data.error;
        toast.error(
          data.error === "evolution_not_configured"
            ? "Evolution API no configurada en el servidor"
            : detail && detail.length > 20
              ? detail.slice(0, 280)
              : "Error al conectar con Evolution. Revisá EVOLUTION_API_URL en Railway."
        );
        return;
      }
      toast.success("Sesión iniciada. Mostrá el QR para vincular WhatsApp.");
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
        toast.error("QR no disponible todavía");
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
      toast.success("WhatsApp desconectado");
      setQrCode(null);
      await loadAll();
    } else {
      toast.error("No se pudo desconectar");
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
        toast.success("Configuración guardada");
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
      toast.success("Tomaste el control de la conversación");
      await loadAll();
      if (selectedId === conversationId) loadMessages(conversationId);
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
          data.error === "whatsapp_not_connected"
            ? "WhatsApp no está conectado"
            : "No se pudo enviar"
        );
        return;
      }
      setReplyText("");
      await loadMessages(selectedId);
      await loadAll();
    } finally {
      setSending(false);
    }
  }

  async function updateLeadStatus(leadId: string, status: string) {
    const res = await fetch(`/api/seller/whatsapp-bot/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await loadAll();
      toast.success("Lead actualizado");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando Bot de WhatsApp…
      </div>
    );
  }

  const status = session?.status ?? "disconnected";
  const bh = (config?.businessHours as BusinessHoursConfig | null) ?? DEFAULT_BUSINESS_HOURS;

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-7 w-7 text-primary" />
          Bot de WhatsApp
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Conectá tu WhatsApp, respondé leads con IA basada en tu catálogo y tomá el control humano cuando quieras.
        </p>
      </div>

      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Estado de conexión</h2>
        <p className="text-sm">
          Estado:{" "}
          <span className="font-medium text-primary">{STATUS_LABEL[status] ?? status}</span>
          {session?.phoneNumber ? ` · ${session.phoneNumber}` : null}
        </p>
        {session?.lastError ? <p className="text-sm text-destructive">{session.lastError}</p> : null}
        {status === "connected" ? (
          <p className="text-sm text-muted-foreground rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2">
            WhatsApp vinculado. Las conversaciones aparecen cuando alguien te escribe por este número después de
            conectar (no se importan chats anteriores de WhatsApp). Activá &quot;Activar bot automático&quot; para
            respuestas con IA.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting || status === "connected"}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
            Conectar WhatsApp
          </button>
          <button
            type="button"
            onClick={handleShowQr}
            disabled={qrLoading}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
          >
            {qrLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
            Mostrar QR
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            className="inline-flex items-center gap-2 rounded-lg border border-destructive/40 px-4 py-2 text-sm text-destructive"
          >
            <PowerOff className="h-4 w-4" />
            Desconectar
          </button>
          <button type="button" onClick={loadAll} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        {qrCode && status !== "connected" ? (
          <div className="mt-4 p-4 border rounded-lg bg-muted/30">
            <p className="text-sm mb-2">Escaneá con WhatsApp → Dispositivos vinculados:</p>
            {qrCode.startsWith("data:") || qrCode.startsWith("http") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrCode} alt="QR WhatsApp" className="max-w-[280px] mx-auto" />
            ) : (
              <pre className="text-xs overflow-auto p-2 bg-background rounded">{qrCode.slice(0, 2000)}</pre>
            )}
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Configuración del bot</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config?.enabled ?? false}
              disabled={savingConfig}
              onChange={(e) => patchConfig({ enabled: e.target.checked })}
            />
            Activar bot automático
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config?.autoReplyEnabled ?? true}
              disabled={savingConfig}
              onChange={(e) => patchConfig({ autoReplyEnabled: e.target.checked })}
            />
            Respuesta automática
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config?.humanHandoffEnabled ?? true}
              disabled={savingConfig}
              onChange={(e) => patchConfig({ humanHandoffEnabled: e.target.checked })}
            />
            Derivar a humano si lo piden
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config?.businessHoursEnabled ?? false}
              disabled={savingConfig}
              onChange={(e) =>
                patchConfig({
                  businessHoursEnabled: e.target.checked,
                  businessHours: bh,
                })
              }
            />
            Horario comercial
          </label>
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Tono</label>
            <select
              className="mt-1 block w-full max-w-xs border rounded-lg px-3 py-2 text-sm bg-background"
              value={config?.tone ?? "cercano"}
              disabled={savingConfig}
              onChange={(e) => patchConfig({ tone: e.target.value })}
            >
              <option value="cercano">Cercano</option>
              <option value="profesional">Profesional</option>
              <option value="rapido">Rápido</option>
              <option value="experto">Experto</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Máx. mensajes bot antes de derivar</label>
            <input
              type="number"
              min={3}
              max={50}
              className="mt-1 block w-24 border rounded-lg px-3 py-2 text-sm bg-background"
              defaultValue={config?.maxAutoMessagesBeforeHandoff ?? 12}
              onBlur={(e) =>
                patchConfig({ maxAutoMessagesBeforeHandoff: Number(e.target.value) || 12 })
              }
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Instrucciones personalizadas</label>
          <textarea
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm min-h-[80px] bg-background"
            defaultValue={config?.customInstructions ?? ""}
            placeholder="Ej: Ofrecé retiro en depósito si preguntan por CABA."
            onBlur={(e) => {
              if (e.target.value !== (config?.customInstructions ?? "")) {
                patchConfig({ customInstructions: e.target.value });
              }
            }}
          />
        </div>
        {config?.businessHoursEnabled ? (
          <div>
            <label className="text-sm text-muted-foreground">Mensaje fuera de horario</label>
            <textarea
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm min-h-[60px] bg-background"
              defaultValue={bh.offlineMessage ?? ""}
              onBlur={(e) =>
                patchConfig({
                  businessHours: { ...bh, offlineMessage: e.target.value },
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Horario por defecto: lun–vie 9–18, sáb 9–13 (Argentina). Personalización avanzada vía API.
            </p>
          </div>
        ) : null}
      </section>

      <div className="grid lg:grid-cols-5 gap-4 min-h-[420px]">
        <section className="lg:col-span-2 rounded-xl border bg-card p-4 flex flex-col">
          <h2 className="font-semibold mb-3">Conversaciones</h2>
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay conversaciones.</p>
          ) : (
            <ul className="divide-y overflow-y-auto flex-1 -mx-2">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left px-2 py-3 hover:bg-muted/60 transition-colors ${
                      selectedId === c.id ? "bg-muted" : ""
                    }`}
                  >
                    <p className="font-medium text-sm">{c.phone}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {c.lastMessage?.content ?? "—"}
                    </p>
                    <p className="text-xs mt-1 flex items-center gap-1">
                      {c.status === "human_active" ? (
                        <span className="text-amber-600">
                          <UserRound className="h-3 w-3 inline" /> Humano
                        </span>
                      ) : (
                        <span className="text-primary">
                          <Bot className="h-3 w-3 inline" /> Bot
                        </span>
                      )}
                      <span className="text-muted-foreground">· {LEAD_LABEL[c.leadStatus] ?? c.leadStatus}</span>
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:col-span-3 rounded-xl border bg-card p-4 flex flex-col">
          {!selected ? (
            <p className="text-sm text-muted-foreground m-auto">Seleccioná una conversación para ver el chat.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-3">
                <div>
                  <p className="font-semibold">{selected.phone}</p>
                  <p className="text-xs text-muted-foreground">
                    {selected.status === "human_active" ? "Modo humano" : "Bot activo"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selected.status !== "human_active" ? (
                    <button
                      type="button"
                      className="text-xs border rounded px-2 py-1"
                      onClick={() => handoff(selected.id)}
                    >
                      Tomar control
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-xs border rounded px-2 py-1"
                      onClick={() => reactivate(selected.id)}
                    >
                      Reactivar bot
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 min-h-[240px] max-h-[360px] pr-1">
                {messagesLoading && messages.length === 0 ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto mt-8" />
                ) : (
                  messages.map((m) => {
                    const isOut = m.direction === "outbound";
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isOut ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                            isOut
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-[10px] opacity-70 mb-0.5">
                            {m.senderType === "customer"
                              ? "Cliente"
                              : m.senderType === "seller"
                                ? "Vos"
                                : "Bot"}
                          </p>
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="mt-3 flex gap-2 border-t pt-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
                  placeholder="Escribí tu respuesta…"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background"
                  disabled={sending || status !== "connected"}
                />
                <button
                  type="button"
                  onClick={sendReply}
                  disabled={sending || !replyText.trim() || status !== "connected"}
                  className="rounded-lg bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              {status !== "connected" ? (
                <p className="text-xs text-amber-600 mt-2">Conectá WhatsApp para enviar mensajes.</p>
              ) : null}
            </>
          )}
        </section>
      </div>

      <section className="rounded-xl border bg-card p-6 space-y-3">
        <h2 className="font-semibold">Leads</h2>
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin leads todavía.</p>
        ) : (
          <ul className="divide-y">
            {leads.map((l) => (
              <li key={l.id} className="py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <span className="font-medium">{l.phone}</span>
                  {l.intent ? (
                    <span className="text-xs text-muted-foreground block">{l.intent}</span>
                  ) : null}
                </div>
                <select
                  className="text-xs border rounded px-2 py-1 bg-background"
                  value={l.status}
                  onChange={(e) => updateLeadStatus(l.id, e.target.value)}
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {LEAD_LABEL[s]}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
