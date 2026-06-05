"use client";

/**
 * Sellers Fundadores — programa de 100 cupos de lanzamiento.
 *
 * Sección dedicada para captar los primeros vendedores con beneficios
 * exclusivos + sistema de referral para que cada fundador invite a 3
 * sellers más y gane mes extra free.
 *
 * Diseño:
 *   - Layout split asimétrico (no zigzag genérico)
 *   - Counter de cupos con barra de progreso real
 *   - 4 beneficios concretos, no buzzwords
 *   - CTA dual: postularte como fundador / invitar a otros
 *   - Paleta marca: azul ML #3483FA + amarillo MJ + slate-950
 *   - Motion ligero: reveal scroll + counter count-up
 */

import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";

const TOTAL_SLOTS = 100;

const benefits: Array<{
  icon: typeof Crown;
  title: string;
  body: string;
  highlight?: boolean;
}> = [
  {
    icon: Percent,
    title: "0% comisión sobre tus ventas. Siempre.",
    body:
      "Madsjeez no cobra un peso de lo que vendés. Cobrás con tu MercadoPago y las cuotas las definís vos. Te quedás con el 100%.",
    highlight: true,
  },
  {
    icon: Megaphone,
    title: "Publicidad MADSJEEZ Ads bonificada",
    body:
      "Crédito inicial para campañas + tu publicación destacada gratis en home durante el primer mes.",
  },
  {
    icon: Crown,
    title: "Badge Fundador permanente",
    body:
      "Sello visible en tu perfil y publicaciones que te diferencia para siempre frente a sellers que llegan después.",
  },
  {
    icon: Sparkles,
    title: "Soporte directo + roadmap",
    body:
      "Línea privada con el equipo. Tus pedidos de features entran al roadmap con prioridad sobre el resto.",
  },
];

export function FoundingSellersSection() {
  const [taken, setTaken] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/program/founders/count", { cache: "force-cache" });
        if (!r.ok) return;
        const j = (await r.json()) as { taken?: number };
        if (!cancelled && typeof j.taken === "number") setTaken(j.taken);
      } catch {
        // fallback silencioso a 0
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const slotsLeft = Math.max(TOTAL_SLOTS - taken, 0);
  const percentTaken = Math.min((taken / TOTAL_SLOTS) * 100, 100);

  return (
    <section
      id="sellers-fundadores"
      aria-labelledby="founders-heading"
      className="relative max-w-[1184px] mx-auto px-4 mb-20 scroll-mt-24"
    >
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_24px_60px_-30px_rgba(15,23,42,0.18)] dark:border-slate-700/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        {/* halo de marca, sin AI-purple glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full bg-[#3483FA]/8 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-20 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl"
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 px-6 py-10 md:px-12 md:py-14">
          {/* Headline + counter */}
          <div className="lg:col-span-5 flex flex-col">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3483FA] dark:text-[#60a5fa] mb-3">
              Programa Sellers Fundadores
            </p>

            <h2
              id="founders-heading"
              className="text-3xl md:text-[2.5rem] font-black tracking-tight leading-[1.05] text-slate-900 dark:text-white"
            >
              100 vendedores eligen{" "}
              <span className="relative inline-block">
                <span className="relative z-10">cómo se construye</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-1 h-3 -z-0 bg-yellow-300/70 rounded-sm"
                />
              </span>{" "}
              el marketplace.
            </h2>

            <p className="mt-5 text-[15px] md:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-[52ch]">
              Si entrás ahora, no sos uno más. Ayudás a definir cómo cobramos,
              cómo se ven las publicaciones, qué herramientas priorizamos. Y te
              llevás beneficios que ningún seller que llegue después puede tener.
            </p>

            <SlotsCounter
              slotsLeft={slotsLeft}
              total={TOTAL_SLOTS}
              percentTaken={percentTaken}
            />

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/seller/register?program=founding"
                prefetch={false}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#3483FA] hover:bg-[#1f6ee0] text-white font-bold px-6 py-3.5 text-sm transition-colors shadow-[0_8px_24px_-8px_rgba(52,131,250,0.6)]"
              >
                Postularte como Fundador
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <a
                href="#programa-referral"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 hover:border-slate-900 text-slate-900 dark:border-slate-600 dark:text-white dark:hover:border-white font-semibold px-5 py-3.5 text-sm transition-colors"
              >
                Cómo funciona el referral
              </a>
            </div>
          </div>

          {/* Benefits stack */}
          <div className="lg:col-span-7">
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {benefits.map((b) => (
                <li
                  key={b.title}
                  className={`relative rounded-2xl border p-5 transition-shadow hover:shadow-md ${
                    b.highlight
                      ? "border-[#3483FA]/40 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-[#3483FA]/50 dark:bg-slate-800"
                      : "border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-800/70"
                  }`}
                >
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                      b.highlight
                        ? "bg-[#3483FA] text-white"
                        : "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white"
                    }`}
                  >
                    <b.icon size={18} strokeWidth={2} />
                  </div>
                  <h3 className="mt-3 text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
                    {b.title}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
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

/* ──────────────────────────────────────────────────────────────────── */

function SlotsCounter({
  slotsLeft,
  total,
  percentTaken,
}: {
  slotsLeft: number;
  total: number;
  percentTaken: number;
}) {
  const [animated, setAnimated] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAnimated(slotsLeft);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            let v = 0;
            const target = slotsLeft;
            const step = Math.max(1, Math.ceil(target / 24));
            const id = setInterval(() => {
              v += step;
              if (v >= target) {
                setAnimated(target);
                clearInterval(id);
              } else {
                setAnimated(v);
              }
            }, 30);
            obs.disconnect();
            return;
          }
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [slotsLeft]);

  return (
    <div ref={ref} className="mt-7 rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-800/80">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
          Cupos disponibles
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-[#3483FA] dark:text-[#60a5fa]">
          {total - slotsLeft} / {total} tomados
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
          {animated}
        </span>
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          quedan de {total}
        </span>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#3483FA] to-[#1f6ee0] transition-[width] duration-1000 ease-out"
          style={{ width: `${percentTaken}%` }}
        />
      </div>
      <p className="mt-2 text-[12.5px] text-slate-500 dark:text-slate-400">
        Cuando se tomen los 100, el programa cierra y se vuelve permanente sólo
        para los que entraron.
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */

function ReferralBlock() {
  const [copied, setCopied] = useState(false);
  const referralCode = "FUNDADOR-MJ"; // placeholder, viene del user logueado

  async function copy() {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  return (
    <div
      id="programa-referral"
      className="mt-6 rounded-2xl border border-yellow-300/60 bg-yellow-50/70 p-5 dark:border-yellow-500/40 dark:bg-yellow-500/10"
    >
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-slate-900 shrink-0">
          <Gift size={22} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Invitá a otros sellers y sumá meses gratis.
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400 text-slate-900 text-[10px] font-black uppercase tracking-wider px-2 py-1">
              <Users2 size={11} /> Referral
            </span>
          </div>
          <p className="mt-1.5 text-[13.5px] text-slate-700 dark:text-slate-200 leading-relaxed max-w-[58ch]">
            Cada fundador que invitás y se aprueba te da{" "}
            <strong className="text-slate-900 dark:text-yellow-200">1 mes gratis</strong> del plan
            que tengas activo. Si traés 3 que cumplan los requisitos, te llevás{" "}
            <strong className="text-slate-900 dark:text-yellow-200">1 año entero</strong> de tu plan
            sin pagar.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white">
              {referralCode}
            </div>
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold px-3 py-2 transition-colors dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {copied ? (
                <>
                  <CheckCheck size={13} /> Copiado
                </>
              ) : (
                <>
                  <Copy size={13} /> Copiar código
                </>
              )}
            </button>
            <Link
              href="/dashboard/referral"
              prefetch={false}
              className="text-xs font-semibold text-[#3483FA] dark:text-[#60a5fa] hover:underline"
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
