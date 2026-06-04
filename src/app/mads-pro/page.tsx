import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  Truck,
  ShieldCheck,
  Zap,
  Crown,
  CheckCircle2,
  ArrowRight,
  Package,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "MADS PRO — Envíos gratis ilimitados | MadsJeez",
  description:
    "Suscribite a MADS PRO por $30.000/mes y recibí envíos gratis ilimitados en todos los productos desde $25.000. Sin tope de cantidad, sin letra chica.",
  alternates: { canonical: "https://www.madsjeez.com.ar/mads-pro" },
  openGraph: {
    title: "MADS PRO — Envíos gratis ilimitados",
    description:
      "$30.000/mes. Envíos gratis ilimitados en productos desde $25.000 en todo el marketplace.",
    url: "https://www.madsjeez.com.ar/mads-pro",
    type: "website",
  },
};

const BENEFITS = [
  {
    Icon: Truck,
    title: "Envíos gratis ilimitados",
    body:
      "Comprá lo que quieras, las veces que quieras. Mientras el producto sea de $25.000 o más, el envío te sale $0.",
  },
  {
    Icon: Zap,
    title: "Sin tope de cantidad",
    body:
      "No hay límite de pedidos por mes. Pedís 1 o pedís 50, el envío sigue siendo gratis.",
  },
  {
    Icon: Clock,
    title: "Llega rápido",
    body:
      "Productos con etiqueta FULL llegan al día siguiente. Sin costo extra para suscriptores PRO.",
  },
  {
    Icon: ShieldCheck,
    title: "Devoluciones sin cargo",
    body:
      "Si algo no te gusta, lo devolvés gratis dentro de los 7 días. Política de buyer protection PRO.",
  },
];

export default function MadsProPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white font-outfit text-slate-900">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,193,7,0.15),transparent_70%)]"
        />
        <div className="relative max-w-[1100px] mx-auto px-4 pt-16 pb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-yellow-300 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.22em]">
            <Crown size={13} className="fill-yellow-300" />
            Madsjeez · Plan PRO
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-black tracking-tight leading-[1.02] text-slate-900">
            Envíos gratis{" "}
            <span className="relative inline-block">
              <span className="relative z-10">ilimitados</span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-1 h-3 -z-0 bg-yellow-300/70 rounded-sm"
              />
            </span>
            <br className="hidden md:block" /> en todo el marketplace.
          </h1>
          <p className="mt-5 text-[15.5px] md:text-base text-slate-600 leading-relaxed max-w-[60ch] mx-auto">
            Suscribite a <strong className="text-slate-900">MADS PRO</strong> y dejá de pagar envíos. Por una
            cuota mensual fija, recibís gratis todos los productos del marketplace desde{" "}
            <strong className="text-slate-900">$25.000</strong>, sin tope.
          </p>

          <div className="mt-8 inline-flex items-baseline gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-[0_10px_30px_-12px_rgba(15,23,42,0.18)]">
            <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
              Precio
            </span>
            <span className="text-5xl md:text-6xl font-black tabular-nums tracking-tight text-slate-900">
              $30.000
            </span>
            <span className="text-sm font-semibold text-slate-500">/mes</span>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/subscriptions?plan=PRO"
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 hover:bg-black text-white font-black px-7 py-4 text-[14px] transition-colors shadow-[0_12px_32px_-12px_rgba(15,23,42,0.5)]"
            >
              Suscribirme a MADS PRO
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            <Link
              href="/search?q=&min_price=25000"
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 hover:border-slate-900 text-slate-900 font-semibold px-5 py-4 text-[14px] transition-colors"
            >
              Ver productos con envío gratis PRO
            </Link>
          </div>
        </div>
      </section>

      {/* BENEFITS GRID */}
      <section className="max-w-[1100px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-yellow-300">
                <b.Icon size={20} strokeWidth={2} />
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-900 tracking-tight">
                {b.title}
              </h3>
              <p className="mt-1.5 text-[14px] text-slate-600 leading-relaxed">
                {b.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="max-w-[1100px] mx-auto px-4 pb-12">
        <div className="rounded-3xl bg-slate-900 text-white p-8 md:p-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-yellow-300 mb-3">
            Cómo funciona
          </p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
            Activá MADS PRO una vez y olvidate del envío en todas tus compras.
          </h2>

          <ol className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                n: "01",
                title: "Suscribite",
                body: "$30.000/mes con tu MercadoPago. Cancelás cuando quieras.",
              },
              {
                n: "02",
                title: "Comprá normal",
                body:
                  "Buscá productos desde $25.000 en cualquier categoría. El envío se descuenta automáticamente al pagar.",
              },
              {
                n: "03",
                title: "Recibí en tu casa",
                body:
                  "Sin sorpresas, sin cargos. Envíos gratis ilimitados mientras tu suscripción esté activa.",
              },
            ].map((s) => (
              <li
                key={s.n}
                className="rounded-2xl bg-white/5 border border-white/10 p-5"
              >
                <span className="text-[11px] font-black text-yellow-300">
                  Paso {s.n}
                </span>
                <h3 className="mt-2 text-base font-bold tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-[13px] text-white/70 leading-relaxed">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* COMPARATIVA: Comprador normal vs MADS PRO */}
      <section className="max-w-[1100px] mx-auto px-4 pb-16">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mb-6 text-center">
          Sin MADS PRO vs. con MADS PRO
        </h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-3 text-[13px]">
            <div className="bg-slate-50 px-4 py-3 font-bold text-slate-700">
              Situación
            </div>
            <div className="bg-slate-50 px-4 py-3 font-bold text-slate-500 text-center">
              Sin suscripción
            </div>
            <div className="bg-yellow-300/15 px-4 py-3 font-bold text-slate-900 text-center">
              Con MADS PRO
            </div>

            {[
              [
                "Producto de $30.000",
                "Pagás envío ($4.500 aprox)",
                "Envío $0",
              ],
              [
                "5 compras al mes de $25.000+",
                "~$22.500 en envíos",
                "Envío $0 en todas",
              ],
              ["Envío 24hs FULL", "Con costo", "Incluido"],
              ["Devoluciones", "Pagás flete inverso", "Sin cargo (7 días)"],
            ].map((row, i) => (
              <div key={i} className="contents">
                <div className="px-4 py-3 border-t border-slate-100 text-slate-700">
                  {row[0]}
                </div>
                <div className="px-4 py-3 border-t border-slate-100 text-slate-500 text-center">
                  {row[1]}
                </div>
                <div className="px-4 py-3 border-t border-slate-100 text-slate-900 font-semibold text-center inline-flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  {row[2]}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-[12.5px] text-slate-500 text-center">
          Si comprás 2 productos por mes de $25.000+, ya recuperás la suscripción.
        </p>
      </section>

      {/* FAQ */}
      <section className="max-w-[800px] mx-auto px-4 pb-20">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-5">
          Preguntas frecuentes
        </h2>
        <div className="space-y-3">
          {[
            {
              q: "¿En qué productos aplica el envío gratis?",
              a: "En todos los productos del catálogo MadsJeez cuyo precio sea $25.000 o más. No hay restricción por categoría ni vendedor.",
            },
            {
              q: "¿Hay tope de cantidad de envíos?",
              a: "No. Mientras tu suscripción esté activa, podés recibir envíos gratis sin tope de cantidad ni de monto acumulado.",
            },
            {
              q: "¿Puedo cancelar cuando quiera?",
              a: "Sí. Cancelás desde tu cuenta y tu suscripción finaliza al cierre del ciclo facturado.",
            },
            {
              q: "¿Y si compro un producto de menos de $25.000?",
              a: "El envío se cobra normal. MADS PRO aplica solo en productos desde $25.000.",
            },
            {
              q: "¿Cómo se paga la suscripción?",
              a: "Con tu Mercado Pago vinculado a tu cuenta MadsJeez. Se renueva automáticamente cada mes.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-slate-200 bg-white p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-center justify-between cursor-pointer font-bold text-slate-900 text-[14.5px]">
                {item.q}
                <span className="ml-4 transition-transform group-open:rotate-45 text-slate-400 text-xl leading-none">
                  +
                </span>
              </summary>
              <p className="mt-3 text-[13.5px] text-slate-600 leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-[900px] mx-auto px-4 pb-24 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-yellow-300 to-yellow-400 p-10 shadow-[0_24px_60px_-30px_rgba(202,138,4,0.55)]">
          <Package size={32} className="mx-auto text-slate-900 mb-3" />
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
            Activá MADS PRO hoy.
          </h2>
          <p className="mt-2 text-[14.5px] text-slate-800 max-w-[50ch] mx-auto">
            $30.000/mes. Envíos gratis ilimitados desde $25.000. Cancelás cuando
            quieras.
          </p>
          <Link
            href="/subscriptions?plan=PRO"
            prefetch={false}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 hover:bg-black text-white font-black px-8 py-4 text-[14px] transition-colors"
          >
            Suscribirme ahora
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </div>
      </section>
    </main>
  );
}
