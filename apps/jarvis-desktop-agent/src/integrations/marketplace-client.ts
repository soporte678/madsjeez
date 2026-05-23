import { config } from "../config.js";

export async function fetchMarketplaceHealth(cookie?: string): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (config.marketplaceSecret) headers["x-jarvis-secret"] = config.marketplaceSecret;
  if (cookie) headers["Cookie"] = cookie;

  const res = await fetch(`${config.marketplaceUrl}/api/jarvis/health`, { headers });
  if (!res.ok) {
    return { status: "error", httpStatus: res.status };
  }
  return (await res.json()) as Record<string, unknown>;
}

export async function postMarketplaceOrchestrate(): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.marketplaceSecret) headers["x-jarvis-secret"] = config.marketplaceSecret;

  const res = await fetch(`${config.marketplaceUrl}/api/jarvis/orchestrate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ scope: "all", agentTarget: "auto", detail: "normal" }),
  });
  return (await res.json()) as Record<string, unknown>;
}

export async function sendDesktopHeartbeat(): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.marketplaceSecret) headers["x-jarvis-secret"] = config.marketplaceSecret;
  else headers["x-jarvis-secret"] = config.secret;

  await fetch(`${config.marketplaceUrl}/api/jarvis/desktop/heartbeat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      hostname: process.env.COMPUTERNAME || "windows",
      version: config.version,
      secret: config.marketplaceSecret || undefined,
    }),
  }).catch(() => undefined);
}
