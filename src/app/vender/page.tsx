import type { Metadata } from "next";
import VenderClient from "./VenderClient";

export const metadata: Metadata = {
  title: "Vendé en MadsJeez — Marketplace Argentina | Abrí tu tienda gratis",
  description:
    "Publicá tus productos en MadsJeez y llegá a compradores de todo el país. 0% comisión sobre tus ventas durante la etapa beta. Cobrás con tu Mercado Pago.",
  // Consolidación SEO: el hub canónico de captación de vendedores es
  // /vender-en-madsjeez (keyword-rich). Esta página sigue funcionando pero
  // delega su señal de indexación al hub para no competir por la misma intención.
  alternates: { canonical: "https://www.madsjeez.com.ar/vender-en-madsjeez" },
  openGraph: {
    title: "Vendé en MadsJeez — Marketplace Argentina",
    description:
      "Publicá tus productos y llegá a compradores de todo el país. 0% comisión sobre tus ventas, pagos directos a tu Mercado Pago.",
    url: "https://www.madsjeez.com.ar/vender",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vendé en MadsJeez — Marketplace Argentina",
    description: "Publicá tus productos y llegá a compradores de todo el país.",
  },
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Vender en MadsJeez",
  description:
    "Plataforma de ventas online para vendedores argentinos. Publicá productos, gestioná pedidos y cobrá con Mercado Pago.",
  provider: {
    "@type": "Organization",
    name: "MadsJeez",
    url: "https://www.madsjeez.com.ar",
  },
  areaServed: { "@type": "Country", name: "Argentina" },
  url: "https://www.madsjeez.com.ar/vender",
};

export default function VenderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <VenderClient />
    </>
  );
}
