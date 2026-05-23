import { getN8nAutomationConfig, isN8nAutomationConfigured } from "@/lib/automation/n8n-env";
import { checkOllamaHealth } from "@/lib/whatsapp-bot/ollama-client";
import { listModels } from "@/lib/ai/ollama-client";
import { prisma } from "@/lib/prisma";
import { getJarvisConfig } from "@/jarvis/jarvis-env";
import type { JarvisHealthSnapshot } from "@/jarvis/types";

async function checkDatabase(): Promise<{ ok: boolean; detail?: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : "db_unreachable" };
  }
}

export async function runJarvisHealthCheck(): Promise<JarvisHealthSnapshot> {
  const config = getJarvisConfig();
  const n8nConfig = getN8nAutomationConfig();
  const n8nConfigured = isN8nAutomationConfigured(n8nConfig);

  let ollamaOk = false;
  let models: string[] | undefined;
  let ollamaDetail: string | undefined;

  try {
    const health = await checkOllamaHealth();
    ollamaOk = health.ok;
    if (health.ok) {
      try {
        models = await listModels();
      } catch {
        models = health.models;
      }
    } else {
      ollamaDetail = health.error ?? "ollama_unhealthy";
    }
  } catch (err) {
    ollamaDetail = err instanceof Error ? err.message : "ollama_check_failed";
  }

  const db = await checkDatabase();

  return {
    backend: { ok: true, detail: "api_reachable" },
    ollama: { ok: ollamaOk, models, detail: ollamaDetail },
    n8n: {
      ok: n8nConfig.enabled && n8nConfigured,
      configured: n8nConfigured,
      detail: n8nConfig.enabled ? (n8nConfigured ? "configured" : "missing_webhook") : "disabled",
    },
    database: db,
    automation: { webhookConfigured: n8nConfigured },
    flags: {
      enabled: config.enabled,
      readOnly: config.readOnly,
      allowAgentTasks: config.allowAgentTasks,
      allowCodeChanges: config.allowCodeChanges,
      allowDeploy: config.allowDeploy,
    },
    checkedAt: new Date().toISOString(),
  };
}

export async function getRecentBotErrors(limit = 5): Promise<Array<{ at: string; error: string }>> {
  try {
    const rows = await prisma.aiMessageLog.findMany({
      where: { errorMessage: { not: null } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { createdAt: true, errorMessage: true },
    });
    return rows.map((r) => ({
      at: r.createdAt.toISOString(),
      error: r.errorMessage ?? "unknown",
    }));
  } catch {
    return [];
  }
}

export async function getOllamaLatencySummary(): Promise<{ avgMs: number | null; samples: number }> {
  try {
    const rows = await prisma.aiMessageLog.findMany({
      where: { latencyMs: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { latencyMs: true },
    });
    if (rows.length === 0) return { avgMs: null, samples: 0 };
    const sum = rows.reduce((acc, r) => acc + (r.latencyMs ?? 0), 0);
    return { avgMs: Math.round(sum / rows.length), samples: rows.length };
  } catch {
    return { avgMs: null, samples: 0 };
  }
}
