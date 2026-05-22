"use client";

import {
  Bot,
  Clock,
  Loader2,
  MessageSquare,
  Power,
  PowerOff,
  QrCode,
  Sparkles,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { DEFAULT_BUSINESS_HOURS, type BusinessHoursConfig } from "@/lib/whatsapp-bot/business-hours";
import { WHATSAPP_INSTRUCTION_PRESETS } from "@/lib/whatsapp-bot/instruction-presets";
import { WaCard } from "./ui";
import {
  computeMetrics,
  STATUS_LABEL,
  type AiHealth,
  type BotConfig,
  type ConversationRow,
  type LeadRow,
  type SessionState,
} from "./types";

type Props = {
  session: SessionState | null;
  config: BotConfig | null;
  aiHealth: AiHealth | null;
  qrCode: string | null;
  qrLoading: boolean;
  connecting: boolean;
  savingConfig: boolean;
  connStatus: string;
  leads: LeadRow[];
  conversations: ConversationRow[];
  onConnect: () => void;
  onShowQr: () => void;
  onDisconnect: () => void;
  onPatchConfig: (p: Record<string, unknown>) => void;
  setConfig: Dispatch<SetStateAction<BotConfig | null>>;
};

function ToggleRow({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="wa-toggle-row">
      <div>
        <span className="wa-toggle-label">{label}</span>
        {hint ? <span className="wa-toggle-hint">{hint}</span> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`wa-switch ${checked ? "wa-switch--on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="wa-switch-thumb" />
      </button>
    </label>
  );
}

function motorLabel(ai: AiHealth | null): string {
  if (!ai) return "Verificando…";
  if (ai.primary === "gemini") return ai.geminiConfigured ? "Gemini (activo)" : "Gemini (sin API key)";
  if (ai.primary === "ollama") {
    return ai.ollamaOk
      ? `Ollama · ${ai.ollamaModel ?? "modelo local"}`
      : "Ollama (no disponible)";
  }
  return "Reglas (sin IA generativa)";
}

export default function WhatsappBotConfigView({
  session,
  config,
  aiHealth,
  qrCode,
  qrLoading,
  connecting,
  savingConfig,
  connStatus,
  leads,
  conversations,
  onConnect,
  onShowQr,
  onDisconnect,
  onPatchConfig,
  setConfig,
}: Props) {
  const bh = (config?.businessHours as BusinessHoursConfig | null) ?? DEFAULT_BUSINESS_HOURS;
  const { leadsToday, openChats, conversionPct } = computeMetrics(leads, conversations);

  return (
    <div className="wa-config">
      <header className="wa-inbox-header">
        <div>
          <h1 className="wa-page-title">Configuración</h1>
          <p className="wa-page-sub">Conexión Evolution, motor IA y comportamiento del bot</p>
        </div>
      </header>

      <div className="wa-metric-grid">
        <div className="wa-metric-card">
          <p className="wa-metric-label">Leads hoy</p>
          <p className="wa-metric-value">{leadsToday}</p>
          <p className="wa-metric-foot">Nuevos o con actividad hoy</p>
        </div>
        <div className="wa-metric-card">
          <p className="wa-metric-label">Chats abiertos</p>
          <p className="wa-metric-value">{openChats}</p>
          <p className="wa-metric-foot">Bot o humano activo</p>
        </div>
        <div className="wa-metric-card wa-metric-card--muted">
          <p className="wa-metric-label">Tiempo de respuesta</p>
          <p className="wa-metric-value">—</p>
          <p className="wa-metric-foot">Próximamente (mensajes salientes)</p>
        </div>
        <div className="wa-metric-card">
          <p className="wa-metric-label">Conversión</p>
          <p className="wa-metric-value">
            {conversionPct !== null ? `${conversionPct}%` : "—"}
          </p>
          <p className="wa-metric-foot">Leads en etapa Cliente / total</p>
        </div>
      </div>

      <div className="wa-config-grid">
        <WaCard className="space-y-4">
          <h2 className="wa-section-title">
            <Power className="h-4 w-4" />
            Conexión Evolution
          </h2>
          <div
            className={`wa-conn-status ${
              connStatus === "connected" ? "wa-conn-status--ok" : "wa-conn-status--pending"
            }`}
          >
            {STATUS_LABEL[connStatus] ?? connStatus}
            {session?.phoneNumber ? ` · ${session.phoneNumber}` : ""}
          </div>
          {session?.lastError ? <p className="text-sm text-red-300">{session.lastError}</p> : null}
          <p className="wa-honest-box">
            Las conversaciones aparecen cuando alguien escribe <strong>después</strong> de escanear el
            QR. No se importa el historial de WhatsApp Web (solo APIs oficiales Meta en Cloud API +
            coexistence, futuro).
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="wa-btn-primary"
              onClick={onConnect}
              disabled={connecting || connStatus === "connected"}
            >
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              Conectar
            </button>
            <button type="button" className="wa-btn-ghost" onClick={onShowQr} disabled={qrLoading}>
              {qrLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
              Ver QR
            </button>
            <button type="button" className="wa-btn-ghost text-red-300" onClick={onDisconnect}>
              <PowerOff className="h-4 w-4" /> Desconectar
            </button>
          </div>
          {qrCode && connStatus !== "connected" ? (
            <div className="p-4 wa-soft">
              {qrCode.startsWith("data:") || qrCode.startsWith("http") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrCode} alt="QR WhatsApp" className="max-w-[260px] mx-auto rounded-lg" />
              ) : (
                <pre className="text-xs overflow-auto max-h-48">{qrCode.slice(0, 1500)}</pre>
              )}
            </div>
          ) : null}
        </WaCard>

        <WaCard className="space-y-4">
          <h2 className="wa-section-title">
            <Sparkles className="h-4 w-4" />
            Motor IA
          </h2>
          <div className="wa-motor-badge">
            <Bot className="h-5 w-5 text-blue-300" />
            <div>
              <p className="font-bold text-white">{motorLabel(aiHealth)}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Env: {aiHealth?.providerEnv ?? "auto"} · Gemini{" "}
                {aiHealth?.geminiConfigured ? "✓" : "✗"} · Ollama{" "}
                {aiHealth?.ollamaOk ? "✓" : "✗"}
              </p>
            </div>
          </div>
          <p className="wa-honest-box text-xs">
            El motor se elige por servidor (<code className="text-blue-200">WHATSAPP_AI_PROVIDER</code>
            ). Sin Gemini ni Ollama, el bot usa reglas y plantillas.
          </p>

          <div className="wa-toggle-grid">
            <ToggleRow
              label="Bot automático"
              hint="Responde con IA cuando está conectado"
              checked={config?.enabled ?? false}
              disabled={savingConfig}
              onChange={(v) => onPatchConfig({ enabled: v })}
            />
            <ToggleRow
              label="Respuesta automática"
              checked={config?.autoReplyEnabled ?? true}
              disabled={savingConfig}
              onChange={(v) => onPatchConfig({ autoReplyEnabled: v })}
            />
            <ToggleRow
              label="Pase a humano"
              hint="Permite tomar control manual"
              checked={config?.humanHandoffEnabled ?? true}
              disabled={savingConfig}
              onChange={(v) => onPatchConfig({ humanHandoffEnabled: v })}
            />
            <ToggleRow
              label="Horario comercial"
              checked={config?.businessHoursEnabled ?? false}
              disabled={savingConfig}
              onChange={(v) => onPatchConfig({ businessHoursEnabled: v })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-slate-400 mb-1 block">Tono</span>
              <select
                className="wa-field"
                value={config?.tone ?? "cercano"}
                disabled={savingConfig}
                onChange={(e) => onPatchConfig({ tone: e.target.value })}
              >
                <option value="cercano">Cercano</option>
                <option value="profesional">Profesional</option>
                <option value="rapido">Rápido</option>
                <option value="experto">Experto</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-400 mb-1 block">Idioma</span>
              <select className="wa-field" defaultValue="es-AR" disabled title="Próximamente en API">
                <option value="es-AR">Español (Argentina)</option>
                <option value="es">Español neutro</option>
              </select>
              <span className="text-[10px] text-slate-500 mt-1 block">Solo UI · persistencia próxima</span>
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-slate-400 mb-1 block">
              Máx. mensajes automáticos antes de derivar
            </span>
            <input
              type="number"
              min={3}
              max={50}
              className="wa-field max-w-[120px]"
              value={config?.maxAutoMessagesBeforeHandoff ?? 12}
              disabled={savingConfig}
              onChange={(e) =>
                setConfig((c) =>
                  c ? { ...c, maxAutoMessagesBeforeHandoff: Number(e.target.value) } : c
                )
              }
              onBlur={(e) =>
                onPatchConfig({
                  maxAutoMessagesBeforeHandoff: Number(e.target.value) || 12,
                })
              }
            />
          </label>
        </WaCard>
      </div>

      <WaCard className="mt-4 space-y-4">
        <h2 className="wa-section-title">
          <MessageSquare className="h-4 w-4" />
          Instrucciones y horarios
        </h2>
        <div className="flex flex-wrap gap-2">
          {WHATSAPP_INSTRUCTION_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="wa-btn-ghost text-xs py-1"
              onClick={() => onPatchConfig({ customInstructions: p.text })}
            >
              {p.label}
            </button>
          ))}
        </div>
        <textarea
          className="wa-field min-h-[100px]"
          value={config?.customInstructions ?? ""}
          onChange={(e) =>
            setConfig((c) => (c ? { ...c, customInstructions: e.target.value } : c))
          }
          onBlur={(e) => onPatchConfig({ customInstructions: e.target.value })}
          placeholder="Instrucciones personalizadas para el bot…"
        />
        {config?.businessHoursEnabled ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Mensaje fuera de horario (lun–vie 9–18, sáb 9–13 por defecto)
            </p>
            <textarea
              className="wa-field min-h-[60px]"
              defaultValue={bh.offlineMessage ?? ""}
              onBlur={(e) =>
                onPatchConfig({ businessHours: { ...bh, offlineMessage: e.target.value } })
              }
              placeholder="Mensaje fuera de horario"
            />
          </div>
        ) : null}
      </WaCard>

      <WaCard className="mt-4 space-y-3">
        <h2 className="wa-section-title">Respuestas rápidas</h2>
        <p className="wa-honest-box text-sm">
          Plantillas para enviar desde el inbox: en desarrollo. Hoy podés escribir libremente en cada
          chat conectado.
        </p>
        <div className="flex flex-wrap gap-2 opacity-60 pointer-events-none">
          {["¡Hola! ¿En qué te ayudo?", "Te paso el link del producto", "Confirmamos envío en minutos"].map(
            (t) => (
              <span key={t} className="wa-quick-chip">
                {t}
              </span>
            )
          )}
        </div>
        <button type="button" className="wa-btn-ghost text-xs" disabled>
          + Agregar respuesta rápida
        </button>
      </WaCard>

      <WaCard className="mt-4 space-y-3">
        <h2 className="wa-section-title">Sincronización</h2>
        <p className="wa-honest-box">
          <strong>Evolution API:</strong> eventos en tiempo real vía webhook a Madsjeez. No hay sync
          retroactivo de chats.
        </p>
        <p className="wa-honest-box">
          <strong>Contactos / catálogo:</strong> no se importan desde WhatsApp; los leads se crean al
          primer mensaje entrante.
        </p>
        <p className="wa-honest-box">
          <strong>Meta Cloud API:</strong> canal alternativo (admin); coexistence e historial oficial
          requieren configuración aparte.
        </p>
      </WaCard>
    </div>
  );
}
