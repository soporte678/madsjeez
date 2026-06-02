"use client";

/**
 * Cómo funciona Madsjeez en 4 pasos - para sellers.
 * Layout: 4 columnas con números grandes + icono + descripción + imagen real.
 * Asimétrico: la card 2 (registro) tiene énfasis visual ligero.
 */

import Image from "next/image";
import Link from "next/link";
import { Compass, UserPlus, Camera, TrendingUp, ArrowRight } from "lucide-react";

const steps = [
  {
    n: "01",
    title: "Descubrí el programa",
    desc: "Mirá los beneficios del Plan Fundador y comparálos con lo que ya pagás en otros marketplaces.",
    Icon: Compass,
    image:
      "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&w=600&q=70",
  },
  {
    n: "02",
    title: "Registrate en 3 minutos",
    desc: "Sin papeles físicos, sin esperas. Validamos tu identidad y datos fiscales por WhatsApp.",
    Icon: UserPlus,
    image:
      "https://images.unsplash.com/photo-1556745753-b2904692b3cd?auto=format&fit=crop&w=600&q=70",
  },
  {
    n: "03",
    title: "Publicá tus productos",
    desc: "Subí fotos, precio y stock. Nuestra IA optimiza títulos y descripciones para que rankeen rápido.",
    Icon: Camera,
    image:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=70",
  },
  {
    n: "04",
    title: "Vendé y cobrá fácil",
    desc: "Cobrás con Mercado Pago hasta en 18 cuotas. Retiro disponible según tu plan.",
    Icon: TrendingUp,
    image:
      "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=600&q=70",
  },
];

export function HowItWorksSection() {
  return (
    <section
      className="max-w-[1184px] mx-auto px-4 mb-20"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#3483FA] mb-3">
            Para vendedores
          </p>
          <h2
            id="how-it-works-heading"
            className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[0.95]"
          >
            De cero a tu primera venta
            <br />
            <span className="text-[#3483FA]">en una tarde</span>
          </h2>
        </div>
        <p className="text-slate-600 text-base md:text-[15px] max-w-md leading-relaxed">
          Cuatro pasos reales. Sin letra chica, sin esperar aprobación de un comité.
        </p>
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {steps.map((step, idx) => (
          <li
            key={step.n}
            className={`relative flex flex-col rounded-2xl border bg-white overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.10)] ${
              idx === 1
                ? "border-[#3483FA]/40 shadow-[0_8px_30px_rgba(52,131,250,0.15)]"
                : "border-slate-200 shadow-[0_4px_18px_rgba(15,23,42,0.05)]"
            }`}
          >
            <div className="relative h-36 w-full overflow-hidden bg-slate-100">
              <Image
                src={step.image}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-900/10 to-transparent" />
              <span
                className="absolute top-3 left-3 text-[42px] font-black text-white leading-none tracking-tighter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                aria-hidden="true"
              >
                {step.n}
              </span>
            </div>
            <div className="flex-1 p-5 flex flex-col">
              <span className="w-10 h-10 rounded-xl bg-[#3483FA]/10 text-[#3483FA] flex items-center justify-center mb-3">
                <step.Icon size={20} strokeWidth={2} />
              </span>
              <h3 className="text-[16px] font-bold text-slate-900 leading-tight mb-2">
                {step.title}
              </h3>
              <p className="text-[13.5px] text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex justify-center">
        <Link
          href="/seller/register"
          prefetch={false}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[14px] py-3.5 px-7 rounded-xl shadow-[0_8px_24px_rgba(15,23,42,0.25)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-700"
        >
          Empezar ahora
          <ArrowRight size={16} strokeWidth={2.5} />
        </Link>
      </div>
    </section>
  );
}
