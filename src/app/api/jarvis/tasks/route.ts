import { NextRequest, NextResponse } from "next/server";
import { assertJarvisAuth, parseJarvisJson } from "@/jarvis/api-auth";
import { createJarvisAgentTasks, defaultTaskObjective } from "@/jarvis/jarvis-agent-tasks";
import { getJarvisConfig } from "@/jarvis/jarvis-env";
import type { JarvisAgentTarget, JarvisScope } from "@/jarvis/types";

type TasksBody = {
  agentTarget?: JarvisAgentTarget;
  scope?: JarvisScope;
  objective?: string;
  message?: string;
};

export async function POST(req: NextRequest) {
  const auth = await assertJarvisAuth(req);
  if (auth) return auth;

  const config = getJarvisConfig();
  if (!config.allowAgentTasks) {
    return NextResponse.json(
      { error: "JARVIS_ALLOW_AGENT_TASKS=false" },
      { status: 403 }
    );
  }

  const body = await parseJarvisJson<TasksBody>(req);
  if (body instanceof NextResponse) return body;

  const scope = body.scope ?? "all";
  const agentTarget = body.agentTarget ?? "auto";
  const objective = body.objective ?? body.message ?? defaultTaskObjective(scope);

  const tasks = await createJarvisAgentTasks({
    agentTarget,
    scope,
    objective,
  });

  return NextResponse.json({
    status: "ok",
    agentTasks: tasks,
    requiresConfirmation: config.requireConfirmation,
  });
}

export async function GET(req: NextRequest) {
  const auth = await assertJarvisAuth(req);
  if (auth) return auth;

  return NextResponse.json({
    status: "ok",
    agents: ["cursor", "claude", "windsurf", "codex"],
    taskDir: ".agent-tasks/",
  });
}
