import type { Metadata } from "next";
import { canonicalMeta } from "@/lib/seo/canonical";

export const metadata: Metadata = {
  title: "Centro de ayuda | MadsJeez Marketplace",
  description:
    "Ayuda para comprar y vender en el marketplace MadsJeez Argentina: envíos, pagos, cuenta y publicaciones.",
  ...canonicalMeta("/help"),
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
