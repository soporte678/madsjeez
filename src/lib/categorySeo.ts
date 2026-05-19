type CategoryBasics = {
  name: string;
  slug: string;
  description: string | null;
  parentName?: string | null;
};

type CategorySeoTheme = {
  audience: string;
  buyerIntent: string;
  sellerIntent: string;
  accent: string;
  surface: string;
  glow: string;
  heroLines: string[];
  sellerBenefits: string[];
  buyerBenefits: string[];
  roadmap: string[];
  faq: Array<{ question: string; answer: string }>;
};

const themeBySlug: Record<string, CategorySeoTheme> = {
  "accesorios-para-vehiculos": {
    audience: "conductores, talleres, negocios de repuestos y distribuidores",
    buyerIntent: "comparar repuestos, accesorios y soluciones para el vehiculo con mas claridad y velocidad",
    sellerIntent: "publicar catalogos tecnicos, ganar visibilidad organica y vender con una operacion mas ordenada",
    accent: "#2563eb",
    surface: "from-[#eff6ff] via-white to-[#eef2ff]",
    glow: "from-[#2563eb] to-[#0f172a]",
    heroLines: [
      "Repuestos, accesorios y herramientas para mover inventario con confianza.",
      "Una categoria pensada para captar trafico de alta intencion y ayudar a talleres, casas de repuestos y marcas a vender mejor.",
    ],
    sellerBenefits: [
      "Landing preparada para consultas de alto valor como repuestos, accesorios y piezas especificas.",
      "Mayor profundidad SEO entre categoria principal, subcategorias y productos relacionados.",
      "Espacio para captar compradores listos para comparar precio, stock y envio.",
    ],
    buyerBenefits: [
      "Mas orden para encontrar compatibilidades, modelos y ofertas activas.",
      "Acceso rapido a subcategorias y publicaciones recientes.",
      "Mejor experiencia para revisar precios y opciones de envio sin perder contexto.",
    ],
    roadmap: [
      "filtros por marca, modelo y año",
      "comparador de piezas equivalentes",
      "importacion de catalogos de repuestos por vendedor",
    ],
    faq: [
      {
        question: "Que puede vender un comercio dentro de Accesorios para Vehiculos?",
        answer: "Desde repuestos y consumibles hasta accesorios, herramientas y kits para autos, motos y vehiculos comerciales, siempre que cumplan las politicas del marketplace.",
      },
      {
        question: "Como ayuda esta landing a captar trafico?",
        answer: "Agrupa contenido optimizado, enlaces internos y catalogo real para responder busquedas transaccionales y comerciales de Argentina con una pagina relevante y viva.",
      },
    ],
  },
  agro: {
    audience: "productores, distribuidores, ferreterias rurales y proveedores del campo",
    buyerIntent: "encontrar insumos, repuestos y soluciones para la produccion sin perder tiempo",
    sellerIntent: "transformar catalogos tecnicos en una vitrina digital preparada para captar demanda regional",
    accent: "#16a34a",
    surface: "from-[#ecfdf5] via-white to-[#f0fdf4]",
    glow: "from-[#16a34a] to-[#14532d]",
    heroLines: [
      "Una categoria pensada para el ritmo real del agro argentino.",
      "Con contenido orientado a insumos, maquinaria, riego, ferreteria rural y equipamiento de trabajo.",
    ],
    sellerBenefits: [
      "Mas visibilidad para proveedores especializados.",
      "Contenido comercial preparado para atraer consultas organicas.",
      "Ruta clara entre categoria, subcategorias y publicaciones.",
    ],
    buyerBenefits: [
      "Mejor navegacion para encontrar insumos por necesidad concreta.",
      "Resultados conectados con productos y subrubros relevantes.",
      "Pagina orientada a descubrir oferta real y no solo una lista plana.",
    ],
    roadmap: [
      "filtros por uso, temporada y capacidad",
      "landing por zona o actividad",
      "bloques de contenido tecnico para productos complejos",
    ],
    faq: [
      {
        question: "Esta categoria sirve solo para maquinaria?",
        answer: "No. Tambien puede incluir riego, insumos, herramientas, repuestos, equipamiento y productos vinculados al trabajo agropecuario.",
      },
      {
        question: "Por que conviene a un vendedor del agro tener una landing SEO?",
        answer: "Porque muchas busquedas del rubro son especificas y de alta intencion. Una landing bien armada mejora el alcance organico y la calidad del trafico.",
      },
    ],
  },
  herramientas: {
    audience: "ferreterias, talleres, profesionales de obra y compradores tecnicos",
    buyerIntent: "encontrar herramientas, insumos y equipos con rapidez, precio claro y oferta ordenada",
    sellerIntent: "convertir una ferreteria o catalogo tecnico en una vidriera escalable para captar clientes nuevos",
    accent: "#ea580c",
    surface: "from-[#fff7ed] via-white to-[#fffbeb]",
    glow: "from-[#ea580c] to-[#7c2d12]",
    heroLines: [
      "Herramientas para vender con mas precision y comprar con menos friccion.",
      "Esta landing mezcla SEO, navegacion clara y catalogo real para atraer trafico comercial y profesional.",
    ],
    sellerBenefits: [
      "Contenido enfocado en ferreteria, taller, construccion y trabajo tecnico.",
      "Mayor oportunidad de captar consultas organicas desde Google.",
      "Mas puntos de entrada internos hacia subcategorias y productos destacados.",
    ],
    buyerBenefits: [
      "Acceso rapido a novedades, subrubros y publicaciones activas.",
      "Mejor lectura del catalogo para tareas, obras y compras recurrentes.",
      "Busqueda conectada con filtros utiles para conversion.",
    ],
    roadmap: [
      "filtros por potencia, medida y aplicacion",
      "colecciones por oficio y tarea",
      "ranking de herramientas mas vendidas por rubro",
    ],
    faq: [
      {
        question: "Esta landing ayuda a una ferreteria a posicionarse mejor?",
        answer: "Si. La categoria queda reforzada con contenido de contexto, enlaces internos y rutas de navegacion que mejoran indexacion y descubrimiento.",
      },
      {
        question: "Que tipo de comprador atrae?",
        answer: "Tanto consumidor final como profesionales que llegan buscando herramientas especificas, insumos o publicaciones listas para comparar.",
      },
    ],
  },
};

const defaultTheme: CategorySeoTheme = {
  audience: "compradores con intencion real, comercios, marcas y vendedores especializados",
  buyerIntent: "descubrir oferta, comparar publicaciones y resolver la compra con mas claridad",
  sellerIntent: "publicar catalogo, ganar alcance organico y convertir visitas en ventas",
  accent: "#3483fa",
  surface: "from-[#eff6ff] via-white to-[#f8fafc]",
  glow: "from-[#3483fa] to-[#0f172a]",
  heroLines: [
    "Una landing de categoria preparada para atraer trafico organico y mover conversion.",
    "Contenido comercial, enlaces internos y catalogo real trabajando juntos para captar compradores y vendedores de Argentina.",
  ],
  sellerBenefits: [
    "Mejor superficie SEO para consultas comerciales y transaccionales.",
    "Mas oportunidades de entrada desde categoria, subcategorias y resultados internos.",
    "Una pagina de categoria preparada para acompañar el crecimiento del marketplace.",
  ],
  buyerBenefits: [
    "Contexto claro antes de entrar al catalogo.",
    "Rutas rapidas hacia subcategorias, resultados y publicaciones nuevas.",
    "Mas señales para encontrar oferta relevante sin navegar a ciegas.",
  ],
  roadmap: [
    "bloques comparativos por subrubro",
    "contenido editorial conectado con productos",
    "modulos de reputacion y conversion por categoria",
  ],
  faq: [
    {
      question: "Por que esta categoria tiene una landing dedicada?",
      answer: "Porque ayuda a posicionar mejor el marketplace para busquedas organicas y al mismo tiempo mejora la experiencia de compra y publicacion.",
    },
    {
      question: "Como ayuda a los vendedores?",
      answer: "Les da una pagina mas completa para captar trafico, conectar subcategorias y enviar usuarios al catalogo con mas contexto e intencion.",
    },
  ],
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function inferTheme(category: CategoryBasics): CategorySeoTheme {
  const directTheme = themeBySlug[category.slug];
  if (directTheme) return directTheme;

  const name = normalize(category.name);
  const parent = normalize(category.parentName || "");

  if (name.includes("herramient") || parent.includes("herramient")) return themeBySlug.herramientas;
  if (name.includes("agro") || parent.includes("agro") || name.includes("riego")) return themeBySlug.agro;
  if (name.includes("vehicul") || name.includes("repuesto") || parent.includes("vehicul")) {
    return themeBySlug["accesorios-para-vehiculos"];
  }

  return defaultTheme;
}

function buildKeywords(category: CategoryBasics) {
  const base = [
    category.name,
    `comprar ${category.name} en argentina`,
    `vender ${category.name} online`,
    `${category.name} marketplace`,
    `tienda de ${category.name}`,
    `publicar ${category.name}`,
  ];

  if (category.parentName) {
    base.push(`${category.parentName} ${category.name}`);
  }

  return base;
}

export function buildCategorySeo(category: CategoryBasics, subcategories: Array<{ name: string }>) {
  const theme = inferTheme(category);
  const keywords = buildKeywords(category);
  const categoryLabel = category.parentName ? `${category.parentName} - ${category.name}` : category.name;
  const heroTitle = `Compra y vende ${category.name} en MADSJEEZ`;
  const heroDescription =
    category.description ||
    `${heroTitle}. Descubre publicaciones activas, subcategorias relacionadas y una landing optimizada para atraer compradores y vendedores en Argentina.`;
  const marketHighlights = [
    `${category.name} para ${theme.audience}`,
    `Pensada para ${theme.buyerIntent}`,
    `Preparada para ${theme.sellerIntent}`,
  ];

  const faq = [
    ...theme.faq,
    {
      question: `Que subcategorias se pueden explorar dentro de ${category.name}?`,
      answer:
        subcategories.length > 0
          ? `Puedes navegar por ${subcategories.slice(0, 6).map((item) => item.name).join(", ")} y otras secciones relacionadas desde la misma landing.`
          : `La categoria se usa como punto de entrada para explorar publicaciones activas, resultados de busqueda y futuras expansiones del catalogo.`,
    },
  ];

  return {
    theme,
    keywords,
    categoryLabel,
    heroTitle,
    heroDescription,
    marketHighlights,
    faq,
    seoTitle: `${category.name} en Argentina | Compra, vende y publica en MADSJEEZ`,
    seoDescription: `${heroDescription} Explora ${category.name}, compara publicaciones y suma tu negocio al marketplace.`,
  };
}
