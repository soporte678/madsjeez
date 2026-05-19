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

  const ecommerce =
    params.ecommerce && typeof params.ecommerce === "object"
      ? (params.ecommerce as Record<string, unknown>)
      : null;
  const payload = shouldUseDebugMode()
    ? { ...params, debug_mode: true }
    : params;

  window.dataLayer = window.dataLayer || [];
  if (ecommerce) {
    window.dataLayer.push({ ecommerce: null });
  }
  window.dataLayer.push({
    event: eventName,
    ...payload,
  });

  const gtag = ensureGtag();
  if (typeof gtag === "function") {
    gtag(
      "event",
      eventName,
      ecommerce ? { ...payload, ...ecommerce } : payload
    );
  }
}
