/**
 * Variante B — Isométrico estilizado
 *
 * Vibe: dashboard ilustrado tipo Stripe/Notion. Projection 30°,
 * colores planos brand (azul ML #3483FA + amarillo MJ), grid sutil,
 * sombra plana corta. Friendly, clean, scaleable.
 */

export function IsometricVariant({
  title,
  hint,
}: {
  title: string;
  hint: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative aspect-[16/7] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-white via-blue-50/50 to-blue-100/30 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.25)]">
      {/* Iso grid background */}
      <svg
        aria-hidden
        viewBox="0 0 1200 525"
        className="absolute inset-0 h-full w-full opacity-[0.18]"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="iso-grid" x="0" y="0" width="60" height="34.64" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
            <path d="M 0 0 L 30 17.32 M 60 0 L 30 17.32 M 30 17.32 L 30 34.64" stroke="#3483FA" strokeWidth="0.8" fill="none" />
          </pattern>
        </defs>
        <rect width="1200" height="525" fill="url(#iso-grid)" />
      </svg>

      {/* Iso composition */}
      <svg
        aria-hidden
        viewBox="0 0 1200 525"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Floor plate */}
        <polygon points="700,440 920,330 1140,440 920,550" fill="#3483FA" opacity="0.08" />

        {/* Back box (smaller, behind) */}
        <g>
          <polygon points="780,310 855,272 940,313 865,353" fill="#cfe0fa" />
          <polygon points="780,310 865,353 865,420 780,378" fill="#a3c2ed" />
          <polygon points="865,353 940,313 940,380 865,420" fill="#7ba6e0" />
        </g>

        {/* Main box */}
        <g>
          {/* Top */}
          <polygon points="850,260 970,200 1090,260 970,320" fill="#3483FA" />
          {/* Highlight on top */}
          <polygon points="850,260 970,200 970,210 855,265" fill="#5398fc" />
          {/* Front */}
          <polygon points="850,260 970,320 970,460 850,400" fill="#1f6ee0" />
          {/* Right */}
          <polygon points="970,320 1090,260 1090,400 970,460" fill="#155bbf" />

          {/* Tape on top */}
          <polygon points="893,238 925,222 1050,283 1018,299" fill="#1a5cbf" opacity="0.55" />

          {/* Label on front */}
          <g>
            <polygon points="870,290 950,330 950,395 870,355" fill="#ffffff" />
            <polygon points="870,290 950,330 950,338 870,298" fill="#facc15" />
            {/* Mini lines */}
            <polygon points="876,310 945,344 945,348 876,314" fill="#0f1729" opacity="0.65" />
            <polygon points="876,318 935,348 935,352 876,322" fill="#0f1729" opacity="0.4" />
            {/* Barcode */}
            <polygon points="876,330 945,364 945,370 876,336" fill="#0f1729" />
            <polygon points="876,338 945,372 945,378 876,344" fill="#0f1729" opacity="0.8" />
            <polygon points="876,346 935,376 935,381 876,351" fill="#0f1729" opacity="0.6" />
          </g>
        </g>

        {/* Floating tag (yellow chip) */}
        <g transform="translate(680, 130)">
          <polygon points="0,30 50,5 100,30 50,55" fill="#facc15" />
          <polygon points="0,30 50,55 50,75 0,50" fill="#d4a40a" />
          <polygon points="50,55 100,30 100,50 50,75" fill="#b88a08" />
          <circle cx="50" cy="32" r="5" fill="#0f1729" />
        </g>

        {/* Floating dots */}
        <circle cx="610" cy="220" r="4" fill="#3483FA" />
        <circle cx="630" cy="260" r="3" fill="#3483FA" opacity="0.6" />
        <circle cx="600" cy="280" r="2.5" fill="#facc15" />
        <circle cx="1100" cy="180" r="5" fill="#facc15" opacity="0.7" />
        <circle cx="1140" cy="220" r="3" fill="#3483FA" opacity="0.5" />
      </svg>

      {/* Content overlay left */}
      <div className="relative z-10 flex h-full items-center px-8 md:px-14">
        <div className="max-w-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#3483FA] mb-3">
            Tutorial · Variante Isométrico
          </p>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-[1.04] text-slate-900">
            {title}
          </h2>
          <p className="mt-3 text-[13px] md:text-[14px] text-slate-600 max-w-md leading-relaxed">
            {hint}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#3483FA]/10 border border-[#3483FA]/20 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3483FA]" />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#3483FA]">
              Estilo · Isométrico
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
