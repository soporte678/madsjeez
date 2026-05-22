import { getWhatsappBotEnv } from "@/lib/whatsapp-bot/config";
import { checkOllamaHealth, isOllamaConfiguredForApp } from "@/lib/whatsapp-bot/ollama-client";
import type { AIProvider } from "./AIProvider";
import type { ChatMessage } from "./types";

export class OllamaProvider implements AIProvider {
  readonly name = "ollama";

  isConfigured(): boolean {
    const { ollamaBase, ollamaModel } = getWhatsappBotEnv();
    return Boolean(ollamaBase && ollamaModel && isOllamaConfiguredForApp());
  }

  async healthCheck() {
    const health = await checkOllamaHealth();
    return {
      ok: health.ok,
      error: health.error,
      models: health.models,
    };
  }

  async generateReply(messages: ChatMessage[]): Promise<{ text: string; model: string }> {
    const { ollamaBase, ollamaModel } = getWhatsappBotEnv();
    if (!ollamaBase) throw new Error("Falta configurar OLLAMA_BASE_URL");
    if (!ollamaModel) throw new Error("Falta configurar OLLAMA_MODEL");
    if (!isOllamaConfiguredForApp()) {
      throw new Error("Ollama localhost no disponible en producción. Usá Gemini o un Ollama accesible por red.");
    }

    const health = await this.healthCheck();
    if (!health.ok) {
      throw new Error(
        `Ollama no responde en ${ollamaBase}. Verificá que el servicio esté levantado.`
      );
    }
    const modelNames = health.models ?? [];
    const modelExists =
      modelNames.some((m) => m === ollamaModel || m.startsWith(`${ollamaModel}:`)) ||
      modelNames.length === 0;
    if (modelNames.length > 0 && !modelExists) {
      throw new Error(
        `El modelo configurado "${ollamaModel}" no existe en Ollama. Modelos: ${modelNames.slice(0, 8).join(", ")}`
      );
    }

    const res = await fetch(`${ollamaBase.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        messages,
        stream: false,
        options: { temperature: 0.4, num_predict: 280 },
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      throw new Error(`Ollama HTTP ${res.status}`);
    }

    const data = (await res.json()) as { message?: { content?: string } };
    const text = (data.message?.content ?? "").trim();
    if (!text || text.length < 2) throw new Error("Ollama devolvió respuesta vacía");
    return { text, model: ollamaModel };
  }
}

export const ollamaProvider = new OllamaProvider();
