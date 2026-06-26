import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cupones y descuentos | MadsJeez Marketplace",
  description:
    "Encontrá cupones y promociones exclusivas para comprar en MadsJeez. Herramientas, ferretería y más con descuento en Argentina.",
  openGraph: {
    title: "Cupones de descuento | MadsJeez",
    description: "Cupones exclusivos para el marketplace MadsJeez Argentina.",
    locale: "es_AR",
    type: "website",
  },
  twitter: { card: "summary", title: "Cupones | MadsJeez" },
}

export default function CouponsLayout({ children }: { children: React.ReactNode }) {
  return children
}
