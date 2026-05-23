export type JarvisConfig = {
  enabled: boolean;
  readOnly: boolean;
  allowAgentTasks: boolean;
  allowCodeChanges: boolean;
  allowDeploy: boolean;
  allowVoiceReports: boolean;
  requireConfirmation: boolean;
  modelFast: string;
  modelNormal: string;
  modelSmart: string;
  /** @deprecated Prefer modelNormal / modelSmart via router */
  modelReport: string;
  voiceEnabled: boolean;
  voiceProvider: string | null;
  voiceProfile: "atlas" | "nova";
  voiceOnlyOnRequest: boolean;
  apiSecret: string | null;
};

export type JarvisModelTier = "fast" | "normal" | "smart";

function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === "") return defaultValue;
  return value.trim().toLowerCase() === "true";
}

function envInt(key: string, fallback: number): number {
  const n = parseInt(process.env[key] ?? String(fallback), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function getJarvisRouterEnv() {
  const modelFast = process.env.JARVIS_MODEL_FAST?.trim() || "qwen2.5:3b";
  const modelNormal = process.env.JARVIS_MODEL_NORMAL?.trim() || "qwen2.5:7b";
  const modelSmartBase = process.env.JARVIS_MODEL_SMART?.trim() || "qwen3:14b";
  const modelReport = process.env.JARVIS_MODEL_REPORT?.trim() || modelSmartBase;

  return {
    routerEnabled: parseBool(process.env.JARVIS_MODEL_ROUTER_ENABLED, true),
    escalateTo14b: parseBool(process.env.JARVIS_ESCALATE_TO_14B, true),
    modelFast,
    modelNormal,
    modelSmart: modelReport,
    modelReport,
    numCtx: {
      fast: envInt("JARVIS_NUM_CTX_FAST", 1024),
      normal: envInt("JARVIS_NUM_CTX_NORMAL", 2048),
      smart: envInt("JARVIS_NUM_CTX_SMART", 4096),
    },
    numPredict: {
      fast: envInt("JARVIS_NUM_PREDICT_FAST", 80),
      normal: envInt("JARVIS_NUM_PREDICT_NORMAL", 200),
      smart: envInt("JARVIS_NUM_PREDICT_SMART", 400),
    },
    timeoutMs: {
      fast: envInt("JARVIS_TIMEOUT_FAST_MS", 15_000),
      normal: envInt("JARVIS_TIMEOUT_NORMAL_MS", 60_000),
      smart: envInt("JARVIS_TIMEOUT_SMART_MS", 120_000),
    },
  };
}

export function modelForJarvisTier(tier: JarvisModelTier): string {
  const env = getJarvisRouterEnv();
  if (tier === "fast") return env.modelFast;
  if (tier === "normal") return env.modelNormal;
  return env.modelSmart;
}

export function getJarvisConfig(): JarvisConfig {
  const router = getJarvisRouterEnv();
  const profile = process.env.JARVIS_VOICE_PROFILE?.trim().toLowerCase();
  return {
    enabled: parseBool(process.env.JARVIS_ENABLED, false),
    readOnly: parseBool(process.env.JARVIS_READ_ONLY, true),
    allowAgentTasks: parseBool(process.env.JARVIS_ALLOW_AGENT_TASKS, true),
    allowCodeChanges: parseBool(process.env.JARVIS_ALLOW_CODE_CHANGES, false),
    allowDeploy: parseBool(process.env.JARVIS_ALLOW_DEPLOY, false),
    allowVoiceReports: parseBool(process.env.JARVIS_ALLOW_VOICE_REPORTS, true),
    requireConfirmation: parseBool(process.env.JARVIS_REQUIRE_CONFIRMATION, true),
    modelFast: router.modelFast,
    modelNormal: router.modelNormal,
    modelSmart: router.modelSmart,
    modelReport: router.modelReport,
    voiceEnabled: parseBool(process.env.JARVIS_VOICE_ENABLED, false),
    voiceProvider: process.env.JARVIS_VOICE_PROVIDER?.trim() || null,
    voiceProfile: profile === "nova" ? "nova" : "atlas",
    voiceOnlyOnRequest: parseBool(process.env.JARVIS_VOICE_ONLY_ON_REQUEST, true),
    apiSecret: process.env.JARVIS_API_SECRET?.trim() || null,
  };
}

export function isJarvisEnabled(): boolean {
  return getJarvisConfig().enabled;
}
