"use client";

/**
 * Promociones del mes — el vendedor activa con 1 clic plantillas de cupón por
 * fecha especial. Cada activación crea un Coupon real para su tienda
 * (POST /api/coupons/campaigns/adopt). UI theme-aware.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import RainbowLogo from "@/components/brand/RainbowLogo";
import { trackEvent } from "@/lib/analytics";
import { Loader2, Check, Ticket, ChevronLeft } from "lucide-react";
import { MONTH_NAMES } from "@/data/coupon-campaigns";

type Template = {
  id: string; occasion: string; emoji: string; title: string; description: string;
  discountType: "percentage" | "fixed"; discountValue: number; minPurchase?: number; maxDiscount?: number; durationDays: number;
};

export default function PromocionesDelMesPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthName, setMonthName] = useState(MONTH_NAMES[now.getMonth()]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [activated, setActivated] = useState<Set<string>>(new Set());

  const load = useCallback(async (m: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/coupons/campaigns?month=${m}`);
      if (res.ok) { const d = await res.json(); setTemplates(d.templates || []); setMonthName(d.monthName); }
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(month); }, [month, load]);

  const fmt = (t: Template) =>
    t.discountType === "percentage" ? `${t.discountValue}% OFF` : `$${t.discountValue.toLocaleString("es-AR")} OFF`;

  const activate = async (t: Template) => {
    setActivating(t.id);
    try {
      const res = await fetch("/api/coupons/campaigns/adopt", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateId: t.id }),
      });
      if (res.status === 401) {
        toast.error("Iniciá sesión como vendedor para activar promociones.");
        return;
      }
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || "No se pudo activar"); return; }
      setActivated((s) => new Set(s).add(t.id));
      trackEvent("coupon_campaign_activated", { template: t.id, occasion: t.occasion });
      toast.success(d.alreadyActive ? "Ya tenías esta promo activa" : `¡Promo activada! Código ${d.coupon.code}`);
    } finally { setActivating(null); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-gradient-to-r from-[#ffb703] via-[#ffa60a] to-[#ffb703]">
        <div className="max-w-[1100px] mx-auto px-4 py-4 flex items-center gap-3">
          <RainbowLogo href="/" textSizeClassName="text-xl" iconSizeClassName="w-9 h-9" wordmarkColor="#1a1a2e" />
          <span className="text-[#1a1a2e]/40">|</span>
          <span className="text-lg font-medium text-[#1a1a2e]">Promociones del mes</span>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 py-8">
        <Link href="/coupons" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Volver a cupones
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">Promociones para vender más</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Activá con 1 clic promos por fechas especiales. Cada una crea un cupón real para tu tienda; el descuento sugerido lo podés editar después.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Mes:</span>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground capitalize focus:outline-none focus:ring-2 focus:ring-primary/30">
              {MONTH_NAMES.map((n, i) => <option key={n} value={i + 1} className="capitalize">{n}</option>)}
            </select>
          </label>
        </div>

        <p className="mt-3 text-xs text-muted-foreground capitalize">
          {templates.length} promociones disponibles para {monthName}
        </p>

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted/60" />)}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => {
              const isOn = activated.has(t.id);
              return (
                <div key={t.id} className="flex flex-col rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-2xl" aria-hidden>{t.emoji}</span>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">{fmt(t)}</span>
                  </div>
                  <h2 className="mt-3 font-bold text-foreground">{t.title}</h2>
                  <p className="mt-1 flex-1 text-sm leading-6 text-muted-foreground">{t.description}</p>
                  <div className="mt-3 space-y-0.5 text-xs text-muted-foreground">
                    {t.minPurchase ? <p>Compra mínima ${t.minPurchase.toLocaleString("es-AR")}</p> : null}
                    {t.maxDiscount ? <p>Tope ${t.maxDiscount.toLocaleString("es-AR")}</p> : null}
                    <p>Vigencia: {t.durationDays} días desde que la activás</p>
                  </div>
                  <button
                    onClick={() => void activate(t)}
                    disabled={activating === t.id || isOn}
                    className={`mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-70 ${isOn ? "bg-[color:var(--success)]/15 text-[color:var(--success)]" : "bg-primary text-primary-foreground hover:opacity-90"}`}
                  >
                    {activating === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : isOn ? <Check className="h-4 w-4" /> : <Ticket className="h-4 w-4" />}
                    {isOn ? "Activada" : "Activar para mi tienda"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          ¿No sos vendedor todavía? <Link href="/seller/register" className="font-semibold text-primary hover:underline">Creá tu cuenta de vendedor</Link> para activar promociones y vender en Madsjeez.
        </div>
      </main>
    </div>
  );
}
