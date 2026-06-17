import { NextRequest, NextResponse } from "next/server";
import { assertJarvisAuth, parseJarvisJson } from "@/jarvis/api-auth";
import { dispatchJarvisTask, dispatchAllPendingTasks } from "@/jarvis/jarvis-dispatch";
import type { JarvisAgentTarget } from "@/jarvis/types";

type DispatchBody = {
  agent?: JarvisAgentTarget;
  taskPath?: string;
  objective?: string;
  all?: boolean;
  confirm?: boolean;
};

export async function POST(req: NextRequest) {
  const auth = await assertJarvisAuth(req);
  if (auth) return auth;

  const body = await parseJarvisJson<DispatchBody>(req);
  if (body instanceof NextResponse) return body;

  const autoDispatch = body.confirm === true;

  if (body.all) {
    const results = await dispatchAllPendingTasks();
    return NextResponse.json({ status: "ok", results });
  }

  if (!body.agent || !body.taskPath) {
    return NextResponse.json(
      { error: "agent and taskPath required, or all:true" },
      { status: 400 }
    );
  }

  const result = await dispatchJarvisTask({
    agent: body.agent as "cursor" | "claude" | "windsurf" | "codex",
    taskPath: body.taskPath,
    objective: body.objective ?? "Jarvis task",
    autoDispatch,
  });

  return NextResponse.json({ status: "ok", result });
}
