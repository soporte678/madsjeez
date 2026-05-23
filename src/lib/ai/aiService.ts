import type { WhatsappLeadStatus } from "@prisma/client";
import { resolveWhatsappAiProvider } from "@/lib/whatsapp-bot/ai-provider";
import { searchCatalogProducts } from "@/lib/whatsapp-bot/catalog-service";
import { detectIntentSnippet, scoreLeadFromMessage } from "@/lib/whatsapp-bot/lead-scoring-service";
import { geminiProvider } from "./GeminiProvider";
import { ollamaProvider } from "./OllamaProvider";
import type { AIProvider } from "./AIProvider";
import type { BotReplyInput, BotReplyOutput, BotMessage, LeadStage } from "./types";

const BASE_SYSTEM = `Sos un CLOSER comercial de élite en Madsjeez Marketplace (español argentino, vos/tu).
Tu objetivo NO es solo informar: es llevar al cliente a la compra con confianza.

METODOLOGÍA (en cada respuesta):
1. Conectar: usá el nombre del cliente si lo tenés; reflejá lo que preguntó en 1 frase.
2. Calificar: si falta info clave (medida, modelo, CP, cantidad), preguntá UNA cosa concreta.
3. Recomendar: citá productos del catálogo provisto con precio y stock real.
4. Manejar dudas: si hay objeción (caro, lo pienso, comparo), validá y respondé con beneficio concreto.
5. Cerrar: terminá SIEMPRE con una pregunta de cierre o CTA claro (link, cantidad, envío, pago).

REGLAS DURAS:
- Máximo 3 oraciones cortas por mensaje (WhatsApp, no email).
- Nunca inventes precios, stock, envío gratis ni promos que no estén en el catálogo o contexto.
- Si hay producto con link, ofrecelo cuando haya intención warm/hot.
- Lead "hot": priorizá pasar link + preguntar si quiere que le reserve / le mande MP.
- Lead "new": calificá antes de bombardear con links.
- Si no hay producto en catálogo, pedí detalle y ofrecé que un humano confirma en minutos (sin inventar).
- Reclamos, estafas o pedido explícito de humano: no insistas con venta.`;

const STAGE_CLOSING_HINT: Record<string, string> = {
  new: "Etapa: prospecto nuevo. Objetivo: generar confianza y hacer 1 pregunta de calificación.",
  warm: "Etapa: interesado. Objetivo: recomendar producto concreto + link si aplica + pregunta de cierre.",
  hot: "Etapa: caliente. Objetivo: facilitar la compra YA (link, cantidad, envío, forma de pago).",
  customer: "Etapa: cliente. Objetivo: upsell/cross-sell relacionado o postventa rápida.",
  closed: "Etapa: cerrado. Objetivo: confirmar satisfacción y pedir referido si encaja.",
  lost: "Etapa: perdido. Objetivo: tono respetuoso, no presionar.",
};

const COMPLAINT_RE =
  /reclamo|devoluci[oó]n|estafa|enojad|furios|no me lleg|roto|defectu|problema con (el )?pago|error de compra|no funciona la cuenta|quiero hablar con/i;

export function detectIntent(message: string): { intent: string; confidence: number } {
  const snippet = detectIntentSnippet(message);
  if (COMPLAINT_RE.test(message)) {
    return { intent: "reclamo", confidence: 0.95 };
  }
  const lower = message.toLowerCase();
  if (/caro|mucho sale|descuento|promo|oferta|rebaja/.test(lower))
    return { intent: "objecion_precio", confidence: 0.85 };
  if (/lo pienso|despu[eé]s|m[aá]s tarde|ahora no|todav[ií]a no/.test(lower))
    return { intent: "objecion_tiempo", confidence: 0.8 };
  if (/otro lado|compet|mercadolibre|m[aá]s barato en/.test(lower))
    return { intent: "objecion_competencia", confidence: 0.85 };
  if (/precio|cu[aá]nto sale|valor/.test(lower)) return { intent: "precio", confidence: 0.85 };
  if (/stock|disponible|\bhay\b/.test(lower)) return { intent: "stock", confidence: 0.8 };
  if (/env[ií]o|cp|postal|localidad/.test(lower)) return { intent: "envio", confidence: 0.85 };
  if (/garant[ií]a/.test(lower)) return { intent: "garantia", confidence: 0.75 };
  if (/compr|quiero llevar|me lo llev|reserv|mandame el link|pasame el link/.test(lower))
    return { intent: "compra", confidence: 0.9 };
  return { intent: snippet || "otro", confidence: snippet ? 0.7 : 0.4 };
}

export function suggestLeadStage(
  message: string,
  current: LeadStage
): LeadStage | undefined {
  const next = scoreLeadFromMessage(message, current);
  return next !== current ? next : undefined;
}

export function shouldHandoffToHuman(params: {
  message: string;
  intent: string;
  confidence: number;
  humanHandoffEnabled: boolean;
}): { shouldHandoff: boolean; reason?: string } {
  if (!params.humanHandoffEnabled) return { shouldHandoff: false };
  if (/humano|persona|vendedor|operador|hablar con/.test(params.message.toLowerCase())) {
    return { shouldHandoff: true, reason: "cliente_pide_humano" };
  }
  if (params.intent === "reclamo") {
    return { shouldHandoff: true, reason: "reclamo_detectado" };
  }
  if (params.confidence < 0.35) {
    return { shouldHandoff: true, reason: "baja_confianza" };
  }
  return { shouldHandoff: false };
}

export async function searchCatalogBeforeReply(
  sellerId: string,
  query: string,
  appBase: string
) {
  return searchCatalogProducts(sellerId, query, appBase, 5);
}

export function summarizeConversation(messages: BotMessage[], maxLen = 400): string {
  const lines = messages.slice(-12).map((m) => {
    const who =
      m.senderType === "customer" ? "Cliente" : m.senderType === "seller" ? "Vendedor" : "Bot";
    return `${who}: ${m.content.slice(0, 120)}`;
  });
  return lines.join(" · ").slice(0, maxLen);
}

function activeProvider(): AIProvider | null {
  const p = resolveWhatsappAiProvider();
  if (p === "ollama" && ollamaProvider.isConfigured()) return ollamaProvider;
  if (p === "gemini" && geminiProvider.isConfigured()) return geminiProvider;
  return null;
}

function buildCatalogBlock(
  products: NonNullable<BotReplyInput["catalogMatches"]>
): string {
  if (!products.length) return "Sin productos coincidentes en catálogo.";
  return products
    .map(
      (p) =>
        `- ${p.title}: $${Math.round(p.price).toLocaleString("es-AR")}, stock ${p.stock}${p.productUrl ? `, ${p.productUrl}` : ""}`
    )
    .join("\n");
}

function contactDisplayName(contact: BotReplyInput["contact"]): string {
  return (
    contact.fullName?.trim() ||
    contact.pushName?.trim() ||
    contact.businessName?.trim() ||
    contact.name?.trim() ||
    ""
  );
}

function ruleFallback(input: BotReplyInput, intent: string): string {
  const name = contactDisplayName(input.contact);
  const hi = name ? `${name}, ` : "";
  const p = input.catalogMatches?.[0];
  const price = p ? `$${Math.round(p.price).toLocaleString("es-AR")}` : null;
  const linkOffer = p?.productUrl ? ` Te paso el link: ${p.productUrl}` : "";

  if (intent === "objecion_precio" && p) {
    return `${hi}entiendo la duda. ${p.title} está ${price} con stock ${p.stock} — incluye garantía y envío según tu zona.${linkOffer} ¿Querés que te cotice el envío a tu CP?`;
  }
  if (intent === "objecion_tiempo" && p) {
    return `${hi}sin apuro. Si te sirve, te dejo ${p.title} (${price}) reservado hoy.${linkOffer} ¿Te lo anoto y te escribo mañana?`;
  }
  if (intent === "objecion_competencia" && p) {
    return `${hi}tiene sentido comparar. Nosotros tenemos ${p.title} ${price} con stock ${p.stock} y atención directa por acá.${linkOffer} ¿Qué te falta para decidirte?`;
  }
  if (intent === "envio") {
    return `${hi}¿me pasás localidad y código postal? Así te confirmo costo y plazo de entrega.`;
  }
  if (p && (intent === "precio" || intent === "stock")) {
    return `${hi}${p.title}: ${price}, stock ${p.stock}.${linkOffer} ¿Cuántas unidades necesitás?`;
  }
  if (p && intent === "compra") {
    return `${hi}¡Genial! ${p.title} ${price}.${linkOffer} ¿Preferís retiro, envío o te paso link de Mercado Pago?`;
  }
  if (input.contact.status === "hot" && p) {
    return `${hi}para cerrar: ${p.title} ${price}.${linkOffer} ¿Confirmamos cantidad y envío?`;
  }
  return `${hi}gracias por escribir. Contame qué producto o medida buscás y te ayudo a cerrar la compra.`;
}

export async function generateBotReply(input: BotReplyInput): Promise<BotReplyOutput> {
  const { intent, confidence } = detectIntent(input.customerMessage);
  const handoff = shouldHandoffToHuman({
    message: input.customerMessage,
    intent,
    confidence,
    humanHandoffEnabled: input.botSettings.humanHandoffEnabled,
  });

  if (handoff.shouldHandoff) {
    return {
      text: "Te derivo con el vendedor para ayudarte mejor con esto.",
      intent,
      confidence,
      shouldHandoff: true,
      reason: handoff.reason,
      usedAi: false,
      suggestedStage: suggestLeadStage(input.customerMessage, input.contact.status),
    };
  }

  if (!input.botSettings.enabled) {
    return {
      text: "",
      intent,
      confidence,
      shouldHandoff: false,
      usedAi: false,
      reason: "bot_desactivado",
    };
  }

  const provider = activeProvider();
  const history = input.recentMessages.slice(-8).map((m) => ({
    role: (m.direction === "inbound" ? "user" : "assistant") as "user" | "assistant",
    content: m.content.slice(0, 400),
  }));

  const catalogBlock = buildCatalogBlock(input.catalogMatches ?? []);
  const clientName = contactDisplayName(input.contact);
  const stageHint = STAGE_CLOSING_HINT[input.contact.status] ?? STAGE_CLOSING_HINT.new;
  const system = `${BASE_SYSTEM}
${stageHint}
${clientName ? `Nombre del cliente: ${clientName}.` : ""}
Tono: ${input.botSettings.tone}.
${input.botSettings.customInstructions ? `Reglas del vendedor: ${input.botSettings.customInstructions.slice(0, 600)}` : ""}
${input.storeContextBlock ? `\n${input.storeContextBlock}` : ""}
PRODUCTOS (usá solo estos datos):
${catalogBlock}`;

  if (!provider) {
    return {
      text: ruleFallback(input, intent),
      intent,
      confidence,
      shouldHandoff: false,
      usedAi: false,
      aiProvider: "rules",
      suggestedStage: suggestLeadStage(input.customerMessage, input.contact.status),
    };
  }

  try {
    const { text, model } = await provider.generateReply([
      { role: "system", content: system },
      ...history,
      { role: "user", content: input.customerMessage },
    ]);
    const clean = text
      .replace(/^(Vos|Asistente|Bot):\s*/i, "")
      .trim()
      .slice(0, 1200);
    return {
      text: clean || ruleFallback(input, intent),
      intent,
      confidence: Math.max(confidence, 0.75),
      shouldHandoff: false,
      usedAi: true,
      aiProvider: `${provider.name}:${model}`,
      suggestedStage: suggestLeadStage(input.customerMessage, input.contact.status),
    };
  } catch (e) {
    const aiError = e instanceof Error ? e.message : "ai_failed";
    return {
      text: ruleFallback(input, intent),
      intent,
      confidence,
      shouldHandoff: false,
      usedAi: false,
      aiProvider: provider.name,
      aiError,
      suggestedStage: suggestLeadStage(input.customerMessage, input.contact.status),
    };
  }
}

export async function testOllamaConnection(): Promise<{
  ok: boolean;
  model?: string;
  reply?: string;
  models?: string[];
  error?: string;
  latencyMs?: number;
}> {
  const start = Date.now();
  const health = await ollamaProvider.healthCheck();
  if (!health.ok) {
    const base = process.env.OLLAMA_BASE_URL ?? "localhost:11434";
    return {
      ok: false,
      error: `Ollama no responde en ${base}. ${health.error ?? ""}`.trim(),
      models: health.models,
    };
  }

  try {
    const { text, model } = await ollamaProvider.generateReply([
      { role: "system", content: "Respondé en una sola línea en español argentino." },
      { role: "user", content: "Decí hola como bot vendedor de prueba." },
    ]);
    return {
      ok: true,
      model,
      reply: text.slice(0, 300),
      models: health.models,
      latencyMs: Date.now() - start,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "ollama_test_failed",
      models: health.models,
      latencyMs: Date.now() - start,
    };
  }
}
