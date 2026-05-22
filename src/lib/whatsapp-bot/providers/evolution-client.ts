import { getWhatsappBotEnv } from "../config";

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

export function buildEvolutionRequestUrl(path: string): string {
  const { evolutionUrl, evolutionBasePath } = getWhatsappBotEnv();
  const base = evolutionUrl.replace(/\/$/, "");
  const prefix = evolutionBasePath ? `/${evolutionBasePath.replace(/^\/|\/$/g, "")}` : "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${prefix}${p}`;
}

async function evolutionFetch(
  path: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const { evolutionKey } = getWhatsappBotEnv();
  if (!evolutionKey) {
    throw new Error("evolution_not_configured");
  }

  const timeoutMs = init?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const url = buildEvolutionRequestUrl(path);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: evolutionKey,
    ...(init?.headers as Record<string, string> | undefined),
  };

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res;
    } catch (e) {
      clearTimeout(timer);
      lastError = e;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("evolution_request_failed");
}

export async function evolutionJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = buildEvolutionRequestUrl(path);
  const res = await evolutionFetch(path, init);
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 500) };
    }
  }
  if (!res.ok) {
    const msg =
      typeof body === "object" && body && "message" in body
        ? String((body as { message: unknown }).message)
        : typeof body === "object" && body && "error" in body
          ? String((body as { error: unknown }).error)
          : `HTTP ${res.status}`;
    const err = new Error(`evolution_error:${msg}`);
    (err as Error & { status?: number; url?: string }).status = res.status;
    (err as Error & { status?: number; url?: string }).url = url;
    throw err;
  }
  return body as T;
}

/** Logs seguros: nunca imprimir API key */
export function logEvolutionSafe(event: string, meta?: Record<string, unknown>) {
  const safe = meta ? { ...meta } : {};
  if ("apikey" in safe) delete safe.apikey;
  console.info(`[whatsapp-bot:evolution] ${event}`, safe);
}
