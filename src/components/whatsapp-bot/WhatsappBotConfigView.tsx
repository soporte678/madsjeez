"use client";



import {

  Bot,

  Clock,

  MessageSquare,

  Power,

  PowerOff,

  QrCode,

  Sparkles,

  Stethoscope,

} from "lucide-react";

import { useState, type Dispatch, SetStateAction } from "react";

import { toast } from "sonner";

import { DEFAULT_BUSINESS_HOURS, type BusinessHoursConfig } from "@/lib/whatsapp-bot/business-hours";

import { WHATSAPP_INSTRUCTION_PRESETS } from "@/lib/whatsapp-bot/instruction-presets";

import {

  WaButton,

  WaCard,

  WaCardHeader,

  WaConfigTabs,

  WaErrorBanner,

  WaModal,

  type WaConfigTabId,

} from "./ui";

import WhatsappBotSyncPanel from "./WhatsappBotSyncPanel";

import { waCatch, waSuccess } from "./WaShared";

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



const CONFIG_TABS = [

  { id: "conexion" as const, label: "Conexión" },

  { id: "ia" as const, label: "Motor IA" },

  { id: "bot" as const, label: "Bot" },

  { id: "sync" as const, label: "Sync" },

  { id: "reglas" as const, label: "Reglas" },

  { id: "diag" as const, label: "Diag" },

];



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

  const [testingAi, setTestingAi] = useState(false);

  const [testingOllama, setTestingOllama] = useState(false);

  const [ollamaResult, setOllamaResult] = useState<string | null>(null);

  const [testingEvolution, setTestingEvolution] = useState(false);

  const [tab, setTab] = useState<WaConfigTabId>("conexion");

  const [showQrModal, setShowQrModal] = useState(false);

  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const bh = (config?.businessHours as BusinessHoursConfig | null) ?? DEFAULT_BUSINESS_HOURS;

  const { leadsToday, openChats, conversionPct } = computeMetrics(leads, conversations);



  async function testEvolution() {

    setTestingEvolution(true);

    try {

      const res = await fetch("/api/seller/whatsapp-bot/health");

      const data = await res.json();

      if (!res.ok) throw new Error(data.message ?? "No pudimos verificar Evolution");

      if (data.evolution?.ok) {

        waSuccess("Evolution responde bien. Todo listo para conectar.");

      } else {

        toast.error(

          data.evolution?.error?.slice(0, 180) ??

            "Evolution no está configurada. Revisá EVOLUTION_API_URL y EVOLUTION_API_KEY."

        );

      }

    } catch (e) {

      waCatch(e, "No pudimos verificar Evolution. Revisá la conexión del servidor.");

    } finally {

      setTestingEvolution(false);

    }

  }



  async function testAi() {

    setTestingAi(true);

    try {

      const res = await fetch("/api/seller/whatsapp-bot/health/test-ai", { method: "POST" });

      const data = await res.json();

      if (!res.ok) {

        toast.error(data.message?.slice(0, 200) ?? "La prueba de IA falló");

        return;

      }

      waSuccess(`IA OK (${data.provider}): ${String(data.reply ?? "").slice(0, 80)}…`);

    } catch (e) {

      waCatch(e, "Error al probar la IA");

    } finally {

      setTestingAi(false);

    }

  }



  async function testOllama() {

    setTestingOllama(true);

    setOllamaResult(null);

    try {

      const res = await fetch("/api/seller/whatsapp-bot/health/test-ollama", { method: "POST" });

      const data = await res.json();

      if (!data.ok) {

        const msg = data.message ?? data.error ?? "Ollama no está disponible";

        setOllamaResult(msg);

        toast.error(String(msg).slice(0, 200));

        return;

      }

      setOllamaResult(`Modelo: ${data.configuredModel}\n${data.reply ?? ""}`);

      waSuccess("Ollama respondió correctamente");

    } catch (e) {

      waCatch(e, "Error al probar Ollama");

    } finally {

      setTestingOllama(false);

    }

  }



  function handleShowQr() {

    onShowQr();

    setShowQrModal(true);

  }



  function handleDisconnect() {

    setConfirmDisconnect(false);

    onDisconnect();

    waSuccess("WhatsApp desconectado");

  }



  return (

    <div className="wa-page wa-config w-full max-w-none">

      <header className="wa-inbox-header">

        <div>

          <h1 className="wa-page-title">Configuración</h1>

          <p className="wa-page-sub">Conexión Evolution, motor IA y comportamiento del bot</p>

        </div>

      </header>



      <WaConfigTabs active={tab} onChange={setTab} tabs={CONFIG_TABS} />



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



      {tab === "conexion" ? (

        <div className="wa-config-panel">

          <WaCard className="space-y-4">

            <WaCardHeader

              title="Conexión Evolution"

              subtitle="Vinculá tu número para recibir y enviar mensajes en vivo"

              icon={<Power className="h-4 w-4 text-blue-300" />}

            />

            <div

              className={`wa-conn-status ${

                connStatus === "connected" ? "wa-conn-status--ok" : "wa-conn-status--pending"

              }`}

            >

              {STATUS_LABEL[connStatus] ?? connStatus}

              {session?.phoneNumber ? ` · ${session.phoneNumber}` : ""}

            </div>

            {session?.lastError ? (

              <WaErrorBanner message={session.lastError} />

            ) : null}

            <p className="wa-honest-box">

              Las conversaciones aparecen cuando alguien escribe <strong>después</strong> de escanear el

              QR. No importamos el historial de WhatsApp Web (solo APIs oficiales Meta en Cloud API +

              coexistence, a futuro).

            </p>

            <div className="flex flex-wrap gap-2">

              <WaButton

                onClick={onConnect}

                disabled={connecting || connStatus === "connected"}

                loading={connecting}

              >

                <Power className="h-4 w-4" /> Conectar

              </WaButton>

              <WaButton variant="ghost" onClick={handleShowQr} loading={qrLoading}>

                <QrCode className="h-4 w-4" /> Ver QR

              </WaButton>

              <WaButton variant="danger" onClick={() => setConfirmDisconnect(true)}>

                <PowerOff className="h-4 w-4" /> Desconectar

              </WaButton>

              <WaButton variant="ghost" loading={testingEvolution} onClick={testEvolution}>

                Probar Evolution

              </WaButton>

            </div>

          </WaCard>

        </div>

      ) : null}



      {tab === "ia" ? (

        <div className="wa-config-panel">

          <WaCard className="space-y-4">

            <WaCardHeader

              title="Motor IA"

              subtitle="Proveedor activo y pruebas de respuesta"

              icon={<Sparkles className="h-4 w-4 text-blue-300" />}

            />

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

              El motor se elige en el servidor (<code className="text-blue-200">WHATSAPP_AI_PROVIDER</code>

              ). Sin Gemini ni Ollama, el bot usa reglas y plantillas.

            </p>

            <div className="flex flex-wrap gap-2">

              <WaButton variant="ghost" loading={testingAi} onClick={testAi}>

                Probar respuesta IA

              </WaButton>

              <WaButton variant="ghost" loading={testingOllama} onClick={testOllama}>

                Probar Ollama

              </WaButton>

            </div>

            {ollamaResult ? (

              <p className="wa-soft p-3 text-xs text-slate-300 whitespace-pre-wrap">{ollamaResult}</p>

            ) : null}

            <p className="text-xs text-slate-500">

              Modelo activo (env): {aiHealth?.ollamaModel ?? "—"} · Proveedor:{" "}

              {aiHealth?.providerEnv ?? "auto"}

            </p>

          </WaCard>

        </div>

      ) : null}



      {tab === "bot" ? (

        <div className="wa-config-panel">

          <WaCard className="space-y-4">

            <WaCardHeader

              title="Comportamiento del bot"

              subtitle="Toggles, tono e idioma de respuesta"

              icon={<Bot className="h-4 w-4 text-blue-300" />}

            />

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

                hint="Permite tomar control manual desde el inbox"

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

        </div>

      ) : null}



      {tab === "reglas" ? (

        <div className="wa-config-panel space-y-4">

          <WaCard className="space-y-4">

            <WaCardHeader

              title="Instrucciones y horarios"

              subtitle="Personalizá cómo responde el bot a tus clientes"

              icon={<MessageSquare className="h-4 w-4 text-blue-300" />}

            />

            <div className="flex flex-wrap gap-2">

              {WHATSAPP_INSTRUCTION_PRESETS.map((p) => (

                <WaButton

                  key={p.id}

                  variant="ghost"

                  className="text-xs py-1"

                  onClick={() => {

                    onPatchConfig({ customInstructions: p.text });

                    waSuccess(`Plantilla "${p.label}" aplicada`);

                  }}

                >

                  {p.label}

                </WaButton>

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

          </WaCard>

          <WaCard className="space-y-3">

            <WaCardHeader title="Respuestas rápidas" subtitle="Próximamente desde el inbox" />

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

            <WaButton variant="ghost" className="text-xs" disabled>

              + Agregar respuesta rápida

            </WaButton>

          </WaCard>

        </div>

      ) : null}



      {tab === "sync" ? (

        <div className="wa-config-panel space-y-4">

          <WaCard className="space-y-3">

            <WaCardHeader

              title="Grupos de WhatsApp"

              subtitle="El bot ignora grupos salvo que lo habilites explícitamente"

            />

            <ToggleRow

              label="Permitir grupos"

              hint="Webhook y respuestas automáticas en chats grupales"

              checked={config?.allowWhatsAppGroups ?? false}

              disabled={savingConfig}

              onChange={(v) => onPatchConfig({ allowWhatsAppGroups: v })}

            />

          </WaCard>

          <WhatsappBotSyncPanel />

        </div>

      ) : null}



      {tab === "diag" ? (

        <div className="wa-config-panel">

          <WaCard className="space-y-4">

            <WaCardHeader

              title="Diagnóstico"

              subtitle="Estado técnico de conexión e IA"

              icon={<Stethoscope className="h-4 w-4 text-blue-300" />}

            />

            <div className="wa-soft p-4 text-sm text-slate-300 space-y-2">

              <p>

                <span className="text-slate-500">Evolution:</span>{" "}

                <span className={connStatus === "connected" ? "text-green-400" : "text-amber-400"}>

                  {STATUS_LABEL[connStatus] ?? connStatus}

                </span>

              </p>

              <p>

                <span className="text-slate-500">Motor IA:</span>{" "}

                <span className="text-blue-300">{aiHealth?.primary ?? "—"}</span>

              </p>

              <p>

                <span className="text-slate-500">Ollama:</span>{" "}

                {aiHealth?.ollamaOk ? "Disponible" : "No disponible"}

              </p>

              <p>

                <span className="text-slate-500">Gemini:</span>{" "}

                {aiHealth?.geminiConfigured ? "Configurado" : "Sin API key"}

              </p>

            </div>

            <div className="flex flex-wrap gap-2">

              <WaButton variant="ghost" loading={testingEvolution} onClick={testEvolution}>

                Probar Evolution

              </WaButton>

              <WaButton variant="ghost" loading={testingAi} onClick={testAi}>

                Probar IA

              </WaButton>

            </div>

          </WaCard>

        </div>

      ) : null}



      <WaModal

        open={showQrModal && !!qrCode && connStatus !== "connected"}

        onClose={() => setShowQrModal(false)}

        title="Escaneá el QR de WhatsApp"

        size="sm"

        footer={

          <WaButton variant="ghost" onClick={() => setShowQrModal(false)}>

            Cerrar

          </WaButton>

        }

      >

        {qrCode?.startsWith("data:") || qrCode?.startsWith("http") ? (

          // eslint-disable-next-line @next/next/no-img-element

          <img src={qrCode!} alt="QR WhatsApp" className="max-w-[260px] mx-auto rounded-lg" />

        ) : (

          <p className="text-xs text-slate-400 break-all">{qrCode?.slice(0, 500)}</p>

        )}

        <p className="mt-3 text-xs text-slate-500 text-center">

          Abrí WhatsApp en tu celular → Dispositivos vinculados → Vincular dispositivo.

        </p>

      </WaModal>



      <WaModal

        open={confirmDisconnect}

        onClose={() => setConfirmDisconnect(false)}

        title="¿Desconectar WhatsApp?"

        footer={

          <>

            <WaButton variant="ghost" onClick={() => setConfirmDisconnect(false)}>

              Cancelar

            </WaButton>

            <WaButton variant="danger" onClick={handleDisconnect}>

              Sí, desconectar

            </WaButton>

          </>

        }

      >

        <p>

          Vas a cortar la sesión de Evolution. No vas a recibir ni enviar mensajes hasta que vuelvas a

          escanear el QR.

        </p>

      </WaModal>

    </div>

  );

}


