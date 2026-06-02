/**
 * Variante A — Fotorrealista 3D
 *
 * Vibe: Apple-product / e-commerce premium.
 * Slate-900 → slate-800 background, caja 3D con depth real,
 * etiqueta blanca con barcode, soft shadow al piso, rim highlight,
 * accent yellow brand en la CTA.
 *
 * SVG estricto, sin filtros lentos. Renderea AAA en cualquier device.
 */

import { TutorialIcon } from "../TutorialIcon";

export function PhotorealVariant({
  title,
  hint,
  icon,
}: {
  title: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative aspect-[16/7] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.6)]">
      {/* Atmosphere — radial glow */}
      <svg
        aria-hidden
        viewBox="0 0 1200 525"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="phr-glow" cx="75%" cy="30%" r="55%">
            <stop offset="0%" stopColor="#facc15" stopOpacity="0.18" />
            <stop offset="60%" stopColor="#facc15" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="phr-box-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d6a86d" />
            <stop offset="100%" stopColor="#a37947" />
          </linearGradient>
          <linearGradient id="phr-box-top" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e7bb83" />
            <stop offset="100%" stopColor="#b48555" />
          </linearGradient>
          <linearGradient id="phr-box-side" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8e6738" />
            <stop offset="100%" stopColor="#6b4d27" />
          </linearGradient>
          <linearGradient id="phr-label" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f0f3f8" />
          </linearGradient>
        </defs>
        <rect width="1200" height="525" fill="url(#phr-glow)" />
      </svg>

      {/* Subtle grid pattern */}
      <svg
        aria-hidden
        viewBox="0 0 1200 525"
        className="absolute inset-0 h-full w-full opacity-[0.06]"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="phr-grid" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#fff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="1200" height="525" fill="url(#phr-grid)" />
      </svg>

      {/* 3D Box composition right side */}
      <svg
        aria-hidden
        viewBox="0 0 1200 525"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Floor shadow */}
        <ellipse cx="900" cy="430" rx="200" ry="22" fill="rgba(0,0,0,0.55)" filter="blur(8px)" />

        {/* Box back (offset) for stack effect */}
        <g transform="translate(870, 130) skewY(-12)">
          <rect x="0" y="0" width="180" height="220" fill="#7a5530" opacity="0.55" />
        </g>

        {/* Main box — isometric-ish 3D */}
        <g transform="translate(750, 175)">
          {/* Top face */}
          <polygon
            points="0,40 130,0 290,40 160,90"
            fill="url(#phr-box-top)"
          />
          {/* Front face */}
          <polygon
            points="0,40 160,90 160,240 0,200"
            fill="url(#phr-box-front)"
          />
          {/* Right side face */}
          <polygon
            points="160,90 290,40 290,180 160,240"
            fill="url(#phr-box-side)"
          />

          {/* Tape on top */}
          <polygon
            points="65,20 75,15 175,55 165,60"
            fill="#3a2a17"
            opacity="0.4"
          />

          {/* Shipping label on front face */}
          <g transform="translate(20, 80) skewY(20)">
            <rect x="0" y="0" width="110" height="78" fill="url(#phr-label)" rx="2" />
            {/* MADSJEEZ logo bar */}
            <rect x="6" y="6" width="98" height="11" fill="#0f1729" rx="1.5" />
            <text x="55" y="14.5" textAnchor="middle" fontFamily="Outfit,sans-serif" fontSize="7" fontWeight="900" fill="#facc15" letterSpacing="0.4">MADSJEEZ</text>
            {/* Tracking number */}
            <rect x="6" y="22" width="60" height="3" fill="#0f1729" opacity="0.75" />
            <rect x="6" y="28" width="40" height="2" fill="#0f1729" opacity="0.45" />
            {/* Barcode */}
            <g transform="translate(6, 38)">
              {[2, 3, 1, 4, 2, 2, 5, 1, 3, 2, 4, 3, 1, 2, 5, 2].map((w, i, arr) => {
                const x = arr.slice(0, i).reduce((s, n) => s + n + 1, 0);
                return <rect key={i} x={x} y="0" width={w} height="22" fill="#0f1729" />;
              })}
            </g>
            <rect x="80" y="42" width="22" height="22" fill="#0f1729" />
            <rect x="83" y="45" width="16" height="16" fill="#fff" />
            <rect x="86" y="48" width="10" height="10" fill="#0f1729" />
            <rect x="6" y="68" width="50" height="2.5" fill="#0f1729" opacity="0.6" />
          </g>

          {/* Yellow highlight rim — top edge */}
          <polyline
            points="0,40 130,0 290,40"
            fill="none"
            stroke="#facc15"
            strokeWidth="1.2"
            opacity="0.45"
          />
        </g>
      </svg>

      {/* Content overlay left */}
      <div className="relative z-10 flex h-full items-center px-8 md:px-14">
        <div className="max-w-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-yellow-300 mb-3">
            Tutorial · Variante Fotorrealista
          </p>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-[1.04] text-white">
            {title}
          </h2>
          <p className="mt-3 text-[13px] md:text-[14px] text-white/65 max-w-md leading-relaxed">
            {hint}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-300" />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/90">
              Estilo · 3D foto
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
