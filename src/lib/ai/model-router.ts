import { chatOllama } from "@/lib/ai/ollama-client";
import { extractJsonObject } from "@/lib/ai/ollama-json";
import {
  getModelRouterEnv,
  modelForTier,
  type ModelTier,
} from "@/lib/ai/sales-closer-env";
import {
  CLASSIFIER_RETRY_USER,
  CLASSIFIER_SYSTEM_PROMPT,
} from "@/lib/ai/prompts/classifier";
import {
  detectIntencion,
  detectRubro,
} from "@/lib/ai/prompts/closer-router";
import type { BusinessProfileId } from "@/lib/ai/sales-closer-types";

export type ClassifierOutput = {
  rubro: string;
  intencion: string;
  complejidad: "baja" | "media" | "alta";
  etapa_lead: string;
  requiere_14b: boolean;
  modelo_recomendado: "3b" | "7b" | "14b";
  motivo: string;
  confianza: number;
};

export type MarketplaceModelOutput = {
  respuesta_cliente: string;
  accion_recomendada: string;
  dato_faltante: string;
  etapa_lead: string;
  confianza: number;
  debe_escalar_14b: boolean;
  motivo_escalamiento: string;
  etiquetas: string[];
};

export type CloserModelOutput = {
  respuesta_cliente: string;
  rubro: string;
  intencion: string;
  etapa_lead: string;
  objecion: string;
  dato_faltante: string;
  accion_recomendada: string;
  derivar_humano: boolean;
  confianza: number;
  etiquetas: string[];
};

export type ModelSelection = {
  tier: ModelTier;
  model: string;
  reason: string;
  classifier?: ClassifierOutput;
};

const TECHNICAL_RE =
  /compatib|sirve para|calza|encaja|carburador|repuesto|pieza|oem|modelo|marca|medida|cc\b|motoguada/i;
const WEB_APP_RE =
  /sitio web|p[aá]gina web|\bweb\b.*vender|landing|wordpress|seo|\bapp\b|aplicaci[oó]n|android|ios|automatiz|integraci[oó]n|e-?commerce custom|tienda online propia/i;
const OBJECTION_RE =
  /caro|mucho sale|descuento|promo|oferta|lo pienso|compet|mercadolibre|m[aá]s barato/i;
const SIMPLE_RE =
  /^(hola|buen[oa]s?|buen d[ií]a)[\s,!?.]*$|disponible|precio|cu[aá]nto sale|env[ií]o|cp\b|localidad|stock|\bhay\b/i;

function parseClassifier(parsed: unknown, message: string): ClassifierOutput {
  const o = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  const fallbackIntent = detectIntencion(message);
  const confianza =
    typeof o.confianza === "number"
      ? Math.max(0, Math.min(1, o.confianza))
      : 0.5;
  const modeloRaw = String(o.modelo_recomendado ?? "7b").toLowerCase();
  const modelo_recomendado: ClassifierOutput["modelo_recomendado"] =
    modeloRaw.includes("14") ? "14b" : modeloRaw.includes("3") ? "3b" : "7b";

  return {
    rubro: typeof o.rubro === "string" ? o.rubro : "marketplace",
    intencion: typeof o.intencion === "string" ? o.intencion : fallbackIntent,
    complejidad:
      o.complejidad === "alta" || o.complejidad === "media" || o.complejidad === "baja"
        ? o.complejidad
        : "media",
    etapa_lead: typeof o.etapa_lead === "string" ? o.etapa_lead : "new",
    requiere_14b: Boolean(o.requiere_14b),
    modelo_recomendado,
    motivo: typeof o.motivo === "string" ? o.motivo : "clasificador",
    confianza,
  };
}

function ruleBasedSelection(message: string, businessProfile?: string): ModelSelection {
  const lower = message.toLowerCase().trim();
  const rubro = detectRubro({ message, businessProfileHint: businessProfile });

  if (TECHNICAL_RE.test(message) || WEB_APP_RE.test(message) || OBJECTION_RE.test(message)) {
    return {
      tier: "closer",
      model: modelForTier("closer"),
      reason: TECHNICAL_RE.test(message)
        ? "consulta_tecnica_compatibilidad"
        : WEB_APP_RE.test(message)
          ? "web_app_automation"
          : "objecion_comercial",
    };
  }

  if (
    ["servicios_web", "apps", "automatizaciones"].includes(rubro) &&
    !/^(hola|buenas)/i.test(lower)
  ) {
    return {
      tier: "closer",
      model: modelForTier("closer"),
      reason: `rubro_${rubro}`,
    };
  }

  if (SIMPLE_RE.test(lower) || lower.length < 40) {
    return {
      tier: "marketplace",
      model: modelForTier("marketplace"),
      reason: "consulta_marketplace_simple",
    };
  }

  return {
    tier: "marketplace",
    model: modelForTier("marketplace"),
    reason: "default_marketplace",
  };
}

export function selectModelForMessage(params: {
  message: string;
  businessProfile?: string;
  classifier?: ClassifierOutput;
}): ModelSelection {
  const rules = ruleBasedSelection(params.message, params.businessProfile);

  if (!getModelRouterEnv().routerEnabled) {
    return {
      tier: "closer",
      model: modelForTier("closer"),
      reason: "router_disabled",
    };
  }

  const c = params.classifier;
  if (c) {
    if (c.requiere_14b || c.modelo_recomendado === "14b" || c.complejidad === "alta") {
      return {
        tier: "closer",
        model: modelForTier("closer"),
        reason: c.motivo || "classifier_14b",
        classifier: c,
      };
    }
    if (c.modelo_recomendado === "7b" || c.complejidad === "baja") {
      return {
        tier: "marketplace",
        model: modelForTier("marketplace"),
        reason: c.motivo || "classifier_7b",
        classifier: c,
      };
    }
  }

  return { ...rules, classifier: c };
}

export async function classifyMessage(message: string): Promise<ClassifierOutput | null> {
  const env = getModelRouterEnv();
  if (!env.routerEnabled) return null;

  try {
    const { raw } = await chatOllama({
      model: env.classifierModel,
      tier: "classifier",
      format: "json",
      messages: [
        { role: "system", content: CLASSIFIER_SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    });

    let parsed = extractJsonObject(raw);
    if (!parsed) {
      const retry = await chatOllama({
        model: env.classifierModel,
        tier: "classifier",
        format: "json",
        messages: [
          { role: "system", content: CLASSIFIER_SYSTEM_PROMPT },
          { role: "user", content: message },
          { role: "assistant", content: raw },
          { role: "user", content: CLASSIFIER_RETRY_USER },
        ],
      });
      parsed = extractJsonObject(retry.raw);
    }

    if (!parsed) return null;
    return parseClassifier(parsed, message);
  } catch {
    return null;
  }
}

export function shouldEscalateTo14B(params: {
  message: string;
  marketplace?: MarketplaceModelOutput;
}): { escalate: boolean; reason: string } {
  const env = getModelRouterEnv();
  if (!env.escalateTo14B) return { escalate: false, reason: "escalation_disabled" };

  const m = params.marketplace;
  if (!m) {
    if (TECHNICAL_RE.test(params.message) || WEB_APP_RE.test(params.message)) {
      return { escalate: true, reason: "heuristic_keywords" };
    }
    return { escalate: false, reason: "no_marketplace_output" };
  }

  if (m.debe_escalar_14b) {
    return { escalate: true, reason: m.motivo_escalamiento || "model_flag" };
  }

  if (m.confianza < 0.72) {
    return { escalate: true, reason: "low_confidence" };
  }

  const resp = m.respuesta_cliente.trim().toLowerCase();
  const generic =
    resp.length < 12 ||
    /contame qu[eé]|escrib[ií]|gracias por escribir|en qu[eé] te ayudo/i.test(resp);
  if (generic && !m.dato_faltante && m.accion_recomendada === "calificar") {
    return { escalate: true, reason: "generic_response_no_next_step" };
  }

  if (TECHNICAL_RE.test(params.message) || WEB_APP_RE.test(params.message)) {
    return { escalate: true, reason: "technical_or_web_keywords" };
  }

  if (OBJECTION_RE.test(params.message)) {
    return { escalate: true, reason: "objection_detected" };
  }

  return { escalate: false, reason: "marketplace_sufficient" };
}

export function parseMarketplaceOutput(parsed: unknown): MarketplaceModelOutput {
  const o = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  return {
    respuesta_cliente:
      typeof o.respuesta_cliente === "string" ? o.respuesta_cliente.trim() : "",
    accion_recomendada:
      typeof o.accion_recomendada === "string" ? o.accion_recomendada : "calificar",
    dato_faltante: typeof o.dato_faltante === "string" ? o.dato_faltante : "",
    etapa_lead: typeof o.etapa_lead === "string" ? o.etapa_lead : "new",
    confianza:
      typeof o.confianza === "number"
        ? Math.max(0, Math.min(1, o.confianza))
        : 0.5,
    debe_escalar_14b: Boolean(o.debe_escalar_14b),
    motivo_escalamiento:
      typeof o.motivo_escalamiento === "string" ? o.motivo_escalamiento : "",
    etiquetas: Array.isArray(o.etiquetas) ? o.etiquetas.map(String).slice(0, 12) : [],
  };
}

export function parseCloserRoutedOutput(
  parsed: unknown,
  fallbackRubro: BusinessProfileId,
  fallbackIntent: string
): CloserModelOutput {
  const o = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  return {
    respuesta_cliente:
      typeof o.respuesta_cliente === "string" ? o.respuesta_cliente.trim() : "",
    rubro: typeof o.rubro === "string" ? o.rubro : fallbackRubro,
    intencion: typeof o.intencion === "string" ? o.intencion : fallbackIntent,
    etapa_lead: typeof o.etapa_lead === "string" ? o.etapa_lead : "new",
    objecion: typeof o.objecion === "string" ? o.objecion : "",
    dato_faltante: typeof o.dato_faltante === "string" ? o.dato_faltante : "",
    accion_recomendada:
      typeof o.accion_recomendada === "string" ? o.accion_recomendada : "calificar",
    derivar_humano: Boolean(o.derivar_humano),
    confianza:
      typeof o.confianza === "number"
        ? Math.max(0, Math.min(1, o.confianza))
        : 0.7,
    etiquetas: Array.isArray(o.etiquetas) ? o.etiquetas.map(String).slice(0, 12) : [],
  };
}

export function expectedTierForTestMessage(message: string): ModelTier {
  return selectModelForMessage({ message }).tier;
}
