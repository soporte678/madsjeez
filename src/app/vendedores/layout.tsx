import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sumá tu tienda a Madsjeez | 200 publicaciones gratis para vendedores",
  description:
    "Estamos sumando 1000 vendedores a Madsjeez. Te cargamos hasta 200 publicaciones gratis para que tengas una nueva vidriera digital para tus productos.",
  keywords:
    "vender en madsjeez, marketplace argentino vendedores, publicaciones gratis, canal de venta adicional, ferretería online, emprendedores argentina",
  alternates: {
    canonical: "https://www.madsjeez.com.ar/vendedores",
  },
  openGraph: {
    type: "website",
    url: "https://www.madsjeez.com.ar/vendedores",
    siteName: "MadsJeez Marketplace",
    title: "Sumá tu tienda a Madsjeez — 200 publicaciones gratis",
    description:
      "Estamos sumando 1000 vendedores. Te cargamos hasta 200 publicaciones gratis para que tengas una nueva vidriera digital.",
    locale: "es_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: "200 publicaciones gratis — Madsjeez Marketplace",
    description: "Sumá tu tienda a Madsjeez. Carga inicial gratis para los primeros 1000 vendedores.",
  },
};

export default function VendedoresLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
