import type { Metadata } from "next";
import { canonicalMeta } from "@/lib/seo/canonical";
import { ROBOTS_NOINDEX_FOLLOW } from "@/lib/seo/robots-meta";

/**
 * /offers se renderiza client-side y puede mostrar 0 resultados. Hasta tener
 * un render server-side con ofertas reales garantizadas, va noindex,follow:
 * no aporta a Google ver "Cargando…" o grilla vacía, pero seguimos los links.
 */
export const metadata: Metadata = {
  title: "Ofertas y promociones | MadsJeez Marketplace",
  description: "Ofertas, descuentos y promociones activas en el marketplace MadsJeez Argentina.",
  robots: ROBOTS_NOINDEX_FOLLOW,
  ...canonicalMeta("/offers"),
};

export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
