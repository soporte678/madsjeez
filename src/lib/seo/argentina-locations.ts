/** Provincias y localidades para landings SEO «marketplace + ubicación». */
export type ArgentinaLocality = {
  slug: string;
  name: string;
  provinceSlug: string;
  provinceName: string;
};

export type ArgentinaProvince = {
  slug: string;
  name: string;
  localities: Array<{ slug: string; name: string }>;
};

export const ARGENTINA_PROVINCES: ArgentinaProvince[] = [
  {
    slug: "buenos-aires",
    name: "Buenos Aires",
    localities: [
      { slug: "la-plata", name: "La Plata" },
      { slug: "mar-del-plata", name: "Mar del Plata" },
      { slug: "bahia-blanca", name: "Bahía Blanca" },
      { slug: "tandil", name: "Tandil" },
      { slug: "quilmes", name: "Quilmes" },
      { slug: "lanus", name: "Lanús" },
      { slug: "moron", name: "Morón" },
      { slug: "san-isidro", name: "San Isidro" },
      { slug: "tigre", name: "Tigre" },
      { slug: "pilar", name: "Pilar" },
      { slug: "carlos-spegazzini", name: "Carlos Spegazzini" },
      { slug: "ezeiza", name: "Ezeiza" },
      { slug: "lomas-de-zamora", name: "Lomas de Zamora" },
    ],
  },
  {
    slug: "caba",
    name: "Ciudad Autónoma de Buenos Aires",
    localities: [
      { slug: "palermo", name: "Palermo" },
      { slug: "belgrano", name: "Belgrano" },
      { slug: "caballito", name: "Caballito" },
      { slug: "recoleta", name: "Recoleta" },
      { slug: "microcentro", name: "Microcentro" },
    ],
  },
  { slug: "cordoba", name: "Córdoba", localities: [{ slug: "cordoba-capital", name: "Córdoba Capital" }, { slug: "villa-maria", name: "Villa María" }, { slug: "rio-cuarto", name: "Río Cuarto" }] },
  { slug: "santa-fe", name: "Santa Fe", localities: [{ slug: "rosario", name: "Rosario" }, { slug: "santa-fe-capital", name: "Santa Fe Capital" }, { slug: "rafaela", name: "Rafaela" }] },
  { slug: "mendoza", name: "Mendoza", localities: [{ slug: "mendoza-capital", name: "Mendoza Capital" }, { slug: "san-rafael", name: "San Rafael" }] },
  { slug: "tucuman", name: "Tucumán", localities: [{ slug: "san-miguel-de-tucuman", name: "San Miguel de Tucumán" }] },
  { slug: "salta", name: "Salta", localities: [{ slug: "salta-capital", name: "Salta Capital" }] },
  { slug: "entre-rios", name: "Entre Ríos", localities: [{ slug: "parana", name: "Paraná" }, { slug: "concordia", name: "Concordia" }] },
  { slug: "corrientes", name: "Corrientes", localities: [{ slug: "corrientes-capital", name: "Corrientes Capital" }] },
  { slug: "misiones", name: "Misiones", localities: [{ slug: "posadas", name: "Posadas" }] },
  { slug: "chaco", name: "Chaco", localities: [{ slug: "resistencia", name: "Resistencia" }] },
  { slug: "formosa", name: "Formosa", localities: [{ slug: "formosa-capital", name: "Formosa Capital" }] },
  { slug: "santiago-del-estero", name: "Santiago del Estero", localities: [{ slug: "santiago-capital", name: "Santiago del Estero Capital" }] },
  { slug: "jujuy", name: "Jujuy", localities: [{ slug: "san-salvador-de-jujuy", name: "San Salvador de Jujuy" }] },
  { slug: "catamarca", name: "Catamarca", localities: [{ slug: "san-fernando-del-valle", name: "San Fernando del Valle" }] },
  { slug: "la-rioja", name: "La Rioja", localities: [{ slug: "la-rioja-capital", name: "La Rioja Capital" }] },
  { slug: "san-juan", name: "San Juan", localities: [{ slug: "san-juan-capital", name: "San Juan Capital" }] },
  { slug: "san-luis", name: "San Luis", localities: [{ slug: "san-luis-capital", name: "San Luis Capital" }] },
  { slug: "la-pampa", name: "La Pampa", localities: [{ slug: "santa-rosa", name: "Santa Rosa" }] },
  { slug: "neuquen", name: "Neuquén", localities: [{ slug: "neuquen-capital", name: "Neuquén Capital" }] },
  { slug: "rio-negro", name: "Río Negro", localities: [{ slug: "bariloche", name: "Bariloche" }, { slug: "viedma", name: "Viedma" }] },
  { slug: "chubut", name: "Chubut", localities: [{ slug: "comodoro-rivadavia", name: "Comodoro Rivadavia" }, { slug: "trelew", name: "Trelew" }] },
  { slug: "santa-cruz", name: "Santa Cruz", localities: [{ slug: "rio-gallegos", name: "Río Gallegos" }] },
  { slug: "tierra-del-fuego", name: "Tierra del Fuego", localities: [{ slug: "ushuaia", name: "Ushuaia" }] },
];

export function findProvince(slug: string): ArgentinaProvince | undefined {
  return ARGENTINA_PROVINCES.find((p) => p.slug === slug);
}

export function findLocality(
  provinceSlug: string,
  localitySlug: string
): ArgentinaLocality | undefined {
  const prov = findProvince(provinceSlug);
  if (!prov) return undefined;
  const loc = prov.localities.find((l) => l.slug === localitySlug);
  if (!loc) return undefined;
  return {
    slug: loc.slug,
    name: loc.name,
    provinceSlug: prov.slug,
    provinceName: prov.name,
  };
}

export function allMarketplaceLocationPaths(): Array<{ provincia: string; localidad?: string }> {
  const paths: Array<{ provincia: string; localidad?: string }> = [];
  for (const p of ARGENTINA_PROVINCES) {
    paths.push({ provincia: p.slug });
    for (const l of p.localities) {
      paths.push({ provincia: p.slug, localidad: l.slug });
    }
  }
  return paths;
}
