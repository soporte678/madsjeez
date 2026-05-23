import { chatOllama } from "@/lib/ai/ollama-client";
import type { ChatMessage } from "@/lib/ai/types";
import { saveJarvisAiLog } from "@/jarvis/jarvis-ai-log";
import {
  getJarvisRouterEnv,
  modelForJarvisTier,
  type JarvisModelTier,
} from "@/jarvis/jarvis-env";

export type JarvisOllamaResult = {
  text: string;
  model: string;
  tier: JarvisModelTier;
  latencyMs: number;
  escalated: boolean;
};

export type JarvisOllamaParams = {
  tier: JarvisModelTier;
  prompt: string;
  system?: string;
  maxTokens?: number;
  format?: "json";
  /** Initial tier before escalation (for logging). */
  initialTier?: JarvisModelTier;
  command?: string;
  scope?: string;
  reason?: string;
  skipLog?: boolean;
};

function botTierForJarvis(tier: JarvisModelTier): "classifier" | "marketplace" | "closer" {
  if (tier === "fast") return "classifier";
  if (tier === "normal") return "marketplace";
  return "closer";
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function callJarvisOllama(params: JarvisOllamaParams): Promise<JarvisOllamaResult> {
  const env = getJarvisRouterEnv();
  const tier = params.tier;
  const model = modelForJarvisTier(tier);
  const messages: ChatMessage[] = [];
  if (params.system) {
    messages.push({ role: "system", content: params.system });
  }
  messages.push({ role: "user", content: params.prompt });

  const started = Date.now();
  let result: { raw: string; model: string; latencyMs: number };
  let escalated = false;
  let usedTier = tier;

  try {
    result = await chatOllama({
      model,
      tier: botTierForJarvis(tier),
      messages,
      format: params.format,
      numCtx: env.numCtx[tier],
      numPredict: params.maxTokens ?? env.numPredict[tier],
      timeoutMs: env.timeoutMs[tier],
      temperature: tier === "fast" ? 0.1 : 0.3,
    });
  } catch (firstError) {
    if (
      env.escalateTo14b &&
      tier !== "smart" &&
      (tier === "fast" || tier === "normal")
    ) {
      usedTier = "smart";
      escalated = true;
      const smartModel = modelForJarvisTier("smart");
      result = await chatOllama({
        model: smartModel,
        tier: "closer",
        messages,
        format: params.format,
        numCtx: env.numCtx.smart,
        numPredict: params.maxTokens ?? env.numPredict.smart,
        timeoutMs: env.timeoutMs.smart,
        temperature: 0.25,
      });
    } else {
      throw firstError;
    }
  }

  const latencyMs = Date.now() - started;
  const logReason = params.reason ?? (escalated ? "escalated_after_failure" : `jarvis_${usedTier}`);

  if (!params.skipLog) {
    saveJarvisAiLog({
      command: params.command,
      scope: params.scope,
      tier: usedTier,
      model: result.model,
      reason: logReason,
      latencyMs,
      escalatedTo14b: escalated,
      promptTokensEstimate: estimateTokens(params.prompt + (params.system ?? "")),
    });
  }

  return {
    text: result.raw,
    model: result.model,
    tier: usedTier,
    latencyMs,
    escalated,
  };
}
