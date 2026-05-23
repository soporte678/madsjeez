import { randomUUID } from "crypto";
import { getJarvisConfig } from "@/jarvis/jarvis-env";
import { getOllamaLatencySummary, getRecentBotErrors, runJarvisHealthCheck } from "@/jarvis/jarvis-health";
import { enhanceWithJarvisLlm, reportTypeToCommand } from "@/jarvis/jarvis-llm";
import { saveJarvisFindings, saveJarvisReport } from "@/jarvis/jarvis-memory";
import { MARKETPLACE_AUDITOR_PROMPT } from "@/jarvis/prompts/marketplace-auditor";
import type { JarvisDetail, JarvisFinding, JarvisReportType, JarvisScope } from "@/jarvis/types";

function finding(
  scope: JarvisScope | string,
  severity: JarvisFinding["severity"],
  title: string,
  description: string,
  recommendedAction?: string
): JarvisFinding {
  return {
    id: randomUUID(),
    scope,
    severity,
    title,
    description,
    recommendedAction,
    status: "open",
    createdAt: new Date().toISOString(),
  };
}

export type JarvisReportResult = {
  type: JarvisReportType;
  summary: string;
  problems: string[];
  opportunities: string[];
  recommendedActions: string[];
  agentTasksHint: Record<string, string[]>;
  risks: string[];
  findings: JarvisFinding[];
  reportId?: string;
};

export async function generateJarvisReport(
  type: JarvisReportType,
  scope: JarvisScope = "all",
  detail: JarvisDetail = "normal"
): Promise<JarvisReportResult> {
  const health = await runJarvisHealthCheck();
  const errors = await getRecentBotErrors(detail === "short" ? 3 : 10);
  const latency = await getOllamaLatencySummary();

  const findings: JarvisFinding[] = [];
  const problems: string[] = [];
  const opportunities: string[] = [];
  const recommendedActions: string[] = [];
  const risks: string[] = [];

  if (!health.ollama.ok) {
    findings.push(
      finding("ollama", "critical", "Ollama no responde", health.ollama.detail ?? "Sin detalle", "Verificar servicio Ollama en Railway")
    );
    problems.push("Ollama no está saludable — el bot puede fallar o usar fallback.");
    recommendedActions.push("Revisar logs de Ollama y timeouts del router.");
  }

  if (!health.database.ok) {
    findings.push(
      finding("supabase", "critical", "Base de datos inaccesible", health.database.detail ?? "", "Verificar DATABASE_URL y Supabase")
    );
    problems.push("DB no responde.");
  }

  if (!health.n8n.configured && scope !== "ollama") {
    findings.push(
      finding("n8n", "medium", "n8n no configurado", "Falta N8N_WEBHOOK_BASE_URL o secret", "Completar deploy n8n y variables")
    );
    opportunities.push("Automatizar follow-ups y reportes con n8n en segundo plano.");
  }

  if (errors.length > 0) {
    findings.push(
      finding(
        "whatsapp",
        "high",
        `${errors.length} errores recientes del bot`,
        errors.map((e) => `${e.at}: ${e.error.slice(0, 120)}`).join("; "),
        "Auditar prompts largos y timeouts"
      )
    );
    problems.push("Hay errores recientes en ai_message_logs.");
  }

  if (latency.avgMs != null && latency.avgMs > 8000) {
    findings.push(
      finding(
        "ollama",
        "medium",
        "Latencia alta de modelos",
        `Promedio ${latency.avgMs}ms (${latency.samples} muestras)`,
        "Usar 3B/7B para mensajes simples; reducir contexto"
      )
    );
    opportunities.push("Optimizar router: 3B clasifica, 7B responde, 14B solo cierre complejo.");
  }

  if (health.flags.readOnly) {
    opportunities.push("Jarvis en modo read-only — seguro para auditoría sin riesgo en prod.");
  }

  const summaryParts = [
    `Reporte ${type} (${scope}, ${detail}).`,
    health.ollama.ok ? "Ollama OK." : "Ollama con problemas.",
    errors.length ? `${errors.length} errores recientes.` : "Sin errores recientes críticos.",
  ];

  const agentTasksHint = {
    Cursor: recommendedActions.filter((a) => a.toLowerCase().includes("código") || a.toLowerCase().includes("router")),
    Claude: ["Revisar estrategia de prompts y playbooks de ventas."],
    Windsurf: ["Refactor menor en módulos de automatización si aplica."],
    Codex: ["Scripts de verificación health/latency."],
  };

  if (problems.length === 0) {
    summaryParts.push("Sistema estable en chequeo rápido.");
  }

  const result: JarvisReportResult = {
    type,
    summary: summaryParts.join(" "),
    problems,
    opportunities,
    recommendedActions,
    agentTasksHint,
    risks: risks.length ? risks : ["No deploy ni cambios destructivos sin confirmación."],
    findings,
  };

  const hasCritical = findings.some((f) => f.severity === "critical" || f.severity === "high");
  const command = reportTypeToCommand(type);
  const llmContext = [
    `Tipo: ${type}`,
    `Scope: ${scope}`,
    `Detail: ${detail}`,
    `Hechos: ${summaryParts.join(" ")}`,
    problems.length ? `Problemas: ${problems.join(" | ")}` : "",
    opportunities.length ? `Oportunidades: ${opportunities.join(" | ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const enhanced = await enhanceWithJarvisLlm({
    command,
    scope,
    detail,
    criticalFindings: hasCritical,
    userContent: `${MARKETPLACE_AUDITOR_PROMPT}\n\n${llmContext}\n\nEscribí un resumen ejecutivo de 2-4 oraciones para el CEO. Sin inventar datos.`,
  });
  if (enhanced?.text) {
    result.summary = enhanced.text;
  }

  const reportId = await saveJarvisReport({
    type,
    scope,
    summary: result.summary,
    body: {
      problems: result.problems,
      opportunities: result.opportunities,
      recommendedActions: result.recommendedActions,
      risks: result.risks,
    },
  });
  result.reportId = reportId;
  await saveJarvisFindings(findings);

  return result;
}

export function formatReportMarkdown(report: JarvisReportResult): string {
  const lines: string[] = [
    `# ${report.type}`,
    "",
    "## Resumen",
    report.summary,
    "",
    "## Problemas",
    ...(report.problems.length ? report.problems.map((p) => `- ${p}`) : ["- Ninguno crítico detectado"]),
    "",
    "## Oportunidades",
    ...(report.opportunities.length ? report.opportunities.map((o) => `- ${o}`) : ["- Continuar monitoreo"]),
    "",
    "## Acciones recomendadas",
    ...(report.recommendedActions.length ? report.recommendedActions.map((a) => `- ${a}`) : ["- Mantener observabilidad"]),
    "",
    "## Tareas para agentes",
    `- Cursor: ${report.agentTasksHint.Cursor.join("; ") || "—"}`,
    `- Claude: ${report.agentTasksHint.Claude.join("; ") || "—"}`,
    `- Windsurf: ${report.agentTasksHint.Windsurf.join("; ") || "—"}`,
    `- Codex: ${report.agentTasksHint.Codex.join("; ") || "—"}`,
    "",
    "## Riesgos",
    ...report.risks.map((r) => `- ${r}`),
  ];
  return lines.join("\n");
}
