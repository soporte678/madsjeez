import { getWhatsappBotEnv } from "@/lib/whatsapp-bot/config";

export function getSalesCloserEnv() {
  const base = getWhatsappBotEnv();
  const ollamaModel =
    process.env.OLLAMA_MODEL?.trim() || "closer-ventas-14b";
  const ollamaNumCtx = Math.min(
    32768,
    Math.max(2048, parseInt(process.env.OLLAMA_NUM_CTX ?? "4096", 10) || 4096)
  );
  const botAutoReplyWithOllama =
    process.env.BOT_AUTO_REPLY_WITH_OLLAMA?.trim().toLowerCase() === "true";

  return {
    ...base,
    ollamaModel,
    ollamaNumCtx,
    botAutoReplyWithOllama,
  };
}

export function isSalesCloserAutoReplyEnabled(): boolean {
  return getSalesCloserEnv().botAutoReplyWithOllama;
}
