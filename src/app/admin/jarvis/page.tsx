"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Cpu, Loader2, Play, RefreshCw, Sparkles, Terminal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

type JarvisStatus = {
  enabled?: boolean;
  health?: {
    backend: { ok: boolean };
    ollama: { ok: boolean };
    n8n: { configured: boolean };
    database: { ok: boolean };
  };
  recentTasks?: Array<{ agent?: string; path?: string; objective?: string }>;
  openFindings?: Array<{ title: string; severity: string }>;
};

export default function AdminJarvisPage() {
  const [data, setData] = useState<JarvisStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [lastAction, setLastAction] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/jarvis/status", { credentials: "include" });
      if (res.status === 503) {
        setData({ enabled: false });
        return;
      }
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
      setLastAction(json.summary ?? JSON.stringify(json).slice(0, 300));
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
        <Loader2 className="w-5 h-5 animate-spin" /> Cargando Jarvis…
      </div>
    );
  }

  if (data?.enabled === false) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="rounded-xl border bg-amber-50 p-6">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="w-6 h-6" /> Jarvis apagado
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seteá <code className="text-xs bg-muted px-1 rounded">JARVIS_ENABLED=true</code> y redeploy.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => void load()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const h = data?.health;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-violet-500" />
            Jarvis Orchestrator
          </h1>
          <p className="text-muted-foreground mt-1">
            Cursor · Claude Code · Windsurf · Codex
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={busy}>
          <RefreshCw className="w-4 h-4 mr-1" /> Actualizar
        </Button>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Backend", ok: h?.backend?.ok },
          { label: "Ollama", ok: h?.ollama?.ok },
          { label: "n8n", ok: h?.n8n?.configured },
          { label: "DB", ok: h?.database?.ok },
        ].map((c) => (
          <div key={c.label} className="rounded-lg border p-4">
            <p className="text-xs uppercase text-muted-foreground">{c.label}</p>
            <p className="font-semibold mt-1">{c.ok ? "OK" : "FAIL"}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4" /> Acciones
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => void run("/api/jarvis/command", { command: "health", scope: "all", detail: "short" })}>
            <Cpu className="w-4 h-4 mr-1" /> Health
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => void run("/api/jarvis/orchestrate", { scope: "all", agentTarget: "auto" })}
          >
            <Play className="w-4 h-4 mr-1" /> Orquestar
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              void run("/api/jarvis/command", {
                command: "create-agent-task",
                scope: "marketplace",
                agentTarget: "auto",
              })
            }
          >
            Tarea auto
          </Button>
        </div>
        {lastAction && <p className="text-sm text-muted-foreground border-t pt-3">{lastAction}</p>}
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Terminal className="w-4 h-4" /> Tareas
          </h2>
          <ul className="space-y-2 text-sm">
            {(data?.recentTasks ?? []).map((t, i) => (
              <li key={i} className="border rounded-lg p-3">
                <span className="text-xs font-medium text-violet-600 uppercase">{t.agent}</span>
                <p className="mt-1">{t.objective}</p>
                {t.path && <code className="text-xs block mt-1">{t.path}</code>}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border p-5">
          <h2 className="font-semibold mb-3">Hallazgos</h2>
          <ul className="space-y-2 text-sm">
            {(data?.openFindings ?? []).map((f, i) => (
              <li key={i} className="border rounded p-2 text-sm">
                [{f.severity}] {f.title}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        <Link href="/admin" className="underline">Volver al admin</Link>
      </p>
    </div>
  );
}
