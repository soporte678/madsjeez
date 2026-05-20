import type { Metadata } from "next";
import { canonicalMeta } from "@/lib/seo/canonical";

export const metadata: Metadata = {
  title: "Descuentos | MadsJeez Marketplace",
  description: "Productos con descuento en el marketplace MadsJeez Argentina.",
  ...canonicalMeta("/deals"),
};

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
