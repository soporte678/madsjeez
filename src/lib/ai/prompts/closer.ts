import { formatPlaybookForPrompt } from "@/lib/ai/prompts/closer-playbooks";
import { buildBotIdentityPromptBlock } from "@/lib/whatsapp-bot/bot-identity";
import type { BusinessProfileId } from "@/lib/ai/sales-closer-types";
import { CLOSER_GLOBAL_RULES, CLOSER_JSON_SCHEMA } from "@/lib/ai/prompts/closer-system";

export function buildCloserTierSystemPrompt(params: {
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
    "Sos SUPER CLOSER (modelo 14B) — cierre comercial avanzado, objeciones y casos técnicos.",
    `Canal: ${params.channel}.`,
    buildBotIdentityPromptBlock(params.botDisplayName),
    CLOSER_GLOBAL_RULES,
    formatPlaybookForPrompt(params.rubro),
    params.storeContextBlock,
    "CATÁLOGO:",
    params.catalogBlock || "Sin coincidencias.",
    params.winningExamplesBlock,
    "CLIENTE:",
    params.clientBlock,
    "HISTORIAL:",
    params.historyBlock,
    params.customInstructions
      ? `REGLAS VENDEDOR: ${params.customInstructions.slice(0, 900)}`
      : "",
    "FORMATO JSON obligatorio:",
    CLOSER_JSON_SCHEMA,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export const CLOSER_TIER_JSON_RETRY_USER =
  "Tu respuesta no fue JSON válido. Respondé ÚNICAMENTE con el objeto JSON del esquema.";

export const buildCloserRoutedSystemPrompt = buildCloserTierSystemPrompt;
export const CLOSER_ROUTED_RETRY_USER = CLOSER_TIER_JSON_RETRY_USER;
