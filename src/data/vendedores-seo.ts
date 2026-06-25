export type VendedorSeoFaq = { q: string; a: string }
export type VendedorSeoSection = { heading: string; content: string }

export type VendedorSeoPage = {
  slug: string
  h1: string
  seoTitle: string
  metaDescription: string
  keywords: string[]
  intent: "informativa" | "comparativa" | "comercial" | "transaccional"
  priority: "alta" | "media" | "baja"
  audience: string
  intro: string
  sections: VendedorSeoSection[]
  checklist?: string[]
  faqs: VendedorSeoFaq[]
  cta: string
  sources: { name: string; url: string }[]
  relatedSlugs: string[]
  publishedAt: string
}

export const VENDEDORES_SEO_PAGES: VendedorSeoPage[] = [
  {
    slug: "alternativa-a-mercado-libre",
    h1: "Alternativa a Mercado Libre para vendedores: sumá otro canal de ventas",
    seoTitle: "Alternativa a Mercado Libre para vendedores argentinos 2026",
    metaDescription:
      "¿Buscás una alternativa a Mercado Libre? Conocé cómo sumar otro canal de venta online sin dejar de vender donde ya estás. Madsjeez: marketplace argentino, primeros 1000 vendedores con 200 publicaciones gratis.",
    keywords: [
      "alternativa a mercado libre",
      "alternativa mercado libre vendedores",
      "otro canal de ventas online argentina",
      "marketplace alternativo argentina",
      "vender online sin mercado libre",
      "diversificar ventas online",
    ],
    intent: "comparativa",
    priority: "alta",
    audience: "Vendedores activos en Mercado Libre que buscan reducir dependencia o sumar canales.",
    intro:
      "La mayoría de los vendedores que buscan una alternativa a Mercado Libre no quieren dejar de vender ahí. Lo que buscan es no depender exclusivamente de una sola plataforma. Y esa diferencia es importante: no se trata de migrar, sino de diversificar.\n\nCuando el 100% de tus ingresos online pasa por un solo canal, cualquier cambio algorítmico, aumento de comisiones o suspensión de cuenta puede paralizar tu negocio de un día para el otro. La diversificación es la respuesta estructural a ese riesgo.\n\nMadsjeez es un marketplace argentino que funciona como canal adicional para vendedores que ya tienen presencia en otros sitios. Los primeros 1000 vendedores aprobados reciben hasta 200 publicaciones cargadas sin costo. No hace falta abandonar nada: se suman canales.",
    sections: [
      {
        heading: "¿Por qué los vendedores buscan alternativas a Mercado Libre?",
        content:
          "Las razones más frecuentes que mencionan los vendedores son cuatro: comisiones que crecen con el tiempo (hoy entre el 12% y el 16% más IVA, según el plan), algoritmos de visibilidad opacos que pueden bajar las ventas sin aviso, dependencia total de una sola fuente de ingresos, y el riesgo de suspensiones o limitaciones de cuenta.\n\nNinguna de esas razones implica que Mercado Libre sea una mala plataforma. Implica que depender exclusivamente de cualquier plataforma es riesgoso. Lo mismo aplica si tu única fuente de ventas fuera Instagram, WhatsApp o una tienda propia: la concentración de canal es el problema, no la plataforma específica.\n\nLos vendedores con más experiencia lo saben: los mejores negocios online tienen dos o tres canales activos, con distintas audiencias y distintas estructuras de costo.",
      },
      {
        heading: "¿Cuáles son las opciones para vender online en Argentina?",
        content:
          "Las principales opciones disponibles para vendedores argentinos son:\n\n**Marketplace generalista (Mercado Libre):** Alcance masivo, comisión variable 12-16% + IVA, alta competencia. Ideal para productos de consumo masivo con demanda establecida.\n\n**Tienda propia (Tiendanube, Shopify):** Control total, sin comisión por venta, pero requiere generar tráfico propio. Inversión en diseño y marketing necesaria.\n\n**Redes sociales (Instagram, Facebook):** Gratis para publicar, pero sin carrito de compras nativo consolidado. Requiere gestión manual de pedidos.\n\n**WhatsApp Business:** Canal directo con el cliente, sin estructura de catálogo organizado. Útil como complemento, no como canal principal.\n\n**Marketplace especializado (Madsjeez):** Catálogo organizado por rubro, sin comisión por venta (modelo suscripción fija), compradores con intención específica de compra.\n\n**Venta local y entrega directa:** Para comercios físicos que quieren sumar ventas digitales sin abandonar su modelo actual.\n\nLa combinación más efectiva para la mayoría de los vendedores es: un canal masivo (ML) + un canal especializado (Madsjeez) + presencia en redes como soporte.",
      },
      {
        heading: "¿Qué es venta multicanal y por qué conviene?",
        content:
          "Venta multicanal significa tener tus productos disponibles para comprar en más de un lugar al mismo tiempo. Es la estrategia que usan todos los negocios online que superaron cierto volumen: no ponen todos los huevos en la misma canasta.\n\nLos beneficios son concretos: si un canal cae (por suspensión, cambio algorítmico o aumento de costos), seguís teniendo ingresos desde los otros. Además, cada canal llega a audiencias diferentes: el que busca en ML no es el mismo que busca en un marketplace especializado.\n\nEjemplo práctico: una ferretería de Rosario vende herramientas en ML hace cinco años. Cuando el algoritmo actualizó sus reglas de visibilidad, sus ventas cayeron un 30% en dos semanas. Si hubiera tenido Madsjeez activo al mismo tiempo, esa caída no habría detenido el negocio.",
      },
      {
        heading: "Cómo Madsjeez puede ser tu canal adicional",
        content:
          "Madsjeez es un marketplace argentino especializado en herramientas, hogar, repuestos, tecnología, bazar, indumentaria y otras categorías. Funciona con un modelo de suscripción fija, sin cobrar comisión por cada venta que cerrás.\n\nLa propuesta para vendedores nuevos es concreta: los primeros 1000 vendedores aprobados reciben la carga inicial de hasta 200 publicaciones sin costo. No hace falta saber de tecnología ni dedicarle horas al armado de la tienda: el equipo de Madsjeez se ocupa de eso.\n\nEl modelo está pensado para vendedores que ya tienen un negocio funcionando y quieren sumar un canal sin duplicar el trabajo operativo.",
      },
      {
        heading: "Paso a paso para sumar Madsjeez a tu operación",
        content:
          "El proceso para abrir tu tienda en Madsjeez tiene cinco pasos:\n\n**1. Completá el formulario de vendedor** en /vendedores con tus datos reales de comercio o emprendimiento.\n\n**2. Revisión del equipo:** Madsjeez revisa el rubro, los productos y los datos del comercio. La aprobación tarda pocos días hábiles.\n\n**3. Enviás la info de tus productos:** Una vez aprobado, mandás la lista de productos con precios, fotos y descripciones. Si ya tenés catálogo en otra plataforma, se puede usar como base.\n\n**4. El equipo carga las publicaciones:** Para los primeros 1000 vendedores aprobados, la carga de hasta 200 publicaciones la hace el equipo sin costo adicional.\n\n**5. Tu tienda queda activa:** A partir de ahí, los compradores pueden encontrar tus productos en Madsjeez y contactarte directamente.",
      },
    ],
    checklist: [
      "Calculá qué porcentaje de tus ventas viene de un solo canal",
      "Revisá cuánto pagás en comisiones por mes en tu canal principal",
      "Identificá si tu rubro tiene compradores que buscan en más de un lugar",
      "Evaluá si tenés stock suficiente para cubrir pedidos de dos canales",
      "Considerá si tu logística puede manejar pedidos de fuentes distintas",
    ],
    faqs: [
      {
        q: "¿Tengo que dejar Mercado Libre para sumarme a Madsjeez?",
        a: "No. Madsjeez y Mercado Libre son canales complementarios. La mayoría de los vendedores en Madsjeez también opera en ML u otras plataformas al mismo tiempo.",
      },
      {
        q: "¿Madsjeez cobra comisión por venta?",
        a: "No. Madsjeez funciona con un modelo de suscripción fija mensual, sin cobrar porcentaje sobre cada venta que cerrás. El costo es predecible independientemente de tu volumen de ventas.",
      },
      {
        q: "¿Qué productos puedo vender en Madsjeez?",
        a: "Madsjeez acepta herramientas, repuestos, hogar, tecnología, bazar, indumentaria y muchas otras categorías. El equipo revisa cada comercio antes de aprobarlo para garantizar la calidad del catálogo.",
      },
      {
        q: "¿Qué pasa si ya tengo 200 publicaciones en otro marketplace?",
        a: "Podés usar tu catálogo existente como base para la carga en Madsjeez. El equipo puede trabajar con exportaciones de catálogos de otras plataformas para agilizar el proceso.",
      },
    ],
    cta: "Sumá tu tienda a Madsjeez",
    sources: [
      {
        name: "Mercado Libre — Costos de vender",
        url: "https://ayuda.mercadolibre.com.ar/ayuda/costos-de-vender_611",
      },
      {
        name: "CACE — Cámara Argentina de Comercio Electrónico",
        url: "https://www.cace.org.ar",
      },
    ],
    relatedSlugs: [
      "dejar-de-depender-de-mercado-libre",
      "vender-en-varios-canales",
      "vender-online-sin-tantas-comisiones",
      "comercios-fisicos-online",
    ],
    publishedAt: "2026-01-15",
  },

  {
    slug: "dejar-de-depender-de-mercado-libre",
    h1: "Cómo dejar de depender de Mercado Libre sin dejar de vender online",
    seoTitle: "Cómo reducir la dependencia de Mercado Libre: estrategia multicanal para vendedores",
    metaDescription:
      "¿Dependés demasiado de Mercado Libre? Estrategia paso a paso para diversificar tus canales de venta sin perder ingresos. Sumá Madsjeez como canal adicional.",
    keywords: [
      "dejar de depender de mercado libre",
      "reducir dependencia mercado libre",
      "diversificar canales de venta",
      "menos dependencia marketplace",
      "venta multicanal argentina",
      "estrategia vendedor online",
    ],
    intent: "informativa",
    priority: "alta",
    audience: "Vendedores con alta dependencia de Mercado Libre que quieren reducir su exposición al riesgo.",
    intro:
      "Si más del 80% de tus ventas online vienen de una sola plataforma, tu negocio tiene un riesgo estructural que vale la pena reconocer. No se trata de que esa plataforma sea buena o mala: se trata de que cualquier cambio en sus condiciones —algorítmico, tarifario o de política— puede golpear tus ingresos sin que tengas mucho control.\n\nReducir la dependencia no significa abandonar lo que funciona. Significa construir un segundo canal activo que opere en paralelo, para que una suspensión, un cambio de reglas o un aumento de comisiones no detenga todo tu negocio.\n\nEsta guía explica cómo hacerlo de forma gradual y sin fricciones.",
    sections: [
      {
        heading: "¿Qué significa depender demasiado de Mercado Libre?",
        content:
          "La dependencia excesiva se manifiesta cuando un solo canal concentra la mayoría de tus ingresos. En términos prácticos, las señales de alerta son:\n\n- Más del 70-80% de tus ventas online vienen de una sola plataforma\n- No tenés forma de contactar a tus clientes por fuera de esa plataforma\n- Una suspensión de cuenta o un cambio algorítmico te dejaría sin ventas online inmediatamente\n- No sabés cómo venderías si esa plataforma subiera sus tarifas un 5% más\n\nNinguna de estas situaciones implica que estés haciendo algo mal. Muchos vendedores llegaron a esta situación de forma orgánica: empezaron en ML, les fue bien, y siguieron invirtiendo ahí. El problema aparece cuando el negocio creció pero la estructura de canales no diversificó.",
      },
      {
        heading: "Los riesgos concretos de depender de un solo marketplace",
        content:
          "Los riesgos no son teóricos. Los vendedores con alta dependencia de un solo canal enfrentan cuatro tipos de riesgo:\n\n**Riesgo algorítmico:** Los algoritmos de visibilidad de los grandes marketplaces cambian con frecuencia. Un ajuste puede bajar el ranking de tus publicaciones y reducir las ventas significativamente en poco tiempo.\n\n**Riesgo tarifario:** Las plataformas que cotizan en bolsa tienen incentivos para aumentar sus ingresos. Las comisiones y tarifas de los grandes marketplaces han aumentado en varias ocasiones. El vendedor no tiene poder de negociación individual.\n\n**Riesgo de suspensión:** Las cuentas pueden ser limitadas o suspendidas por acumulación de reclamos, inconsistencias detectadas o violaciones de términos. El proceso de apelación puede tardar días o semanas.\n\n**Riesgo de competencia interna:** A medida que una categoría crece en un marketplace, más vendedores entran y la competencia de precios se intensifica. Los márgenes se comprimen.",
      },
      {
        heading: "Estrategia para reducir la dependencia: seis pasos",
        content:
          "La transición hacia una estructura multicanal se puede hacer gradualmente:\n\n**Paso 1 — Medí cuánto dependés:** Calculá qué porcentaje exacto de tus ingresos online viene de cada canal. Si un canal representa más del 70%, hay trabajo por hacer.\n\n**Paso 2 — Identificá a tus mejores clientes:** ¿Hay compradores frecuentes? ¿Alguno te contactó por fuera de la plataforma? Esos son los primeros candidatos para un segundo canal.\n\n**Paso 3 — Abrí un canal de contacto directo:** WhatsApp Business o una lista de email básica. No para reemplazar el marketplace, sino para tener un vínculo directo con quienes ya te compraron.\n\n**Paso 4 — Sumá un marketplace adicional:** El paso más concreto. Abrir una tienda en Madsjeez permite tener un segundo catálogo activo sin duplicar el trabajo operativo.\n\n**Paso 5 — Publicá tus primeros productos en el segundo canal:** No hace falta publicar todo de golpe. Empezá con los 20 o 30 productos más vendidos y evaluá la respuesta.\n\n**Paso 6 — Construí gradualmente:** Una vez que el segundo canal está activo, el objetivo es que genere al menos el 20-30% de las ventas totales. Eso ya reduce considerablemente el riesgo.",
      },
      {
        heading: "Por qué un marketplace especializado es más fácil que una tienda propia",
        content:
          "La tienda propia (Tiendanube, Shopify, etc.) es la forma de mayor control, pero también la de mayor costo y complejidad de arranque. Requiere diseño, configuración de pagos, generación de tráfico propio y mantenimiento.\n\nUn marketplace especializado como Madsjeez es una alternativa de fricción mucho menor: ya tiene la estructura técnica armada, ya tiene visitantes, y no requiere que vos generes el tráfico desde cero. El costo de entrada es bajo y el tiempo de arranque es de días, no de meses.\n\nPara un vendedor que quiere reducir su dependencia sin distrae recursos de su operación principal, el marketplace especializado es el primer paso natural.",
      },
      {
        heading: "Cómo Madsjeez funciona como canal de respaldo",
        content:
          "Madsjeez está diseñado para ser el segundo canal que los vendedores suman sin abandonar lo que ya tienen. La propuesta es directa: los primeros 1000 vendedores aprobados reciben hasta 200 publicaciones cargadas sin costo.\n\nEso significa que podés tener un segundo catálogo activo sin dedicar semanas a la carga manual. El equipo de Madsjeez se encarga de armar las publicaciones con la información que vos proporcionás.\n\nUna vez activo, Madsjeez opera en paralelo a cualquier otro canal que tengas. No hay restricciones de exclusividad ni condiciones que limiten tu operación en otras plataformas.",
      },
    ],
    faqs: [
      {
        q: "¿Cuánto tiempo lleva abrir un canal adicional en Madsjeez?",
        a: "Con la carga de publicaciones gratuita para los primeros 1000 vendedores, podés tener tu tienda activa en pocos días hábiles desde que completás el formulario y sos aprobado.",
      },
      {
        q: "¿Tengo que duplicar el trabajo de gestionar otro canal?",
        a: "No. La carga inicial de publicaciones la hace el equipo de Madsjeez. Una vez activa la tienda, la gestión diaria es similar a cualquier otro canal: responder consultas y coordinar envíos.",
      },
      {
        q: "¿Puedo operar en Madsjeez y en Mercado Libre al mismo tiempo?",
        a: "Sí. No hay exclusividad. La mayoría de los vendedores en Madsjeez también opera en otros canales simultáneamente.",
      },
    ],
    cta: "Sumá Madsjeez como tu segundo canal",
    sources: [
      {
        name: "Mercado Libre — Costos de vender",
        url: "https://ayuda.mercadolibre.com.ar/ayuda/costos-de-vender_611",
      },
      {
        name: "CACE — Cámara Argentina de Comercio Electrónico",
        url: "https://www.cace.org.ar",
      },
    ],
    relatedSlugs: [
      "alternativa-a-mercado-libre",
      "vender-en-varios-canales",
      "cuenta-suspendida-marketplace",
      "vender-online-sin-tantas-comisiones",
    ],
    publishedAt: "2026-01-20",
  },

  {
    slug: "vender-online-sin-tantas-comisiones",
    h1: "Cómo vender online sin que las comisiones te coman la ganancia",
    seoTitle: "Vender online con menos comisiones: alternativas para vendedores argentinos",
    metaDescription:
      "Las comisiones de Mercado Libre pueden llegar al 18% real (12-16% + IVA). Conocé cómo calcular tu ganancia real y qué alternativas existen para vender con menor costo.",
    keywords: [
      "vender online sin comisiones",
      "comisiones mercado libre",
      "cuanto cobra mercado libre por venta",
      "alternativa comisiones marketplace",
      "marketplace sin comision argentina",
      "calcular ganancia venta online",
    ],
    intent: "informativa",
    priority: "alta",
    audience: "Vendedores que quieren entender el costo real de vender online y optimizar su margen.",
    intro:
      "Muchos vendedores subestiman cuánto dinero van realmente a comisiones. La tarifa publicada parece razonable, pero cuando se suma el IVA sobre la comisión, los costos de envío y la publicidad que se vuelve prácticamente necesaria para tener visibilidad, el porcentaje real sobre el precio de venta puede sorprender.\n\nEntender la estructura de costos real es el primer paso para tomar decisiones mejores sobre dónde y cómo vender. No se trata de que alguna plataforma sea mala: se trata de conocer bien los números antes de fijar precios y calcular márgenes.\n\nEsta página explica cómo funciona realmente la estructura de costos en los marketplaces más usados en Argentina, y qué alternativas existen para reducirla.",
    sections: [
      {
        heading: "¿Cuánto cobra Mercado Libre de comisión realmente?",
        content:
          "Según las tarifas publicadas por Mercado Libre, los planes disponibles son:\n\n- **Clásico:** ~12% de comisión sobre el precio de venta\n- **Premium:** ~16% de comisión sobre el precio de venta\n\nPero esos porcentajes no incluyen el IVA que se aplica sobre la comisión. Con IVA (21%), el costo efectivo es:\n\n- Clásico: 12% × 1.21 = **~14.5% efectivo**\n- Premium: 16% × 1.21 = **~19.4% efectivo**\n\nEjemplos en números concretos:\n\n| Precio de venta | Plan Clásico (con IVA) | Plan Premium (con IVA) |\n|---|---|---|\n| $5.000 | -$725 | -$970 |\n| $20.000 | -$2.900 | -$3.880 |\n| $50.000 | -$7.250 | -$9.700 |\n\nEstas son solo las comisiones. No incluyen logística ni publicidad.",
      },
      {
        heading: "El costo oculto: la publicidad que muchos no calculan",
        content:
          "En categorías con alta competencia, las publicaciones sin publicidad paga (Product Ads) tienen muy baja visibilidad orgánica. Muchos vendedores activan Product Ads para compensar, lo que agrega un costo variable sobre el precio de venta que puede ir del 5% al 15% adicional, dependiendo de la categoría y la competencia.\n\nEse costo no aparece en la factura de comisiones. Aparece en la factura de publicidad, pero el impacto en el margen es el mismo.\n\nSi sumamos comisión + IVA sobre comisión + publicidad en una categoría competitiva, el costo total puede superar el 25-30% del precio de venta antes de contar los costos del producto y la logística.",
      },
      {
        heading: "Cómo calcular tu ganancia real vendiendo online",
        content:
          "La fórmula para calcular la ganancia neta de una venta online es:\n\n**Ganancia neta = Precio de venta − Costo del producto − Comisión (con IVA) − Costo de envío − Publicidad − Costos operativos**\n\nEjemplo práctico con una herramienta de $15.000:\n- Costo del producto: $7.000\n- Comisión Clásico con IVA (14.5%): $2.175\n- Envío (a cargo del vendedor): $800\n- Publicidad (8%): $1.200\n- **Ganancia neta: $3.825** (25.5% del precio de venta)\n\nSi el mismo producto se vende en un canal con 0% de comisión y sin publicidad obligatoria:\n- Costo del producto: $7.000\n- Suscripción mensual prorrateada: ~$300\n- Envío: $800\n- **Ganancia neta: $6.900** (46% del precio de venta)\n\nLa diferencia es significativa. En productos con mayor valor, el impacto en pesos es más notorio aún.",
      },
      {
        heading: "Comisión variable vs suscripción fija: cuándo conviene cada modelo",
        content:
          "Los dos modelos principales de costo en marketplaces son:\n\n**Comisión variable (modelo de ML):** No pagás para publicar, pero pagás un porcentaje de cada venta. Es conveniente cuando el volumen es bajo y no querés asumir un costo fijo. A medida que las ventas crecen, el costo en pesos escala proporcionalmente.\n\n**Suscripción fija (modelo de Madsjeez):** Pagás un monto fijo mensual independientemente de cuánto vendas. El costo por venta decrece a medida que el volumen sube. Es conveniente cuando tenés un volumen de ventas estable.\n\nEl punto de equilibrio depende de tu volumen. Si pagás más en comisiones que lo que costaría la suscripción mensual de un canal alternativo, el cambio tiene sentido económico.",
      },
      {
        heading: "Estrategias para mejorar el margen vendiendo online",
        content:
          "Más allá de elegir la plataforma con mejor estructura de costos, hay mejoras operativas que impactan el margen:\n\n**Optimizá tus publicaciones:** Un título con las palabras correctas y fotos de calidad mejoran la tasa de conversión. Más ventas del mismo tráfico = menor costo publicitario por venta.\n\n**Gestioná bien la categoría y el plan:** En ML, publicar en la categoría correcta evita costos extra. El plan de publicación afecta la comisión.\n\n**Considerá precio diferencial entre canales:** No es obligatorio tener el mismo precio en todos los canales. En un canal con menores costos, podés ofrecer mejor precio y seguir teniendo más margen.\n\n**Revisá regularmente tus costos:** El costo de los insumos cambia. Lo que era rentable hace 6 meses puede no serlo hoy. Revisar márgenes regularmente evita sorpresas.",
      },
    ],
    checklist: [
      "Calculá el costo efectivo de comisión con IVA incluido",
      "Sumá el costo de publicidad mensual promedio",
      "Incluí el costo de envío en el cálculo de margen",
      "Comparé el costo fijo mensual de plataformas alternativas con tu gasto actual en comisiones",
      "Revisá si tu precio de venta actual cubre todos los costos con margen positivo",
      "Identificá los productos con menor margen para evaluar si conviene publicarlos diferente",
    ],
    faqs: [
      {
        q: "¿Cuánto cobra Mercado Libre en 2026?",
        a: "Según las tarifas publicadas por Mercado Libre, la modalidad Clásico cobra aproximadamente 12% + IVA y la modalidad Premium cobra aproximadamente 16% + IVA sobre el precio de venta.",
      },
      {
        q: "¿Existe un marketplace sin comisión en Argentina?",
        a: "Madsjeez tiene un modelo de suscripción fija mensual, sin cobrar porcentaje sobre cada venta. El costo es un monto fijo mensual predecible, no variable por transacción.",
      },
      {
        q: "¿Cómo sé si me conviene cambiar de plataforma?",
        a: "Calculá cuánto pagás en comisiones por mes en tu canal actual. Si ese monto supera el costo de la suscripción mensual de Madsjeez, el cambio o la suma del canal tiene sentido matemático.",
      },
    ],
    cta: "Conocé el modelo sin comisión de Madsjeez",
    sources: [
      {
        name: "Mercado Libre — Costos de vender",
        url: "https://ayuda.mercadolibre.com.ar/ayuda/costos-de-vender_611",
      },
    ],
    relatedSlugs: [
      "alternativa-a-mercado-libre",
      "publicar-productos-gratis",
      "dejar-de-depender-de-mercado-libre",
      "200-publicaciones-gratis",
    ],
    publishedAt: "2026-01-25",
  },

  {
    slug: "publicar-productos-gratis",
    h1: "Dónde publicar productos gratis en Argentina",
    seoTitle: "Publicar productos gratis online en Argentina: opciones y comparativa",
    metaDescription:
      "Comparativa de opciones para publicar productos gratis en Argentina: Mercado Libre, OLX, redes sociales, WhatsApp y Madsjeez. Cuál conviene para tu negocio.",
    keywords: [
      "publicar productos gratis argentina",
      "donde publicar gratis online",
      "vender online gratis argentina",
      "marketplace gratis argentina",
      "publicar sin costo marketplace",
    ],
    intent: "informativa",
    priority: "alta",
    audience: "Vendedores nuevos o emprendedores que buscan opciones para publicar productos sin inversión inicial.",
    intro:
      "Publicar productos online no siempre requiere una inversión inicial. Existen varias opciones gratuitas para empezar a vender en Argentina, cada una con sus ventajas y limitaciones específicas.\n\nLa clave está en entender la diferencia entre 'gratis para publicar' y 'gratis para vender'. Algunas plataformas no cobran para publicar pero sí descuentan un porcentaje de cada venta. Otras tienen límites de cantidad de publicaciones en el plan gratuito. Y otras son completamente gratuitas pero tienen alcance muy limitado.\n\nEsta comparativa explica qué ofrece cada opción para que puedas elegir la que mejor se adapta a tu situación.",
    sections: [
      {
        heading: "Opciones para publicar productos gratis en Argentina",
        content:
          "Las principales opciones disponibles son:\n\n**Mercado Libre — Plan gratuito:** No cobra para publicar. Cobra 12-16% + IVA por venta. Alcance masivo, alta competencia. Ideal para productos con demanda establecida.\n\n**OLX / Clasificados online:** Gratis para publicar, sin comisión por venta. Alcance moderado, bajo volumen de compradores activos comparado con ML. Útil para artículos específicos o segunda mano.\n\n**Instagram / Facebook Marketplace:** Gratis para publicar. Sin sistema de pago integrado nativo. Requiere gestión manual de pedidos y pagos. Efectivo para nichos con comunidad activa en redes.\n\n**WhatsApp Business:** Gratis. Catálogo de productos disponible. Sin sistema de compra directa. Útil como canal de atención y cierre de ventas, pero no como catálogo principal.\n\n**Madsjeez — Promoción inicial:** Los primeros 1000 vendedores aprobados reciben hasta 200 publicaciones cargadas sin costo. Sin comisión por venta.",
      },
      {
        heading: "¿Cuándo 'gratis' no es realmente gratis?",
        content:
          "La distinción más importante que todo vendedor debe entender es la diferencia entre 'sin costo de entrada' y 'sin costo por venta'.\n\nMercado Libre, por ejemplo, no cobra para publicar. Pero cuando cerrás una venta, descuenta entre el 14.5% y el 19.4% (comisión + IVA). Eso no es gratis: es pago diferido hasta el momento de la venta.\n\nEsto es relevante para la planificación financiera. Si vas a vender un producto de $20.000, necesitás saber de antemano que vas a recibir entre $16.120 y $16.880, no $20.000.\n\nEn cambio, un modelo de suscripción fija como el de Madsjeez tiene un costo mensual conocido de antemano, y 0% sobre cada venta. Es gratis por venta, aunque tiene un costo fijo mensual.\n\nNingún modelo es objetivamente mejor: depende de tu volumen y de cómo preferís estructurar los costos.",
      },
      {
        heading: "Qué necesitás para publicar tus productos online",
        content:
          "Independientemente de la plataforma que elijas, estos son los elementos básicos para publicar correctamente:\n\n**Fotos:** Al menos 3-5 fotos por producto, con buena iluminación y fondo neutro. Las fotos son el factor más importante en la decisión de compra online.\n\n**Título descriptivo:** Incluí marca, modelo y especificación clave. Evitá palabras genéricas que no ayudan al comprador a identificar el producto.\n\n**Descripción completa:** Características, dimensiones, materiales, usos. Si es una herramienta, incluí especificaciones técnicas.\n\n**Precio actualizado:** Revisalo regularmente, especialmente en contexto inflacionario.\n\n**Stock real:** Publicar sin stock o con stock desactualizado genera cancelaciones que afectan tu reputación.\n\n**Método de envío:** Definí cómo vas a enviar antes de publicar. Entrega en el local, envío por correo, o a través de la logística de la plataforma.",
      },
      {
        heading: "Cómo elegir dónde publicar según tu negocio",
        content:
          "Las recomendaciones varían según el tipo de negocio:\n\n**Ferretería / herramientas / repuestos:** Madsjeez + ML. Compradores técnicos buscan en canales especializados. ML da alcance masivo, Madsjeez da calidad de audiencia.\n\n**Indumentaria / calzado:** Instagram + ML. El visual es fundamental, IG atrae el descubrimiento, ML cierra la venta.\n\n**Bazar / hogar / decoración:** Instagram + ML + WhatsApp. Muchas ventas se cierran por consulta directa previa.\n\n**Tecnología / electrónica:** ML + Madsjeez. Alta demanda en ML, pero la especificidad técnica se valora en canales especializados.\n\n**Artículos de segunda mano específicos:** OLX o grupos de Facebook. Para venta ocasional sin necesidad de estructura.",
      },
      {
        heading: "La promoción de 200 publicaciones gratis de Madsjeez",
        content:
          "Para los primeros 1000 vendedores aprobados, Madsjeez ofrece la carga inicial de hasta 200 publicaciones sin costo. Esto significa que el equipo de Madsjeez se encarga de armar las publicaciones con la información que el vendedor provee: título, descripción, precio, fotos, categoría.\n\nEl proceso funciona así: el vendedor completa el formulario de registro, es revisado y aprobado por el equipo, luego envía la información de sus productos (puede ser un listado de Excel, fotos, o exportación de otro marketplace), y el equipo carga las publicaciones.\n\nEsta carga es aplicable mientras haya cupos disponibles para los primeros 1000 vendedores. La aprobación del comercio no es automática: requiere que el rubro y los productos sean compatibles con la plataforma.",
      },
    ],
    faqs: [
      {
        q: "¿Cuál es la plataforma más fácil para empezar a vender gratis en Argentina?",
        a: "Depende del rubro. Para productos con alta demanda, ML ofrece alcance inmediato. Para herramientas y repuestos, Madsjeez tiene un catálogo especializado y la carga gratuita de publicaciones facilita el arranque.",
      },
      {
        q: "¿Instagram sirve para vender productos sin una tienda?",
        a: "Sí, pero con limitaciones. Instagram es efectivo para mostrar productos y generar contacto, pero los pedidos y pagos deben coordinarse manualmente. No tiene sistema de carrito de compras nativo equivalente a un marketplace.",
      },
      {
        q: "¿Qué diferencia hay entre publicar gratis y vender sin comisión?",
        a: "Publicar gratis significa no pagar para listar el producto. Vender sin comisión significa que la plataforma no descuenta un porcentaje de cada venta. Algunas plataformas ofrecen lo primero pero no lo segundo.",
      },
    ],
    cta: "Publicá tus productos en Madsjeez",
    sources: [
      {
        name: "Mercado Libre — Costos de vender",
        url: "https://ayuda.mercadolibre.com.ar/ayuda/costos-de-vender_611",
      },
      {
        name: "CACE — Cámara Argentina de Comercio Electrónico",
        url: "https://www.cace.org.ar",
      },
    ],
    relatedSlugs: [
      "200-publicaciones-gratis",
      "vender-online-sin-tantas-comisiones",
      "comercios-fisicos-online",
      "vender-en-varios-canales",
    ],
    publishedAt: "2026-02-01",
  },

  {
    slug: "200-publicaciones-gratis",
    h1: "Cargamos hasta 200 publicaciones gratis para nuevos vendedores",
    seoTitle: "200 publicaciones gratis en Madsjeez: cómo funciona la promoción",
    metaDescription:
      "Los primeros 1000 vendedores aprobados en Madsjeez reciben hasta 200 publicaciones cargadas gratis. Conocé cómo aplicar, qué necesitás y los detalles de la promoción.",
    keywords: [
      "200 publicaciones gratis madsjeez",
      "carga gratuita publicaciones marketplace",
      "publicaciones gratis vendedores",
      "madsjeez promocion vendedores",
      "empezar vender online gratis",
    ],
    intent: "transaccional",
    priority: "alta",
    audience: "Vendedores listos para sumar Madsjeez y que quieren aprovechar la carga gratuita inicial.",
    intro:
      "Madsjeez está incorporando nuevos vendedores con una propuesta concreta: el equipo carga hasta 200 publicaciones sin costo para los primeros 1000 vendedores aprobados.\n\nEsto resuelve el principal obstáculo para abrir un segundo canal de ventas: el tiempo que lleva armar el catálogo inicial. En lugar de pasar horas cargando productos uno por uno, el vendedor provee la información y el equipo se encarga del resto.\n\nLa promoción aplica mientras haya cupos disponibles. La aprobación es requisito previo y depende de la revisión del comercio, rubro y productos.",
    sections: [
      {
        heading: "¿Qué incluye la carga gratuita de 200 publicaciones?",
        content:
          "El servicio de carga incluye:\n\n- **Título optimizado** para cada producto (con palabras clave relevantes para la categoría)\n- **Descripción del producto** redactada con la información que el vendedor provee\n- **Categorización correcta** dentro del catálogo de Madsjeez\n- **Precio** cargado según la lista que el vendedor envía\n- **Fotos** organizadas y asignadas a cada publicación\n\nQué no incluye: la producción de fotos (el vendedor debe tenerlas), la definición del precio (el vendedor lo define), ni la gestión de las publicaciones una vez activas (eso queda a cargo del vendedor).\n\nEl resultado final es una tienda con hasta 200 productos activos, lista para recibir consultas desde el primer día.",
      },
      {
        heading: "¿Quiénes pueden aplicar a la carga gratuita?",
        content:
          "Los requisitos para acceder a la promoción son:\n\n- **Tener un comercio o emprendimiento real** con productos para vender (no se aplica a intermediarios sin stock propio)\n- **Completar el formulario** de registro con datos reales del negocio\n- **Rubro compatible** con el catálogo de Madsjeez (ver categorías habilitadas)\n- **Ser parte de los primeros 1000 aprobados** — la promoción tiene cupo limitado\n\nLa aprobación no es automática. El equipo revisa cada comercio para garantizar la calidad del catálogo y la seriedad del vendedor antes de invertir tiempo en la carga.",
      },
      {
        heading: "El proceso paso a paso",
        content:
          "El camino desde el formulario hasta la tienda activa tiene cinco pasos:\n\n**Paso 1 — Completá el formulario:** Ingresá a /vendedores y completá los datos de tu comercio: nombre, rubro, descripción, forma de envío, y cómo querés que te contacten los compradores.\n\n**Paso 2 — Revisión del equipo:** El equipo de Madsjeez revisa los datos en pocos días hábiles. Si el comercio y el rubro son compatibles, recibís confirmación de aprobación.\n\n**Paso 3 — Enviás la información de tus productos:** Una vez aprobado, enviás la lista de productos con precio, fotos y descripción básica. Puede ser un Excel, una exportación de otro marketplace, o fotos con referencia de precio.\n\n**Paso 4 — El equipo carga las publicaciones:** Con esa información, el equipo arma y carga hasta 200 publicaciones en tu tienda de Madsjeez.\n\n**Paso 5 — Revisás y confirmás:** Antes de que la tienda quede activa públicamente, el vendedor puede revisar las publicaciones y pedir ajustes.",
      },
      {
        heading: "¿Qué tipos de productos acepta Madsjeez?",
        content:
          "Madsjeez acepta una variedad amplia de rubros:\n\n- Herramientas manuales y eléctricas\n- Maquinaria industrial y de construcción\n- Repuestos y accesorios industriales\n- Productos de hogar y bazar\n- Tecnología y electrónica\n- Indumentaria y calzado\n- Deportes y tiempo libre\n- Jardín y exterior\n\nNo se aceptan: productos ilegales o de dudosa procedencia, artículos que infrinjan derechos de propiedad intelectual, productos restringidos por normativa argentina, ni servicios (la plataforma es de productos).\n\nSi tenés dudas sobre si tu rubro es compatible, podés consultar antes de completar el formulario.",
      },
      {
        heading: "Aclaraciones importantes sobre la promoción",
        content:
          "Algunos puntos que conviene tener claros antes de aplicar:\n\n- La carga gratuita aplica para los **primeros 1000 vendedores aprobados**. Una vez lleno el cupo, la carga inicial pasa a ser un servicio pago.\n- **No se garantizan ventas.** La carga gratuita asegura que tus productos estén publicados correctamente, no que vayas a vender desde el primer día.\n- **La aprobación es necesaria.** Completar el formulario no garantiza la aprobación automática. El equipo revisa cada comercio.\n- **El límite es 200 publicaciones** en la carga inicial gratuita. Podés agregar más publicaciones vos mismo o contratar cargas adicionales.\n- El servicio no incluye la creación de fotos ni la definición de precios: eso lo trae el vendedor.",
      },
    ],
    faqs: [
      {
        q: "¿La carga gratuita es permanente o es una promoción por tiempo limitado?",
        a: "Es una promoción por cupo: aplica para los primeros 1000 vendedores aprobados. No tiene fecha de vencimiento específica, pero sí tiene límite de cupos.",
      },
      {
        q: "¿Puedo aplicar si no tengo fotos profesionales de mis productos?",
        a: "Sí. Las fotos pueden ser tomadas con celular, siempre que muestren claramente el producto. No necesitás estudio fotográfico ni equipamiento especial.",
      },
      {
        q: "¿Qué pasa si quiero publicar más de 200 productos?",
        a: "Las 200 publicaciones de la carga gratuita son el punto de partida. Podés agregar más publicaciones vos mismo o consultar con el equipo por servicios adicionales.",
      },
      {
        q: "¿Cuánto tiempo tarda el proceso desde que aplico hasta que la tienda está activa?",
        a: "El proceso completo (formulario, aprobación, envío de info, carga y revisión) toma entre 5 y 10 días hábiles dependiendo del volumen de productos y la completitud de la información enviada.",
      },
    ],
    cta: "Aplicar a la carga gratuita de 200 publicaciones",
    sources: [
      {
        name: "CACE — Cámara Argentina de Comercio Electrónico",
        url: "https://www.cace.org.ar",
      },
    ],
    relatedSlugs: [
      "publicar-productos-gratis",
      "alternativa-a-mercado-libre",
      "comercios-fisicos-online",
      "vender-en-varios-canales",
    ],
    publishedAt: "2026-02-05",
  },

  {
    slug: "reputacion-mercado-libre",
    h1: "Qué hacer si bajó tu reputación como vendedor en Mercado Libre",
    seoTitle: "Reputación Mercado Libre: qué hacer si bajó tu calificación como vendedor",
    metaDescription:
      "Guía para vendedores con reputación baja en Mercado Libre: qué la afecta, cómo mejorarla y cómo proteger tus ventas mientras tanto sumando otro canal.",
    keywords: [
      "reputacion mercado libre vendedor",
      "bajo reputacion ml",
      "calificacion vendedor mercado libre",
      "como mejorar reputacion mercado libre",
      "reputacion naranja ml",
      "reputacion roja mercado libre",
    ],
    intent: "informativa",
    priority: "media",
    audience: "Vendedores con reputación en descenso en ML que buscan recuperarla y proteger sus ventas.",
    intro:
      "La reputación en Mercado Libre es uno de los factores más directos que afectan la visibilidad de tus publicaciones y, por lo tanto, tus ventas. Cuando baja, las publicaciones pierden posicionamiento y el volumen de ventas cae. Entender cómo funciona y qué hacer es el primer paso para revertirlo.\n\nEsta guía explica cómo se calcula la reputación, qué la hace caer, qué acciones concretas se pueden tomar para mejorarla, y cómo proteger las ventas mientras se trabaja en la recuperación.",
    sections: [
      {
        heading: "¿Cómo funciona la reputación de vendedor en Mercado Libre?",
        content:
          "Según la documentación pública de Mercado Libre, la reputación del vendedor se muestra como una escala de colores: verde (excelente), amarillo (buena), naranja (regular) y roja (mala).\n\nEl color depende de tres métricas principales evaluadas en los últimos 60 días de actividad:\n\n**Reclamos:** Porcentaje de ventas que terminaron en reclamo. Un porcentaje alto de reclamos impacta negativamente la reputación.\n\n**Cancelaciones:** Porcentaje de ventas canceladas por el vendedor (no por el comprador). Las cancelaciones sugieren problemas de stock o gestión.\n\n**Tiempos de despacho:** Porcentaje de paquetes despachados dentro del plazo comprometido. Despachar tarde afecta la reputación directamente.\n\nLas tres métricas se ponderan juntas para determinar el color final. La reputación se calcula sobre el período de los últimos 60 días con actividad.",
      },
      {
        heading: "¿Qué hace caer la reputación?",
        content:
          "Las causas más frecuentes de caída de reputación son:\n\n**Reclamos resueltos a favor del comprador:** Cada reclamo que termina con el comprador ganando suma al porcentaje negativo. No todos los reclamos impactan igual: los resueltos sin intervención de ML o por acuerdo directo con el comprador tienen menor impacto.\n\n**Cancelaciones de ventas:** Cancelar ventas porque se quedó sin stock o porque se equivocó en el precio es una de las causas más comunes de reputación baja. ML lo registra como falta de cumplimiento del vendedor.\n\n**Demoras en el despacho:** Comprometerse a despachar en 24hs y hacerlo en 72hs impacta el indicador de tiempo de entrega. En períodos con alto volumen (Hot Sale, Navidad), los retrasos se acumulan rápido.\n\n**Calificaciones negativas de compradores:** Aunque tienen menos peso que los reclamos y cancelaciones, las calificaciones negativas de compradores sí contribuyen a la reputación.",
      },
      {
        heading: "Acciones concretas para mejorar la reputación",
        content:
          "No hay atajos: la reputación mejora gestionando bien las operaciones. Estas son las acciones con mayor impacto:\n\n**Gestioná el stock en tiempo real:** Actualizá el stock disponible en todas las publicaciones regularmente. Si una publicación no tiene stock, pausala. Las cancelaciones por 'sin stock' son evitables.\n\n**Cumplí con los tiempos de despacho:** Si publicás con despacho en 24hs, cumpilí. Si no podés mantener ese ritmo, cambiá a 48hs o 72hs. Es mejor prometer poco y cumplir que prometer mucho y fallar.\n\n**Respondé rápido las preguntas:** La velocidad de respuesta forma parte de la experiencia del comprador. Compradores bien atendidos reclaman menos.\n\n**Resolvé los reclamos antes de la intervención de ML:** Si un comprador abre un reclamo, contactalo directamente y buscá una solución. Un reclamo resuelto por acuerdo directo entre las partes impacta menos en la reputación que uno resuelto con mediación de ML.\n\n**Revisá el motivo de cada cancelación reciente:** Si hay un patrón (errores de stock en ciertas categorías, problemas con ciertos proveedores), identificalo y corregilo en origen.",
      },
      {
        heading: "Cómo proteger tus ventas mientras se recupera la reputación",
        content:
          "La reputación baja impacta la visibilidad de las publicaciones, lo que reduce el tráfico y las ventas. Mientras se trabaja en la recuperación (que lleva semanas de buena gestión), hay formas de proteger los ingresos:\n\n**Activar otro canal de ventas:** Un segundo canal como Madsjeez opera de forma independiente. La reputación en ML no afecta tu presencia ahí.\n\n**Contactar clientes frecuentes directamente:** Si tenés compradores que te compraron antes, podés comunicarte por WhatsApp (si tenés su número) o mostrar tu presencia en otro canal donde sí puedan encontrarte.\n\n**Concentrarte en las publicaciones con mejor reputación:** Si tenés publicaciones con buenas métricas individuales, priorizalas. Las publicaciones individuales también tienen sus propias métricas que afectan el posicionamiento.",
      },
      {
        heading: "Por qué tener otro canal protege tu negocio ante caídas de reputación",
        content:
          "La reputación en un marketplace es un activo frágil: se tarda tiempo en construirla y puede deteriorarse en pocas semanas. Si toda tu operación online depende de ese activo, una caída de reputación se convierte en una caída de ingresos directa.\n\nTener un canal alternativo activo rompe esa dependencia. En Madsjeez, tus publicaciones y tu reputación son independientes de lo que pase en cualquier otro marketplace. Los reclamos o cancelaciones en ML no te afectan ahí.\n\nMuchos vendedores que atravesaron períodos de reputación baja en ML continuaron vendiendo en paralelo a través de otros canales sin interrumpir sus ingresos.",
      },
    ],
    faqs: [
      {
        q: "¿Cuánto tarda en recuperarse la reputación en Mercado Libre?",
        a: "Depende del volumen de ventas y de la gravedad de las métricas. En general, la reputación se evalúa sobre los últimos 60 días de actividad. Con buena gestión sostenida, la mejora puede verse en 4-8 semanas.",
      },
      {
        q: "¿Puedo vender con reputación naranja o roja en ML?",
        a: "Sí, las publicaciones siguen activas. Pero la visibilidad orgánica es menor, lo que reduce el tráfico y las ventas. Las publicaciones no se eliminan, pero sí pierden posiciones en los resultados.",
      },
      {
        q: "¿Un reclamo siempre afecta la reputación?",
        a: "No todos los reclamos tienen el mismo impacto. Los reclamos resueltos directamente entre vendedor y comprador sin intervención de ML tienen menor peso que los que requieren mediación de la plataforma.",
      },
    ],
    cta: "Sumá Madsjeez como canal de respaldo",
    sources: [
      {
        name: "Mercado Libre — Reputación del vendedor",
        url: "https://ayuda.mercadolibre.com.ar/ayuda/reputacion-del-vendedor_1556",
      },
      {
        name: "Mercado Libre — Reclamos",
        url: "https://ayuda.mercadolibre.com.ar/ayuda/reclamos_2887",
      },
    ],
    relatedSlugs: [
      "dejar-de-depender-de-mercado-libre",
      "cuenta-suspendida-marketplace",
      "alternativa-a-mercado-libre",
      "vender-en-varios-canales",
    ],
    publishedAt: "2026-02-10",
  },

  {
    slug: "mercado-envios-alternativas",
    h1: "Alternativas para vender online con logística propia o entrega local",
    seoTitle: "Alternativas a Mercado Envíos: vender online con logística propia en Argentina",
    metaDescription:
      "Opciones para vender online con tu propia logística, entrega local o coordinación directa con el comprador. Cómo elegir la mejor solución para tu negocio.",
    keywords: [
      "alternativas mercado envios",
      "logistica propia vendedor online",
      "entrega local venta online",
      "coordinacion envio comprador vendedor",
      "vender online sin mercado envios",
      "logistica maquinaria industrial argentina",
    ],
    intent: "informativa",
    priority: "media",
    audience: "Vendedores que quieren gestionar su propia logística o que venden productos que no encajan en los envíos estándar.",
    intro:
      "No todos los negocios necesitan la logística integrada de los grandes marketplaces. Para muchos comercios locales, vendedores de maquinaria pesada, o rubros donde la entrega personalizada tiene valor propio, tener control sobre el proceso de envío es más eficiente y más rentable.\n\nEsta guía presenta las opciones de logística disponibles para vendedores argentinos y explica cómo elegir la solución más adecuada para cada tipo de negocio.",
    sections: [
      {
        heading: "¿Por qué algunos vendedores prefieren logística propia?",
        content:
          "Hay varios motivos válidos para preferi gestionar el envío de forma independiente:\n\n**Productos grandes o pesados:** Maquinaria industrial, equipos de construcción, muebles y otros artículos de gran volumen requieren transportistas especializados que la logística estándar de los marketplaces no maneja.\n\n**Entrega en el mismo día:** Los comercios locales que pueden llevar el producto al comprador en horas tienen una ventaja competitiva real frente a cualquier servicio de courier que tarda días.\n\n**Coordinación directa con el cliente:** En ventas B2B o de artículos de alto valor, el vendedor y el comprador prefieren coordinar el envío directamente para asegurar que todo llegue bien.\n\n**Costo:** Para ciertos pesos y destinos, los transportistas propios o regionales pueden ser más económicos que los servicios integrados en las plataformas.",
      },
      {
        heading: "Opciones de logística para vendedores argentinos",
        content:
          "Las alternativas disponibles son:\n\n**Correo Argentino:** Cobertura nacional amplia, tarifas accesibles para paquetes pequeños y medianos. Tiempos de entrega variables según destino.\n\n**OCA:** Buena cobertura en AMBA y principales ciudades. Velocidades y tarifas variables. Amplia red de sucursales para depósito y retiro.\n\n**Andreani:** Cobertura nacional, orientado a empresas. Buenas opciones para volúmenes medianos y altos.\n\n**Mensajería local / moto:** Para entregas dentro de la misma ciudad o zona, puede ser la opción más rápida y económica. Varias apps de mensajería están disponibles.\n\n**Retiro en el local:** El comprador retira directamente. Sin costo de envío, mayor control, y para muchos rubros es la modalidad preferida.\n\n**Transportistas especializados:** Para maquinaria, equipos industriales o artículos de gran volumen. Precio por metro cúbico o tonelada. Se coordina directamente.",
      },
      {
        heading: "Cómo ofrecer entrega local como diferencial",
        content:
          "La cercanía geográfica es una ventaja competitiva real que los marketplaces nacionales no pueden replicar. Un vendedor que ofrece 'entrega en el día en [ciudad]' en su publicación tiene una propuesta de valor que un vendedor de otra provincia no puede igualar.\n\nPara aprovechar este diferencial:\n\n- **Indicalo claramente en el título y descripción:** 'Entrega en el día en Córdoba capital' o 'Retiro disponible en Villa del Parque' son datos que los compradores locales filtran activamente.\n- **Ofrecé un precio diferenciado para entrega local:** Si el envío por correo tiene costo, la entrega local puede ser más económica o gratuita para cerrar la venta.\n- **Coordiná por WhatsApp:** Para entregas locales, la coordinación directa es más eficiente que el sistema de mensajes interno de los marketplaces.",
      },
      {
        heading: "Plataformas que permiten coordinación directa con el comprador",
        content:
          "No todas las plataformas facilitan la coordinación logística directa entre vendedor y comprador:\n\n**Mercado Libre:** Permite publicar con 'envío a acordar', pero esta modalidad tiene menor visibilidad que las publicaciones con Mercado Envíos integrado.\n\n**Madsjeez:** La logística se coordina directamente entre vendedor y comprador. No hay un sistema de envíos propio que presione al vendedor. Podés especificar tu modalidad de envío libremente.\n\n**Redes sociales (Instagram, Facebook):** Todo se coordina directamente. Máxima flexibilidad logística.\n\n**WhatsApp Business:** Canal directo. La logística se acuerda en la misma conversación de venta.",
      },
      {
        heading: "Cómo organizar bien los envíos desde tu tienda",
        content:
          "Una logística bien organizada reduce reclamos y mejora la reputación:\n\n**Definí claramente los plazos:** 'Despachamos dentro de 48hs hábiles' es mejor que 'envío rápido'. La precisión evita malentendidos.\n\n**Embalá bien el producto:** El mal embalaje es la causa más frecuente de reclamos por daños en el transporte. Cada rúbrica tiene sus estándares: herramientas necesitan protección de golpes, prendas necesitan bolsa.\n\n**Usá tracking en todos los envíos:** El número de seguimiento protege al vendedor en caso de disputa. Sin tracking, es muy difícil demostrar que se envió.\n\n**Avisá al comprador cuando despachás:** Un mensaje con el número de tracking apenas despachás reduce enormemente las consultas y mejora la experiencia del comprador.",
      },
    ],
    faqs: [
      {
        q: "¿Es obligatorio usar Mercado Envíos para vender en Mercado Libre?",
        a: "No es técnicamente obligatorio. Podés publicar con 'envío a acordar'. Sin embargo, las publicaciones con Mercado Envíos tienen acceso a filtros de visibilidad que las publicaciones con envío propio no tienen.",
      },
      {
        q: "¿Puedo vender maquinaria industrial con mi logística propia en un marketplace?",
        a: "Sí. En Madsjeez podés especificar tu modalidad de logística libremente: transportista propio, retiro en planta, flete a coordinar, etc. La plataforma está diseñada para el sector industrial y entiende esas modalidades.",
      },
      {
        q: "¿Qué transportista conviene para envíos nacionales de herramientas?",
        a: "Depende del peso, tamaño y destino. Correo Argentino y OCA tienen buena cobertura nacional. Para envíos regulares y volúmenes medios, Andreani puede ofrecer mejores condiciones comerciales. Conviene cotizar en más de uno.",
      },
    ],
    cta: "Vendé con tu logística en Madsjeez",
    sources: [
      {
        name: "CACE — Cámara Argentina de Comercio Electrónico",
        url: "https://www.cace.org.ar",
      },
    ],
    relatedSlugs: [
      "alternativa-a-mercado-libre",
      "dejar-de-depender-de-mercado-libre",
      "vender-en-varios-canales",
      "comercios-fisicos-online",
    ],
    publishedAt: "2026-02-15",
  },

  {
    slug: "cuenta-suspendida-marketplace",
    h1: "Cómo proteger tus ventas si una cuenta de marketplace se limita o suspende",
    seoTitle: "Cuenta suspendida en marketplace: cómo proteger tus ventas",
    metaDescription:
      "Si tu cuenta en un marketplace fue suspendida o limitada, esta guía explica cómo proteger tus ventas, qué hacer y cómo construir canales alternativos.",
    keywords: [
      "cuenta suspendida marketplace",
      "me suspendieron cuenta mercado libre",
      "que hacer cuenta suspendida",
      "proteger ventas suspension cuenta",
      "canal alternativo suspension",
      "diversificar ventas suspension marketplace",
    ],
    intent: "informativa",
    priority: "alta",
    audience: "Vendedores con cuentas suspendidas o que quieren prevenir ese escenario antes de que ocurra.",
    intro:
      "Una suspensión de cuenta en un marketplace puede paralizar tus ventas de un día para el otro. La mejor defensa no es reaccionar cuando pasa, sino tener más de un canal activo antes de que ocurra.\n\nEsta guía explica por qué suceden las suspensiones, qué pasos seguir si ya ocurrió, y cómo la diversificación de canales es la estrategia más efectiva para proteger el negocio.",
    sections: [
      {
        heading: "¿Por qué suspenden cuentas en los marketplaces?",
        content:
          "Las suspensiones de cuenta en marketplaces tienen causas variadas. Las más frecuentes son:\n\n**Acumulación de reclamos:** Cuando el porcentaje de reclamos supera cierto umbral, los sistemas automáticos de la plataforma pueden limitar o suspender la cuenta.\n\n**Violaciones a los términos de uso:** Publicar productos no permitidos, usar imágenes sin derechos, o prácticas que van contra las políticas de la plataforma.\n\n**Inconsistencias en los datos:** Discrepancias entre la información registrada en la cuenta y los datos de las transacciones.\n\n**Inactividad prolongada:** Algunas plataformas pueden limitar cuentas que no tuvieron actividad por tiempo extendido.\n\n**Problemas de pago:** Disputas no resueltas con la plataforma por cobros o reembolsos.\n\nEstas son las causas más documentadas. Cada plataforma tiene sus propios criterios y comunica el motivo de la suspensión en la notificación que envía al vendedor.",
      },
      {
        heading: "¿Qué hacer si te suspendieron o limitaron la cuenta?",
        content:
          "El proceso recomendado ante una suspensión es:\n\n**1. Revisá el email de notificación:** La plataforma generalmente envía un correo con el motivo de la suspensión. Ese correo es el punto de partida para cualquier acción.\n\n**2. Ingresá a la plataforma para ver el detalle:** Muchas veces hay información adicional en el panel de la cuenta que no llega por email.\n\n**3. Contactá el soporte oficial:** Usá los canales oficiales (chat, formulario, teléfono si está disponible). No intentes solucionar por fuera de los canales oficiales.\n\n**4. Reuní documentación:** Si la suspensión requiere verificación de identidad o documentación del comercio, tenerla disponible acelera el proceso.\n\n**5. Mientras esperás, activá canales alternativos:** El tiempo de resolución puede ser incierto. No detengas tus ventas esperando: activá otros canales en paralelo.\n\n**Aclaración importante:** Este artículo no contiene asesoramiento legal ni garantiza la recuperación de cuentas. Ante dudas legales o situaciones complejas, consultá con un profesional.",
      },
      {
        heading: "La estrategia que te protege: diversificación de canales",
        content:
          "La experiencia de vendedores con años en el comercio online lo confirma: los que menos sufren ante una suspensión son los que ya tienen otros canales activos.\n\nLa diversificación no es una solución reactiva a una crisis: es una estrategia preventiva que hace que cualquier interrupción en un canal no detenga el negocio completo.\n\nEn la práctica, esto significa tener al menos dos canales donde tus productos estén activos y donde los compradores puedan encontrarte. Si uno falla, el otro sigue operando.",
      },
      {
        heading: "Cómo crear un canal adicional rápidamente",
        content:
          "Si ya ocurrió una suspensión y necesitás seguir vendiendo mientras se resuelve, el camino más rápido es:\n\n**Opción A — Marketplace alternativo:** Abrir una tienda en Madsjeez u otro marketplace. Con la carga gratuita de publicaciones de Madsjeez para los primeros 1000 vendedores, podés tener un catálogo activo en días.\n\n**Opción B — Redes sociales:** Publicar el catálogo en Instagram o Facebook Marketplace. No tiene estructura de marketplace, pero permite empezar a recibir consultas rápidamente.\n\n**Opción C — WhatsApp Business:** Si tenés contactos de compradores anteriores, activar WhatsApp Business con catálogo permite retomar ventas con clientes conocidos.\n\nLa combinación de las tres opciones maximiza la cobertura, pero para arrancar rápido, el marketplace alternativo es la opción más estructurada.",
      },
      {
        heading: "Por qué conviene construir el canal alternativo ANTES de que pase algo",
        content:
          "La diferencia entre un vendedor que tiene su tienda en Madsjeez activa desde hace meses y uno que la abre en el momento de una crisis es enorme.\n\nEl que la tiene activa de antemano ya tiene publicaciones indexadas, ya tiene las fotos y descripciones armadas, y ya sabe cómo opera la plataforma. En el momento de una crisis, solo tiene que redirigir su atención.\n\nEl que la abre en crisis está aprendiendo la plataforma, armando las publicaciones desde cero y gestionando la suspensión al mismo tiempo. El estrés y la pérdida de tiempo son considerablemente mayores.\n\nAbrir el segundo canal cuando las cosas andan bien es la preparación más valiosa que puede hacer un vendedor online.",
      },
    ],
    faqs: [
      {
        q: "¿Puedo abrir una tienda en Madsjeez mientras espero resolver una suspensión en otro marketplace?",
        a: "Sí. Madsjeez es una plataforma independiente. Lo que pase en otros marketplaces no afecta tu capacidad de operar en Madsjeez.",
      },
      {
        q: "¿Cuánto tarda el proceso de apelación en un marketplace?",
        a: "Los tiempos varían mucho según el marketplace y la complejidad de la suspensión. Algunos casos se resuelven en 48-72hs; otros pueden tomar semanas. Por eso es importante no depender de un solo canal.",
      },
      {
        q: "¿Madsjeez puede suspender mi cuenta también?",
        a: "Madsjeez tiene sus propias políticas de uso. Mientras operes dentro de ellas (no publicar productos prohibidos, información real, cumplir con los pedidos), tu cuenta está protegida. Las políticas están disponibles en la plataforma.",
      },
    ],
    cta: "Abrí tu canal en Madsjeez antes de que lo necesites",
    sources: [
      {
        name: "Mercado Libre — Reputación del vendedor",
        url: "https://ayuda.mercadolibre.com.ar/ayuda/reputacion-del-vendedor_1556",
      },
      {
        name: "Mercado Libre — Reclamos",
        url: "https://ayuda.mercadolibre.com.ar/ayuda/reclamos_2887",
      },
    ],
    relatedSlugs: [
      "dejar-de-depender-de-mercado-libre",
      "reputacion-mercado-libre",
      "alternativa-a-mercado-libre",
      "vender-en-varios-canales",
    ],
    publishedAt: "2026-02-20",
  },

  {
    slug: "vender-en-varios-canales",
    h1: "Cómo vender en varios canales sin complicarte",
    seoTitle: "Venta multicanal para emprendedores argentinos: guía práctica",
    metaDescription:
      "Cómo vender en Mercado Libre, Madsjeez, Instagram y WhatsApp al mismo tiempo sin duplicar el trabajo. Estrategia multicanal para comercios y emprendedores argentinos.",
    keywords: [
      "venta multicanal argentina",
      "vender en varios canales",
      "multicanal emprendedor",
      "como gestionar varios marketplaces",
      "vender ml instagram whatsapp",
      "estrategia multicanal pymes",
    ],
    intent: "informativa",
    priority: "alta",
    audience: "Vendedores que ya operan en un canal y quieren sumar más sin complicarse la operación.",
    intro:
      "Vender en varios canales a la vez parece complicado, pero con la estrategia correcta es más manejable de lo que parece. El principal temor es duplicar el trabajo: cargar los productos de vuelta, gestionar pedidos de varios lugares al mismo tiempo, confundirse con el stock.\n\nEsa complejidad existe si se hace sin organización. Pero si se arranca con una estructura simple y se crece gradualmente, la venta multicanal pasa a ser una ventaja, no una carga.\n\nEsta guía explica cómo hacerlo sin que se convierta en un segundo trabajo.",
    sections: [
      {
        heading: "¿Qué es la venta multicanal?",
        content:
          "La venta multicanal es simplemente tener los productos disponibles para comprar en más de un lugar al mismo tiempo. No requiere tecnología sofisticada: un comercio que vende en ML y también atiende por WhatsApp ya está haciendo venta multicanal.\n\nLas grandes empresas siempre usaron varios canales: local físico, catálogo, llamadas, web. La versión actual es: marketplace generalista, marketplace especializado, redes sociales, tienda propia, WhatsApp.\n\nLa clave no es estar en todos los canales, sino en los que más sentido tienen para tu rubro y tu capacidad operativa.",
      },
      {
        heading: "¿Cuántos canales puede manejar un vendedor solo?",
        content:
          "La respuesta honesta: depende del volumen de ventas y de la organización. Pero como regla general:\n\n- **1 canal:** Lo máximo que permite el foco total. Ideal para quien recién arranca.\n- **2 canales:** El punto de equilibrio ideal para la mayoría de los vendedores independientes. Un canal principal + uno de respaldo/crecimiento.\n- **3 canales:** Manejable con herramientas básicas de organización (planilla de stock, alertas de pedidos).\n- **4+ canales:** Requiere algún tipo de software de gestión (ERP básico, herramienta de sincronización de stock) o un equipo.\n\nPara la mayoría de los emprendedores y comercios medianos, la combinación de 2 marketplaces + WhatsApp es la más manejable sin inversión en software.",
      },
      {
        heading: "Cómo sincronizar el stock entre canales",
        content:
          "El mayor desafío de vender en varios lugares es el stock. Si vendés la misma unidad en ML y en Madsjeez al mismo tiempo, tenés un problema.\n\n**Métodos según el volumen:**\n\n**Planilla de control (bajo volumen):** Una planilla Excel o Google Sheets actualizada manualmente. Cada vez que cerrás una venta en cualquier canal, actualizás el stock. Funciona para volúmenes bajos (menos de 10-15 ventas por día).\n\n**Actualización diaria (volumen medio):** Al iniciar el día, revisás el stock real y actualizás todas las plataformas. Al cierre, lo mismo. Asegurás que al menos una vez por día todos los canales tienen el stock correcto.\n\n**Stock conservador:** Publicar menos unidades de las que tenés. Si tenés 10 unidades, publicás 7 en ML y 7 en Madsjeez. Tenés un buffer de 3 para evitar sobreventas.\n\n**Software de sincronización (alto volumen):** Herramientas específicas para sincronizar stock entre plataformas en tiempo real. Inversión que justifica con volumen alto.",
      },
      {
        heading: "Canales recomendados por tipo de negocio",
        content:
          "Las combinaciones más efectivas según el rubro:\n\n**Ferretería / herramientas / repuestos:** ML + Madsjeez. ML da el alcance masivo, Madsjeez da el segmento especializado que busca herramientas específicas.\n\n**Indumentaria y calzado:** Instagram + ML. Instagram genera descubrimiento visual, ML cierra la venta con la confianza del marketplace.\n\n**Mayoristas:** Madsjeez + contacto directo. Los compradores B2B prefieren canal especializado y contacto directo para volúmenes.\n\n**Bazar y hogar:** Instagram + ML + WhatsApp. Mucho de las ventas de bazar se cierran por consulta directa antes de la compra.\n\n**Repuestos / autopartes:** Madsjeez + ML + grupos de Facebook de la especialidad. La comunidad de especialistas es activa en Facebook.",
      },
      {
        heading: "Paso a paso para abrir tu segundo canal en Madsjeez",
        content:
          "Si ya vendés en ML y querés sumar Madsjeez:\n\n**1. Completá el formulario en /vendedores:** Datos de tu comercio, rubro y productos que querés publicar.\n\n**2. Esperá la aprobación:** El equipo de Madsjeez revisa el comercio. En pocos días hábiles recibís la confirmación.\n\n**3. Enviás la lista de productos:** Si ya tenés catálogo en ML, podés exportarlo o simplemente enviarlo como referencia.\n\n**4. El equipo carga hasta 200 publicaciones gratis:** Para los primeros 1000 vendedores aprobados, la carga inicial no tiene costo.\n\n**5. Revisás y confirmás:** Revisás las publicaciones antes de que queden activas y pedís ajustes si hacen falta.\n\n**6. Definís tu rutina de gestión multicanal:** Cómo vas a controlar el stock, cómo vas a responder consultas de ambos canales, cómo vas a procesar los pedidos.",
      },
    ],
    checklist: [
      "Tenés claridad sobre cuánto stock tenés disponible en este momento",
      "Sabés cuántas ventas por día podés gestionar cómodamente",
      "Tenés una forma de actualizar el stock en todos los canales regularmente",
      "Tus fotos y descripciones están listas para usarse en otra plataforma",
      "Tenés definido cómo vas a coordinar los envíos de los distintos canales",
      "Sabés cuánto tiempo vas a dedicar a responder consultas de cada canal",
      "Tenés claro cuál es tu canal principal y cuál es el secundario",
      "Evaluaste si tu volumen justifica herramientas de sincronización de stock",
    ],
    faqs: [
      {
        q: "¿Es obligatorio usar el mismo precio en todos los canales?",
        a: "No. Podés tener precios diferentes según el canal. Es una práctica común ajustar el precio según los costos de cada plataforma.",
      },
      {
        q: "¿Qué pasa si se vende el último stock en dos canales al mismo tiempo?",
        a: "Es el riesgo principal del multicanal sin sincronización. La prevención es publicar con stock conservador o actualizar el stock con alta frecuencia. Si ocurre, cancelar en uno de los canales impacta la reputación, por eso la prevención es mejor.",
      },
      {
        q: "¿Madsjeez tiene alguna herramienta para sincronizar stock con ML?",
        a: "Actualmente la sincronización de stock entre plataformas se gestiona manualmente o con herramientas de terceros. El equipo de Madsjeez puede orientarte sobre las opciones disponibles.",
      },
    ],
    cta: "Sumá Madsjeez como tu segundo canal",
    sources: [
      {
        name: "CACE — Cámara Argentina de Comercio Electrónico",
        url: "https://www.cace.org.ar",
      },
    ],
    relatedSlugs: [
      "alternativa-a-mercado-libre",
      "dejar-de-depender-de-mercado-libre",
      "comercios-fisicos-online",
      "200-publicaciones-gratis",
    ],
    publishedAt: "2026-02-25",
  },

  {
    slug: "comercios-fisicos-online",
    h1: "Cómo vender online si tenés un comercio físico",
    seoTitle: "Digitalizar tu comercio: cómo vender online teniendo local físico en Argentina",
    metaDescription:
      "Guía para comercios físicos que quieren vender online: ferretería, bazar, indumentaria, repuestos. Paso a paso para llevar tu local a internet sin complicaciones.",
    keywords: [
      "comercio fisico vender online",
      "llevar local a internet",
      "ferreteria vender online",
      "digitalizar comercio argentina",
      "local fisico ecommerce",
      "vender online teniendo local",
    ],
    intent: "informativa",
    priority: "alta",
    audience: "Dueños de comercios físicos que quieren sumar ventas digitales sin abandonar su modelo actual.",
    intro:
      "Tener un local físico es una ventaja, no un obstáculo para vender online. El stock ya existe, el comercio ya está funcionando, y la experiencia en el rubro ya está acumulada. Lo que falta es trasladar eso al canal digital.\n\nMuchos dueños de locales creen que para vender online necesitan invertir en tecnología compleja, fotógrafos profesionales o conocimientos de diseño web. En la realidad, los primeros pasos son mucho más simples.\n\nEsta guía muestra cómo un comercio físico puede empezar a vender online con lo que ya tiene.",
    sections: [
      {
        heading: "¿Por qué un local físico debe estar también en internet?",
        content:
          "El comportamiento de compra cambió. Hoy, una parte significativa de los compradores busca online antes de ir a un local, o directamente compra sin ir al local.\n\nSi tu negocio no aparece en internet cuando alguien busca lo que vendés, esa venta se la lleva alguien que sí está online.\n\nEstar en internet no reemplaza el local: lo amplifica. El local sigue siendo el centro de tu operación, el punto de retiro, el lugar donde el cliente puede ver el producto en persona. La presencia online extiende el alcance del negocio más allá de las cuadras de tu barrio o ciudad.\n\nY para muchos rubros —ferretería, repuestos, maquinaria, bazar— la búsqueda online tiene mucho volumen. Los compradores buscan 'tornillos 5mm rosca fina' en Google y en los marketplaces antes de llamar a cualquier ferretería.",
      },
      {
        heading: "Primeros pasos para llevar tu comercio a internet",
        content:
          "El proceso más simple para empezar tiene cinco pasos:\n\n**Paso 1 — Tomá fotos de tus productos:** Con el celular, con luz natural, sobre un fondo claro. No hace falta estudio ni cámara profesional. Enfocate primero en los 20-30 productos que más vendés.\n\n**Paso 2 — Hacé una lista de precios:** Un Excel simple con nombre del producto, precio, y stock disponible. Esta lista es la base para cualquier plataforma que elijas.\n\n**Paso 3 — Definí cómo vas a enviar:** Tenés tres opciones básicas: correo (Correo Argentino, OCA, Andreani), entrega local con moto o en persona, o retiro en el local. Podés ofrecer las tres y dejar que el comprador elija.\n\n**Paso 4 — Elegí una plataforma:** Para un comercio físico que empieza, Madsjeez es una opción concreta: los primeros 1000 vendedores aprobados reciben la carga gratuita de hasta 200 publicaciones.\n\n**Paso 5 — Publicá y respondé:** Una vez activas las publicaciones, la clave es responder rápido a las consultas. La velocidad de respuesta es uno de los factores más valorados por los compradores online.",
      },
      {
        heading: "¿Cuánto trabajo extra implica vender online?",
        content:
          "Siendo honestos: implica trabajo adicional, pero los primeros pasos son menores de lo que muchos esperan.\n\nLo que agrega la venta online que no estaba antes:\n- Responder consultas de compradores (5-15 minutos por día si el volumen es bajo)\n- Actualizar precios y stock cuando cambian\n- Preparar los paquetes para envío (si usás correo)\n- Seguimiento de pedidos pendientes\n\nLo que ya existía y se aprovecha:\n- El stock (ya estaba)\n- El conocimiento del producto (ya estaba)\n- La operación de recepción de pagos (ya estaba, se extiende a pagos online)\n- La logística de entrega (se adapta, no se crea desde cero)\n\nEl mayor trabajo inicial es la carga de publicaciones. Con Madsjeez, eso está cubierto en la carga gratuita de hasta 200 productos para los primeros 1000 vendedores aprobados.",
      },
      {
        heading: "Qué plataforma elegir según tu tipo de negocio",
        content:
          "Las recomendaciones específicas por rubro:\n\n**Ferretería:** Madsjeez + ML. Los compradores de ferretería buscan activamente en marketplaces especializados para productos técnicos. ML da alcance masivo para los productos de consumo más frecuente.\n\n**Bazar y hogar:** ML + Instagram. El visual importa mucho en bazar. Instagram muestra los productos en contexto. ML cierra la venta con infraestructura de pago.\n\n**Repuestos automotor e industrial:** Madsjeez + grupos de Facebook del rubro + ML. Los compradores de repuestos son activos en comunidades especializadas.\n\n**Indumentaria:** Instagram + ML + WhatsApp. La moda se descubre visualmente en IG, se compra con confianza en ML, se consulta por WhatsApp.\n\n**Maquinaria:** Madsjeez es la opción más específica. Los compradores de maquinaria buscan canales especializados donde confiar en el vendedor.",
      },
      {
        heading: "Cómo Madsjeez facilita el ingreso de comercios físicos",
        content:
          "La propuesta de Madsjeez para comercios físicos que quieren empezar a vender online es concreta:\n\n- **Carga gratuita de hasta 200 publicaciones** para los primeros 1000 vendedores aprobados. El equipo arma las publicaciones con la información que el comercio provee.\n- **Sin necesidad de conocimientos técnicos:** El comercio solo necesita tener fotos y precios. El armado de la tienda lo hace el equipo.\n- **Sin comisión por venta:** El modelo es suscripción fija, que permite planificar el costo sin sorpresas.\n- **Canal de coordincación directa con el comprador:** En Madsjeez podés acordar el envío, el retiro en el local o cualquier modalidad que mejor se adapte a tu operación.",
      },
    ],
    checklist: [
      "Tenés al menos 20 productos fotografiados con celular",
      "Tenés una lista de precios actualizada de tus productos",
      "Sabés cómo vas a enviar (correo, entrega local, retiro en local)",
      "Tenés una cuenta de Mercado Pago o similar para recibir pagos online",
      "Podés dedicar al menos 15-20 minutos por día a responder consultas online",
      "Tenés claro cuáles son tus 20 productos más vendidos para publicar primero",
      "Sabés cuánto stock disponible tenés de cada producto",
      "Tenés forma de empaquetar productos para envío (cajas, cinta, papel burbuja)",
      "Definiste cómo vas a manejar devoluciones si un comprador no queda conforme",
      "Tenés alguien (vos mismo o empleado) que pueda gestionar los pedidos online",
    ],
    faqs: [
      {
        q: "¿Necesito saber programación o diseño para vender online?",
        a: "No. Con Madsjeez, el equipo se encarga de la carga inicial de publicaciones. Solo necesitás tener fotos y precios de tus productos.",
      },
      {
        q: "¿Puedo ofrecer retiro en el local como opción de envío?",
        a: "Sí. En Madsjeez podés especificar retiro en el local como modalidad. Muchos compradores locales lo prefieren para ahorrarse el costo de envío.",
      },
      {
        q: "¿Qué pasa si no puedo gestionar el volumen de pedidos online?",
        a: "El volumen de pedidos online crece gradualmente. Es muy raro que un comercio que recién empieza online tenga más pedidos de los que puede manejar. El crecimiento suele dar tiempo para adaptarse.",
      },
    ],
    cta: "Llevá tu comercio a internet con Madsjeez",
    sources: [
      {
        name: "CACE — Cámara Argentina de Comercio Electrónico",
        url: "https://www.cace.org.ar",
      },
      {
        name: "Ley 25.326 — Protección de Datos Personales",
        url: "https://servicios.infoleg.gob.ar/infolegInternet/anexos/60000-64999/64790/texact.htm",
      },
    ],
    relatedSlugs: [
      "200-publicaciones-gratis",
      "publicar-productos-gratis",
      "vender-en-varios-canales",
      "alternativa-a-mercado-libre",
    ],
    publishedAt: "2026-03-01",
  },
]

export function getVendedorSeoPage(slug: string): VendedorSeoPage | undefined {
  return VENDEDORES_SEO_PAGES.find((p) => p.slug === slug)
}

export function getAllVendedoresSeoSlugs(): string[] {
  return VENDEDORES_SEO_PAGES.map((p) => p.slug)
}
