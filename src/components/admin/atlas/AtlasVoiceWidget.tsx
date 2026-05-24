"use client";

import { useCallback, useEffect, useState } from "react";
import { Mic, X, ChevronDown, ChevronUp, Radio } from "lucide-react";
import { useAtlasSpeech } from "@/lib/jarvis/use-atlas-speech";
import { parseVoiceTranscript, speakAtlas, type VoiceRoute } from "@/lib/jarvis/voice-intent";
import {
  getStoredDesktopSecret,
  probeDesktopAgent,
  sendDesktopVoiceCommand,
  storeDesktopSecret,
} from "@/lib/jarvis/voice-bridge";
import "@/styles/atlas-voice-widget.css";

type JarvisWidgetStatus = {
  enabled: boolean;
  voice?: { enabled: boolean; profile: "atlas" | "nova"; wakeWordEnabled?: boolean };
  desktop?: {
    connected: boolean;
    expectedPort: number;
    hostname: string | null;
  };
};

type AtlasVoiceWidgetProps = {
  /** floating = site-wide FAB; embedded = inline in Jarvis panel */
  variant?: "floating" | "embedded";
};

export function AtlasVoiceWidget({ variant = "floating" }: AtlasVoiceWidgetProps) {
  const [open, setOpen] = useState(variant === "embedded");
  const [status, setStatus] = useState<JarvisWidgetStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"ok" | "error" | "warn" | "">("");
  const [desktopSecret, setDesktopSecret] = useState("");
  const [localDesktopOk, setLocalDesktopOk] = useState<boolean | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/jarvis/status", { credentials: "include" });
      if (!res.ok) return;
      setStatus(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadStatus();
    const t = setInterval(() => void loadStatus(), 30_000);
    return () => clearInterval(t);
  }, [loadStatus]);

  useEffect(() => {
    setDesktopSecret(getStoredDesktopSecret());
  }, []);

  const requireWake = status?.voice?.wakeWordEnabled !== false;

  const runRoute = useCallback(
    async (route: VoiceRoute) => {
      if (route.kind === "error") {
        setMessage(route.message);
        setMessageKind("error");
        return;
      }

      setBusy(true);
      setMessage(`Ejecutando: ${route.label}…`);
      setMessageKind("");

      const webEnabled = status?.enabled === true;
      const desktopPort = status?.desktop?.expectedPort ?? 8787;
      const secret = desktopSecret.trim() || getStoredDesktopSecret();

      try {
        if (route.kind === "desktop" || (!webEnabled && route.kind === "web")) {
          const desktopText = route.kind === "desktop" ? route.text : route.label;
          const result = await sendDesktopVoiceCommand(desktopText, desktopPort, secret);
          if (result.ok && result.summary) {
            setMessage(result.summary);
            setMessageKind(result.status === "ok" ? "ok" : "warn");
            speakAtlas(result.summary, status?.voice?.profile ?? "atlas");
          } else {
            setMessage(
              result.error ??
                "Comando desktop no disponible. Abrí http://127.0.0.1:8787/voice en Chrome/Edge."
            );
            setMessageKind("error");
          }
          return;
        }

        const res = await fetch(route.path, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(route.body),
        });
        const json = (await res.json()) as {
          summary?: string;
          status?: string;
          voiceReportText?: string;
          error?: string;
        };

        if (res.status === 503) {
          const fallback = await sendDesktopVoiceCommand(route.label, desktopPort, secret);
          if (fallback.ok && fallback.summary) {
            setMessage(fallback.summary);
            setMessageKind("ok");
            speakAtlas(fallback.summary, status?.voice?.profile ?? "atlas");
            return;
          }
          setMessage(json.summary ?? "Orchestrator web apagado (JARVIS_ENABLED=false).");
          setMessageKind("warn");
          return;
        }

        if (!res.ok) {
          setMessage(json.error ?? json.summary ?? `Error ${res.status}`);
          setMessageKind("error");
          return;
        }

        const spoken = json.voiceReportText ?? json.summary ?? "Listo.";
        setMessage(spoken);
        setMessageKind(json.status === "ok" || res.ok ? "ok" : "warn");
        speakAtlas(spoken, status?.voice?.profile ?? "atlas");
        void loadStatus();
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Error de red");
        setMessageKind("error");
      } finally {
        setBusy(false);
      }
    },
    [desktopSecret, loadStatus, status?.desktop?.expectedPort, status?.enabled, status?.voice?.profile]
  );

  const handleTranscript = useCallback(
    (text: string) => {
      const parsed = parseVoiceTranscript(text, requireWake);
      void runRoute(parsed);
    },
    [requireWake, runRoute]
  );

  const speech = useAtlasSpeech({ onFinalTranscript: handleTranscript });

  const handlePttStart = async () => {
    if (busy) return;
    setMessage("");
    setMessageKind("");
    await speech.start();
  };

  const handlePttStop = () => {
    speech.stop();
  };

  const testLocalDesktop = async () => {
    storeDesktopSecret(desktopSecret);
    const port = status?.desktop?.expectedPort ?? 8787;
    const result = await probeDesktopAgent(port, desktopSecret.trim());
    setLocalDesktopOk(result.ok);
    if (result.ok) {
      setMessage(`Agente local OK${result.version ? ` · v${result.version}` : ""}`);
      setMessageKind("ok");
    } else {
      setMessage(result.error ?? "Sin agente local");
      setMessageKind("warn");
    }
  };

  const webOn = status?.enabled === true;
  const desktopLinked = status?.desktop?.connected === true;
  const desktopLocal = localDesktopOk === true;

  const rootClass =
    variant === "floating"
      ? "atlas-voice-widget atlas-voice-widget--floating"
      : "atlas-voice-widget atlas-voice-widget--embedded";

  if (variant === "floating" && !open) {
    return (
      <button
        type="button"
        className="atlas-voice-fab"
        onClick={() => setOpen(true)}
        aria-label="Abrir Atlas voz"
        title="Atlas — voz"
      >
        <Mic size={22} />
        <span
          className={`atlas-voice-fab-dot ${webOn || desktopLinked ? "on" : "off"}`}
          aria-hidden
        />
      </button>
    );
  }

  return (
    <div className={rootClass} data-open={open}>
      {variant === "floating" && (
        <button
          type="button"
          className="atlas-voice-close"
          onClick={() => setOpen(false)}
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      )}

      <div className="atlas-voice-header">
        <Radio size={16} className="atlas-voice-icon" />
        <div>
          <strong>Atlas Voz</strong>
          <span className="atlas-voice-sub">Decí «Atlas, …» · Chrome/Edge</span>
        </div>
      </div>

      <div className="atlas-voice-status-row">
        <span className={`atlas-voice-pill ${webOn ? "ok" : "warn"}`}>WEB {webOn ? "ON" : "OFF"}</span>
        <span className={`atlas-voice-pill ${desktopLinked ? "ok" : "off"}`}>
          DESKTOP {desktopLinked ? "LINK" : "OFF"}
        </span>
        {desktopLocal && <span className="atlas-voice-pill ok">LOCAL OK</span>}
      </div>

      {!speech.supported && <p className="atlas-voice-hint warn">{speech.supportHint}</p>}

      <button
        type="button"
        className={`atlas-voice-ptt ${speech.listening ? "listening" : ""}`}
        disabled={busy || !speech.supported}
        onMouseDown={(e) => {
          e.preventDefault();
          void handlePttStart();
        }}
        onMouseUp={handlePttStop}
        onMouseLeave={handlePttStop}
        onTouchStart={(e) => {
          e.preventDefault();
          void handlePttStart();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handlePttStop();
        }}
      >
        {speech.listening ? "Escuchando… soltá para enviar" : "Mantené para hablar"}
      </button>

      {(speech.interim || speech.error) && (
        <p className={`atlas-voice-hint ${speech.error ? "error" : ""}`}>
          {speech.error ?? speech.interim}
        </p>
      )}

      {message && <p className={`atlas-voice-response ${messageKind}`}>{message}</p>}

      <button type="button" className="atlas-voice-link-btn" onClick={() => setShowSecret((v) => !v)}>
        {showSecret ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Puente desktop local
      </button>

      {showSecret && (
        <div className="atlas-voice-secret-block">
          <label htmlFor="atlas-desktop-secret">Secreto (JARVIS_DESKTOP_SECRET)</label>
          <input
            id="atlas-desktop-secret"
            type="password"
            value={desktopSecret}
            onChange={(e) => setDesktopSecret(e.target.value)}
            onBlur={() => storeDesktopSecret(desktopSecret)}
            placeholder="mismo que .env del agente"
            autoComplete="off"
          />
          <button type="button" className="atlas-voice-mini-btn" onClick={() => void testLocalDesktop()}>
            Probar localhost:8787
          </button>
          <p className="atlas-voice-hint">
            Comandos locales (abrir Cursor, etc.) usan el agente en tu PC. En producción puede
            requerir Chrome y permiso de red local.
          </p>
        </div>
      )}
    </div>
  );
}
