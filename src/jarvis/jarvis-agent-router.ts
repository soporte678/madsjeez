import type { JarvisAgentTarget, JarvisDetail, JarvisScope } from "@/jarvis/types";

export type RoutedAgent = Exclude<JarvisAgentTarget, "all" | "auto">;

export type AgentRouteResult = {
  agent: RoutedAgent;
  score: number;
  reason: string;
};

const AGENTS: RoutedAgent[] = ["cursor", "claude", "windsurf", "codex"];

function scoreAgent(
  agent: RoutedAgent,
  objective: string,
  scope: JarvisScope,
  detail: JarvisDetail
): { score: number; reason: string } {
  const text = `${objective} ${scope}`.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  const bump = (n: number, r: string) => {
    score += n;
    reasons.push(r);
  };

  if (agent === "cursor") {
    if (/refactor|typescript|next\.?js|componente|api route|prisma|repo|archivo/i.test(text)) bump(3, "código en repo");
    if (scope === "repo" || scope === "all") bump(2, "scope repo");
    if (/multi.?file|integración|hook|dashboard/i.test(text)) bump(2, "trabajo IDE");
  }

  if (agent === "claude") {
    if (/estrateg|ceo|arquitect|seguridad|security|auditor|playbook|ventas|análisis profundo/i.test(text)) bump(4, "estrategia/análisis");
    if (detail === "full") bump(2, "detalle full");
    if (/error difícil|root cause|decisión/i.test(text)) bump(3, "debug estratégico");
    if (scope === "marketplace" || scope === "whatsapp") bump(1, "negocio");
  }

  if (agent === "windsurf") {
    if (/automation|n8n|workflow|flujo|integración|middleware/i.test(text)) bump(3, "flujos/automation");
    if (/refactor|limpiar|optimiz/i.test(text)) bump(2, "refactor medio");
    if (scope === "n8n" || scope === "whatsapp") bump(2, "scope flujo");
  }

  if (agent === "codex") {
    if (/script|cli|benchmark|migrat|sql|cron|test|vitest|deploy check/i.test(text)) bump(4, "scripts/CLI");
    if (/railway|env var|health check/i.test(text)) bump(2, "ops scripts");
    if (scope === "ollama" || scope === "railway" || scope === "supabase") bump(1, "scope ops");
  }

  if (score === 0) {
    if (agent === "cursor") bump(1, "default repo");
    if (agent === "claude" && detail === "full") bump(1, "default análisis");
  }

  return { score, reason: reasons.join(", ") || "fallback" };
}

export function routeTaskToAgents(params: {
  objective: string;
  scope: JarvisScope;
  detail: JarvisDetail;
  explicitTarget?: JarvisAgentTarget;
  maxAgents?: number;
}): AgentRouteResult[] {
  const { objective, scope, detail, explicitTarget, maxAgents = 2 } = params;

  if (explicitTarget && explicitTarget !== "all" && explicitTarget !== "auto") {
    return [{ agent: explicitTarget, score: 100, reason: "explicit_target" }];
  }

  if (explicitTarget === "all") {
    return AGENTS.map((agent) => ({
      agent,
      score: 50,
      reason: "all_agents_requested",
    }));
  }

  const ranked = AGENTS.map((agent) => {
    const { score, reason } = scoreAgent(agent, objective, scope, detail);
    return { agent, score, reason };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return [{ agent: "cursor", score: 1, reason: "default_cursor" }];
  }

  const top = ranked[0]!;
  const results: AgentRouteResult[] = [top];

  if (maxAgents > 1 && ranked[1] && ranked[1].score >= top.score * 0.7) {
    results.push(ranked[1]);
  }

  return results.slice(0, maxAgents);
}

export function agentDisplayName(agent: RoutedAgent): string {
  const names: Record<RoutedAgent, string> = {
    cursor: "Cursor",
    claude: "Claude Code",
    windsurf: "Windsurf",
    codex: "Codex",
  };
  return names[agent];
}

export function agentOpenInstructions(agent: RoutedAgent, taskPath: string): string {
  switch (agent) {
    case "cursor":
      return `Abrí Cursor en el repo y pegá el contenido de ${taskPath} como prompt del agente (Composer/Agent).`;
    case "claude":
      return `En terminal: claude (Claude Code) y pegá ${taskPath}, o: claude -p "$(cat ${taskPath})"`;
    case "windsurf":
      return `Abrí Windsurf, abrí ${taskPath} y usá Cascade con ese brief.`;
    case "codex":
      return `Codex/CLI: pegá ${taskPath} o importá como instrucción de tarea.`;
  }
}
