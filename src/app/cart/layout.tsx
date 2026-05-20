import type { Metadata } from "next";
import { noindexPageMeta } from "@/lib/seo/robots-meta";

export const metadata: Metadata = noindexPageMeta("Carrito", {
  canonical: "/cart",
});

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
