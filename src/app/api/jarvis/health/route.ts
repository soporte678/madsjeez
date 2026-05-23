import { NextRequest, NextResponse } from "next/server";
import { assertJarvisPanelAccess } from "@/jarvis/api-auth";
import { desktopAgentStatus } from "@/jarvis/jarvis-desktop-state";
import { runJarvisHealthCheck } from "@/jarvis/jarvis-health";
import { getJarvisConfig, isJarvisEnabled } from "@/jarvis/jarvis-env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await assertJarvisPanelAccess(req);
  if (auth) return auth;

  const config = getJarvisConfig();
  const enabled = isJarvisEnabled();
  const issues: string[] = [];

  if (!enabled) {
    issues.push("JARVIS_ENABLED=false — orchestrator en modo apagado (seguro).");
  }

  let ollama: "ok" | "error" = "error";
  let n8n: "ok" | "error" = "error";
  let marketplace: "ok" | "warning" | "error" = "warning";
  let lastReportAt: string | null = null;

  if (enabled) {
    const health = await runJarvisHealthCheck();
    ollama = health.ollama.ok ? "ok" : "error";
    n8n = health.n8n.configured ? "ok" : "error";
    if (!health.database.ok) issues.push("Base de datos no responde.");
    if (!health.ollama.ok) issues.push("Ollama no saludable.");
    if (!health.n8n.configured) issues.push("n8n no configurado.");
    marketplace = health.database.ok && health.backend.ok ? "ok" : "warning";
  }

  try {
    const last = await prisma.jarvisReport.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    lastReportAt = last?.createdAt.toISOString() ?? null;
  } catch {
    // optional
  }

  return NextResponse.json({
    enabled,
    readOnly: config.readOnly,
    desktopAgent: desktopAgentStatus(),
    ollama,
    n8n,
    marketplace,
    lastReportAt,
    issues,
    models: {
      fast: config.modelFast,
      normal: config.modelNormal,
      smart: config.modelSmart,
    },
    voice: {
      enabled: config.voiceEnabled,
      profile: config.voiceProfile,
    },
  });
}
