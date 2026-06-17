import { readFile } from "fs/promises";
import path from "path";
import { getJarvisConfig } from "@/jarvis/jarvis-env";
import { agentOpenInstructions, type RoutedAgent } from "@/jarvis/jarvis-agent-router";
import { saveJarvisAuditLog } from "@/jarvis/jarvis-memory";

export type DispatchResult = {
  agent: string;
  status: "ok" | "skipped" | "error";
  message: string;
  runId?: string;
};

async function readTaskFile(taskPath: string): Promise<string> {
  const abs = path.isAbsolute(taskPath) ? taskPath : path.join(process.cwd(), taskPath);
  return readFile(abs, "utf8");
}

async function dispatchCursorTask(prompt: string, objective: string): Promise<DispatchResult> {
  const apiKey = process.env.CURSOR_API_KEY?.trim();
  const dispatchEnabled = process.env.JARVIS_CURSOR_DISPATCH?.trim().toLowerCase() === "true";

  if (!dispatchEnabled || !apiKey) {
    return {
      agent: "cursor",
      status: "skipped",
      message: "Cursor dispatch off (set JARVIS_CURSOR_DISPATCH=true + CURSOR_API_KEY). Usá .agent-tasks/cursor-task.md manualmente.",
    };
  }

  try {
    const mod = await import("@/lib/cursor-sdk-stub");
    const Agent = mod.Agent as {
      prompt: (
        p: string,
        opts: { apiKey: string; model: { id: string }; local: { cwd: string } }
      ) => Promise<{ status: string; result?: string; id?: string }>;
    };

    const result = await Agent.prompt(`${objective}\n\n---\n${prompt.slice(0, 12000)}`, {
      apiKey,
      model: { id: process.env.JARVIS_CURSOR_MODEL?.trim() || "composer-2.5" },
      local: { cwd: process.cwd() },
    });

    await saveJarvisAuditLog("dispatch:cursor", {
      status: result.status,
      runId: result.id,
    });

    return {
      agent: "cursor",
      status: "ok",
      message: `Cursor agent: ${result.status}`,
      runId: result.id,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "cursor_sdk_error";
    if (msg.includes("Cannot find module") || msg.includes("Cannot resolve")) {
      return {
        agent: "cursor",
        status: "skipped",
        message: "Instalá @cursor/sdk: npm i @cursor/sdk. Mientras tanto usá el .md manualmente.",
      };
    }
    return { agent: "cursor", status: "error", message: msg };
  }
}

export async function dispatchJarvisTask(params: {
  agent: RoutedAgent;
  taskPath: string;
  objective: string;
  autoDispatch?: boolean;
}): Promise<DispatchResult> {
  const config = getJarvisConfig();
  if (!config.allowAgentTasks) {
    return { agent: params.agent, status: "skipped", message: "JARVIS_ALLOW_AGENT_TASKS=false" };
  }
  const autoDispatchFlag =
    params.autoDispatch === true ||
    process.env.JARVIS_AUTO_DISPATCH?.trim().toLowerCase() === "true";
  if (config.requireConfirmation && !autoDispatchFlag) {
    return {
      agent: params.agent,
      status: "skipped",
      message: "Confirmación requerida. Set JARVIS_AUTO_DISPATCH=true o dispatch desde panel con confirm.",
    };
  }

  let prompt: string;
  try {
    prompt = await readTaskFile(params.taskPath);
  } catch {
    return { agent: params.agent, status: "error", message: `No se leyó ${params.taskPath}` };
  }

  await saveJarvisAuditLog(`dispatch:${params.agent}`, { taskPath: params.taskPath });

  if (params.agent === "cursor") {
    return dispatchCursorTask(prompt, params.objective);
  }

  return {
    agent: params.agent,
    status: "ok",
    message: agentOpenInstructions(params.agent, params.taskPath),
  };
}

export async function dispatchAllPendingTasks(): Promise<DispatchResult[]> {
  const historyPath = path.join(process.cwd(), ".agent-tasks", "task-history.json");
  let history: Array<{ agent?: string; path?: string; objective?: string }> = [];
  try {
    const raw = await readFile(historyPath, "utf8");
    history = JSON.parse(raw) as typeof history;
  } catch {
    return [];
  }

  const latestByAgent = new Map<string, (typeof history)[0]>();
  for (const entry of history) {
    if (entry.agent && entry.path) latestByAgent.set(entry.agent, entry);
  }

  const results: DispatchResult[] = [];
  for (const [agent, entry] of latestByAgent) {
    if (!["cursor", "claude", "windsurf", "codex"].includes(agent)) continue;
    results.push(
      await dispatchJarvisTask({
        agent: agent as RoutedAgent,
        taskPath: entry.path!,
        objective: entry.objective ?? "Jarvis task",
      })
    );
  }
  return results;
}
