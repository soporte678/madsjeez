import { randomUUID } from "crypto";
import { hashForMeta, hashPhoneForMeta } from "./hash";
import { logger } from "@/lib/logger";

const META_GRAPH_VERSION = "v21.0";

function readPixelId(): string {
  return (process.env.NEXT_PUBLIC_META_PIXEL_ID || "").trim();
}
function readCapiToken(): string {
  return (process.env.META_CAPI_ACCESS_TOKEN || "").trim();
}
function readTestEventCode(): string {
  return (process.env.META_TEST_EVENT_CODE || "").trim();
}

export type MetaUserData = {
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
};

export type SendMetaEventInput = {
  eventName:
    | "PageView"
    | "ViewContent"
    | "AddToCart"
    | "InitiateCheckout"
    | "AddPaymentInfo"
    | "Purchase"
    | "Lead"
    | "CompleteRegistration"
    | "Search"
    | "Contact"
    | (string & {});
  eventId?: string;
  eventTime?: number;
  eventSourceUrl?: string;
  actionSource?:
    | "website"
    | "email"
    | "app"
    | "phone_call"
    | "chat"
    | "physical_store"
    | "system_generated"
    | "other";
  userData?: MetaUserData;
  customData?: Record<string, unknown>;
};

export type SendMetaEventResult =
  | { ok: true; eventId: string; fbtraceId?: string }
  | { ok: false; eventId: string; error: string };

function buildUserData(input: MetaUserData) {
  const ud: Record<string, unknown> = {};
  const em = hashForMeta(input.email);
  if (em) ud.em = [em];
  const ph = hashPhoneForMeta(input.phone);
  if (ph) ud.ph = [ph];
  const externalId = hashForMeta(input.externalId);
  if (externalId) ud.external_id = [externalId];
  const fn = hashForMeta(input.firstName);
  if (fn) ud.fn = [fn];
  const ln = hashForMeta(input.lastName);
  if (ln) ud.ln = [ln];
  const ct = hashForMeta(input.city);
  if (ct) ud.ct = [ct];
  const st = hashForMeta(input.state);
  if (st) ud.st = [st];
  const zp = hashForMeta(input.zip);
  if (zp) ud.zp = [zp];
  const country = hashForMeta(input.country);
  if (country) ud.country = [country];
  if (input.clientIp) ud.client_ip_address = input.clientIp;
  if (input.userAgent) ud.client_user_agent = input.userAgent;
  if (input.fbp) ud.fbp = input.fbp;
  if (input.fbc) ud.fbc = input.fbc;
  return ud;
}

/**
 * Send a server-side event to Meta Conversions API.
 *
 * SAFE TO CALL ONLY FROM SERVER CONTEXT — webhooks, server actions, API routes triggered
 * by trusted internal callers. NEVER expose this through a public POST route (would let
 * anyone spam fake Purchase events and pollute attribution / get the pixel flagged).
 *
 * Returns `{ ok, eventId }`. Pair the returned `eventId` with the client-side
 * Pixel `fbq('track', name, params, { eventID })` to enable Meta's deduplication.
 *
 * Never throws — always returns a result object. Caller should not fail their flow if CAPI fails.
 */
export async function sendMetaCapiEvent(input: SendMetaEventInput): Promise<SendMetaEventResult> {
  const eventId = input.eventId || randomUUID();
  const pixelId = readPixelId();
  const capiToken = readCapiToken();

  if (!pixelId || !capiToken) {
    return {
      ok: false,
      eventId,
      error: "META_PIXEL_ID or META_CAPI_ACCESS_TOKEN missing",
    };
  }

  const event = {
    event_name: input.eventName,
    event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: input.eventSourceUrl,
    action_source: input.actionSource ?? "website",
    user_data: buildUserData(input.userData ?? {}),
    custom_data: input.customData ?? {},
  };

  const payload: Record<string, unknown> = { data: [event] };
  const testCode = readTestEventCode();
  if (testCode) payload.test_event_code = testCode;

  const endpoint = `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(
    capiToken,
  )}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      logger.warn("Meta CAPI event failed", {
        eventName: input.eventName,
        eventId,
        httpStatus: res.status,
        bodyPreview: errText.slice(0, 300),
      });
      return { ok: false, eventId, error: `HTTP ${res.status}` };
    }
    const data = (await res.json().catch(() => ({}))) as { fbtrace_id?: string };
    return { ok: true, eventId, fbtraceId: data.fbtrace_id };
  } catch (e) {
    logger.warn("Meta CAPI event exception", {
      eventName: input.eventName,
      eventId,
      message: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, eventId, error: e instanceof Error ? e.message : "unknown" };
  }
}

export function isCapiConfigured(): boolean {
  return Boolean(readPixelId() && readCapiToken());
}
