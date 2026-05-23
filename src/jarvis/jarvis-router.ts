import { randomUUID } from "crypto";
import { getJarvisConfig } from "@/jarvis/jarvis-env";
import { createJarvisAgentTasks, defaultTaskObjective } from "@/jarvis/jarvis-agent-tasks";
import { runJarvisHealthCheck } from "@/jarvis/jarvis-health";
import { enhanceWithJarvisLlm } from "@/jarvis/jarvis-llm";
import { resolveJarvisModelSelection } from "@/jarvis/jarvis-model-router";
import { saveJarvisAuditLog, saveJarvisHealthCheck } from "@/jarvis/jarvis-memory";
import { formatReportMarkdown, generateJarvisReport } from "@/jarvis/jarvis-reports";
import { generateVoiceReport } from "@/jarvis/jarvis-voice";
import type {
  JarvisAgentTarget,
  JarvisCommandInput,
  JarvisCommandOutput,
  JarvisFinding,
  JarvisReportType,
  JarvisScope,
} from "@/jarvis/types";

export async function routeJarvisCommand(input: JarvisCommandInput): Promise<JarvisCommandOutput> {
  const config = getJarvisConfig();
  const scope: JarvisScope = input.scope ?? "all";
  const detail = input.detail ?? "normal";
  const agentTarget = input.agentTarget ?? "auto";

  await saveJarvisAuditLog(`command:${input.command}`, { scope, detail, agentTarget });

  switch (input.command) {
    case "health": {
      const health = await runJarvisHealthCheck();
      await saveJarvisHealthCheck(health as unknown as Record<string, unknown>);
      const findings: JarvisFinding[] = [];
      if (!health.ollama.ok) {
        findings.push({
          id: randomUUID(),
          scope: "ollama",
          severity: "critical",
          title: "Ollama unhealthy",
          description: health.ollama.detail ?? "",
          status: "open",
          createdAt: new Date().toISOString(),
        });
      }
      if (!health.database.ok) {
        findings.push({
          id: randomUUID(),
          scope: "supabase",
          severity: "critical",
          title: "Database unreachable",
          description: health.database.detail ?? "",
          status: "open",
          createdAt: new Date().toISOString(),
        });
      }
      let summary =
        detail === "short"
          ? `Backend OK. Ollama: ${health.ollama.ok ? "OK" : "FAIL"}. DB: ${health.database.ok ? "OK" : "FAIL"}.`
          : `Health check completo. Ollama ${health.ollama.ok ? "ok" : "fail"}, n8n ${health.n8n.detail}, DB ${health.database.ok ? "ok" : "fail"}.`;

      if (detail !== "short") {
        const enhanced = await enhanceWithJarvisLlm({
          command: "health",
          scope,
          detail,
          criticalFindings: findings.some((f) => f.severity === "critical"),
          userContent: `Estado: ollama=${health.ollama.ok}, db=${health.database.ok}, n8n=${health.n8n.ok}. Resumí en 1-2 oraciones para operaciones.`,
        });
        if (enhanced?.text) summary = enhanced.text;
      }

      const modelSel = await resolveJarvisModelSelection({
        command: "health",
        scope,
        detail,
      });
      await saveJarvisAuditLog("health:model", {
        tier: modelSel.tier,
        model: modelSel.model,
        reason: modelSel.reason,
      });

      return {
        status: "ok",
        summary,
        findings,
        recommendations: findings.length
          ? ["Resolver servicios críticos antes de deploy."]
          : ["Sistema estable en chequeo Jarvis."],
        agentTasks: [],
        requiresConfirmation: false,
      };
    }

    case "audit-marketplace": {
      const report = await generateJarvisReport("daily_marketplace_report", scope, detail);
      return {
        status: "ok",
        summary: report.summary,
        findings: report.findings,
        recommendations: report.recommendedActions,
        agentTasks: [],
        requiresConfirmation: config.requireConfirmation && report.findings.some((f) => f.severity === "critical"),
        reportId: report.reportId,
      };
    }

    case "detect-errors": {
      const report = await generateJarvisReport("errors_report", scope, detail);
      return {
        status: "ok",
        summary: report.summary,
        findings: report.findings,
        recommendations: report.problems,
        agentTasks: [],
        requiresConfirmation: false,
        reportId: report.reportId,
      };
    }

    case "suggest-improvements": {
      const report = await generateJarvisReport("improvement_report", scope, detail);
      return {
        status: "ok",
        summary: report.summary,
        findings: report.findings,
        recommendations: report.opportunities,
        agentTasks: [],
        requiresConfirmation: config.requireConfirmation,
        reportId: report.reportId,
      };
    }

    case "create-agent-task": {
      if (!config.allowAgentTasks) {
        return {
          status: "error",
          summary: "Agent tasks deshabilitados (JARVIS_ALLOW_AGENT_TASKS=false).",
          findings: [],
          recommendations: [],
          agentTasks: [],
          requiresConfirmation: false,
        };
      }
      let objective = input.message ?? defaultTaskObjective(scope);
      const taskEnhanced = await enhanceWithJarvisLlm({
        command: "create-agent-task",
        scope,
        detail,
        message: objective,
        userContent: `Objetivo base: ${objective}\nAgente: ${agentTarget}\nExpandí en 2-3 oraciones accionables sin tocar secretos.`,
      });
      if (taskEnhanced?.text) objective = taskEnhanced.text;

      const tasks = await createJarvisAgentTasks({
        agentTarget,
        scope,
        objective,
        relevantFiles: [
          "src/lib/ai/model-router.ts",
          "src/lib/automation/n8n-client.ts",
          "src/jarvis/jarvis-orchestrator.ts",
        ],
      });
      return {
        status: "ok",
        summary: `Tarea(s) generada(s) para ${agentTarget}.`,
        findings: [],
        recommendations: ["Revisar .agent-tasks/ antes de ejecutar en IDE."],
        agentTasks: tasks,
        requiresConfirmation: config.requireConfirmation,
      };
    }

    case "orchestrate": {
      const { runJarvisOrchestration } = await import("@/jarvis/jarvis-orchestrate");
      const out = await runJarvisOrchestration({
        scope,
        detail,
        message: input.message,
        agentTarget: agentTarget as JarvisAgentTarget | "auto",
      });
      return {
        status: out.status,
        summary: out.summary,
        findings: out.findings,
        recommendations: out.recommendations,
        agentTasks: out.agentTasks,
        requiresConfirmation: out.requiresConfirmation,
      };
    }

    case "voice-report": {
      if (!config.allowVoiceReports) {
        return {
          status: "error",
          summary: "Voice reports deshabilitados.",
          findings: [],
          recommendations: [],
          agentTasks: [],
          requiresConfirmation: false,
        };
      }
      const report = await generateJarvisReport("bot_health_report", scope, "short");
      const voice = await generateVoiceReport(report);
      return {
        status: "ok",
        summary: report.summary,
        findings: report.findings,
        recommendations: report.recommendedActions,
        agentTasks: [],
        voiceReportText: voice.text,
        voiceReportUrl: voice.audioUrl,
        requiresConfirmation: false,
      };
    }

    default:
      return {
        status: "error",
        summary: `Comando desconocido: ${input.command}`,
        findings: [],
        recommendations: [],
        agentTasks: [],
        requiresConfirmation: false,
      };
  }
}

export async function runJarvisReport(
  type: JarvisReportType,
  scope: JarvisScope = "all",
  detail: "short" | "normal" | "full" = "normal"
) {
  const report = await generateJarvisReport(type, scope, detail);
  return {
    report,
    markdown: formatReportMarkdown(report),
  };
}
