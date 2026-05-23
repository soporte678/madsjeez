import { getWhatsappBotEnv } from "./config";

export function isLocalOllamaHost(base: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base);
}

export function hasOllamaEnvConfigured(): boolean {
  const { ollamaBase, ollamaModel } = getWhatsappBotEnv();
  return Boolean(ollamaBase && ollamaModel);
}

/** Ollama usable: URL set and not localhost-only while app runs in production (Railway). */
export function isOllamaConfiguredForApp(): boolean {
  const { ollamaBase } = getWhatsappBotEnv();
  if (!ollamaBase) return false;
  if (process.env.NODE_ENV === "production" && isLocalOllamaHost(ollamaBase)) {
    return false;
  }
  return true;
}

/** Mensaje claro cuando Ollama está forzado pero mal configurado en prod. */
export function describeOllamaConfigIssue(): string | null {
  const { ollamaBase, ollamaModel } = getWhatsappBotEnv();
  if (!ollamaBase) {
    return "Falta OLLAMA_BASE_URL. Ej: http://127.0.0.1:11434 (local) o https://tu-ollama.railway.app (prod).";
  }
  if (!ollamaModel) {
    return "Falta OLLAMA_MODEL. Ej: qwen2.5:7b";
  }
  if (process.env.NODE_ENV === "production" && isLocalOllamaHost(ollamaBase)) {
    return "En producción no podés usar localhost. Deployá Ollama en Railway, o exponé tu PC con un túnel (Cloudflare/ngrok) y poné esa URL en OLLAMA_BASE_URL.";
  }
  return null;
}
export async function checkOllamaHealth(): Promise<{
  ok: boolean;
  baseUrl?: string;
  models?: string[];
  error?: string;
}> {
  const { ollamaBase } = getWhatsappBotEnv();
  if (!ollamaBase) {
    return { ok: false, error: "ollama_url_missing" };
  }

  try {
    const res = await fetch(`${ollamaBase}/api/tags`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      return { ok: false, error: `ollama_http_${res.status}`, baseUrl: ollamaBase };
    }
    const data = (await res.json()) as { models?: { name: string }[] };
    const models = (data.models ?? []).map((m) => m.name);
    return { ok: true, baseUrl: ollamaBase, models };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "ollama_unreachable",
      baseUrl: ollamaBase,
    };
  }
}

export async function generateOllamaReply(
  prompt: string,
  model?: string
): Promise<{ text: string; model: string }> {
  const { ollamaBase, ollamaModel } = getWhatsappBotEnv();
  const useModel = model?.trim() || ollamaModel;

  const res = await fetch(`${ollamaBase}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: useModel,
      prompt,
      stream: false,
      options: { temperature: 0.4, num_predict: 220 },
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    throw new Error(`ollama_http_${res.status}`);
  }

  const data = (await res.json()) as { response?: string };
  const text = (data.response ?? "").trim();
  if (!text || text.length < 2) {
    throw new Error("ollama_empty");
  }

  return { text, model: useModel };
}
