/**
 * Campañas de cupones por fecha especial (Madsjeez).
 *
 * Plantillas de promoción que los vendedores pueden ACTIVAR para su tienda con 1
 * clic. Cada mes mostramos ~20: las fechas especiales del mes + un pool evergreen.
 * No crean cupones automáticamente — el vendedor las adopta y se genera un Coupon
 * real con su sellerId (descuento sugerido, código y vigencia).
 *
 * Las fechas son de referencia argentina; el vendedor define el descuento final.
 */

export type CouponTemplate = {
  id: string;
  occasion: string;
  emoji: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  /** prefijo del código (se le agrega un sufijo único por vendedor) */
  codePrefix: string;
  /** vigencia en días desde que el vendedor lo activa */
  durationDays: number;
  /** meses aplicables (1-12) o "any" para evergreen */
  months: number[] | "any";
};

/** Fechas especiales argentinas, distribuidas por mes. */
const SPECIAL_DATES: CouponTemplate[] = [
  { id: "verano", occasion: "Liquidación de verano", emoji: "☀️", title: "Liquidación de verano", description: "Descuento de temporada para mover stock en enero y febrero.", discountType: "percentage", discountValue: 15, codePrefix: "VERANO", durationDays: 20, months: [1, 2] },
  { id: "san-valentin", occasion: "San Valentín", emoji: "❤️", title: "Promo San Valentín", description: "Descuento para regalos del 14 de febrero.", discountType: "percentage", discountValue: 15, codePrefix: "SANVALENTIN", durationDays: 10, months: [2] },
  { id: "vuelta-al-cole", occasion: "Vuelta al cole", emoji: "🎒", title: "Vuelta al cole", description: "Promo para la vuelta a clases (febrero–marzo).", discountType: "percentage", discountValue: 10, codePrefix: "VUELTACOLE", durationDays: 21, months: [2, 3] },
  { id: "dia-mujer", occasion: "Día de la Mujer", emoji: "💜", title: "Día de la Mujer", description: "Promo especial del 8 de marzo.", discountType: "percentage", discountValue: 12, codePrefix: "MUJER", durationDays: 7, months: [3] },
  { id: "otono", occasion: "Ofertas de otoño", emoji: "🍂", title: "Ofertas de otoño", description: "Renová stock con descuentos de otoño.", discountType: "percentage", discountValue: 12, codePrefix: "OTONO", durationDays: 25, months: [4, 5] },
  { id: "hot-sale", occasion: "Hot Sale", emoji: "🔥", title: "Hot Sale", description: "El evento de descuentos más fuerte. Maximizá ventas en mayo.", discountType: "percentage", discountValue: 25, maxDiscount: 30000, codePrefix: "HOTSALE", durationDays: 5, months: [5] },
  { id: "dia-padre", occasion: "Día del Padre", emoji: "👔", title: "Día del Padre", description: "Promo para regalos del Día del Padre (junio).", discountType: "percentage", discountValue: 18, codePrefix: "PADRE", durationDays: 12, months: [6] },
  { id: "invierno", occasion: "Ofertas de invierno", emoji: "❄️", title: "Ofertas de invierno", description: "Descuentos para la temporada de invierno.", discountType: "percentage", discountValue: 15, codePrefix: "INVIERNO", durationDays: 25, months: [6, 7] },
  { id: "dia-amigo", occasion: "Día del Amigo", emoji: "🤝", title: "Día del Amigo", description: "Promo del 20 de julio.", discountType: "fixed", discountValue: 5000, minPurchase: 25000, codePrefix: "AMIGO", durationDays: 7, months: [7] },
  { id: "dia-nino", occasion: "Día del Niño", emoji: "🧸", title: "Día del Niño", description: "Promo para el Día del Niño (agosto).", discountType: "percentage", discountValue: 15, codePrefix: "NINO", durationDays: 12, months: [8] },
  { id: "primavera", occasion: "Día de la Primavera", emoji: "🌸", title: "Promo de primavera", description: "Descuento por la primavera y el Día del Estudiante (21/9).", discountType: "percentage", discountValue: 15, codePrefix: "PRIMAVERA", durationDays: 15, months: [9] },
  { id: "dia-madre", occasion: "Día de la Madre", emoji: "💐", title: "Día de la Madre", description: "Una de las fechas más fuertes del año (octubre).", discountType: "percentage", discountValue: 20, maxDiscount: 25000, codePrefix: "MADRE", durationDays: 12, months: [10] },
  { id: "black-friday", occasion: "Black Friday", emoji: "🛍️", title: "Black Friday", description: "Descuentos fuertes del último viernes de noviembre.", discountType: "percentage", discountValue: 30, maxDiscount: 40000, codePrefix: "BLACKFRIDAY", durationDays: 4, months: [11] },
  { id: "cyber-monday", occasion: "CyberMonday", emoji: "💻", title: "CyberMonday", description: "Promo del evento de e-commerce (noviembre).", discountType: "percentage", discountValue: 25, codePrefix: "CYBER", durationDays: 4, months: [11] },
  { id: "navidad", occasion: "Navidad", emoji: "🎄", title: "Promo de Navidad", description: "Descuento para las compras navideñas de diciembre.", discountType: "percentage", discountValue: 20, codePrefix: "NAVIDAD", durationDays: 20, months: [12] },
  { id: "fin-de-ano", occasion: "Fin de año", emoji: "🎆", title: "Liquidación de fin de año", description: "Cerrá el año moviendo stock con descuentos.", discountType: "percentage", discountValue: 18, codePrefix: "FINDEANO", durationDays: 15, months: [12, 1] },
];

/** Promos evergreen disponibles todo el año (rellenan hasta ~20 por mes). */
const EVERGREEN: CouponTemplate[] = [
  { id: "bienvenida", occasion: "Bienvenida", emoji: "👋", title: "Cupón de bienvenida", description: "Descuento para la primera compra de nuevos clientes.", discountType: "percentage", discountValue: 10, codePrefix: "BIENVENIDA", durationDays: 30, months: "any" },
  { id: "primera-compra", occasion: "Primera compra", emoji: "🛒", title: "10% en tu primera compra", description: "Incentivá a que prueben tu tienda.", discountType: "percentage", discountValue: 10, codePrefix: "PRIMERA", durationDays: 30, months: "any" },
  { id: "fin-de-semana", occasion: "Fin de semana", emoji: "📅", title: "Promo de fin de semana", description: "Descuento corto para impulsar ventas de viernes a domingo.", discountType: "percentage", discountValue: 12, codePrefix: "FINDE", durationDays: 3, months: "any" },
  { id: "liquidacion", occasion: "Liquidación de stock", emoji: "🏷️", title: "Liquidación de stock", description: "Movés mercadería con rotación lenta.", discountType: "percentage", discountValue: 20, codePrefix: "LIQUIDACION", durationDays: 14, months: "any" },
  { id: "mayorista", occasion: "Mayorista", emoji: "📦", title: "Descuento por cantidad", description: "Para compras grandes / revendedores.", discountType: "fixed", discountValue: 10000, minPurchase: 80000, codePrefix: "MAYORISTA", durationDays: 30, months: "any" },
  { id: "envio", occasion: "Beneficio de envío", emoji: "🚚", title: "Descuento que cubre el envío", description: "Monto fijo para compensar el costo de envío.", discountType: "fixed", discountValue: 4000, minPurchase: 20000, codePrefix: "ENVIO", durationDays: 21, months: "any" },
  { id: "combo", occasion: "Combo", emoji: "🎁", title: "Promo combo", description: "Descuento al llevar varios productos.", discountType: "percentage", discountValue: 15, minPurchase: 40000, codePrefix: "COMBO", durationDays: 21, months: "any" },
  { id: "recompra", occasion: "Recompra", emoji: "🔁", title: "Cupón de recompra", description: "Premiá a clientes que vuelven a comprar.", discountType: "percentage", discountValue: 12, codePrefix: "RECOMPRA", durationDays: 30, months: "any" },
  { id: "flash", occasion: "Oferta flash", emoji: "⚡", title: "Oferta flash 48 hs", description: "Urgencia con un descuento de 2 días.", discountType: "percentage", discountValue: 18, codePrefix: "FLASH", durationDays: 2, months: "any" },
  { id: "seguinos", occasion: "Seguinos", emoji: "📲", title: "Promo por seguirte en redes", description: "Descuento para quienes te siguen en Instagram o WhatsApp.", discountType: "percentage", discountValue: 10, codePrefix: "SEGUINOS", durationDays: 30, months: "any" },
  { id: "repuestos", occasion: "Repuestos", emoji: "🔧", title: "Promo en repuestos", description: "Descuento orientado a repuestos y herramientas.", discountType: "percentage", discountValue: 12, codePrefix: "REPUESTOS", durationDays: 21, months: "any" },
  { id: "ferreteria", occasion: "Ferretería", emoji: "🛠️", title: "Promo de ferretería", description: "Descuento para artículos de ferretería.", discountType: "percentage", discountValue: 12, codePrefix: "FERRE", durationDays: 21, months: "any" },
  { id: "monto-fijo", occasion: "Monto fijo", emoji: "💵", title: "$5.000 de descuento", description: "Descuento de monto fijo sobre compras medianas.", discountType: "fixed", discountValue: 5000, minPurchase: 30000, codePrefix: "AHORRA", durationDays: 21, months: "any" },
  { id: "cliente-vip", occasion: "Cliente VIP", emoji: "⭐", title: "Promo cliente frecuente", description: "Beneficio para tus mejores compradores.", discountType: "percentage", discountValue: 15, codePrefix: "VIP", durationDays: 30, months: "any" },
  { id: "stock-nuevo", occasion: "Stock nuevo", emoji: "🆕", title: "Lanzamiento de producto", description: "Impulsá productos recién publicados.", discountType: "percentage", discountValue: 10, codePrefix: "NUEVO", durationDays: 14, months: "any" },
  { id: "pack", occasion: "Pack ahorro", emoji: "🧰", title: "Pack ahorro", description: "Descuento al comprar el kit completo.", discountType: "percentage", discountValue: 15, minPurchase: 50000, codePrefix: "PACK", durationDays: 21, months: "any" },
];

export const MONTH_NAMES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Devuelve ~20 plantillas para el mes (1-12): fechas especiales del mes + evergreen. */
export function getCampaignsForMonth(month: number): CouponTemplate[] {
  const specials = SPECIAL_DATES.filter((t) => Array.isArray(t.months) && t.months.includes(month));
  return [...specials, ...EVERGREEN].slice(0, 20);
}

export function getCouponTemplateById(id: string): CouponTemplate | undefined {
  return [...SPECIAL_DATES, ...EVERGREEN].find((t) => t.id === id);
}
