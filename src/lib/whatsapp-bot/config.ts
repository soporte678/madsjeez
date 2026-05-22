export function getWhatsappBotEnv() {
  const evolutionUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, "") || "";
  const evolutionKey = process.env.EVOLUTION_API_KEY?.trim() || "";
  const instancePrefix =
    process.env.EVOLUTION_DEFAULT_INSTANCE_PREFIX?.trim() || "madsjeez_seller_";
  const webhookSecret = process.env.EVOLUTION_WEBHOOK_SECRET?.trim() || "";
  const ollamaBase = process.env.OLLAMA_BASE_URL?.replace(/\/$/, "") || "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_MODEL?.trim() || "qwen2.5:7b";
  const appBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  return {
    evolutionUrl,
    evolutionKey,
    instancePrefix,
    webhookSecret,
    ollamaBase,
    ollamaModel,
    appBase,
    evolutionConfigured: Boolean(evolutionUrl && evolutionKey),
    ollamaConfigured: Boolean(ollamaBase),
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
