/**
 * Páginas por marca de máquina. Reglas estrictas:
 * - Madsjeez NO es distribuidor oficial: se aclara en cada página.
 * - Sin logos ni imágenes de marca (riesgo de marca registrada).
 * - Los productos pueden ser originales o compatibles según el vendedor.
 * - Solo marcas con resultados reales en el catálogo (evita páginas vacías).
 * - Rutea a búsqueda real; "verificá compatibilidad antes de comprar".
 * Datos de matches verificados sobre products activos con stock (jun-2026).
 */

export type Marca = {
  slug: string;
  name: string;
  seoTitle: string;
  metaDescription: string;
  excerpt: string;
  intro: string;
  tipos: string[];
  searchQuery: string;
  repRelated: string[]; // slugs de /reparacion
  related: string[]; // slugs de otras marcas
};

export const MARCAS: Marca[] = [
  {
    slug: "niwa",
    name: "Niwa",
    seoTitle: "Repuestos y productos Niwa | Madsjeez",
    metaDescription: "Productos y repuestos compatibles Niwa publicados por vendedores en Madsjeez. Verificá compatibilidad y modelo antes de comprar.",
    excerpt: "Herramientas y maquinaria de jardín; productos y repuestos compatibles.",
    intro: "Niwa es una marca habitual en el mercado argentino de herramientas y maquinaria de jardín y hogar. En Madsjeez vas a encontrar productos Niwa y repuestos compatibles publicados por distintos vendedores.",
    tipos: ["Desmalezadoras y bordeadoras", "Motosierras y equipos de jardín", "Herramientas y accesorios", "Repuestos compatibles (tanza, cabezales, filtros, bujías)"],
    searchQuery: "niwa",
    repRelated: ["desmalezadora-no-arranca", "identificar-repuesto-por-medidas", "mantenimiento-desmalezadora"],
    related: ["gamma", "lusqtoff", "omaha"],
  },
  {
    slug: "gamma",
    name: "Gamma",
    seoTitle: "Repuestos y productos Gamma | Madsjeez",
    metaDescription: "Productos y repuestos compatibles Gamma en Madsjeez, publicados por vendedores. Verificá modelo y medidas antes de comprar.",
    excerpt: "Herramientas y equipamiento; productos y repuestos compatibles.",
    intro: "Gamma es una marca conocida en Argentina por herramientas, maquinaria y equipamiento. En Madsjeez encontrás productos Gamma y repuestos compatibles de distintos vendedores.",
    tipos: ["Herramientas eléctricas y manuales", "Maquinaria de jardín", "Compresores y equipamiento", "Repuestos y accesorios compatibles"],
    searchQuery: "gamma",
    repRelated: ["identificar-repuesto-por-medidas", "mantenimiento-desmalezadora", "cambiar-bujia-filtro"],
    related: ["niwa", "lusqtoff", "omaha"],
  },
  {
    slug: "stihl",
    name: "Stihl",
    seoTitle: "Repuestos compatibles Stihl | Madsjeez",
    metaDescription: "Repuestos compatibles para máquinas Stihl (motosierras, desmalezadoras) en Madsjeez. No somos distribuidor oficial: verificá compatibilidad.",
    excerpt: "Motosierras y forestal; repuestos originales o compatibles según el vendedor.",
    intro: "Stihl es una marca líder en motosierras, desmalezadoras y equipos forestales. En Madsjeez vas a encontrar repuestos y accesorios para máquinas Stihl —originales o compatibles según el vendedor—. Madsjeez no es distribuidor oficial de Stihl.",
    tipos: ["Espadas y cadenas (verificá paso y calibre)", "Filtros, bujías y kits de mantenimiento", "Tanza y cabezales para desmalezadoras", "Repuestos compatibles para motosierras"],
    searchQuery: "stihl",
    repRelated: ["motosierra-no-arranca", "afilar-tensar-cadena-motosierra", "motosierra-no-lubrica-cadena"],
    related: ["honda", "shizen", "niwa"],
  },
  {
    slug: "lusqtoff",
    name: "Lusqtoff",
    seoTitle: "Repuestos y productos Lusqtoff | Madsjeez",
    metaDescription: "Productos y repuestos compatibles Lusqtoff en Madsjeez, publicados por vendedores. Verificá compatibilidad y modelo antes de comprar.",
    excerpt: "Herramientas y maquinaria; productos y repuestos compatibles.",
    intro: "Lusqtoff es una marca presente en el mercado argentino de herramientas y maquinaria. En Madsjeez encontrás productos Lusqtoff y repuestos compatibles de distintos vendedores.",
    tipos: ["Herramientas eléctricas", "Maquinaria de jardín y construcción", "Soldadoras y compresores", "Repuestos y accesorios compatibles"],
    searchQuery: "lusqtoff",
    repRelated: ["identificar-repuesto-por-medidas", "cambiar-bujia-filtro", "mantenimiento-desmalezadora"],
    related: ["niwa", "gamma", "omaha"],
  },
  {
    slug: "omaha",
    name: "Omaha",
    seoTitle: "Repuestos y productos Omaha | Madsjeez",
    metaDescription: "Productos y repuestos compatibles Omaha en Madsjeez, publicados por vendedores. Verificá modelo y medidas antes de comprar.",
    excerpt: "Maquinaria de jardín y hogar; productos y repuestos compatibles.",
    intro: "Omaha es una marca habitual en maquinaria de jardín y hogar en Argentina. En Madsjeez encontrás productos Omaha y repuestos compatibles publicados por vendedores.",
    tipos: ["Desmalezadoras y equipos de jardín", "Herramientas y accesorios", "Repuestos compatibles (tanza, filtros, bujías)"],
    searchQuery: "omaha",
    repRelated: ["desmalezadora-no-arranca", "mantenimiento-desmalezadora", "cambiar-cargar-tanza"],
    related: ["niwa", "gamma", "lusqtoff"],
  },
  {
    slug: "honda",
    name: "Honda",
    seoTitle: "Repuestos compatibles Honda (motores) | Madsjeez",
    metaDescription: "Repuestos y productos para motores Honda en Madsjeez, publicados por vendedores. No somos distribuidor oficial: verificá compatibilidad.",
    excerpt: "Motores y generadores; repuestos originales o compatibles según el vendedor.",
    intro: "Honda es reconocida por sus motores estacionarios, generadores y motobombas. En Madsjeez encontrás repuestos y productos para equipos con motor Honda —originales o compatibles según el vendedor—. Madsjeez no es distribuidor oficial de Honda.",
    tipos: ["Repuestos para motores estacionarios", "Filtros, bujías y kits de mantenimiento", "Accesorios para generadores y motobombas", "Repuestos compatibles"],
    searchQuery: "honda",
    repRelated: ["cambiar-bujia-filtro", "como-hacer-mezcla-2-tiempos", "identificar-repuesto-por-medidas"],
    related: ["stihl", "shizen", "gamma"],
  },
  {
    slug: "shizen",
    name: "Shizen",
    seoTitle: "Repuestos y productos Shizen | Madsjeez",
    metaDescription: "Productos y repuestos compatibles Shizen en Madsjeez, publicados por vendedores. Verificá compatibilidad y modelo antes de comprar.",
    excerpt: "Maquinaria de jardín y agro; productos y repuestos compatibles.",
    intro: "Shizen es una marca presente en maquinaria de jardín y agro en Argentina. En Madsjeez encontrás productos Shizen y repuestos compatibles de distintos vendedores.",
    tipos: ["Desmalezadoras y motosierras", "Equipos de jardín y agro", "Repuestos compatibles (espadas, cadenas, tanza, filtros)"],
    searchQuery: "shizen",
    repRelated: ["motosierra-no-arranca", "afilar-tensar-cadena-motosierra", "mantenimiento-motosierra"],
    related: ["stihl", "honda", "niwa"],
  },
];

const BY_SLUG = new Map(MARCAS.map((m) => [m.slug, m]));
export function getMarca(slug: string): Marca | undefined { return BY_SLUG.get(slug); }
export function allMarcaSlugs(): string[] { return MARCAS.map((m) => m.slug); }
