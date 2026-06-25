/**
 * Comparativas educativas (tipo vs tipo) para ayudar a decidir antes de comprar.
 * Reglas: no atacar competidores, no inventar disponibilidad ni compatibilidades
 * exactas. Cada comparativa rutea a búsqueda real ("según disponibilidad de
 * vendedores"). Distinta intención que GUIAS_COMPRA (guías de compra por rubro).
 */

export type ComparativaOption = { name: string; tagline: string };
export type ComparativaRow = { criterio: string; valores: string[] };
export type ComparativaVeredicto = { option: string; cuando: string };

export type Comparativa = {
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  intro: string;
  options: ComparativaOption[];
  rows: ComparativaRow[];
  veredicto: ComparativaVeredicto[];
  notas?: string[];
  faqs: { question: string; answer: string }[];
  searchQuery: string;
  related: string[];
};

export const COMPARATIVAS: Comparativa[] = [
  {
    slug: "desmalezadora-nafta-vs-electrica-vs-bateria",
    title: "Desmalezadora a nafta vs. eléctrica vs. a batería",
    seoTitle: "Desmalezadora a nafta, eléctrica o a batería: cuál elegir | Madsjeez",
    metaDescription: "Comparamos desmalezadoras a nafta, eléctricas y a batería: potencia, autonomía, mantenimiento y para qué terreno conviene cada una.",
    excerpt: "Potencia, autonomía y mantenimiento de cada tipo, para que elijas según tu terreno.",
    intro: "La mejor desmalezadora depende del tamaño del terreno, el tipo de maleza y cuánto mantenimiento estás dispuesto a hacer. Comparamos los tres tipos para que decidas con criterio.",
    options: [
      { name: "Nafta (2T)", tagline: "Más potencia y autonomía" },
      { name: "Eléctrica con cable", tagline: "Liviana y de bajo mantenimiento" },
      { name: "A batería", tagline: "Sin cable y silenciosa" },
    ],
    rows: [
      { criterio: "Potencia", valores: ["Alta", "Media", "Media/baja"] },
      { criterio: "Autonomía", valores: ["Alta (tanque)", "Ilimitada con cable", "Limitada por batería"] },
      { criterio: "Peso", valores: ["Mayor", "Liviana", "Media"] },
      { criterio: "Mantenimiento", valores: ["Mayor (mezcla, bujía, carburador)", "Bajo", "Bajo"] },
      { criterio: "Ruido", valores: ["Alto", "Bajo", "Bajo"] },
      { criterio: "Ideal para", valores: ["Terrenos grandes y maleza dura", "Jardines chicos cerca del toma", "Tamaño medio sin cable"] },
    ],
    veredicto: [
      { option: "Nafta (2T)", cuando: "Terrenos grandes, pasto alto o maleza dura, y donde no llega un cable." },
      { option: "Eléctrica con cable", cuando: "Jardines chicos cerca de un tomacorriente, si querés poco mantenimiento." },
      { option: "A batería", cuando: "Comodidad sin cable en superficies medianas, priorizando bajo ruido." },
    ],
    notas: ["Verificá siempre potencia, tipo de corte (tanza o cuchilla) y repuestos disponibles antes de comprar."],
    faqs: [
      { question: "¿Cuál tiene más potencia?", answer: "En general, las de nafta (2 tiempos) ofrecen más potencia y autonomía para maleza dura y terrenos grandes." },
      { question: "¿La eléctrica sirve para terreno grande?", answer: "Para terrenos grandes conviene la nafta o, en su defecto, a batería con repuestos. La eléctrica con cable rinde mejor cerca del tomacorriente." },
    ],
    searchQuery: "desmalezadora",
    related: ["motor-2-tiempos-vs-4-tiempos", "desmalezadora-vs-bordeadora"],
  },
  {
    slug: "motosierra-nafta-vs-electrica",
    title: "Motosierra a nafta vs. eléctrica",
    seoTitle: "Motosierra a nafta o eléctrica: cuál conviene | Madsjeez",
    metaDescription: "Comparativa de motosierras a nafta y eléctricas: potencia, movilidad, mantenimiento y para qué tipo de corte conviene cada una.",
    excerpt: "Cuándo conviene la nafta y cuándo la eléctrica según el tipo de corte.",
    intro: "Elegir entre una motosierra a nafta y una eléctrica depende de la potencia que necesites, la movilidad y la frecuencia de uso.",
    options: [
      { name: "Nafta", tagline: "Potencia y libertad de movimiento" },
      { name: "Eléctrica (cable)", tagline: "Liviana, simple y de bajo ruido" },
    ],
    rows: [
      { criterio: "Potencia", valores: ["Alta", "Media"] },
      { criterio: "Movilidad", valores: ["Total (sin cable)", "Limitada por el cable"] },
      { criterio: "Mantenimiento", valores: ["Mayor (mezcla, bujía, filtro)", "Bajo"] },
      { criterio: "Peso", valores: ["Mayor", "Liviana"] },
      { criterio: "Ruido", valores: ["Alto", "Bajo"] },
      { criterio: "Ideal para", valores: ["Tala, leña, trabajo intensivo", "Poda liviana cerca de la casa"] },
    ],
    veredicto: [
      { option: "Nafta", cuando: "Cortes exigentes, leña, tala o trabajo lejos de un toma de corriente." },
      { option: "Eléctrica (cable)", cuando: "Poda liviana y ocasional cerca de un tomacorriente, con poco mantenimiento." },
    ],
    notas: ["Antes de comprar, verificá el largo de espada, el paso y calibre de la cadena y la disponibilidad de repuestos."],
    faqs: [
      { question: "¿La eléctrica corta troncos gruesos?", answer: "Para troncos gruesos o tala conviene la nafta. La eléctrica rinde mejor en poda liviana y ramas finas." },
      { question: "¿Cuál requiere menos mantenimiento?", answer: "La eléctrica: no usa mezcla ni bujía. La de nafta necesita más mantenimiento pero ofrece más potencia y movilidad." },
    ],
    searchQuery: "motosierra",
    related: ["motor-2-tiempos-vs-4-tiempos", "desmalezadora-nafta-vs-electrica-vs-bateria"],
  },
  {
    slug: "motor-2-tiempos-vs-4-tiempos",
    title: "Motor 2 tiempos vs. 4 tiempos",
    seoTitle: "Motor 2 tiempos vs 4 tiempos: diferencias y cuál elegir | Madsjeez",
    metaDescription: "Diferencias entre motores 2 tiempos y 4 tiempos en máquinas de jardín: mezcla, potencia, peso y mantenimiento.",
    excerpt: "Mezcla, peso, potencia y mantenimiento: en qué se diferencian.",
    intro: "Muchas máquinas de jardín usan motor 2 tiempos (2T) o 4 tiempos (4T). La diferencia clave está en cómo se lubrican y en su relación peso/potencia.",
    options: [
      { name: "2 tiempos (2T)", tagline: "Liviano y simple" },
      { name: "4 tiempos (4T)", tagline: "Más torque y sin mezcla" },
    ],
    rows: [
      { criterio: "Combustible", valores: ["Mezcla nafta + aceite 2T", "Nafta sola (aceite aparte en cárter)"] },
      { criterio: "Peso", valores: ["Más liviano", "Más pesado"] },
      { criterio: "Torque a bajas vueltas", valores: ["Menor", "Mayor"] },
      { criterio: "Mantenimiento", valores: ["Simple, requiere mezcla correcta", "Cambio de aceite periódico"] },
      { criterio: "Típico en", valores: ["Desmalezadoras, motosierras", "Algunas desmalezadoras, generadores"] },
    ],
    veredicto: [
      { option: "2 tiempos (2T)", cuando: "Herramientas livianas de mano (desmalezadora, motosierra), si respetás la mezcla correcta." },
      { option: "4 tiempos (4T)", cuando: "Donde se busca más torque parejo y no querés preparar mezcla." },
    ],
    notas: ["En 2T, respetar la proporción de mezcla que indica el fabricante evita fallas. Nunca uses nafta sola en un motor 2T."],
    faqs: [
      { question: "¿Por qué el 2 tiempos lleva mezcla?", answer: "Porque se lubrica con el aceite mezclado en la nafta. Usar nafta sola puede dañar el motor." },
      { question: "¿Cuál dura más?", answer: "Depende del uso y el mantenimiento. El 4T suele tener más torque parejo; el 2T es más liviano y simple." },
    ],
    searchQuery: "desmalezadora",
    related: ["desmalezadora-nafta-vs-electrica-vs-bateria", "motosierra-nafta-vs-electrica"],
  },
  {
    slug: "desmalezadora-vs-bordeadora",
    title: "Desmalezadora vs. bordeadora",
    seoTitle: "Desmalezadora o bordeadora: cuál necesitás | Madsjeez",
    metaDescription: "Diferencias entre desmalezadora y bordeadora: potencia, tipo de corte y para qué tarea sirve cada una.",
    excerpt: "No son lo mismo: cuál usar según el corte que necesitás.",
    intro: "Aunque se parecen, la desmalezadora y la bordeadora apuntan a tareas distintas. Acá te ayudamos a elegir según lo que necesitás cortar.",
    options: [
      { name: "Desmalezadora", tagline: "Maleza dura y pasto alto" },
      { name: "Bordeadora", tagline: "Terminación y bordes prolijos" },
    ],
    rows: [
      { criterio: "Potencia", valores: ["Mayor", "Menor"] },
      { criterio: "Corte", valores: ["Tanza gruesa o cuchilla", "Tanza fina"] },
      { criterio: "Uso típico", valores: ["Maleza, pasto alto, terreno irregular", "Bordes, terminación, jardines chicos"] },
      { criterio: "Peso", valores: ["Mayor", "Menor"] },
    ],
    veredicto: [
      { option: "Desmalezadora", cuando: "Pasto alto, maleza dura o terrenos grandes e irregulares." },
      { option: "Bordeadora", cuando: "Terminación prolija de bordes y jardines chicos." },
    ],
    notas: ["Algunos modelos combinan ambas funciones. Verificá potencia, tipo de corte y repuestos antes de comprar."],
    faqs: [
      { question: "¿La bordeadora corta maleza dura?", answer: "No es lo ideal. Para maleza dura y pasto alto conviene una desmalezadora con más potencia." },
      { question: "¿Puedo bordear con una desmalezadora?", answer: "Sí, con cuidado, aunque la bordeadora da una terminación más prolija en bordes." },
    ],
    searchQuery: "desmalezadora",
    related: ["desmalezadora-nafta-vs-electrica-vs-bateria", "tanza-redonda-vs-cuadrada-vs-dentada"],
  },
  {
    slug: "tanza-redonda-vs-cuadrada-vs-dentada",
    title: "Tanza redonda vs. cuadrada vs. dentada",
    seoTitle: "Tipos de tanza: redonda, cuadrada o dentada | Madsjeez",
    metaDescription: "Comparativa de tipos de tanza para desmalezadora: redonda, cuadrada y dentada. Cuál corta mejor según la maleza.",
    excerpt: "Qué tipo de hilo corta mejor según la maleza y el desgaste.",
    intro: "El tipo de tanza (hilo) cambia el rendimiento de corte y el desgaste. Elegir el adecuado mejora el resultado y cuida la máquina.",
    options: [
      { name: "Redonda", tagline: "Resistente y económica" },
      { name: "Cuadrada", tagline: "Mejor corte en maleza" },
      { name: "Dentada / multi-lados", tagline: "Corte agresivo" },
    ],
    rows: [
      { criterio: "Corte", valores: ["Suave/uniforme", "Más agresivo", "Muy agresivo"] },
      { criterio: "Durabilidad", valores: ["Alta", "Media", "Media"] },
      { criterio: "Ruido/vibración", valores: ["Menor", "Media", "Mayor"] },
      { criterio: "Ideal para", valores: ["Pasto y uso general", "Maleza media", "Maleza densa"] },
    ],
    veredicto: [
      { option: "Redonda", cuando: "Uso general y pasto: dura más y es económica." },
      { option: "Cuadrada", cuando: "Maleza media donde la redonda no rinde." },
      { option: "Dentada / multi-lados", cuando: "Maleza densa que necesita un corte más agresivo." },
    ],
    notas: ["Verificá el diámetro de tanza compatible con tu cabezal antes de comprar."],
    faqs: [
      { question: "¿Cuál dura más?", answer: "La redonda suele ser la más duradera; la cuadrada y dentada cortan más agresivo pero pueden desgastarse antes." },
      { question: "¿Cualquier tanza entra en mi cabezal?", answer: "No. Verificá el diámetro de tanza que admite tu cabezal antes de comprar." },
    ],
    searchQuery: "tanza desmalezadora",
    related: ["desmalezadora-vs-bordeadora", "desmalezadora-nafta-vs-electrica-vs-bateria"],
  },
  {
    slug: "madsjeez-vs-mercadolibre",
    title: "Madsjeez vs MercadoLibre: cuánto te cuesta realmente vender en cada uno",
    seoTitle: "Madsjeez vs MercadoLibre 2026 — Comisiones y costos reales para vendedores",
    metaDescription: "MercadoLibre cobra 12-16% + IVA en comisiones. Madsjeez cobra 0%. En $1.000.000 de ventas, ML te descuenta ~$145.000. Comparativa honesta con números reales.",
    excerpt: "La comparativa que los vendedores necesitan antes de decidir dónde publicar en Argentina.",
    intro: "Si vendés en Argentina, probablemente usás MercadoLibre. Pero ¿sabés exactamente cuánto te cobra? Esta comparativa muestra los números reales, sin letra chica ni marketing.",
    options: [
      { name: "MercadoLibre", tagline: "La plataforma más grande de Argentina" },
      { name: "Madsjeez", tagline: "Marketplace especializado, 0% de comisión" },
    ],
    rows: [
      { criterio: "Comisión por venta (Clásico)", valores: ["12% + IVA ≈ 13.5% real", "0%"] },
      { criterio: "Comisión por venta (Premium)", valores: ["16% + IVA ≈ 18% real", "0%"] },
      { criterio: "Costo mensual fijo", valores: ["$0 (pero comisión variable)", "Básico $0 / PRO $2.999 / ULTRA $4.999"] },
      { criterio: "En $300.000/mes de ventas", valores: ["$40.500–$54.000 en comisiones", "$0–$2.999 (plan fijo)"] },
      { criterio: "En $500.000/mes de ventas", valores: ["$67.500–$90.000 en comisiones", "$0–$2.999 (plan fijo)"] },
      { criterio: "En $1.000.000/mes de ventas", valores: ["$135.000–$180.000 en comisiones", "$0–$4.999 (plan fijo)"] },
      { criterio: "Publicidad necesaria para posicionarse", valores: ["5-15% adicional (Product Ads)", "No requerida"] },
      { criterio: "Suspensión de cuenta", valores: ["Automática, sin aviso previo", "Con revisión manual y notificación"] },
      { criterio: "Acceso a datos del comprador", valores: ["Limitado — ML es intermediario", "Relación directa con el cliente"] },
      { criterio: "Logística de envíos", valores: ["Mercado Envíos (obligatorio en Premium)", "Libre elección de logística"] },
      { criterio: "Soporte al vendedor", valores: ["Bot + ticket (1-3 días hábiles)", "WhatsApp directo (PRO/ULTRA)"] },
      { criterio: "Especialización de la audiencia", valores: ["Masivo, todo rubro", "Herramientas, maquinaria, repuestos"] },
    ],
    veredicto: [
      {
        option: "MercadoLibre",
        cuando: "Necesitás el mayor volumen de tráfico posible desde el día 1 y tu margen soporta perder entre 14% y 20% de cada venta en comisiones.",
      },
      {
        option: "Madsjeez",
        cuando: "Vendés herramientas, maquinaria o repuestos, querés quedarte con el 100% de cada venta, y buscás clientes que ya saben lo que buscan en tu nicho.",
      },
    ],
    notas: [
      "Los porcentajes de comisión incluyen IVA sobre la comisión (21%). Ejemplo: 12% de comisión ML + 21% IVA sobre esa comisión = 12% × 1.21 = 14.52% efectivo.",
      "Product Ads en ML no es obligatorio pero en categorías competitivas es prácticamente necesario para mantener visibilidad.",
      "Madsjeez y MercadoLibre no son excluyentes — muchos vendedores usan ambos canales en paralelo.",
    ],
    faqs: [
      {
        question: "¿Cuánto cobra exactamente MercadoLibre de comisión en 2026?",
        answer: "MercadoLibre cobra entre 12% (plan Clásico) y 16% (plan Premium) de comisión sobre el precio de venta, más IVA (21%) sobre esa comisión. El cargo efectivo real es entre 13.5% y 19.4%. Adicionalmente, Product Ads puede sumar entre 5% y 15% más.",
      },
      {
        question: "¿Madsjeez realmente cobra 0% de comisión por venta?",
        answer: "Sí. Madsjeez no cobra ningún porcentaje sobre tus ventas. El modelo es suscripción fija: plan Básico gratuito, PRO $2.999/mes, ULTRA $4.999/mes. Lo que cobrás en cada venta es 100% tuyo.",
      },
      {
        question: "¿Puedo vender en Madsjeez y MercadoLibre al mismo tiempo?",
        answer: "Sí, y es lo más recomendado para comenzar. Publicar en Madsjeez no implica salir de ML. Podés operar ambos canales en paralelo, comparar resultados y hacer la transición gradual si lo preferís.",
      },
      {
        question: "¿Qué pasa si me suspenden la cuenta en MercadoLibre?",
        answer: "Una suspensión en ML significa perder acceso inmediato a todos tus clientes y ventas. Por eso la estrategia multicanal es clave: si tenés presencia en Madsjeez, una suspensión en ML no frena tu negocio.",
      },
      {
        question: "¿Madsjeez tiene el mismo tráfico que MercadoLibre?",
        answer: "No — ML tiene décadas de posicionamiento y millones de usuarios. Madsjeez es un marketplace especializado en crecimiento, con audiencia de calidad en el nicho de herramientas y maquinaria. El diferencial es que en Madsjeez no perdés comisión en ninguna venta.",
      },
    ],
    searchQuery: "herramientas maquinaria",
    related: ["desmalezadora-nafta-vs-electrica-vs-bateria"],
  },
  {
    slug: "espada-corta-vs-larga-motosierra",
    title: "Espada corta vs. larga en motosierra",
    seoTitle: "Espada de motosierra corta o larga: cuál elegir | Madsjeez",
    metaDescription: "Comparativa de espadas de motosierra cortas y largas: control, alcance y para qué tipo de corte conviene cada una.",
    excerpt: "Control y alcance: cómo elegir el largo de espada según el corte.",
    intro: "El largo de la espada define el alcance y el control de la motosierra. Elegir bien depende del grosor de lo que vas a cortar y de tu experiencia.",
    options: [
      { name: "Espada corta", tagline: "Más control y maniobra" },
      { name: "Espada larga", tagline: "Más alcance para troncos gruesos" },
    ],
    rows: [
      { criterio: "Control", valores: ["Mayor", "Menor"] },
      { criterio: "Alcance", valores: ["Menor", "Mayor"] },
      { criterio: "Peso/equilibrio", valores: ["Más manejable", "Más exigente"] },
      { criterio: "Ideal para", valores: ["Poda, ramas, principiantes", "Troncos gruesos, tala"] },
    ],
    veredicto: [
      { option: "Espada corta", cuando: "Poda, ramas finas y mejor control, sobre todo si recién empezás." },
      { option: "Espada larga", cuando: "Troncos gruesos o tala, con la potencia de motor adecuada." },
    ],
    notas: ["La espada y la cadena deben coincidir en paso, calibre y cantidad de eslabones. Verificá compatibilidad con tu modelo antes de comprar."],
    faqs: [
      { question: "¿Puedo poner una espada más larga en mi motosierra?", answer: "Solo si el motor tiene potencia suficiente y la combinación espada/cadena es compatible con tu modelo. Verificá siempre antes de comprar." },
      { question: "¿Cuál conviene para empezar?", answer: "Una espada más corta da más control y es más segura para quien recién empieza." },
    ],
    searchQuery: "espada motosierra",
    related: ["motosierra-nafta-vs-electrica", "motor-2-tiempos-vs-4-tiempos"],
  },
];

const BY_SLUG = new Map(COMPARATIVAS.map((c) => [c.slug, c]));
export function getComparativa(slug: string): Comparativa | undefined { return BY_SLUG.get(slug); }
export function allComparativaSlugs(): string[] { return COMPARATIVAS.map((c) => c.slug); }
