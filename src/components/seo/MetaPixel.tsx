"use client";

import Script from "next/script";

// Hardcoded fallback because Next.js 16 + Turbopack inlining of NEXT_PUBLIC env vars
// was failing in Railway build container. Pixel ID is public (visible in HTML), safe to commit.
const PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "721555964309964").trim();

/**
 * Meta Pixel base script. Renders nothing when NEXT_PUBLIC_META_PIXEL_ID is unset
 * (e.g. local dev without the var) so it never errors in build.
 *
 * Mount once inside <body> of the root layout. Fires PageView automatically on first
 * paint; SPA navigations in the App Router do NOT trigger a fresh PageView — fire one
 * manually via `trackMetaEvent('PageView')` in components that handle route changes
 * if you want per-route attribution.
 */
export function MetaPixel() {
  if (!PIXEL_ID) return null;

  return (
    <>
      <Script
        id="meta-pixel-base"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${PIXEL_ID}');fbq('track', 'PageView');`,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}

type FbqFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: FbqFn;
  }
}

/**
 * Fire a standard Meta event from client code.
 *
 * If you pair this with a server-side CAPI event using the same `eventId`,
 * Meta automatically deduplicates the two — best practice for Purchase events.
 *
 * Safe to call anywhere — silently no-ops if fbq is unavailable.
 */
export function trackMetaEvent(
  name:
    | "PageView"
    | "ViewContent"
    | "Search"
    | "AddToCart"
    | "AddToWishlist"
    | "InitiateCheckout"
    | "AddPaymentInfo"
    | "Purchase"
    | "Lead"
    | "CompleteRegistration"
    | "Contact"
    | (string & {}),
  params?: Record<string, unknown>,
  eventId?: string,
): void {
  if (typeof window === "undefined") return;
  const fbq = window.fbq;
  if (!fbq) return;
  try {
    if (eventId) {
      fbq("track", name, params || {}, { eventID: eventId });
    } else {
      fbq("track", name, params || {});
    }
  } catch {
    // Analytics must never break user flow
  }
}

/**
 * Fire a custom (non-standard) Meta event.
 */
export function trackMetaCustomEvent(
  name: string,
  params?: Record<string, unknown>,
  eventId?: string,
): void {
  if (typeof window === "undefined") return;
  const fbq = window.fbq;
  if (!fbq) return;
  try {
    if (eventId) {
      fbq("trackCustom", name, params || {}, { eventID: eventId });
    } else {
      fbq("trackCustom", name, params || {});
    }
  } catch {
    // noop
  }
}
