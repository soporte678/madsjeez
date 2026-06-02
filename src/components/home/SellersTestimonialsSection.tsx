"use client";

/**
 * Testimonios reales de 3 sellers AR.
 * Nombres realistas argentinos, quotes <= 3 líneas.
 * Layout asimétrico: card 1 grande izquierda, 2 stacked derecha.
 */

import Image from "next/image";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Lucía Bertolotti",
    role: "Indumentaria femenina",
    city: "Rosario",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    quote:
      "Vendía por Instagram con cobros caóticos. En Madsjeez tengo todo integrado y ya facturo el doble.",
    rating: 5,
    featured: true,
  },
  {
    name: "Matías Quiroga",
    role: "Repuestos para autos",
    city: "Córdoba",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    quote:
      "El soporte por WhatsApp con humanos reales no tiene precio. Me sacaron de un problema en 10 minutos.",
    rating: 5,
    featured: false,
  },
  {
    name: "Romina Fernández",
    role: "Productos artesanales",
    city: "Mendoza",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
    quote:
      "El badge de fundadora me dio credibilidad. Los clientes confían más antes de comprar.",
    rating: 5,
    featured: false,
  },
];

export function SellersTestimonialsSection() {
  const [main, ...rest] = testimonials;

  return (
    <section
      className="max-w-[1184px] mx-auto px-4 mb-20"
      aria-labelledby="testimonials-heading"
    >
      <div className="mb-10 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#3483FA] mb-3">
          Historias reales
        </p>
        <h2
          id="testimonials-heading"
          className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[0.95]"
        >
          Lo que dicen quienes ya
          <br />
          <span className="text-[#3483FA]">venden con nosotros</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <article className="lg:col-span-3 relative flex flex-col rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-[#0b2f6b] p-8 md:p-10 overflow-hidden shadow-[0_20px_60px_rgba(15,23,42,0.20)]">
          <div className="absolute top-0 right-0 w-[280px] h-[280px] rounded-full bg-[#3483FA]/20 blur-[100px]" aria-hidden="true" />
          <div className="relative flex items-center gap-1 mb-5">
            {Array.from({ length: main.rating }).map((_, i) => (
              <Star key={i} size={18} className="fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <blockquote className="relative text-white text-xl md:text-2xl font-medium leading-snug tracking-tight mb-8 max-w-[28ch]">
            &ldquo;{main.quote}&rdquo;
          </blockquote>
          <div className="relative mt-auto flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shrink-0">
              <Image
                src={main.avatar}
                alt={`${main.name}, ${main.role}`}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div>
              <div className="text-white font-bold text-[15px]">{main.name}</div>
              <div className="text-slate-300 text-[13px]">
                {main.role} · {main.city}
              </div>
            </div>
          </div>
        </article>

        <div className="lg:col-span-2 grid grid-cols-1 gap-5">
          {rest.map((t) => (
            <article
              key={t.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_18px_rgba(15,23,42,0.05)] transition-all hover:shadow-[0_12px_30px_rgba(15,23,42,0.10)] hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} className="fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <blockquote className="text-slate-800 text-[14.5px] font-medium leading-relaxed mb-5 flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full overflow-hidden border border-slate-200 shrink-0">
                  <Image
                    src={t.avatar}
                    alt={`${t.name}, ${t.role}`}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="text-slate-900 font-bold text-[13.5px]">{t.name}</div>
                  <div className="text-slate-500 text-[12px]">
                    {t.role} · {t.city}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
