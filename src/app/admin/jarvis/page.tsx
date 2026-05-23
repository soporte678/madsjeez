"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Cpu,
  Loader2,
  Mic,
  Monitor,
  Play,
  RefreshCw,
  Shield,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type JarvisPanelData = {
  status?: string;
  enabled?: boolean;
  readOnly?: boolean;
  activateHint?: string | null;
  flags?: Record<string, boolean>;
  models?: { fast: string; normal: string; smart: string };
  voice?: { enabled: boolean; profile: string; pushToTalk?: boolean; wakeWordEnabled?: boolean };
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
  recentReports?: Array<{ id: string; type: string; summary: string; createdAt: string }>;
  issues?: string[];
};

export default function AdminJarvisPage() {
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
      if (res.status === 503 && json.status === "disabled") {
        setLastAction(json.summary ?? "Jarvis apagado en servidor.");
      } else {
        setLastAction(json.summary ?? JSON.stringify(json).slice(0, 400));
      }
      await load();
    } catch (e) {
      setLastAction(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> Cargando Atlas…
      </div>
    );
  }

  const enabled = data?.enabled === true;
  const h = data?.health;
  const desktopOk = data?.desktop?.connected;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-violet-500" />
            Atlas Orchestrator
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Marca MadsJeez · voz Atlas/Nova · Cursor · Claude · Windsurf · Codex
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={busy}>
          <RefreshCw className="w-4 h-4 mr-1" /> Actualizar
        </Button>
      </header>

      {!enabled && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <Bot className="w-5 h-5" /> Orchestrator web apagado (modo seguro)
          </h2>
          <p className="text-sm text-muted-foreground">
            {data?.activateHint ??
              "Seteá JARVIS_ENABLED=true en Railway con JARVIS_READ_ONLY=true y redeploy."}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-muted">JARVIS_READ_ONLY=true ✓ recomendado</span>
            <span className="px-2 py-1 rounded bg-muted">JARVIS_ALLOW_DEPLOY=false ✓</span>
            <span className="px-2 py-1 rounded bg-muted">Bot WhatsApp no afectado</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Podés usar el <strong>Desktop Agent</strong> local mientras tanto (voz + PC).
          </p>
        </section>
      )}

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Web", ok: enabled, icon: Shield },
          { label: "Desktop", ok: desktopOk, icon: Monitor },
          { label: "Ollama", ok: h?.ollama?.ok, icon: Cpu },
          { label: "n8n", ok: h?.n8n?.configured, icon: Zap },
          { label: "DB", ok: h?.database?.ok, icon: Terminal },
        ].map(({ label, ok, icon: Icon }) => (
          <div key={label} className="rounded-lg border p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase">
              <Icon className="w-3 h-3" /> {label}
            </div>
            <p className="font-semibold mt-1 text-sm">{ok ? "OK" : enabled || label === "Desktop" ? "OFF" : "—"}</p>
          </div>
        ))}
      </section>

      {data?.desktop && (
        <p className="text-xs text-muted-foreground">
          Desktop agent: puerto local {data.desktop.expectedPort}
          {data.desktop.hostname ? ` · ${data.desktop.hostname}` : ""}
          {data.desktop.lastHeartbeatAt ? ` · último ping ${new Date(data.desktop.lastHeartbeatAt).toLocaleString()}` : ""}
        </p>
      )}

      {enabled && data?.models && (
        <p className="text-xs text-muted-foreground">
          Modelos: {data.models.fast} / {data.models.normal} / {data.models.smart}
          {data.readOnly ? " · read-only" : ""}
        </p>
      )}

      <section className="rounded-xl border p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4" /> Comandos rápidos
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy || !enabled}
            onClick={() => void run("/api/jarvis/command", { command: "health", scope: "all", detail: "short" })}
          >
            Health
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy || !enabled}
            onClick={() => void run("/api/jarvis/orchestrate", { scope: "all", agentTarget: "auto" })}
          >
            <Play className="w-4 h-4 mr-1" /> Orquestar
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || !enabled}
            onClick={() =>
              void run("/api/jarvis/command", {
                command: "create-agent-task",
                scope: "whatsapp",
                agentTarget: "auto",
                message: "Revisar bot WhatsApp y latencia Ollama",
              })
            }
          >
            Tarea agentes
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || !enabled}
            onClick={() => void run("/api/jarvis/report", { type: "daily_marketplace_report" })}
          >
            Reporte día
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || !enabled || !data?.voice?.enabled}
            onClick={() => void run("/api/jarvis/voice-report", { scope: "all" })}
          >
            <Mic className="w-4 h-4 mr-1" /> Voz
          </Button>
        </div>
        {!enabled && (
          <p className="text-xs text-amber-700">Activá JARVIS_ENABLED para usar comandos web.</p>
        )}
        {lastAction && <p className="text-sm text-muted-foreground border-t pt-3">{lastAction}</p>}
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">
          <h3 className="font-medium mb-2 text-sm">Tareas recientes</h3>
          <ul className="space-y-2 text-sm max-h-48 overflow-y-auto">
            {(data?.recentTasks ?? []).length === 0 && (
              <li className="text-muted-foreground text-xs">Sin tareas. Orquestá o usá desktop agent.</li>
            )}
            {(data?.recentTasks ?? []).map((t, i) => (
              <li key={i} className="border rounded p-2">
                <span className="text-xs font-medium text-violet-600 uppercase">{t.agent}</span>
                <p className="text-xs mt-1 line-clamp-2">{t.objective}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-medium mb-2 text-sm">Hallazgos abiertos</h3>
          <ul className="space-y-1 text-sm max-h-48 overflow-y-auto">
            {(data?.openFindings ?? []).map((f, i) => (
              <li key={i} className="text-xs border rounded p-2">
                [{f.severity}] {f.title}
              </li>
            ))}
            {(data?.openFindings ?? []).length === 0 && (
              <li className="text-muted-foreground text-xs">Ninguno.</li>
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Desktop Agent (tu PC)</p>
        <code className="block bg-muted p-2 rounded">cd apps/jarvis-desktop-agent && npm i && npm run dev</code>
        <p>Health local: http://127.0.0.1:8787/health · Push-to-talk: POST /voice/stop con texto</p>
      </section>

      <Link href="/admin" className="text-xs underline text-muted-foreground">
        Volver al admin
      </Link>
    </div>
  );
}
