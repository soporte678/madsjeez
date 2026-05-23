import { NextRequest, NextResponse } from "next/server";
import { assertJarvisAuth, parseJarvisJson } from "@/jarvis/api-auth";
import { executeJarvisCommand } from "@/jarvis/jarvis-orchestrator";
import type { JarvisCommandInput } from "@/jarvis/types";

export async function POST(req: NextRequest) {
  const auth = await assertJarvisAuth(req);
  if (auth) return auth;

  const body = await parseJarvisJson<JarvisCommandInput>(req);
  if (body instanceof NextResponse) return body;

  if (!body.command) {
    return NextResponse.json({ error: "command is required" }, { status: 400 });
  }

  const result = await executeJarvisCommand(body);
  return NextResponse.json(result);
}
