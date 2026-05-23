export type N8nAutomationConfig = {
  enabled: boolean;
  fireAndForget: boolean;
  webhookBaseUrl: string | null;
  automationSecret: string | null;
  timeoutMs: number;
};

function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === "") return defaultValue;
  return value.trim().toLowerCase() === "true";
}

function parseTimeoutMs(value: string | undefined): number {
  const n = parseInt(value ?? "3000", 10);
  if (!Number.isFinite(n) || n < 500) return 3000;
  return Math.min(n, 10_000);
}

export function getN8nAutomationConfig(): N8nAutomationConfig {
  const webhookBaseUrl = process.env.N8N_WEBHOOK_BASE_URL?.trim() || null;
  const automationSecret = process.env.N8N_AUTOMATION_SECRET?.trim() || null;

  return {
    enabled: parseBool(process.env.N8N_ENABLED, false),
    fireAndForget: parseBool(process.env.N8N_FIRE_AND_FORGET, true),
    webhookBaseUrl,
    automationSecret,
    timeoutMs: parseTimeoutMs(process.env.N8N_TIMEOUT_MS),
  };
}

export function isN8nAutomationConfigured(config: N8nAutomationConfig = getN8nAutomationConfig()): boolean {
  return Boolean(config.enabled && config.webhookBaseUrl && config.automationSecret);
}
