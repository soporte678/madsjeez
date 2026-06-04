/**
 * 8 marcas distintas para MADSJEEZ. Cada una es una función React que
 * renderiza solo el logo (sin contenedor). Aceptan size + isDark para
 * adaptarse a fondos claros u oscuros sin perder fidelidad.
 *
 * Familias intencionalmente distintas:
 *   01 · Bold Wordmark         — sans-serif ultra heavy, monocromo
 *   02 · Yellow Monogram       — "MJ" en cuadrado amarillo (mark consumer)
 *   03 · Stencil Industrial    — guiño a maquinaria/herramientas del catálogo
 *   04 · Editorial Serif       — display serif high-contrast (premium)
 *   05 · Sticker Outline       — outlined letters tilteadas (street/sticker pack)
 *   06 · Geometric Grid        — letras construidas con cuadrados modulares
 *   07 · Pixel Marquee         — pixel font retro (gamer/arcade)
 *   08 · Hand Script           — cursiva + caja utilitaria (curated/craft)
 */

import type { ReactNode } from "react";

type LogoProps = {
  isDark?: boolean;
  scale?: number;
};

const ink = (dark: boolean | undefined) => (dark ? "#f5f5f4" : "#0f172a");
const accent = "#facc15"; // amarillo MJ
const blue = "#2563eb"; // azul brand
const muted = (dark: boolean | undefined) =>
  dark ? "#94a3b8" : "#64748b";

/* ─────────────────────────────────────────────────────────────────── */
/* 01 · Bold Wordmark                                                  */
/* ─────────────────────────────────────────────────────────────────── */

export function LogoBoldWordmark({ isDark, scale = 1 }: LogoProps) {
  return (
    <span
      className="inline-flex items-baseline gap-[0.08em] font-black uppercase leading-none tracking-[-0.04em]"
      style={{
        color: ink(isDark),
        fontFamily: "Outfit, system-ui, sans-serif",
        fontSize: `${44 * scale}px`,
        fontWeight: 900,
      }}
    >
      <span>MADS</span>
      <span style={{ color: accent }}>JEEZ</span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 02 · Yellow Monogram                                                */
/* ─────────────────────────────────────────────────────────────────── */

export function LogoYellowMonogram({ isDark, scale = 1 }: LogoProps) {
  const size = 56 * scale;
  return (
    <div className="inline-flex items-center gap-3">
      <div
        className="grid place-items-center font-black"
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.26,
          background: accent,
          color: "#0f172a",
          fontFamily: "Outfit, system-ui, sans-serif",
          fontSize: size * 0.5,
          letterSpacing: -size * 0.02,
          boxShadow:
            "inset 0 -3px 0 rgba(15,23,42,0.08), 0 8px 22px -8px rgba(202,138,4,0.45)",
        }}
      >
        MJ
      </div>
      <span
        className="font-black uppercase leading-none tracking-tight"
        style={{
          color: ink(isDark),
          fontFamily: "Outfit, system-ui, sans-serif",
          fontSize: `${24 * scale}px`,
        }}
      >
        Madsjeez
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 03 · Stencil Industrial                                             */
/* ─────────────────────────────────────────────────────────────────── */

export function LogoStencilIndustrial({ isDark, scale = 1 }: LogoProps) {
  const w = 360 * scale;
  const h = 60 * scale;
  return (
    <svg
      viewBox="0 0 360 60"
      width={w}
      height={h}
      aria-label="MADSJEEZ"
    >
      <defs>
        <pattern
          id="stencil-stripes"
          patternUnits="userSpaceOnUse"
          width="6"
          height="6"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke={ink(isDark)} strokeWidth="2" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="360" height="60" fill="none" />
      <text
        x="0"
        y="48"
        fontFamily="'Outfit', system-ui, sans-serif"
        fontWeight={900}
        fontSize="56"
        letterSpacing="-2"
        fill={ink(isDark)}
      >
        MADS
      </text>
      <text
        x="158"
        y="48"
        fontFamily="'Outfit', system-ui, sans-serif"
        fontWeight={900}
        fontSize="56"
        letterSpacing="-2"
        fill="url(#stencil-stripes)"
        stroke={ink(isDark)}
        strokeWidth="1.5"
      >
        JEEZ
      </text>
      <rect
        x="0"
        y="54"
        width="360"
        height="3"
        fill={accent}
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 04 · Editorial Serif                                                */
/* ─────────────────────────────────────────────────────────────────── */

export function LogoEditorialSerif({ isDark, scale = 1 }: LogoProps) {
  return (
    <div className="inline-flex flex-col items-start">
      <span
        className="leading-none"
        style={{
          color: ink(isDark),
          fontFamily: "'Playfair Display', 'Tiempos Headline', Georgia, serif",
          fontSize: `${52 * scale}px`,
          fontStyle: "italic",
          fontWeight: 900,
          letterSpacing: "-0.03em",
        }}
      >
        Madsjeez
      </span>
      <span
        className="uppercase tracking-[0.36em] mt-2"
        style={{
          color: muted(isDark),
          fontFamily: "Outfit, system-ui, sans-serif",
          fontSize: `${10 * scale}px`,
          fontWeight: 700,
        }}
      >
        Marketplace · Argentina
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 05 · Sticker Outline                                                */
/* ─────────────────────────────────────────────────────────────────── */

export function LogoStickerOutline({ isDark, scale = 1 }: LogoProps) {
  const w = 420 * scale;
  const h = 110 * scale;
  return (
    <svg viewBox="0 0 420 110" width={w} height={h} aria-label="MADSJEEZ">
      <g transform="translate(8 70) rotate(-4)">
        <text
          x="0"
          y="0"
          fontFamily="'Outfit', sans-serif"
          fontWeight={900}
          fontSize="80"
          letterSpacing="-3"
          fill="none"
          stroke={ink(isDark)}
          strokeWidth="3"
          paintOrder="stroke"
        >
          MADSJEEZ
        </text>
        <text
          x="-6"
          y="-6"
          fontFamily="'Outfit', sans-serif"
          fontWeight={900}
          fontSize="80"
          letterSpacing="-3"
          fill={accent}
          stroke={ink(isDark)}
          strokeWidth="3"
        >
          MADSJEEZ
        </text>
      </g>
      <circle cx="395" cy="22" r="9" fill={accent} stroke={ink(isDark)} strokeWidth="2" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 06 · Geometric Grid                                                 */
/* ─────────────────────────────────────────────────────────────────── */

export function LogoGeometricGrid({ isDark, scale = 1 }: LogoProps) {
  // Construye una M y una J con cuadraditos. Concept arch.
  const cell = 7 * scale;
  const gap = 2 * scale;
  const fill = ink(isDark);
  const dot = accent;
  const u = (x: number, y: number) => ({
    x: x * (cell + gap),
    y: y * (cell + gap),
  });

  // 5x5 M monogram + 5x5 J monogram
  const Mgrid = [
    [1, 0, 0, 0, 1],
    [1, 1, 0, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ];
  const Jgrid = [
    [0, 0, 1, 1, 1],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 1, 0],
    [1, 0, 0, 1, 0],
    [1, 1, 1, 0, 0],
  ];
  const renderGrid = (g: number[][], offsetX: number, color: string) =>
    g.flatMap((row, y) =>
      row.map((v, x) =>
        v ? (
          <rect
            key={`${offsetX}-${x}-${y}`}
            x={u(x, y).x + offsetX}
            y={u(x, y).y}
            width={cell}
            height={cell}
            rx={1}
            fill={color}
          />
        ) : null,
      ),
    );
  const blockW = 5 * (cell + gap) - gap;
  const totalW = blockW * 2 + 16;
  const totalH = 5 * (cell + gap) - gap;

  return (
    <div className="inline-flex items-center gap-4">
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width={totalW * 1.6}
        height={totalH * 1.6}
        aria-label="MJ monogram"
      >
        {renderGrid(Mgrid, 0, fill)}
        {renderGrid(Jgrid, blockW + 16, dot)}
      </svg>
      <span
        className="font-black uppercase leading-none tracking-tight"
        style={{
          color: ink(isDark),
          fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
          fontSize: `${22 * scale}px`,
          letterSpacing: "0.08em",
        }}
      >
        MADSJEEZ
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 07 · Pixel Marquee                                                  */
/* ─────────────────────────────────────────────────────────────────── */

export function LogoPixelMarquee({ isDark, scale = 1 }: LogoProps) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-md px-4 py-2"
      style={{
        background: isDark ? "#020617" : "#0f172a",
        boxShadow: "inset 0 0 0 2px " + accent,
      }}
    >
      <span
        className="uppercase leading-none"
        style={{
          fontFamily: "'JetBrains Mono', 'VT323', 'Courier New', monospace",
          fontWeight: 700,
          letterSpacing: "0.18em",
          fontSize: `${28 * scale}px`,
          color: accent,
          textShadow: `0 0 12px ${accent}80`,
        }}
      >
        ▮ MADSJEEZ
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* 08 · Hand Script                                                    */
/* ─────────────────────────────────────────────────────────────────── */

export function LogoHandScript({ isDark, scale = 1 }: LogoProps) {
  return (
    <div className="inline-flex items-center gap-4">
      <div
        className="grid place-items-center"
        style={{
          width: 60 * scale,
          height: 60 * scale,
          borderRadius: 12,
          background: ink(isDark),
          color: accent,
          fontFamily: "Outfit, system-ui, sans-serif",
          fontWeight: 900,
          fontSize: 30 * scale,
        }}
      >
        ✦
      </div>
      <div className="flex flex-col">
        <span
          style={{
            fontFamily: "'Caveat', 'Kalam', 'Patrick Hand', cursive",
            fontWeight: 700,
            fontSize: `${56 * scale}px`,
            color: ink(isDark),
            lineHeight: 0.9,
            letterSpacing: "-0.02em",
          }}
        >
          Madsjeez
        </span>
        <span
          className="uppercase mt-1"
          style={{
            fontFamily: "Outfit, system-ui, sans-serif",
            fontWeight: 700,
            fontSize: `${9 * scale}px`,
            letterSpacing: "0.32em",
            color: muted(isDark),
          }}
        >
          Tienda · curaduría · oficios
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* Catálogo                                                            */
/* ─────────────────────────────────────────────────────────────────── */

export type LogoOption = {
  id: string;
  name: string;
  vibe: string;
  family: string;
  Component: (p: LogoProps) => ReactNode;
};

export const LOGO_OPTIONS: LogoOption[] = [
  {
    id: "bold-wordmark",
    name: "Bold Wordmark",
    vibe: "Confianza monocromática · MercadoLibre territory bien hecho",
    family: "Sans display heavy",
    Component: LogoBoldWordmark,
  },
  {
    id: "yellow-monogram",
    name: "Yellow Monogram",
    vibe: "App icon listo · friendly + reconocible",
    family: "Mark + wordmark",
    Component: LogoYellowMonogram,
  },
  {
    id: "stencil-industrial",
    name: "Stencil Industrial",
    vibe: "Guiño a herramientas/maquinaria del catálogo",
    family: "Display + texture fill",
    Component: LogoStencilIndustrial,
  },
  {
    id: "editorial-serif",
    name: "Editorial Serif",
    vibe: "Premium · marketplace curado · revista",
    family: "Italic display serif",
    Component: LogoEditorialSerif,
  },
  {
    id: "sticker-outline",
    name: "Sticker Outline",
    vibe: "Street · juvenil · pegamela en la moto",
    family: "Outline + offset fill",
    Component: LogoStickerOutline,
  },
  {
    id: "geometric-grid",
    name: "Geometric Grid",
    vibe: "Tech · modular · escalable a favicon perfecto",
    family: "Pixel-grid monogram",
    Component: LogoGeometricGrid,
  },
  {
    id: "pixel-marquee",
    name: "Pixel Marquee",
    vibe: "Retro arcade · gamer · ofertas relámpago",
    family: "Mono + neon stroke",
    Component: LogoPixelMarquee,
  },
  {
    id: "hand-script",
    name: "Hand Script",
    vibe: "Artesanal · cercano · oficios + curaduría",
    family: "Script + utility box",
    Component: LogoHandScript,
  },
];
