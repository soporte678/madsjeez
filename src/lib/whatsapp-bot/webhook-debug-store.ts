export type WebhookDebugEntry = {
  at: string;
  method: string;
  ip: string;
  auth: string;
  event?: string;
  instanceName?: string;
  phone?: string;
  textPreview?: string;
  parseStatus?: string;
  saveStatus?: string;
  error?: string;
  headersPreview?: Record<string, string>;
  bodyPreview?: string;
};

const MAX = 30;
const log: WebhookDebugEntry[] = [];

export function recordWebhookDebug(entry: WebhookDebugEntry): void {
  log.unshift(entry);
  if (log.length > MAX) log.length = MAX;
  console.info("[whatsapp-webhook]", JSON.stringify(entry));
}

export function getWebhookDebugLog(): WebhookDebugEntry[] {
  return [...log];
}

export function getExpectedWebhookUrl(): string {
  const appBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${appBase}/api/webhooks/evolution`;
}
