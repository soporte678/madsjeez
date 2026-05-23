import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { getJarvisConfig } from "@/jarvis/jarvis-env";
import { routeTaskToAgents, type RoutedAgent } from "@/jarvis/jarvis-agent-router";
import { saveJarvisAgentTaskRecord } from "@/jarvis/jarvis-memory";
import {
  buildAgentTaskMarkdown,
  defaultRelevantFiles,
} from "@/jarvis/prompts/agent-templates";
import type { JarvisAgentTarget, JarvisScope } from "@/jarvis/types";

const TASK_DIR = ".agent-tasks";
const AGENT_FILES: Record<RoutedAgent, string> = {
  cursor: "cursor-task.md",
  claude: "claude-task.md",
  windsurf: "windsurf-task.md",
  codex: "codex-task.md",
};

export type AgentTaskInput = {
  agentTarget: JarvisAgentTarget;
  scope: JarvisScope;
  objective: string;
  context?: string;
  relevantFiles?: string[];
  constraints?: string[];
  steps?: string[];
  verification?: string[];
  risks?: string[];
  routeReason?: string;
};

async function appendTaskHistory(entry: Record<string, unknown>): Promise<void> {
  const root = process.cwd();
  const historyPath = path.join(root, TASK_DIR, "task-history.json");
  let history: unknown[] = [];
  try {
    const raw = await readFile(historyPath, "utf8");
    history = JSON.parse(raw) as unknown[];
    if (!Array.isArray(history)) history = [];
  } catch {
    history = [];
  }
  history.unshift({ ...entry, createdAt: new Date().toISOString() });
  await writeFile(historyPath, JSON.stringify(history.slice(0, 100), null, 2), "utf8");
}

export async function createJarvisAgentTasks(
  input: AgentTaskInput
): Promise<Array<{ agent: string; path: string; objective: string }>> {
  const config = getJarvisConfig();
  if (!config.allowAgentTasks) {
    throw new Error("JARVIS_ALLOW_AGENT_TASKS=false");
  }

  const root = process.cwd();
  const dir = path.join(root, TASK_DIR);
  await mkdir(dir, { recursive: true });

  const routes =
    input.agentTarget === "all"
      ? (["cursor", "claude", "windsurf", "codex"] as RoutedAgent[]).map((agent) => ({
          agent,
          score: 50,
          reason: "all_agents_requested",
        }))
      : input.agentTarget === "auto"
        ? routeTaskToAgents({
            objective: input.objective,
            scope: input.scope,
            detail: "normal",
            explicitTarget: "auto",
          })
        : [{ agent: input.agentTarget as RoutedAgent, score: 100, reason: input.routeReason ?? "explicit" }];

  const created: Array<{ agent: string; path: string; objective: string }> = [];
  const now = new Date().toISOString();
  const files = input.relevantFiles?.length ? input.relevantFiles : defaultRelevantFiles(input.scope);

  for (const route of routes) {
    const agent = route.agent;
    const filename = AGENT_FILES[agent];
    const relPath = `${TASK_DIR}/${filename}`;
    const filePath = path.join(dir, filename);

    const md = buildAgentTaskMarkdown(agent, {
      objective: input.objective,
      scope: input.scope,
      context: input.context,
      relevantFiles: files,
      constraints: input.constraints ?? [],
      steps: input.steps ?? [],
      verification: input.verification ?? [
        "Typecheck/lint en archivos tocados",
        "Bot WhatsApp sin regresión de latencia",
        "JARVIS_ENABLED no en path crítico del bot",
      ],
      risks: input.risks ?? [],
      routeReason: route.reason,
    }, now);

    await writeFile(filePath, md, "utf8");
    await saveJarvisAgentTaskRecord({
      agent,
      objective: input.objective,
      filePath: relPath,
    });
    await appendTaskHistory({
      agent,
      path: relPath,
      objective: input.objective,
      scope: input.scope,
      routeReason: route.reason,
    });
    created.push({ agent, path: relPath, objective: input.objective });
  }

  return created;
}

export function defaultTaskObjective(scope: JarvisScope): string {
  switch (scope) {
    case "marketplace":
      return "Mejorar conversión y estabilidad del Marketplace sin tocar el path crítico del bot.";
    case "whatsapp":
      return "Optimizar flujo WhatsApp: latencia, fallbacks y calidad de respuestas.";
    case "ollama":
      return "Afinar router multi-modelo (3B/7B/14B) y reducir timeouts.";
    case "n8n":
      return "Completar workflows n8n async para leads y reportes Jarvis.";
    case "railway":
      return "Verificar variables Railway y health de servicios sin deploy automático.";
    case "supabase":
      return "Revisar migraciones y tablas Jarvis; sin cambios destructivos.";
    case "repo":
      return "Auditar estructura del repo, endpoints y riesgos de producción.";
    default:
      return "Auditoría general Jarvis: salud, errores y mejoras prioritarias.";
  }
}
