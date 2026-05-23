import { getWhatsappBotEnv } from "@/lib/whatsapp-bot/config";

export const MANDATORY_FALLBACK_MESSAGE =
  "Gracias por escribir. Ya recibimos tu consulta y te responde un vendedor en breve.";

function envBool(key: string, defaultValue = false): boolean {
  const v = process.env[key]?.trim().toLowerCase();
  if (v === undefined || v === "") return defaultValue;
  return v === "true" || v === "1" || v === "yes";
}

function envInt(key: string, fallback: number): number {
  const n = parseInt(process.env[key] ?? String(fallback), 10);
  return Number.isFinite(n) ? n : fallback;
}

export type ModelTier = "classifier" | "marketplace" | "closer";

export function getModelRouterEnv() {
  const classifierModel =
    process.env.OLLAMA_CLASSIFIER_MODEL?.trim() || "qwen2.5:3b";
  const marketplaceModel =
    process.env.OLLAMA_MARKETPLACE_MODEL?.trim() || "qwen2.5:7b";
  const closerModel = process.env.OLLAMA_CLOSER_MODEL?.trim() || "qwen3:14b";

  return {
    routerEnabled: envBool("AI_MODEL_ROUTER_ENABLED", true),
    escalateTo14B: envBool("AI_ESCALATE_TO_14B", true),
    preloadModels: envBool("AI_PRELOAD_MODELS", true),
    warmupIntervalMinutes: envInt("AI_WARMUP_INTERVAL_MINUTES", 8),
    classifierModel,
    marketplaceModel,
    closerModel,
    keepAliveFast: process.env.OLLAMA_KEEP_ALIVE_FAST?.trim() || "30m",
    keepAliveSmart: process.env.OLLAMA_KEEP_ALIVE_SMART?.trim() || "15m",
    numCtx: {
      classifier: envInt("OLLAMA_NUM_CTX_CLASSIFIER", 1024),
      marketplace: envInt("OLLAMA_NUM_CTX_MARKETPLACE", 2048),
      closer: envInt("OLLAMA_NUM_CTX_CLOSER", 4096),
    },
    numPredict: {
      classifier: envInt("OLLAMA_NUM_PREDICT_CLASSIFIER", 80),
      marketplace: envInt("OLLAMA_NUM_PREDICT_MARKETPLACE", 140),
      closer: envInt("OLLAMA_NUM_PREDICT_CLOSER", 260),
    },
    timeoutMs: {
      classifier: envInt("AI_RESPONSE_TIMEOUT_CLASSIFIER_MS", 8000),
      marketplace: envInt("AI_RESPONSE_TIMEOUT_MARKETPLACE_MS", 18000),
      closer: envInt("AI_RESPONSE_TIMEOUT_CLOSER_MS", 35000),
    },
  };
}

export function getSalesCloserEnv() {
  const base = getWhatsappBotEnv();
  const router = getModelRouterEnv();
  const ollamaModel =
    process.env.OLLAMA_MODEL?.trim() ||
    (router.routerEnabled ? router.closerModel : "qwen3:14b");
  const ollamaNumCtx = Math.min(
    32768,
    Math.max(2048, parseInt(process.env.OLLAMA_NUM_CTX ?? "4096", 10) || 4096)
  );
  const botAutoReplyWithOllama =
    process.env.BOT_AUTO_REPLY_WITH_OLLAMA?.trim().toLowerCase() === "true";

  return {
    ...base,
    ...router,
    ollamaModel,
    ollamaNumCtx,
    botAutoReplyWithOllama,
  };
}

export function isSalesCloserAutoReplyEnabled(): boolean {
  return getSalesCloserEnv().botAutoReplyWithOllama;
}

export function modelForTier(tier: ModelTier): string {
  const env = getModelRouterEnv();
  if (tier === "classifier") return env.classifierModel;
  if (tier === "marketplace") return env.marketplaceModel;
  return env.closerModel;
}
