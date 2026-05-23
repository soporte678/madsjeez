import {
  getModelRouterEnv,
  getSalesCloserEnv,
  type ModelTier,
} from "@/lib/ai/sales-closer-env";
import {
  describeOllamaConfigIssue,
  isOllamaConfiguredForApp,
  ngrokFetchHeaders,
} from "@/lib/whatsapp-bot/ollama-client";
import type { ChatMessage } from "@/lib/ai/types";

export type OllamaChatResult = {
  raw: string;
  model: string;
  latencyMs: number;
};

export type OllamaChatOptions = {
  model: string;
  messages: ChatMessage[];
  tier?: ModelTier;
  format?: "json" | undefined;
  numCtx?: number;
  numPredict?: number;
  timeoutMs?: number;
  keepAlive?: string;
  temperature?: number;
};

function tierDefaults(tier: ModelTier) {
  const env = getModelRouterEnv();
  return {
    numCtx: env.numCtx[tier],
    numPredict: env.numPredict[tier],
    timeoutMs: env.timeoutMs[tier],
    keepAlive: tier === "closer" ? env.keepAliveSmart : env.keepAliveFast,
  };
}

export async function chatOllama(options: OllamaChatOptions): Promise<OllamaChatResult> {
  const { ollamaBase } = getSalesCloserEnv();
  const configIssue = describeOllamaConfigIssue();
  if (configIssue) throw new Error(configIssue);
  if (!isOllamaConfiguredForApp()) {
    throw new Error("Ollama no accesible desde este entorno (usá URL pública en prod).");
  }

  const tier = options.tier ?? "marketplace";
  const defaults = tierDefaults(tier);
  const numCtx = options.numCtx ?? defaults.numCtx;
  const numPredict = options.numPredict ?? defaults.numPredict;
  const timeoutMs = options.timeoutMs ?? defaults.timeoutMs;
  const keepAlive = options.keepAlive ?? defaults.keepAlive;

  const started = Date.now();
  const res = await fetch(`${ollamaBase.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: ngrokFetchHeaders(ollamaBase),
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: false,
      keep_alive: keepAlive,
      ...(options.format ? { format: options.format } : {}),
      options: {
        temperature: options.temperature ?? 0.3,
        top_p: 0.9,
        repeat_penalty: 1.1,
        num_predict: numPredict,
        num_ctx: numCtx,
      },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    throw new Error(`Ollama HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    message?: { content?: string };
    done_reason?: string;
  };

  if (data.done_reason === "length" && !data.message?.content?.trim()) {
    throw new Error(`Ollama: num_predict insuficiente (${numPredict}) para ${options.model}`);
  }

  const raw = (data.message?.content ?? "")
    .replace(/[\s\S]*?<\/think>/gi, "")
    .replace(/[\s\S]*?<\/redacted_reasoning>/gi, "")
    .trim();

  if (!raw) throw new Error("Ollama devolvió respuesta vacía");

  return {
    raw,
    model: options.model,
    latencyMs: Date.now() - started,
  };
}

export async function listModels(): Promise<string[]> {
  const { ollamaBase } = getSalesCloserEnv();
  const configIssue = describeOllamaConfigIssue();
  if (configIssue) throw new Error(configIssue);

  const res = await fetch(`${ollamaBase.replace(/\/$/, "")}/api/tags`, {
    headers: ngrokFetchHeaders(ollamaBase),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const data = (await res.json()) as { models?: { name: string }[] };
  return (data.models ?? []).map((m) => m.name);
}

export async function getLoadedModels(): Promise<string[]> {
  const { ollamaBase } = getSalesCloserEnv();
  const configIssue = describeOllamaConfigIssue();
  if (configIssue) throw new Error(configIssue);

  const res = await fetch(`${ollamaBase.replace(/\/$/, "")}/api/ps`, {
    headers: ngrokFetchHeaders(ollamaBase),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const data = (await res.json()) as { models?: { name: string; model?: string }[] };
  return (data.models ?? []).map((m) => m.name || m.model || "").filter(Boolean);
}

export async function warmupModel(
  model: string,
  tier: ModelTier = "marketplace"
): Promise<{
  model: string;
  latencyMs: number;
}> {
  const result = await chatOllama({
    model,
    tier,
    messages: [{ role: "user", content: "ok" }],
    numPredict: 8,
    temperature: 0,
  });
  return { model: result.model, latencyMs: result.latencyMs };
}

export async function warmupOllamaModels(): Promise<
  { model: string; ok: boolean; latencyMs?: number; error?: string }[]
> {
  const env = getModelRouterEnv();
  const targets: { model: string; tier: ModelTier }[] = [
    { model: env.marketplaceModel, tier: "marketplace" },
    { model: env.classifierModel, tier: "classifier" },
  ];
  if (env.preloadModels) {
    targets.push({ model: env.closerModel, tier: "closer" });
  }

  const results: { model: string; ok: boolean; latencyMs?: number; error?: string }[] = [];
  for (const t of targets) {
    try {
      const r = await warmupModel(t.model, t.tier);
      results.push({ model: t.model, ok: true, latencyMs: r.latencyMs });
    } catch (e) {
      results.push({
        model: t.model,
        ok: false,
        error: e instanceof Error ? e.message : "warmup_failed",
      });
    }
  }
  return results;
}
