import { isGeminiConfigured } from "./gemini-reply";
import { isOllamaConfiguredForApp } from "./ollama-client";

export type WhatsappAiProvider = "gemini" | "ollama" | "rules";

export function resolveWhatsappAiProvider(): WhatsappAiProvider {
  const forced = process.env.WHATSAPP_AI_PROVIDER?.trim().toLowerCase();
  if (forced === "ollama" && isOllamaConfiguredForApp()) return "ollama";
  if (forced === "gemini" && isGeminiConfigured()) return "gemini";
  if (forced === "rules") return "rules";

  if (forced === "auto" || !forced) {
    if (isOllamaConfiguredForApp() && process.env.NODE_ENV !== "production") {
      return "ollama";
    }
    if (isGeminiConfigured()) return "gemini";
    if (isOllamaConfiguredForApp()) return "ollama";
    return "rules";
  }

  if (isGeminiConfigured()) return "gemini";
  if (isOllamaConfiguredForApp()) return "ollama";
  return "rules";
}
