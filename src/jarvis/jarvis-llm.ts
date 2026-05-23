import { callJarvisOllama } from "@/jarvis/jarvis-ollama";
import {
  resolveJarvisModelSelection,
  type JarvisModelSelection,
} from "@/jarvis/jarvis-model-router";
import { JARVIS_SYSTEM_PROMPT } from "@/jarvis/prompts/jarvis-system";
import type { JarvisCommand, JarvisDetail, JarvisScope } from "@/jarvis/types";

export type JarvisLlmEnhanceResult = {
  text: string;
  selection: JarvisModelSelection;
  latencyMs: number;
  escalated: boolean;
};

export async function enhanceWithJarvisLlm(params: {
  command: JarvisCommand;
  scope: JarvisScope;
  detail: JarvisDetail;
  userContent: string;
  criticalFindings?: boolean;
  message?: string;
}): Promise<JarvisLlmEnhanceResult | null> {
  const selection = await resolveJarvisModelSelection({
    command: params.command,
    scope: params.scope,
    detail: params.detail,
    criticalFindings: params.criticalFindings,
    message: params.message,
  });

  if (selection.skipLlm) return null;

  try {
    const result = await callJarvisOllama({
      tier: selection.tier,
      system: `${JARVIS_SYSTEM_PROMPT}\n\nRespondé en español argentino, conciso, sin secretos ni credenciales.`,
      prompt: params.userContent,
      command: params.command,
      scope: params.scope,
      reason: selection.reason,
    });
    return {
      text: result.text.trim(),
      selection,
      latencyMs: result.latencyMs,
      escalated: result.escalated,
    };
  } catch {
    return null;
  }
}

export function reportTypeToCommand(
  type: string
): JarvisCommand {
  if (type.includes("error")) return "detect-errors";
  if (type.includes("improvement")) return "suggest-improvements";
  if (type.includes("health")) return "health";
  return "audit-marketplace";
}
