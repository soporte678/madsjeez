/**
 * POST /api/webhooks/paypal
 *
 * Recibe eventos PayPal y los procesa idempotentemente.
 * Verifica signature usando el endpoint de PayPal (no HMAC manual).
 *
 * Eventos relevantes:
 *  CHECKOUT.ORDER.APPROVED      → user aprobó, podemos capturar
 *  PAYMENT.CAPTURE.COMPLETED    → plata acreditada
 *  PAYMENT.CAPTURE.DENIED       → rechazado
 *  PAYMENT.CAPTURE.REFUNDED     → reembolsado
 */

import { NextResponse } from "next/server";
import { paypalFetch } from "@/lib/paypal/client";
import { supabaseService } from "@/lib/supabase/service";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type PaypalWebhookEvent = {
  id: string;
  event_type: string;
  resource_type?: string;
  resource?: { id?: string; status?: string; [k: string]: unknown };
  [k: string]: unknown;
};

async function verifySignature(req: Request, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (!webhookId) {
    logger.warn("paypal webhook: PAYPAL_WEBHOOK_ID no seteado, aceptando sin verificar");
    return true;
  }
  const h = req.headers;
  const payload = {
    transmission_id: h.get("paypal-transmission-id"),
    transmission_time: h.get("paypal-transmission-time"),
    cert_url: h.get("paypal-cert-url"),
    auth_algo: h.get("paypal-auth-algo"),
    transmission_sig: h.get("paypal-transmission-sig"),
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody) as unknown,
  };
  const res = await paypalFetch("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) return false;
  const j = (await res.json()) as { verification_status?: string };
  return j.verification_status === "SUCCESS";
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  // Verificación de firma
  const ok = await verifySignature(req, rawBody);
  if (!ok) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PaypalWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PaypalWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  // Idempotencia: si ya procesamos este event_id devolvemos OK sin hacer nada
  const { data: existing } = await supabaseService
    .from("paypal_webhook_processed")
    .select("webhook_event_id")
    .eq("webhook_event_id", event.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Persistir + procesar
  await supabaseService.from("paypal_webhook_processed").insert({
    webhook_event_id: event.id,
    event_type: event.event_type,
    resource_id: event.resource?.id ?? null,
    status: typeof event.resource?.status === "string" ? event.resource.status : null,
    raw_payload: event as unknown as object,
  });

  logger.info("paypal webhook:", {
    event: event.event_type,
    resourceId: event.resource?.id,
    status: event.resource?.status,
  });

  // TODO: aquí mapear event.resource.id a la order de Madsjeez y actualizar status.
  // Por ahora solo loguemos para que la integración funcione end-to-end y veamos
  // qué payloads llegan reales.

  return NextResponse.json({ received: true });
}
