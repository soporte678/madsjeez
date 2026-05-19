"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Megaphone } from "lucide-react";

type Variant = "leaderboard" | "rectangle" | "tile";

type PaidAdBannerSlotProps = {
  variant?: Variant;
  className?: string;
  slotKey?: string;
};

type InternalAdPayload = {
  id: string;
  campaignId: string;
  pricingModel: string;
  rotationIntervalSeconds: number;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  href: string;
  sellerName: string;
  budget: number;
  productTitle: string;
  pagePath: string;
  slotKey: string;
};

const placementByVariant: Record<Variant, string> = {
  leaderboard: "HOME_LEADERBOARD",
  rectangle: "HOME_RECTANGLE",
  tile: "HOME_TILE",
};

const gradients = [
  "from-[#0f172a] via-[#14213d] to-[#172554]",
  "from-[#1f2937] via-[#172033] to-[#312e81]",
  "from-[#0f172a] via-[#11263d] to-[#0f766e]",
  "from-[#1e1b4b] via-[#1f2937] to-[#3b0764]",
];

export function PaidAdBannerSlot({
  variant = "leaderboard",
  slotKey = "default",
  className = "",
}: PaidAdBannerSlotProps) {
  const [ad, setAd] = useState<InternalAdPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const bg = useMemo(() => gradients[tick % gradients.length], [tick]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function loadAd() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          placement: placementByVariant[variant],
          slotKey,
          pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
        });
        const res = await fetch(`/api/ads/internal?${params.toString()}`, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;

        setAd(data.ad || null);
        setTick((prev) => prev + 1);

        if (data.ad?.id) {
          void fetch("/api/ads/internal/event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              internalAdCampaignId: data.ad.id,
              eventType: "IMPRESSION",
              slotKey,
              pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
            }),
          });
        }

        const intervalSeconds = Math.max(60, Number(data.rotationIntervalSeconds || 60));
        timeoutId = setTimeout(loadAd, intervalSeconds * 1000);
      } catch {
        if (!cancelled) {
          setAd(null);
          timeoutId = setTimeout(loadAd, 60000);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAd();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [slotKey, variant]);

  const sizeClasses =
    variant === "leaderboard"
      ? "min-h-[100px] px-5 py-4 md:px-8"
      : variant === "rectangle"
        ? "min-h-[160px] px-6 py-6"
        : "min-h-[150px] px-4 py-4";

  if (loading) {
    return <div className={`rounded-[24px] border border-white/10 bg-slate-900/60 ${sizeClasses} ${className}`} />;
  }

  if (!ad) return null;

  const isTile = variant === "tile";

  const handleClick = () => {
    void fetch("/api/ads/internal/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        internalAdCampaignId: ad.id,
        eventType: "CLICK",
        slotKey,
        pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
      }),
    });
  };

  return (
    <aside
      className={`relative overflow-hidden rounded-[24px] border border-white/12 bg-gradient-to-br ${bg} shadow-[0_18px_48px_rgba(2,6,23,0.30)] ring-1 ring-white/8 ${sizeClasses} ${className}`}
      aria-label="Espacio patrocinado"
      data-mj-slot={slotKey}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#60a5fa] via-[#fb923c] to-[#22d3ee]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, rgba(148, 163, 184, 0.45) 0, rgba(148, 163, 184, 0.45) 1px, transparent 1px, transparent 14px)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-80"
        style={{ background: "radial-gradient(circle at right center, rgba(59,130,246,0.22), transparent 58%)" }}
      />
      {ad.imageUrl ? (
        <img src={ad.imageUrl} alt={ad.title} className="absolute inset-0 h-full w-full object-cover opacity-[0.18]" />
      ) : null}

      {isTile ? (
        <div className="relative flex h-full flex-col justify-between gap-3 px-1 pt-3 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-[#7dd3fc]" strokeWidth={2.2} aria-hidden />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-sky-300">Patrocinado</p>
            <p className="mt-1 text-sm font-black uppercase tracking-tight text-white">{ad.title}</p>
            <p className="mt-2 text-[11px] leading-5 text-slate-200">{ad.subtitle}</p>
            <span className="mt-2 inline-block rounded-full border border-sky-400/30 bg-sky-400/15 px-2.5 py-1 text-[9px] font-black uppercase text-sky-100 shadow-sm">
              {ad.pricingModel} - {ad.sellerName}
            </span>
          </div>
          <Link
            href={ad.href}
            onClick={handleClick}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#2563eb] py-2 text-center text-xs font-bold text-white shadow-lg shadow-sky-900/30 transition hover:from-[#2563eb] hover:to-[#1d4ed8]"
          >
            Ver producto <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="relative flex flex-col gap-3 px-1 pb-1 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-gradient-to-br from-[#3b82f6] to-[#2563eb] text-white shadow-[0_12px_25px_rgba(37,99,235,0.30)]">
              <Megaphone className="h-6 w-6" strokeWidth={2.2} aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-300">MADSJEEZ Ads</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">Patrocinado por {ad.sellerName}</p>
              <p className="mt-1.5 text-xl font-black tracking-tight text-white md:text-2xl">{ad.title}</p>
              <p className="mt-2 max-w-lg text-sm font-medium leading-6 text-slate-200">{ad.subtitle}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-sky-400/25 bg-sky-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-sky-100">
                  {ad.pricingModel} - inversion {new Intl.NumberFormat("es-AR").format(ad.budget)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
            <Link
              href={ad.href}
              onClick={handleClick}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#2563eb] px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)] transition hover:from-[#2563eb] hover:to-[#1d4ed8]"
            >
              Ver producto <ExternalLink className="h-4 w-4" />
            </Link>
            <span className="text-xs font-semibold text-sky-200">Rotacion automatica cada 1 min</span>
          </div>
        </div>
      )}
    </aside>
  );
}
