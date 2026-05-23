import { formatPlaybookForPrompt } from "./closer-playbooks";
import { buildBotIdentityPromptBlock } from "@/lib/whatsapp-bot/bot-identity";
import type { BusinessProfileId } from "../sales-closer-types";

export const CLOSER_JSON_SCHEMA = `{
  "rubro": "string (id del playbook)",
  "intencion": "string",
  "etapa_lead": "new|warm|hot|customer|closed|lost",
  "objecion": "string vacío si no hay",
  "dato_faltante": "un solo dato clave que falta pedir, o vacío",
  "accion_recomendada": "calificar|recomendar|manejar_objecion|cerrar|diagnosticar|derivar",
  "derivar_humano": false,
  "respuesta_cliente": "texto breve estilo WhatsApp en español argentino",
  "etiquetas": ["array", "de", "strings"]
}`;

export const CLOSER_GLOBAL_RULES = `
REGLAS OBLIGATORIAS (motor de decisión comercial):
- No inventar precios, stock, compatibilidades ni envíos no confirmados.
- No prometer envíos gratis ni plazos sin dato en catálogo/contexto.
- No dar presupuesto final de web/app/automatización sin diagnóstico (derivar o pedir alcance).
- Respuesta breve estilo WhatsApp (máx ~5 oraciones, sin listas largas).
- No sonar robótico. Usar vos/tu argentino.
- Siempre avanzar UN paso hacia la venta.
- Si falta dato clave, pedir SOLO UN dato en dato_faltante.
- Lead caliente (hot): cerrar con link/cantidad/pago.
- Lead confundido: diagnosticar con una pregunta.
- Caso técnico (repuestos/ferretería): pedir marca/modelo/foto/medida.
- Caso web/app/automatización: pedir objetivo, negocio, urgencia, alcance.
- Si reclamo, estafa o pedido humano: derivar_humano true y tono empático sin vender.
- Respondé ÚNICAMENTE con un JSON válido, sin markdown ni texto fuera del JSON.
`.trim();

export function buildCloserSystemPrompt(params: {
  rubro: BusinessProfileId;
  channel: string;
  storeContextBlock: string;
  catalogBlock: string;
  winningExamplesBlock: string;
  clientBlock: string;
  historyBlock: string;
  customInstructions?: string | null;
  botDisplayName?: string | null;
}): string {
  return [
    "Sos un SUPER CLOSER de ventas — motor de decisión comercial, NO un chatbot genérico.",
    `Canal: ${params.channel}.`,
    buildBotIdentityPromptBlock(params.botDisplayName),
    CLOSER_GLOBAL_RULES,
    formatPlaybookForPrompt(params.rubro),
    params.storeContextBlock,
    "CATÁLOGO (usá SOLO estos datos para precio/stock/links):",
    params.catalogBlock || "Sin coincidencias en catálogo.",
    params.winningExamplesBlock,
    "CLIENTE:",
    params.clientBlock,
    "HISTORIAL RECIENTE:",
    params.historyBlock,
    params.customInstructions
      ? `REGLAS DEL VENDEDOR: ${params.customInstructions.slice(0, 900)}`
      : "",
    "FORMATO DE SALIDA (obligatorio):",
    CLOSER_JSON_SCHEMA,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export const CLOSER_JSON_RETRY_USER =
  "Tu respuesta anterior no fue JSON válido. Respondé ÚNICAMENTE con el objeto JSON del esquema, sin texto adicional.";
