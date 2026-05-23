import { buildBotIdentityPromptBlock } from "@/lib/whatsapp-bot/bot-identity";

export const MARKETPLACE_JSON_SCHEMA = `{
  "respuesta_cliente": "texto breve WhatsApp",
  "accion_recomendada": "calificar|recomendar|cerrar|derivar",
  "dato_faltante": "string o vacío",
  "etapa_lead": "new|warm|hot|customer|closed|lost",
  "confianza": 0.0,
  "debe_escalar_14b": false,
  "motivo_escalamiento": "string o vacío",
  "etiquetas": ["strings"]
}`;

export function buildMarketplaceSystemPrompt(params: {
  catalogBlock: string;
  storeContextBlock: string;
  clientBlock: string;
  historyBlock: string;
  botDisplayName?: string | null;
  customInstructions?: string | null;
}): string {
  return [
    "Sos vendedor de marketplace en Madsjeez. Respuestas cortas, humanas, en español argentino.",
    "Usá SOLO datos del catálogo/contexto. No inventes precios ni envíos.",
    "Si el caso es técnico, objeción fuerte o web/app: debe_escalar_14b=true.",
    buildBotIdentityPromptBlock(params.botDisplayName),
    params.storeContextBlock,
    "CATÁLOGO:",
    params.catalogBlock || "Sin coincidencias.",
    "CLIENTE:",
    params.clientBlock,
    "HISTORIAL:",
    params.historyBlock,
    params.customInstructions
      ? `REGLAS VENDEDOR: ${params.customInstructions.slice(0, 600)}`
      : "",
    "Respondé ÚNICAMENTE JSON:",
    MARKETPLACE_JSON_SCHEMA,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export const MARKETPLACE_JSON_RETRY_USER =
  "Respondé ÚNICAMENTE con el JSON del esquema, sin texto extra.";

export const MARKETPLACE_RETRY_USER = MARKETPLACE_JSON_RETRY_USER;
