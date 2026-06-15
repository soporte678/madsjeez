"use client";

/**
 * Estados globales unificados: vacío, carga y error. Theme-aware (tokens),
 * accesibles, reusables en cualquier página. Sin dependencias pesadas.
 */

import type { ReactNode } from "react";
import { Inbox, RefreshCw, AlertTriangle } from "lucide-react";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-12 text-center ${className}`}>
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon ?? <Inbox className="h-6 w-6" />}
      </span>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Algo salió mal",
  description = "No pudimos cargar esta sección. Probá de nuevo en un momento.",
  onRetry,
  className = "",
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={`flex flex-col items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/5 px-6 py-12 text-center ${className}`}>
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" /> Reintentar
        </button>
      )}
    </div>
  );
}

/** Skeleton genérico (bloque o grilla de cards). prefers-reduced-motion: sin pulse. */
export function LoadingState({ count = 1, className = "", card = false }: { count?: number; className?: string; card?: boolean }) {
  const items = Array.from({ length: count });
  if (card) {
    return (
      <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 ${className}`} aria-busy="true" aria-live="polite">
        {items.map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="aspect-square bg-muted motion-safe:animate-pulse" />
            <div className="space-y-2 p-3.5">
              <div className="h-3 rounded bg-muted motion-safe:animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-muted motion-safe:animate-pulse" />
              <div className="mt-1 h-5 w-1/2 rounded bg-muted motion-safe:animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={`space-y-3 ${className}`} aria-busy="true" aria-live="polite">
      {items.map((_, i) => (
        <div key={i} className="h-20 rounded-2xl border border-border bg-card motion-safe:animate-pulse" />
      ))}
    </div>
  );
}
