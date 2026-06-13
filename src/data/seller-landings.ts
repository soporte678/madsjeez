/**
 * Seller-acquisition SEO landings — fuente única de contenido.
 *
 * Cada entrada genera una ruta estática keyword-rich (/<slug>) renderizada por
 * <SellerLanding>. El hub canónico es `vender-en-madsjeez`; el resto enlaza hacia él.
 *
 * Reglas de copy (no romper):
 *  - Nada de "gratis", "sin comisión" ni "comisión cero" (no está implementado).
 *  - No difamar a Mercado Libre ni a ninguna plataforma: enfoque "sumá un canal".
 *  - Argentina, tono claro y directo para emprendedores/comercios/mayoristas.
 */

export type FaqItem = { question: string; answer: string };
export type Benefit = { title: string; desc: string };
export type Step = { title: string; desc: string };
export type ContentBlock = { h2: string; body: string };
export type ComparisonRow = { label: string; single: string; mads: string };

export type SellerLanding = {
  slug: string;
  /** keyword principal (para docs/medición; no se imprime) */
  keyword: string;
  breadcrumb: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  heroEyebrow: string;
  heroSubtitle: string;
  /** Texto del CTA primario; default si se omite */
  primaryCta?: string;
  /** Párrafo de contexto/problema bajo el hero (opcional) */
  intro?: string;
  benefits: Benefit[];
  /** Pasos "cómo funciona"; usa HOW_IT_WORKS si se omite */
  steps?: Step[];
  /** Mostrar la grilla de rubros */
  showCategories?: boolean;
  /** Bloque comparativo (un canal vs sumar Madsjeez) */
  comparison?: { title: string; rows: ComparisonRow[] };
  /** Bloques de prosa SEO con H2 keyword-rich */
  content: ContentBlock[];
  faqs: FaqItem[];
  ctaTitle: string;
  ctaSubtitle: string;
  /** slugs relacionados para enlazado interno */
  related: string[];
  /** prioridad sitemap */
  priority?: number;
  /** landing corta para campañas (oculta prosa larga) */
  campaign?: boolean;
};

export const HUB_SLUG = "vender-en-madsjeez";
export const DEFAULT_PRIMARY_CTA = "Quiero vender en Madsjeez";

/** Rubros que pueden vender (reutilizado por varias landings). */
export const RUBROS: { name: string; slug?: string }[] = [
  { name: "Repuestos", slug: "vender-repuestos-online" },
  { name: "Ferretería", slug: "vender-ferreteria-online" },
  { name: "Herramientas" },
  { name: "Hogar" },
  { name: "Bebé e indumentaria" },
  { name: "Bazar" },
  { name: "Tecnología" },
  { name: "Mayoristas", slug: "vender-productos-mayoristas-online" },
  { name: "Productos varios" },
];

/** Pasos por defecto del flujo de alta. */
export const HOW_IT_WORKS: Step[] = [
  { title: "Registrás tu cuenta", desc: "Creás tu cuenta de vendedor en minutos y configurás los datos de tu negocio." },
  { title: "Cargás tus productos", desc: "Subís fotos, precios y descripciones, y organizás tu catálogo en una vidriera digital." },
  { title: "Recibís consultas y ventas", desc: "Compradores de todo el país encuentran tus productos en Madsjeez y te contactan." },
];

/** Comparativa honesta: depender de un canal vs sumar Madsjeez. */
const SINGLE_VS_MADS: { title: string; rows: ComparisonRow[] } = {
  title: "Depender de un solo canal vs. sumar Madsjeez",
  rows: [
    { label: "Visibilidad", single: "Limitada al alcance de una sola plataforma o red", mads: "Una vidriera más donde te encuentran compradores nuevos" },
    { label: "Orden del catálogo", single: "Productos perdidos entre historias y publicaciones", mads: "Catálogo ordenado por categorías y búsqueda" },
    { label: "Control", single: "Reglas y cambios que no decidís vos", mads: "Sumás un canal propio sin dejar los que ya usás" },
    { label: "Riesgo", single: "Si esa cuenta falla, frenás tus ventas", mads: "Diversificás: más de un lugar donde vender" },
  ],
};

export const SELLER_LANDINGS: SellerLanding[] = [
  /* ----------------------------------------------------------------- 1. HUB */
  {
    slug: HUB_SLUG,
    keyword: "vender productos online Argentina",
    breadcrumb: "Vender en Madsjeez",
    seoTitle: "Vendé tus productos online en Madsjeez | Marketplace para emprendedores",
    metaDescription:
      "Publicá tus productos en Madsjeez y sumá un nuevo canal de venta online para tu emprendimiento, comercio o negocio mayorista en Argentina.",
    h1: "Vendé tus productos online en Madsjeez",
    heroEyebrow: "Marketplace argentino para vendedores",
    heroSubtitle:
      "Madsjeez es el marketplace argentino pensado para emprendedores, comercios, mayoristas y vendedores que quieren sumar un nuevo canal de venta online. Publicá tus productos y llegá a más clientes en Argentina.",
    intro:
      "Muchos vendedores dependen sólo de WhatsApp, Instagram, Facebook o una única plataforma. Eso limita la visibilidad, el orden del catálogo y las oportunidades de venta. En Madsjeez creás una vidriera online para mostrar tus productos y llegar a nuevos compradores.",
    benefits: [
      { title: "Publicá tus productos online", desc: "Cargá tu catálogo y mostralo en una vidriera digital ordenada y fácil de compartir." },
      { title: "Llegá a nuevos compradores", desc: "Sumás visibilidad en un marketplace argentino donde la gente entra a comprar." },
      { title: "Sumá un canal más", desc: "Además de WhatsApp, Instagram o Facebook, tené un lugar pensado para vender." },
      { title: "Ideal para emprendedores y comercios", desc: "Funciona igual de bien para un emprendimiento que arranca o un comercio con stock." },
      { title: "Organizá tu catálogo", desc: "Categorías, fotos y descripciones para que tus productos se encuentren." },
      { title: "No dependas de una sola plataforma", desc: "Diversificá tus canales y bajá el riesgo de quedarte sin vender." },
    ],
    showCategories: true,
    comparison: {
      title: "Vender sólo por redes vs. sumar Madsjeez",
      rows: [
        { label: "Dónde te encuentran", single: "Sólo quien ya te sigue", mads: "Compradores nuevos que buscan productos" },
        { label: "Catálogo", single: "Disperso en historias y posteos", mads: "Ordenado, con buscador y categorías" },
        { label: "Vidriera", single: "Se pierde con el scroll", mads: "Link fijo para mostrar todo tu stock" },
        { label: "Canales", single: "Uno solo", mads: "Sumás Madsjeez sin dejar los demás" },
      ],
    },
    content: [
      {
        h2: "Dónde vender tus productos online en Argentina",
        body: "Si te preguntás dónde vender tus productos online, Madsjeez es un marketplace argentino donde podés publicar tu catálogo y que más personas lo encuentren. No reemplaza lo que ya usás: lo complementa. Seguís vendiendo por redes y WhatsApp, y sumás una vidriera pensada para mostrar y vender.",
      },
      {
        h2: "Un marketplace para emprendedores, comercios y mayoristas",
        body: "Lo usan emprendedores que arrancan, comercios físicos que quieren vender online y mayoristas que necesitan mostrar su catálogo a compradores que revenden. Cargás tus productos una vez y los mostrás de forma ordenada, con categorías y búsqueda.",
      },
      {
        h2: "Publicá tus productos y sumá un canal de venta",
        body: "Publicar productos online en Madsjeez te da un canal más para conseguir clientes. En lugar de depender de una sola plataforma, tenés tu propia vidriera digital con un link para compartir en tus redes, tu WhatsApp o tu local.",
      },
    ],
    faqs: [
      { question: "¿Dónde puedo vender mis productos online en Argentina?", answer: "En Madsjeez podés publicar tus productos en un marketplace argentino y sumar un canal de venta online, además de los que ya uses como WhatsApp, Instagram o Facebook." },
      { question: "¿Qué es un marketplace para emprendedores?", answer: "Es una plataforma donde varios vendedores publican sus productos en un mismo lugar. Los compradores entran a buscar y comparar, y vos ganás visibilidad sin tener que armar tu propia tienda desde cero." },
      { question: "¿Puedo vender en Madsjeez si no tengo página web?", answer: "Sí. No necesitás página web propia: tu catálogo en Madsjeez funciona como tu vidriera online y te da un link para compartir." },
      { question: "¿Madsjeez sirve como alternativa a Mercado Libre?", answer: "Madsjeez puede funcionar como un canal adicional o alternativo. La idea no es reemplazar lo que ya usás, sino que no dependas de una sola plataforma." },
      { question: "¿Qué productos puedo publicar?", answer: "Repuestos, ferretería, herramientas, hogar, bebé e indumentaria, bazar, tecnología, productos mayoristas y más. Si vendés productos físicos, probablemente entren." },
      { question: "¿Puedo vender como mayorista?", answer: "Sí. Podés mostrar tu catálogo mayorista, recibir consultas y conectar con compradores interesados en comprar por cantidad." },
      { question: "¿Puedo usar Madsjeez junto con Instagram o WhatsApp?", answer: "Sí, es lo recomendado. Madsjeez suma un canal ordenado para vender, sin que dejes de usar tus redes y tu WhatsApp." },
      { question: "¿Cómo hago para empezar a vender?", answer: "Creás tu cuenta de vendedor, cargás tus productos con fotos y precios, y tu catálogo queda publicado para que los compradores te encuentren." },
    ],
    ctaTitle: "Empezá a vender en Madsjeez",
    ctaSubtitle: "Sumá tu negocio al marketplace y hacé que más clientes encuentren tus productos.",
    related: ["marketplace-para-emprendedores", "alternativa-a-mercado-libre", "publicar-productos-online", "vender-repuestos-online", "vender-productos-mayoristas-online"],
    priority: 0.95,
  },

  /* -------------------------------------------------- 2. ALTERNATIVA A ML */
  {
    slug: "alternativa-a-mercado-libre",
    keyword: "alternativa a Mercado Libre Argentina",
    breadcrumb: "Alternativa a Mercado Libre",
    seoTitle: "Alternativa a Mercado Libre para vender online en Argentina | Madsjeez",
    metaDescription:
      "¿Buscás una alternativa a Mercado Libre? Sumá Madsjeez como nuevo canal para vender online en Argentina y no dependas de una sola plataforma.",
    h1: "Una alternativa para vender online sin depender de una sola plataforma",
    heroEyebrow: "Sumá un canal, no dependas de uno",
    heroSubtitle:
      "Mercado Libre es una de las plataformas más grandes, pero muchos vendedores buscan sumar otros canales para tener más visibilidad, más control y más oportunidades de venta. Madsjeez puede ser ese canal.",
    intro:
      "No se trata de reemplazar lo que ya usás. Se trata de sumar un canal más. Podés seguir vendiendo por redes, WhatsApp o Mercado Libre, y usar Madsjeez como una nueva vidriera para conseguir más clientes.",
    benefits: [
      { title: "Más de un canal", desc: "Si una cuenta falla o cambia sus reglas, no frenás todas tus ventas." },
      { title: "Más visibilidad", desc: "Apareces en un marketplace argentino donde la gente entra a comprar." },
      { title: "Más control", desc: "Sumás un canal propio sin dejar los que ya te funcionan." },
      { title: "Complemento, no reemplazo", desc: "Seguís donde ya vendés y agregás Madsjeez como vidriera extra." },
    ],
    comparison: SINGLE_VS_MADS,
    content: [
      {
        h2: "Por qué conviene tener más de un canal de venta",
        body: "Depender de una sola plataforma es un riesgo: cambios de reglas, costos o una cuenta con problemas pueden frenar tus ventas. Tener más de un canal te da estabilidad. Por eso muchos vendedores buscan una alternativa a Mercado Libre que funcione como complemento.",
      },
      {
        h2: "Cómo Madsjeez complementa tus ventas",
        body: "Madsjeez es un marketplace argentino donde publicás tu catálogo y sumás visibilidad. No te pedimos que dejes Mercado Libre, Instagram o WhatsApp: la idea es que tengas otra vidriera más para que te encuentren compradores nuevos.",
      },
      {
        h2: "Sumar Madsjeez como nuevo canal",
        body: "Crear tu cuenta y cargar tus productos lleva poco tiempo. Una vez publicado, tu catálogo queda disponible para compradores de todo el país, y vos seguís manejando tus otros canales como hasta ahora.",
      },
    ],
    faqs: [
      { question: "¿Madsjeez es una alternativa a Mercado Libre?", answer: "Puede funcionar como alternativa o como complemento. Lo importante es que sumes un canal y no dependas de una sola plataforma para vender." },
      { question: "¿Tengo que dejar de vender en Mercado Libre?", answer: "No. Podés seguir vendiendo donde ya lo hacés y usar Madsjeez como un canal adicional." },
      { question: "¿Qué gano sumando otro canal?", answer: "Más visibilidad, más oportunidades de venta y menos riesgo de depender de una sola cuenta o plataforma." },
      { question: "¿Cómo empiezo a usar Madsjeez como canal nuevo?", answer: "Creás tu cuenta de vendedor, cargás tus productos y tu catálogo queda publicado para que más clientes te encuentren." },
      { question: "¿Sirve para cualquier rubro?", answer: "Sí: repuestos, ferretería, herramientas, hogar, bebé, bazar, tecnología, productos mayoristas y más." },
    ],
    ctaTitle: "Sumá Madsjeez como nuevo canal",
    ctaSubtitle: "No dependas de una sola plataforma. Publicá tus productos y conseguí más clientes.",
    related: [HUB_SLUG, "donde-vender-mis-productos", "vender-sin-pagina-web", "marketplace-para-emprendedores"],
    priority: 0.9,
  },

  /* -------------------------------------------- 3. DÓNDE VENDER (intención) */
  {
    slug: "donde-vender-mis-productos",
    keyword: "dónde vender mis productos online",
    breadcrumb: "Dónde vender mis productos",
    seoTitle: "Dónde vender mis productos online en Argentina | Madsjeez",
    metaDescription:
      "¿No sabés dónde vender tus productos online? Publicá en Madsjeez, un marketplace argentino para emprendedores, comercios y mayoristas.",
    h1: "Dónde vender mis productos online en Argentina",
    heroEyebrow: "La respuesta a una búsqueda directa",
    heroSubtitle:
      "Si te preguntás dónde vender tus productos online, Madsjeez es un marketplace argentino donde publicás tu catálogo y llegás a compradores de todo el país.",
    benefits: [
      { title: "Un lugar para publicar", desc: "Cargás tus productos y los mostrás ordenados en tu vidriera digital." },
      { title: "Compradores reales", desc: "Aparecés en un marketplace donde la gente entra a buscar productos." },
      { title: "Sin armar una web", desc: "No necesitás página propia: tu catálogo en Madsjeez ya es tu vidriera." },
      { title: "Para todos los rubros", desc: "Desde repuestos y ferretería hasta hogar, bebé y tecnología." },
    ],
    showCategories: true,
    content: [
      {
        h2: "Dónde vender productos online sin complicarte",
        body: "La forma más simple de empezar a vender online es publicar tu catálogo en un marketplace que ya tiene tráfico. En Madsjeez creás tu cuenta, cargás tus productos y quedan disponibles para compradores de Argentina, sin tener que programar ni contratar una página web.",
      },
      {
        h2: "Opciones para vender por internet en Argentina",
        body: "Podés vender por redes sociales, por WhatsApp, con tienda propia o en un marketplace. Lo ideal es combinar: usá tus redes para difundir y un marketplace como Madsjeez para tener una vidriera ordenada con buscador, donde tu catálogo no se pierde con el scroll.",
      },
    ],
    faqs: [
      { question: "¿Dónde puedo vender mis productos online?", answer: "En un marketplace argentino como Madsjeez, donde publicás tu catálogo y te encuentran compradores, además de tus redes y WhatsApp." },
      { question: "¿Necesito una página web para vender?", answer: "No. Tu catálogo en Madsjeez funciona como vidriera online y te da un link para compartir." },
      { question: "¿Qué necesito para empezar?", answer: "Una cuenta de vendedor, fotos de tus productos, precios y descripciones. Con eso ya podés publicar." },
      { question: "¿Puedo vender productos usados o sólo nuevos?", answer: "Madsjeez está pensado para vendedores que publican su catálogo de productos. Revisá las condiciones de publicación al crear tu cuenta." },
    ],
    ctaTitle: "Publicá tus productos en Madsjeez",
    ctaSubtitle: "Dejá de preguntarte dónde vender: creá tu cuenta y mostrá tu catálogo hoy.",
    related: [HUB_SLUG, "publicar-productos-online", "vender-sin-pagina-web", "como-vender-por-internet"],
    priority: 0.85,
  },

  /* ----------------------------------------- 4. PUBLICAR PRODUCTOS ONLINE */
  {
    slug: "publicar-productos-online",
    keyword: "publicar productos online",
    breadcrumb: "Publicar productos online",
    seoTitle: "Publicar productos online en Argentina | Madsjeez",
    metaDescription:
      "Publicá tus productos online en Madsjeez y llegá a nuevos clientes. Marketplace argentino para emprendedores, comercios y mayoristas.",
    h1: "Publicá tus productos online y llegá a nuevos clientes",
    heroEyebrow: "Tu catálogo, visible y ordenado",
    heroSubtitle:
      "Publicar productos online en Madsjeez te da una vidriera digital donde mostrar tu catálogo y conseguir más clientes en Argentina.",
    benefits: [
      { title: "Publicación clara", desc: "Fotos, título, precio y descripción para que tu producto se entienda y se encuentre." },
      { title: "Catálogo ordenado", desc: "Categorías y buscador para que los compradores lleguen a lo que vendés." },
      { title: "Link para compartir", desc: "Difundí tu vidriera en redes, WhatsApp o tu local." },
      { title: "Sumás un canal", desc: "Publicás una vez y ganás un lugar más donde vender." },
    ],
    content: [
      {
        h2: "Qué necesitás para publicar tus productos",
        body: "Para publicar productos online sólo necesitás una cuenta de vendedor, buenas fotos, un título claro, el precio y una descripción. Cuanto mejor presentado esté el producto, más fácil es que un comprador se decida.",
      },
      {
        h2: "Consejos para buenas fotos, títulos y descripciones",
        body: "Usá fotos con buena luz y fondo limpio. En el título poné el nombre del producto y un dato clave (marca, modelo o medida). En la descripción contá qué es, para qué sirve y qué incluye. Evitá títulos genéricos: ayudan poco a que te encuentren.",
      },
      {
        h2: "Qué tipo de productos podés publicar",
        body: "Repuestos, ferretería, herramientas, productos de hogar, bebé e indumentaria, bazar, tecnología y productos mayoristas, entre otros. Si vendés productos físicos, probablemente puedas publicarlos en Madsjeez.",
      },
    ],
    faqs: [
      { question: "¿Cómo publico un producto en Madsjeez?", answer: "Creás tu cuenta de vendedor, vas a cargar producto y completás fotos, título, precio y descripción. Listo: queda publicado." },
      { question: "¿Cuántos productos puedo publicar?", answer: "Podés cargar tu catálogo de productos. Al crear tu cuenta vas a ver las condiciones según tu tipo de cuenta." },
      { question: "¿Qué hace que una publicación venda más?", answer: "Buenas fotos, un título claro con datos clave y una descripción completa. Eso mejora que te encuentren y que el comprador confíe." },
      { question: "¿Puedo editar mis publicaciones después?", answer: "Sí, podés actualizar precios, fotos y descripciones cuando lo necesites." },
    ],
    ctaTitle: "Publicá tu primer producto",
    ctaSubtitle: "Creá tu cuenta de vendedor y cargá tu catálogo en Madsjeez.",
    related: [HUB_SLUG, "donde-vender-mis-productos", "como-vender-por-internet", "vender-sin-pagina-web"],
    priority: 0.85,
  },

  /* --------------------------------------------- 5. VENDER SIN PÁGINA WEB */
  {
    slug: "vender-sin-pagina-web",
    keyword: "vender online sin página web",
    breadcrumb: "Vender sin página web",
    seoTitle: "Cómo vender online sin tener página web | Madsjeez",
    metaDescription:
      "Vendé online aunque no tengas página web. Publicá tu catálogo en Madsjeez y usalo como tu vidriera digital en Argentina.",
    h1: "Vendé online aunque todavía no tengas tu propia página web",
    heroEyebrow: "Tu vidriera sin programar nada",
    heroSubtitle:
      "Muchos vendedores empiezan por redes sociales o WhatsApp, pero necesitan una vidriera online más ordenada. En Madsjeez tenés esa vidriera sin tener que crear una página web.",
    benefits: [
      { title: "Sin desarrollo web", desc: "No contratás ni programás nada: cargás tus productos y listo." },
      { title: "Vidriera ordenada", desc: "Tu catálogo con categorías y buscador, mejor que una galería de fotos suelta." },
      { title: "Link propio", desc: "Compartí un solo link con todo tu catálogo en redes y WhatsApp." },
      { title: "Empezás hoy", desc: "Crear la cuenta y publicar lleva minutos, no semanas." },
    ],
    content: [
      {
        h2: "Por qué no necesitás una página web para vender",
        body: "Armar una página web propia lleva tiempo, plata y mantenimiento. Para empezar a vender online no hace falta: publicás tu catálogo en Madsjeez y ya tenés una vidriera digital con buscador, lista para compartir.",
      },
      {
        h2: "De las redes sociales a una vidriera ordenada",
        body: "Vender por Instagram o WhatsApp funciona, pero los productos se pierden entre historias y mensajes. Con Madsjeez tu catálogo queda ordenado por categorías y siempre disponible en un mismo link, sin depender del scroll.",
      },
    ],
    faqs: [
      { question: "¿Puedo vender online sin página web?", answer: "Sí. En Madsjeez publicás tu catálogo y funciona como tu vidriera online, sin que tengas que crear una página web propia." },
      { question: "¿Qué diferencia hay con vender sólo por Instagram?", answer: "En redes los productos se pierden con el scroll. En Madsjeez tu catálogo queda ordenado, con buscador, y tenés un link fijo para compartir." },
      { question: "¿Es difícil empezar?", answer: "No. Creás la cuenta, cargás tus productos con fotos y precios, y tu vidriera queda publicada en minutos." },
      { question: "¿Puedo seguir usando WhatsApp para cerrar ventas?", answer: "Sí. Madsjeez te da la vidriera y la visibilidad; podés combinarlo con tus canales habituales." },
    ],
    ctaTitle: "Creá tu vidriera online en Madsjeez",
    ctaSubtitle: "Sin web, sin programar. Cargá tus productos y empezá a mostrarlos hoy.",
    related: [HUB_SLUG, "publicar-productos-online", "donde-vender-mis-productos", "marketplace-para-emprendedores"],
    priority: 0.85,
  },

  /* ------------------------------------------------ 6. VENDER REPUESTOS */
  {
    slug: "vender-repuestos-online",
    keyword: "vender repuestos online",
    breadcrumb: "Vender repuestos online",
    seoTitle: "Vendé repuestos online en Madsjeez | Marketplace de repuestos",
    metaDescription:
      "Vendé repuestos online en Madsjeez y llegá a compradores de todo el país. Repuestos de máquinas, herramientas y ferretería en un marketplace argentino.",
    h1: "Vendé repuestos online y llegá a compradores de todo el país",
    heroEyebrow: "Marketplace de repuestos en Argentina",
    heroSubtitle:
      "Si vendés repuestos de máquinas, herramientas o ferretería, Madsjeez te ayuda a ordenar tus publicaciones y llegar a compradores que buscan productos específicos.",
    benefits: [
      { title: "Compradores que buscan", desc: "La gente entra al marketplace buscando el repuesto exacto que necesita." },
      { title: "Catálogo técnico ordenado", desc: "Publicá por tipo de repuesto, marca y modelo para que te encuentren." },
      { title: "Alcance nacional", desc: "Vendé a clientes de todo el país, no sólo de tu zona." },
      { title: "Un canal extra", desc: "Sumás Madsjeez a los canales que ya usás para vender repuestos." },
    ],
    content: [
      {
        h2: "Vendé repuestos de máquinas y herramientas online",
        body: "Repuestos de motosierra, desmalezadora, grupos electrógenos, motobombas, herramientas y máquinas en general: en Madsjeez publicás tu catálogo de repuestos para que compradores de todo el país encuentren la pieza que buscan.",
      },
      {
        h2: "Por qué un marketplace ayuda a vender repuestos",
        body: "Los compradores de repuestos buscan algo puntual: una pieza para un modelo específico. Un marketplace con buscador y categorías hace que tu publicación aparezca justo cuando alguien busca ese repuesto, mejor que en una historia que desaparece.",
      },
    ],
    faqs: [
      { question: "¿Puedo vender repuestos online en Madsjeez?", answer: "Sí. Podés publicar repuestos de máquinas, herramientas y ferretería, y llegar a compradores que buscan piezas específicas." },
      { question: "¿Qué tipo de repuestos puedo publicar?", answer: "Repuestos de motosierra, desmalezadora, grupos electrógenos, motobombas, herramientas y máquinas en general, entre otros." },
      { question: "¿Cómo hago para que encuentren mi repuesto?", answer: "Publicá con título claro (pieza, marca y modelo), buenas fotos y descripción. Así aparecés cuando alguien busca ese repuesto." },
      { question: "¿Vendo sólo en mi zona o a todo el país?", answer: "Podés llegar a compradores de todo el país. Coordinás el envío o la entrega según cada venta." },
    ],
    ctaTitle: "Empezá a vender repuestos en Madsjeez",
    ctaSubtitle: "Publicá tu catálogo de repuestos y llegá a compradores de todo el país.",
    related: [HUB_SLUG, "vender-ferreteria-online", "vender-productos-mayoristas-online", "publicar-productos-online"],
    priority: 0.85,
  },

  /* ------------------------------------------------ 7. VENDER FERRETERÍA */
  {
    slug: "vender-ferreteria-online",
    keyword: "vender productos de ferretería online",
    breadcrumb: "Vender ferretería online",
    seoTitle: "Vendé productos de ferretería online | Madsjeez",
    metaDescription:
      "Vendé productos de ferretería online en Madsjeez. Publicá tu catálogo de ferretería y herramientas y llegá a más clientes en Argentina.",
    h1: "Vendé productos de ferretería online y sumá clientes",
    heroEyebrow: "Ferretería y herramientas online",
    heroSubtitle:
      "Si tenés una ferretería o vendés herramientas, Madsjeez te ayuda a publicar tu catálogo online y llegar a compradores que buscan productos de ferretería en Argentina.",
    benefits: [
      { title: "Tu ferretería online", desc: "Mostrá tu stock de ferretería en una vidriera digital ordenada." },
      { title: "Más allá del mostrador", desc: "Llegá a clientes que no pasan por tu local pero buscan online." },
      { title: "Catálogo por categorías", desc: "Organizá herramientas, fijaciones, eléctricos y más para que te encuentren." },
      { title: "Un canal extra", desc: "Sumás Madsjeez sin dejar tu local ni tus redes." },
    ],
    content: [
      {
        h2: "Llevá tu ferretería al mundo online",
        body: "Un comercio de ferretería con stock tiene mucho para vender online. En Madsjeez publicás tu catálogo de herramientas, fijaciones, productos eléctricos, sanitarios y más, y sumás un canal para que te encuentren clientes nuevos.",
      },
      {
        h2: "Cómo ordenar un catálogo de ferretería",
        body: "La clave es la organización: agrupá por tipo de producto, usá títulos con marca y medida, y sumá fotos claras. Así los compradores que buscan un producto puntual de ferretería llegan directo a tu publicación.",
      },
    ],
    faqs: [
      { question: "¿Puedo vender productos de ferretería online?", answer: "Sí. En Madsjeez publicás tu catálogo de ferretería y herramientas y llegás a compradores de todo el país." },
      { question: "¿Sirve si tengo local físico?", answer: "Sí. Madsjeez suma un canal online sin que dejes de vender en tu local." },
      { question: "¿Qué productos de ferretería puedo publicar?", answer: "Herramientas, fijaciones, productos eléctricos, sanitarios, pinturería y más, según tu stock." },
      { question: "¿Necesito muchos productos para empezar?", answer: "No. Podés empezar con los productos que más vendés y ampliar tu catálogo con el tiempo." },
    ],
    ctaTitle: "Publicá tu ferretería en Madsjeez",
    ctaSubtitle: "Mostrá tu catálogo de ferretería online y llegá a más clientes.",
    related: [HUB_SLUG, "vender-repuestos-online", "publicar-productos-online", "vender-productos-mayoristas-online"],
    priority: 0.85,
  },

  /* -------------------------------------------- 8. VENDER MAYORISTA ONLINE */
  {
    slug: "vender-productos-mayoristas-online",
    keyword: "vender productos mayoristas online",
    breadcrumb: "Vender mayorista online",
    seoTitle: "Marketplace para vender productos mayoristas online | Madsjeez",
    metaDescription:
      "Vendé productos mayoristas online en Madsjeez. Mostrá tu catálogo mayorista, recibí consultas y conectá con compradores que revenden.",
    h1: "Vendé productos mayoristas online y conectá con revendedores",
    heroEyebrow: "Marketplace para mayoristas",
    heroSubtitle:
      "Si vendés por cantidad, Madsjeez te ayuda a mostrar tu catálogo mayorista, recibir consultas y conectar con compradores interesados en productos para reventa.",
    benefits: [
      { title: "Catálogo mayorista visible", desc: "Mostrá tus productos por cantidad a compradores que buscan revender." },
      { title: "Consultas de revendedores", desc: "Conectá con minoristas y revendedores que necesitan proveedores." },
      { title: "Alcance nacional", desc: "Llegá a compradores de todo el país, no sólo de tu zona." },
      { title: "Un canal mayorista extra", desc: "Sumás Madsjeez a tus canales de venta por mayor habituales." },
    ],
    content: [
      {
        h2: "Mostrá tu catálogo mayorista online",
        body: "Como mayorista, tu fuerza es el catálogo y el precio por cantidad. En Madsjeez publicás tus productos para que revendedores y comercios te encuentren, vean tu oferta y te contacten para comprar por mayor.",
      },
      {
        h2: "Conectá con compradores que revenden",
        body: "Muchos minoristas y emprendedores buscan proveedores mayoristas confiables. Tener tu catálogo publicado en un marketplace te ayuda a que esos compradores te descubran y empiecen una relación comercial.",
      },
    ],
    faqs: [
      { question: "¿Puedo vender productos mayoristas en Madsjeez?", answer: "Sí. Podés mostrar tu catálogo mayorista, recibir consultas y conectar con compradores que buscan productos para revender." },
      { question: "¿Cómo muestro precios por cantidad?", answer: "En tus publicaciones podés detallar condiciones de venta por mayor y aclarar mínimos en la descripción de cada producto." },
      { question: "¿Quién va a ver mi catálogo mayorista?", answer: "Compradores de todo el país: minoristas, revendedores y emprendedores que buscan proveedores." },
      { question: "¿Puedo combinarlo con mis otros canales mayoristas?", answer: "Sí. Madsjeez suma un canal más para que te encuentren, sin reemplazar tu operación actual." },
    ],
    ctaTitle: "Publicá tu catálogo mayorista",
    ctaSubtitle: "Conectá con revendedores de todo el país. Mostrá tu oferta en Madsjeez.",
    related: [HUB_SLUG, "vender-repuestos-online", "vender-ferreteria-online", "marketplace-para-emprendedores"],
    priority: 0.85,
  },

  /* ------------------------------------------ 9. MARKETPLACE EMPRENDEDORES */
  {
    slug: "marketplace-para-emprendedores",
    keyword: "marketplace para emprendedores",
    breadcrumb: "Marketplace para emprendedores",
    seoTitle: "Marketplace para emprendedores en Argentina | Madsjeez",
    metaDescription:
      "Madsjeez es un marketplace para emprendedores en Argentina. Publicá tus productos, recibí consultas y sumá ventas con una vidriera online.",
    h1: "Marketplace para emprendedores que quieren vender más",
    heroEyebrow: "Pensado para emprender",
    heroSubtitle:
      "Madsjeez ayuda a emprendedores a tener presencia online, publicar productos, recibir consultas y sumar ventas, sin depender de una sola red social.",
    benefits: [
      { title: "Presencia online real", desc: "Una vidriera digital con tu catálogo, más profesional que una galería de fotos." },
      { title: "Recibí consultas", desc: "Compradores interesados te encuentran y te contactan." },
      { title: "Sumá ventas", desc: "Un canal más para que tu emprendimiento llegue a clientes nuevos." },
      { title: "Crecé de a poco", desc: "Empezá con pocos productos y ampliá tu catálogo cuando quieras." },
    ],
    showCategories: true,
    content: [
      {
        h2: "Qué le aporta un marketplace a un emprendedor",
        body: "Cuando recién arrancás, lo más difícil es que te conozcan. Un marketplace para emprendedores como Madsjeez te da tráfico y una vidriera ordenada, para que no dependas sólo de que tus seguidores vean una historia.",
      },
      {
        h2: "De emprender por redes a vender en un marketplace",
        body: "Las redes sirven para mostrar y generar comunidad, pero vender necesita orden: catálogo, búsqueda y un link estable. Madsjeez complementa tus redes con una vidriera pensada para que el comprador encuentre y compre.",
      },
    ],
    faqs: [
      { question: "¿Qué es un marketplace para emprendedores?", answer: "Es una plataforma donde emprendedores publican sus productos en un mismo lugar con tráfico. Ganás visibilidad sin armar tu propia tienda desde cero." },
      { question: "¿Sirve si recién empiezo?", answer: "Sí. Podés empezar con pocos productos, sin web propia, y crecer a tu ritmo." },
      { question: "¿Puedo usarlo junto con mis redes sociales?", answer: "Sí, es lo recomendado: redes para difundir y Madsjeez como vidriera ordenada para vender." },
      { question: "¿Qué necesito para empezar?", answer: "Una cuenta de vendedor, fotos de tus productos, precios y descripciones." },
    ],
    ctaTitle: "Sumá tu emprendimiento a Madsjeez",
    ctaSubtitle: "Publicá tus productos y hacé que más clientes te encuentren.",
    related: [HUB_SLUG, "donde-vender-mis-productos", "vender-sin-pagina-web", "como-vender-por-internet"],
    priority: 0.85,
  },

  /* ------------------------------------------- 10. CÓMO VENDER POR INTERNET */
  {
    slug: "como-vender-por-internet",
    keyword: "cómo vender por internet",
    breadcrumb: "Cómo vender por internet",
    seoTitle: "Cómo vender por internet en Argentina paso a paso | Madsjeez",
    metaDescription:
      "Aprendé cómo vender por internet en Argentina paso a paso: qué necesitás, dónde publicar y cómo conseguir más clientes con Madsjeez.",
    h1: "Cómo vender por internet en Argentina, paso a paso",
    heroEyebrow: "Guía rápida para empezar",
    heroSubtitle:
      "Vender por internet no tiene que ser complicado. Te contamos qué necesitás, dónde publicar y cómo empezar a recibir consultas y ventas con Madsjeez.",
    benefits: [
      { title: "Sin vueltas técnicas", desc: "No necesitás saber de programación ni armar una web." },
      { title: "Empezás con lo que tenés", desc: "Fotos, precios y ganas de vender alcanzan para arrancar." },
      { title: "Un lugar con tráfico", desc: "Publicás donde la gente ya entra a buscar productos." },
      { title: "Aprendés sobre la marcha", desc: "Mejorás tus publicaciones a medida que ves qué funciona." },
    ],
    content: [
      {
        h2: "Paso 1: definí qué vas a vender y a quién",
        body: "Antes de publicar, tené claro qué productos vas a ofrecer y quién es tu comprador. Esto te ayuda a elegir buenas fotos, títulos y precios que conecten con quien busca lo que vendés.",
      },
      {
        h2: "Paso 2: elegí dónde publicar",
        body: "Podés vender por redes, WhatsApp o un marketplace. Lo ideal es combinar: un marketplace argentino como Madsjeez te da tráfico y orden, y tus redes te ayudan a difundir tu link.",
      },
      {
        h2: "Paso 3: publicá y mejorá tus publicaciones",
        body: "Cargá tus productos con fotos claras, títulos con datos clave y descripciones completas. Después observá qué se consulta más y ajustá precios, fotos o textos para vender mejor.",
      },
    ],
    faqs: [
      { question: "¿Cómo empiezo a vender por internet?", answer: "Definí qué vas a vender, elegí dónde publicar (por ejemplo, un marketplace como Madsjeez), cargá tus productos con fotos y precios, y difundí tu link." },
      { question: "¿Necesito invertir mucho para vender online?", answer: "No. Podés empezar con los productos que ya tenés, sin armar una web ni grandes gastos." },
      { question: "¿Dónde conviene publicar?", answer: "Combiná un marketplace con tráfico y tus redes sociales. El marketplace te da orden y visibilidad; las redes, difusión." },
      { question: "¿Cómo consigo más clientes?", answer: "Mejorá tus publicaciones, sumá más de un canal y compartí tu vidriera. Cuanto más visible y ordenado tu catálogo, más fácil que te encuentren." },
    ],
    ctaTitle: "Empezá a vender por internet hoy",
    ctaSubtitle: "Creá tu cuenta en Madsjeez y publicá tu primer producto.",
    related: [HUB_SLUG, "donde-vender-mis-productos", "publicar-productos-online", "vender-sin-pagina-web"],
    priority: 0.8,
  },

  /* ------------------------------------------- 11. SUMAR VENDEDORES (campaña) */
  {
    slug: "sumar-vendedores",
    keyword: "sumar negocio a marketplace",
    breadcrumb: "Sumar tu negocio",
    seoTitle: "Sumá tu negocio a Madsjeez | Marketplace argentino",
    metaDescription:
      "Sumá tu negocio a Madsjeez y empezá a vender online. Dejá tus datos y el equipo te contacta para ayudarte a publicar tus productos.",
    h1: "Sumá tu negocio a Madsjeez",
    heroEyebrow: "Empezá a vender online",
    heroSubtitle:
      "Dejanos tus datos y el equipo de Madsjeez te contacta para ayudarte a publicar tus productos y empezar a vender en el marketplace.",
    primaryCta: "Quiero que me contacten",
    benefits: [
      { title: "Te ayudamos a arrancar", desc: "El equipo te guía para publicar tu catálogo y empezar a vender." },
      { title: "Para cualquier rubro", desc: "Repuestos, ferretería, hogar, bebé, tecnología, mayoristas y más." },
      { title: "Sin compromiso", desc: "Dejás tus datos, te contactamos y vos decidís cómo seguir." },
    ],
    showCategories: true,
    content: [],
    faqs: [
      { question: "¿Qué pasa después de dejar mis datos?", answer: "El equipo de Madsjeez te contacta para ayudarte a empezar a publicar tus productos y resolver tus dudas." },
      { question: "¿Tiene costo dejar mis datos?", answer: "No. Dejás tus datos sin compromiso y nosotros te contactamos." },
    ],
    ctaTitle: "Dejanos tus datos y te contactamos",
    ctaSubtitle: "Completá el formulario y empezá a vender en Madsjeez.",
    related: [HUB_SLUG, "marketplace-para-emprendedores", "alternativa-a-mercado-libre"],
    priority: 0.7,
    campaign: true,
  },

  /* -------------------------------------- 12. MARKETPLACE PARA VENDEDORES */
  {
    slug: "marketplace-para-vendedores",
    keyword: "marketplace para vendedores",
    breadcrumb: "Marketplace para vendedores",
    seoTitle: "Marketplace para vendedores en Argentina | Madsjeez",
    metaDescription:
      "¿Por qué vender en un marketplace? Madsjeez te da tráfico, vidriera y herramientas sin armar una tienda desde cero. Para vendedores chicos y medianos.",
    h1: "Un marketplace pensado para vendedores",
    heroEyebrow: "Vendé donde ya hay compradores",
    heroSubtitle:
      "Vender en un marketplace te da tráfico y orden desde el primer día. Madsjeez es la plataforma para que vendedores chicos y medianos publiquen sus productos y consigan más clientes.",
    intro:
      "Armar una tienda online propia desde cero lleva tiempo y plata. Un marketplace te da la vidriera, el buscador y el tráfico resueltos: vos te enfocás en tus productos y tus ventas.",
    benefits: [
      { title: "Tráfico desde el día uno", desc: "Publicás donde la gente ya entra a buscar y comparar productos." },
      { title: "Sin infraestructura propia", desc: "No contratás hosting, diseño ni pasarela: ya está todo listo." },
      { title: "Vidriera ordenada", desc: "Catálogo con categorías y búsqueda, más serio que vender solo por redes." },
      { title: "Herramientas para crecer", desc: "Panel de productos, consultas y planes para escalar cuando lo necesites." },
    ],
    comparison: {
      title: "Marketplace vs. tienda online propia",
      rows: [
        { label: "Puesta en marcha", single: "Días o semanas armando la web", mads: "Publicás hoy mismo" },
        { label: "Tráfico", single: "Tenés que generarlo vos desde cero", mads: "Aprovechás el del marketplace" },
        { label: "Costo inicial", single: "Hosting, diseño, mantenimiento", mads: "Sin infraestructura propia" },
        { label: "Control de marca", single: "Total, pero todo a tu cargo", mads: "Tu tienda dentro de Madsjeez + tu link" },
      ],
    },
    content: [
      {
        h2: "Por qué vender en un marketplace",
        body: "Un marketplace concentra compradores que ya están buscando productos. En lugar de invertir tiempo y dinero en atraer tráfico a una web nueva, publicás donde ese tráfico ya existe y te enfocás en vender.",
      },
      {
        h2: "Ideal para vendedores chicos y medianos",
        body: "Si recién arrancás o tenés un comercio que quiere vender online, Madsjeez te da una base profesional sin grandes costos: cargás tu catálogo, recibís consultas y vas creciendo a tu ritmo.",
      },
    ],
    faqs: [
      { question: "¿Conviene vender en un marketplace o tener tienda propia?", answer: "Depende de tu etapa. Un marketplace te da tráfico y herramientas sin inversión inicial; muchos vendedores empiezan ahí y suman su web después. No son excluyentes." },
      { question: "¿Necesito conocimientos técnicos?", answer: "No. Publicás tus productos desde un panel simple, sin programar ni configurar servidores." },
      { question: "¿Sirve si vendo poco volumen?", answer: "Sí. Podés empezar con pocos productos y escalar cuando tu volumen lo justifique." },
    ],
    ctaTitle: "Empezá a vender en el marketplace",
    ctaSubtitle: "Publicá tus productos en Madsjeez y aprovechá el tráfico desde el primer día.",
    related: [HUB_SLUG, "alternativa-a-mercado-libre", "marketplace-para-ferreterias", "marketplace-para-casas-de-repuestos"],
    priority: 0.85,
  },

  /* ------------------------------------- 13. MARKETPLACE PARA FERRETERÍAS */
  {
    slug: "marketplace-para-ferreterias",
    keyword: "marketplace para ferreterías",
    breadcrumb: "Marketplace para ferreterías",
    seoTitle: "Marketplace para ferreterías en Argentina | Madsjeez",
    metaDescription:
      "Digitalizá tu ferretería: vendé herramientas, repuestos y máquinas online en Madsjeez. Sumá un canal sin dejar tu local.",
    h1: "El marketplace para ferreterías que quieren vender online",
    heroEyebrow: "Tu ferretería, también online",
    heroSubtitle:
      "Si tenés una ferretería, Madsjeez te ayuda a llevar tu stock al online: herramientas, repuestos, máquinas y accesorios, con una vidriera ordenada y un canal más de venta.",
    intro:
      "Muchas ferreterías tienen un gran stock que solo ve quien pasa por el local. Llevarlo al online suma clientes nuevos sin dejar de vender en el mostrador.",
    benefits: [
      { title: "Digitalizá tu local", desc: "Mostrá tu catálogo de ferretería online y llegá a clientes que no pasan por tu negocio." },
      { title: "Herramientas y repuestos", desc: "Ideal para herramientas, fijaciones, eléctricos, sanitarios, máquinas y repuestos." },
      { title: "Un canal más", desc: "Sumás Madsjeez sin dejar tu local ni tus redes." },
      { title: "Catálogo ordenado", desc: "Organizá por tipo de producto para que te encuentren fácil." },
    ],
    showCategories: true,
    content: [
      {
        h2: "Llevá tu ferretería al mundo online",
        body: "Con un comercio de ferretería tenés mucho para vender por internet. En Madsjeez publicás tu catálogo de herramientas, fijaciones, productos eléctricos, sanitarios, pinturería, máquinas y repuestos, y sumás un canal para que te encuentren clientes nuevos.",
      },
      {
        h2: "Cómo empezar con tu ferretería",
        body: "No hace falta cargar todo de una. Empezá con los productos que más vendés, sumá fotos claras y títulos con marca y medida, y ampliá tu catálogo con el tiempo.",
      },
    ],
    faqs: [
      { question: "¿Puedo vender productos de ferretería en Madsjeez?", answer: "Sí. Publicás herramientas, repuestos, máquinas y accesorios, y llegás a compradores de todo el país." },
      { question: "¿Tengo que dejar de vender en mi local?", answer: "No. Madsjeez suma un canal online sin reemplazar tu mostrador." },
      { question: "¿Necesito muchos productos para empezar?", answer: "No. Empezá con tu stock más vendido y ampliá cuando quieras." },
    ],
    ctaTitle: "Sumá tu ferretería a Madsjeez",
    ctaSubtitle: "Mostrá tu catálogo de ferretería online y llegá a más clientes.",
    related: [HUB_SLUG, "vender-ferreteria-online", "vender-repuestos-online", "marketplace-para-casas-de-repuestos"],
    priority: 0.85,
  },

  /* --------------------------- 14. MARKETPLACE PARA CASAS DE REPUESTOS */
  {
    slug: "marketplace-para-casas-de-repuestos",
    keyword: "marketplace de repuestos",
    breadcrumb: "Marketplace para casas de repuestos",
    seoTitle: "Marketplace para casas de repuestos | Madsjeez",
    metaDescription:
      "¿Tenés una casa de repuestos? Publicá tu catálogo de repuestos de máquinas en Madsjeez y llegá a compradores que buscan piezas específicas.",
    h1: "El marketplace para casas de repuestos",
    heroEyebrow: "Repuestos que se encuentran",
    heroSubtitle:
      "Si vendés repuestos de máquinas, Madsjeez te ayuda a publicar tu catálogo y conectar con compradores que buscan piezas para motosierra, desmalezadora, grupos electrógenos, motobombas y más.",
    intro:
      "El comprador de repuestos busca algo puntual para un modelo específico. Tener tu catálogo ordenado y publicado hace que te encuentre justo cuando lo necesita.",
    benefits: [
      { title: "Compradores que buscan piezas", desc: "La gente entra buscando el repuesto exacto: vos aparecés con tu publicación." },
      { title: "Máquinas a explosión y jardinería", desc: "Motosierra, desmalezadora, grupos electrógenos, motobombas, motores y más." },
      { title: "Catálogo técnico ordenado", desc: "Publicá por tipo de pieza, marca y modelo compatible para que te encuentren." },
      { title: "Alcance nacional", desc: "Vendé a compradores de todo el país, no solo de tu zona." },
    ],
    content: [
      {
        h2: "Publicá tu catálogo de repuestos",
        body: "En Madsjeez subís tu catálogo de repuestos de máquinas a explosión, jardinería y herramientas. Cada publicación con su tipo de pieza, marca y modelo compatible aparece cuando un comprador busca esa pieza.",
      },
      {
        h2: "Por qué a las casas de repuestos les sirve un marketplace",
        body: "Tu fuerte es la variedad y el conocimiento técnico. Un marketplace con buscador y categorías hace que esa variedad sea visible y que compradores de todo el país lleguen a la pieza que buscan.",
      },
    ],
    faqs: [
      { question: "¿Qué repuestos puedo publicar?", answer: "Repuestos de motosierra, desmalezadora, grupos electrógenos, motobombas, motores, herramientas y máquinas en general." },
      { question: "¿Cómo hago para que encuentren la pieza correcta?", answer: "Publicá con título claro (pieza, marca y modelo compatible), buenas fotos y, si tenés, el número de parte. Recordá aclarar que conviene verificar medidas y modelo antes de comprar." },
      { question: "¿Llego a todo el país?", answer: "Sí. Coordinás el envío o la entrega según cada venta." },
    ],
    ctaTitle: "Publicá tu catálogo de repuestos",
    ctaSubtitle: "Conectá con compradores que buscan piezas específicas en todo el país.",
    related: [HUB_SLUG, "vender-repuestos-online", "marketplace-para-ferreterias", "vender-ferreteria-online"],
    priority: 0.85,
  },
];

const BY_SLUG = new Map(SELLER_LANDINGS.map((l) => [l.slug, l]));

export function getSellerLanding(slug: string): SellerLanding | undefined {
  return BY_SLUG.get(slug);
}

export function allSellerLandingSlugs(): string[] {
  return SELLER_LANDINGS.map((l) => l.slug);
}
