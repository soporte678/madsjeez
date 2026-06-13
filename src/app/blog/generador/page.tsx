import type { Metadata } from "next";
import BlogClient from "../BlogClient";

/**
 * Herramienta interna de generación de artículos SEO con IA.
 * Reubicada desde /blog (ahora blog público) a /blog/generador.
 * noindex: es una herramienta, no contenido para buscadores.
 * TODO (recomendado): mover bajo /admin para gating de auth (usa /api/ai/blog, pago).
 */
export const metadata: Metadata = {
  title: "Generador de artículos — Madsjeez",
  robots: { index: false, follow: false },
};

export default function BlogGeneratorPage() {
  return <BlogClient />;
}
