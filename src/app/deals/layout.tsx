import type { Metadata } from "next";
import { canonicalMeta } from "@/lib/seo/canonical";
import { ROBOTS_NOINDEX_FOLLOW } from "@/lib/seo/robots-meta";

/** CSR + grilla potencialmente vacía → noindex,follow hasta tener SSR real. */
export const metadata: Metadata = {
  title: "Descuentos | MadsJeez Marketplace",
  description: "Productos con descuento en el marketplace MadsJeez Argentina.",
  robots: ROBOTS_NOINDEX_FOLLOW,
  ...canonicalMeta("/deals"),
};

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
