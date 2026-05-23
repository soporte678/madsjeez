/** Presencia del desktop agent (heartbeat desde la PC del admin). */
type DesktopPresence = {
  lastHeartbeatAt: string | null;
  connected: boolean;
  hostname: string | null;
  version: string | null;
};

let presence: DesktopPresence = {
  lastHeartbeatAt: null,
  connected: false,
  hostname: null,
  version: null,
};

const TTL_MS = 90_000;

export function recordJarvisDesktopHeartbeat(payload: {
  hostname?: string;
  version?: string;
}): void {
  presence = {
    lastHeartbeatAt: new Date().toISOString(),
    connected: true,
    hostname: payload.hostname ?? null,
    version: payload.version ?? null,
  };
}

export function getJarvisDesktopPresence(): DesktopPresence {
  if (!presence.lastHeartbeatAt) return { ...presence, connected: false };
  const age = Date.now() - new Date(presence.lastHeartbeatAt).getTime();
  return {
    ...presence,
    connected: age < TTL_MS,
  };
}

export type DesktopAgentStatus = "connected" | "disconnected";

export function desktopAgentStatus(): DesktopAgentStatus {
  return getJarvisDesktopPresence().connected ? "connected" : "disconnected";
}
