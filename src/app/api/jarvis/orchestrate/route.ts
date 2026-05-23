import { NextRequest, NextResponse } from "next/server";
import { assertJarvisAuth, parseJarvisJson } from "@/jarvis/api-auth";
import { runJarvisOrchestration } from "@/jarvis/jarvis-orchestrate";
import type { JarvisAgentTarget, JarvisDetail, JarvisScope } from "@/jarvis/types";

type OrchestrateBody = {
  scope?: JarvisScope;
  detail?: JarvisDetail;
  message?: string;
  agentTarget?: JarvisAgentTarget | "auto";
  dispatch?: boolean;
};

export async function POST(req: NextRequest) {
  const auth = await assertJarvisAuth(req);
  if (auth) return auth;

  const body = await parseJarvisJson<OrchestrateBody>(req);
  if (body instanceof NextResponse) return body;

  const result = await runJarvisOrchestration({
    scope: body.scope,
    detail: body.detail,
    message: body.message,
    agentTarget: body.agentTarget ?? "auto",
    dispatch: body.dispatch ?? false,
  });

  return NextResponse.json(result);
}
