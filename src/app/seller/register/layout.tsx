import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registro de Vendedores",
  description:
    "Registra tu cuenta de vendedor en MadsJeez y publica productos para vender online en Argentina.",
  alternates: {
    canonical: "/seller/register",
  },
  openGraph: {
    title: "Registro de Vendedores | MadsJeez",
    description:
      "Crea tu cuenta de vendedor y activa tu tienda en MadsJeez Marketplace.",
    url: "https://www.madsjeez.com.ar/seller/register",
    type: "website",
  },
};

export default function SellerRegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
