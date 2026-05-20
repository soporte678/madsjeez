import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";
import { canonicalMeta } from "@/lib/seo/canonical";

export const metadata: Metadata = {
  ...canonicalMeta("/"),
  title:
    "MadsJeez | Marketplace Argentina — productos, catálogo, ofertas y MADSJEEZ Ads",
  description:
    "Comprá y vendé en Madsjeez: ver ofertas del catálogo, explorar categorías, campañas MADSJEEZ Ads activas, pagos con Mercado Pago y panel para vendedores en Argentina.",
  openGraph: {
    title:
      "MadsJeez | Marketplace Argentina — productos, catálogo, ofertas y MADSJEEZ Ads",
    description:
      "Marketplace argentino: catálogo, ofertas, MADSJEEZ Ads y herramientas para vendedores del Commerce Group.",
    url: "https://www.madsjeez.com.ar/",
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
