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
