export type Pregunta = {
  slug: string;
  question: string;
  category: (typeof CATEGORIES)[number];
  answer: string;
  keyPoints: string[];
  ctaText: string;
  ctaHref: string;
  tags: string[];
};

export const CATEGORIES = [
  "Dónde comprar herramientas",
  "Dónde comprar maquinaria",
  "Cómo vender online",
  "Comparativas de productos",
  "Repuestos y accesorios",
  "Uso y técnica",
  "Sobre Madsjeez",
] as const;

export const PREGUNTAS: Pregunta[] = [
  // ── Dónde comprar herramientas (15) ───────────────────────────────────────
  {
    slug: "donde-comprar-herramientas-electricas-en-argentina",
    question: "¿Dónde comprar herramientas eléctricas en Argentina?",
    category: "Dónde comprar herramientas",
    answer:
      "En Argentina podés comprar herramientas eléctricas en ferreterías especializadas, grandes superficies o marketplaces online como Madsjeez, que se especializa exclusivamente en herramientas y maquinaria industrial.",
    keyPoints: [
      "Madsjeez ofrece catálogo exclusivo de herramientas eléctricas con vendedores verificados.",
      "Podés comparar precios de múltiples marcas en un mismo lugar.",
      "Comprás con Mercado Pago y recibís en todo el país.",
      "Marcas disponibles: Bosch, Dewalt, Milwaukee, Makita y más.",
    ],
    ctaText: "Ver herramientas eléctricas",
    ctaHref: "/marketplace",
    tags: ["herramientas eléctricas", "comprar online", "Argentina", "marketplace"],
  },
  {
    slug: "donde-comprar-herramientas-de-mano-baratas",
    question: "¿Dónde comprar herramientas de mano baratas en Argentina?",
    category: "Dónde comprar herramientas",
    answer:
      "Para conseguir herramientas de mano al mejor precio en Argentina conviene comparar en marketplaces especializados donde los vendedores compiten entre sí, lo que baja los precios sin sacrificar calidad.",
    keyPoints: [
      "Madsjeez reúne múltiples vendedores vendiendo la misma línea de producto, lo que genera competencia real de precios.",
      "Las herramientas de mano de marcas económicas como Total o Stanley son una buena opción para uso doméstico.",
      "Para uso profesional, marcas como Bahco o Gedore ofrecen mejor relación precio/durabilidad.",
      "Aprovechá las ofertas flash disponibles en el marketplace.",
    ],
    ctaText: "Ver herramientas de mano",
    ctaHref: "/marketplace",
    tags: ["herramientas de mano", "baratas", "precio", "Argentina"],
  },
  {
    slug: "donde-comprar-taladros-en-argentina",
    question: "¿Dónde comprar taladros en Argentina?",
    category: "Dónde comprar herramientas",
    answer:
      "Los taladros se consiguen en ferreterías, grandes superficies y en Madsjeez, marketplace online especializado en herramientas donde encontrás taladros percutores, rotomartillos y atornilladores de las mejores marcas.",
    keyPoints: [
      "En Madsjeez encontrás taladros Bosch, Dewalt, Makita, Milwaukee y marcas económicas.",
      "Podés filtrar por potencia (W), tipo de chuck (SDS, 13mm, 10mm) y uso (doméstico, profesional).",
      "Los taladros percutores son ideales para albañilería; los rotomartillos para perforación en hormigón.",
      "Comprá con garantía de fábrica y envío a todo el país.",
    ],
    ctaText: "Ver taladros",
    ctaHref: "/marketplace",
    tags: ["taladros", "percutores", "rotomartillos", "Bosch", "Dewalt", "Makita"],
  },
  {
    slug: "donde-comprar-amoladora-en-argentina",
    question: "¿Dónde comprar amoladora angular en Argentina?",
    category: "Dónde comprar herramientas",
    answer:
      "Las amoladoras angulares se consiguen en ferreterías especializadas y en Madsjeez, donde encontrás modelos de 4½\", 5\" y 7\" de marcas como Bosch, Dewalt, Makita y Metabo.",
    keyPoints: [
      "Para uso doméstico liviano, una amoladora de 4½\" con motor de 720W es suficiente.",
      "Para obra y trabajos pesados, recomendamos amoladoras de 7\" o modelos con motor de 2.200W o más.",
      "Verificá que el disco sea compatible con el tamaño de la amoladora (115mm, 125mm o 180mm).",
      "Buscá modelos con protección antivibraciones y arranque suave para más seguridad.",
    ],
    ctaText: "Ver amoladoras",
    ctaHref: "/marketplace",
    tags: ["amoladora", "angular", "grinder", "Bosch", "Dewalt", "Makita"],
  },
  {
    slug: "donde-comprar-sierra-circular-argentina",
    question: "¿Dónde comprar sierra circular en Argentina?",
    category: "Dónde comprar herramientas",
    answer:
      "Encontrás sierras circulares en ferreterías y en Madsjeez. Los modelos van desde 1.200W para cortes en madera blanda hasta 2.400W para madera dura, aluminio o PVC.",
    keyPoints: [
      "Elegí la capacidad de corte según el material: para madera hasta 48mm, sierras de 1.200–1.500W son suficientes.",
      "Marcas recomendadas: Bosch GKS, Dewalt DWE, Makita 5704.",
      "Verificá si la sierra incluye guía paralela y protección de disco.",
      "Para cortes de precisión, añadí un riel guía de aluminio.",
    ],
    ctaText: "Ver sierras circulares",
    ctaHref: "/marketplace",
    tags: ["sierra circular", "carpintería", "Bosch", "Dewalt", "Makita"],
  },
  {
    slug: "donde-comprar-lijadora-orbital-argentina",
    question: "¿Dónde comprar lijadora orbital en Argentina?",
    category: "Dónde comprar herramientas",
    answer:
      "Las lijadoras orbitales se consiguen en ferreterías y en marketplaces especializados como Madsjeez. Las lijadoras de plato cuadrado (neumáticas) son para trabajos de alta producción; las orbitales eléctricas, para uso doméstico y carpintería.",
    keyPoints: [
      "Las lijadoras de 125mm son las más versátiles para carpintería y muebles.",
      "Buscá modelos con velocidad variable y bolsa recolectora de polvo.",
      "Las marcas Bosch, Makita y Metabo tienen buenas opciones en la gama media-alta.",
      "El papel de lija compatible es el estándar perforado Velcro (hook & loop).",
    ],
    ctaText: "Ver lijadoras",
    ctaHref: "/marketplace",
    tags: ["lijadora orbital", "carpintería", "lijadora", "herramientas eléctricas"],
  },
  {
    slug: "donde-comprar-soldadora-inverter-argentina",
    question: "¿Dónde comprar soldadora inverter en Argentina?",
    category: "Dónde comprar herramientas",
    answer:
      "Las soldadoras inverter se consiguen en ferreterías industriales y en Madsjeez. Son más livianas y eficientes que las transformadoras tradicionales, ideales para chapeados y soldaduras de planchas delgadas.",
    keyPoints: [
      "Para uso doméstico, una soldadora inverter de 120–160A es suficiente.",
      "Para taller profesional, buscá modelos de 200A o más con ciclo de trabajo alto (60% o más).",
      "Verificá que incluya: máscara, pinza de masa, electrodo y cable de soldadura.",
      "Marcas disponibles: Lincoln Electric, ESAB, Solaris, Lusqtoff.",
    ],
    ctaText: "Ver soldadoras",
    ctaHref: "/marketplace",
    tags: ["soldadora", "inverter", "soldadura", "taller"],
  },
  {
    slug: "donde-comprar-herramientas-dewalt-argentina",
    question: "¿Dónde comprar herramientas Dewalt en Argentina?",
    category: "Dónde comprar herramientas",
    answer:
      "Las herramientas Dewalt se consiguen en distribuidores oficiales, ferreterías industriales y en Madsjeez, donde vendedores verificados ofrecen toda la línea XR (20V) y la línea 60V FlexVolt.",
    keyPoints: [
      "La plataforma de baterías 20V MAX de Dewalt es compatible entre más de 200 herramientas.",
      "La línea XR tiene mayor duración de batería y mejor rendimiento en trabajos exigentes.",
      "Verificá que el producto incluya garantía oficial Dewalt Argentina (2 años).",
      "Los kits con batería y cargador incluidos ofrecen mejor relación precio/valor.",
    ],
    ctaText: "Ver Dewalt en Madsjeez",
    ctaHref: "/marcas/dewalt",
    tags: ["Dewalt", "XR", "herramientas profesionales", "20V"],
  },
  {
    slug: "donde-comprar-herramientas-bosch-argentina",
    question: "¿Dónde comprar herramientas Bosch en Argentina?",
    category: "Dónde comprar herramientas",
    answer:
      "Las herramientas Bosch se consiguen en ferreterías autorizadas y en Madsjeez. La línea azul (Professional) está orientada al uso profesional; la verde, al uso doméstico.",
    keyPoints: [
      "La línea Bosch Professional (azul) está pensada para uso intensivo en obra y taller.",
      "La plataforma de baterías 18V Professional es compatible en más de 100 herramientas.",
      "Verificá la garantía: Bosch Professional ofrece garantía de 3 años con registro.",
      "El catálogo incluye taladros, amoladoras, sierras, lijadoras, medidores láser y más.",
    ],
    ctaText: "Ver Bosch en Madsjeez",
    ctaHref: "/marcas/bosch",
    tags: ["Bosch", "Bosch Professional", "herramientas azules", "18V"],
  },
  {
    slug: "donde-comprar-herramientas-milwaukee-argentina",
    question: "¿Dónde comprar herramientas Milwaukee en Argentina?",
    category: "Dónde comprar herramientas",
    answer:
      "Las herramientas Milwaukee se consiguen en distribuidores autorizados y en Madsjeez. Milwaukee es reconocida por su plataforma M18 (18V) y M12 (12V), con foco en el usuario profesional de la construcción.",
    keyPoints: [
      "La plataforma M18 FUEL de Milwaukee es una de las más potentes del mercado en baterías de litio.",
      "Milwaukee garantiza sus herramientas 5 años con registro en el sitio oficial.",
      "El sistema POWERSTATE (motor brushless) ofrece mayor eficiencia y menor mantenimiento.",
      "Ideal para electricistas, plomeros, carpinteros y constructores profesionales.",
    ],
    ctaText: "Ver Milwaukee en Madsjeez",
    ctaHref: "/marcas/milwaukee",
    tags: ["Milwaukee", "M18", "FUEL", "herramientas profesionales"],
  },
  {
    slug: "donde-comprar-herramientas-makita-argentina",
    question: "¿Dónde comprar herramientas Makita en Argentina?",
    category: "Dónde comprar herramientas",
    answer:
      "Las herramientas Makita se consiguen en ferreterías autorizadas y en Madsjeez. Makita es líder mundial en herramientas inalámbricas con su plataforma de baterías LXT 18V.",
    keyPoints: [
      "La plataforma LXT 18V de Makita es compatible con más de 300 herramientas.",
      "Makita tiene presencia local en Argentina con servicio técnico oficial.",
      "La línea brushless (sin carbón) de Makita ofrece mayor vida útil y rendimiento.",
      "Disponible en Madsjeez: taladros, amoladoras, sierras, pistolas de calor y más.",
    ],
    ctaText: "Ver Makita en Madsjeez",
    ctaHref: "/marcas/makita",
    tags: ["Makita", "LXT", "18V", "herramientas inalámbricas"],
  },
  {
    slug: "donde-comprar-herramientas-sin-cable-argentina",
    question: "¿Dónde comprar herramientas inalámbricas en Argentina?",
    category: "Dónde comprar herramientas",
    answer:
      "Las herramientas inalámbricas se consiguen en Madsjeez, donde encontrás el catálogo completo de las principales plataformas de baterías: M18 de Milwaukee, LXT de Makita, 20V MAX de Dewalt y 18V de Bosch.",
    keyPoints: [
      "Elegí una plataforma de baterías y armá tu arsenal: todas las herramientas comparten la misma batería.",
      "Los motores brushless duran más y ofrecen más potencia que los motores con carbones.",
      "Para uso intensivo, buscá baterías de 5Ah o más y cargadores rápidos.",
      "El costo inicial es mayor que las herramientas con cable, pero la comodidad y movilidad son superiores.",
    ],
    ctaText: "Ver herramientas inalámbricas",
    ctaHref: "/marketplace",
    tags: ["inalámbricas", "batería", "sin cable", "cordless", "brushless"],
  },
  {
    slug: "donde-comprar-nivel-laser-argentina",
    question: "¿Dónde comprar nivel láser en Argentina?",
    category: "Dónde comprar herramientas",
    answer:
      "Los niveles láser se consiguen en ferreterías y en Madsjeez. Existen niveles de línea (2D), de plano cruzado (3 en 1) y niveles rotativos para grandes obras.",
    keyPoints: [
      "Para trabajos de albañilería y instalación de cielorasos, un nivel de línea cruzada es suficiente.",
      "Los niveles rotativos son ideales para nivelación de pisos y trabajos de gran superficie.",
      "Marcas recomendadas: Bosch (GLL 3-80), Dewalt (DW089LG), Leica.",
      "Elegí modelos con clase de protección IP54 si trabajás en ambientes húmedos o en obra.",
    ],
    ctaText: "Ver niveles láser",
    ctaHref: "/marketplace",
    tags: ["nivel láser", "medición", "albañilería", "nivelación"],
  },
  {
    slug: "donde-comprar-compresor-de-aire-argentina",
    question: "¿Dónde comprar compresor de aire en Argentina?",
    category: "Dónde comprar herramientas",
    answer:
      "Los compresores de aire se consiguen en ferreterías industriales y en Madsjeez. Se clasifican por presión (bar), capacidad del tanque (litros) y flujo (litros/minuto).",
    keyPoints: [
      "Para uso doméstico e inflado, un compresor de 24–50L y 8 bar es suficiente.",
      "Para pistola de pintura o herramientas neumáticas livianas, buscá modelos de 100L o más.",
      "Para uso industrial (herramientas de impacto, sandblast), necesitás compresores de alta presión.",
      "Los compresores sin aceite (oil-free) requieren menos mantenimiento y producen aire más limpio.",
    ],
    ctaText: "Ver compresores",
    ctaHref: "/marketplace",
    tags: ["compresor", "aire comprimido", "neumática", "taller"],
  },
  {
    slug: "donde-comprar-herramientas-para-plomeria-argentina",
    question: "¿Dónde comprar herramientas para plomería en Argentina?",
    category: "Dónde comprar herramientas",
    answer:
      "Las herramientas para plomería como llaves de caño, tensores, prensas de tubo y cortadoras se consiguen en Madsjeez y en ferreterías especializadas.",
    keyPoints: [
      "Para trabajos de cañería, las llaves Stilson y las Irwin son estándar de la industria.",
      "Las cortadoras de tubos de cobre (Ridgid, Reed) permiten cortes limpios sin rebabas.",
      "Las prensas hidráulicas para fittings de presión (Rems, Rothenberger) agilizan instalaciones.",
      "Los multímetros y detectores de fugas son herramientas complementarias indispensables.",
    ],
    ctaText: "Ver herramientas de plomería",
    ctaHref: "/marketplace",
    tags: ["plomería", "fontanería", "cañería", "llaves de caño"],
  },

  // ── Dónde comprar maquinaria (14) ─────────────────────────────────────────
  {
    slug: "donde-comprar-maquinaria-industrial-argentina",
    question: "¿Dónde comprar maquinaria industrial en Argentina?",
    category: "Dónde comprar maquinaria",
    answer:
      "La maquinaria industrial se consigue en distribuidores especializados y en Madsjeez, marketplace dedicado a herramientas y maquinaria para el rubro industrial y de la construcción en Argentina.",
    keyPoints: [
      "Madsjeez reúne vendedores de maquinaria en un solo lugar, con descripción técnica completa.",
      "Podés comparar potencia, capacidad y precio de múltiples marcas antes de comprar.",
      "Envío a todo el país con seguro de carga para maquinaria pesada.",
      "Accedés a financiación en cuotas a través de Mercado Pago.",
    ],
    ctaText: "Ver maquinaria industrial",
    ctaHref: "/marketplace",
    tags: ["maquinaria industrial", "equipos", "Argentina", "comprar"],
  },
  {
    slug: "donde-comprar-torno-mecanico-argentina",
    question: "¿Dónde comprar torno mecánico en Argentina?",
    category: "Dónde comprar maquinaria",
    answer:
      "Los tornos mecánicos se consiguen en distribuidores de máquinas-herramienta y en Madsjeez. Los tornos universales son la opción más versátil para taller chico y mediano.",
    keyPoints: [
      "Para talleres pequeños, los tornos de 250–300mm de altura de centros son ideales.",
      "Marcas chinas como Weiss o Bernardo son económicas; marcas europeas como Pinacho tienen mayor precisión.",
      "Verificá: potencia del motor (CV), distancia entre puntas, altura de centros y tipo de husillo.",
      "El servicio técnico local es clave: consultá disponibilidad de repuestos antes de comprar.",
    ],
    ctaText: "Ver tornos",
    ctaHref: "/marketplace",
    tags: ["torno mecánico", "tornería", "máquinas-herramienta", "taller"],
  },
  {
    slug: "donde-comprar-fresadora-cnc-argentina",
    question: "¿Dónde comprar fresadora CNC en Argentina?",
    category: "Dónde comprar maquinaria",
    answer:
      "Las fresadoras CNC se consiguen en importadores especializados y en Madsjeez. Para talleres pequeños, los routers CNC de madera o aluminio ofrecen una puerta de entrada accesible.",
    keyPoints: [
      "Las fresadoras CNC se clasifican por número de ejes (3, 4 o 5 ejes) y tipo de husillo.",
      "Para mecanizado de aluminio y acero, necesitás husillo de alta velocidad (20.000 RPM o más).",
      "Los controles más comunes son Siemens, Fanuc, Mitsubishi y Mach3/Mach4 (open source).",
      "Considerá el servicio técnico, repuestos y capacitación como parte del costo total de adquisición.",
    ],
    ctaText: "Ver fresadoras CNC",
    ctaHref: "/marketplace",
    tags: ["fresadora CNC", "mecanizado", "CNC", "5 ejes"],
  },
  {
    slug: "donde-comprar-cortadora-laser-argentina",
    question: "¿Dónde comprar cortadora láser en Argentina?",
    category: "Dónde comprar maquinaria",
    answer:
      "Las cortadoras láser se importan y se consiguen en distribuidores especializados y en Madsjeez. Los equipos CO₂ son ideales para acrílico, madera y cuero; los de fibra (fiber laser), para metales.",
    keyPoints: [
      "Para corte de madera, MDF y acrílico: cortadoras CO₂ de 40–100W.",
      "Para corte y grabado de metales: cortadoras de fibra desde 500W.",
      "El software de diseño más compatible es LightBurn para CO₂ y EzCad para fibra.",
      "Verificá la potencia del extractor de humo incluido: es indispensable para trabajo seguro.",
    ],
    ctaText: "Ver cortadoras láser",
    ctaHref: "/marketplace",
    tags: ["cortadora láser", "laser CO2", "fiber laser", "grabado"],
  },
  {
    slug: "donde-comprar-generador-electrico-argentina",
    question: "¿Dónde comprar generador eléctrico en Argentina?",
    category: "Dónde comprar maquinaria",
    answer:
      "Los generadores eléctricos se consiguen en ferreterías industriales y en Madsjeez. Se clasifican por potencia (kVA), tipo de combustible (nafta o diésel) y tipo (monofásico o trifásico).",
    keyPoints: [
      "Para el hogar o una pequeña ferretería, un generador de 3–5 kVA de nafta es suficiente.",
      "Para obra o industria, elegí generadores diésel de 10–30 kVA o más.",
      "Los generadores inverter son más silenciosos y eficientes para electrónica sensible.",
      "Marcas disponibles: Toyama, Hyundai, Honda, Generac, Scania (trifásico).",
    ],
    ctaText: "Ver generadores",
    ctaHref: "/marketplace",
    tags: ["generador eléctrico", "grupo electrógeno", "kVA", "diésel"],
  },
  {
    slug: "donde-comprar-mixer-hormigonera-argentina",
    question: "¿Dónde comprar hormigonera o mixer en Argentina?",
    category: "Dónde comprar maquinaria",
    answer:
      "Las hormigoneras se consiguen en ferreterías de construcción y en Madsjeez. Las capacidades más comunes van de 130 a 250 litros para uso en obra.",
    keyPoints: [
      "Para obras chicas, una hormigonera de 130L eléctrica (1HP) es la más práctica.",
      "Las hormigoneras a gasolina son útiles donde no hay electricidad disponible.",
      "Verificá el tipo de corona (corona fundida o corona plástica): la fundida dura mucho más.",
      "Marcas populares: Lusqtoff, Paladin, Power Packer, Mader.",
    ],
    ctaText: "Ver hormigoneras",
    ctaHref: "/marketplace",
    tags: ["hormigonera", "mixer", "construcción", "mezcla"],
  },
  {
    slug: "donde-comprar-elevador-de-autos-argentina",
    question: "¿Dónde comprar elevador de autos en Argentina?",
    category: "Dónde comprar maquinaria",
    answer:
      "Los elevadores para taller mecánico se consiguen en distribuidores de equipos para talleres y en Madsjeez. Existen elevadores de tijera, de columnas (2 y 4 postes) y de foso.",
    keyPoints: [
      "Los elevadores de 2 postes son los más usados en talleres medianos (capacidad 3–4 ton).",
      "Los de 4 postes son ideales para alineación y trabajos en la parte inferior del vehículo.",
      "Verificá la capacidad de elevación (toneladas), la altura máxima y el certificado de seguridad.",
      "Marcas: Ravaglioli, Hofmann, TotalKare, ICAR.",
    ],
    ctaText: "Ver elevadores de taller",
    ctaHref: "/marketplace",
    tags: ["elevador de autos", "taller mecánico", "lift", "2 postes"],
  },
  {
    slug: "donde-comprar-montacargas-autoelevador-argentina",
    question: "¿Dónde comprar autoelevador en Argentina?",
    category: "Dónde comprar maquinaria",
    answer:
      "Los autoelevadores o montacargas se consiguen en distribuidores especializados y en Madsjeez. Pueden ser eléctricos, a GLP (gas) o a gasolina, en distintas capacidades de carga.",
    keyPoints: [
      "Los autoelevadores eléctricos son ideales para trabajo en ambientes cerrados (depósitos, plantas).",
      "Las capacidades de carga más comunes en pymes van de 1.5 a 3 toneladas.",
      "El mantenimiento preventivo (hidráulico, neumáticos, baterías) es clave para la vida útil.",
      "Marcas: Toyota, Linde, Still, Caterpillar, Yale.",
    ],
    ctaText: "Ver autoelevadores",
    ctaHref: "/marketplace",
    tags: ["autoelevador", "montacargas", "forklift", "depósito"],
  },
  {
    slug: "donde-comprar-grua-hidraulica-argentina",
    question: "¿Dónde comprar grúa hidráulica de taller en Argentina?",
    category: "Dónde comprar maquinaria",
    answer:
      "Las grúas hidráulicas de taller (tipo crique o pluma) se consiguen en ferreterías industriales y en Madsjeez. Son esenciales para levantamiento de motores y transmisiones.",
    keyPoints: [
      "Las grúas de 2 toneladas son el estándar para talleres mecánicos de autos y camiones.",
      "Verificá el alcance del brazo y la capacidad de elevación en cada extensión.",
      "Opcionalmente, buscá modelos con ruedas giratorias para mejor maniobrabilidad.",
      "Marcas disponibles: Lusqtoff, Power Packer, Winntec.",
    ],
    ctaText: "Ver grúas hidráulicas",
    ctaHref: "/marketplace",
    tags: ["grúa hidráulica", "taller mecánico", "motor", "levantamiento"],
  },
  {
    slug: "donde-comprar-prensa-hidraulica-argentina",
    question: "¿Dónde comprar prensa hidráulica en Argentina?",
    category: "Dónde comprar maquinaria",
    answer:
      "Las prensas hidráulicas se consiguen en ferreterías industriales y en Madsjeez. Se usan para prensado de rodamientos, cojinetes, bujes y piezas en taller mecánico.",
    keyPoints: [
      "Las prensas de 10–20 toneladas son las más comunes para talleres de autos.",
      "Las prensas de 50–100 toneladas se usan para trabajo pesado con camiones y maquinaria vial.",
      "Verificá la distancia entre platos y la carrera del pistón según la pieza a prensar.",
      "Marcas: Lusqtoff, Crossmaster, Power Packer.",
    ],
    ctaText: "Ver prensas hidráulicas",
    ctaHref: "/marketplace",
    tags: ["prensa hidráulica", "taller", "prensado", "rodamientos"],
  },
  {
    slug: "donde-comprar-equipo-de-soldadura-mig-argentina",
    question: "¿Dónde comprar equipo de soldadura MIG/MAG en Argentina?",
    category: "Dónde comprar maquinaria",
    answer:
      "Los equipos MIG/MAG se consiguen en ferreterías industriales y en Madsjeez. Son ideales para soldadura continua en chapa fina, estructuras y acero inoxidable.",
    keyPoints: [
      "Para chapista automotriz, un MIG de 130–160A con hilo de 0,8mm es suficiente.",
      "Para taller estructural, buscá equipos de 200A o más con regulación de velocidad de hilo.",
      "Marcas: Lincoln Electric, ESAB, Miller, Fronius, Telwin.",
      "Verificá si el equipo requiere gas protector (CO₂ o mezcla Ar/CO₂) o trabaja con hilo tubular sin gas.",
    ],
    ctaText: "Ver equipos MIG/MAG",
    ctaHref: "/marketplace",
    tags: ["soldadora MIG", "MAG", "soldadura", "taller industrial"],
  },
  {
    slug: "donde-comprar-compresor-industrial-argentina",
    question: "¿Dónde comprar compresor industrial en Argentina?",
    category: "Dónde comprar maquinaria",
    answer:
      "Los compresores industriales se consiguen en distribuidores especializados y en Madsjeez. Para uso industrial continuo, los compresores de tornillo rotativo son los más eficientes.",
    keyPoints: [
      "Los compresores de tornillo ofrecen mayor flujo continuo y son más silenciosos que los de pistón.",
      "Para talleres con múltiples herramientas neumáticas, calculá el consumo acumulado de aire (CFM).",
      "Verificá el ciclo de trabajo del compresor: el 100% de ciclo de trabajo es ideal para uso continuo.",
      "Marcas: Atlas Copco, Kaeser, Fini, Ceccato.",
    ],
    ctaText: "Ver compresores industriales",
    ctaHref: "/marketplace",
    tags: ["compresor industrial", "tornillo rotativo", "CFM", "aire comprimido"],
  },
  {
    slug: "donde-comprar-herramientas-para-construccion-argentina",
    question: "¿Dónde comprar herramientas para construcción en Argentina?",
    category: "Dónde comprar maquinaria",
    answer:
      "Las herramientas para construcción (rotomartillos, vibradores de hormigón, cortadoras de piso, andamios) se consiguen en Madsjeez y en ferreterías especializadas en el rubro.",
    keyPoints: [
      "Para perforación de hormigón, los rotomartillos SDS+ son el estándar en obra.",
      "Los vibradores de hormigón son esenciales para compactar hormigón sin cangrejeras.",
      "Las cortadoras de piso (diamantinas) se usan para apertura de zanjas en pisos y veredas.",
      "Los andamios multidireccionales ofrecen mayor seguridad y versatilidad en altura.",
    ],
    ctaText: "Ver herramientas de construcción",
    ctaHref: "/marketplace",
    tags: ["construcción", "obra", "rotomartillo", "andamios", "hormigón"],
  },
  {
    slug: "donde-comprar-maquina-de-vapor-industrial-argentina",
    question: "¿Dónde comprar máquina de vapor industrial en Argentina?",
    category: "Dónde comprar maquinaria",
    answer:
      "Las máquinas de vapor industrial o lavadoras a vapor se consiguen en distribuidores de equipos de limpieza y en Madsjeez. Se usan para limpieza de motores, desengrase y lavado de tapizados.",
    keyPoints: [
      "Las lavadoras a vapor producen vapor saturado a alta temperatura para desengrase sin productos químicos.",
      "Las hidrolavadoras de agua caliente son más versátiles para lavado exterior de vehículos y maquinaria.",
      "Las presiones más comunes van de 100 a 250 bar para uso industrial.",
      "Marcas disponibles: Kärcher, Nilfisk, Kranzle.",
    ],
    ctaText: "Ver máquinas de vapor",
    ctaHref: "/marketplace",
    tags: ["máquina de vapor", "lavadora industrial", "limpieza industrial", "desengrase"],
  },

  // ── Cómo vender online (14) ───────────────────────────────────────────────
  {
    slug: "como-vender-herramientas-online-argentina",
    question: "¿Cómo vender herramientas online en Argentina?",
    category: "Cómo vender online",
    answer:
      "Para vender herramientas online en Argentina, la opción más eficiente es publicar en un marketplace especializado como Madsjeez, que ya tiene compradores del rubro buscando exactamente lo que vos vendés.",
    keyPoints: [
      "Madsjeez es gratuito los primeros 6 meses para nuevos vendedores.",
      "No cobramos comisión por venta: el 100% de lo que cobrás es tuyo.",
      "Publicás fotos, descripciones técnicas y precio, y llegás a compradores especializados.",
      "Recibís el pago a través de Mercado Pago de forma inmediata.",
    ],
    ctaText: "Empezar a vender gratis",
    ctaHref: "/seller/register",
    tags: ["vender herramientas", "online", "marketplace", "Argentina"],
  },
  {
    slug: "como-crear-tienda-online-de-herramientas",
    question: "¿Cómo crear una tienda online de herramientas?",
    category: "Cómo vender online",
    answer:
      "Crear una tienda online de herramientas en Madsjeez toma menos de 10 minutos: te registrás, cargás tu logo y descripción, y empezás a publicar productos.",
    keyPoints: [
      "El registro como vendedor es gratuito y no requiere CUIT activo para empezar.",
      "Personalizás tu tienda con logo, banner y descripción del negocio.",
      "Publicás productos con fotos, especificaciones técnicas y precio.",
      "Los compradores ven tu tienda como una tienda separada dentro del marketplace.",
    ],
    ctaText: "Crear mi tienda gratis",
    ctaHref: "/seller/register",
    tags: ["tienda online", "crear tienda", "herramientas", "ecommerce"],
  },
  {
    slug: "que-necesito-para-vender-en-madsjeez",
    question: "¿Qué necesito para vender en Madsjeez?",
    category: "Cómo vender online",
    answer:
      "Para vender en Madsjeez solo necesitás una cuenta de email, cuenta de Mercado Pago para recibir pagos, y fotos de tus productos. No se requiere CUIT para el registro inicial.",
    keyPoints: [
      "Registro gratuito en menos de 10 minutos.",
      "Cuenta de Mercado Pago para recibir pagos al instante.",
      "Al menos 1 foto por producto (recomendamos 4 o más desde distintos ángulos).",
      "Descripción técnica clara: modelo, marca, potencia, voltaje, peso, garantía.",
    ],
    ctaText: "Registrarme como vendedor",
    ctaHref: "/seller/register",
    tags: ["requisitos", "vendedor", "Madsjeez", "registro"],
  },
  {
    slug: "cuanto-cuesta-vender-en-un-marketplace",
    question: "¿Cuánto cuesta vender en un marketplace en Argentina?",
    category: "Cómo vender online",
    answer:
      "En la mayoría de los marketplaces el costo incluye comisión por venta (entre 7% y 17%), más costos de publicidad para destacar tus publicaciones. En Madsjeez la comisión es 0%.",
    keyPoints: [
      "Madsjeez cobra 0% de comisión por venta, siempre.",
      "Hay planes PRO ($2.999/mes) y ULTRA ($4.999/mes) con más publicaciones y funcionalidades.",
      "Los nuevos vendedores tienen 6 meses gratis con el plan PRO.",
      "Solo pagás Mercado Pago si usás la pasarela de cobro (las tarifas de MP aplican como siempre).",
    ],
    ctaText: "Ver planes de suscripción",
    ctaHref: "/subscriptions",
    tags: ["comisión", "costo", "marketplace", "vender online"],
  },
  {
    slug: "como-fotografiar-herramientas-para-vender-online",
    question: "¿Cómo fotografiar herramientas para vender online?",
    category: "Cómo vender online",
    answer:
      "Para vender herramientas online, las fotos deben mostrar el estado real del producto con luz natural o artificial neutra, fondo blanco o gris, y foco en los detalles técnicos.",
    keyPoints: [
      "Fotografiá desde al menos 4 ángulos: frente, lateral, perspectiva y detalle de la placa de datos.",
      "Usá fondo blanco o gris claro para que la herramienta resalte.",
      "Mostrá el contenido completo: si viene con maletín, accesorios o baterías, fotografialos juntos.",
      "Si hay desgaste o uso, fotografiá esas áreas también: genera confianza y evita devoluciones.",
    ],
    ctaText: "Empezar a vender",
    ctaHref: "/seller/register",
    tags: ["fotografía de productos", "vender online", "fotos herramientas", "ecommerce"],
  },
  {
    slug: "como-poner-precio-a-herramientas-usadas",
    question: "¿Cómo poner precio a herramientas usadas para vender?",
    category: "Cómo vender online",
    answer:
      "Para fijar el precio de herramientas usadas, una regla práctica es el 50–70% del precio de mercado actual según el estado de conservación, tiempo de uso y presencia de accesorios originales.",
    keyPoints: [
      "Buscá el precio de mercado actual del mismo modelo en Madsjeez o ferreterías.",
      "Si la herramienta está sin uso o poco usada, podés pedir hasta el 75–80% del valor nuevo.",
      "Con uso moderado y funcionando bien: 50–60% del valor nuevo.",
      "Herramienta con desgaste visible o sin garantía: 30–45% del valor nuevo.",
    ],
    ctaText: "Publicar herramienta usada",
    ctaHref: "/seller/register",
    tags: ["precio", "herramientas usadas", "segunda mano", "vender usado"],
  },
  {
    slug: "como-hacer-envios-de-herramientas-vendidas-online",
    question: "¿Cómo hacer envíos de herramientas vendidas online?",
    category: "Cómo vender online",
    answer:
      "Para enviar herramientas vendidas online usás Mercado Envíos, OCA, Andreani o cualquier transportista de confianza. El embalaje correcto es fundamental para evitar daños en tránsito.",
    keyPoints: [
      "Usá caja de cartón doble pared para herramientas pesadas o frágiles.",
      "Rellenás el espacio con burbujas plásticas o poliestireno para amortiguar golpes.",
      "Describí el contenido en el manifiesto del transportista para agilizar el despacho.",
      "Mercado Envíos ofrece tarifas negociadas y seguro de carga integrado.",
    ],
    ctaText: "Empezar a vender",
    ctaHref: "/seller/register",
    tags: ["envíos", "logística", "Mercado Envíos", "embalaje"],
  },
  {
    slug: "es-rentable-vender-herramientas-usadas-online",
    question: "¿Es rentable vender herramientas usadas online?",
    category: "Cómo vender online",
    answer:
      "Sí, vender herramientas usadas online es rentable especialmente si las comprás a bajo precio, las reparás o limpiás, y las vendés en un marketplace especializado como Madsjeez donde el comprador busca exactamente eso.",
    keyPoints: [
      "Las herramientas de marcas reconocidas (Bosch, Dewalt, Makita) conservan bien su valor de reventa.",
      "El mercado de herramientas segunda mano en Argentina es grande y creciente.",
      "En Madsjeez no pagás comisión, por lo que el margen de ganancia es mayor.",
      "La clave del negocio está en la verificación del funcionamiento y la descripción honesta.",
    ],
    ctaText: "Empezar a vender",
    ctaHref: "/seller/register",
    tags: ["herramientas usadas", "reventa", "rentabilidad", "segunda mano"],
  },
  {
    slug: "como-destacar-publicaciones-en-marketplace",
    question: "¿Cómo destacar publicaciones en un marketplace?",
    category: "Cómo vender online",
    answer:
      "Para destacar en un marketplace usás fotos de calidad, títulos con palabras clave técnicas, precio competitivo, buenas valoraciones de otros compradores y respondés rápido las consultas.",
    keyPoints: [
      "El título debe incluir: marca, modelo, potencia o capacidad y el término más buscado.",
      "Ejemplo: 'Taladro Percutor Bosch GSB 650 RE 650W' es mejor que 'Taladro Bosch'.",
      "Respondé consultas en menos de 1 hora para mejor posicionamiento.",
      "Los vendedores con 4.5 estrellas o más aparecen primero en los resultados.",
    ],
    ctaText: "Crear mi tienda",
    ctaHref: "/seller/register",
    tags: ["destacar", "posicionamiento", "marketplace", "SEO de productos"],
  },
  {
    slug: "cuales-herramientas-se-venden-mas-online-argentina",
    question: "¿Qué herramientas se venden más online en Argentina?",
    category: "Cómo vender online",
    answer:
      "Las herramientas eléctricas más vendidas online en Argentina son taladros, amoladoras, atornilladores a batería y sierras circulares, seguidas por compresores y soldadoras.",
    keyPoints: [
      "El taladro es la herramienta más buscada online en Argentina, especialmente la marca Bosch.",
      "Las amoladoras angulares de 4½\" tienen alta rotación en ferreterías online.",
      "Los kits de herramientas (combo) son populares como regalo y para quien empieza.",
      "Las herramientas inalámbricas crecen más rápido que las eléctricas con cable.",
    ],
    ctaText: "Ver qué se busca en Madsjeez",
    ctaHref: "/marketplace",
    tags: ["más vendidos", "demanda", "taladros", "amoladoras", "tendencias"],
  },
  {
    slug: "puedo-vender-herramientas-sin-factura-argentina",
    question: "¿Puedo vender herramientas online sin factura en Argentina?",
    category: "Cómo vender online",
    answer:
      "Las personas físicas pueden vender herramientas usadas sin factura (como particulares). Para vender de forma recurrente o comercial, es necesario estar inscripto como monotributista.",
    keyPoints: [
      "Las ventas como particular no requieren factura si son esporádicas y de bienes propios.",
      "Si vendés de forma habitual, el fisco puede requerirte que te inscribas en monotributo.",
      "El monotributo categoría A es el más económico y tiene un tope de facturación anual.",
      "Los marketplaces como Madsjeez no exigen factura para registrarte, pero sí para escalar el volumen.",
    ],
    ctaText: "Registrarme como vendedor",
    ctaHref: "/seller/register",
    tags: ["factura", "monotributo", "particular", "impuestos"],
  },
  {
    slug: "como-gestionar-devoluciones-herramientas-online",
    question: "¿Cómo gestionar devoluciones de herramientas vendidas online?",
    category: "Cómo vender online",
    answer:
      "Para gestionar devoluciones de herramientas, tené una política clara de devoluciones publicada en tu tienda. La Ley de Defensa del Consumidor otorga 10 días para arrepentimiento en ventas online.",
    keyPoints: [
      "La Ley 24.240 otorga 10 días corridos para devolver compras online sin expresar causa.",
      "Para devoluciones fuera de plazo, evaluá caso por caso: tu reputación vale más que una venta.",
      "Documentá el estado del producto con fotos antes del despacho para evitar disputas.",
      "En Madsjeez, el sistema de resolución de disputas ayuda a mediar entre vendedor y comprador.",
    ],
    ctaText: "Ver política de Madsjeez",
    ctaHref: "/ayuda-vendedores",
    tags: ["devoluciones", "arrepentimiento", "Defensa del Consumidor", "política de devoluciones"],
  },
  {
    slug: "como-aumentar-ventas-en-marketplace-herramientas",
    question: "¿Cómo aumentar las ventas en un marketplace de herramientas?",
    category: "Cómo vender online",
    answer:
      "Para aumentar las ventas en un marketplace de herramientas hay que trabajar en: precio competitivo, fotos profesionales, descripción técnica completa y atención rápida al cliente.",
    keyPoints: [
      "Actualizá los precios periódicamente para mantenerte competitivo.",
      "Respondé las preguntas en menos de 1 hora: impacta directamente en la conversión.",
      "Usá las funcionalidades de la tienda: descripción extendida, videos, preguntas frecuentes.",
      "Pedí a tus compradores satisfechos que dejen una calificación.",
    ],
    ctaText: "Ver mi panel de vendedor",
    ctaHref: "/seller/register",
    tags: ["aumentar ventas", "conversión", "marketplace", "vendedores"],
  },
  {
    slug: "cuanto-tiempo-tarda-cobrar-venta-online",
    question: "¿Cuánto tiempo tarda en acreditarse el dinero de una venta online?",
    category: "Cómo vender online",
    answer:
      "Con Mercado Pago, el dinero de una venta online se acredita en el momento en que el comprador confirma la recepción o automáticamente a los 3–7 días según el plan.",
    keyPoints: [
      "Con Madsjeez y Mercado Pago, la acreditación es inmediata al confirmarse la entrega.",
      "Si el comprador no confirma, el pago se libera automáticamente dentro de los 7 días.",
      "Transferís desde tu cuenta de Mercado Pago al instante a cualquier CBU/CVU.",
      "No hay retención adicional de nuestra parte: el dinero es tuyo desde el primer momento.",
    ],
    ctaText: "Empezar a vender",
    ctaHref: "/seller/register",
    tags: ["cobrar", "Mercado Pago", "acreditación", "tiempo de pago"],
  },

  // ── Comparativas de productos (14) ────────────────────────────────────────
  {
    slug: "bosch-vs-dewalt-cual-es-mejor",
    question: "¿Bosch o Dewalt: cuál es mejor?",
    category: "Comparativas de productos",
    answer:
      "Bosch y Dewalt son dos de las mejores marcas de herramientas del mundo. Bosch destaca en precisión y ergonomía; Dewalt en potencia bruta y durabilidad en obra pesada. La elección depende del uso.",
    keyPoints: [
      "Para electricistas y carpintería de precisión: Bosch Professional es la opción tradicional.",
      "Para obra gruesa, construcción y trabajo pesado: Dewalt XR tiene ventaja en potencia y robustez.",
      "Las plataformas de baterías son incompatibles entre sí: elegí una y seguí con ella.",
      "En Argentina, Bosch tiene mayor penetración de mercado y más servicio técnico disponible.",
    ],
    ctaText: "Comparar en Madsjeez",
    ctaHref: "/comparativas",
    tags: ["Bosch", "Dewalt", "comparativa", "herramientas profesionales"],
  },
  {
    slug: "milwaukee-vs-makita-herramientas-inalambricas",
    question: "¿Milwaukee o Makita: cuál es mejor para herramientas inalámbricas?",
    category: "Comparativas de productos",
    answer:
      "Milwaukee M18 FUEL y Makita LXT 18V son las dos mejores plataformas inalámbricas del mercado. Milwaukee tiene mayor potencia en aplicaciones exigentes; Makita ofrece mejor catálogo y precio más accesible.",
    keyPoints: [
      "Milwaukee M18 FUEL tiene motores POWERSTATE con brushless de alta performance.",
      "Makita LXT 18V tiene el catálogo más grande del mercado (más de 300 herramientas compatibles).",
      "En relación calidad/precio, Makita suele ser más accesible para el mercado argentino.",
      "Milwaukee ofrece 5 años de garantía en herramientas; Makita, 3 años.",
    ],
    ctaText: "Ver comparativa completa",
    ctaHref: "/comparativas",
    tags: ["Milwaukee", "Makita", "inalámbricas", "M18", "LXT"],
  },
  {
    slug: "taladro-percutor-vs-rotomartillo-diferencia",
    question: "¿Cuál es la diferencia entre taladro percutor y rotomartillo?",
    category: "Comparativas de productos",
    answer:
      "El taladro percutor es para perforación ligera en mampostería; el rotomartillo (SDS) es para perforación y demolición en hormigón armado. La diferencia está en el sistema de golpe.",
    keyPoints: [
      "El taladro percutor usa un sistema de percusión mecánico (dentado): adecuado para ladrillo y bloques.",
      "El rotomartillo SDS+ tiene percusión neumática: mucho más potente, para hormigón y granito.",
      "Para tareas de hogar: el percutor es suficiente. Para obra o remodelación seria: el rotomartillo.",
      "Los rotomartillos además tienen modo cincelado (demolición) que los percutores no tienen.",
    ],
    ctaText: "Ver taladros y rotomartillos",
    ctaHref: "/comparativas",
    tags: ["taladro percutor", "rotomartillo", "SDS", "diferencia", "hormigón"],
  },
  {
    slug: "amoladora-4-vs-7-pulgadas-cual-usar",
    question: "¿Amoladora de 4½\" o de 7\": cuál usar?",
    category: "Comparativas de productos",
    answer:
      "La amoladora de 4½\" (115–125mm) es para trabajos livianos, cortes precisos y desbaste en espacios reducidos. La de 7\" (180mm) es para cortes más profundos y desbaste pesado en obra.",
    keyPoints: [
      "La amoladora de 4½\" es más liviana, manejable y segura para usuarios menos experimentados.",
      "La de 7\" corta chapas y perfiles más gruesos, pero requiere más experiencia y fuerza.",
      "Los discos de 4½\" son más baratos y fáciles de conseguir en ferreterías.",
      "Para trabajo doméstico y pequeñas obras: 4½\". Para construcción pesada: 7\".",
    ],
    ctaText: "Ver amoladoras",
    ctaHref: "/comparativas",
    tags: ["amoladora", "4.5 pulgadas", "7 pulgadas", "disco", "comparativa"],
  },
  {
    slug: "inverter-vs-transformadora-soldadora-cual-elegir",
    question: "¿Soldadora inverter o transformadora: cuál elegir?",
    category: "Comparativas de productos",
    answer:
      "La soldadora inverter es más liviana, eficiente y versátil; la transformadora es más robusta y económica. Para uso moderno, la inverter es casi siempre la mejor opción.",
    keyPoints: [
      "La inverter consume hasta 40% menos de electricidad que la transformadora.",
      "La inverter pesa entre 3–8 kg; la transformadora supera los 20 kg.",
      "La inverter permite soldar con electrodos de celulosíco y rutilo; la transformadora, solo rutilo básico.",
      "La transformadora es más resistente al abuso en ambientes polvorientos o extremos.",
    ],
    ctaText: "Ver soldadoras",
    ctaHref: "/comparativas",
    tags: ["soldadora", "inverter", "transformadora", "comparativa", "electrodo"],
  },
  {
    slug: "sierra-caladora-vs-sierra-circular-cual-usar",
    question: "¿Sierra caladora o sierra circular: cuál usar?",
    category: "Comparativas de productos",
    answer:
      "La sierra caladora es para cortes curvos y recortes; la sierra circular es para cortes rectos en material grueso. Son herramientas complementarias, no equivalentes.",
    keyPoints: [
      "La sierra caladora corta curvas, formas irregulares y recortes interiores.",
      "La sierra circular corta en línea recta con mayor velocidad y precisión en maderas gruesas.",
      "Para carpintería que necesita ambos tipos de corte, conviene tener las dos.",
      "Si solo podés tener una para madera: la circular es más versátil para cortes en panel.",
    ],
    ctaText: "Ver sierras",
    ctaHref: "/comparativas",
    tags: ["sierra caladora", "sierra circular", "carpintería", "corte de madera"],
  },
  {
    slug: "lijadora-de-banda-vs-lijadora-orbital-diferencias",
    question: "¿Lijadora de banda o lijadora orbital: cuáles son las diferencias?",
    category: "Comparativas de productos",
    answer:
      "La lijadora de banda es agresiva y rápida para remover material; la orbital es más suave y deja mejor acabado. Se usan en etapas diferentes del mismo trabajo.",
    keyPoints: [
      "La lijadora de banda remueve capas de pintura, barniz o madera rápidamente.",
      "La lijadora orbital de acabado deja superficies lisas para pintar o barnizar.",
      "Para restauración de muebles: se empieza con banda (grano grueso) y se termina con orbital (grano fino).",
      "Las lijadoras excéntricas (roto-orbitales) son las más versátiles del grupo.",
    ],
    ctaText: "Ver lijadoras",
    ctaHref: "/comparativas",
    tags: ["lijadora de banda", "lijadora orbital", "lijado", "carpintería"],
  },
  {
    slug: "pistola-de-calor-vs-decapador-diferencias",
    question: "¿Pistola de calor o decapador químico: cuál usar para remover pintura?",
    category: "Comparativas de productos",
    answer:
      "La pistola de calor es más rápida, segura y efectiva para remover pintura en madera; el decapador químico es para superficies con molduras complejas donde el calor no llega bien.",
    keyPoints: [
      "La pistola de calor ablanda la pintura en segundos y permite rasparla limpiamente.",
      "El decapador químico penetra en ranuras y molduras pero requiere tiempo de reacción y mejor ventilación.",
      "Para madera exterior o puertas: pistola de calor + espátula triangular es la combinación ideal.",
      "Para metalwork: el decapador químico es más seguro que el calor en superficies delgadas.",
    ],
    ctaText: "Ver pistolas de calor",
    ctaHref: "/comparativas",
    tags: ["pistola de calor", "decapador", "remover pintura", "madera"],
  },
  {
    slug: "compresor-de-piston-vs-tornillo-cual-comprar",
    question: "¿Compresor de pistón o de tornillo: cuál comprar?",
    category: "Comparativas de productos",
    answer:
      "El compresor de pistón es para uso intermitente y costo bajo; el de tornillo (rotativo) es para uso continuo, más silencioso y de mayor vida útil.",
    keyPoints: [
      "Los compresores de pistón tienen un ciclo de trabajo del 50–70%: necesitan descanso entre usos.",
      "Los de tornillo rotativo tienen ciclo del 100%: ideales para uso continuo en talleres y plantas.",
      "El costo del tornillo es 3–5 veces mayor al de pistón equivalente.",
      "Para pintura, inflado y herramientas livianas: pistón. Para producción continua: tornillo.",
    ],
    ctaText: "Ver compresores",
    ctaHref: "/comparativas",
    tags: ["compresor pistón", "compresor tornillo", "ciclo de trabajo", "comparativa"],
  },
  {
    slug: "martillo-neumatico-vs-electrico-cual-es-mejor",
    question: "¿Martillo neumático o eléctrico: cuál es mejor?",
    category: "Comparativas de productos",
    answer:
      "El martillo neumático tiene más potencia de golpe y es más liviano; el eléctrico es más práctico y no requiere compresor. Para trabajo continuo de demolición, el neumático es superior.",
    keyPoints: [
      "Los martillos neumáticos (picadoras neumáticas) ofrecen más ciclos por minuto y no se calientan.",
      "El eléctrico es más cómodo en obras donde no hay compresor disponible.",
      "Para demolición continua de pisos y mampostería: neumático con compresor de 100L o más.",
      "El costo total de uso del neumático incluye el compresor, mangueras y lubricante de línea.",
    ],
    ctaText: "Ver martillos demoledores",
    ctaHref: "/comparativas",
    tags: ["martillo neumático", "martillo eléctrico", "demolición", "comparativa"],
  },
  {
    slug: "hidrolavadora-fria-vs-caliente-diferencias",
    question: "¿Hidrolavadora de agua fría o caliente: cuál es mejor?",
    category: "Comparativas de productos",
    answer:
      "La hidrolavadora de agua caliente limpia mejor grasa y aceite en menos tiempo; la de agua fría es suficiente para suciedad general y es más económica.",
    keyPoints: [
      "El agua caliente disuelve grasa sin necesidad de detergente, ideal para talleres y motores.",
      "Las hidrolavadoras de agua fría son más baratas, más livianas y de menor mantenimiento.",
      "Para lavado de vehículos: agua fría es suficiente. Para motores y piezas industriales: agua caliente.",
      "Las de agua caliente consumen más energía y tienen mayor complejidad de mantenimiento.",
    ],
    ctaText: "Ver hidrolavadoras",
    ctaHref: "/comparativas",
    tags: ["hidrolavadora", "agua caliente", "agua fría", "karcher", "limpieza"],
  },
  {
    slug: "nivel-laser-verde-vs-rojo-diferencia",
    question: "¿Nivel láser verde o rojo: cuál es la diferencia?",
    category: "Comparativas de productos",
    answer:
      "El láser verde es hasta 4 veces más visible que el rojo, especialmente en ambientes iluminados. El rojo consume menos batería y es más económico.",
    keyPoints: [
      "Para trabajo en ambientes iluminados o al aire libre: láser verde es mucho más visible.",
      "Para trabajo en ambientes controlados o poco iluminados: el rojo es suficiente y más económico.",
      "El láser verde demanda más batería (la luz verde requiere más energía para generarse).",
      "Los modelos de referencia: Bosch GLL 3-80CG (verde) y GLL 3-80 (rojo).",
    ],
    ctaText: "Ver niveles láser",
    ctaHref: "/comparativas",
    tags: ["nivel láser verde", "nivel láser rojo", "visibilidad", "comparativa"],
  },
  {
    slug: "bateria-litio-vs-niquel-cadmio-herramientas",
    question: "¿Batería de litio o níquel-cadmio en herramientas?",
    category: "Comparativas de productos",
    answer:
      "Las baterías de litio (Li-Ion) reemplazaron casi totalmente a las de Ni-Cd en herramientas modernas. Son más livianas, se cargan más rápido y no tienen efecto memoria.",
    keyPoints: [
      "Las baterías Li-Ion no tienen 'efecto memoria': podés cargarlas en cualquier momento.",
      "Las Li-Ion tienen mayor densidad de energía: más trabajo por kg de batería.",
      "Las Ni-Cd toleran mejor las temperaturas extremas y los abusos, pero son pesadas y contaminantes.",
      "Hoy solo equipos muy viejos o industriales específicos usan Ni-Cd. Li-Ion es el estándar actual.",
    ],
    ctaText: "Ver herramientas inalámbricas",
    ctaHref: "/marketplace",
    tags: ["batería litio", "níquel cadmio", "Li-Ion", "NiCd", "comparativa"],
  },
  {
    slug: "sierra-de-mesa-vs-sierra-de-brazo-diferencias",
    question: "¿Sierra de mesa o sierra de brazo radial: cuáles son las diferencias?",
    category: "Comparativas de productos",
    answer:
      "La sierra de mesa (circular fija) es para cortes a lo largo (rip cuts); la de brazo radial y la ingletadora son para cortes cruzados o a ángulo. Son complementarias en carpintería.",
    keyPoints: [
      "La sierra de mesa (mesa de sierra) es ideal para partir tableros a lo largo.",
      "La ingletadora (sierra de brazo) es ideal para cortes angulados, molduras y marcos.",
      "La sierra de brazo radial combina ambas funciones pero requiere más espacio y calibración.",
      "Para un taller chico con espacio limitado: sierra circular portátil + ingletadora.",
    ],
    ctaText: "Ver sierras de taller",
    ctaHref: "/comparativas",
    tags: ["sierra de mesa", "sierra de brazo", "ingletadora", "carpintería"],
  },

  // ── Repuestos y accesorios (14) ───────────────────────────────────────────
  {
    slug: "donde-conseguir-repuestos-herramientas-bosch-argentina",
    question: "¿Dónde conseguir repuestos para herramientas Bosch en Argentina?",
    category: "Repuestos y accesorios",
    answer:
      "Los repuestos para herramientas Bosch se consiguen en el servicio técnico oficial, en ferreterías especializadas y en Madsjeez, donde vendedores especializados ofrecen repuestos y accesorios.",
    keyPoints: [
      "El servicio técnico oficial Bosch Argentina tiene centros en las principales ciudades.",
      "Las piezas más comunes (carbones, engranajes, interruptores) están disponibles en stock.",
      "Para herramientas viejas (más de 10 años), los repuestos pueden estar descontinuados.",
      "En Madsjeez encontrás vendedores especializados en repuestos y accesorios de todas las marcas.",
    ],
    ctaText: "Buscar repuestos",
    ctaHref: "/marketplace",
    tags: ["repuestos Bosch", "servicio técnico", "accesorios", "refacciones"],
  },
  {
    slug: "que-discos-usan-las-amoladoras",
    question: "¿Qué discos usan las amoladoras angulares?",
    category: "Repuestos y accesorios",
    answer:
      "Las amoladoras angulares usan discos de corte (1–1,6mm de espesor), discos de desbaste (6–8mm) y discos de lija (fibra vulcanizada). El diámetro debe coincidir con el de la amoladora.",
    keyPoints: [
      "Discos de corte (fino): para sección de metal, caño o perfiles estructurales.",
      "Discos de desbaste (grueso): para eliminar material, preparar cordones de soldadura.",
      "Discos diamantados: para corte de cerámicos, mármol y hormigón.",
      "Verificá que la velocidad máxima del disco sea mayor a la RPM de la amoladora.",
    ],
    ctaText: "Ver discos y accesorios",
    ctaHref: "/marketplace",
    tags: ["discos amoladora", "disco de corte", "disco de desbaste", "diamantado"],
  },
  {
    slug: "que-broca-usar-para-hormigon",
    question: "¿Qué broca usar para hormigón?",
    category: "Repuestos y accesorios",
    answer:
      "Para perforar hormigón se usan brocas con punta de carburo de tungsteno (widia), también llamadas brocas para mampostería o brocas SDS para rotomartillo.",
    keyPoints: [
      "Las brocas SDS+ son para rotomartillos y tienen mayor eficiencia de impacto.",
      "Las brocas para mampostería estándar van en taladros percutores para hormigón liviano.",
      "Para hormigón muy duro o armado, las coronas diamantadas con extracción de polvo son la mejor opción.",
      "Refrescá las brocas ocasionalmente con agua para bajar la temperatura y alargar su vida útil.",
    ],
    ctaText: "Ver brocas para mampostería",
    ctaHref: "/marketplace",
    tags: ["brocas para hormigón", "SDS", "widia", "rotomartillo", "mampostería"],
  },
  {
    slug: "que-hoja-de-sierra-usar-para-madera",
    question: "¿Qué hoja de sierra usar para madera?",
    category: "Repuestos y accesorios",
    answer:
      "La elección de hoja de sierra para madera depende del tipo de corte: para cortes rápidos (rip), hojas de pocos dientes; para acabados finos (cross-cut), hojas de muchos dientes.",
    keyPoints: [
      "Para cortes en bruto a lo largo de la veta: hoja de 24 dientes (sierra circular).",
      "Para cortes finos y molduras: hoja de 60–80 dientes con recubrimiento teflón.",
      "Las hojas con carburo (TCT) duran más que las de acero convencional.",
      "El diámetro de la hoja debe coincidir con el de la sierra (160mm, 184mm, 210mm, etc.).",
    ],
    ctaText: "Ver hojas de sierra",
    ctaHref: "/marketplace",
    tags: ["hoja de sierra", "dientes", "carpintería", "corte de madera"],
  },
  {
    slug: "que-electrodo-usar-para-soldar-acero",
    question: "¿Qué electrodo usar para soldar acero?",
    category: "Repuestos y accesorios",
    answer:
      "Para soldar acero al carbono se usan principalmente dos tipos: electrodo rutílico (E6013) para uso general y posición plana, y electrodo celulósico (E6010/E6011) para posición vertical y caño.",
    keyPoints: [
      "El E6013 (rutílico) es el más fácil de usar: buena escoria, arco suave y buen aspecto.",
      "El E7018 (bajo hidrógeno) es para estructuras de alta resistencia y planchas gruesas.",
      "El E6010 o E6011 (celulósico) penetra bien en caños y posiciones difíciles.",
      "El diámetro del electrodo debe ser menor o igual al espesor del material a soldar.",
    ],
    ctaText: "Ver electrodos de soldadura",
    ctaHref: "/marketplace",
    tags: ["electrodo", "E6013", "E7018", "soldadura", "acero"],
  },
  {
    slug: "que-aceite-usar-para-herramientas-neumaticas",
    question: "¿Qué aceite usar para herramientas neumáticas?",
    category: "Repuestos y accesorios",
    answer:
      "Para herramientas neumáticas (pistolas, picadoras, pulidoras) se usa aceite lubricante para herramientas neumáticas o aceite ISO VG 22, que mantiene los mecanismos internos libres de desgaste.",
    keyPoints: [
      "Agregá 3–5 gotas de aceite directamente en el acople de la herramienta antes de cada uso.",
      "Usá aceite especial para neumáticas (bajo nivel de aditivos que dañen los sellos).",
      "Los lubricadores en línea automatizan el proceso: ajustá a 2–5 gotas por minuto.",
      "NUNCA uses aceite WD-40 en neumáticas: no lubrica adecuadamente y daña los sellos.",
    ],
    ctaText: "Ver accesorios neumáticos",
    ctaHref: "/marketplace",
    tags: ["aceite neumático", "lubricante", "herramientas neumáticas", "mantenimiento"],
  },
  {
    slug: "que-carbones-llevan-las-herramientas-electricas",
    question: "¿Cómo sé cuándo cambiar los carbones de una herramienta eléctrica?",
    category: "Repuestos y accesorios",
    answer:
      "Los carbones (escobillas de grafito) deban cambiarse cuando chisporrotean mucho, cuando la herramienta pierde potencia o cuando el indicador de desgaste (si existe) lo indica.",
    keyPoints: [
      "La mayoría de los carbones tienen una longitud mínima de 6–8mm antes de requerir cambio.",
      "Si la herramienta emite chispas excesivas o apaga sola, los carbones están agotados.",
      "Cambiá ambos carbones al mismo tiempo para equilibrar el desgaste.",
      "Los carbones son específicos para cada motor: verificá el modelo antes de comprar.",
    ],
    ctaText: "Buscar repuestos",
    ctaHref: "/marketplace",
    tags: ["carbones", "escobillas", "motor", "repuestos eléctricos"],
  },
  {
    slug: "que-lija-usar-para-madera-antes-de-pintar",
    question: "¿Qué lija usar para madera antes de pintar?",
    category: "Repuestos y accesorios",
    answer:
      "El proceso de lijado antes de pintar madera va de granulometría gruesa a fina: comenzar con grano 80–120 para nivelar, luego 150–180 para alisar y terminar con 220–240 para la capa final.",
    keyPoints: [
      "Grano 80: eliminación de material, decapado de pintura vieja.",
      "Grano 120–150: preparación general de la superficie.",
      "Grano 180–220: entre manos de pintura o barniz.",
      "Grano 320–400: acabado muy fino para lacas o selladores especiales.",
    ],
    ctaText: "Ver lijas y abrasivos",
    ctaHref: "/marketplace",
    tags: ["lija", "abrasivo", "granulometría", "preparación para pintar"],
  },
  {
    slug: "como-elegir-el-disco-de-sierra-correcto",
    question: "¿Cómo elegir el disco de sierra correcto para cada material?",
    category: "Repuestos y accesorios",
    answer:
      "Para elegir el disco de sierra correcto hay que considerar el material a cortar, el diámetro compatible con la sierra y el número de dientes apropiado para el tipo de corte.",
    keyPoints: [
      "Madera blanda y rápida: 24–40 dientes.",
      "Madera dura y laminados: 60–80 dientes con recubrimiento.",
      "Aluminio y metales no ferrosos: disco de carburo especial para no-ferrosos.",
      "Acero: disco diamantado abrasivo o sierra de arco metálico.",
    ],
    ctaText: "Ver discos de sierra",
    ctaHref: "/marketplace",
    tags: ["disco de sierra", "dientes", "material", "carpintería", "metal"],
  },
  {
    slug: "que-brocas-usar-para-acero-inoxidable",
    question: "¿Qué brocas usar para perforar acero inoxidable?",
    category: "Repuestos y accesorios",
    answer:
      "Para perforar acero inoxidable necesitás brocas de cobalto (HSS-Co) o brocas de acero rápido bimetálicas. Trabajá a baja velocidad, con lubricante de corte y presión constante.",
    keyPoints: [
      "Las brocas de cobalto 5–8% (HSS-Co) son las más efectivas para inoxidable.",
      "Trabajá a velocidad baja (200–400 RPM para brocas de 6mm).",
      "Usá taladrina, aceite de corte o incluso vaselina como lubricante.",
      "Presión constante y continua: si parás la presión, el material se endurece por acritud.",
    ],
    ctaText: "Ver brocas especiales",
    ctaHref: "/marketplace",
    tags: ["brocas inoxidable", "HSS-Co", "cobalto", "perforación", "acero"],
  },
  {
    slug: "que-cable-de-extension-usar-para-herramientas",
    question: "¿Qué extensión eléctrica usar para herramientas eléctricas?",
    category: "Repuestos y accesorios",
    answer:
      "Para herramientas eléctricas es fundamental usar extensiones con sección de cable adecuada a la potencia y longitud: a mayor distancia y potencia, mayor sección de cable necesaria.",
    keyPoints: [
      "Para herramientas hasta 1.500W hasta 10m: cable 2,5mm² es suficiente.",
      "Para herramientas de 1.500–3.000W o distancias de 25–50m: cable 4mm².",
      "NUNCA uses extensiones livianas de 0,75mm² con herramientas: se recalientan y son peligrosas.",
      "Los carretes deben desplegarse completamente durante el uso para evitar sobrecalentamiento.",
    ],
    ctaText: "Ver extensiones eléctricas",
    ctaHref: "/marketplace",
    tags: ["extensión eléctrica", "cable", "sección", "seguridad eléctrica"],
  },
  {
    slug: "como-elegir-guantes-de-trabajo-correctos",
    question: "¿Cómo elegir guantes de trabajo correctos?",
    category: "Repuestos y accesorios",
    answer:
      "Los guantes de trabajo se eligen según el riesgo: para herramientas de corte, guantes anticorte nivel 3 o más; para soldadura, guantes de cuero; para trabajo general, guantes de poliuretano o nitrilo.",
    keyPoints: [
      "Guantes anticorte (nivel A4–A9 según EN ISO 13997): para manejo de discos y chapa.",
      "Guantes de cuero tipo vaqueta: para soldadura MIG, TIG y protección térmica.",
      "Guantes de nitrilo o látex: para manipulación de aceites, grasas y químicos.",
      "Evitá usar guantes de algodón o tela con herramientas rotativas: se pueden enganchar.",
    ],
    ctaText: "Ver EPP y seguridad",
    ctaHref: "/marketplace",
    tags: ["guantes de trabajo", "EPP", "seguridad", "anticorte"],
  },
  {
    slug: "cuando-cambiar-filtros-de-compresor-de-aire",
    question: "¿Cuándo y cómo cambiar los filtros del compresor de aire?",
    category: "Repuestos y accesorios",
    answer:
      "Los filtros de aire del compresor deben cambiarse cada 500–1.000 horas de trabajo o una vez al año, lo que ocurra primero. Un filtro sucio reduce el rendimiento y puede dañar el compresor.",
    keyPoints: [
      "El filtro de entrada de aire evita que el polvo ingrese al cilindro o rotor del compresor.",
      "Limpiá el filtro mensualmente con aire comprimido si el ambiente es polvoriento.",
      "Reemplazá el filtro de aceite cada 500 horas en compresores de tornillo con aceite.",
      "Drenate el agua del tanque diariamente o al finalizar cada jornada de trabajo.",
    ],
    ctaText: "Ver repuestos de compresor",
    ctaHref: "/marketplace",
    tags: ["filtro compresor", "mantenimiento", "repuestos", "servicio"],
  },
  {
    slug: "que-accesorios-necesita-una-soldadora-mig",
    question: "¿Qué accesorios necesita una soldadora MIG?",
    category: "Repuestos y accesorios",
    answer:
      "Una soldadora MIG requiere: hilo de soldadura, gas protector (o flux core si es sin gas), boquillas y difusores de recambio, pinza de masa y máscara de soldador.",
    keyPoints: [
      "El hilo de soldadura más común es AWS ER70S-6 de 0,8mm para acero al carbono.",
      "El gas protector más económico es CO₂ puro; la mezcla 75% Ar + 25% CO₂ da mejor terminación.",
      "Las boquillas y difusores deben limpiarse o cambiarse regularmente para evitar proyecciones.",
      "La máscara autooscurecente con cristal inteligente es la más práctica para uso frecuente.",
    ],
    ctaText: "Ver accesorios de soldadura",
    ctaHref: "/marketplace",
    tags: ["accesorios MIG", "hilo de soldadura", "gas protector", "boquilla"],
  },

  // ── Uso y técnica (14) ────────────────────────────────────────────────────
  {
    slug: "como-usar-taladro-correctamente",
    question: "¿Cómo usar un taladro correctamente?",
    category: "Uso y técnica",
    answer:
      "Para usar un taladro correctamente: elegí la broca correcta para el material, ajustá el torque según la aplicación, trabajá perpendicular a la superficie y usá velocidad adecuada.",
    keyPoints: [
      "Para mampostería usá modo percutor; para madera y metal, modo taladro sin percusión.",
      "Ajustá el embrague (torque) al nivel adecuado: más bajo para tornillos pequeños, más alto para grandes.",
      "Hacé un punto de partida con punzón o taladro piloto para evitar que la broca resbale.",
      "Trabajá siempre con lentes de seguridad: los fragmentos pueden alcanzar los ojos.",
    ],
    ctaText: "Ver taladros",
    ctaHref: "/marketplace",
    tags: ["cómo usar taladro", "técnica", "perforación", "uso correcto"],
  },
  {
    slug: "como-soldar-con-electrodo-revestido-paso-a-paso",
    question: "¿Cómo soldar con electrodo revestido paso a paso?",
    category: "Uso y técnica",
    answer:
      "La soldadura con electrodo revestido (SMAW) requiere: preparar la superficie, ajustar la corriente según el electrodo, encender el arco con movimiento de rascado y mantener distancia de arco constante.",
    keyPoints: [
      "Limpiar el metal: eliminar óxido, pintura y grasa con amoladora o cepillo de acero.",
      "Configurar la corriente: para E6013 de 2,5mm, una corriente de 70–90A en DC+ es correcta.",
      "Encendido del arco: técnica de rascado sobre el metal, luego mantener distancia de 2–3mm.",
      "Movimiento del electrodo: avanzar a velocidad constante; inclinado 15–20° en dirección de avance.",
    ],
    ctaText: "Ver soldadoras",
    ctaHref: "/marketplace",
    tags: ["soldadura electrodo", "SMAW", "técnica de soldadura", "paso a paso"],
  },
  {
    slug: "como-cortar-ceramica-sin-sierra-diamantada",
    question: "¿Cómo cortar cerámica sin sierra diamantada?",
    category: "Uso y técnica",
    answer:
      "Sin sierra diamantada podés cortar cerámica con cortadora manual de platino (para lineas rectas), o con amoladora y disco diamantado (para curvas). La cortadora manual es la más limpia para línea recta.",
    keyPoints: [
      "La cortadora manual de platino marca la cerámica con una ruedita de carburo y la parte al golpe.",
      "La amoladora con disco diamantado permite curvas y recortes pero produce mucho polvo (usá agua).",
      "Para agujeros circulares (caños, llave de luz): corona diamantada para cerámica con agua.",
      "Protección obligatoria: máscara de polvo FFP2 y lentes al cortar cerámica.",
    ],
    ctaText: "Ver herramientas para cerámica",
    ctaHref: "/marketplace",
    tags: ["cortar cerámica", "disco diamantado", "cortadora", "alicatado"],
  },
  {
    slug: "como-mantener-herramientas-electricas",
    question: "¿Cómo mantener herramientas eléctricas para que duren más?",
    category: "Uso y técnica",
    answer:
      "Para alargar la vida de las herramientas eléctricas: limpiá después de cada uso, no sobrecargues el motor, cambiá carbones a tiempo y guardá en lugar seco.",
    keyPoints: [
      "Soplá el polvo de las ventilaciones con aire comprimido después de cada uso.",
      "Evitá el trabajo continuado que sobrecaliente el motor: respetá los ciclos de trabajo.",
      "Cambiá los carbones antes de que lleguen al mínimo para evitar daños al colector.",
      "Guardá en maletín o caja: la humedad y el polvo son los principales enemigos.",
    ],
    ctaText: "Ver accesorios de mantenimiento",
    ctaHref: "/marketplace",
    tags: ["mantenimiento herramientas", "durabilidad", "cuidado", "vida útil"],
  },
  {
    slug: "como-afilar-brocas-desgastadas",
    question: "¿Cómo afilar brocas desgastadas?",
    category: "Uso y técnica",
    answer:
      "Las brocas desgastadas se afilan en esmeril o con piedra de afilado especial, manteniendo el ángulo original de la punta (118° para acero, 130–135° para metales duros).",
    keyPoints: [
      "El ángulo de punta estándar es 118° para acero al carbono y materiales blandos.",
      "Para acero inoxidable y materiales duros: 130–135° de ángulo de punta.",
      "Usá una guía de afilado para mantener el ángulo constante en ambas caras.",
      "Enfriar la broca en agua frecuentemente para no perder el temple del acero.",
    ],
    ctaText: "Ver brocas",
    ctaHref: "/marketplace",
    tags: ["afilar brocas", "esmeril", "ángulo de punta", "mantenimiento"],
  },
  {
    slug: "como-instalar-tomas-electricas-correctamente",
    question: "¿Cómo instalar tomas eléctricas correctamente?",
    category: "Uso y técnica",
    answer:
      "Para instalar tomas eléctricas correctamente: cortá la corriente en el tablero, verificá con volímetro que no hay tensión, conectá tierra, neutro y fase en los bornes correctos y ajustá firmemente.",
    keyPoints: [
      "SIEMPRE cortá la corriente en el tablero y verificá con tensiómetro antes de tocar cables.",
      "El borne de tierra (cable verde/amarillo) es obligatorio en tomas modernas para protección personal.",
      "La fase (cable marrón/rojo/negro) va al borne vivo; el neutro (azul) al borne neutro.",
      "Si no tenés conocimientos de electricidad, contratá un electricista matriculado.",
    ],
    ctaText: "Ver herramientas eléctricas",
    ctaHref: "/marketplace",
    tags: ["tomas eléctricas", "instalación", "electricidad", "seguridad eléctrica"],
  },
  {
    slug: "como-usar-la-amoladora-de-forma-segura",
    question: "¿Cómo usar la amoladora de forma segura?",
    category: "Uso y técnica",
    answer:
      "La amoladora es una de las herramientas más peligrosas del taller. Siempre usá protección facial completa, guantes anticorte, verificá el disco antes de encenderla y trabajá con la guarda puesta.",
    keyPoints: [
      "NUNCA quites la guarda de protección: el disco puede romperse y la guarda te protege.",
      "Verificá el disco antes de cada uso: sin fisuras, compatible con el diámetro y la velocidad de la máquina.",
      "Usá protección facial (careta, no solo lentes) y guantes anticorte nivel 3.",
      "No presiones en exceso el disco: dejá que la herramienta trabaje a su ritmo.",
    ],
    ctaText: "Ver amoladoras y seguridad",
    ctaHref: "/marketplace",
    tags: ["seguridad amoladora", "EPP", "disco", "accidente", "prevención"],
  },
  {
    slug: "como-hacer-un-corte-recto-con-sierra-circular",
    question: "¿Cómo hacer un corte recto con sierra circular?",
    category: "Uso y técnica",
    answer:
      "Para cortes rectos con sierra circular usá una guía paralela (incluida con la sierra) o clavá una regla de madera como guía. Ajustá la profundidad de corte a 5mm más que el espesor del material.",
    keyPoints: [
      "Ajustá la profundidad de corte exactamente: 5mm más que el espesor del tablero.",
      "Usá la guía paralela de fábrica para cortes al borde; para cortes interiores, una regla clavada.",
      "Marcá la línea de corte con lápiz o marcador y alineá el indicador de la sierra.",
      "Avanzá a velocidad constante sin forzar: la sierra debe cortar sola sin necesidad de empujar.",
    ],
    ctaText: "Ver sierras circulares",
    ctaHref: "/marketplace",
    tags: ["corte recto", "sierra circular", "guía", "carpintería"],
  },
  {
    slug: "como-pintar-madera-con-esmalte-paso-a-paso",
    question: "¿Cómo pintar madera con esmalte paso a paso?",
    category: "Uso y técnica",
    answer:
      "Para pintar madera con esmalte: lijá la superficie (grano 120), aplicá sellador o imprimación, lijá de nuevo (grano 180), aplicá la primera mano de esmalte y finalizá con la segunda mano a las 24 horas.",
    keyPoints: [
      "El sellador o imprimación es fundamental: cierra el poro de la madera y mejora la adherencia.",
      "Lijá entre manos con grano 180 para un acabado profesional.",
      "Diluí el esmalte sintético entre un 5–10% con aguarrás para mejor aplicación a pincel.",
      "Pintá siempre en sentido de la veta de la madera para evitar marcas de pincel.",
    ],
    ctaText: "Ver herramientas de pintura",
    ctaHref: "/marketplace",
    tags: ["pintar madera", "esmalte", "imprimación", "carpintería"],
  },
  {
    slug: "como-detectar-cables-en-la-pared-antes-de-perforar",
    question: "¿Cómo detectar cables en la pared antes de perforar?",
    category: "Uso y técnica",
    answer:
      "Para detectar cables en la pared antes de perforar usá un detector de metales y cables (stud finder con función de detección de cables AC), o un voltímetro de contacto en las guías de cableado.",
    keyPoints: [
      "Los detectores de cables AC funcionan detectando el campo electromagnético del cable activo.",
      "Muchos modelos también detectan vigas de madera, caños y metales en la pared.",
      "Los cables van en vertical desde los tomacorrientes y en horizontal a los interruptores.",
      "En dudas: perforá con taladro manual a poca profundidad antes de usar el rotomartillo.",
    ],
    ctaText: "Ver detectores y medidores",
    ctaHref: "/marketplace",
    tags: ["detector de cables", "stud finder", "seguridad", "perforación"],
  },
  {
    slug: "como-soldar-aluminio-con-tig",
    question: "¿Cómo soldar aluminio con TIG?",
    category: "Uso y técnica",
    answer:
      "La soldadura TIG de aluminio usa corriente alterna (AC), electrodo de tungsteno puro (verde) y gas argón puro como protección. El aluminio debe estar perfectamente limpio antes de soldar.",
    keyPoints: [
      "Usá corriente AC (alterna): la componente positiva limpia el óxido del aluminio durante la soldadura.",
      "Electrodo de tungsteno puro (verde) o con zirconio (blanco) para AC.",
      "Gas argón puro al 100% (no mezclas con CO₂ o He para TIG de aluminio).",
      "Limpiá el aluminio con cepillo de acero inoxidable (exclusivo para aluminio) antes de soldar.",
    ],
    ctaText: "Ver equipos TIG",
    ctaHref: "/marketplace",
    tags: ["soldadura TIG aluminio", "AC", "tungsteno", "argón"],
  },
  {
    slug: "como-nivelar-un-piso-de-cemento",
    question: "¿Cómo nivelar un piso de cemento con autonivelante?",
    category: "Uso y técnica",
    answer:
      "Para nivelar un piso con autonivelante: limpiá el sustrato, aplicá imprimación adherente, mezclá el autonivelante según el fabricante y vertilo distribuyendo con rastrillo de picos.",
    keyPoints: [
      "La imprimación adherente es indispensable para que el autonivelante pegue al sustrato.",
      "El piso debe ser firme, sin partes sueltas o con aceite: limpiar con amoladora si es necesario.",
      "La capa máxima de autonivelante suele ser 3–5cm en una aplicación; más espesor requiere capas.",
      "Ventilá el ambiente durante el fraguado y evitá corrientes de aire que causen fisurado.",
    ],
    ctaText: "Ver herramientas para pisos",
    ctaHref: "/marketplace",
    tags: ["autonivelante", "piso", "nivelación", "cemento"],
  },
  {
    slug: "como-usar-pistola-de-silicona-correctamente",
    question: "¿Cómo usar pistola de silicona correctamente?",
    category: "Uso y técnica",
    answer:
      "Para usar pistola de silicona correctamente: cortá la boquilla en 45°, perforá el sello del cartucho, ajustá la pistola y aplicá a velocidad constante en un solo trazo continuo.",
    keyPoints: [
      "Cortá la boquilla en ángulo de 45° a la medida del cordón deseado.",
      "Limpiá las superficies con alcohol antes de silicona para mejor adherencia.",
      "Aplicá en un solo movimiento continuo a velocidad uniforme para un cordón parejo.",
      "Alisá el cordón húmedo con el dedo húmedo o una espátula para mejor terminación.",
    ],
    ctaText: "Ver pistolas y siliconas",
    ctaHref: "/marketplace",
    tags: ["pistola de silicona", "sellador", "caulk", "técnica"],
  },
  {
    slug: "como-calcular-cuanta-pintura-necesito",
    question: "¿Cómo calcular cuánta pintura necesito para una habitación?",
    category: "Uso y técnica",
    answer:
      "Para calcular pintura: medí el perímetro de paredes × altura, restá puertas y ventanas, y dividí por el rendimiento del producto (generalmente 10–12m² por litro en una mano).",
    keyPoints: [
      "Rendimiento típico de látex interior: 10–12 m²/litro por mano.",
      "Para dos manos completas: duplicá la cantidad.",
      "Suele desperdiciarse un 10–15%: agregalo al cálculo.",
      "Una habitación de 3×3m con techo de 2,5m: aproximadamente 3–4 litros para dos manos.",
    ],
    ctaText: "Ver herramientas de pintura",
    ctaHref: "/marketplace",
    tags: ["calcular pintura", "rendimiento", "litros por metro cuadrado", "pintura"],
  },

  // ── Sobre Madsjeez (15) ────────────────────────────────────────────────────
  {
    slug: "que-es-madsjeez",
    question: "¿Qué es Madsjeez?",
    category: "Sobre Madsjeez",
    answer:
      "Madsjeez es el marketplace especializado en herramientas, maquinaria industrial y repuestos en Argentina. A diferencia de los grandes marketplaces generalistas, Madsjeez se enfoca exclusivamente en el rubro ferretero e industrial.",
    keyPoints: [
      "Más de 80 categorías especializadas en herramientas, maquinaria y repuestos.",
      "0% de comisión por venta para todos los vendedores, siempre.",
      "Vendedores verificados y productos con descripción técnica completa.",
      "Comprás y vendés con Mercado Pago, envíos a todo el país.",
    ],
    ctaText: "Ver el marketplace",
    ctaHref: "/marketplace",
    tags: ["qué es Madsjeez", "marketplace", "herramientas", "Argentina"],
  },
  {
    slug: "como-comprar-en-madsjeez",
    question: "¿Cómo comprar en Madsjeez?",
    category: "Sobre Madsjeez",
    answer:
      "Comprar en Madsjeez es simple: buscás el producto en el marketplace, lo agregás al carrito, elegís el medio de pago (Mercado Pago, tarjeta o transferencia) y coordinás el envío o retiro.",
    keyPoints: [
      "Buscá por nombre, marca o categoría en el buscador principal.",
      "Podés filtrar por precio, marca y disponibilidad.",
      "Pagás con Mercado Pago, tarjeta de crédito o débito, o transferencia bancaria.",
      "El vendedor coordina el envío o podés retirar en su local si está disponible.",
    ],
    ctaText: "Ir al marketplace",
    ctaHref: "/marketplace",
    tags: ["cómo comprar", "proceso de compra", "Mercado Pago", "tutorial"],
  },
  {
    slug: "madsjeez-cobra-comision-por-venta",
    question: "¿Madsjeez cobra comisión por las ventas?",
    category: "Sobre Madsjeez",
    answer:
      "No. Madsjeez cobra 0% de comisión por venta. El 100% del valor de cada venta va directamente al vendedor. Esto nos diferencia de los grandes marketplaces que cobran entre 7% y 17%.",
    keyPoints: [
      "0% de comisión por venta, siempre. Sin letra chica.",
      "Los únicos costos son la suscripción mensual (PRO $2.999/mes o ULTRA $4.999/mes).",
      "Los nuevos vendedores tienen 6 meses gratis en el plan PRO.",
      "Solo pagás las tarifas estándar de Mercado Pago si usás su pasarela de cobro.",
    ],
    ctaText: "Ver planes y precios",
    ctaHref: "/subscriptions",
    tags: ["comisión", "costo", "0% comisión", "precios Madsjeez"],
  },
  {
    slug: "cuales-son-los-planes-de-madsjeez",
    question: "¿Cuáles son los planes de Madsjeez para vendedores?",
    category: "Sobre Madsjeez",
    answer:
      "Madsjeez tiene dos planes de suscripción: PRO ($2.999/mes, hasta 200 publicaciones) y ULTRA ($4.999/mes, publicaciones ilimitadas). Los nuevos vendedores tienen 6 meses gratis en el plan PRO.",
    keyPoints: [
      "Plan PRO: $2.999/mes — hasta 200 publicaciones activas.",
      "Plan ULTRA: $4.999/mes — publicaciones ilimitadas y funcionalidades avanzadas.",
      "Oferta para nuevos vendedores: 6 meses gratis en el plan PRO.",
      "Ambos planes incluyen 0% de comisión por venta.",
    ],
    ctaText: "Ver planes",
    ctaHref: "/subscriptions",
    tags: ["planes", "precios", "suscripción", "PRO", "ULTRA"],
  },
  {
    slug: "madsjeez-tiene-servicio-al-cliente",
    question: "¿Madsjeez tiene servicio al cliente?",
    category: "Sobre Madsjeez",
    answer:
      "Sí. Madsjeez tiene un centro de ayuda con artículos explicativos y un canal de contacto directo para resolver dudas sobre compras, ventas y la plataforma.",
    keyPoints: [
      "Centro de ayuda para compradores en /ayuda.",
      "Centro de ayuda para vendedores en /ayuda-vendedores.",
      "Canal de contacto directo disponible en la plataforma.",
      "Sistema de resolución de disputas entre compradores y vendedores.",
    ],
    ctaText: "Ir al centro de ayuda",
    ctaHref: "/ayuda",
    tags: ["servicio al cliente", "ayuda", "soporte", "contacto"],
  },
  {
    slug: "es-seguro-comprar-en-madsjeez",
    question: "¿Es seguro comprar en Madsjeez?",
    category: "Sobre Madsjeez",
    answer:
      "Sí. En Madsjeez los vendedores son verificados y los pagos se procesan a través de Mercado Pago, que ofrece protección al comprador. Si el producto no llega o no coincide con la descripción, podés iniciar una disputa.",
    keyPoints: [
      "Los vendedores son verificados antes de publicar en la plataforma.",
      "Los pagos se procesan con Mercado Pago, que tiene política de protección al comprador.",
      "Si el producto no llega o no es el descrito, Madsjeez media en la resolución.",
      "Las calificaciones y reseñas de otros compradores te ayudan a elegir con más información.",
    ],
    ctaText: "Ver el marketplace",
    ctaHref: "/marketplace",
    tags: ["seguridad", "comprar seguro", "Mercado Pago", "protección"],
  },
  {
    slug: "madsjeez-hace-envios-a-todo-el-pais",
    question: "¿Madsjeez hace envíos a todo el país?",
    category: "Sobre Madsjeez",
    answer:
      "Sí. Los vendedores en Madsjeez pueden hacer envíos a todo el país a través de Mercado Envíos, OCA, Andreani y otros servicios de mensajería. El vendedor define las opciones de envío disponibles.",
    keyPoints: [
      "Cada vendedor configura sus opciones de envío (transportista, zonas y costos).",
      "El envío lo coordina el vendedor, no Madsjeez directamente.",
      "Podés consultar las zonas de envío disponibles en cada publicación.",
      "Algunos vendedores ofrecen retiro en local como alternativa al envío.",
    ],
    ctaText: "Explorar el marketplace",
    ctaHref: "/marketplace",
    tags: ["envíos", "logística", "todo el país", "Mercado Envíos"],
  },
  {
    slug: "cuanto-tarda-llegar-compra-madsjeez",
    question: "¿Cuánto tarda en llegar una compra de Madsjeez?",
    category: "Sobre Madsjeez",
    answer:
      "El tiempo de entrega depende del vendedor y el transportista elegido. En el AMBA los envíos generalmente tardan 24–72 horas; para el interior del país, 3–7 días hábiles.",
    keyPoints: [
      "El plazo de entrega lo define el vendedor según el transportista que usa.",
      "Para Capital Federal y GBA: 24–72 horas con la mayoría de los transportistas.",
      "Para interior del país: 3–7 días hábiles dependiendo de la zona.",
      "Verificá el plazo estimado en la publicación antes de comprar.",
    ],
    ctaText: "Ver el marketplace",
    ctaHref: "/marketplace",
    tags: ["tiempo de entrega", "envíos", "plazos", "logística"],
  },
  {
    slug: "puedo-volver-gratis-en-madsjeez",
    question: "¿Puedo devolver una compra en Madsjeez?",
    category: "Sobre Madsjeez",
    answer:
      "Sí. La Ley de Defensa del Consumidor te da 10 días corridos para arrepentirte de una compra online. Además, cada vendedor puede tener su propia política de devoluciones.",
    keyPoints: [
      "La ley argentina otorga 10 días de arrepentimiento para compras online desde la recepción.",
      "Para devoluciones por producto defectuoso, el vendedor debe hacerse cargo (garantía legal de 6 meses).",
      "Iniciá el proceso de devolución desde tu cuenta en Madsjeez.",
      "Si el vendedor no responde, Madsjeez media en la resolución de la disputa.",
    ],
    ctaText: "Ver políticas",
    ctaHref: "/ayuda",
    tags: ["devoluciones", "arrepentimiento", "garantía", "Defensa del Consumidor"],
  },
  {
    slug: "como-registrarse-en-madsjeez-como-comprador",
    question: "¿Cómo registrarse en Madsjeez como comprador?",
    category: "Sobre Madsjeez",
    answer:
      "Para registrarte como comprador en Madsjeez solo necesitás un email y una contraseña. El proceso toma menos de 2 minutos y podés empezar a comprar de inmediato.",
    keyPoints: [
      "El registro es gratuito para compradores.",
      "Podés comprar también sin registrarte, como invitado.",
      "Con cuenta podés hacer seguimiento de tus pedidos y dejar calificaciones.",
      "El perfil de comprador te permite recibir notificaciones de ofertas y novedades.",
    ],
    ctaText: "Registrarse",
    ctaHref: "/register",
    tags: ["registrarse", "cuenta comprador", "registro", "crear cuenta"],
  },
  {
    slug: "que-categorias-tiene-madsjeez",
    question: "¿Qué categorías de productos tiene Madsjeez?",
    category: "Sobre Madsjeez",
    answer:
      "Madsjeez tiene más de 80 categorías especializadas en herramientas, maquinaria y repuestos industriales. Desde herramientas eléctricas y manuales hasta maquinaria pesada y EPP.",
    keyPoints: [
      "Herramientas eléctricas: taladros, amoladoras, sierras, lijadoras, soldadoras.",
      "Herramientas manuales: llaves, alicates, destornilladores, mazas, niveles.",
      "Maquinaria: compresores, generadores, tornos, fresadoras, soldadoras industriales.",
      "EPP y seguridad: cascos, guantes, lentes, zapatos de seguridad.",
    ],
    ctaText: "Ver todas las categorías",
    ctaHref: "/categories",
    tags: ["categorías", "que venden", "productos", "catálogo Madsjeez"],
  },
  {
    slug: "madsjeez-acepta-mercado-pago",
    question: "¿Madsjeez acepta Mercado Pago?",
    category: "Sobre Madsjeez",
    answer:
      "Sí. Madsjeez integra Mercado Pago como medio de pago principal. Podés pagar con saldo de Mercado Pago, tarjeta de crédito (con cuotas) o débito.",
    keyPoints: [
      "Pago con saldo de Mercado Pago: acreditación instantánea al vendedor.",
      "Tarjeta de crédito con cuotas: las cuotas disponibles dependen del banco emisor.",
      "Tarjeta de débito: pago inmediato.",
      "Todos los pagos tienen la protección de comprador de Mercado Pago.",
    ],
    ctaText: "Ver el marketplace",
    ctaHref: "/marketplace",
    tags: ["Mercado Pago", "pago", "tarjeta de crédito", "cuotas"],
  },
  {
    slug: "madsjeez-vs-mercadolibre-diferencias",
    question: "¿Cuál es la diferencia entre Madsjeez y MercadoLibre?",
    category: "Sobre Madsjeez",
    answer:
      "Madsjeez es un marketplace especializado en herramientas y maquinaria con 0% de comisión. MercadoLibre es un marketplace generalista que cobra entre 7% y 17% de comisión por venta.",
    keyPoints: [
      "Madsjeez: especializado en ferretería industrial. ML: generalista para todo tipo de producto.",
      "Madsjeez: 0% de comisión por venta. ML: cobra 7–17% según categoría y nivel de vendedor.",
      "Madsjeez: compradores especializados en el rubro. ML: audiencia masiva y generalista.",
      "Madsjeez: 6 meses gratis para nuevos vendedores. ML: comisión desde la primera venta.",
    ],
    ctaText: "Empezar gratis en Madsjeez",
    ctaHref: "/oferta-vendedores",
    tags: ["Madsjeez vs MercadoLibre", "diferencias", "marketplace", "comisión"],
  },
  {
    slug: "como-calificar-a-un-vendedor-en-madsjeez",
    question: "¿Cómo calificar a un vendedor en Madsjeez?",
    category: "Sobre Madsjeez",
    answer:
      "Podés calificar a un vendedor en Madsjeez desde tu cuenta, en el detalle de tu pedido, una vez que hayas confirmado la recepción del producto.",
    keyPoints: [
      "La calificación está disponible en tu historial de compras una vez entregado el pedido.",
      "Podés dejar una puntuación de 1 a 5 estrellas y un comentario.",
      "Las calificaciones son públicas y ayudan a otros compradores a tomar decisiones.",
      "Si tuviste una mala experiencia, describila en el comentario para que el vendedor pueda mejorar.",
    ],
    ctaText: "Ver mis compras",
    ctaHref: "/marketplace",
    tags: ["calificación", "reseña", "valoración", "vendedor"],
  },
  {
    slug: "madsjeez-tiene-aplicacion-movil",
    question: "¿Madsjeez tiene aplicación móvil?",
    category: "Sobre Madsjeez",
    answer:
      "La plataforma de Madsjeez está optimizada para móviles y funciona perfectamente desde el navegador de tu celular. Una app nativa para iOS y Android está en desarrollo.",
    keyPoints: [
      "El sitio es 100% responsive y funciona en celulares Android e iOS.",
      "Podés comprar, vender y gestionar tu tienda desde el celular sin necesidad de app.",
      "La app nativa está en desarrollo para ofrecer notificaciones push y mayor performance.",
      "Agregá el sitio a tu pantalla de inicio como acceso rápido desde el navegador.",
    ],
    ctaText: "Abrir Madsjeez",
    ctaHref: "/marketplace",
    tags: ["app móvil", "Android", "iOS", "aplicación Madsjeez"],
  },
];

export function getAllPreguntaSlugs(): string[] {
  return PREGUNTAS.map((p) => p.slug);
}

export function getPregunta(slug: string): Pregunta | undefined {
  return PREGUNTAS.find((p) => p.slug === slug);
}

export function getPreguntasByCategory(category: string): Pregunta[] {
  return PREGUNTAS.filter((p) => p.category === category);
}
