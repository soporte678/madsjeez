/**
 * Centro de ayuda (compradores) — contenido data-driven, honesto y beta-aware.
 * Reglas: nada de "24/7", garantías falsas ni teléfonos inventados. Pagos/envíos
 * "según el vendedor y la publicación". Sin prometer lo que el negocio no cumple.
 */

export type HelpSection = { h2: string; paragraphs: string[]; list?: string[] };
export type HelpFaq = { question: string; answer: string };

export type HelpArticle = {
  slug: string;
  category: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  intro: string;
  sections: HelpSection[];
  faqs: HelpFaq[];
  related: string[];
};

export const HELP_CATEGORIES = ["Comprar", "Pagos", "Envíos", "Devoluciones y garantía", "Vendedores", "Repuestos"] as const;

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "como-comprar",
    category: "Comprar",
    title: "Cómo comprar en Madsjeez",
    seoTitle: "Cómo comprar en Madsjeez | Centro de ayuda",
    metaDescription: "Aprendé a comprar en Madsjeez paso a paso: buscar productos, consultar al vendedor, pagar y seguir tu pedido.",
    excerpt: "Buscar, consultar, pagar y seguir tu pedido: comprar en Madsjeez, paso a paso.",
    intro: "Comprar en Madsjeez es simple. Te explicamos los pasos para encontrar lo que buscás y completar tu compra con tranquilidad.",
    sections: [
      { h2: "Encontrá el producto", paragraphs: ["Usá el buscador o explorá por categoría. En cada publicación vas a ver fotos, precio, descripción y datos del vendedor."], list: ["Buscá por nombre, marca o modelo.", "Filtrá por categoría o condición.", "Compará entre publicaciones similares."] },
      { h2: "Consultá y comprá", paragraphs: ["Si tenés dudas, consultá al vendedor desde la ficha del producto antes de comprar. Cuando estés listo, agregá al carrito y completá la compra con los medios de pago que ofrece esa publicación."] },
      { h2: "Seguí tu pedido", paragraphs: ["Una vez confirmada la compra, seguís el estado de tu pedido desde tu cuenta, en la sección de compras."] },
    ],
    faqs: [
      { question: "¿Necesito una cuenta para comprar?", answer: "Tener cuenta te permite seguir tus compras, guardar favoritos y contactar vendedores más fácil." },
      { question: "¿Puedo consultar antes de comprar?", answer: "Sí, desde la ficha del producto podés hacerle preguntas al vendedor." },
    ],
    related: ["metodos-de-pago", "como-seguir-mi-pedido", "como-contactar-al-vendedor"],
  },
  {
    slug: "metodos-de-pago",
    category: "Pagos",
    title: "Métodos de pago",
    seoTitle: "Métodos de pago en Madsjeez | Centro de ayuda",
    metaDescription: "Qué medios de pago podés usar en Madsjeez. Las opciones dependen de cada vendedor y publicación.",
    excerpt: "Qué medios de pago hay y cómo saber cuáles acepta cada vendedor.",
    intro: "Los medios de pago disponibles dependen de cada vendedor y publicación. Te contamos qué podés encontrar.",
    sections: [
      { h2: "Medios disponibles", paragraphs: ["Según la publicación, podés pagar con Mercado Pago (tarjeta, transferencia), y en algunos casos transferencia bancaria. Cada publicación muestra los medios que acepta el vendedor."] },
      { h2: "Pago seguro", paragraphs: ["Pagá siempre dentro de la plataforma o por los medios que indica la publicación. No transfieras dinero por fuera ni a cuentas que no estén indicadas en la compra."] },
    ],
    faqs: [
      { question: "¿Puedo pagar en cuotas?", answer: "Depende del vendedor y del medio de pago de la publicación. Lo ves antes de confirmar la compra." },
      { question: "¿Es seguro pagar?", answer: "Sí, siempre que uses los medios de pago indicados en la publicación. Evitá pagos por fuera de la plataforma." },
    ],
    related: ["como-comprar", "que-hago-si-no-recibi-mi-compra"],
  },
  {
    slug: "como-se-realiza-el-envio",
    category: "Envíos",
    title: "Cómo se realiza el envío",
    seoTitle: "Cómo funcionan los envíos en Madsjeez | Centro de ayuda",
    metaDescription: "Cómo se hacen los envíos en Madsjeez. El costo, la forma y los plazos dependen de cada vendedor y publicación.",
    excerpt: "Costos, formas y plazos de envío: dependen de cada publicación.",
    intro: "El envío se coordina según cada vendedor y publicación. Te explicamos qué tener en cuenta.",
    sections: [
      { h2: "Costo y forma de envío", paragraphs: ["El costo y la forma de envío (a domicilio, retiro, etc.) dependen de cada publicación. Lo vas a ver antes de confirmar la compra. Algunas publicaciones pueden ofrecer envío bonificado; otras lo calculan según tu zona."] },
      { h2: "Plazos de entrega", paragraphs: ["Los tiempos de entrega varían según el vendedor, el método elegido y tu ubicación. Si tenés dudas sobre el plazo, consultá al vendedor antes de comprar."] },
    ],
    faqs: [
      { question: "¿El envío es gratis?", answer: "Depende de la publicación. Algunas ofrecen envío bonificado y otras calculan el costo antes de pagar." },
      { question: "¿Cuánto tarda en llegar?", answer: "Varía según el vendedor, el método de envío y tu zona. Consultá al vendedor si necesitás un plazo estimado." },
    ],
    related: ["como-seguir-mi-pedido", "que-hago-si-no-recibi-mi-compra"],
  },
  {
    slug: "como-seguir-mi-pedido",
    category: "Comprar",
    title: "Cómo seguir mi pedido",
    seoTitle: "Cómo seguir mi pedido en Madsjeez | Centro de ayuda",
    metaDescription: "Seguí el estado de tu compra en Madsjeez desde tu cuenta, en la sección de compras.",
    excerpt: "Dónde ver el estado de tu compra y el seguimiento del envío.",
    intro: "Después de comprar, podés seguir el estado de tu pedido desde tu cuenta.",
    sections: [
      { h2: "Desde tu cuenta", paragraphs: ["Entrá a la sección de compras de tu cuenta. Ahí vas a ver cada pedido con su estado (pendiente, en preparación, en camino, entregado) y, si el vendedor lo cargó, el número de seguimiento."] },
      { h2: "Si no ves novedades", paragraphs: ["Si pasó tiempo y el estado no avanza, consultá al vendedor desde el pedido. La mayoría responde dudas sobre la preparación y el envío."] },
    ],
    faqs: [
      { question: "¿Dónde veo el seguimiento?", answer: "En la sección de compras de tu cuenta, dentro del detalle del pedido." },
      { question: "¿Qué hago si no avanza?", answer: "Consultá al vendedor desde el pedido. Si no tenés respuesta, podés abrir un reclamo." },
    ],
    related: ["como-se-realiza-el-envio", "que-hago-si-no-recibi-mi-compra", "como-contactar-al-vendedor"],
  },
  {
    slug: "como-cancelar-una-compra",
    category: "Comprar",
    title: "Cómo cancelar una compra",
    seoTitle: "Cómo cancelar una compra en Madsjeez | Centro de ayuda",
    metaDescription: "Cómo cancelar una compra en Madsjeez y qué tener en cuenta según el estado del pedido.",
    excerpt: "Cuándo y cómo se puede cancelar una compra.",
    intro: "Podés intentar cancelar una compra según el estado del pedido y las condiciones del vendedor.",
    sections: [
      { h2: "Antes del envío", paragraphs: ["Si el vendedor todavía no despachó el producto, lo más rápido es contactarlo desde el pedido para coordinar la cancelación. Cada vendedor define sus condiciones."] },
      { h2: "Si ya fue enviado", paragraphs: ["Si el producto ya está en camino, la cancelación puede no ser posible y quizás corresponda gestionar una devolución una vez recibido. Consultá la política de la publicación y al vendedor."] },
    ],
    faqs: [
      { question: "¿Siempre puedo cancelar?", answer: "Depende del estado del pedido y de las condiciones del vendedor. Antes del envío suele ser más simple." },
      { question: "¿Me devuelven el dinero?", answer: "El reembolso depende del medio de pago y de la política aplicable. Consultá al vendedor y revisá la política de reembolsos." },
    ],
    related: ["como-hacer-una-devolucion", "que-hago-si-no-recibi-mi-compra"],
  },
  {
    slug: "como-hacer-una-devolucion",
    category: "Devoluciones y garantía",
    title: "Cómo hacer una devolución",
    seoTitle: "Cómo hacer una devolución en Madsjeez | Centro de ayuda",
    metaDescription: "Cómo gestionar una devolución en Madsjeez si el producto no es lo que esperabas o llegó con problemas.",
    excerpt: "Pasos para gestionar una devolución y cuándo corresponde.",
    intro: "Si el producto no es lo que esperabas o llegó con problemas, podés gestionar una devolución según las condiciones aplicables.",
    sections: [
      { h2: "Cuándo corresponde", paragraphs: ["Una devolución suele corresponder cuando el producto llega dañado, es notablemente distinto a lo publicado o tiene un problema de garantía. Revisá la política de reembolsos y las condiciones del vendedor."] },
      { h2: "Cómo gestionarla", paragraphs: ["Contactá al vendedor desde el pedido y, si no llegan a un acuerdo, abrí un reclamo con fotos y descripción del problema. El equipo de soporte revisa el caso con la evidencia de ambas partes."] },
    ],
    faqs: [
      { question: "¿Cuánto tiempo tengo?", answer: "Reportá el problema lo antes posible. Revisá la política de reembolsos para los plazos aplicables." },
      { question: "¿Qué necesito para el reclamo?", answer: "Fotos del producto y una descripción clara del problema ayudan a resolverlo más rápido." },
    ],
    related: ["garantia-de-productos", "que-hago-si-no-recibi-mi-compra"],
  },
  {
    slug: "garantia-de-productos",
    category: "Devoluciones y garantía",
    title: "Garantía de productos",
    seoTitle: "Garantía de productos en Madsjeez | Centro de ayuda",
    metaDescription: "Cómo funciona la garantía de los productos en Madsjeez. Depende del vendedor, el producto y la ley aplicable.",
    excerpt: "Qué garantía tienen los productos y cómo reclamarla.",
    intro: "La garantía depende del producto, del vendedor y de la normativa vigente. Te contamos qué tener en cuenta.",
    sections: [
      { h2: "Qué cubre", paragraphs: ["Muchos productos cuentan con garantía del vendedor o del fabricante. La cobertura y el plazo dependen de cada caso. Revisá la descripción de la publicación y consultá al vendedor antes de comprar."] },
      { h2: "Cómo reclamarla", paragraphs: ["Si el producto presenta una falla cubierta, contactá al vendedor desde el pedido. Guardá el comprobante de compra y, si aplica, la documentación de garantía."] },
    ],
    faqs: [
      { question: "¿Todos los productos tienen garantía?", answer: "No necesariamente. Depende del producto y del vendedor. Revisá la publicación y consultá antes de comprar." },
      { question: "¿Cómo hago valer la garantía?", answer: "Contactá al vendedor con tu comprobante de compra y la descripción de la falla." },
    ],
    related: ["como-hacer-una-devolucion", "como-elegir-el-repuesto-correcto"],
  },
  {
    slug: "que-hago-si-no-recibi-mi-compra",
    category: "Devoluciones y garantía",
    title: "Qué hago si no recibí mi compra",
    seoTitle: "No recibí mi compra en Madsjeez: qué hacer | Centro de ayuda",
    metaDescription: "Pasos a seguir si no recibiste tu compra en Madsjeez: revisar el seguimiento, contactar al vendedor y abrir un reclamo.",
    excerpt: "Pasos si tu pedido no llega: seguimiento, vendedor y reclamo.",
    intro: "Si tu pedido no llegó en el plazo esperado, seguí estos pasos.",
    sections: [
      { h2: "Revisá el seguimiento", paragraphs: ["Entrá al detalle del pedido en tu cuenta y mirá el estado y el seguimiento, si el vendedor lo cargó. A veces el retraso es del transporte."] },
      { h2: "Contactá y reclamá", paragraphs: ["Si no hay novedades, contactá al vendedor desde el pedido. Si no obtenés respuesta o solución, abrí un reclamo: el equipo de soporte revisa el caso con la información disponible."] },
    ],
    faqs: [
      { question: "¿Cuándo abro un reclamo?", answer: "Si pasó el plazo razonable, no tenés respuesta del vendedor o el envío no avanza." },
      { question: "¿Recupero mi dinero?", answer: "Depende del caso y del medio de pago. El reclamo busca resolver la situación con la evidencia de ambas partes." },
    ],
    related: ["como-seguir-mi-pedido", "como-hacer-una-devolucion"],
  },
  {
    slug: "como-contactar-al-vendedor",
    category: "Comprar",
    title: "Cómo contactar al vendedor",
    seoTitle: "Cómo contactar al vendedor en Madsjeez | Centro de ayuda",
    metaDescription: "Cómo hacerle preguntas al vendedor en Madsjeez antes y después de comprar.",
    excerpt: "Dónde y cómo consultar al vendedor por un producto o pedido.",
    intro: "Podés consultar al vendedor antes de comprar y también después, por tu pedido.",
    sections: [
      { h2: "Antes de comprar", paragraphs: ["Desde la ficha del producto podés hacer preguntas al vendedor: compatibilidad, medidas, stock, envío y cualquier duda. Es la mejor forma de comprar con seguridad."] },
      { h2: "Después de comprar", paragraphs: ["Desde el detalle del pedido podés contactar al vendedor por la preparación, el envío o cualquier inconveniente."] },
    ],
    faqs: [
      { question: "¿Puedo preguntar antes de comprar?", answer: "Sí, desde la publicación. Es recomendable para confirmar compatibilidad y disponibilidad." },
      { question: "¿Y si no me responde?", answer: "Si no tenés respuesta, podés abrir un reclamo o contactar a soporte." },
    ],
    related: ["como-comprar", "como-elegir-el-repuesto-correcto"],
  },
  {
    slug: "como-elegir-el-repuesto-correcto",
    category: "Repuestos",
    title: "Cómo elegir el repuesto correcto",
    seoTitle: "Cómo elegir el repuesto correcto | Centro de ayuda Madsjeez",
    metaDescription: "Guía para elegir el repuesto correcto en Madsjeez: verificá marca, modelo, medidas y tipo de encastre antes de comprar.",
    excerpt: "Cómo no equivocarte al comprar un repuesto: marca, modelo y medidas.",
    intro: "Elegir el repuesto correcto evita devoluciones. La clave es verificar siempre marca, modelo, medidas y tipo de encastre antes de comprar.",
    sections: [
      { h2: "Verificá antes de comprar", paragraphs: ["El mismo repuesto puede cambiar entre máquinas similares. Antes de comprar:"], list: ["Confirmá marca y modelo de tu equipo.", "Verificá medidas (diámetro, largo, paso) y tipo de encastre.", "Si tenés la pieza vieja, usala como referencia.", "Ante la duda, consultá al vendedor con esos datos."] },
      { h2: "Si no estás seguro", paragraphs: ["Consultá al vendedor desde la publicación con la marca, el modelo y las medidas. Es preferible confirmar antes que comprar una pieza que no encastra. La compatibilidad depende de cada equipo: verificá siempre medidas, modelo y tipo de encastre antes de comprar."] },
    ],
    faqs: [
      { question: "¿Cómo sé si una pieza es compatible?", answer: "Verificá marca, modelo y medidas de tu equipo, y consultá al vendedor. La compatibilidad depende de cada caso." },
      { question: "¿Y si compro la pieza equivocada?", answer: "Podés gestionar una devolución según las condiciones aplicables, pero lo ideal es confirmar la compatibilidad antes de comprar." },
    ],
    related: ["garantia-de-productos", "como-contactar-al-vendedor", "como-hacer-una-devolucion"],
  },
];

const BY_SLUG = new Map(HELP_ARTICLES.map((a) => [a.slug, a]));
export function getHelpArticle(slug: string): HelpArticle | undefined { return BY_SLUG.get(slug); }
export function allHelpSlugs(): string[] { return HELP_ARTICLES.map((a) => a.slug); }
