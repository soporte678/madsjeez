/**
 * Guías de compra — contenido editorial REAL anclado a verticales con
 * inventario verificado en Madsjeez (repuestos de máquinas de jardín y
 * ropa de bebé). Cada guía:
 *   - Resuelve una intención de compra concreta.
 *   - Linkea a categorías reales (slugs verificados en la DB).
 *   - No inventa precios, marcas, stock ni compatibilidades.
 *
 * Las categorías referenciadas existen y tienen ≥5 productos en stock
 * (ver docs/seo-page-inventory.csv).
 */

export type GuiaSection = {
  heading: string;
  body: string[];           // párrafos
  bullets?: string[];       // lista opcional
};

export type GuiaFaq = { q: string; a: string };

export type GuiaCategoria = { label: string; slug: string };

export type GuiaCompra = {
  slug: string;
  title: string;            // H1
  seoTitle: string;         // <title>
  metaDescription: string;
  /** Respuesta directa arriba de todo (featured-snippet friendly). */
  answer: string;
  intro: string;
  vertical: "jardin" | "bebe";
  sections: GuiaSection[];
  faqs: GuiaFaq[];
  /** Categorías reales del catálogo a las que apunta la guía. */
  categorias: GuiaCategoria[];
  /** Otras guías relacionadas por slug. */
  related: string[];
  updatedAt: string;        // ISO date — revisión real
};

export const GUIAS_COMPRA: GuiaCompra[] = [
  {
    slug: "tapa-de-arranque-desmalezadora-motosierra",
    title: "Cómo elegir la tapa de arranque correcta para tu desmalezadora o motosierra",
    seoTitle: "Tapa de arranque para desmalezadora y motosierra: cómo elegir | Madsjeez",
    metaDescription:
      "Guía para identificar y comprar la tapa de arranque compatible con tu desmalezadora o motosierra: marca, modelo, tipo de enganche y resorte. Repuestos en Madsjeez.",
    answer:
      "Para elegir la tapa de arranque correcta necesitás 3 datos: la marca y modelo de tu máquina, el tipo de enganche del cesto (de uña/trinquete o de pestaña), y si necesitás la tapa completa (con resorte, polea y cuerda) o solo la carcasa.",
    intro:
      "La tapa de arranque (o arrancador retráctil) es una de las piezas que más se rompe en desmalezadoras y motosierras: la cuerda se corta, el resorte pierde tensión o las uñas del cesto se desgastan. Comprar la pieza equivocada es el error más común. Esta guía te ayuda a identificar la compatible sin adivinar.",
    vertical: "jardin",
    sections: [
      {
        heading: "1. Identificá marca y modelo de tu máquina",
        body: [
          "El dato más importante está en la etiqueta del motor o en el cuerpo de la máquina. Anotá marca y modelo exactos. Muchas desmalezadoras económicas comparten el mismo motor de 2 tiempos (43cc o 52cc son las cilindradas más comunes en Argentina), por lo que la tapa suele ser intercambiable entre modelos del mismo formato.",
        ],
        bullets: [
          "Cilindrada típica de desmalezadoras: 33cc, 43cc, 52cc.",
          "Si no encontrás el modelo, la cilindrada + la forma del arrancador suele alcanzar.",
        ],
      },
      {
        heading: "2. Mirá el tipo de enganche al cigüeñal",
        body: [
          "La tapa engancha el motor a través de un cesto o copa de arranque. Hay dos sistemas: de uñas/trinquete (las uñas salen y enganchan al tirar) y de pestaña fija. Tienen que coincidir tapa y cesto. Si comprás la tapa pero tu cesto está gastado, conviene reemplazar el conjunto.",
        ],
      },
      {
        heading: "3. ¿Tapa completa o solo la carcasa?",
        body: [
          "La tapa completa viene con carcasa, polea, resorte y cuerda lista para usar. Si solo se te cortó la cuerda o se aflojó el resorte, podés comprar el repuesto suelto, pero para la mayoría de los usuarios la tapa completa ahorra tiempo y evita errores de armado del resorte (que es la parte más complicada).",
        ],
      },
    ],
    faqs: [
      {
        q: "¿La tapa de arranque de una desmalezadora sirve para una motosierra?",
        a: "No necesariamente. Aunque el principio es el mismo, la forma de la carcasa, el diámetro y el tipo de enganche cambian entre máquinas. Verificá siempre marca/modelo o llevá la pieza vieja como referencia.",
      },
      {
        q: "¿Cómo sé si el problema es la tapa o el resorte?",
        a: "Si la cuerda no retrae o queda floja, suele ser el resorte. Si la cuerda tira pero no engancha el motor, son las uñas del cesto o el trinquete. Si la cuerda está cortada, alcanza con cambiar la cuerda.",
      },
    ],
    categorias: [
      { label: "Tapas de arranque para máquinas de jardín", slug: "tapas-de-arranque-para-maquinas-de-jardin" },
      { label: "Tapas de arranque (repuestos)", slug: "tapas-de-arranque-la455592" },
      { label: "Kits de repuestos", slug: "kits-de-repuestos-la455614" },
    ],
    related: ["carburador-desmalezadora-compatible", "espada-cadena-motosierra"],
    updatedAt: "2026-06-05",
  },
  {
    slug: "carburador-desmalezadora-compatible",
    title: "Carburador de desmalezadora: cómo identificar el repuesto compatible",
    seoTitle: "Carburador para desmalezadora compatible: cómo elegir | Madsjeez",
    metaDescription:
      "Cómo identificar el carburador compatible con tu desmalezadora o motosierra por cilindrada y tipo. Repuestos de carburadores en Madsjeez Argentina.",
    answer:
      "El carburador se elige por cilindrada del motor (33cc, 43cc, 52cc son las más comunes), el tipo de membrana/diafragma, y la posición de los tornillos de ajuste. Lo más seguro es comparar con el carburador original o indicar marca y modelo de la máquina.",
    intro:
      "Un motor que arranca y se apaga, que no toma revoluciones o que pierde combustible suele tener el carburador sucio o gastado. Cuando la limpieza no alcanza, hay que reemplazarlo. El problema es que un carburador del diámetro equivocado no entra o no regula bien. Esta guía te ayuda a comprar el correcto.",
    vertical: "jardin",
    sections: [
      {
        heading: "1. La cilindrada manda",
        body: [
          "El carburador está dimensionado para el cilindro del motor. Un carburador de 43cc no rinde igual en un motor de 52cc. La cilindrada está estampada en el motor o en el manual. En Argentina la mayoría de las desmalezadoras de jardín usan motores de 2 tiempos de 33, 43 o 52cc.",
        ],
      },
      {
        heading: "2. Tipo de carburador: a diafragma",
        body: [
          "Las desmalezadoras y motosierras usan carburadores a diafragma (no a cuba con flotante como un auto), porque trabajan en cualquier posición. Verificá la cantidad y disposición de los tornillos de regulación (L, H y ralentí) para que coincidan con tu máquina.",
        ],
      },
      {
        heading: "3. Comparar con el original es la forma más segura",
        body: [
          "Sacá el carburador viejo y compará: diámetro de la boca, posición de la entrada de combustible, ubicación del cebador y de los tornillos. Si todo coincide, es compatible. Llevar la pieza vieja como muestra evita el 90% de los errores de compra.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Conviene reparar o cambiar el carburador?",
        a: "Si el problema es suciedad o una membrana reseca, un kit de reparación (membranas y juntas) puede alcanzar. Si el cuerpo está rayado o el cebador no sella, conviene reemplazar el carburador completo.",
      },
      {
        q: "¿Un carburador genérico sirve?",
        a: "Muchos carburadores genéricos son compatibles con motores de cilindrada estándar (43cc/52cc), pero hay que verificar el diámetro de boca y la disposición de tornillos antes de comprar.",
      },
    ],
    categorias: [
      { label: "Carburadores (repuestos)", slug: "carburadores-la413716" },
      { label: "Carburadores", slug: "carburadores-la413715" },
      { label: "Kits de repuestos", slug: "kits-de-repuestos-la455614" },
    ],
    related: ["tapa-de-arranque-desmalezadora-motosierra", "carreteles-tanzas-desmalezadora"],
    updatedAt: "2026-06-05",
  },
  {
    slug: "carreteles-tanzas-desmalezadora",
    title: "Carreteles y tanzas para desmalezadora: guía de compra",
    seoTitle: "Carreteles y tanzas para desmalezadora: cómo elegir | Madsjeez",
    metaDescription:
      "Cómo elegir el carretel y la tanza correctos para tu desmalezadora: tipo de cabezal, grosor de tanza y compatibilidad. Repuestos en Madsjeez.",
    answer:
      "El carretel se elige por el tipo de cabezal de tu desmalezadora (de golpe/tap, automático o manual) y la rosca del eje. La tanza se elige por grosor (2.4mm y 3.0mm son los más usados) según el tipo de pasto: más fina para césped blando, más gruesa para maleza dura.",
    intro:
      "El carretel (o cabezal) y la tanza son los consumibles que más se reponen en una desmalezadora. Elegir el grosor de tanza adecuado mejora el corte y reduce el consumo. Y un carretel compatible evita que la tanza se trabe o salga disparada.",
    vertical: "jardin",
    sections: [
      {
        heading: "1. Tipo de cabezal",
        body: [
          "Hay cabezales de golpe (tap & go: golpeás el suelo y sale más tanza), automáticos (sueltan tanza solos) y manuales. Reponé el mismo tipo que trae tu máquina o verificá que el repuesto sea compatible con la rosca del eje de tu desmalezadora.",
        ],
      },
      {
        heading: "2. Grosor de tanza según el trabajo",
        body: [
          "La tanza se mide en milímetros de diámetro. Como referencia general:",
        ],
        bullets: [
          "2.0–2.4 mm: césped blando y bordes, menor esfuerzo del motor.",
          "2.7–3.0 mm: pasto alto y maleza, mayor durabilidad.",
          "3.3 mm o más: solo para máquinas potentes (52cc+) y maleza dura.",
        ],
      },
      {
        heading: "3. Forma de la tanza",
        body: [
          "Además del grosor, la sección importa: la redonda es económica y silenciosa; la cuadrada o estrellada corta más agresivo. Para uso doméstico, la redonda del grosor adecuado suele ser suficiente.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Cualquier tanza entra en cualquier carretel?",
        a: "No. El carretel está pensado para un rango de grosor. Si ponés una tanza demasiado gruesa puede no enrollar bien o trabarse; demasiado fina, se corta seguido.",
      },
      {
        q: "¿Cómo sé qué carretel es compatible?",
        a: "Verificá la rosca del eje (medida y sentido) y el tipo de enganche. Lo más seguro es comparar con el cabezal original de tu máquina.",
      },
    ],
    categorias: [
      { label: "Carreteles para desmalezadoras y bordeadoras", slug: "carreteles-para-desmalezadoras-y-bordeadoras-de-cesped" },
      { label: "Carreteles (repuestos)", slug: "carreteles-la413606" },
      { label: "Tanzas", slug: "tanzas-la429066" },
    ],
    related: ["tapa-de-arranque-desmalezadora-motosierra", "carburador-desmalezadora-compatible"],
    updatedAt: "2026-06-05",
  },
  {
    slug: "espada-cadena-motosierra",
    title: "Espada y cadena para motosierra: cómo elegir el largo y el paso correctos",
    seoTitle: "Espada y cadena para motosierra: cómo elegir | Madsjeez",
    metaDescription:
      "Cómo elegir la espada y la cadena compatibles con tu motosierra: largo, paso, calibre y cantidad de eslabones. Repuestos en Madsjeez Argentina.",
    answer:
      "La cadena se define por 3 medidas que tienen que coincidir con tu espada: el paso (distancia entre remaches, ej. 3/8\" o .325\"), el calibre (espesor del eslabón, ej. 1.3mm o 1.5mm) y la cantidad de eslabones de arrastre. La espada se elige por el largo (en pulgadas) y el tipo de anclaje de tu motosierra.",
    intro:
      "Cambiar la espada o la cadena por una incompatible es peligroso y daña la máquina. A diferencia de otras piezas, acá hay 3 medidas que deben coincidir sí o sí. Esta guía te explica cómo leerlas para comprar tranquilo.",
    vertical: "jardin",
    sections: [
      {
        heading: "1. El paso (pitch)",
        body: [
          "Es la distancia entre tres remaches consecutivos dividida por dos. Los pasos más comunes en motosierras domésticas son .325\" y 3/8\". El paso de la cadena debe coincidir con el piñón y la punta de la espada.",
        ],
      },
      {
        heading: "2. El calibre (gauge)",
        body: [
          "Es el espesor del eslabón de arrastre, la parte que corre dentro de la guía de la espada. Valores típicos: 1.3 mm (.050\") y 1.5 mm (.058\"). Si el calibre no coincide, la cadena baila o no entra.",
        ],
      },
      {
        heading: "3. Largo de espada y cantidad de eslabones",
        body: [
          "El largo se mide en pulgadas (14\", 16\", 18\" son habituales en uso doméstico). Una espada más larga corta troncos más gruesos pero exige más al motor. La cantidad de eslabones de arrastre de la cadena tiene que ser exacta para ese largo de espada.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Dónde están estos datos en mi motosierra?",
        a: "Suelen estar grabados en la espada original (paso, calibre y largo). Si no, el manual de la máquina los indica. Llevar la cadena vieja como muestra también sirve.",
      },
      {
        q: "¿Puedo poner una espada más larga que la original?",
        a: "Solo si tu motosierra tiene potencia suficiente y el fabricante lo permite. Una espada demasiado larga sobrecarga el motor y es insegura.",
      },
    ],
    categorias: [
      { label: "Espadas para motosierras", slug: "espadas-para-motosierras-la455611" },
      { label: "Cadenas para motosierras", slug: "cadenas-para-motosierras-la455588" },
    ],
    related: ["tapa-de-arranque-desmalezadora-motosierra"],
    updatedAt: "2026-06-05",
  },
  {
    slug: "talles-body-bebe",
    title: "Cómo elegir el talle de body para bebé según la edad",
    seoTitle: "Talles de body para bebé: guía por edad y temporada | Madsjeez",
    metaDescription:
      "Guía de talles de body para bebé por edad, qué tela elegir según la temporada y cuántas unidades comprar. Ropa de bebé en Madsjeez Argentina.",
    answer:
      "Los bodies de bebé se eligen por talle según edad aproximada (0, 1, 2, 3… que equivalen a meses o rangos de meses) pero conviene comprar un talle más grande porque los bebés crecen rápido. En algodón para verano y en algodón más abrigado o con interlock para invierno.",
    intro:
      "El body es la prenda base del bebé y la que más se repone. Elegir bien el talle y la tela evita compras que quedan chicas en semanas. Esta guía te orienta por edad y temporada, sin vueltas.",
    vertical: "bebe",
    sections: [
      {
        heading: "1. Talle por edad (orientativo)",
        body: [
          "Los talles de bebé varían un poco entre marcas, pero como referencia general en Argentina:",
        ],
        bullets: [
          "Talle 0: recién nacido (aprox. 0–3 meses).",
          "Talle 1: aprox. 3–6 meses.",
          "Talle 2: aprox. 6–9 meses.",
          "Talle 3: aprox. 9–12 meses.",
        ],
      },
      {
        heading: "2. Comprá pensando en el crecimiento",
        body: [
          "Si dudás entre dos talles, elegí el más grande. Un body justo dura poco. La mayoría de las familias compran de a varias unidades del mismo talle porque se usan y lavan a diario.",
        ],
      },
      {
        heading: "3. Tela según temporada",
        body: [
          "Para verano, algodón liviano y manga corta. Para invierno, algodón más grueso o de tipo interlock, y manga larga. El algodón es la opción más segura para la piel del bebé.",
        ],
      },
    ],
    faqs: [
      {
        q: "¿Cuántos bodies conviene tener?",
        a: "Depende del uso, pero al ser una prenda que se cambia varias veces al día, lo habitual es tener varias unidades del talle en uso para no quedarte sin recambio entre lavados.",
      },
      {
        q: "¿Body de manga corta o larga?",
        a: "Manga corta para temporada cálida o para usar bajo otra prenda; manga larga para frío o como prenda principal en invierno.",
      },
    ],
    categorias: [
      { label: "Ropa para bebés", slug: "bebes-ropa-para-bebes" },
      { label: "Bodys", slug: "bodys-mla10209" },
      { label: "Medias", slug: "medias-la109279" },
    ],
    related: [],
    updatedAt: "2026-06-05",
  },
];

export function getGuia(slug: string): GuiaCompra | undefined {
  return GUIAS_COMPRA.find((g) => g.slug === slug);
}

/** Guías que apuntan a una categoría dada (para internal linking inverso). */
export function getGuiasForCategory(categorySlug: string): GuiaCompra[] {
  return GUIAS_COMPRA.filter((g) => g.categorias.some((c) => c.slug === categorySlug));
}
