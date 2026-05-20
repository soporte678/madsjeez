"use client";

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

function shouldUseDebugMode() {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  return (
    params.has("gtm_debug") ||
    params.has("_dbg") ||
    params.has("gtm_preview") ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

function ensureGtag() {
  if (typeof window === "undefined") return null;

  window.dataLayer = window.dataLayer || [];

  if (typeof window.gtag !== "function") {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(args as unknown as Record<string, unknown>);
    };
  }

  return window.gtag;
}

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
  item_brand?: string;
};

export const ANALYTICS_CURRENCY = "ARS";

const INTERNAL_ANALYTICS_EVENTS = new Set([
  "view_item",
  "add_to_cart",
  "view_cart",
  "remove_from_cart",
  "begin_checkout",
  "add_shipping_info",
  "add_payment_info",
  "purchase",
  "generate_lead",
  "sign_up",
  "login",
  "contact_whatsapp",
]);

export function buildAnalyticsItem(params: {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  category?: string | null;
  brand?: string | null;
}): AnalyticsItem {
  return {
    item_id: params.id,
    item_name: params.name,
    price: Number(params.price || 0),
    quantity: Number(params.quantity || 1),
    ...(params.category ? { item_category: params.category } : {}),
    ...(params.brand ? { item_brand: params.brand } : {}),
  };
}

export function trackEvent(
  eventName: string,
  params: Record<string, unknown> = {}
) {
  if (typeof window === "undefined") return;

  const { ecommerce: rawEcommerce, ...restParams } = params;
  const ecommerce =
    rawEcommerce && typeof rawEcommerce === "object"
      ? (rawEcommerce as Record<string, unknown>)
      : null;
  const payload = shouldUseDebugMode()
    ? { ...restParams, debug_mode: true }
    : restParams;

  window.dataLayer = window.dataLayer || [];
  if (ecommerce) {
    window.dataLayer.push({ ecommerce: null });
  }
  window.dataLayer.push({
    event: eventName,
    ...payload,
    ...(ecommerce ? { ecommerce } : {}),
  });

  const gtag = ensureGtag();
  if (typeof gtag === "function") {
    gtag("event", eventName, ecommerce ? { ...payload, ...ecommerce } : payload);
  }

  if (INTERNAL_ANALYTICS_EVENTS.has(eventName)) {
    const body = JSON.stringify({
      eventName,
      path: window.location.pathname,
      referrer: document.referrer || null,
    });

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/traffic/track",
          new Blob([body], { type: "application/json" })
        );
      } else {
        fetch("/api/traffic/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => null);
      }
    } catch {
      // non-blocking internal analytics mirror
    }
  }
}
