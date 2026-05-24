"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AtlasStatusRing } from "@/components/admin/atlas/AtlasStatusRing";

const AtlasHudScene = dynamic(
  () => import("@/components/admin/atlas/AtlasHudScene").then((m) => m.AtlasHudScene),
  { ssr: false, loading: () => null }
);

const AtlasVoiceWidget = dynamic(
  () => import("@/components/admin/atlas/AtlasVoiceWidget").then((m) => m.AtlasVoiceWidget),
  { ssr: false, loading: () => null }
);

type JarvisPanelData = {
  status?: string;
  enabled?: boolean;
  readOnly?: boolean;
  activateHint?: string | null;
  models?: { fast: string; normal: string; smart: string };
  voice?: { enabled: boolean; profile: string };
  desktop?: {
    connected: boolean;
    lastHeartbeatAt: string | null;
    hostname: string | null;
    expectedPort: number;
  };
  health?: {
    backend: { ok: boolean };
    ollama: { ok: boolean };
    n8n: { configured: boolean };
    database: { ok: boolean };
  } | null;
  recentTasks?: Array<{ agent?: string; path?: string; objective?: string }>;
  openFindings?: Array<{ title: string; severity: string }>;
};

function nodeState(ok: boolean | undefined, enabled: boolean, isDesktop?: boolean): "ok" | "off" | "warn" | "na" {
  if (isDesktop) return ok ? "ok" : "off";
  if (!enabled && !isDesktop) return "warn";
  if (ok === undefined) return "na";
  return ok ? "ok" : "off";
}

export function AtlasJarvisPanel() {
  const [data, setData] = useState<JarvisPanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [lastAction, setLastAction] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jarvis/status", { credentials: "include" });
      if (!res.ok) throw new Error("status failed");
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 45_000);
    return () => clearInterval(t);
  }, [load]);

  const run = async (path: string, body?: Record<string, unknown>) => {
    setBusy(true);
    setLastAction("");
    try {
      const res = await fetch(path, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const json = await res.json();
      setLastAction(json.summary ?? (res.status === 503 ? "Orchestrator web apagado." : JSON.stringify(json).slice(0, 400)));
      await load();
    } catch (e) {
      setLastAction(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="atlas-hud-root">
        <div className="atlas-hud-scanline" />
        <div className="atlas-hud-loading">
          <div className="atlas-hud-loading-ring" />
          <span className="atlas-hud-subtitle">Inicializando Atlas…</span>
        </div>
      </div>
    );
  }

  const enabled = data?.enabled === true;
  const h = data?.health;

  return (
    <div className="atlas-hud-root">
      <div className="atlas-hud-scanline" aria-hidden />
      <AtlasHudScene />

      <div className="atlas-hud-inner">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="atlas-hud-title">Atlas Orchestrator</h1>
            <p className="atlas-hud-subtitle">MadsJeez · Voz Atlas / Nova · Multi-Agente</p>
          </div>
          <button type="button" className="atlas-hud-refresh" onClick={() => void load()} disabled={busy}>
            {busy ? "SYNC…" : "↻ SYNC"}
          </button>
        </header>

        {!enabled && (
          <section className="atlas-hud-panel atlas-hud-alert">
            <p className="atlas-hud-alert-title">◈ MODO SEGURO — WEB OFFLINE</p>
            <p className="text-sm mt-2 opacity-80">
              {data?.activateHint ?? "JARVIS_ENABLED=false en Railway. Desktop local sigue disponible."}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="atlas-hud-pill">READ_ONLY</span>
              <span className="atlas-hud-pill">NO DEPLOY</span>
              <span className="atlas-hud-pill">BOT AISLADO</span>
            </div>
          </section>
        )}

        <section className="atlas-hud-panel">
          <p className="atlas-hud-panel-title">◈ Estado de sistemas</p>
          <div className="atlas-status-grid">
            <AtlasStatusRing label="WEB" value={enabled ? "ONLINE" : "STBY"} state={enabled ? "ok" : "warn"} />
            <AtlasStatusRing
              label="DESKTOP"
              value={data?.desktop?.connected ? "LINK" : "OFF"}
              state={nodeState(data?.desktop?.connected, enabled, true)}
            />
            <AtlasStatusRing
              label="OLLAMA"
              value={h?.ollama?.ok ? "OK" : enabled ? "FAIL" : "—"}
              state={nodeState(h?.ollama?.ok, enabled)}
            />
            <AtlasStatusRing
              label="N8N"
              value={h?.n8n?.configured ? "OK" : enabled ? "OFF" : "—"}
              state={nodeState(h?.n8n?.configured, enabled)}
            />
            <AtlasStatusRing
              label="DATABASE"
              value={h?.database?.ok ? "OK" : enabled ? "FAIL" : "—"}
              state={nodeState(h?.database?.ok, enabled)}
            />
          </div>
          {data?.desktop && (
            <p className="text-xs mt-3 opacity-60">
              Desktop · puerto {data.desktop.expectedPort}
              {data.desktop.hostname ? ` · ${data.desktop.hostname}` : ""}
              {data.desktop.lastHeartbeatAt
                ? ` · ping ${new Date(data.desktop.lastHeartbeatAt).toLocaleTimeString()}`
                : ""}
            </p>
          )}
          {enabled && data?.models && (
            <p className="text-xs mt-1 opacity-50 font-mono">
              {data.models.fast} · {data.models.normal} · {data.models.smart}
            </p>
          )}
        </section>

        <section className="atlas-hud-panel">
          <p className="atlas-hud-panel-title">◈ Comandos</p>
          <div className="atlas-hud-actions">
            <button
              type="button"
              className="atlas-hud-btn"
              disabled={busy || !enabled}
              onClick={() => void run("/api/jarvis/command", { command: "health", scope: "all", detail: "short" })}
            >
              Health Scan
            </button>
            <button
              type="button"
              className="atlas-hud-btn primary"
              disabled={busy || !enabled}
              onClick={() => void run("/api/jarvis/orchestrate", { scope: "all", agentTarget: "auto" })}
            >
              Orquestar
            </button>
            <button
              type="button"
              className="atlas-hud-btn"
              disabled={busy || !enabled}
              onClick={() =>
                void run("/api/jarvis/command", {
                  command: "create-agent-task",
                  scope: "whatsapp",
                  agentTarget: "auto",
                })
              }
            >
              Agent Tasks
            </button>
            <button
              type="button"
              className="atlas-hud-btn"
              disabled={busy || !enabled}
              onClick={() => void run("/api/jarvis/report", { type: "daily_marketplace_report" })}
            >
              Reporte
            </button>
            <button
              type="button"
              className="atlas-hud-btn"
              disabled={busy || !enabled || !data?.voice?.enabled}
              onClick={() => void run("/api/jarvis/voice-report", { scope: "all" })}
            >
              Voz
            </button>
          </div>
          {lastAction && (
            <p className="text-sm mt-4 pt-3 border-t border-cyan-500/20 opacity-80 font-mono">{lastAction}</p>
          )}
        </section>

        <div className="grid md:grid-cols-2 gap-4">
          <section className="atlas-hud-panel">
            <p className="atlas-hud-panel-title">◈ Tareas agente</p>
            <div className="atlas-hud-log">
              {(data?.recentTasks ?? []).length === 0 && (
                <p className="opacity-50 text-sm">Sin tareas registradas.</p>
              )}
              {(data?.recentTasks ?? []).map((t, i) => (
                <div key={i} className="atlas-hud-log-item">
                  <span className="text-cyan-400 text-xs uppercase">{t.agent}</span>
                  <p className="text-sm mt-1">{t.objective}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="atlas-hud-panel">
            <p className="atlas-hud-panel-title">◈ Hallazgos</p>
            <div className="atlas-hud-log">
              {(data?.openFindings ?? []).map((f, i) => (
                <div key={i} className="atlas-hud-log-item">
                  <span className="text-amber-400 text-xs">[{f.severity}]</span> {f.title}
                </div>
              ))}
              {(data?.openFindings ?? []).length === 0 && (
                <p className="opacity-50 text-sm">Sin hallazgos abiertos.</p>
              )}
            </div>
          </section>
        </div>

        <section className="atlas-hud-panel">
          <p className="atlas-hud-panel-title">◈ Voz Atlas (widget)</p>
          <p className="text-xs opacity-60 mb-2">
            Push-to-talk en Chrome/Edge. También hay un botón flotante (mic) en todo el admin.
          </p>
          <AtlasVoiceWidget variant="embedded" />
        </section>

        <section className="atlas-hud-panel">
          <p className="atlas-hud-panel-title">◈ Desktop Agent — Windows</p>
          <code className="atlas-hud-terminal block">
            cd apps\jarvis-desktop-agent{"\n"}
            npm install{"\n"}
            copy .env.example .env{"\n"}
            npm run dev
          </code>
          <p className="text-xs mt-2 opacity-50">
            curl -H &quot;x-jarvis-secret: TU_SECRETO&quot; http://127.0.0.1:8787/health
          </p>
        </section>

        <Link href="/admin" className="atlas-hud-footer-link">
          ← Volver al panel admin
        </Link>
      </div>
    </div>
  );
}
