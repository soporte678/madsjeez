import type { BusinessProfileId } from "../sales-closer-types";
import { BUSINESS_PROFILE_IDS } from "../sales-closer-types";

const RUBRO_SIGNALS: { id: BusinessProfileId; patterns: RegExp[] }[] = [
  {
    id: "repuestos_maquinas",
    patterns: [
      /repuesto|pieza|motor|carburador|buj[ií]a|cilindro|m[aá]quina|equipo|oem|modelo|marca/i,
    ],
  },
  {
    id: "ferreteria",
    patterns: [/ferreter|tornillo|bul[oó]n|caño|pintura|broca|mecha|rosca|medida\s*\d/i],
  },
  {
    id: "servicios_web",
    patterns: [/sitio web|p[aá]gina web|landing|wordpress|seo|dominio|hosting/i],
  },
  {
    id: "apps",
    patterns: [/app|aplicaci[oó]n|android|ios|software|sistema/i],
  },
  {
    id: "automatizaciones",
    patterns: [/automatiz|bot|ia|inteligencia artificial|integraci[oó]n api|n8n|zapier/i],
  },
  {
    id: "ecommerce",
    patterns: [/tienda online|e-?commerce|carrito|checkout|env[ií]o gratis/i],
  },
  {
    id: "marketplace",
    patterns: [/madsjeez|publicaci[oó]n|mercado|comprar en la web|link de la tienda/i],
  },
];

export function normalizeBusinessProfile(raw?: string | null): BusinessProfileId {
  const v = (raw ?? "").trim().toLowerCase().replace(/-/g, "_");
  if (BUSINESS_PROFILE_IDS.includes(v as BusinessProfileId)) {
    return v as BusinessProfileId;
  }
  return "general";
}

/** Detecta rubro probable desde mensaje + hint del vendedor */
export function detectRubro(params: {
  message: string;
  businessProfileHint?: string | null;
  catalogTitles?: string[];
}): BusinessProfileId {
  const hint = normalizeBusinessProfile(params.businessProfileHint);
  if (hint !== "general") return hint;

  const text = `${params.message} ${(params.catalogTitles ?? []).join(" ")}`.toLowerCase();
  let best: BusinessProfileId = "general";
  let bestScore = 0;

  for (const { id, patterns } of RUBRO_SIGNALS) {
    let score = 0;
    for (const re of patterns) {
      if (re.test(text)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  }

  return bestScore > 0 ? best : "marketplace";
}

export function detectIntencion(message: string): string {
  const lower = message.toLowerCase();
  if (/reclamo|devoluci|estafa|no me lleg|roto|defectu/i.test(lower)) return "reclamo";
  if (/caro|mucho sale|descuento|promo|oferta/i.test(lower)) return "objecion_precio";
  if (/lo pienso|despu[eé]s|m[aá]s tarde|ahora no/i.test(lower)) return "objecion_tiempo";
  if (/otro lado|compet|mercadolibre|m[aá]s barato/i.test(lower)) return "objecion_competencia";
  if (/compatib|sirve para|calza|encaja/i.test(lower)) return "compatibilidad";
  if (/precio|cu[aá]nto sale|valor/i.test(lower)) return "precio";
  if (/stock|disponible|\bhay\b/i.test(lower)) return "stock";
  if (/env[ií]o|cp|postal|localidad/i.test(lower)) return "envio";
  if (/compr|quiero llevar|reserv|link|pasame/i.test(lower)) return "compra";
  if (/presupuesto|cotiz|cu[aá]nto sale el proyecto/i.test(lower)) return "presupuesto";
  if (/humano|vendedor|persona/i.test(lower)) return "pedido_humano";
  return "consulta";
}

export function detectObjecion(intencion: string): string {
  if (intencion.startsWith("objecion_")) return intencion.replace("objecion_", "");
  if (intencion === "compatibilidad") return "compatibilidad";
  return "";
}
