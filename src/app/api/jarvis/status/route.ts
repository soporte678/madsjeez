import { NextRequest, NextResponse } from "next/server";
import { assertJarvisAuth } from "@/jarvis/api-auth";
import { getJarvisDashboardStatus } from "@/jarvis/jarvis-status";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await assertJarvisAuth(req);
  if (auth) return auth;

  const status = await getJarvisDashboardStatus();
  return NextResponse.json({ status: "ok", ...status });
}
