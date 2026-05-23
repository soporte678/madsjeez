import { NextRequest, NextResponse } from "next/server";
import { getJarvisConfig, isJarvisEnabled } from "@/jarvis/jarvis-env";
import { desktopAgentStatus } from "@/jarvis/jarvis-desktop-state";

/** Estado Jarvis para el agente desktop (auth: JARVIS_DESKTOP_SECRET). */
export async function GET(req: NextRequest) {
  const expected = process.env.JARVIS_DESKTOP_SECRET?.trim();
  if (expected) {
    const header = req.headers.get("x-jarvis-secret");
    if (header !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const config = getJarvisConfig();
  const enabled = isJarvisEnabled();

  return NextResponse.json({
    status: "ok",
    enabled,
    readOnly: config.readOnly,
    desktopAgent: desktopAgentStatus(),
    marketplace: enabled ? "jarvis_on" : "jarvis_off",
    hint: enabled
      ? "Jarvis web activo"
      : "JARVIS_ENABLED=false en Railway — solo desktop local",
  });
}
