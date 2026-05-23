import { getJarvisConfig } from "@/jarvis/jarvis-env";
import { saveJarvisVoiceReport } from "@/jarvis/jarvis-memory";
import { VOICE_REPORT_PROMPT_ATLAS, VOICE_REPORT_PROMPT_NOVA } from "@/jarvis/prompts/voice-report";
import type { JarvisReportResult } from "@/jarvis/jarvis-reports";

export type VoiceReportResult = {
  text: string;
  profile: "atlas" | "nova";
  audioUrl?: string;
  ttsConfigured: boolean;
  voiceReportId?: string;
};

function buildVoiceScript(report: Pick<JarvisReportResult, "summary" | "problems" | "recommendedActions">): string {
  const problemLine = report.problems.length
    ? `Atención: ${report.problems[0]}`
    : "Todo estable en el chequeo rápido.";
  const actionLine = report.recommendedActions.length
    ? `Prioridad: ${report.recommendedActions[0]}`
    : "Seguí monitoreando sin cambios urgentes.";
  return `Informe Jarvis. ${report.summary} ${problemLine} ${actionLine}`;
}

export async function generateVoiceReport(
  report: Pick<JarvisReportResult, "summary" | "problems" | "recommendedActions">
): Promise<VoiceReportResult> {
  const config = getJarvisConfig();
  const profile = config.voiceProfile;
  const styleHint = profile === "nova" ? VOICE_REPORT_PROMPT_NOVA : VOICE_REPORT_PROMPT_ATLAS;

  let text = buildVoiceScript(report);
  if (config.voiceEnabled && config.voiceProvider) {
    // TTS externo opcional — solo texto por defecto; integración plug-in futura
    text = `${text}\n\n[${styleHint.split(".")[0]}]`;
  }

  const ttsConfigured = Boolean(config.voiceEnabled && config.voiceProvider);
  let audioUrl: string | undefined;

  const voiceReportId = await saveJarvisVoiceReport(text, profile, audioUrl);

  return {
    text,
    profile,
    audioUrl,
    ttsConfigured,
    voiceReportId,
  };
}
