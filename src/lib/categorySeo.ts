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
  searchIntents: string[];
  sellerAngles: string[];
  faq: Array<{ question: string; answer: string }>;
};

type CategorySeoResult = {
  theme: CategorySeoTheme;
  keywords: string[];
  categoryLabel: string;
  heroTitle: string;
  heroDescription: string;
  marketHighlights: string[];
  faq: Array<{ question: string; answer: string }>;
  seoTitle: string;
  seoDescription: string;
  searchIntents: string[];
  sellerAngles: string[];
  editorialIntro: string;
  editorialClosing: string;
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
      "filtros por marca, modelo y ano",
      "comparador de piezas equivalentes",
      "importacion de catalogos de repuestos por vendedor",
    ],
    searchIntents: [
      "repuestos para autos y camionetas",
      "accesorios para motos online",
      "luces, cubiertas y audio para vehiculos",
    ],
    sellerAngles: [
      "casas de repuestos",
      "talleres mecanicos",
      "marcas de accesorios y audio",
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
    searchIntents: [
      "insumos para campo y produccion",
      "maquinaria agricola y riego",
      "herramientas rurales y sanidad animal",
    ],
    sellerAngles: [
      "proveedores del agro",
      "distribuidores regionales",
      "negocios de riego y maquinaria",
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
  "alimentos-y-bebidas": {
    audience: "almacenes, distribuidores, marcas, dieteticas y compradores recurrentes",
    buyerIntent: "descubrir productos, comparar precios y encontrar surtido por tipo de consumo",
    sellerIntent: "ganar alcance para catalogos masivos y productos de compra frecuente",
    accent: "#ca8a04",
    surface: "from-[#fefce8] via-white to-[#fff7ed]",
    glow: "from-[#ca8a04] to-[#713f12]",
    heroLines: [
      "Una categoria para productos de rotacion alta, recompra y visibilidad constante.",
      "Pensada para atraer trafico organico hacia alimentos, bebidas, dietetica y surtido especializado.",
    ],
    sellerBenefits: [
      "Ideal para marcas y distribuidores con catalogos amplios.",
      "Mas oportunidades para posicionar subrubros y productos de consumo habitual.",
      "Mejor entrada organica para compradores que ya vienen listos para resolver la compra.",
    ],
    buyerBenefits: [
      "Navegacion rapida por tipo de producto.",
      "Mas contexto para descubrir surtido sin perder tiempo.",
      "Acceso directo a subcategorias y publicaciones activas.",
    ],
    roadmap: [
      "colecciones por consumo diario y mayorista",
      "filtros por presentacion, marca y formato",
      "bloques de recomendacion por rubro alimenticio",
    ],
    searchIntents: [
      "comprar alimentos online",
      "bebidas y almacen en argentina",
      "suplementos, cafe y snacks",
    ],
    sellerAngles: [
      "distribuidores",
      "marcas propias",
      "almacenes y dieteticas",
    ],
    faq: [
      {
        question: "Esta landing puede ayudar a vender catalogos amplios?",
        answer: "Si. La estructura de categoria y subcategorias mejora el descubrimiento de surtido y ayuda a posicionar mas consultas relacionadas.",
      },
      {
        question: "Que tipo de trafico atrae?",
        answer: "Principalmente usuarios con intencion de compra recurrente, comparacion de precio y busquedas por tipo de producto.",
      },
    ],
  },
  "animales-y-mascotas": {
    audience: "pet shops, veterinarias, criaderos responsables y compradores de cuidado continuo",
    buyerIntent: "encontrar alimento, accesorios, salud y bienestar por tipo de mascota",
    sellerIntent: "captar busquedas frecuentes y construir recurrencia con catalogos de cuidado animal",
    accent: "#0891b2",
    surface: "from-[#ecfeff] via-white to-[#f0fdfa]",
    glow: "from-[#0891b2] to-[#164e63]",
    heroLines: [
      "Una categoria ideal para productos de recompra, cuidado y equipamiento para mascotas.",
      "Pensada para organizar mejor la oferta de perros, gatos, veterinaria y accesorios.",
    ],
    sellerBenefits: [
      "Mas visibilidad para catalogos de alimento y bienestar animal.",
      "Apertura organica hacia subrubros por especie y necesidad.",
      "Mejor conversion para productos de compra recurrente.",
    ],
    buyerBenefits: [
      "Busqueda mas clara por tipo de mascota.",
      "Mas orden para comparar accesorios, alimento y salud.",
      "Landing conectada con subcategorias relevantes.",
    ],
    roadmap: [
      "filtros por especie, edad y uso",
      "colecciones por cuidado preventivo",
      "modulos de recompra y recomendacion",
    ],
    searchIntents: [
      "productos para perros y gatos",
      "veterinaria y accesorios para mascotas",
      "alimento y transporte animal",
    ],
    sellerAngles: [
      "pet shops",
      "veterinarias",
      "distribuidores de alimento",
    ],
    faq: [
      {
        question: "La categoria esta pensada solo para accesorios?",
        answer: "No. Tambien funciona para salud, alimentacion, transporte, paseo y productos especializados por especie.",
      },
      {
        question: "Por que esta landing ayuda al SEO?",
        answer: "Porque ordena mejor la oferta, refuerza busquedas de alta intencion y conecta subrubros relevantes con catalogo activo.",
      },
    ],
  },
  "camaras-y-accesorios": {
    audience: "fotografos, creadores, importadores y negocios de tecnologia visual",
    buyerIntent: "comparar camaras, lentes y accesorios con mas contexto tecnico",
    sellerIntent: "atraer trafico de nicho y vender productos de ticket medio y alto",
    accent: "#334155",
    surface: "from-[#f8fafc] via-white to-[#eef2ff]",
    glow: "from-[#334155] to-[#0f172a]",
    heroLines: [
      "Una categoria visual y tecnica preparada para compradores exigentes.",
      "Pensada para captar consultas sobre camaras, video, drones, lentes y accesorios.",
    ],
    sellerBenefits: [
      "Ayuda a posicionar catalogos de fotografia y video con mejor semantica.",
      "Crea mas puntos de entrada para compradores que comparan especificaciones.",
      "Mejora el interlinking entre subcategorias y productos premium.",
    ],
    buyerBenefits: [
      "Mas claridad para navegar equipos y accesorios.",
      "Mejor contexto para explorar publicaciones activas.",
      "Subcategorias listas para segmentar por necesidad.",
    ],
    roadmap: [
      "filtros por sensor, montura y formato",
      "colecciones por fotografia, video y streaming",
      "bloques de comparacion de equipos",
    ],
    searchIntents: [
      "camaras y lentes online",
      "drones y accesorios para foto",
      "equipos de video y tripodes",
    ],
    sellerAngles: [
      "casas de fotografia",
      "creadores y revendedores",
      "importadores de equipos",
    ],
    faq: [
      {
        question: "Esta landing sirve para productos tecnicos y premium?",
        answer: "Si. Esta construida para fortalecer busquedas de nicho y guiar mejor al usuario hacia equipos, accesorios y comparacion de publicaciones.",
      },
      {
        question: "Como ayuda a una tienda de fotografia?",
        answer: "Le da una categoria con mejor narrativa comercial, mas enlaces internos y mejor capacidad de captar trafico organico especializado.",
      },
    ],
  },
  "celulares-y-telefonia": {
    audience: "tiendas de celulares, importadores, revendedores y compradores de alta comparacion",
    buyerIntent: "comparar smartphones, accesorios y repuestos con foco en precio y disponibilidad",
    sellerIntent: "captar trafico masivo y de alta intencion sobre equipos y accesorios de rotacion rapida",
    accent: "#0f766e",
    surface: "from-[#f0fdfa] via-white to-[#eff6ff]",
    glow: "from-[#0f766e] to-[#134e4a]",
    heroLines: [
      "Una categoria pensada para volumen, comparacion y descubrimiento rapido.",
      "Ideal para smartphones, accesorios, fundas, repuestos y telefonia en Argentina.",
    ],
    sellerBenefits: [
      "Atrae trafico comercial y transaccional a gran escala.",
      "Refuerza subrubros con alta frecuencia de busqueda.",
      "Mejora el descubrimiento de catalogos amplios y publicaciones nuevas.",
    ],
    buyerBenefits: [
      "Busqueda mas comoda por equipos y accesorios.",
      "Mejor contexto antes de entrar al producto.",
      "Mas enlaces a subcategorias y resultados filtrados.",
    ],
    roadmap: [
      "filtros por marca, memoria y estado",
      "colecciones por gama y uso",
      "modulos de accesorios compatibles",
    ],
    searchIntents: [
      "celulares y smartphones online",
      "accesorios para celulares",
      "fundas, repuestos y smartwatches",
    ],
    sellerAngles: [
      "tiendas de celulares",
      "revendedores",
      "importadores de accesorios",
    ],
    faq: [
      {
        question: "Sirve para vender accesorios ademas de celulares?",
        answer: "Si. La categoria esta preparada para capturar trafico tanto de equipos como de accesorios, repuestos y complementos de alta demanda.",
      },
      {
        question: "Que mejora frente a una pagina de categoria simple?",
        answer: "Agrega contexto SEO, FAQs, enlaces internos y una arquitectura que ayuda a indexar mejor y convertir mas.",
      },
    ],
  },
  computacion: {
    audience: "casas de tecnologia, gamers, empresas y compradores de equipos",
    buyerIntent: "descubrir hardware, perifericos y equipos con mayor claridad y comparacion",
    sellerIntent: "presentar catalogos tecnicos con mas alcance organico y mejor estructura comercial",
    accent: "#1d4ed8",
    surface: "from-[#eff6ff] via-white to-[#f8fafc]",
    glow: "from-[#1d4ed8] to-[#1e293b]",
    heroLines: [
      "Una categoria lista para hardware, perifericos, notebooks y productividad.",
      "Pensada para captar trafico de tecnologia, gaming y compra corporativa.",
    ],
    sellerBenefits: [
      "Mas semantica para catalogos tecnicos y especificaciones.",
      "Mas puntos de entrada desde subrubros de alto volumen.",
      "Mejora la visibilidad para equipos, componentes y accesorios.",
    ],
    buyerBenefits: [
      "Navegacion mas clara por tipo de producto.",
      "Acceso rapido a componentes, notebooks y monitores.",
      "Mejor experiencia para comparar oferta activa.",
    ],
    roadmap: [
      "filtros por especificacion, uso y compatibilidad",
      "colecciones para oficina, estudio y gaming",
      "comparadores de hardware y bundles",
    ],
    searchIntents: [
      "computacion y notebooks online",
      "componentes de pc y monitores",
      "perifericos, tablets y redes",
    ],
    sellerAngles: [
      "tiendas de hardware",
      "resellers corporativos",
      "negocios gaming",
    ],
    faq: [
      {
        question: "La categoria tambien sirve para B2B?",
        answer: "Si. El contenido esta preparado para atraer tanto usuarios finales como empresas que buscan equipos, redes y productividad.",
      },
      {
        question: "Por que mejora el SEO de tecnologia?",
        answer: "Porque agrega contexto tecnico, keywords comerciales y enlaces internos que ayudan a cubrir mejor el universo de productos.",
      },
    ],
  },
  construccion: {
    audience: "corralones, ferreterias, instaladores, constructoras y compradores de obra",
    buyerIntent: "resolver materiales, instalaciones y equipamiento por etapa de trabajo",
    sellerIntent: "captar demanda profesional y domestica con mejor estructura SEO por rubro",
    accent: "#b45309",
    surface: "from-[#fffbeb] via-white to-[#fff7ed]",
    glow: "from-[#b45309] to-[#78350f]",
    heroLines: [
      "Construccion, obra y remodelacion con una categoria mas preparada para vender.",
      "Ideal para materiales, banos, iluminacion, pisos, plomeria y equipamiento tecnico.",
    ],
    sellerBenefits: [
      "Mas capacidad para posicionar catálogos amplios por subrubro.",
      "Una estructura pensada para captar busquedas de obra y reforma.",
      "Mejor pasaje entre categoria, subcategorias y publicaciones activas.",
    ],
    buyerBenefits: [
      "Acceso rapido a soluciones por tipo de proyecto.",
      "Subcategorias claras para avanzar desde la necesidad al producto.",
      "Busqueda interna mejor conectada con filtros y stock.",
    ],
    roadmap: [
      "colecciones por etapa de obra",
      "filtros por medida, material y aplicacion",
      "bloques de recomendacion por oficio",
    ],
    searchIntents: [
      "materiales para construccion online",
      "banos, plomeria e iluminacion",
      "herrajes, pisos y pinturas",
    ],
    sellerAngles: [
      "corralones",
      "ferreterias tecnicas",
      "instaladores y distribuidores",
    ],
    faq: [
      {
        question: "Puede ayudar a rubros tecnicos como plomeria o electricidad?",
        answer: "Si. La landing organiza subcategorias y contenido para que esos rubros ganen mejor visibilidad y navegacion.",
      },
      {
        question: "Esta categoria sirve para compra profesional y hogar?",
        answer: "Exacto. El enfoque cubre tanto proyectos domesticos como compras de obra o reforma con mayor volumen.",
      },
    ],
  },
  "deportes-y-fitness": {
    audience: "marcas deportivas, gimnasios, tiendas outdoor y compradores activos",
    buyerIntent: "descubrir equipamiento, indumentaria y accesorios por disciplina",
    sellerIntent: "captar trafico organico por nicho deportivo y aumentar rotacion de catalogo",
    accent: "#16a34a",
    surface: "from-[#f0fdf4] via-white to-[#ecfeff]",
    glow: "from-[#16a34a] to-[#14532d]",
    heroLines: [
      "Una categoria ideal para disciplinas con comunidades activas y busquedas constantes.",
      "Pensada para fitness, running, ciclismo, outdoor y deportes de equipo.",
    ],
    sellerBenefits: [
      "Mejor entrada organica por disciplina y tipo de producto.",
      "Ayuda a marcas y tiendas a ordenar mejor su surtido.",
      "Crea mas puntos de contacto entre contenido, subcategorias y productos.",
    ],
    buyerBenefits: [
      "Exploracion mas clara por actividad.",
      "Subcategorias listas para encontrar equipamiento puntual.",
      "Mas contexto para comparar publicaciones.",
    ],
    roadmap: [
      "colecciones por deporte y temporada",
      "filtros por talle, disciplina y uso",
      "bloques de recomendacion por nivel de practica",
    ],
    searchIntents: [
      "fitness y deporte online",
      "bicicletas, running y outdoor",
      "suplementos y accesorios deportivos",
    ],
    sellerAngles: [
      "tiendas deportivas",
      "marcas de fitness",
      "negocios outdoor",
    ],
    faq: [
      {
        question: "Se puede usar para productos de nicho deportivo?",
        answer: "Si. La landing mejora la semantica del rubro y ayuda a destacar tanto subcategorias masivas como especializadas.",
      },
      {
        question: "Como mejora la captacion de vendedores?",
        answer: "Muestra una categoria preparada para dar visibilidad organica, orden comercial y mejor experiencia de exploracion.",
      },
    ],
  },
  "electrodomesticos-y-aires": {
    audience: "casas de electro, importadores, distribuidores y compradores del hogar",
    buyerIntent: "comparar linea blanca, climatizacion y pequenos electrodomesticos con foco en decision de compra",
    sellerIntent: "ganar visibilidad para catalogos de ticket medio y alto con subrubros claros",
    accent: "#0f766e",
    surface: "from-[#f0fdfa] via-white to-[#f8fafc]",
    glow: "from-[#0f766e] to-[#134e4a]",
    heroLines: [
      "Linea blanca, climatizacion y pequenos electrodomesticos en una categoria con mas fuerza comercial.",
      "Preparada para captar trafico organico de usuarios que comparan producto, precio y entrega.",
    ],
    sellerBenefits: [
      "Mejor narrativa comercial para productos del hogar.",
      "Mayor profundidad SEO entre subrubros y publicaciones.",
      "Mas chances de captar usuarios listos para comprar.",
    ],
    buyerBenefits: [
      "Mas claridad para explorar por tipo de electrodomestico.",
      "Acceso rapido a aires, heladeras, hornos y limpieza.",
      "Mejor paso de la categoria al catalogo real.",
    ],
    roadmap: [
      "filtros por capacidad, eficiencia y formato",
      "colecciones por hogar y temporada",
      "comparadores de electro por subrubro",
    ],
    searchIntents: [
      "electrodomesticos online",
      "aires acondicionados y calefaccion",
      "heladeras, lavarropas y pequenos electro",
    ],
    sellerAngles: [
      "casas de electro",
      "importadores",
      "distribuidores de hogar",
    ],
    faq: [
      {
        question: "Sirve para productos estacionales como aires o calefaccion?",
        answer: "Si. La estructura permite destacar lineas estacionales y subrubros permanentes dentro de una misma categoria.",
      },
      {
        question: "Por que mejora el trafico?",
        answer: "Porque ataca consultas comerciales y transaccionales con una pagina mas rica, mejor enlazada y conectada con productos reales.",
      },
    ],
  },
  "electronica-audio-y-video": {
    audience: "tiendas tech, integradores, marcas y compradores de entretenimiento y hogar conectado",
    buyerIntent: "encontrar audio, video y electronica con contexto de uso y comparacion",
    sellerIntent: "ganar presencia organica en un rubro competitivo con mejor estructura editorial y comercial",
    accent: "#4f46e5",
    surface: "from-[#eef2ff] via-white to-[#f8fafc]",
    glow: "from-[#4f46e5] to-[#312e81]",
    heroLines: [
      "Una categoria preparada para entretenimiento, conectividad y tecnologia del hogar.",
      "Pensada para atraer trafico hacia audio, televisores, cables, domotica y streaming.",
    ],
    sellerBenefits: [
      "Mas rutas SEO para subrubros de alta comparacion.",
      "Ayuda a conectar equipos, accesorios y complementos.",
      "Mejora la presentacion de catalogos tecnicos y visuales.",
    ],
    buyerBenefits: [
      "Subcategorias claras para navegar audio, video y domotica.",
      "Mas contexto para comparar publicaciones activas.",
      "Catalogo mejor conectado con intencion real.",
    ],
    roadmap: [
      "filtros por formato, compatibilidad y potencia",
      "colecciones por hogar, estudio y entretenimiento",
      "bloques comparativos por experiencia de uso",
    ],
    searchIntents: [
      "electronica audio y video online",
      "televisores, audio y streaming",
      "domotica y componentes electronicos",
    ],
    sellerAngles: [
      "tiendas tecnicas",
      "marcas de audio",
      "distribuidores de domotica",
    ],
    faq: [
      {
        question: "Puede ayudar a vender audio, video y domotica juntos?",
        answer: "Si. La categoria esta pensada para relacionar subrubros complementarios y fortalecer su visibilidad organica.",
      },
      {
        question: "Que tipo de usuario atrae?",
        answer: "Usuarios que comparan prestaciones, precio y compatibilidad antes de comprar tecnologia para hogar o entretenimiento.",
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
    searchIntents: [
      "herramientas de mano y electricas",
      "soldadura, medicion y organizacion",
      "ferreteria y herramientas profesionales",
    ],
    sellerAngles: [
      "ferreterias",
      "talleres",
      "distribuidores tecnicos",
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
  "hogar-muebles-y-jardin": {
    audience: "tiendas del hogar, fabricantes, decoradores y compradores para casa y exterior",
    buyerIntent: "resolver necesidades de hogar, decoracion y mobiliario desde una sola categoria",
    sellerIntent: "captar trafico de alto volumen con subrubros claros y mejor conversion",
    accent: "#7c3aed",
    surface: "from-[#f5f3ff] via-white to-[#f8fafc]",
    glow: "from-[#7c3aed] to-[#4c1d95]",
    heroLines: [
      "Una landing pensada para hogar, decoracion, muebles y jardin con mas intención comercial.",
      "Ideal para catalogos amplios que necesitan orden, visibilidad y mejor descubrimiento.",
    ],
    sellerBenefits: [
      "Mejora el alcance organico de subrubros muy amplios.",
      "Conecta mejor muebles, textiles, cocina y jardin.",
      "Ayuda a convertir la categoria en una vitrina de entrada al marketplace.",
    ],
    buyerBenefits: [
      "Exploracion mas clara para productos del hogar.",
      "Subcategorias bien conectadas para comparar mas rapido.",
      "Mayor contexto antes de entrar al producto.",
    ],
    roadmap: [
      "colecciones por ambiente y estilo",
      "filtros por medidas, material y uso",
      "bloques de inspiracion conectados al catalogo",
    ],
    searchIntents: [
      "hogar muebles y jardin online",
      "decoracion, cocina y dormitorio",
      "muebles, textiles y aire libre",
    ],
    sellerAngles: [
      "fabricantes",
      "tiendas decoracion",
      "negocios de jardin",
    ],
    faq: [
      {
        question: "Esta categoria sirve para catalogos amplios y variados?",
        answer: "Si. La landing esta pensada para ordenar subrubros de hogar y hacer mas facil el descubrimiento de inventario.",
      },
      {
        question: "Como ayuda al SEO?",
        answer: "Agrupa intenciones de compra relacionadas con ambientes, mobiliario y hogar dentro de una pagina mas rica y mejor enlazada.",
      },
    ],
  },
  "industrias-y-oficinas": {
    audience: "proveedores B2B, negocios de oficina, equipamiento comercial y compras profesionales",
    buyerIntent: "encontrar insumos, maquinaria y soluciones para trabajo y operacion",
    sellerIntent: "captar demanda profesional con una categoria mejor estructurada para negocios",
    accent: "#475569",
    surface: "from-[#f8fafc] via-white to-[#eef2ff]",
    glow: "from-[#475569] to-[#0f172a]",
    heroLines: [
      "Una categoria construida para operacion, productividad y compra profesional.",
      "Ideal para oficinas, equipamiento comercial, seguridad industrial y maquinaria.",
    ],
    sellerBenefits: [
      "Mejor posicionamiento para catalogos B2B.",
      "Mas orden para subrubros de baja compra impulsiva y alta comparacion.",
      "Mayor claridad comercial para trafico profesional.",
    ],
    buyerBenefits: [
      "Rutas mas directas hacia insumos y equipamiento.",
      "Navegacion ordenada por necesidad laboral.",
      "Contexto comercial antes del detalle de producto.",
    ],
    roadmap: [
      "colecciones por industria y operacion",
      "filtros por capacidad y aplicacion",
      "bloques orientados a compras empresariales",
    ],
    searchIntents: [
      "industrias y oficinas online",
      "equipamiento comercial y mobiliario",
      "maquinaria industrial e insumos de oficina",
    ],
    sellerAngles: [
      "proveedores B2B",
      "equipamiento comercial",
      "distribuidores industriales",
    ],
    faq: [
      {
        question: "La landing esta orientada a publico profesional?",
        answer: "Si. El enfoque y la estructura estan pensados para atraer demanda laboral, empresarial y comercial con mas claridad.",
      },
      {
        question: "Puede ayudar a rubros industriales y de oficina a convivir?",
        answer: "Si. La pagina organiza la categoria para que cada subrubro tenga mejor contexto y navegacion.",
      },
    ],
  },
  inmuebles: {
    audience: "desarrolladores, inmobiliarias, propietarios y personas buscando mudarse o invertir",
    buyerIntent: "explorar propiedades y oportunidades por tipo de inmueble",
    sellerIntent: "darle mas presencia digital a la oferta inmobiliaria con mejor entrada organica",
    accent: "#0f766e",
    surface: "from-[#f0fdfa] via-white to-[#eff6ff]",
    glow: "from-[#0f766e] to-[#134e4a]",
    heroLines: [
      "Una categoria pensada para propiedades, inversion y descubrimiento de oferta inmobiliaria.",
      "Preparada para mostrar subrubros como casas, departamentos, oficinas, campos y lotes.",
    ],
    sellerBenefits: [
      "Mejor narrativa comercial para propiedades y desarrollos.",
      "Mas orden para subcategorias inmobiliarias.",
      "Mas posibilidades de captar trafico organico por tipo de inmueble.",
    ],
    buyerBenefits: [
      "Navegacion mas simple por tipo de propiedad.",
      "Contexto para explorar oferta antes de entrar al detalle.",
      "Mas rutas internas entre subrubros y resultados.",
    ],
    roadmap: [
      "filtros por ubicacion, uso y tipo de operacion",
      "colecciones por vivienda, inversion y comercial",
      "modulos enriquecidos para desarrollos",
    ],
    searchIntents: [
      "inmuebles en argentina",
      "casas, departamentos y terrenos",
      "oficinas, locales y campos",
    ],
    sellerAngles: [
      "inmobiliarias",
      "desarrolladores",
      "propietarios e inversores",
    ],
    faq: [
      {
        question: "Puede posicionar distintos tipos de inmueble?",
        answer: "Si. La landing esta armada para repartir mejor relevancia entre subcategorias y consultas por tipo de propiedad.",
      },
      {
        question: "Ayuda a captar vendedores o anunciantes?",
        answer: "Si. Muestra una estructura mas profesional y mejor preparada para dar visibilidad a propiedades y desarrollos.",
      },
    ],
  },
  "instrumentos-musicales": {
    audience: "casas de musica, luthiers, estudios y compradores creativos",
    buyerIntent: "comparar instrumentos, audio y accesorios por familia musical",
    sellerIntent: "captar demanda de nicho con una categoria que entienda mejor el lenguaje del rubro",
    accent: "#7c2d12",
    surface: "from-[#fff7ed] via-white to-[#f5f3ff]",
    glow: "from-[#7c2d12] to-[#431407]",
    heroLines: [
      "Una categoria pensada para instrumentos, sonido y produccion musical.",
      "Preparada para atraer trafico de guitarras, baterias, teclados, microfonos y estudio.",
    ],
    sellerBenefits: [
      "Mas claridad SEO para equipos de nicho y subrubros musicales.",
      "Mejor relacion entre instrumentos, accesorios y audio.",
      "Una presentacion mas fuerte para marcas, tiendas y vendedores especializados.",
    ],
    buyerBenefits: [
      "Exploracion mas intuitiva por familia de instrumento.",
      "Subcategorias claras para estudio, vivo y aprendizaje.",
      "Mas contexto antes de entrar a la publicacion.",
    ],
    roadmap: [
      "colecciones por instrumento y nivel",
      "filtros por tipo, uso y formato",
      "bloques editoriales para estudio y escenario",
    ],
    searchIntents: [
      "instrumentos musicales online",
      "guitarras, teclados y microfonos",
      "sonido en vivo y estudio",
    ],
    sellerAngles: [
      "casas de musica",
      "luthiers",
      "proveedores de audio",
    ],
    faq: [
      {
        question: "La categoria tambien sirve para audio y estudio?",
        answer: "Si. La estructura contempla instrumentos, grabacion, vivo y accesorios con una mejor organizacion comercial.",
      },
      {
        question: "Puede atraer trafico de nicho?",
        answer: "Si. La landing suma lenguaje de rubro y enlaces internos que ayudan a cubrir consultas mas especificas.",
      },
    ],
  },
  "juegos-y-juguetes": {
    audience: "jugueterias, distribuidores, importadores y familias comprando por edad o interes",
    buyerIntent: "encontrar juguetes, juegos y coleccionables por tipo de uso o franja etaria",
    sellerIntent: "captar trafico estacional y permanente con mejor estructura de categoria",
    accent: "#db2777",
    surface: "from-[#fdf2f8] via-white to-[#fefce8]",
    glow: "from-[#db2777] to-[#831843]",
    heroLines: [
      "Una categoria lista para juegos, juguetes y coleccionables con mejor experiencia de descubrimiento.",
      "Ideal para captar trafico de regalos, entretenimiento, educacion y juego libre.",
    ],
    sellerBenefits: [
      "Mas orden para catalogos amplios y muy variados.",
      "Apertura organica para temporadas y fechas de alta demanda.",
      "Mejor camino hacia subcategorias y productos destacados.",
    ],
    buyerBenefits: [
      "Exploracion simple por tipo de juguete o juego.",
      "Acceso mas rapido a subrubros para distintas edades e intereses.",
      "Mas contexto para elegir y comparar.",
    ],
    roadmap: [
      "colecciones por edad y ocasion de compra",
      "filtros por tipo de juego y licencia",
      "bloques tematicos por aprendizaje y diversion",
    ],
    searchIntents: [
      "juguetes y juegos online",
      "lego, muñecos y juegos de mesa",
      "regalos y didacticos para chicos",
    ],
    sellerAngles: [
      "jugueterias",
      "importadores",
      "marcas educativas",
    ],
    faq: [
      {
        question: "La landing ayuda en fechas de alta demanda?",
        answer: "Si. La estructura facilita posicionar mejor la categoria y ordenar subrubros clave para temporadas y regalos.",
      },
      {
        question: "Sirve para coleccionables y juegos de mesa tambien?",
        answer: "Si. La categoria contempla tanto juguetes de rotacion alta como nichos de hobby y coleccion.",
      },
    ],
  },
  "ropa-y-accesorios": {
    audience: "marcas, locales, mayoristas, revendedores y compradores de moda",
    buyerIntent: "explorar indumentaria, calzado y accesorios por estilo y necesidad",
    sellerIntent: "ganar visibilidad organica para catalogos visuales con alta competencia",
    accent: "#be185d",
    surface: "from-[#fdf2f8] via-white to-[#fff7ed]",
    glow: "from-[#be185d] to-[#831843]",
    heroLines: [
      "Moda, calzado y accesorios con una landing preparada para atraer trafico y sostener conversion.",
      "Pensada para marcas, tiendas y vendedores que necesitan mas visibilidad y mejor orden visual.",
    ],
    sellerBenefits: [
      "Mas profundidad SEO para moda y subrubros de alta competencia.",
      "Mayor capacidad de captar trafico por prenda, estilo o temporada.",
      "Mejor pasaje desde categoria a catalogo activo.",
    ],
    buyerBenefits: [
      "Exploracion mas clara por tipo de prenda o accesorio.",
      "Mas rutas internas para navegar oferta y novedades.",
      "Contexto de categoria mas fuerte antes del producto.",
    ],
    roadmap: [
      "colecciones por temporada, genero y uso",
      "filtros por talle, color y estilo",
      "editorial de moda conectada al catalogo",
    ],
    searchIntents: [
      "ropa y accesorios online",
      "calzado, carteras y moda",
      "ropa deportiva y de trabajo",
    ],
    sellerAngles: [
      "marcas de indumentaria",
      "locales multimarca",
      "mayoristas y revendedores",
    ],
    faq: [
      {
        question: "Sirve para moda y calzado a la vez?",
        answer: "Si. La categoria esta pensada para reunir prendas, accesorios y calzado con mejor contexto comercial y SEO.",
      },
      {
        question: "Como ayuda a un vendedor de indumentaria?",
        answer: "Le da una landing mas fuerte para competir por visibilidad organica y conectar mejor con subrubros y productos.",
      },
    ],
  },
  servicios: {
    audience: "agencias, profesionales independientes, tecnicos y negocios de servicio",
    buyerIntent: "encontrar prestadores, soluciones y servicios por tipo de necesidad",
    sellerIntent: "captar leads organicos y convertir la categoria en una puerta de entrada comercial",
    accent: "#0284c7",
    surface: "from-[#f0f9ff] via-white to-[#f8fafc]",
    glow: "from-[#0284c7] to-[#0c4a6e]",
    heroLines: [
      "Una categoria preparada para vender servicios, conocimiento y soluciones reales.",
      "Ideal para asesoria, instalacion, reparaciones, programacion, transporte y servicios profesionales.",
    ],
    sellerBenefits: [
      "Convierte la categoria en una pagina de captacion de leads.",
      "Da mas contexto y confianza al rubro servicios.",
      "Mejora la navegacion entre subcategorias y propuestas comerciales.",
    ],
    buyerBenefits: [
      "Mas claridad para encontrar el tipo de servicio correcto.",
      "Subrubros conectados a busquedas con intencion real.",
      "Landing mas fuerte para pasar de la necesidad a la accion.",
    ],
    roadmap: [
      "formularios por tipo de servicio",
      "colecciones por rubro profesional",
      "modulos de reputacion y prueba social",
    ],
    searchIntents: [
      "servicios online en argentina",
      "reparaciones, clases y asesoramiento",
      "diseno, programacion y transporte",
    ],
    sellerAngles: [
      "profesionales independientes",
      "agencias y estudios",
      "servicios tecnicos",
    ],
    faq: [
      {
        question: "Esta categoria funciona tambien para captar consultas?",
        answer: "Si. En servicios el objetivo no es solo vender, sino generar leads de calidad y dar contexto comercial al usuario.",
      },
      {
        question: "Que ventaja tiene frente a una lista simple?",
        answer: "Una landing mejor trabajada transmite mas confianza, cubre mas intenciones de busqueda y ayuda a derivar mejor a los servicios publicados.",
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
    "Una pagina de categoria preparada para acompanar el crecimiento del marketplace.",
  ],
  buyerBenefits: [
    "Contexto claro antes de entrar al catalogo.",
    "Rutas rapidas hacia subcategorias, resultados y publicaciones nuevas.",
    "Mas senales para encontrar oferta relevante sin navegar a ciegas.",
  ],
  roadmap: [
    "bloques comparativos por subrubro",
    "contenido editorial conectado con productos",
    "modulos de reputacion y conversion por categoria",
  ],
  searchIntents: [
    "comprar online en argentina",
    "publicar productos o servicios",
    "explorar marketplace por categoria",
  ],
  sellerAngles: [
    "marcas",
    "comercios",
    "vendedores especializados",
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
  if (name.includes("celular") || parent.includes("celular")) return themeBySlug["celulares-y-telefonia"];
  if (name.includes("camara") || parent.includes("camara")) return themeBySlug["camaras-y-accesorios"];
  if (name.includes("comput") || parent.includes("comput")) return themeBySlug.computacion;
  if (name.includes("constru") || parent.includes("constru")) return themeBySlug.construccion;
  if (name.includes("deporte") || parent.includes("deporte") || name.includes("fitness")) return themeBySlug["deportes-y-fitness"];
  if (name.includes("electrodom") || parent.includes("electrodom") || name.includes("aires")) return themeBySlug["electrodomesticos-y-aires"];
  if (name.includes("audio") || name.includes("video") || parent.includes("electronica")) return themeBySlug["electronica-audio-y-video"];
  if (name.includes("hogar") || name.includes("mueble") || parent.includes("hogar")) return themeBySlug["hogar-muebles-y-jardin"];
  if (name.includes("oficina") || name.includes("industrial") || parent.includes("oficina")) return themeBySlug["industrias-y-oficinas"];
  if (name.includes("inmueble") || parent.includes("inmueble") || name.includes("departamento")) return themeBySlug.inmuebles;
  if (name.includes("musical") || name.includes("guitarra") || parent.includes("musical")) return themeBySlug["instrumentos-musicales"];
  if (name.includes("juguete") || parent.includes("juguete")) return themeBySlug["juegos-y-juguetes"];
  if (name.includes("ropa") || name.includes("calzado") || parent.includes("ropa")) return themeBySlug["ropa-y-accesorios"];
  if (name.includes("servicio") || parent.includes("servicio") || name.includes("programacion")) return themeBySlug.servicios;
  if (name.includes("alimento") || parent.includes("alimento") || name.includes("bebida")) return themeBySlug["alimentos-y-bebidas"];
  if (name.includes("mascota") || parent.includes("mascota") || name.includes("perro") || name.includes("gato")) {
    return themeBySlug["animales-y-mascotas"];
  }

  return defaultTheme;
}

function buildKeywords(category: CategoryBasics, subcategories: Array<{ name: string }>) {
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

  for (const subcategory of subcategories.slice(0, 6)) {
    base.push(`${subcategory.name} online`);
  }

  return Array.from(new Set(base));
}

function buildEditorialIntro(category: CategoryBasics, theme: CategorySeoTheme, subcategories: Array<{ name: string }>) {
  const subcategoryLine =
    subcategories.length > 0
      ? `La landing conecta ${subcategories.slice(0, 5).map((item) => item.name).join(", ")} y otras lineas relacionadas para repartir mejor la autoridad SEO y guiar al usuario hacia resultados mas concretos.`
      : "La categoria funciona como una puerta de entrada comercial hacia publicaciones activas, resultados filtrados y nuevas oportunidades de venta dentro del marketplace.";

  return `MADSJEEZ trabaja esta categoria como un activo de captacion, no solo como una pagina de listado. El objetivo es posicionar mejor consultas de ${category.name}, ayudar a ${theme.audience} y convertir visitas organicas en publicaciones vistas, contactos o compras. ${subcategoryLine}`;
}

function buildEditorialClosing(category: CategoryBasics, theme: CategorySeoTheme) {
  return `A medida que sumemos mas inventario, filtros y contenido especifico, ${category.name} puede convertirse en una de las puertas de entrada mas fuertes del marketplace. La base ya esta lista para soportar crecimiento organico, mas profundidad editorial y una propuesta cada vez mas fuerte para ${theme.sellerAngles.join(", ")}.`;
}

export function buildCategorySeo(category: CategoryBasics, subcategories: Array<{ name: string }>): CategorySeoResult {
  const theme = inferTheme(category);
  const keywords = buildKeywords(category, subcategories);
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
    searchIntents: theme.searchIntents,
    sellerAngles: theme.sellerAngles,
    editorialIntro: buildEditorialIntro(category, theme, subcategories),
    editorialClosing: buildEditorialClosing(category, theme),
    seoTitle: `${category.name} en Argentina | Compra, vende y publica en MADSJEEZ`,
    seoDescription: `${heroDescription} Explora ${category.name}, compara publicaciones y suma tu negocio al marketplace.`,
  };
}
