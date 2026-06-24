"use client"
import Link from "next/link"

const ADS = [
  {
    id: "ad-1",
    bg: "from-[#1a1a2e] to-[#16213e]",
    title: "ENVÍO GRATIS",
    subtitle: "En miles de productos",
    cta: "Ver ofertas",
    link: "/ofertas",
    accent: "text-green-400",
  },
  {
    id: "ad-2",
    bg: "from-[#0f3460] to-[#533483]",
    title: "MADSJEEZ ADS",
    subtitle: "Potenciá tus ventas con publicidad",
    cta: "Empezar ahora",
    link: "/ads",
    accent: "text-primary",
  },
  {
    id: "ad-3",
    bg: "from-[#e94560] to-[#0f3460]",
    title: "OFERTAS DEL DÍA",
    subtitle: "Nuevos descuentos todos los días en el marketplace",
    cta: "Ver ofertas",
    link: "/ofertas",
    accent: "text-white",
  },
]

export function AdBanner({ variant = "horizontal" }: { variant?: "horizontal" | "sidebar" }) {
  const ad = ADS[0]

  if (variant === "sidebar") {
    return (
      <Link href={ad.link} className="block">
        <div className={`bg-gradient-to-br ${ad.bg} rounded-xl p-5 text-white hover:shadow-lg transition-shadow`}>
          <p className="text-[10px] font-bold tracking-widest text-white/60 mb-2">PUBLICIDAD</p>
          <h4 className={`text-lg font-black ${ad.accent}`}>{ad.title}</h4>
          <p className="text-sm text-white/80 mt-1">{ad.subtitle}</p>
          <span className="inline-block mt-3 text-sm font-semibold underline underline-offset-4">{ad.cta} &rsaquo;</span>
        </div>
      </Link>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {ADS.slice(0, 2).map(a => (
        <Link key={a.id} href={a.link}>
          <div className={`bg-gradient-to-r ${a.bg} rounded-xl p-6 text-white hover:shadow-lg transition-shadow flex items-center gap-4`}>
            <div className="flex-1">
              <p className="text-[10px] font-bold tracking-widest text-white/50">PUBLICIDAD</p>
              <h4 className={`text-xl font-black mt-1 ${a.accent}`}>{a.title}</h4>
              <p className="text-sm text-white/80 mt-1">{a.subtitle}</p>
              <span className="inline-block mt-2 text-sm font-semibold underline underline-offset-4">{a.cta} &rsaquo;</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
