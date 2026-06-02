"use client";

/**
 * Placeholder visual para cada paso del tutorial.
 *
 * Cuando llegue media real (imagen Higgsfield, video Sora, captura del
 * producto), se reemplaza este componente por la media directamente.
 * Mientras tanto, mostramos un slot "diseñado" — no un cuadrado vacío —
 * que comunica QUÉ va a haber ahí.
 */

import { ImageIcon, PlayCircle } from 'lucide-react';

type Props = {
  /** Texto descriptivo de qué tendría que verse. Se muestra al lector. */
  hint: string;
  /** Si ya hay media real, mostrala en lugar del placeholder. */
  media?: { type: 'image' | 'video'; src: string; alt?: string };
  /** Aspect ratio del contenedor. */
  aspect?: 'video' | 'square' | 'portrait';
};

export function MediaPlaceholder({ hint, media, aspect = 'video' }: Props) {
  const aspectClass =
    aspect === 'square' ? 'aspect-square' :
    aspect === 'portrait' ? 'aspect-[3/4]' :
    'aspect-video';

  if (media?.type === 'image') {
    return (
      <div className={`relative ${aspectClass} w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.src} alt={media.alt ?? hint} className="h-full w-full object-cover" />
      </div>
    );
  }

  if (media?.type === 'video') {
    return (
      <div className={`relative ${aspectClass} w-full overflow-hidden rounded-2xl border border-slate-200 bg-black`}>
        <video src={media.src} controls className="h-full w-full" />
      </div>
    );
  }

  // SVG placeholder — comunica que ahí va a haber media real.
  return (
    <div
      className={`relative ${aspectClass} w-full overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50/40 flex items-center justify-center`}
      role="img"
      aria-label={hint}
    >
      <svg
        aria-hidden
        viewBox="0 0 800 450"
        className="absolute inset-0 h-full w-full text-slate-200"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="dotgrid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="800" height="450" fill="url(#dotgrid)" />
      </svg>

      <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
          <ImageIcon size={20} className="text-[#3483FA]" strokeWidth={1.75} />
        </div>
        <p className="max-w-sm text-[13px] font-medium text-slate-600 leading-relaxed">
          {hint}
        </p>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Captura próximamente
        </span>
      </div>
    </div>
  );
}

/**
 * Hero del tutorial: media destacada arriba del contenido. Si no hay
 * media real, mostramos un mock más rico (gradient + icono grande).
 *
 * variant opcional: 'default' (legacy) | 'a' photoreal | 'b' isometric |
 * 'c' clay | 'd' editorial — A/B testing con el público.
 */
import { PhotorealVariant } from './hero-variants/PhotorealVariant';
import { IsometricVariant } from './hero-variants/IsometricVariant';
import { ClayVariant } from './hero-variants/ClayVariant';
import { EditorialDarkVariant } from './hero-variants/EditorialDarkVariant';

export type TutorialHeroVariant = 'default' | 'a' | 'b' | 'c' | 'd';

export function TutorialHero({
  hint,
  icon,
  title,
  variant = 'default',
}: {
  hint: string;
  icon: React.ReactNode;
  title: string;
  variant?: TutorialHeroVariant;
}) {
  if (variant === 'a') return <PhotorealVariant title={title} hint={hint} icon={icon} />;
  if (variant === 'b') return <IsometricVariant title={title} hint={hint} icon={icon} />;
  if (variant === 'c') return <ClayVariant title={title} hint={hint} icon={icon} />;
  if (variant === 'd') return <EditorialDarkVariant title={title} hint={hint} />;

  return (
    <div className="relative aspect-[16/7] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f2557] via-[#1a3b8c] to-[#3483FA] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.5)]">
      <svg aria-hidden viewBox="0 0 1200 525" className="absolute inset-0 h-full w-full opacity-20" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="g1" cx="20%" cy="20%" r="60%">
            <stop offset="0%" stopColor="#facc15" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1200" height="525" fill="url(#g1)" />
      </svg>

      <div className="relative z-10 flex h-full items-center justify-between gap-8 px-8 md:px-14">
        <div className="max-w-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-yellow-300 mb-3">
            Tutorial Madsjeez
          </p>
          <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-[1.05] text-white">
            {title}
          </h2>
          <p className="mt-3 text-[13px] text-white/70 max-w-md">
            {hint}
          </p>
        </div>
        <div className="hidden md:flex h-32 w-32 lg:h-40 lg:w-40 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 text-white">
          {icon}
        </div>
      </div>
    </div>
  );
}
