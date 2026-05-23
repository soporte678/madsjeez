import { getSalesCloserEnv } from "@/lib/ai/sales-closer-env";
import {
  checkOllamaHealth,
  describeOllamaConfigIssue,
  isOllamaConfiguredForApp,
  ngrokFetchHeaders,
} from "@/lib/whatsapp-bot/ollama-client";
import type { ChatMessage } from "./types";

const OLLAMA_REPLY_TIMEOUT_MS = 300_000;

export function extractJsonObject(raw: string): unknown | null {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* continue */
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    try {
      return JSON.parse(fence[1].trim());
    } catch {
      /* continue */
    }
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  return null;
}

export async function ollamaChatJson(params: {
  messages: ChatMessage[];
  retryUserMessage?: string;
}): Promise<{ raw: string; model: string; parsed: unknown }> {
  const { ollamaBase, ollamaModel, ollamaNumCtx } = getSalesCloserEnv();
  const configIssue = describeOllamaConfigIssue();
  if (configIssue) throw new Error(configIssue);
  if (!isOllamaConfiguredForApp()) {
    throw new Error("Ollama no accesible desde este entorno (usá URL pública en prod).");
  }

  const health = await checkOllamaHealth();
  if (!health.ok) {
    throw new Error(health.error ?? "Ollama no responde");
  }

  const numPredict = parseInt(process.env.OLLAMA_NUM_PREDICT ?? "1200", 10) || 1200;

  const runOnce = async (messages: ChatMessage[]) => {
    const res = await fetch(`${ollamaBase.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: ngrokFetchHeaders(ollamaBase),
      body: JSON.stringify({
        model: ollamaModel,
        messages,
        stream: false,
        format: "json",
        options: {
          temperature: 0.3,
          top_p: 0.9,
          repeat_penalty: 1.1,
          num_predict: numPredict,
          num_ctx: ollamaNumCtx,
        },
      }),
      signal: AbortSignal.timeout(OLLAMA_REPLY_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = (await res.json()) as {
      message?: { content?: string };
      done_reason?: string;
    };
    if (data.done_reason === "length" && !data.message?.content?.trim()) {
      throw new Error(
        `Ollama: num_predict insuficiente (${numPredict}). Subí OLLAMA_NUM_PREDICT.`
      );
    }
    const raw = (data.message?.content ?? "")
      .replace(/[\s\S]*?<\/think>/gi, "")
      .replace(/[\s\S]*?<\/redacted_reasoning>/gi, "")
      .trim();
    if (!raw) throw new Error("Ollama devolvió respuesta vacía");
    return raw;
  };

  let raw = await runOnce(params.messages);
  let parsed = extractJsonObject(raw);

  if (!parsed && params.retryUserMessage) {
    raw = await runOnce([
      ...params.messages,
      { role: "assistant", content: raw },
      { role: "user", content: params.retryUserMessage },
    ]);
    parsed = extractJsonObject(raw);
  }

  if (!parsed) {
    throw new Error("ollama_invalid_json");
  }

  return { raw, model: ollamaModel, parsed };
}
