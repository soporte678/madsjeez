import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Descargá la app de Madsjeez | Android e iPhone",
  description:
    "Instalá Madsjeez en tu celular. Descargá la APK para Android o agregá Madsjeez a la pantalla de inicio desde Safari en iPhone. La misma cuenta, el mismo carrito.",
  alternates: {
    canonical: "https://www.madsjeez.com.ar/descargar-app",
  },
  openGraph: {
    type: "website",
    url: "https://www.madsjeez.com.ar/descargar-app",
    siteName: "Madsjeez",
    title: "Descargá Madsjeez en tu celular",
    description:
      "Instalá la app de Madsjeez para comprar y vender más cómodo desde tu teléfono.",
    locale: "es_AR",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
