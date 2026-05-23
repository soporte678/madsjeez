import { NextRequest, NextResponse } from "next/server";
import { getJarvisConfig, isJarvisEnabled } from "@/jarvis/jarvis-env";
import { requireAdminRequest } from "@/lib/admin-api";

const JARVIS_SECRET_HEADER = "x-jarvis-secret";

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

/** Admin session OR x-jarvis-secret when JARVIS_API_SECRET is set. */
export async function assertJarvisAuth(req: NextRequest): Promise<NextResponse | null> {
  const disabled = assertJarvisEnabled();
  if (disabled) return disabled;

  const config = getJarvisConfig();
  if (config.apiSecret) {
    const provided = req.headers.get(JARVIS_SECRET_HEADER);
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
