import { NextRequest, NextResponse } from "next/server";
import { assertJarvisPanelAccess, getJarvisPanelBootstrap } from "@/jarvis/api-auth";
import { getJarvisDashboardStatus } from "@/jarvis/jarvis-status";

export const dynamic = "force-dynamic";

/** Panel admin: funciona aunque JARVIS_ENABLED=false. */
export async function GET(req: NextRequest) {
  const auth = await assertJarvisPanelAccess(req);
  if (auth) return auth;

  const bootstrap = getJarvisPanelBootstrap();
  if (!bootstrap.enabled) {
    return NextResponse.json({
      status: "disabled",
      ...bootstrap,
      health: null,
      recentTasks: [],
      openFindings: [],
      recentReports: [],
    });
  }

  const full = await getJarvisDashboardStatus();
  return NextResponse.json({
    status: "ok",
    ...full,
    desktop: bootstrap.desktop,
  });
}
