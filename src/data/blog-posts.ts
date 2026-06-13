/**
 * Blog SEO — artículos para captar tráfico amplio de vendedores y derivarlo
 * al cluster de landings (cada artículo enlaza a su landing + al hub).
 *
 * Mismas reglas de copy que las landings: sin "gratis"/"comisión cero",
 * sin difamar a Mercado Libre, tono Argentina claro y útil.
 */

import type { FaqItem } from "./seller-landings";

export type BlogSection = { h2: string; paragraphs: string[]; list?: string[] };

export type BlogPost = {
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  category: string;
  tags: string[];
  updatedAt: string; // ISO
  readingMinutes: number;
  intro: string;
  sections: BlogSection[];
  faqs: FaqItem[];
  /** landing a la que apunta el CTA */
  ctaLanding: string;
  /** slugs de otros posts relacionados */
  related: string[];
};

const UPDATED = "2026-06-13";

export const BLOG_POSTS: BlogPost[] = [
  /* ----------------------------------------------------------------- 1 */
  {
    slug: "donde-vender-productos-online-argentina",
    title: "Dónde vender mis productos online en Argentina",
    seoTitle: "Dónde vender mis productos online en Argentina (guía 2026) | Madsjeez",
    metaDescription:
      "Guía para decidir dónde vender tus productos online en Argentina: redes, WhatsApp, tienda propia o marketplace. Ventajas, costos y cómo combinarlos.",
    excerpt:
      "Redes, WhatsApp, tienda propia o marketplace: comparamos las opciones reales para vender online en Argentina y cómo combinarlas.",
    category: "Vender online",
    tags: ["vender online", "marketplace", "emprendedores"],
    updatedAt: UPDATED,
    readingMinutes: 6,
    intro:
      "Si tenés productos para vender y no sabés por dónde empezar, la pregunta es siempre la misma: ¿dónde los publico? En Argentina hay varias opciones y ninguna es excluyente. Lo importante es entender qué te da cada una para no depender de una sola.",
    sections: [
      {
        h2: "Las opciones para vender online en Argentina",
        paragraphs: [
          "Hoy un vendedor argentino tiene básicamente cuatro caminos para vender por internet, y lo ideal es combinarlos según tu momento y tu rubro:",
        ],
        list: [
          "Redes sociales (Instagram, Facebook, TikTok): buenas para mostrar y generar comunidad, pero el catálogo se pierde con el scroll.",
          "WhatsApp: imprescindible para cerrar ventas y atención, pero no es una vidriera ni te trae clientes nuevos solo.",
          "Tienda propia: te da control total, pero requiere tiempo, dinero y mantenimiento.",
          "Marketplace: te da tráfico y orden desde el día uno, sin armar una web.",
        ],
      },
      {
        h2: "Por qué conviene no depender de un solo canal",
        paragraphs: [
          "Apostar todo a una sola plataforma es un riesgo: un cambio de reglas, un costo nuevo o una cuenta con problemas pueden frenar tus ventas de un día para el otro. Tener más de un canal te da estabilidad.",
          "La estrategia que mejor funciona es usar las redes para difundir, WhatsApp para atender y un marketplace para ordenar tu catálogo y que te encuentren compradores nuevos.",
        ],
      },
      {
        h2: "Cómo empezar sin complicarte",
        paragraphs: [
          "Si querés arrancar rápido, publicar en un marketplace argentino como Madsjeez es la vía más directa: creás tu cuenta, cargás tus productos con fotos y precios, y tu catálogo queda disponible para compradores de todo el país. No necesitás página web propia ni conocimientos técnicos.",
          "Después podés sumar tus redes y tu WhatsApp para difundir el link de tu vidriera. Así combinás visibilidad, atención y orden.",
        ],
      },
    ],
    faqs: [
      { question: "¿Cuál es la forma más rápida de empezar a vender online?", answer: "Publicar tu catálogo en un marketplace con tráfico, como Madsjeez. No requiere armar una web ni conocimientos técnicos." },
      { question: "¿Tengo que elegir un solo canal?", answer: "No. Lo ideal es combinar: redes para difundir, WhatsApp para atender y un marketplace para ordenar tu catálogo y ganar visibilidad." },
      { question: "¿Necesito página web para vender online?", answer: "No es obligatorio. Tu catálogo en un marketplace funciona como vidriera online y te da un link para compartir." },
    ],
    ctaLanding: "donde-vender-mis-productos",
    related: ["como-vender-por-internet-sin-pagina-web", "que-es-un-marketplace-para-emprendedores", "como-publicar-productos-online-y-conseguir-clientes"],
  },

  /* ----------------------------------------------------------------- 2 */
  {
    slug: "como-vender-por-internet-sin-pagina-web",
    title: "Cómo vender por internet si no tengo página web",
    seoTitle: "Cómo vender por internet sin página web | Madsjeez",
    metaDescription:
      "¿Querés vender online pero no tenés página web? Te mostramos cómo hacerlo con un marketplace y tus redes, sin programar ni invertir de más.",
    excerpt:
      "No necesitás una web propia para vender online. Te explicamos cómo armar tu vidriera digital sin programar nada.",
    category: "Vender online",
    tags: ["sin página web", "vidriera online", "emprendedores"],
    updatedAt: UPDATED,
    readingMinutes: 5,
    intro:
      "Mucha gente cree que para vender por internet necesita sí o sí una página web. No es así. Podés tener una vidriera online, ordenada y profesional, sin escribir una línea de código ni pagar un desarrollo.",
    sections: [
      {
        h2: "Por qué no necesitás una web propia para arrancar",
        paragraphs: [
          "Armar una página web propia lleva tiempo, plata y mantenimiento: dominio, hosting, diseño, pasarela de pago y actualizaciones. Para empezar a vender, ese esfuerzo no es necesario.",
          "Un marketplace te da todo eso resuelto: la vidriera, el buscador, las categorías y el tráfico. Vos te concentrás en tus productos.",
        ],
      },
      {
        h2: "De las redes a una vidriera ordenada",
        paragraphs: [
          "Vender por Instagram o WhatsApp funciona, pero tiene un límite: los productos se pierden entre historias y mensajes, y cada vez que alguien quiere ver tu catálogo completo, tenés que mandarlo a mano.",
          "Con un marketplace como Madsjeez, tu catálogo queda ordenado por categorías, siempre disponible en un mismo link. Compartís ese link en tu bio, tus historias o tu estado de WhatsApp y listo.",
        ],
      },
      {
        h2: "Qué necesitás para publicar",
        paragraphs: [
          "Para empezar sólo te hace falta: una cuenta de vendedor, buenas fotos de tus productos, un título claro, el precio y una descripción. Con eso ya tenés tu vidriera funcionando.",
        ],
      },
    ],
    faqs: [
      { question: "¿Puedo vender online sin página web?", answer: "Sí. Tu catálogo en un marketplace como Madsjeez funciona como vidriera online, sin que tengas que crear una web propia." },
      { question: "¿Qué ventaja tiene sobre vender solo por Instagram?", answer: "El catálogo queda ordenado y con buscador, no se pierde con el scroll, y tenés un link fijo para compartir." },
      { question: "¿Es caro?", answer: "No requiere desarrollo web ni hosting. Creás tu cuenta y publicás; revisá las condiciones de tu tipo de cuenta al registrarte." },
    ],
    ctaLanding: "vender-sin-pagina-web",
    related: ["donde-vender-productos-online-argentina", "que-necesita-un-emprendedor-para-vender-online", "como-crear-una-buena-publicacion-de-producto"],
  },

  /* ----------------------------------------------------------------- 3 */
  {
    slug: "que-es-un-marketplace-para-emprendedores",
    title: "Marketplace para emprendedores: qué es y cómo funciona",
    seoTitle: "Marketplace para emprendedores: qué es y cómo funciona | Madsjeez",
    metaDescription:
      "Qué es un marketplace para emprendedores, cómo funciona y qué le aporta a tu negocio frente a vender solo por redes sociales.",
    excerpt:
      "Qué es exactamente un marketplace, cómo funciona y por qué le sirve a un emprendedor que arranca.",
    category: "Emprender",
    tags: ["marketplace", "emprendedores", "cómo funciona"],
    updatedAt: UPDATED,
    readingMinutes: 5,
    intro:
      "El término 'marketplace' se usa mucho pero no siempre queda claro qué es. Te lo explicamos simple y por qué puede ser una buena base para un emprendimiento que recién empieza.",
    sections: [
      {
        h2: "Qué es un marketplace",
        paragraphs: [
          "Un marketplace es una plataforma donde varios vendedores publican sus productos en un mismo lugar. Los compradores entran a buscar, comparar y comprar, y vos aprovechás ese tráfico sin tener que armar tu propia tienda desde cero.",
          "Es la diferencia entre poner un local en una galería con movimiento o abrirlo en una calle donde todavía no pasa nadie: el marketplace ya tiene gente entrando a comprar.",
        ],
      },
      {
        h2: "Cómo funciona para el vendedor",
        paragraphs: [
          "El flujo es simple: creás tu cuenta de vendedor, cargás tus productos con fotos y precios, y tu catálogo queda publicado. Cuando un comprador se interesa, te contacta o compra según el caso.",
        ],
      },
      {
        h2: "Qué le aporta a un emprendedor",
        paragraphs: [
          "Cuando arrancás, lo más difícil es que te conozcan. Un marketplace te da visibilidad y orden desde el primer día, sin la inversión de una web propia. Además, te permite empezar con pocos productos y crecer a tu ritmo.",
          "Y como no reemplaza tus redes, podés usarlo como un canal más: difundís por Instagram, atendés por WhatsApp y ordenás tu catálogo en el marketplace.",
        ],
      },
    ],
    faqs: [
      { question: "¿Qué es un marketplace para emprendedores?", answer: "Una plataforma donde emprendedores publican sus productos en un mismo lugar con tráfico, ganando visibilidad sin armar su propia tienda." },
      { question: "¿Sirve si recién empiezo?", answer: "Sí. Podés empezar con pocos productos, sin web propia, y crecer a tu ritmo." },
      { question: "¿Reemplaza a mis redes sociales?", answer: "No, las complementa: redes para difundir y el marketplace como vidriera ordenada para vender." },
    ],
    ctaLanding: "marketplace-para-emprendedores",
    related: ["donde-vender-productos-online-argentina", "que-necesita-un-emprendedor-para-vender-online", "alternativas-para-vender-fuera-de-mercado-libre"],
  },

  /* ----------------------------------------------------------------- 4 */
  {
    slug: "alternativas-para-vender-fuera-de-mercado-libre",
    title: "Alternativas para vender fuera de Mercado Libre",
    seoTitle: "Alternativas para vender fuera de Mercado Libre en Argentina | Madsjeez",
    metaDescription:
      "¿Buscás vender fuera de Mercado Libre o sumar otro canal? Repasamos las alternativas y por qué conviene no depender de una sola plataforma.",
    excerpt:
      "Por qué cada vez más vendedores buscan sumar canales además de Mercado Libre, y qué opciones tienen en Argentina.",
    category: "Estrategia",
    tags: ["alternativa Mercado Libre", "canales de venta", "marketplace"],
    updatedAt: UPDATED,
    readingMinutes: 6,
    intro:
      "Mercado Libre es una de las plataformas más grandes de la región y a muchos vendedores les funciona. Aun así, cada vez más buscan sumar otros canales. No se trata de irse, sino de no depender de uno solo.",
    sections: [
      {
        h2: "Por qué sumar otro canal de venta",
        paragraphs: [
          "Depender de una sola plataforma te deja expuesto: cambios de reglas, costos o una cuenta con problemas pueden afectar tus ventas. Tener más de un canal reparte ese riesgo y te da más visibilidad.",
          "Por eso muchos vendedores buscan una alternativa que funcione como complemento, no como reemplazo.",
        ],
      },
      {
        h2: "Qué opciones hay",
        paragraphs: [
          "Además de Mercado Libre, podés sumar tienda propia, redes sociales con catálogo, o un marketplace argentino como Madsjeez que te dé una vidriera ordenada y tráfico, sin pedirte que dejes lo que ya usás.",
        ],
      },
      {
        h2: "Cómo sumar Madsjeez sin dejar lo que ya tenés",
        paragraphs: [
          "La idea es simple: seguís vendiendo donde ya lo hacés y publicás tu catálogo también en Madsjeez. Creás la cuenta, cargás tus productos y ganás una vidriera más para que te encuentren compradores nuevos.",
          "No tenés que migrar nada ni elegir entre uno y otro: es un canal adicional.",
        ],
      },
    ],
    faqs: [
      { question: "¿Tengo que dejar Mercado Libre para usar otra plataforma?", answer: "No. Podés seguir vendiendo en Mercado Libre y sumar Madsjeez como un canal adicional." },
      { question: "¿Por qué conviene tener más de un canal?", answer: "Reduce el riesgo de depender de una sola cuenta o plataforma y te da más visibilidad y oportunidades de venta." },
      { question: "¿Es complicado sumar otro canal?", answer: "No. Creás tu cuenta, cargás tu catálogo y empezás. No necesitás migrar lo que ya tenés." },
    ],
    ctaLanding: "alternativa-a-mercado-libre",
    related: ["donde-vender-productos-online-argentina", "que-es-un-marketplace-para-emprendedores", "whatsapp-instagram-marketplace-juntos"],
  },

  /* ----------------------------------------------------------------- 5 */
  {
    slug: "como-publicar-productos-online-y-conseguir-clientes",
    title: "Cómo publicar productos online y conseguir más clientes",
    seoTitle: "Cómo publicar productos online y conseguir más clientes | Madsjeez",
    metaDescription:
      "Aprendé a publicar tus productos online para que te encuentren y vendas más: fotos, títulos, precios y descripciones que convierten.",
    excerpt:
      "Una buena publicación es la diferencia entre que te encuentren o no. Te mostramos cómo hacerla.",
    category: "Vender online",
    tags: ["publicar productos", "conseguir clientes", "fotos de producto"],
    updatedAt: UPDATED,
    readingMinutes: 6,
    intro:
      "Publicar un producto es fácil; publicarlo bien es lo que hace que te encuentren y te compren. Estos son los puntos que más impacto tienen en tus ventas.",
    sections: [
      {
        h2: "Fotos que generan confianza",
        paragraphs: [
          "La foto es lo primero que ve el comprador. Usá buena luz (natural si podés), fondo limpio y varias tomas desde distintos ángulos. Si el producto tiene detalles importantes, mostralos de cerca.",
        ],
      },
      {
        h2: "Títulos claros que ayudan a que te encuentren",
        paragraphs: [
          "En el título poné el nombre del producto y un dato clave: marca, modelo, medida o capacidad. Evitá títulos genéricos como 'oferta imperdible': no ayudan a que aparezcas cuando alguien busca algo puntual.",
        ],
      },
      {
        h2: "Descripciones y precios que convierten",
        paragraphs: [
          "En la descripción contá qué es, para qué sirve, qué incluye y cualquier dato que evite dudas (garantía, compatibilidad, envío). Un precio claro y una descripción completa reducen las preguntas y aceleran la decisión de compra.",
          "Cuando publicás en un marketplace con buscador como Madsjeez, todo esto trabaja a tu favor: una buena publicación aparece justo cuando alguien busca lo que vendés.",
        ],
      },
    ],
    faqs: [
      { question: "¿Qué hace que una publicación venda más?", answer: "Buenas fotos, un título con datos clave y una descripción completa con precio claro. Eso mejora que te encuentren y que el comprador confíe." },
      { question: "¿Cuántas fotos conviene subir?", answer: "Varias: una principal clara y otras desde distintos ángulos, mostrando detalles importantes del producto." },
      { question: "¿Conviene poner el precio en la publicación?", answer: "Sí. Un precio claro reduce preguntas y acelera la decisión de compra." },
    ],
    ctaLanding: "publicar-productos-online",
    related: ["como-crear-una-buena-publicacion-de-producto", "donde-vender-productos-online-argentina", "como-vender-por-internet-sin-pagina-web"],
  },

  /* ----------------------------------------------------------------- 6 */
  {
    slug: "como-vender-repuestos-online-argentina",
    title: "Cómo vender repuestos online en Argentina",
    seoTitle: "Cómo vender repuestos online en Argentina | Madsjeez",
    metaDescription:
      "Guía para vender repuestos online en Argentina: cómo ordenar tu catálogo por marca y modelo para que los compradores encuentren la pieza exacta.",
    excerpt:
      "Vender repuestos online tiene una particularidad: el comprador busca una pieza exacta. Te mostramos cómo aprovecharlo.",
    category: "Rubros",
    tags: ["repuestos", "vender online", "ferretería"],
    updatedAt: UPDATED,
    readingMinutes: 5,
    intro:
      "Quien busca un repuesto no navega: busca algo puntual para un modelo específico. Si ordenás bien tu catálogo, ese comprador te encuentra justo cuando te necesita.",
    sections: [
      {
        h2: "El comprador de repuestos busca, no navega",
        paragraphs: [
          "A diferencia de otros rubros, el comprador de repuestos ya sabe qué necesita: la pieza para tal motosierra, tal desmalezadora o tal grupo electrógeno. Tu trabajo es que tu publicación aparezca exactamente para esa búsqueda.",
        ],
      },
      {
        h2: "Cómo ordenar un catálogo de repuestos",
        paragraphs: [
          "Publicá cada pieza con un título que incluya el tipo de repuesto, la marca y el modelo compatible. Sumá fotos claras de la pieza y, si podés, el número de parte. Cuanto más específica la publicación, más fácil que el comprador correcto la encuentre.",
        ],
      },
      {
        h2: "Llegá a compradores de todo el país",
        paragraphs: [
          "Un repuesto que en tu zona casi no se pide puede tener mucha demanda en otra provincia. Publicar en un marketplace como Madsjeez te permite llegar a compradores de todo el país que buscan esa pieza específica, y coordinar el envío en cada venta.",
        ],
      },
    ],
    faqs: [
      { question: "¿Qué repuestos puedo vender online?", answer: "Repuestos de motosierra, desmalezadora, grupos electrógenos, motobombas, herramientas y máquinas en general, entre otros." },
      { question: "¿Cómo hago para que encuentren mi repuesto?", answer: "Publicá con título claro (pieza, marca y modelo compatible), buenas fotos y, si tenés, el número de parte." },
      { question: "¿Puedo vender a todo el país?", answer: "Sí. Llegás a compradores de todas las provincias y coordinás el envío o la entrega según cada venta." },
    ],
    ctaLanding: "vender-repuestos-online",
    related: ["como-vender-productos-mayoristas-por-internet", "como-publicar-productos-online-y-conseguir-clientes", "donde-vender-productos-online-argentina"],
  },

  /* ----------------------------------------------------------------- 7 */
  {
    slug: "como-vender-productos-mayoristas-por-internet",
    title: "Cómo vender productos mayoristas por internet",
    seoTitle: "Cómo vender productos mayoristas por internet | Madsjeez",
    metaDescription:
      "Cómo mostrar tu catálogo mayorista online, recibir consultas de revendedores y conseguir compradores que compran por cantidad.",
    excerpt:
      "Si vendés por cantidad, internet te conecta con revendedores de todo el país. Te explicamos cómo.",
    category: "Rubros",
    tags: ["mayorista", "revendedores", "catálogo"],
    updatedAt: UPDATED,
    readingMinutes: 5,
    intro:
      "El mayorista vive de dos cosas: catálogo y precio por cantidad. Internet te ayuda a mostrar lo primero y a que te encuentren compradores que revenden.",
    sections: [
      {
        h2: "Mostrá tu catálogo mayorista online",
        paragraphs: [
          "Tener tu catálogo publicado y ordenado te permite que un revendedor vea tu oferta completa sin que tengas que mandarle listas por WhatsApp una y otra vez. Es tu vidriera mayorista, disponible siempre.",
        ],
      },
      {
        h2: "Conectá con compradores que revenden",
        paragraphs: [
          "Muchos minoristas y emprendedores buscan proveedores mayoristas confiables. Si tu catálogo está publicado en un marketplace, esos compradores te descubren, te consultan y pueden empezar una relación comercial.",
        ],
      },
      {
        h2: "Cómo presentar precios y condiciones por mayor",
        paragraphs: [
          "En cada publicación podés detallar las condiciones de venta por mayor y aclarar mínimos de compra en la descripción. Ser claro con esto filtra consultas y te deja hablar directamente con quien te conviene.",
          "En Madsjeez podés mostrar tu catálogo mayorista, recibir consultas y conectar con compradores de todo el país interesados en comprar por cantidad.",
        ],
      },
    ],
    faqs: [
      { question: "¿Puedo vender productos mayoristas por internet?", answer: "Sí. Podés mostrar tu catálogo mayorista, recibir consultas y conectar con compradores que buscan productos para revender." },
      { question: "¿Cómo muestro precios por cantidad?", answer: "Detallás las condiciones de venta por mayor y los mínimos en la descripción de cada producto." },
      { question: "¿Quién va a ver mi catálogo?", answer: "Minoristas, revendedores y emprendedores de todo el país que buscan proveedores mayoristas." },
    ],
    ctaLanding: "vender-productos-mayoristas-online",
    related: ["como-vender-repuestos-online-argentina", "que-es-un-marketplace-para-emprendedores", "alternativas-para-vender-fuera-de-mercado-libre"],
  },

  /* ----------------------------------------------------------------- 8 */
  {
    slug: "whatsapp-instagram-marketplace-juntos",
    title: "Cómo usar WhatsApp, Instagram y un marketplace juntos",
    seoTitle: "WhatsApp, Instagram y marketplace juntos para vender más | Madsjeez",
    metaDescription:
      "Cada canal cumple un rol distinto. Te mostramos cómo combinar WhatsApp, Instagram y un marketplace para vender más sin volverte loco.",
    excerpt:
      "No se trata de elegir un canal, sino de hacer que cada uno haga lo que mejor sabe. Así se combinan.",
    category: "Estrategia",
    tags: ["WhatsApp", "Instagram", "canales de venta"],
    updatedAt: UPDATED,
    readingMinutes: 5,
    intro:
      "Muchos vendedores sienten que tienen que elegir entre redes, WhatsApp o un marketplace. En realidad, cada canal cumple un rol distinto y juntos funcionan mejor.",
    sections: [
      {
        h2: "Qué hace bien cada canal",
        paragraphs: [
          "Cada herramienta tiene su fuerte, y conviene usarla para eso:",
        ],
        list: [
          "Instagram y redes: muestran tus productos, generan deseo y comunidad.",
          "WhatsApp: cierra ventas, responde dudas y mantiene la relación con el cliente.",
          "Marketplace: ordena tu catálogo, te da buscador y te trae compradores nuevos.",
        ],
      },
      {
        h2: "El circuito que funciona",
        paragraphs: [
          "Una forma simple de combinarlos: mostrás un producto en tus historias de Instagram, ponés el link a tu catálogo del marketplace en la bio o el sticker, y cerrás la venta o respondés dudas por WhatsApp.",
          "Así, el contenido de redes lleva tráfico a una vidriera ordenada, y la conversación final ocurre donde el cliente se siente cómodo.",
        ],
      },
      {
        h2: "Por qué el marketplace es el ancla",
        paragraphs: [
          "Las historias desaparecen y los mensajes se acumulan, pero tu catálogo en un marketplace queda fijo, ordenado y siempre disponible. Es el lugar al que mandás a todos, sin importar de qué red vengan.",
          "Tener tu catálogo en Madsjeez te da ese punto de encuentro estable, además de la visibilidad de aparecer en un marketplace con tráfico propio.",
        ],
      },
    ],
    faqs: [
      { question: "¿Tengo que elegir entre WhatsApp, Instagram o un marketplace?", answer: "No. Cada canal cumple un rol: redes para mostrar, WhatsApp para cerrar y el marketplace para ordenar y dar visibilidad." },
      { question: "¿Cómo conecto mis redes con mi catálogo?", answer: "Poné el link de tu catálogo del marketplace en la bio, las historias o el estado de WhatsApp, y dirigí ahí a tus seguidores." },
      { question: "¿Por qué el marketplace es el centro?", answer: "Porque tu catálogo queda fijo y ordenado, a diferencia de las historias que desaparecen y los mensajes que se acumulan." },
    ],
    ctaLanding: "vender-en-madsjeez",
    related: ["donde-vender-productos-online-argentina", "alternativas-para-vender-fuera-de-mercado-libre", "como-publicar-productos-online-y-conseguir-clientes"],
  },

  /* ----------------------------------------------------------------- 9 */
  {
    slug: "que-necesita-un-emprendedor-para-vender-online",
    title: "Qué necesita un emprendedor para empezar a vender online",
    seoTitle: "Qué necesita un emprendedor para empezar a vender online | Madsjeez",
    metaDescription:
      "La checklist real para empezar a vender online como emprendedor en Argentina: productos, fotos, canal, precios y atención. Sin vueltas.",
    excerpt:
      "No necesitás tanto como creés para arrancar. Esta es la checklist real para empezar a vender online.",
    category: "Emprender",
    tags: ["emprendedores", "empezar a vender", "checklist"],
    updatedAt: UPDATED,
    readingMinutes: 5,
    intro:
      "Cuando recién emprendés es fácil sentir que te falta de todo. La verdad es que para empezar a vender online necesitás menos de lo que pensás. Esta es la base real.",
    sections: [
      {
        h2: "Lo mínimo para arrancar",
        paragraphs: [
          "Antes de complicarte con webs, logos perfectos o campañas, asegurate de tener lo esencial:",
        ],
        list: [
          "Productos definidos y con stock (o capacidad de conseguirlos).",
          "Buenas fotos: no hace falta un estudio, alcanza con buena luz y fondo limpio.",
          "Un canal donde publicar: un marketplace te resuelve la vidriera sin web propia.",
          "Precios claros y una forma de cobrar.",
          "Un canal de atención, normalmente WhatsApp.",
        ],
      },
      {
        h2: "Por dónde empezar a publicar",
        paragraphs: [
          "Publicar en un marketplace argentino como Madsjeez te da una vidriera ordenada y tráfico desde el primer día, sin la inversión de una web. Cargás tus productos, los mostrás y vas aprendiendo qué funciona.",
        ],
      },
      {
        h2: "Crecé de a poco",
        paragraphs: [
          "No necesitás cargar 200 productos el primer día. Empezá con los que más vendés o los que mejor conocés, mirá qué se consulta y ampliá tu catálogo con el tiempo. Lo importante es arrancar.",
        ],
      },
    ],
    faqs: [
      { question: "¿Qué necesito para empezar a vender online?", answer: "Productos, buenas fotos, un canal donde publicar (como un marketplace), precios claros, una forma de cobrar y un canal de atención como WhatsApp." },
      { question: "¿Necesito muchos productos para arrancar?", answer: "No. Empezá con los que más vendés o mejor conocés y ampliá tu catálogo con el tiempo." },
      { question: "¿Necesito una web propia?", answer: "No para empezar. Un marketplace te da la vidriera y el tráfico sin que armes una web." },
    ],
    ctaLanding: "marketplace-para-emprendedores",
    related: ["que-es-un-marketplace-para-emprendedores", "como-vender-por-internet-sin-pagina-web", "como-crear-una-buena-publicacion-de-producto"],
  },

  /* ---------------------------------------------------------------- 10 */
  {
    slug: "como-crear-una-buena-publicacion-de-producto",
    title: "Cómo crear una buena publicación de producto",
    seoTitle: "Cómo crear una buena publicación de producto (paso a paso) | Madsjeez",
    metaDescription:
      "Paso a paso para crear una publicación de producto que se encuentre y venda: foto, título, descripción, precio y datos clave.",
    excerpt:
      "La anatomía de una publicación que vende, parte por parte, con ejemplos concretos.",
    category: "Vender online",
    tags: ["publicación de producto", "fotos", "descripción"],
    updatedAt: UPDATED,
    readingMinutes: 6,
    intro:
      "Una publicación es tu vendedor silencioso: trabaja por vos las 24 horas. Estos son los elementos que la hacen efectiva, parte por parte.",
    sections: [
      {
        h2: "La foto principal",
        paragraphs: [
          "Es lo primero que ve el comprador y lo que decide si hace clic. Usá buena luz, fondo limpio y mostrá el producto completo y centrado. Sumá fotos adicionales con detalles, ángulos y, si aplica, la escala (al lado de algo de tamaño conocido).",
        ],
      },
      {
        h2: "El título",
        paragraphs: [
          "Escribí un título descriptivo con los datos por los que la gente busca: nombre del producto, marca, modelo, medida o color. Por ejemplo, mejor 'Taladro percutor Bosch GSB 13 RE 650W' que 'Taladro en oferta'.",
        ],
      },
      {
        h2: "La descripción y los datos clave",
        paragraphs: [
          "Contá qué es, para qué sirve, qué incluye y los datos que evitan dudas: medidas, materiales, compatibilidad, garantía y condiciones de envío. Usá párrafos cortos o viñetas para que se lea fácil.",
        ],
      },
      {
        h2: "Precio y llamada a la acción",
        paragraphs: [
          "Un precio claro genera confianza. Si manejás distintas condiciones (por cantidad, por pago), aclaralo. Cerrá invitando a consultar o comprar.",
          "Cuando cargás tus productos en Madsjeez, aplicar estos puntos hace que tus publicaciones aparezcan mejor en las búsquedas y conviertan más.",
        ],
      },
    ],
    faqs: [
      { question: "¿Qué tiene que tener una buena publicación?", answer: "Una foto principal clara, un título descriptivo con datos clave, una descripción completa y un precio claro." },
      { question: "¿Cómo escribo un buen título?", answer: "Incluí nombre del producto, marca, modelo y medida. Evitá títulos genéricos como 'oferta imperdible'." },
      { question: "¿Qué datos no pueden faltar en la descripción?", answer: "Qué es, para qué sirve, qué incluye, medidas o compatibilidad, garantía y condiciones de envío." },
    ],
    ctaLanding: "publicar-productos-online",
    related: ["como-publicar-productos-online-y-conseguir-clientes", "como-vender-por-internet-sin-pagina-web", "que-necesita-un-emprendedor-para-vender-online"],
  },
];

const BY_SLUG = new Map(BLOG_POSTS.map((p) => [p.slug, p]));

export function getBlogPost(slug: string): BlogPost | undefined {
  return BY_SLUG.get(slug);
}

export function allBlogSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}
