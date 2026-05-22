"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  MessageCircle,
  QrCode,
  Power,
  PowerOff,
  UserRound,
  Bot,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

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
};

type ConversationRow = {
  id: string;
  phone: string;
  status: string;
  leadStatus: string;
  lastMessageAt: string | null;
  lastMessage: { content: string; senderType: string } | null;
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

  const loadAll = useCallback(async () => {
    setLoading(true);
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

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/seller/whatsapp-bot/session", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error === "evolution_not_configured" ? "Evolution API no configurada en el servidor" : "Error al conectar");
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

  async function patchConfig(partial: Partial<BotConfig>) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando Bot de WhatsApp…
      </div>
    );
  }

  const status = session?.status ?? "disconnected";

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-7 w-7 text-primary" />
          Bot de WhatsApp
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Conectá tu WhatsApp con QR y dejá que el asistente responda leads usando solo tu catálogo real en Madsjeez.
        </p>
      </div>

      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Estado de conexión</h2>
        <p className="text-sm">
          Estado:{" "}
          <span className="font-medium text-primary">{STATUS_LABEL[status] ?? status}</span>
          {session?.phoneNumber ? ` · ${session.phoneNumber}` : null}
        </p>
        {session?.lastError ? (
          <p className="text-sm text-destructive">{session.lastError}</p>
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

        {qrCode ? (
          <div className="mt-4 p-4 border rounded-lg bg-muted/30">
            <p className="text-sm mb-2">Escaneá este código con WhatsApp → Dispositivos vinculados:</p>
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config?.enabled ?? false}
            disabled={savingConfig}
            onChange={(e) => patchConfig({ enabled: e.target.checked })}
          />
          Activar bot automático
        </label>
        <div>
          <label className="text-sm text-muted-foreground">Tono</label>
          <select
            className="mt-1 w-full max-w-xs border rounded-lg px-3 py-2 text-sm bg-background"
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
          <label className="text-sm text-muted-foreground">Instrucciones personalizadas</label>
          <textarea
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm min-h-[80px] bg-background"
            defaultValue={config?.customInstructions ?? ""}
            placeholder="Ej: Siempre ofrecé retiro en depósito si preguntan por CABA."
            onBlur={(e) => {
              if (e.target.value !== (config?.customInstructions ?? "")) {
                patchConfig({ customInstructions: e.target.value });
              }
            }}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config?.humanHandoffEnabled ?? true}
            disabled={savingConfig}
            onChange={(e) => patchConfig({ humanHandoffEnabled: e.target.checked })}
          />
          Derivar a humano cuando el cliente lo pida
        </label>
      </section>

      <section className="rounded-xl border bg-card p-6 space-y-3">
        <h2 className="font-semibold">Conversaciones</h2>
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay conversaciones.</p>
        ) : (
          <ul className="divide-y">
            {conversations.map((c) => (
              <li key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{c.phone}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {c.lastMessage?.content ?? "—"}
                  </p>
                  <p className="text-xs mt-1">
                    {c.status === "human_active" ? (
                      <span className="text-amber-600 flex items-center gap-1">
                        <UserRound className="h-3 w-3" /> Humano
                      </span>
                    ) : (
                      <span className="text-primary flex items-center gap-1">
                        <Bot className="h-3 w-3" /> Bot activo
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {c.status !== "human_active" ? (
                    <button
                      type="button"
                      className="text-xs border rounded px-2 py-1"
                      onClick={() => handoff(c.id)}
                    >
                      Tomar control
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-xs border rounded px-2 py-1"
                      onClick={() => reactivate(c.id)}
                    >
                      Reactivar bot
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border bg-card p-6 space-y-3">
        <h2 className="font-semibold">Leads</h2>
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin leads todavía.</p>
        ) : (
          <ul className="divide-y">
            {leads.map((l) => (
              <li key={l.id} className="py-2 flex justify-between text-sm">
                <span>{l.phone}</span>
                <span className="text-muted-foreground">{LEAD_LABEL[l.status] ?? l.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
