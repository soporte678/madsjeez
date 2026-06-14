/**
 * Centro de ayuda para vendedores (beta). Honesto, sin prometer ventas ni
 * ganancias. CTA a registro de vendedor. Mismo tipo que el de compradores.
 */

import type { HelpArticle } from "./help-articles";

export const SELLER_HELP_CATEGORIES = ["Empezar", "Publicar", "Vender", "Crecer"] as const;

export const SELLER_HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "como-crear-cuenta",
    category: "Empezar",
    title: "Cómo crear tu cuenta de vendedor",
    seoTitle: "Cómo crear una cuenta de vendedor en Madsjeez | Ayuda",
    metaDescription: "Creá tu cuenta de vendedor en Madsjeez para empezar a publicar productos. Durante la beta, sin comisión por venta.",
    excerpt: "Pasos para registrarte como vendedor y empezar a publicar.",
    intro: "Para vender en Madsjeez necesitás una cuenta de vendedor. El registro lleva pocos minutos.",
    sections: [
      { h2: "Registrate", paragraphs: ["Entrá a la sección de venta y completá los datos de tu negocio (nombre, contacto, localidad). Durante la etapa beta no cobramos comisión por venta."] },
      { h2: "Configurá tu negocio", paragraphs: ["Sumá tu nombre, descripción y datos de contacto. Cuanto más completo tu perfil, más confianza generás en el comprador."] },
    ],
    faqs: [
      { question: "¿Tiene costo registrarse?", answer: "El registro es para empezar a publicar. Hay planes opcionales si querés más publicaciones o visibilidad." },
      { question: "¿Necesito local físico?", answer: "No es obligatorio. Podés vender tengas local o no." },
    ],
    related: ["como-publicar-un-producto", "como-poner-precio"],
  },
  {
    slug: "como-publicar-un-producto",
    category: "Publicar",
    title: "Cómo publicar un producto",
    seoTitle: "Cómo publicar un producto en Madsjeez | Ayuda vendedores",
    metaDescription: "Aprendé a publicar un producto en Madsjeez: fotos, título, precio, stock y descripción.",
    excerpt: "Crear tu primera publicación: fotos, título, precio y stock.",
    intro: "Publicar un producto es simple. Una buena publicación hace que te encuentren y te compren.",
    sections: [
      { h2: "Cargá los datos", paragraphs: ["Desde tu panel, creá una publicación con fotos, título claro, precio, stock y descripción. Elegí la categoría correcta para que aparezca en las búsquedas adecuadas."] },
      { h2: "Revisá antes de publicar", paragraphs: ["Verificá que el título tenga datos clave (marca, modelo, medida), que el precio sea correcto y que el stock esté actualizado."] },
    ],
    faqs: [
      { question: "¿Cuántos productos puedo publicar?", answer: "Depende de tu plan. El plan inicial permite una cantidad de publicaciones; los planes superiores, más." },
      { question: "¿Puedo editar después?", answer: "Sí, podés actualizar fotos, precio, stock y descripción cuando lo necesites." },
    ],
    related: ["como-subir-fotos", "como-poner-precio", "como-mejorar-mis-publicaciones"],
  },
  {
    slug: "como-subir-fotos",
    category: "Publicar",
    title: "Cómo subir buenas fotos",
    seoTitle: "Cómo subir buenas fotos de tus productos | Ayuda vendedores",
    metaDescription: "Consejos para fotos de producto que venden más: luz, fondo limpio y varios ángulos.",
    excerpt: "Fotos que generan confianza y mejoran tus ventas.",
    intro: "La foto es lo primero que ve el comprador. Buenas fotos aumentan la confianza y las consultas.",
    sections: [
      { h2: "Recomendaciones", paragraphs: ["No necesitás un estudio: con luz natural y fondo limpio alcanza."], list: ["Usá buena luz, idealmente natural.", "Fondo limpio y neutro.", "Varias tomas desde distintos ángulos.", "Mostrá detalles importantes y la escala si aplica."] },
      { h2: "Para repuestos", paragraphs: ["Si vendés repuestos, mostrá la pieza completa y, si tenés, el número de parte. Ayuda a que el comprador confirme la compatibilidad."] },
    ],
    faqs: [
      { question: "¿Cuántas fotos conviene?", answer: "Varias: una principal clara y otras con ángulos y detalles." },
      { question: "¿Sirve la foto del fabricante?", answer: "Puede servir, pero fotos reales del producto generan más confianza." },
    ],
    related: ["como-publicar-un-producto", "como-mejorar-mis-publicaciones"],
  },
  {
    slug: "como-poner-precio",
    category: "Publicar",
    title: "Cómo poner el precio",
    seoTitle: "Cómo poner precio a tus productos en Madsjeez | Ayuda vendedores",
    metaDescription: "Cómo definir un precio competitivo en Madsjeez. Durante la beta no cobramos comisión por venta.",
    excerpt: "Cómo fijar un precio claro y competitivo.",
    intro: "Un precio claro y competitivo ayuda a vender. Durante la beta no cobramos comisión por venta, así que el importe es tuyo.",
    sections: [
      { h2: "Calculá tu precio", paragraphs: ["Tomá tu costo y sumá el margen que querés. Como no cobramos comisión por venta en la beta, no tenés que descontarla del precio."] },
      { h2: "Compará y ajustá", paragraphs: ["Mirá publicaciones similares para ubicarte en el mercado. Un precio claro, sin sorpresas, reduce consultas y acelera la decisión de compra."] },
    ],
    faqs: [
      { question: "¿Madsjeez cobra comisión?", answer: "Durante la etapa beta no cobramos comisión por venta. Las condiciones pueden actualizarse e informarse oportunamente." },
      { question: "¿Puedo cambiar el precio?", answer: "Sí, podés actualizarlo cuando quieras desde tu panel." },
    ],
    related: ["como-publicar-un-producto", "como-aparecer-mas-en-madsjeez"],
  },
  {
    slug: "como-responder-consultas",
    category: "Vender",
    title: "Cómo responder consultas",
    seoTitle: "Cómo responder consultas de compradores | Ayuda vendedores",
    metaDescription: "Responder rápido las consultas mejora tus ventas. Cómo gestionar preguntas de compradores en Madsjeez.",
    excerpt: "Responder rápido y bien convierte consultas en ventas.",
    intro: "Las consultas son compradores interesados. Responder rápido y claro mejora tus chances de vender.",
    sections: [
      { h2: "Respondé rápido", paragraphs: ["Cuanto antes respondas, más probabilidades de cerrar la venta. Tené a mano los datos clave (compatibilidad, medidas, stock, envío)."] },
      { h2: "Sé claro y honesto", paragraphs: ["Confirmá compatibilidad solo si estás seguro. Si no, pedile al comprador la marca y el modelo de su equipo para verificar."] },
    ],
    faqs: [
      { question: "¿Por qué responder rápido?", answer: "El comprador suele consultar a varios vendedores; el primero en responder bien tiene ventaja." },
      { question: "¿Qué hago si no sé la compatibilidad?", answer: "Pedí marca, modelo y medidas, y confirmá solo si estás seguro. Es mejor que una devolución." },
    ],
    related: ["como-gestionar-ventas", "como-mejorar-mis-publicaciones"],
  },
  {
    slug: "como-gestionar-ventas",
    category: "Vender",
    title: "Cómo gestionar tus ventas",
    seoTitle: "Cómo gestionar tus ventas en Madsjeez | Ayuda vendedores",
    metaDescription: "Cómo seguir y gestionar tus ventas desde el panel de vendedor en Madsjeez.",
    excerpt: "Seguí tus pedidos y mantené tus publicaciones al día.",
    intro: "Desde tu panel seguís tus ventas y mantenés todo en orden.",
    sections: [
      { h2: "Seguí tus pedidos", paragraphs: ["En tu panel vas a ver tus ventas y el estado de cada pedido. Preparalo y despachalo en tiempo para que el comprador tenga una buena experiencia."] },
      { h2: "Mantené el stock", paragraphs: ["Actualizá el stock y desactivá las publicaciones de productos que ya no tenés. Evita ventas que después no podés cumplir."] },
    ],
    faqs: [
      { question: "¿Dónde veo mis ventas?", answer: "En el panel de vendedor, en la sección de ventas/pedidos." },
      { question: "¿Qué pasa si me quedo sin stock?", answer: "Desactivá o actualizá la publicación para no recibir compras que no podés cumplir." },
    ],
    related: ["como-responder-consultas", "como-funcionan-los-envios"],
  },
  {
    slug: "como-funcionan-los-envios",
    category: "Vender",
    title: "Cómo funcionan los envíos",
    seoTitle: "Cómo funcionan los envíos para vendedores | Ayuda Madsjeez",
    metaDescription: "Cómo coordinar los envíos de tus ventas en Madsjeez. Definís la forma y el costo según tu operación.",
    excerpt: "Cómo coordinar y comunicar tus envíos.",
    intro: "El envío lo coordinás según tu operación. Comunicá claramente las condiciones en cada publicación.",
    sections: [
      { h2: "Definí tus condiciones", paragraphs: ["Indicá en la publicación la forma de envío y el costo (o si ofrecés retiro). Cuanto más claro, menos consultas y menos malentendidos."] },
      { h2: "Despachá a tiempo", paragraphs: ["Preparar y despachar rápido mejora la experiencia del comprador y tu reputación. Si hay demoras, avisale al comprador."] },
    ],
    faqs: [
      { question: "¿Tengo que ofrecer envío gratis?", answer: "No es obligatorio. Definís vos las condiciones y las comunicás en la publicación." },
      { question: "¿Quién coordina el envío?", answer: "Lo coordinás vos según tu operación; comunicá la forma y el costo en la publicación." },
    ],
    related: ["como-gestionar-ventas", "errores-comunes-al-publicar"],
  },
  {
    slug: "como-mejorar-mis-publicaciones",
    category: "Crecer",
    title: "Cómo mejorar mis publicaciones",
    seoTitle: "Cómo mejorar tus publicaciones para vender más | Ayuda vendedores",
    metaDescription: "Mejorá tus publicaciones en Madsjeez: títulos claros, fotos, descripción completa y precio competitivo.",
    excerpt: "Pequeños ajustes que mejoran que te encuentren y te compren.",
    intro: "Mejorar tus publicaciones hace que te encuentren más y conviertas mejor.",
    sections: [
      { h2: "Lo que más impacta", paragraphs: ["Pequeños cambios mejoran tus resultados:"], list: ["Título con datos clave (marca, modelo, medida).", "Fotos claras desde varios ángulos.", "Descripción completa: qué es, para qué sirve, qué incluye.", "Precio claro y competitivo.", "Stock actualizado."] },
      { h2: "Iterá", paragraphs: ["Mirá qué publicaciones reciben más visitas y consultas, y aplicá lo que funciona al resto de tu catálogo."] },
    ],
    faqs: [
      { question: "¿Qué hace que una publicación venda más?", answer: "Buenas fotos, título con datos clave, descripción completa y precio claro." },
      { question: "¿Conviene actualizar publicaciones viejas?", answer: "Sí. Mejorar título, fotos y descripción puede reactivar publicaciones con pocas visitas." },
    ],
    related: ["como-subir-fotos", "como-aparecer-mas-en-madsjeez"],
  },
  {
    slug: "como-aparecer-mas-en-madsjeez",
    category: "Crecer",
    title: "Cómo aparecer más en Madsjeez",
    seoTitle: "Cómo aparecer más y vender más en Madsjeez | Ayuda vendedores",
    metaDescription: "Cómo mejorar tu visibilidad en Madsjeez con buenas publicaciones, catálogo completo y respuestas rápidas.",
    excerpt: "Qué ayuda a que tus productos se vean más.",
    intro: "Aparecer más depende de tener buenas publicaciones, catálogo y actividad. Te contamos qué ayuda.",
    sections: [
      { h2: "Buenas publicaciones y catálogo", paragraphs: ["Publicaciones completas (título, fotos, descripción, precio) y un catálogo amplio te dan más superficie para que te encuentren. Respondé rápido las consultas."] },
      { h2: "Difundí tu link", paragraphs: ["Compartí tu tienda y tus productos por WhatsApp, Instagram o Facebook. Tu link de Madsjeez funciona como vidriera ordenada."] },
    ],
    faqs: [
      { question: "¿Cómo gano visibilidad?", answer: "Con publicaciones completas, catálogo amplio, respuestas rápidas y difundiendo tu link. Hay planes opcionales con más visibilidad." },
      { question: "¿Sirve compartir en redes?", answer: "Sí. Tu link de Madsjeez es una vidriera ordenada para compartir en tus redes y WhatsApp." },
    ],
    related: ["como-mejorar-mis-publicaciones", "como-poner-precio"],
  },
  {
    slug: "errores-comunes-al-publicar",
    category: "Publicar",
    title: "Errores comunes al publicar",
    seoTitle: "Errores comunes al publicar productos | Ayuda vendedores",
    metaDescription: "Evitá los errores más comunes al publicar en Madsjeez: títulos vagos, fotos malas, precio confuso y stock desactualizado.",
    excerpt: "Los errores que más frenan tus ventas y cómo evitarlos.",
    intro: "Evitar errores comunes mejora tus ventas y reduce devoluciones.",
    sections: [
      { h2: "Errores frecuentes", paragraphs: ["Estos errores son los que más frenan las ventas:"], list: ["Títulos vagos ('oferta imperdible') sin datos clave.", "Pocas fotos o de baja calidad.", "Descripción incompleta o confusa.", "Precio sin aclarar condiciones.", "Stock desactualizado (vender lo que no tenés).", "Confirmar compatibilidades sin estar seguro."] },
      { h2: "Cómo evitarlos", paragraphs: ["Completá título, fotos y descripción con datos reales, mantené el stock al día y confirmá compatibilidades solo cuando estés seguro."] },
    ],
    faqs: [
      { question: "¿Cuál es el error más común?", answer: "Títulos vagos sin marca/modelo/medida: hacen que no te encuentren en las búsquedas." },
      { question: "¿Por qué no confirmar compatibilidades sin estar seguro?", answer: "Genera devoluciones y mala reputación. Es mejor pedir datos y confirmar bien." },
    ],
    related: ["como-publicar-un-producto", "como-subir-fotos", "como-mejorar-mis-publicaciones"],
  },
];

const BY_SLUG = new Map(SELLER_HELP_ARTICLES.map((a) => [a.slug, a]));
export function getSellerHelpArticle(slug: string): HelpArticle | undefined { return BY_SLUG.get(slug); }
export function allSellerHelpSlugs(): string[] { return SELLER_HELP_ARTICLES.map((a) => a.slug); }
