import { executeJarvisCommand } from "@/jarvis/jarvis-orchestrator";
import { routeTaskToAgents, agentOpenInstructions, type RoutedAgent } from "@/jarvis/jarvis-agent-router";
import { createJarvisAgentTasks } from "@/jarvis/jarvis-agent-tasks";
import { defaultRelevantFiles } from "@/jarvis/prompts/agent-templates";
import { getJarvisConfig } from "@/jarvis/jarvis-env";
import { enhanceWithJarvisLlm } from "@/jarvis/jarvis-llm";
import type { JarvisAgentTarget, JarvisCommandOutput, JarvisDetail, JarvisScope } from "@/jarvis/types";

export type OrchestrateInput = {
  scope?: JarvisScope;
  detail?: JarvisDetail;
  message?: string;
  agentTarget?: JarvisAgentTarget | "auto";
  dispatch?: boolean;
};

export type OrchestrateResult = JarvisCommandOutput & {
  orchestration: {
    health: JarvisCommandOutput;
    errors: JarvisCommandOutput;
    improvements: JarvisCommandOutput;
    routedAgents: Array<{
      agent: RoutedAgent;
      reason: string;
      path?: string;
      openHint?: string;
    }>;
    dispatchResults?: Array<{ agent: string; status: string; message: string }>;
  };
};

export async function runJarvisOrchestration(input: OrchestrateInput): Promise<OrchestrateResult> {
  const scope = input.scope ?? "all";
  const detail = input.detail ?? "normal";
  const config = getJarvisConfig();

  const [health, errors, improvements] = await Promise.all([
    executeJarvisCommand({ command: "health", scope, detail: "short" }),
    executeJarvisCommand({ command: "detect-errors", scope, detail }),
    executeJarvisCommand({ command: "suggest-improvements", scope, detail }),
  ]);

  const findings = [...health.findings, ...errors.findings, ...improvements.findings];
  const recommendations = [
    ...improvements.recommendations,
    ...errors.recommendations.filter((r) => !improvements.recommendations.includes(r)),
  ];

  let objective =
    input.message ??
    (recommendations[0]
      ? `Prioridad Jarvis: ${recommendations[0]}`
      : "Auditoría general y mejoras prioritarias del Marketplace");

  const llm = await enhanceWithJarvisLlm({
    command: "create-agent-task",
    scope,
    detail,
    message: objective,
    criticalFindings: findings.some((f) => f.severity === "critical" || f.severity === "high"),
    userContent: `Objetivo CEO para agentes externos. Scope: ${scope}. Recomendaciones: ${recommendations.slice(0, 5).join("; ") || "ninguna"}. Problemas: ${errors.recommendations.slice(0, 3).join("; ") || findings.map((f) => f.title).join("; ")}. Una sola prioridad clara, 3 oraciones max, sin secretos.`,
  });
  if (llm?.text) objective = llm.text;

  const explicitTarget =
    input.agentTarget === "auto" || !input.agentTarget ? "auto" : input.agentTarget;

  const routes = routeTaskToAgents({
    objective,
    scope,
    detail,
    explicitTarget: explicitTarget as JarvisAgentTarget,
    maxAgents: explicitTarget === "all" ? 4 : 2,
  });

  const agentTasks: OrchestrateResult["agentTasks"] = [];
  const routedAgents: OrchestrateResult["orchestration"]["routedAgents"] = [];

  if (config.allowAgentTasks) {
    for (const route of routes) {
      const tasks = await createJarvisAgentTasks({
        agentTarget: route.agent,
        scope,
        objective,
        context: `Orquestación Jarvis. Health: ${health.summary.slice(0, 200)}`,
        relevantFiles: defaultRelevantFiles(scope),
        constraints: config.readOnly
          ? ["Modo read-only Jarvis — solo proponer cambios, no aplicar en prod"]
          : [],
      });
      for (const t of tasks) {
        agentTasks.push(t);
        routedAgents.push({
          agent: route.agent,
          reason: route.reason,
          path: t.path,
        });
      }
    }
  }

  let dispatchResults: OrchestrateResult["orchestration"]["dispatchResults"];
  if (input.dispatch && config.allowAgentTasks) {
    const { dispatchJarvisTask } = await import("@/jarvis/jarvis-dispatch");
    dispatchResults = [];
    for (const route of routedAgents) {
      if (!route.path) continue;
      const res = await dispatchJarvisTask({
        agent: route.agent,
        taskPath: route.path,
        objective,
      });
      dispatchResults.push(res);
    }
  }

  const summary = [
    `Orquestación completa (${scope}).`,
    `${findings.length} hallazgos.`,
    `${agentTasks.length} tarea(s) para agentes.`,
    routes.map((r) => r.agent).join(", "),
  ].join(" ");

  return {
    status: "ok",
    summary,
    findings,
    recommendations,
    agentTasks,
    requiresConfirmation: config.requireConfirmation,
    orchestration: {
      health,
      errors,
      improvements,
      routedAgents: routedAgents.map((r) => ({
        ...r,
        openHint: agentOpenInstructions(r.agent, r.path ?? ".agent-tasks/"),
      })),
      dispatchResults,
    },
  };
}
