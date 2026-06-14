/**
 * Datos públicos del marketplace (E-E-A-T / confianza).
 * REGLA: solo cifras y afirmaciones REALES y verificables. Nada de métricas
 * infladas ni testimonios inventados (se agregan cuando haya reseñas reales).
 */

/** Highlights honestos para la grilla de "stats". Todos verdaderos en la etapa beta. */
export const MARKETPLACE_HIGHLIGHTS: { value: string; label: string }[] = [
  { value: "+700", label: "Productos publicados" },
  { value: "0%", label: "Comisión por venta (beta)" },
  { value: "Mercado Pago", label: "Pagos protegidos" },
  { value: "2026", label: "Lanzamiento" },
];

export const MARKETPLACE_STATS = {
  launchYear: "2026",
  shippingHighlight: "Envíos coordinados por cada vendedor",
  shippingDetail:
    "Cada vendedor define la forma de envío y el costo en su publicación. Los pagos se procesan con Mercado Pago.",
} as const;

export const FEATURED_SELLER = {
  name: "Maqjeez",
  category: "Tienda en el marketplace",
  description:
    "Tienda con catálogo de herramientas, maquinaria y repuestos publicada en MadsJeez.",
} as const;
