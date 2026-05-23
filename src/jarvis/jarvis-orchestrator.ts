import { fireAndForgetAutomationEvent } from "@/lib/automation/n8n-client";
import { getJarvisConfig } from "@/jarvis/jarvis-env";
import { routeJarvisCommand, runJarvisReport } from "@/jarvis/jarvis-router";
import type { JarvisCommandInput, JarvisCommandOutput, JarvisReportType, JarvisScope } from "@/jarvis/types";

export type JarvisEventType =
  | "jarvis.health_check_completed"
  | "jarvis.error_detected"
  | "jarvis.improvement_suggested"
  | "jarvis.agent_task_created"
  | "jarvis.daily_report_created"
  | "jarvis.voice_report_requested";

function emitJarvisEvent(
  event: JarvisEventType,
  data: Record<string, unknown>
): void {
  const config = getJarvisConfig();
  if (!config.enabled) return;
  fireAndForgetAutomationEvent({
    event,
    channel: "web",
    data,
  });
}

export async function executeJarvisCommand(input: JarvisCommandInput): Promise<JarvisCommandOutput> {
  const result = await routeJarvisCommand(input);

  if (result.status === "ok") {
    if (input.command === "health") {
      emitJarvisEvent("jarvis.health_check_completed", { summary: result.summary, scope: input.scope });
    }
    if (input.command === "detect-errors" && result.findings.length) {
      emitJarvisEvent("jarvis.error_detected", { count: result.findings.length });
    }
    if (input.command === "suggest-improvements") {
      emitJarvisEvent("jarvis.improvement_suggested", { recommendations: result.recommendations });
    }
    if (input.command === "create-agent-task" && result.agentTasks.length) {
      emitJarvisEvent("jarvis.agent_task_created", { tasks: result.agentTasks });
    }
    if (input.command === "orchestrate" && result.agentTasks.length) {
      emitJarvisEvent("jarvis.agent_task_created", { tasks: result.agentTasks, orchestrated: true });
    }
    if (input.command === "voice-report") {
      emitJarvisEvent("jarvis.voice_report_requested", { hasAudio: Boolean(result.voiceReportUrl) });
    }
  }

  return result;
}

export async function executeJarvisReport(
  type: JarvisReportType,
  scope: JarvisScope = "all",
  detail: "short" | "normal" | "full" = "normal"
) {
  const out = await runJarvisReport(type, scope, detail);
  emitJarvisEvent("jarvis.daily_report_created", { type, reportId: out.report.reportId });
  return out;
}

export { getJarvisConfig, isJarvisEnabled } from "@/jarvis/jarvis-env";
