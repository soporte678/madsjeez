import type { RoutedAgent } from "@/jarvis/jarvis-agent-router";

export type AgentTemplateContext = {
  objective: string;
  scope: string;
  context?: string;
  relevantFiles: string[];
  constraints: string[];
  steps: string[];
  verification: string[];
  risks: string[];
  routeReason?: string;
};

const BASE_CONSTRAINTS = [
  "No tocar secretos ni .env",
  "No deploy sin confirmación explícita",
  "No modificar path crítico del bot WhatsApp",
  "Jarvis/marketplace deben seguir aislados",
];

export function agentSpecificSteps(agent: RoutedAgent): string[] {
  switch (agent) {
    case "cursor":
      return [
        "Leé archivos relevantes con @ references",
        "Cambio mínimo que resuelva el objetivo",
        "Correr lint/typecheck en archivos tocados",
      ];
    case "claude":
      return [
        "Analizá contexto y riesgos antes de editar",
        "Propone plan en 3 bullets, luego implementá",
        "Verificá impacto en ventas/bot",
      ];
    case "windsurf":
      return [
        "Revisá flujo end-to-end del scope",
        "Refactor incremental con tests si existen",
        "Confirmá que n8n/automation sigue async",
      ];
    case "codex":
      return [
        "Script o patch acotado y reproducible",
        "Documentá comando de verificación",
        "Sin dependencias nuevas salvo necesidad clara",
      ];
  }
}

export function agentSpecificHeader(agent: RoutedAgent): string {
  switch (agent) {
    case "cursor":
      return "Cursor Agent — repo MadsJeez, modo cambio mínimo";
    case "claude":
      return "Claude Code — análisis + implementación segura";
    case "windsurf":
      return "Windsurf Cascade — flujos e integraciones";
    case "codex":
      return "Codex — scripts, CLI y automatización local";
  }
}

export function buildAgentTaskMarkdown(
  agent: RoutedAgent,
  ctx: AgentTemplateContext,
  generatedAt: string
): string {
  const header = agentSpecificHeader(agent);
  const steps = ctx.steps.length ? ctx.steps : agentSpecificSteps(agent);
  const constraints = [...BASE_CONSTRAINTS, ...ctx.constraints];
  const files = ctx.relevantFiles.length
    ? ctx.relevantFiles.map((f) => `- \`${f}\``).join("\n")
    : "- (inferir del scope)";

  return `# Jarvis → ${agent.toUpperCase()}

> ${header}
> Generado: ${generatedAt} | Scope: ${ctx.scope}${ctx.routeReason ? ` | Router: ${ctx.routeReason}` : ""}

## Objetivo
${ctx.objective}

## Contexto mínimo
${ctx.context ?? `Tarea orquestada por Jarvis sobre ${ctx.scope}. Prioridad: estabilidad del Marketplace y velocidad del bot.`}

## Archivos relevantes
${files}

## Restricciones
${constraints.map((c) => `- ${c}`).join("\n")}

## Pasos
${steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Verificación esperada
${ctx.verification.map((v) => `- ${v}`).join("\n")}

## Riesgos
${ctx.risks.map((r) => `- ${r}`).join("\n")}

---
<!-- jarvis-agent:${agent} -->
`;
}

export function defaultRelevantFiles(scope: string): string[] {
  const common = ["src/jarvis/jarvis-orchestrator.ts", "src/lib/ai/model-router.ts"];
  switch (scope) {
    case "whatsapp":
      return [...common, "src/lib/whatsapp-bot/bot-engine.ts", "src/lib/ai/sales-closer.ts"];
    case "ollama":
      return [...common, "src/lib/ai/ollama-client.ts", "src/lib/ai/model-router.ts"];
    case "n8n":
      return [...common, "src/lib/automation/n8n-client.ts", "src/lib/automation/events.ts"];
    case "marketplace":
      return [...common, "src/app/marketplace/page.tsx", "src/lib/ai/sales-closer.ts"];
    case "repo":
      return ["package.json", "prisma/schema.prisma", "src/app/api/"];
    default:
      return common;
  }
}
