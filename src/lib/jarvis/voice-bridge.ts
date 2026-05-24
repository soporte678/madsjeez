/** Best-effort bridge to local desktop agent (same machine, Chrome/Edge). */

const SECRET_KEY = "atlas_jarvis_secret";

export function getStoredDesktopSecret(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(SECRET_KEY) ?? "";
}

export function storeDesktopSecret(secret: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SECRET_KEY, secret.trim());
}

export async function probeDesktopAgent(
  port: number,
  secret: string
): Promise<{ ok: boolean; version?: string; error?: string }> {
  if (!secret) return { ok: false, error: "Falta secreto desktop" };
  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { "x-jarvis-secret": secret },
    });
    if (res.status === 401) return { ok: false, error: "Secreto incorrecto" };
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const json = (await res.json()) as { version?: string };
    return { ok: true, version: json.version };
  } catch {
    return { ok: false, error: "Agente local no disponible" };
  }
}

export async function sendDesktopVoiceCommand(
  text: string,
  port: number,
  secret: string
): Promise<{ ok: boolean; summary?: string; status?: string; error?: string }> {
  if (!secret) {
    return { ok: false, error: "Configurá el secreto desktop (mismo que .env del agente)." };
  }
  try {
    const res = await fetch(`http://127.0.0.1:${port}/voice/stop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-jarvis-secret": secret,
      },
      body: JSON.stringify({
        text: /\batlas\b/i.test(text) || /\bjarvis\b/i.test(text) ? text : `Atlas, ${text}`,
      }),
    });
    const json = (await res.json()) as { summary?: string; status?: string; error?: string };
    if (res.status === 401) return { ok: false, error: "401 — secreto desktop incorrecto" };
    if (!res.ok) return { ok: false, error: json.error ?? `HTTP ${res.status}` };
    return { ok: true, summary: json.summary, status: json.status };
  } catch {
    return {
      ok: false,
      error: "No pude contactar al agente local. Corré npm run dev en jarvis-desktop-agent.",
    };
  }
}
