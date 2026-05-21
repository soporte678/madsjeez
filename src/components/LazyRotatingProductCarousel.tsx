"use client";

import { useEffect, useRef, useState } from "react";
import {
  RotatingProductCarousel,
  type RotatingProductCarouselProps,
} from "@/components/RotatingProductCarousel";

type Props = RotatingProductCarouselProps & {
  /** Si true, monta el carrusel de inmediato (above the fold). */
  eager?: boolean;
};

function CarouselSkeleton({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="py-6" aria-hidden>
      <div className="mb-4">
        <h2 className="text-[22px] font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex gap-4 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="min-w-[224px] rounded-lg bg-card shadow-sm animate-pulse">
            <div className="h-[224px] rounded-t-lg bg-secondary" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 rounded bg-secondary" />
              <div className="h-4 w-1/2 rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Monta el carrusel solo al entrar en viewport (menos red/CPU en home). */
export function LazyRotatingProductCarousel({ eager = false, ...props }: Props) {
  const [visible, setVisible] = useState(eager);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (eager || visible) return;
    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "280px 0px", threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager, visible]);

  return (
    <div ref={rootRef} className="min-h-[300px]">
      {visible ? (
        <RotatingProductCarousel {...props} />
      ) : (
        <CarouselSkeleton title={props.title} subtitle={props.subtitle} />
      )}
    </div>
  );
}
