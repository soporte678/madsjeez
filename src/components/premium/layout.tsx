/**
 * Helpers de layout (server-safe, sin "use client"): contenedor de sección,
 * fondo con glow sutil (CSS, sin canvas) y grilla bento. Reusables en cualquier
 * página, incluidas las server components.
 */

import type { ReactNode } from "react";

export function SectionWrapper({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`mx-auto w-full max-w-6xl px-4 ${className}`}>{children}</section>;
}

/** Fondo con resplandor radial sutil del color de marca. CSS puro, sin canvas. */
export function GlowBackground({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_-10%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_60%)]"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export function BentoGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>{children}</div>;
}
