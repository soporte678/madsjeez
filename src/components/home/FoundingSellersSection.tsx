"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Crown,
  Gift,
  Megaphone,
  Percent,
  Sparkles,
  Users2,
  ArrowRight,
  Copy,
  CheckCheck,
  ShieldCheck,
  Zap,
} from "lucide-react";

const TOTAL_SLOTS = 100;

const benefits = [
  {
    icon: Percent,
    title: "0% comisión sobre tus ventas",
    body: "Cobrás directamente con tu MercadoPago. Las cuotas las definís vos. Te quedás con el 100% de cada venta.",
    accent: true,
  },
  {
    icon: Megaphone,
    title: "Publicidad MADSJEEZ Ads bonificada",
    body: "Crédito inicial para campañas + publicación destacada gratis en home durante el primer mes.",
    accent: false,
  },
  {
    icon: Crown,
    title: "Badge Fundador permanente",
    body: "Sello visible en tu perfil y publicaciones. Te diferencia para siempre frente a sellers que llegan después.",
    accent: false,
  },
  {
    icon: Sparkles,
    title: "Soporte directo + roadmap",
    body: "Línea privada con el equipo. Tus pedidos de features entran al roadmap con prioridad.",
    accent: false,
  },
];

export function FoundingSellersSection() {
  const [taken, setTaken] = useState<number>(4);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/program/founders/count");
        if (!r.ok) return;
        const j = (await r.json()) as { taken?: number };
        if (!cancelled && typeof j.taken === "number") setTaken(j.taken);
      } catch {
        // fallback silencioso
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const slotsLeft = Math.max(TOTAL_SLOTS - taken, 0);
  const percentTaken = Math.min((taken / TOTAL_SLOTS) * 100, 100);

  return (
    <section
      id="sellers-fundadores"
      aria-labelledby="founders-heading"
      className="relative mx-auto mb-20 max-w-[1184px] scroll-mt-24 px-4"
    >
      <div className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-[#0a0f1e] via-[#0d1220] to-[#0f1628] shadow-[0_0_80px_-20px_rgba(249,115,22,0.15)]">

        {/* Halos de luz */}
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-orange-500/8 blur-[100px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-20 h-72 w-72 rounded-full bg-orange-500/5 blur-[80px]" />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

        <div className="relative grid grid-cols-1 gap-10 px-6 py-10 md:px-12 md:py-14 lg:grid-cols-12">

          {/* ── Columna izquierda ── */}
          <div className="flex flex-col lg:col-span-5">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-400">
              Programa Sellers Fundadores
            </p>

            <h2
              id="founders-heading"
              className="text-3xl font-black leading-[1.05] tracking-tight text-white md:text-[2.5rem]"
            >
              100 vendedores eligen{" "}
              <span className="relative inline-block">
                <span className="relative z-10">cómo se construye</span>
                <span aria-hidden className="absolute inset-x-0 bottom-1 -z-0 h-3 rounded-sm bg-orange-500/40" />
              </span>{" "}
              el marketplace.
            </h2>

            <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-slate-300">
              Si entrás ahora, no sos uno más. Ayudás a definir cómo cobramos,
              cómo se ven las publicaciones, qué herramientas priorizamos. Y te
              llevás beneficios que ningún seller que llegue después puede tener.
            </p>

            <SlotsCounter slotsLeft={slotsLeft} total={TOTAL_SLOTS} percentTaken={percentTaken} taken={taken} />

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/seller/register?program=founding"
                prefetch={false}
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(249,115,22,0.55)] transition-all hover:bg-orange-400 hover:-translate-y-[1px]"
              >
                Postularte como Fundador
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <a
                href="#programa-referral"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-5 py-3.5 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
              >
                Cómo funciona el referral
              </a>
            </div>

            {/* Trust signals */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-[12px] text-slate-500">
              <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-green-500" /> Sin contrato</span>
              <span className="flex items-center gap-1.5"><Zap size={13} className="text-orange-400" /> Alta en minutos</span>
            </div>
          </div>

          {/* ── Columna derecha ── */}
          <div className="lg:col-span-7">
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {benefits.map((b) => (
                <li
                  key={b.title}
                  className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg ${
                    b.accent
                      ? "border-orange-500/40 bg-orange-500/8 shadow-[inset_0_1px_0_rgba(249,115,22,0.1)]"
                      : "border-slate-700/60 bg-slate-800/40"
                  }`}
                >
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                      b.accent ? "bg-orange-500 text-white" : "bg-slate-700/80 text-slate-200"
                    }`}
                  >
                    <b.icon size={18} strokeWidth={2} />
                  </div>
                  <h3 className="mt-3 text-[15px] font-bold tracking-tight text-white">
                    {b.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">
                    {b.body}
                  </p>
                </li>
              ))}
            </ul>

            <ReferralBlock />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Contador de cupos ─────────────────────────────────────────────── */

function SlotsCounter({
  slotsLeft,
  total,
  percentTaken,
  taken,
}: {
  slotsLeft: number;
  total: number;
  percentTaken: number;
  taken: number;
}) {
  const [animated, setAnimated] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimated(slotsLeft);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          let v = 0;
          const target = slotsLeft;
          const step = Math.max(1, Math.ceil(target / 24));
          const id = setInterval(() => {
            v += step;
            if (v >= target) { setAnimated(target); clearInterval(id); }
            else setAnimated(v);
          }, 30);
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [slotsLeft]);

  return (
    <div
      ref={ref}
      className="mt-7 rounded-2xl border border-slate-700/60 bg-slate-800/50 p-4 backdrop-blur-sm"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Cupos disponibles
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
          {taken} / {total} tomados
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="tabular-nums text-5xl font-black tracking-tight text-white">
          {animated}
        </span>
        <span className="text-sm font-semibold text-slate-400">
          quedan de {total}
        </span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-[width] duration-1000 ease-out"
          style={{ width: `${percentTaken}%` }}
        />
      </div>
      <p className="mt-2 text-[12px] text-slate-500">
        Cuando se tomen los 100, el programa cierra y se vuelve permanente
        sólo para los que entraron.
      </p>
    </div>
  );
}

/* ─── Bloque de referral ─────────────────────────────────────────────── */

function ReferralBlock() {
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.storeSlug) setReferralCode(d.storeSlug.toUpperCase()); })
      .catch(() => {});
  }, []);

  async function copy() {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  }

  return (
    <div
      id="programa-referral"
      className="mt-4 overflow-hidden rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/10 to-orange-500/5 p-5"
    >
      <div className="flex items-start gap-4">
        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white sm:flex">
          <Gift size={22} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black tracking-tight text-white">
              Invitá a otros sellers y sumá meses gratis.
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">
              <Users2 size={11} /> Referral
            </span>
          </div>
          <p className="mt-1.5 max-w-[58ch] text-[13px] leading-relaxed text-slate-300">
            Cada fundador que invitás y se aprueba te da{" "}
            <strong className="text-white">1 mes gratis</strong> del plan activo.
            Si traés 3, te llevás{" "}
            <strong className="text-orange-300">1 año entero</strong> sin pagar.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-900/80 px-3 py-2 font-mono text-sm text-white">
              {referralCode ?? (
                <span className="text-xs text-slate-500">Cargando…</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => void copy()}
              disabled={!referralCode}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-900 transition-colors hover:bg-slate-100 disabled:opacity-40"
            >
              {copied ? (
                <><CheckCheck size={13} /> Copiado</>
              ) : (
                <><Copy size={13} /> Copiar código</>
              )}
            </button>
            <Link
              href="/dashboard/referral"
              prefetch={false}
              className="text-xs font-semibold text-orange-400 hover:underline"
            >
              Ver mis referidos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FoundingSellersSection;
