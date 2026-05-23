import { NextRequest, NextResponse } from "next/server";
import { assertJarvisPanelAccess, parseJarvisJson } from "@/jarvis/api-auth";
import { recordJarvisDesktopHeartbeat } from "@/jarvis/jarvis-desktop-state";

type HeartbeatBody = {
  hostname?: string;
  version?: string;
  secret?: string;
};

export async function POST(req: NextRequest) {
  const expected = process.env.JARVIS_DESKTOP_SECRET?.trim();
  const body = await parseJarvisJson<HeartbeatBody>(req);
  if (body instanceof NextResponse) return body;

  if (expected) {
    const header = req.headers.get("x-jarvis-secret");
    if (header !== expected && body.secret !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    const auth = await assertJarvisPanelAccess(req);
    if (auth) return auth;
  }

  recordJarvisDesktopHeartbeat({
    hostname: body.hostname,
    version: body.version,
  });

  return NextResponse.json({ status: "ok", receivedAt: new Date().toISOString() });
}
