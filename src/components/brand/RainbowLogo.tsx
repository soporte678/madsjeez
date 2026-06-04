"use client";

/**
 * Logo MADSJEEZ — mark vectorial transparente + wordmark.
 *
 * El nombre del componente quedó como "RainbowLogo" por historia (antes
 * eran letras de colores), pero ahora es el nuevo logo monocromo azul
 * sin fondo, que escala limpio en navbar, footer, headers, etc.
 *
 * El SVG va inline para que el color del wordmark se herede del entorno
 * (slate-900 en light, white en dark) y el mark mantenga su gradiente
 * azul intacto. Sin background. Sin marco. Sin sombra.
 */

import Link from "next/link";

type RainbowLogoProps = {
  href?: string;
  textSizeClassName?: string;
  iconSizeClassName?: string;
  /** false = solo wordmark sin mark (ej. barra admin) */
  showIcon?: boolean;
  /** Color del wordmark. Default hereda currentColor (slate-900 / white). */
  wordmarkColor?: string;
  onClick?: () => void;
};

function MadsjeezMark({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mj-grad-rl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="55%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="mj-grad-rl-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <path d="M 12 14 L 30 14 L 52 54 L 30 38 L 30 86 L 12 86 Z" fill="url(#mj-grad-rl)" />
      <path d="M 88 14 L 70 14 L 48 54 L 70 38 L 70 86 L 88 86 Z" fill="url(#mj-grad-rl)" />
      <path d="M 70 50 L 70 68 L 50 68 L 60 52 Z" fill="url(#mj-grad-rl-dark)" />
    </svg>
  );
}

export default function RainbowLogo({
  href = "/",
  textSizeClassName = "text-[22px]",
  iconSizeClassName = "w-10 h-10",
  showIcon = true,
  wordmarkColor,
  onClick,
}: RainbowLogoProps) {
  const logo = (
    <div className="flex items-center gap-2.5 group">
      {showIcon ? (
        <MadsjeezMark
          className={`${iconSizeClassName} flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}
        />
      ) : null}
      <span
        className={`font-black tracking-[-0.04em] leading-none flex items-center ${textSizeClassName}`}
        style={{
          fontFamily: "Outfit, system-ui, sans-serif",
          color: wordmarkColor ?? "currentColor",
        }}
      >
        Madsjeez
      </span>
    </div>
  );

  return (
    <Link href={href} onClick={onClick} className="inline-flex items-center cursor-pointer">
      {logo}
    </Link>
  );
}

/** Re-export del mark sin wordmark, útil para favicons / contextos chicos. */
export { MadsjeezMark };
