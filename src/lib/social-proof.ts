/** Métricas y testimonios públicos del marketplace (E-E-A-T / confianza). */

export const MARKETPLACE_STATS = {
  productsPublished: "+10.000",
  productsPublishedRaw: 10000,
  sellers: "+20",
  sellersRaw: 20,
  buyers: "+100",
  buyersRaw: 100,
  launchYear: "2026",
  ordersPerMonth: "~150",
  ordersPerMonthRaw: 150,
  shippingHighlight: "Envíos en Zona Sur en menos de 24 hs",
  shippingDetail:
    "Logística coordinada desde Buenos Aires con entregas express en la zona sur del GBA cuando el vendedor y el producto lo permiten.",
} as const;

export const FEATURED_SELLER = {
  name: "Maqjeez",
  category: "Tienda destacada en el marketplace",
  description:
    "Referente entre los vendedores activos: catálogo amplio, respuesta rápida y operación profesional en MadsJeez.",
} as const;

export type Testimonial = {
  quote: string;
  author: string;
  role: string;
  location?: string;
};

/** Testimonios de presentación — reemplazar por reseñas verificadas cuando estén disponibles. */
export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Pasamos de responder consultas por WhatsApp a cerrar ventas con carrito y Mercado Pago. En el primer mes duplicamos pedidos fuera del local.",
    author: "Carlos M.",
    role: "Ferretería · GBA Sur",
    location: "Adrogué",
  },
  {
    quote:
      "Maqjeez nos ayudó a entender cómo armar fichas con fotos y precios claros. Hoy el catálogo se ve serio y los clientes confían más al comprar.",
    author: "Lucía R.",
    role: "Comercio asociado",
    location: "Spegazzini",
  },
  {
    quote:
      "Compré herramientas y repuestos sin ir a cinco lugares distintos. El seguimiento del envío y el pago en un solo paso me ahorraron tiempo.",
    author: "Martín G.",
    role: "Comprador frecuente",
    location: "Lanús",
  },
  {
    quote:
      "Publicamos más de mil SKU sin morir en planillas. El panel de ventas y las preguntas de compradores están centralizados.",
    author: "Vian Ferretería",
    role: "Vendedor · Herramientas",
    location: "Argentina",
  },
  {
    quote:
      "La visibilidad en categorías y las ofertas del marketplace nos trajeron compradores que no nos conocían por Instagram.",
    author: "Sofía T.",
    role: "Emprendimiento · Hogar",
    location: "Quilmes",
  },
  {
    quote:
      "Soporte respondió rápido cuando un envío se demoró. Eso marca la diferencia frente a un grupo de venta informal.",
    author: "Diego P.",
    role: "Comprador",
    location: "Avellaneda",
  },
];
