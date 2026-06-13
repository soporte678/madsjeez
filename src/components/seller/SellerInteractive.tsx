"use client";

/**
 * CTAs interactivos con medición. El FAQ usa <details> nativo (server) y no
 * necesita JS, así que acá viven sólo los botones que disparan eventos.
 */

import Link from "next/link";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { ArrowRight } from "lucide-react";

const WHATSAPP_NUMBER = "5491121816064";

/** Dispara seller_page_view al montar la landing (una sola vez por vista). */
export function SellerPageView({ source }: { source: string }) {
  useEffect(() => {
    trackEvent("seller_page_view", { source });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

type CtaProps = {
  href: string;
  children: React.ReactNode;
  source: string;
  /** evento de analytics; default seller_cta_click */
  event?: string;
  variant?: "primary" | "secondary";
  className?: string;
};

/** Botón/Link de CTA que dispara un evento al hacer click. */
export function SellerCtaButton({ href, children, source, event = "seller_cta_click", variant = "primary", className = "" }: CtaProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition";
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
      : "border border-border bg-card text-foreground hover:bg-muted";
  const isAnchor = href.startsWith("#");

  const onClick = () => {
    trackEvent(event, { source, target: href });
    if (event === "seller_register_click" || href.includes("/seller/register")) {
      trackEvent("seller_register_click", { source });
    }
  };

  if (isAnchor) {
    return (
      <a href={href} onClick={onClick} className={`${base} ${styles} ${className}`}>
        {children}
        {variant === "primary" && <ArrowRight className="h-4 w-4" />}
      </a>
    );
  }
  return (
    <Link href={href} onClick={onClick} className={`${base} ${styles} ${className}`}>
      {children}
      {variant === "primary" && <ArrowRight className="h-4 w-4" />}
    </Link>
  );
}

/** Botón de WhatsApp con mensaje prearmado. */
export function SellerWhatsApp({ source, label = "Escribinos por WhatsApp" }: { source: string; label?: string }) {
  const text = encodeURIComponent("Hola, quiero vender mis productos en Madsjeez. ¿Me ayudan a empezar?");
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        trackEvent("seller_whatsapp_click", { source });
        trackEvent("contact_whatsapp", { source });
      }}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[color:var(--success)] px-6 py-3 text-sm font-bold text-[color:var(--success)] transition hover:bg-[color:var(--success)]/10"
    >
      {label}
    </a>
  );
}
