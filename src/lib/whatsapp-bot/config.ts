/** Acepta host sin esquema (ej. evolution-api-production-xxx.up.railway.app). */
function normalizeEvolutionBaseUrl(raw: string | undefined): string {
  const trimmed = (raw || "").trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function getWhatsappBotEnv() {
  const evolutionUrl = normalizeEvolutionBaseUrl(process.env.EVOLUTION_API_URL);
  const evolutionBasePath = process.env.EVOLUTION_API_BASE_PATH?.trim() || "";
  const evolutionKey = process.env.EVOLUTION_API_KEY?.trim() || "";
  const instancePrefix =
    process.env.EVOLUTION_DEFAULT_INSTANCE_PREFIX?.trim() || "madsjeez_seller_";
  const webhookSecret = process.env.EVOLUTION_WEBHOOK_SECRET?.trim() || "";
  const ollamaRaw = process.env.OLLAMA_BASE_URL?.replace(/\/$/, "").trim() || "";
  const ollamaBase =
    ollamaRaw ||
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:11434");
  const ollamaModel = process.env.OLLAMA_MODEL?.trim() || "qwen2.5:7b";
  const ollamaConfigured =
    Boolean(ollamaBase) &&
    !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(ollamaBase);
  const appBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  return {
    evolutionUrl,
    evolutionBasePath,
    evolutionKey,
    instancePrefix,
    webhookSecret,
    ollamaBase,
    ollamaModel,
    appBase,
    evolutionConfigured: Boolean(evolutionUrl && evolutionKey),
    ollamaConfigured,
  };
}

export function buildInstanceName(sellerId: string): string {
  const { instancePrefix } = getWhatsappBotEnv();
  const safe = sellerId.replace(/[^a-zA-Z0-9_-]/g, "");
  return `${instancePrefix}${safe}`;
}

export function parseSellerIdFromInstance(instanceName: string): string | null {
  const { instancePrefix } = getWhatsappBotEnv();
  if (!instanceName.startsWith(instancePrefix)) return null;
  const rest = instanceName.slice(instancePrefix.length);
  return rest.length > 0 ? rest : null;
}
