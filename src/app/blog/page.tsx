import type { Metadata } from "next";
import BlogClient from "./BlogClient";

export const metadata: Metadata = {
  title: "Blog IA — Marketplace Argentina | MadsJeez",
  description:
    "Artículos sobre e-commerce, tendencias de marketplace, inteligencia artificial y ventas online en Argentina. Recursos para vendedores y compradores.",
  alternates: { canonical: "https://www.madsjeez.com.ar/blog" },
  openGraph: {
    title: "Blog IA — MadsJeez Marketplace Argentina",
    description:
      "Artículos sobre e-commerce, IA y ventas online en Argentina.",
    url: "https://www.madsjeez.com.ar/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog IA — MadsJeez",
    description: "Artículos sobre e-commerce, IA y ventas online en Argentina.",
  },
};

export default function BlogPage() {
  return <BlogClient />;
}
