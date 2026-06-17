import { NextRequest, NextResponse } from "next/server";
import {
  checkOllamaHealth,
  describeOllamaConfigIssue,
} from "@/lib/whatsapp-bot/ollama-client";
import { getLoadedModels, listModels } from "@/lib/ai/ollama-client";
import { getModelRouterEnv, getSalesCloserEnv } from "@/lib/ai/sales-closer-env";
import { tryAdminRequest } from "@/lib/admin-api";

export async function GET(request: NextRequest) {
  // Without an admin session, return only the ok flag (no infra details)
  const adminCtx = await tryAdminRequest(request);
  if (!adminCtx) {
    // Minimal health check: just ping Ollama reachability
    const configIssue = describeOllamaConfigIssue();
    if (configIssue) return NextResponse.json({ ok: false });
    const health = await checkOllamaHealth();
    return NextResponse.json({ ok: health.ok });
  }

  // Full details only for authenticated admins
  const env = getSalesCloserEnv();
  const router = getModelRouterEnv();
  const configIssue = describeOllamaConfigIssue();

  let health: Awaited<ReturnType<typeof checkOllamaHealth>> = {
    ok: false,
    error: configIssue ?? "not_checked",
  };
  let installedModels: string[] = [];
  let loadedModels: string[] = [];

  if (!configIssue) {
    health = await checkOllamaHealth();
    if (health.ok) {
      try {
        installedModels = await listModels();
        loadedModels = await getLoadedModels();
      } catch {
        installedModels = health.models ?? [];
      }
    }
  }

  const required = [
    router.classifierModel,
    router.marketplaceModel,
    router.closerModel,
  ];
  const missingModels = required.filter(
    (m) =>
      !installedModels.some(
        (installed) => installed === m || installed.startsWith(`${m}:`)
      )
  );

  return NextResponse.json({
    ok: health.ok && missingModels.length === 0,
    ollama: {
      reachable: health.ok,
      baseUrlConfigured: Boolean(env.ollamaBase),
      configIssue,
      installedModelsCount: installedModels.length,
      loadedModels,
      missingModels,
    },
    router: {
      enabled: router.routerEnabled,
      escalateTo14B: router.escalateTo14B,
      preloadModels: router.preloadModels,
      warmupIntervalMinutes: router.warmupIntervalMinutes,
      models: {
        classifier: router.classifierModel,
        marketplace: router.marketplaceModel,
        closer: router.closerModel,
      },
    },
    botAutoReplyWithOllama: env.botAutoReplyWithOllama,
    timestamp: new Date().toISOString(),
  });
}
