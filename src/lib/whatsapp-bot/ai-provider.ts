import { isGeminiConfigured } from "./gemini-reply";
import { hasOllamaEnvConfigured, isOllamaConfiguredForApp } from "./ollama-client";

export type WhatsappAiProvider = "gemini" | "ollama" | "rules";

export function resolveWhatsappAiProvider(): WhatsappAiProvider {
  const forced = process.env.WHATSAPP_AI_PROVIDER?.trim().toLowerCase();

  // Forzado explícito: respetar elección del vendedor (Ollama primero si lo pidió)
  if (forced === "ollama") return "ollama";
  if (forced === "gemini") return "gemini";
  if (forced === "rules") return "rules";

  // auto o vacío: Ollama primero si está accesible, sino Gemini, sino reglas
  if (forced === "auto" || !forced) {
    if (isOllamaConfiguredForApp()) return "ollama";
    if (isGeminiConfigured()) return "gemini";
    if (hasOllamaEnvConfigured()) return "ollama";
    return "rules";
  }

  if (isOllamaConfiguredForApp()) return "ollama";
  if (isGeminiConfigured()) return "gemini";
  return "rules";
}
