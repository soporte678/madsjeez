import type { Metadata } from "next";
import { canonicalMeta } from "@/lib/seo/canonical";

export const metadata: Metadata = {
  title: "Buscar productos | MadsJeez Marketplace",
  description: "Buscá productos, marcas y vendedores en el marketplace MadsJeez Argentina.",
  ...canonicalMeta("/search"),
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
