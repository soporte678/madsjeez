/**
 * Variante C — Claymorphism / Soft 3D
 *
 * Vibe: Notion / Linear illustration. Formas blancas redondeadas con
 * sombras difusas dramáticas. Mucho aire. Single accent dot. Ultra
 * minimalista, friendly, "soft" 3D simulado con SVG layer shadows.
 */

export function ClayVariant({
  title,
  hint,
}: {
  title: string;
  hint: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative aspect-[16/7] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-stone-100 via-stone-50 to-white shadow-[0_24px_60px_-30px_rgba(120,113,108,0.35)]">
      {/* Atmosphere */}
      <svg
        aria-hidden
        viewBox="0 0 1200 525"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="clay-bg" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#f5f5f4" stopOpacity="0" />
          </radialGradient>
          <filter id="clay-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="14" />
            <feOffset dx="0" dy="20" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.18" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="clay-box-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f0ee" />
          </linearGradient>
          <linearGradient id="clay-tag-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#facc15" />
          </linearGradient>
        </defs>
        <rect width="1200" height="525" fill="url(#clay-bg)" />
      </svg>

      {/* Clay objects right */}
      <svg
        aria-hidden
        viewBox="0 0 1200 525"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Floor shadow (soft) */}
        <ellipse cx="900" cy="445" rx="180" ry="14" fill="rgba(120,113,108,0.18)" filter="blur(12px)" />

        {/* Big rounded "box" — abstract clay shape */}
        <g filter="url(#clay-shadow)">
          <rect x="790" y="180" width="240" height="240" rx="42" fill="url(#clay-box-grad)" />
          {/* Top highlight (soft inner shadow simulated) */}
          <rect x="790" y="180" width="240" height="14" rx="42" fill="#ffffff" opacity="0.95" />
          {/* Bottom subtle dark */}
          <rect x="790" y="410" width="240" height="10" rx="42" fill="#d6d3d0" opacity="0.6" />
        </g>

        {/* "Label" — soft yellow rounded rect inside */}
        <g filter="url(#clay-shadow)">
          <rect x="830" y="240" width="160" height="100" rx="22" fill="url(#clay-tag-grad)" />
          {/* Smile lines on label */}
          <rect x="850" y="262" width="120" height="6" rx="3" fill="#0f1729" opacity="0.18" />
          <rect x="850" y="276" width="90" height="6" rx="3" fill="#0f1729" opacity="0.14" />
          <rect x="850" y="295" width="120" height="20" rx="4" fill="#0f1729" opacity="0.65" />
          {/* QR placeholder */}
          <rect x="850" y="320" width="18" height="14" rx="2" fill="#0f1729" opacity="0.7" />
        </g>

        {/* Small floating circle (accent dot) */}
        <g filter="url(#clay-shadow)">
          <circle cx="700" cy="180" r="32" fill="#3483FA" />
          <circle cx="694" cy="172" r="10" fill="#5398fc" />
        </g>

        {/* Small floating pill */}
        <g filter="url(#clay-shadow)">
          <rect x="1080" y="120" width="68" height="32" rx="16" fill="#ffffff" />
          <circle cx="1100" cy="136" r="6" fill="#facc15" />
          <rect x="1112" y="132" width="28" height="3" rx="1.5" fill="#0f1729" opacity="0.7" />
          <rect x="1112" y="138" width="20" height="3" rx="1.5" fill="#0f1729" opacity="0.45" />
        </g>

        {/* Decorative cubes scattered */}
        <g filter="url(#clay-shadow)">
          <rect x="610" y="350" width="42" height="42" rx="9" fill="#ffffff" />
        </g>
      </svg>

      {/* Content overlay left */}
      <div className="relative z-10 flex h-full items-center px-8 md:px-14">
        <div className="max-w-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500 mb-3">
            Tutorial · Variante Soft 3D
          </p>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-[1.04] text-stone-900">
            {title}
          </h2>
          <p className="mt-3 text-[13px] md:text-[14px] text-stone-600 max-w-md leading-relaxed">
            {hint}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white border border-stone-200 shadow-sm px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3483FA]" />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-stone-700">
              Estilo · Claymorphism
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
