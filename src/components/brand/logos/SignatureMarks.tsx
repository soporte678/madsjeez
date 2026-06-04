/**
 * Marcas de identidad MADSJEEZ — 6 conceptos con glyph custom.
 *
 * Cada mark tiene:
 *  - Una idea conceptual (no solo "M y J teñidas")
 *  - Construcción geométrica documentada en el SVG
 *  - Versión symbol (mark sola para favicon/app icon)
 *  - Versión lockup (mark + wordmark, horizontal)
 *
 * Restricciones de diseño:
 *  - Una sola unidad mínima (sin rainbow, sin gradient blue→purple)
 *  - El mark debe leerse a 16×16 y a 512×512
 *  - Cada mark cuenta una historia distinta sobre marketplace
 */

import type { ReactNode } from "react";

type MarkProps = {
  size?: number;
  ink?: string;
  bg?: string;
  accent?: string;
};

type LockupProps = MarkProps & {
  showTagline?: boolean;
};

const DEFAULT_INK = "#0b0f1a";
const DEFAULT_ACCENT = "#facc15";

/* ────────────────────────────────────────────────────────────────── */
/* 01 · LAZO — MJ ligature, una sola curva continua                   */
/* ────────────────────────────────────────────────────────────────── */
/**
 * Concepto: el M y el J no se dibujan por separado. Son UN trazo que
 * entra desde la izquierda, sube formando los picos del M, baja por la
 * derecha y se curva hacia adentro completando el gancho del J.
 * Comprador y vendedor se conectan en un solo movimiento.
 *
 * Construcción: caja 100×100, padding 10. Picos M a y=20, valle a y=55.
 * J cuelga desde el segundo pico, gancho a y=78 con radio 12.
 */

export function MarkLazo({ size = 96, ink = DEFAULT_INK }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="MadsJeez">
      <path
        d="M 12 82 L 12 18 L 28 18 L 42 50 L 56 18 L 72 18 L 72 65 Q 72 82 56 82"
        fill="none"
        stroke={ink}
        strokeWidth={11}
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <circle cx="56" cy="82" r="5.5" fill={ink} />
    </svg>
  );
}

export function LockupLazo({
  size = 56,
  ink = DEFAULT_INK,
  showTagline,
}: LockupProps) {
  return (
    <div className="inline-flex items-center gap-3.5">
      <MarkLazo size={size} ink={ink} />
      <div className="flex flex-col">
        <span
          style={{
            color: ink,
            fontFamily: "Outfit, system-ui, sans-serif",
            fontWeight: 900,
            fontSize: size * 0.5,
            letterSpacing: "-0.045em",
            lineHeight: 0.95,
          }}
        >
          madsjeez
        </span>
        {showTagline && (
          <span
            style={{
              color: ink,
              opacity: 0.55,
              fontFamily: "Outfit, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: size * 0.135,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginTop: 2,
            }}
          >
            Marketplace · AR
          </span>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* 02 · NUDO — dos paths entrelazados (intercambio)                   */
/* ────────────────────────────────────────────────────────────────── */
/**
 * Concepto: nudo celta minimal. Dos lazos cuadrados que pasan uno sobre
 * el otro alternadamente. El acto de comprar/vender = dos manos que se
 * cruzan. Vive dentro de un cuadrado de esquinas suaves.
 *
 * Truco: el "encima/debajo" se logra con masks. El cruce nunca queda
 * ambiguo. Mark funciona en 1 sola tinta.
 */

export function MarkNudo({ size = 96, ink = DEFAULT_INK }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="MadsJeez">
      <defs>
        <mask id="nudo-mask-a">
          <rect width="100" height="100" fill="white" />
          {/* Tapamos un segmento del path A donde B debe quedar encima */}
          <rect x="58" y="34" width="12" height="32" fill="black" />
        </mask>
      </defs>
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="20"
        ry="20"
        fill="none"
        stroke={ink}
        strokeWidth={2}
      />
      {/* Path A: rectángulo redondeado horizontal */}
      <rect
        x="20"
        y="34"
        width="60"
        height="32"
        rx="6"
        fill="none"
        stroke={ink}
        strokeWidth={9}
        mask="url(#nudo-mask-a)"
      />
      {/* Path B: rectángulo redondeado vertical, cruza por encima */}
      <rect
        x="34"
        y="20"
        width="32"
        height="60"
        rx="6"
        fill="none"
        stroke={ink}
        strokeWidth={9}
      />
    </svg>
  );
}

export function LockupNudo({ size = 52, ink = DEFAULT_INK }: LockupProps) {
  return (
    <div className="inline-flex items-center gap-3.5">
      <MarkNudo size={size} ink={ink} />
      <span
        style={{
          color: ink,
          fontFamily: "'GT Walsheim', 'Outfit', system-ui, sans-serif",
          fontWeight: 800,
          fontSize: size * 0.5,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        MADSJEEZ
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* 03 · ROMBO — diamond con corte interior                            */
/* ────────────────────────────────────────────────────────────────── */
/**
 * Concepto: rombo (diamond, valor, precio) con un corte vertical que lo
 * divide en dos mitades — comprador y vendedor — pero las puntas siguen
 * unidas. El "valor" se comparte en el centro.
 *
 * Inspiración: cortes de joyería + íconos de slot/marketplace. La forma
 * funciona genial a 16px porque el rombo siempre se reconoce.
 */

export function MarkRombo({
  size = 96,
  ink = DEFAULT_INK,
  accent = DEFAULT_ACCENT,
}: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="MadsJeez">
      {/* Rombo base */}
      <path d="M 50 8 L 92 50 L 50 92 L 8 50 Z" fill={ink} />
      {/* Corte vertical (slot que comunica) */}
      <rect x="46" y="20" width="8" height="60" fill={accent} />
      {/* Detalle: dos puntos a los lados (los dos actores) */}
      <circle cx="28" cy="50" r="4" fill={accent} />
      <circle cx="72" cy="50" r="4" fill={accent} />
    </svg>
  );
}

export function LockupRombo({
  size = 48,
  ink = DEFAULT_INK,
  accent = DEFAULT_ACCENT,
}: LockupProps) {
  return (
    <div className="inline-flex items-center gap-3">
      <MarkRombo size={size} ink={ink} accent={accent} />
      <span
        style={{
          color: ink,
          fontFamily: "Outfit, system-ui, sans-serif",
          fontWeight: 900,
          fontSize: size * 0.52,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          textTransform: "lowercase",
        }}
      >
        madsjeez
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* 04 · PILA — bloques apilados (catálogo / inventario)               */
/* ────────────────────────────────────────────────────────────────── */
/**
 * Concepto: tres bloques apilados con leve perspectiva isométrica.
 * Lee como "depósito", "catálogo", "stock disponible". Cada bloque
 * tiene ancho ligeramente distinto — no es robótico, tiene mano.
 *
 * El bloque del medio sobresale, sugiriendo "el producto que querés
 * ya está acá".
 */

export function MarkPila({
  size = 96,
  ink = DEFAULT_INK,
  accent = DEFAULT_ACCENT,
}: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="MadsJeez">
      {/* Bloque inferior */}
      <path
        d="M 14 78 L 50 88 L 86 78 L 86 64 L 50 74 L 14 64 Z"
        fill={ink}
      />
      {/* Bloque medio (sobresale, accent) */}
      <path
        d="M 6 58 L 50 70 L 94 58 L 94 44 L 50 56 L 6 44 Z"
        fill={accent}
      />
      <path d="M 6 44 L 50 56 L 94 44 L 50 32 Z" fill={ink} />
      {/* Bloque superior */}
      <path
        d="M 22 28 L 50 36 L 78 28 L 78 16 L 50 24 L 22 16 Z"
        fill={ink}
      />
    </svg>
  );
}

export function LockupPila({
  size = 50,
  ink = DEFAULT_INK,
  accent = DEFAULT_ACCENT,
}: LockupProps) {
  return (
    <div className="inline-flex items-center gap-3">
      <MarkPila size={size} ink={ink} accent={accent} />
      <span
        style={{
          color: ink,
          fontFamily: "'IBM Plex Sans', 'Outfit', sans-serif",
          fontWeight: 700,
          fontSize: size * 0.46,
          letterSpacing: "0.02em",
          lineHeight: 1,
          textTransform: "uppercase",
        }}
      >
        MadsJeez
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* 05 · ECO — arcos concéntricos (alcance del marketplace)            */
/* ────────────────────────────────────────────────────────────────── */
/**
 * Concepto: tres arcos concéntricos que emanan desde un pin/punto en
 * la base. Es el eco del marketplace: tu publicación llega lejos.
 * Idea robada honestamente de íconos de wifi/signal pero invertida —
 * acá los arcos crecen hacia arriba como un brote.
 *
 * El pin sólido es la tienda; los arcos son el alcance.
 */

export function MarkEco({
  size = 96,
  ink = DEFAULT_INK,
}: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="MadsJeez">
      {/* Arco grande */}
      <path
        d="M 12 76 Q 50 14 88 76"
        fill="none"
        stroke={ink}
        strokeWidth={7}
        strokeLinecap="round"
      />
      {/* Arco medio */}
      <path
        d="M 26 76 Q 50 36 74 76"
        fill="none"
        stroke={ink}
        strokeWidth={7}
        strokeLinecap="round"
      />
      {/* Arco chico */}
      <path
        d="M 38 76 Q 50 58 62 76"
        fill="none"
        stroke={ink}
        strokeWidth={7}
        strokeLinecap="round"
      />
      {/* Pin base */}
      <circle cx="50" cy="80" r="6.5" fill={ink} />
    </svg>
  );
}

export function LockupEco({ size = 50, ink = DEFAULT_INK }: LockupProps) {
  return (
    <div className="inline-flex items-center gap-3">
      <MarkEco size={size} ink={ink} />
      <span
        style={{
          color: ink,
          fontFamily: "Outfit, system-ui, sans-serif",
          fontWeight: 900,
          fontSize: size * 0.5,
          letterSpacing: "-0.045em",
          lineHeight: 1,
        }}
      >
        madsjeez
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* 06 · BRÚJULA — N flecha + serial number (editorial)                */
/* ────────────────────────────────────────────────────────────────── */
/**
 * Concepto: rosa de los vientos abstracta. Una "N" estilizada que
 * funciona como flecha apuntando al norte (al producto que buscás).
 * El ancla del logo lleva un número serial editorial (`No. 01`) que
 * sugiere "curaduría", "primera edición", "catálogo numerado".
 *
 * Triple-A move: el wordmark va abajo en wide-tracking, el mark va
 * arriba. Composición editorial vertical.
 */

export function MarkBrujula({
  size = 96,
  ink = DEFAULT_INK,
}: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="MadsJeez">
      {/* Círculo perímetro */}
      <circle cx="50" cy="50" r="42" fill="none" stroke={ink} strokeWidth={3} />
      {/* Tick marks N S E W */}
      <line x1="50" y1="8" x2="50" y2="16" stroke={ink} strokeWidth={3} />
      <line x1="50" y1="84" x2="50" y2="92" stroke={ink} strokeWidth={3} />
      <line x1="8" y1="50" x2="16" y2="50" stroke={ink} strokeWidth={3} />
      <line x1="84" y1="50" x2="92" y2="50" stroke={ink} strokeWidth={3} />
      {/* Flecha norte sólida (forma de aguja) */}
      <path d="M 50 18 L 60 56 L 50 50 L 40 56 Z" fill={ink} />
      {/* Cola hacia el sur, más fina */}
      <path d="M 50 50 L 56 78 L 50 74 L 44 78 Z" fill={ink} opacity={0.35} />
    </svg>
  );
}

export function LockupBrujula({
  size = 70,
  ink = DEFAULT_INK,
}: LockupProps) {
  return (
    <div className="inline-flex flex-col items-center gap-2.5">
      <MarkBrujula size={size} ink={ink} />
      <div className="flex flex-col items-center">
        <span
          style={{
            color: ink,
            fontFamily: "'GT Walsheim', 'Outfit', sans-serif",
            fontWeight: 900,
            fontSize: size * 0.34,
            letterSpacing: "0.04em",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          Madsjeez
        </span>
        <span
          style={{
            color: ink,
            opacity: 0.45,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: size * 0.13,
            letterSpacing: "0.28em",
            marginTop: 4,
            textTransform: "uppercase",
          }}
        >
          No. 01 · Argentina
        </span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Catálogo público                                                   */
/* ────────────────────────────────────────────────────────────────── */

export type SignatureMark = {
  id: string;
  name: string;
  concept: string;
  inspiration: string;
  Mark: (p: MarkProps) => ReactNode;
  Lockup: (p: LockupProps) => ReactNode;
  /** Sugiere si el lockup es horizontal o vertical. */
  layout: "horizontal" | "vertical";
};

export const SIGNATURE_MARKS: SignatureMark[] = [
  {
    id: "lazo",
    name: "Lazo",
    concept:
      "El M y el J se dibujan en un solo trazo continuo. Comprador y vendedor conectados sin levantar el lápiz.",
    inspiration: "Calligraphy meets Stripe S. Logo + mark son lo mismo.",
    Mark: MarkLazo,
    Lockup: LockupLazo,
    layout: "horizontal",
  },
  {
    id: "nudo",
    name: "Nudo",
    concept:
      "Dos lazos cuadrados entrelazados. Intercambio comercial reducido a su forma más simple.",
    inspiration: "Tiffany interlock + íconos sistémicos modernos (Notion, Vercel).",
    Mark: MarkNudo,
    Lockup: LockupNudo,
    layout: "horizontal",
  },
  {
    id: "rombo",
    name: "Rombo",
    concept:
      "Diamond con un slot vertical amarillo. Valor compartido en el centro entre dos partes.",
    inspiration: "Cortes de joyería + Datadog mark + íconos de exchange.",
    Mark: MarkRombo,
    Lockup: LockupRombo,
    layout: "horizontal",
  },
  {
    id: "pila",
    name: "Pila",
    concept:
      "Tres bloques isométricos apilados, el del medio sobresale en amarillo. El catálogo tangible.",
    inspiration: "Apple App Store stack + íconos de inventory/warehouse.",
    Mark: MarkPila,
    Lockup: LockupPila,
    layout: "horizontal",
  },
  {
    id: "eco",
    name: "Eco",
    concept:
      "Pin con arcos concéntricos que crecen hacia arriba. Tu publicación llega lejos.",
    inspiration: "Mapbox pin + Spotify equalizer invertido.",
    Mark: MarkEco,
    Lockup: LockupEco,
    layout: "horizontal",
  },
  {
    id: "brujula",
    name: "Brújula",
    concept:
      "Rosa de los vientos con flecha al norte. Encontrá lo que buscás. Mark + wordmark + serial editorial.",
    inspiration: "Aesop / Hermès / publicaciones numeradas. Lockup vertical.",
    Mark: MarkBrujula,
    Lockup: LockupBrujula,
    layout: "vertical",
  },
];
