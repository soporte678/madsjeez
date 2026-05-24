import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api";
import { getJarvisConfig, isJarvisEnabled } from "@/jarvis/jarvis-env";
import { getJarvisDesktopPresence } from "@/jarvis/jarvis-desktop-state";

/** Admin panel: siempre accesible; no exige JARVIS_ENABLED. */
export async function assertJarvisPanelAccess(req: NextRequest): Promise<NextResponse | null> {
  const admin = await requireAdminRequest(req);
  if (admin instanceof NextResponse) return admin;
  return null;
}

export function jarvisDisabledResponse() {
  return NextResponse.json(
    {
      status: "disabled",
      summary: "Jarvis Orchestrator está deshabilitado (JARVIS_ENABLED=false).",
      findings: [],
      recommendations: [],
      agentTasks: [],
      requiresConfirmation: false,
    },
    { status: 503 }
  );
}

export function assertJarvisEnabled(): NextResponse | null {
  if (!isJarvisEnabled()) return jarvisDisabledResponse();
  return null;
}

/** Mutaciones Jarvis: admin + JARVIS_ENABLED. Opcional x-jarvis-secret. */
export async function assertJarvisAuth(req: NextRequest): Promise<NextResponse | null> {
  const disabled = assertJarvisEnabled();
  if (disabled) return disabled;

  const config = getJarvisConfig();
  if (config.apiSecret) {
    const provided = req.headers.get("x-jarvis-secret");
    if (provided === config.apiSecret) return null;
  }

  const admin = await requireAdminRequest(req);
  if (admin instanceof NextResponse) {
    if (config.apiSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return admin;
  }
  return null;
}

export async function parseJarvisJson<T>(req: NextRequest): Promise<T | NextResponse> {
  try {
    return (await req.json()) as T;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export function getJarvisPanelBootstrap() {
  const config = getJarvisConfig();
  const desktop = getJarvisDesktopPresence();
  return {
    enabled: config.enabled,
    readOnly: config.readOnly,
    flags: {
      readOnly: config.readOnly,
      allowAgentTasks: config.allowAgentTasks,
      allowCodeChanges: config.allowCodeChanges,
      allowDeploy: config.allowDeploy,
      allowVoiceReports: config.allowVoiceReports,
      requireConfirmation: config.requireConfirmation,
    },
    models: {
      fast: config.modelFast,
      normal: config.modelNormal,
      smart: config.modelSmart,
    },
    voice: {
      enabled: config.voiceEnabled,
      profile: config.voiceProfile,
      pushToTalk: process.env.JARVIS_PUSH_TO_TALK?.trim().toLowerCase() !== "false",
      wakeWordEnabled: process.env.JARVIS_WAKE_WORD_ENABLED?.trim().toLowerCase() !== "false",
    },
    desktop: {
      expectedPort: parseInt(process.env.JARVIS_DESKTOP_PORT ?? "8787", 10),
      lastHeartbeatAt: desktop.lastHeartbeatAt,
      connected: desktop.connected,
      hostname: desktop.hostname,
    },
    activateHint: config.enabled
      ? null
      : "Seteá JARVIS_ENABLED=true en Railway (modo read-only recomendado) y redeploy.",
  };
}
