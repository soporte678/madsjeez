import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vender en MadsJeez",
  description:
    "Publica tus productos y empieza a vender en MadsJeez Marketplace. Gestion de catalogo, pedidos y crecimiento para vendedores en Argentina.",
  alternates: {
    canonical: "/sell",
  },
  openGraph: {
    title: "Vender en MadsJeez",
    description:
      "Empieza a vender productos en MadsJeez Marketplace con herramientas para gestionar y escalar tus ventas.",
    url: "https://www.madsjeez.com.ar/sell",
    type: "website",
  },
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return children;
}
