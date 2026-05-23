import type { AutomationEventPayload, AutomationEventType } from "@/lib/automation/event-types";
import { getN8nAutomationConfig, isN8nAutomationConfigured } from "@/lib/automation/n8n-env";

const AUTOMATION_SECRET_HEADER = "x-automation-secret";

function normalizeWebhookBase(base: string): string {
  return base.replace(/\/+$/, "");
}

function buildWebhookUrl(base: string, event: AutomationEventType): string {
  const normalized = normalizeWebhookBase(base);
  const path = event.replace(/\./g, "-");
  return `${normalized}/${path}`;
}

function redactForLogs(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return "[invalid-url]";
  }
}

export type SendAutomationEventResult =
  | { ok: true; status: number }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped: false; reason: string; status?: number };

/**
 * Envía un evento a n8n. Nunca lanza: errores de red/timeout se registran sin secretos.
 */
export async function sendAutomationEvent(
  payload: AutomationEventPayload
): Promise<SendAutomationEventResult> {
  const config = getN8nAutomationConfig();

  if (!config.enabled) {
    return { ok: false, skipped: true, reason: "n8n_disabled" };
  }
  if (!isN8nAutomationConfigured(config)) {
    return { ok: false, skipped: true, reason: "n8n_not_configured" };
  }

  const url = buildWebhookUrl(config.webhookBaseUrl!, payload.event);
  const body = JSON.stringify({
    ...payload,
    occurredAt: payload.occurredAt ?? new Date().toISOString(),
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [AUTOMATION_SECRET_HEADER]: config.automationSecret!,
      },
      body,
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn("[n8n-automation] webhook non-ok", {
        event: payload.event,
        status: res.status,
        url: redactForLogs(url),
      });
      return { ok: false, skipped: false, reason: "http_error", status: res.status };
    }

    return { ok: true, status: res.status };
  } catch (e) {
    const reason =
      e instanceof Error && e.name === "AbortError" ? "timeout" : "network_error";
    console.warn("[n8n-automation] webhook failed", {
      event: payload.event,
      reason,
      url: redactForLogs(url),
      message: e instanceof Error ? e.message : "unknown",
    });
    return { ok: false, skipped: false, reason };
  } finally {
    clearTimeout(timer);
  }
}

/** Fire-and-forget: no bloquea el bot ni propaga errores. */
export function fireAndForgetAutomationEvent(payload: AutomationEventPayload): void {
  const config = getN8nAutomationConfig();
  if (!config.enabled) return;

  void sendAutomationEvent(payload).catch(() => {
    /* swallow — bot must continue */
  });
}

export { AUTOMATION_SECRET_HEADER };
