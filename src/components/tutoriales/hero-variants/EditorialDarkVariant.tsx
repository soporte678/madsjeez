/**
 * Variante D — Editorial Dark
 *
 * Vibe: Linear/Vercel/Awwwards. Slate-950 bg con grain sutil,
 * tipografía display monumental, rim light yellow dramático,
 * composición editorial con número grande "01" / título.
 * Drama, contrast, intencional. Para audiencia de tech taste alto.
 */

export function EditorialDarkVariant({
  title,
  hint,
}: {
  title: string;
  hint: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative aspect-[16/7] w-full overflow-hidden rounded-3xl bg-[#0a0a0f] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)] ring-1 ring-white/5">
      {/* Grain noise (SVG turbulence) */}
      <svg
        aria-hidden
        viewBox="0 0 1200 525"
        className="absolute inset-0 h-full w-full opacity-[0.5] mix-blend-overlay"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="ed-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix
              values="
                0 0 0 0 1
                0 0 0 0 1
                0 0 0 0 1
                0 0 0 0.085 0"
            />
          </filter>
        </defs>
        <rect width="1200" height="525" filter="url(#ed-noise)" />
      </svg>

      {/* Rim glow side */}
      <svg
        aria-hidden
        viewBox="0 0 1200 525"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="ed-rim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#facc15" stopOpacity="0" />
            <stop offset="92%" stopColor="#facc15" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#facc15" stopOpacity="0.32" />
          </linearGradient>
          <linearGradient id="ed-bottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a0a0f" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.65" />
          </linearGradient>
        </defs>
        <rect width="1200" height="525" fill="url(#ed-rim)" />
        <rect width="1200" height="525" fill="url(#ed-bottom)" />
      </svg>

      {/* Hairline ruler — editorial layout */}
      <svg
        aria-hidden
        viewBox="0 0 1200 525"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <line x1="0" y1="80" x2="1200" y2="80" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <line x1="0" y1="445" x2="1200" y2="445" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <line x1="80" y1="0" x2="80" y2="525" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      </svg>

      {/* Big number — monumental */}
      <div
        aria-hidden
        className="absolute right-8 md:right-14 top-1/2 -translate-y-1/2 pointer-events-none select-none"
      >
        <span
          className="block font-black leading-none tracking-tighter text-transparent text-[180px] md:text-[280px]"
          style={{
            WebkitTextStroke: "1px rgba(250, 204, 21, 0.45)",
            fontFamily: "Outfit, system-ui, sans-serif",
          }}
        >
          06
        </span>
      </div>

      {/* Yellow strip — vertical accent right side */}
      <div
        aria-hidden
        className="absolute right-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-transparent via-yellow-300 to-transparent opacity-65"
      />

      {/* Content overlay left */}
      <div className="relative z-10 flex h-full items-center px-8 md:px-14">
        <div className="max-w-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-10 bg-yellow-300" />
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-yellow-300/90">
              Editorial
            </p>
          </div>
          <h2 className="text-2xl md:text-[2.6rem] font-black tracking-tight leading-[1.0] text-white">
            {title}
          </h2>
          <p className="mt-4 text-[13px] md:text-[14px] text-white/55 max-w-md leading-relaxed">
            {hint}
          </p>
          <div className="mt-6 inline-flex items-center gap-3 text-[10.5px] font-bold uppercase tracking-[0.22em] text-white/70">
            <span>Madsjeez Journal</span>
            <span className="text-yellow-300">·</span>
            <span>Issue 01</span>
            <span className="text-yellow-300">·</span>
            <span>Sellers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
