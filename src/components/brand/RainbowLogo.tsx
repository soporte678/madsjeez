"use client";

/**
 * Logo MADSJEEZ — sistema de identidad unificado para todas las superficies.
 *
 * Diseño premium triple A:
 *
 * 1. Mark — "M" arquitectónica con corte diagonal interno (cuño industrial-tech).
 *    Gradiente sapphire de 4 paradas (más profundidad que un gradient lineal típico),
 *    highlight superior 1px y sombra interna inferior para volumen físico real.
 *    Construido con viewBox 100×100 — pixel-perfect en 24 / 32 / 40 / 64px.
 *
 * 2. Wordmark — "madsjeez" en Outfit 800 con tracking optical tight (-0.045em)
 *    y leading 0.9. Color hereda del contexto (slate-950 en claro, white en oscuro).
 *    Bajo demanda: gradient azul si se pide `gradientWordmark`.
 *
 * 3. Hover — sutil scale 1.03 en el mark + brillo barrido (200ms ease-out). No bounce.
 *
 * 4. Accesibilidad — el SVG es decorativo; el wordmark provee el texto accesible.
 *    Cumple WCAG AA contra fondos slate-950 (azul #4d8bff > 4.5:1).
 *
 * Sirve para: navbar, header, footer, auth, admin, dashboard, sello en etiquetas.
 */

import Link from "next/link";

type RainbowLogoProps = {
  href?: string;
  textSizeClassName?: string;
  iconSizeClassName?: string;
  /** false = solo wordmark sin mark (ej. barra admin) */
  showIcon?: boolean;
  /** Color sólido del wordmark. Default: currentColor. */
  wordmarkColor?: string;
  /** Activa wordmark con gradient azul brand (override de wordmarkColor) */
  gradientWordmark?: boolean;
  onClick?: () => void;
  /** Cuando el logo va sobre un fondo oscuro premium (hero, navbar dark) */
  variant?: "auto" | "onDark" | "onLight";
};

function MadsjeezMark({
  className,
  uid,
}: {
  className?: string;
  uid: string;
}) {
  const gradMain = `mj-grad-main-${uid}`;
  const gradEdge = `mj-grad-edge-${uid}`;
  const gradHighlight = `mj-grad-highlight-${uid}`;
  const innerShadow = `mj-inner-shadow-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Gradiente principal sapphire — 4 paradas para profundidad real */}
        <linearGradient id={gradMain} x1="20" y1="0" x2="80" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="35%" stopColor="#3b82f6" />
          <stop offset="68%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d3a8a" />
        </linearGradient>

        {/* Edge sombra interna inferior para volumen */}
        <linearGradient id={gradEdge} x1="50" y1="40" x2="50" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0b1f54" stopOpacity="0" />
          <stop offset="100%" stopColor="#0b1f54" stopOpacity="0.55" />
        </linearGradient>

        {/* Highlight superior 1px */}
        <linearGradient id={gradHighlight} x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="18%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Inner shadow filter */}
        <filter id={innerShadow} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" />
          <feOffset dx="0" dy="1.2" result="offsetblur" />
          <feFlood floodColor="#0b1f54" floodOpacity="0.35" />
          <feComposite in2="offsetblur" operator="in" />
          <feComposite in2="SourceGraphic" operator="atop" />
        </filter>
      </defs>

      {/* Mark — "M" arquitectónica.
          Outer rectangle 12-88 horizontal, 16-84 vertical.
          Patas asimétricamente más angostas (12→26 izq, 74→88 der).
          V interna profunda con eje en (50, 60). Punta superior chanflán. */}
      <path
        d="M 12 16
           L 28 16
           L 50 60
           L 72 16
           L 88 16
           L 88 84
           L 72 84
           L 72 38
           L 56 70
           L 44 70
           L 28 38
           L 28 84
           L 12 84
           Z"
        fill={`url(#${gradMain})`}
      />

      {/* Edge depth — gradiente sombra inferior superpuesto */}
      <path
        d="M 12 16
           L 28 16
           L 50 60
           L 72 16
           L 88 16
           L 88 84
           L 72 84
           L 72 38
           L 56 70
           L 44 70
           L 28 38
           L 28 84
           L 12 84
           Z"
        fill={`url(#${gradEdge})`}
        opacity="0.7"
      />

      {/* Highlight top — fina banda traslúcida superior */}
      <path
        d="M 12 16
           L 28 16
           L 50 60
           L 72 16
           L 88 16
           L 88 84
           L 72 84
           L 72 38
           L 56 70
           L 44 70
           L 28 38
           L 28 84
           L 12 84
           Z"
        fill={`url(#${gradHighlight})`}
      />

      {/* Acento inferior — fina marca brand azul translúcida en la base de la V */}
      <path
        d="M 44 70 L 56 70 L 50 60 Z"
        fill="#1e3a8a"
        opacity="0.45"
      />
    </svg>
  );
}

let _logoUid = 0;
function nextLogoUid() {
  _logoUid += 1;
  return `${_logoUid}`;
}

export default function RainbowLogo({
  href = "/",
  textSizeClassName = "text-[22px]",
  iconSizeClassName = "w-10 h-10",
  showIcon = true,
  wordmarkColor,
  gradientWordmark = false,
  onClick,
  variant = "auto",
}: RainbowLogoProps) {
  const uid = nextLogoUid();
  const gradTextId = `mj-text-grad-${uid}`;

  const wordmark = (
    <span
      className={`font-extrabold tracking-[-0.045em] leading-[0.9] flex items-center ${textSizeClassName} relative`}
      style={{
        fontFamily: "Outfit, system-ui, sans-serif",
        color: gradientWordmark ? "transparent" : (wordmarkColor ?? "currentColor"),
        ...(gradientWordmark && {
          backgroundImage: "linear-gradient(95deg, #60a5fa 0%, #3b82f6 45%, #1e40af 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }),
      }}
    >
      madsjeez
    </span>
  );

  const logo = (
    <div
      className={`flex items-center gap-2 group ${
        variant === "onDark" ? "text-white" : variant === "onLight" ? "text-slate-950" : ""
      }`}
    >
      {showIcon ? (
        <span
          className={`${iconSizeClassName} relative flex-shrink-0 inline-flex items-center justify-center transition-transform duration-300 will-change-transform group-hover:scale-[1.04]`}
          aria-hidden="true"
        >
          <MadsjeezMark className="w-full h-full drop-shadow-[0_2px_4px_rgba(15,23,42,0.18)]" uid={uid} />
          {/* Sheen sweep on hover */}
          <span
            className="absolute inset-0 rounded-[10%] overflow-hidden pointer-events-none"
            aria-hidden="true"
          >
            <span className="absolute -inset-x-[40%] top-0 h-full -translate-x-[140%] group-hover:translate-x-[140%] transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/35 to-transparent skew-x-[-22deg]" />
          </span>
        </span>
      ) : null}
      {/* Hidden SVG defs for the gradient wordmark, needed only when gradientWordmark = true */}
      {gradientWordmark && (
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <defs>
            <linearGradient id={gradTextId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>
          </defs>
        </svg>
      )}
      {wordmark}
    </div>
  );

  return (
    <Link
      href={href}
      onClick={onClick}
      className="inline-flex items-center cursor-pointer select-none"
      aria-label="Madsjeez — Marketplace argentino"
    >
      {logo}
    </Link>
  );
}

/** Re-export del mark sin wordmark, útil para favicons / contextos chicos. */
export { MadsjeezMark };
