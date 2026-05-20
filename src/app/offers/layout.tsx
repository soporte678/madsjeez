import type { Metadata } from "next";
import { canonicalMeta } from "@/lib/seo/canonical";

export const metadata: Metadata = {
  title: "Ofertas y promociones | MadsJeez Marketplace",
  description: "Ofertas, descuentos y promociones activas en el marketplace MadsJeez Argentina.",
  ...canonicalMeta("/offers"),
};

export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
