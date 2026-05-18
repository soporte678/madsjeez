import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vender en MadsJeez | Marketplace Argentino para Comercios",
  description:
    "Sumate a MadsJeez, el marketplace argentino para comercios que quieren vender online con pagos, SEO, dashboard, metricas y herramientas de crecimiento.",
  alternates: {
    canonical: "/vender",
  },
  openGraph: {
    title: "Vender en MadsJeez | Marketplace Argentino para Comercios",
    description:
      "Marketplace argentino con pagos, dashboard, SEO, captacion de vendedores y roadmap de herramientas para escalar ventas online.",
    url: "https://www.madsjeez.com.ar/vender",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vender en MadsJeez",
    description:
      "Marketplace argentino para vender online con tecnologia, pagos, SEO y herramientas de crecimiento comercial.",
  },
};

export default function VenderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
