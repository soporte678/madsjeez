import type { NextRequest } from "next/server";
import { getWhatsappBotEnv } from "./config";

export type WebhookAuthResult = { ok: true; reason: string } | { ok: false; reason: string };

/** Valida webhook Evolution sin rechazar el apikey estándar del servidor Evolution. */
export function verifyEvolutionWebhookAuth(
  req: NextRequest,
  body: Record<string, unknown>
): WebhookAuthResult {
  const { webhookSecret } = getWhatsappBotEnv();
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && !webhookSecret) {
    return { ok: false, reason: "missing_EVOLUTION_WEBHOOK_SECRET_in_production" };
  }

  if (!webhookSecret) {
    return { ok: true, reason: "dev_no_webhook_secret" };
  }

  const customHeader = req.headers.get("x-madsjeez-webhook-secret");
  if (customHeader === webhookSecret) {
    return { ok: true, reason: "header_x_madsjeez_webhook_secret" };
  }

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (bearer === webhookSecret) {
    return { ok: true, reason: "bearer_webhook_secret" };
  }

  const evolutionApiKey = process.env.EVOLUTION_API_KEY?.trim() || "";
  const headerApiKey = req.headers.get("apikey")?.trim() || "";

  if (evolutionApiKey && headerApiKey === evolutionApiKey) {
    return { ok: true, reason: "evolution_api_key_match" };
  }

  return { ok: false, reason: "auth_mismatch" };
}

export function pickWebhookHeaders(req: NextRequest): Record<string, string> {
  const keys = [
    "content-type",
    "user-agent",
    "x-forwarded-for",
    "x-madsjeez-webhook-secret",
    "apikey",
    "authorization",
  ];
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = req.headers.get(k);
    if (v) {
      out[k] = k.includes("secret") || k === "apikey" || k === "authorization" ? "[redacted]" : v;
    }
  }
  return out;
}
