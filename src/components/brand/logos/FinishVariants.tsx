/**
 * El mismo mark Madsjeez en 7 acabados.
 * Toda la geometria es identica — solo cambia el material/finish via fills.
 */

type FinishProps = {
  size?: number;
};

const PATH_LEFT = "M 12 14 L 30 14 L 52 54 L 30 38 L 30 86 L 12 86 Z";
const PATH_RIGHT = "M 88 14 L 70 14 L 48 54 L 70 38 L 70 86 L 88 86 Z";
const PATH_SHELF = "M 70 50 L 70 68 L 50 68 L 60 52 Z";

/* 01 · BLUE GRADIENT — default canonical */
export function FinishBlue({ size = 96 }: FinishProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="fb-main" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="55%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="fb-shelf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <path d={PATH_LEFT} fill="url(#fb-main)" />
      <path d={PATH_RIGHT} fill="url(#fb-main)" />
      <path d={PATH_SHELF} fill="url(#fb-shelf)" />
    </svg>
  );
}

/* 02 · GOLD — metallic gradient + sheen */
export function FinishGold({ size = 96 }: FinishProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="fg-main" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="35%" stopColor="#facc15" />
          <stop offset="65%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="fg-shelf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
      </defs>
      <path d={PATH_LEFT} fill="url(#fg-main)" />
      <path d={PATH_RIGHT} fill="url(#fg-main)" />
      <path d={PATH_SHELF} fill="url(#fg-shelf)" />
    </svg>
  );
}

/* 03 · SILVER — brushed metal */
export function FinishSilver({ size = 96 }: FinishProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="fs-main" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="40%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="fs-shelf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>
      <path d={PATH_LEFT} fill="url(#fs-main)" />
      <path d={PATH_RIGHT} fill="url(#fs-main)" />
      <path d={PATH_SHELF} fill="url(#fs-shelf)" />
    </svg>
  );
}

/* 04 · NEON GLOW — bright cyan-blue with electric glow */
export function FinishNeon({ size = 96 }: FinishProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="fn-main" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <filter id="fn-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#fn-glow)">
        <path d={PATH_LEFT} fill="url(#fn-main)" />
        <path d={PATH_RIGHT} fill="url(#fn-main)" />
        <path d={PATH_SHELF} fill="#1d4ed8" />
      </g>
    </svg>
  );
}

/* 05 · MONOCHROME BLACK — flat solid */
export function FinishBlack({ size = 96 }: FinishProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d={PATH_LEFT} fill="#0b0f1a" />
      <path d={PATH_RIGHT} fill="#0b0f1a" />
      <path d={PATH_SHELF} fill="#0b0f1a" opacity="0.7" />
    </svg>
  );
}

/* 06 · MONOCHROME WHITE — flat solid (para fondos oscuros) */
export function FinishWhite({ size = 96 }: FinishProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d={PATH_LEFT} fill="#fafafa" />
      <path d={PATH_RIGHT} fill="#fafafa" />
      <path d={PATH_SHELF} fill="#fafafa" opacity="0.65" />
    </svg>
  );
}

/* 07 · GLASS — translucent with rim light */
export function FinishGlass({ size = 96 }: FinishProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="fgl-main" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <path d={PATH_LEFT} fill="url(#fgl-main)" stroke="#93c5fd" strokeWidth="0.8" />
      <path d={PATH_RIGHT} fill="url(#fgl-main)" stroke="#93c5fd" strokeWidth="0.8" />
      <path d={PATH_SHELF} fill="#1e3a8a" opacity="0.85" />
    </svg>
  );
}

export type FinishVariant = {
  id: string;
  name: string;
  context: string;
  background: "light" | "dark" | "either";
  Component: (p: FinishProps) => JSX.Element;
};

export const FINISH_VARIANTS: FinishVariant[] = [
  {
    id: "blue",
    name: "Blue Gradient",
    context: "Default canonico. Navbar, favicon, OG, todo el sitio.",
    background: "either",
    Component: FinishBlue,
  },
  {
    id: "gold",
    name: "Gold",
    context: "Aniversario, premios, comunicaciones VIP. Fondo oscuro.",
    background: "dark",
    Component: FinishGold,
  },
  {
    id: "silver",
    name: "Silver",
    context: "Materiales impresos premium, cards de seller verificado.",
    background: "dark",
    Component: FinishSilver,
  },
  {
    id: "neon",
    name: "Neon Glow",
    context: "Eventos, ofertas relampago, modo gamer.",
    background: "dark",
    Component: FinishNeon,
  },
  {
    id: "black",
    name: "Black Solid",
    context: "Facturas, documentos legales, fax / impresion B&W.",
    background: "light",
    Component: FinishBlack,
  },
  {
    id: "white",
    name: "White Solid",
    context: "Headers oscuros, watermarks, video intros.",
    background: "dark",
    Component: FinishWhite,
  },
  {
    id: "glass",
    name: "Glass",
    context: "App icon iOS / Android, modo oscuro premium.",
    background: "dark",
    Component: FinishGlass,
  },
];
