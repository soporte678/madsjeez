import { getWhatsappBotEnv } from "@/lib/whatsapp-bot/config";
import {
  checkOllamaHealth,
  describeOllamaConfigIssue,
  hasOllamaEnvConfigured,
  isOllamaConfiguredForApp,
  ngrokFetchHeaders,
} from "@/lib/whatsapp-bot/ollama-client";

import type { AIProvider } from "./AIProvider";
import type { ChatMessage } from "./types";

/** Parámetros orientados a calidad.
 *  num_predict: 1200 — qwen3 necesita tokens extra para superar la fase de thinking.
 */
function ollamaQualityOptions() {
  const numCtx = Math.min(
    32768,
    Math.max(2048, parseInt(process.env.OLLAMA_NUM_CTX ?? "8192", 10) || 8192)
  );
  return {
    temperature: 0.35,
    top_p: 0.92,
    repeat_penalty: 1.12,
    num_predict: parseInt(process.env.OLLAMA_NUM_PREDICT ?? "1200", 10) || 1200,
    num_ctx: numCtx,
  };
}

/** 5 min — prioridad calidad, no velocidad. */
const OLLAMA_REPLY_TIMEOUT_MS = 300_000;

export class OllamaProvider implements AIProvider {
  readonly name = "ollama";

  isConfigured(): boolean {
    return hasOllamaEnvConfigured();
  }

  async healthCheck() {
    const configIssue = describeOllamaConfigIssue();
    if (configIssue) {
      return { ok: false, error: configIssue, models: [] as string[] };
    }
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

    const configIssue = describeOllamaConfigIssue();
    if (configIssue) throw new Error(configIssue);
    if (!isOllamaConfiguredForApp()) {
      throw new Error(
        "Ollama no accesible desde este entorno. En prod usá URL pública (Railway o túnel), no localhost."
      );
    }

    const health = await this.healthCheck();
    if (!health.ok) {
      throw new Error(
        health.error ?? `Ollama no responde en ${ollamaBase}. Verificá que el servicio esté levantado.`
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
      headers: ngrokFetchHeaders(ollamaBase),
      body: JSON.stringify({
        model: ollamaModel,
        messages,
        stream: false,
        options: ollamaQualityOptions(),
      }),
      signal: AbortSignal.timeout(OLLAMA_REPLY_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`Ollama HTTP ${res.status}`);
    }

    const data = (await res.json()) as {
      message?: { content?: string };
      thinking?: string;
      done_reason?: string;
    };

    // qwen3 thinking models (Ollama <0.7): content puede estar vacío si el budget
    // de tokens se agotó dentro del bloque <think>. Avisamos con error claro.
    if (data.done_reason === "length" && !data.message?.content?.trim()) {
      throw new Error(
        "Ollama: num_predict insuficiente para que el modelo supere la fase de thinking. " +
        "Incrementá OLLAMA_NUM_PREDICT (actual: " + ollamaQualityOptions().num_predict + ")."
      );
    }

    const raw = (data.message?.content ?? "").trim();
    const text = raw
      .replace(/[\s\S]*?<\/think>/gi, "")
      .replace(/[\s\S]*?<\/redacted_reasoning>/gi, "")
      .trim();
    if (!text || text.length < 2) throw new Error("Ollama devolvió respuesta vacía");
    return { text, model: ollamaModel };
  }
}

export const ollamaProvider = new OllamaProvider();
