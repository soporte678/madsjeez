import { evolutionJson, logEvolutionSafe } from "@/lib/whatsapp-bot/providers/evolution-client";

type UnknownRecord = Record<string, unknown>;

async function tryEvolution<T>(
  paths: { method?: "GET" | "POST"; path: string; body?: unknown }[]
): Promise<{ data: T; path: string } | null> {
  for (const attempt of paths) {
    try {
      const data = await evolutionJson<T>(attempt.path, {
        method: attempt.method ?? "POST",
        body: attempt.body ? JSON.stringify(attempt.body) : undefined,
      });
      return { data, path: attempt.path };
    } catch (e) {
      logEvolutionSafe("api_attempt_failed", {
        path: attempt.path,
        error: e instanceof Error ? e.message : "unknown",
      });
    }
  }
  return null;
}

export async function fetchEvolutionContacts(instanceName: string): Promise<UnknownRecord[]> {
  const enc = encodeURIComponent(instanceName);
  const result = await tryEvolution<UnknownRecord[] | { contacts?: UnknownRecord[] }>([
    { path: `/chat/findContacts/${enc}`, method: "POST", body: {} },
    { path: `/contact/findContacts/${enc}`, method: "POST", body: {} },
    { path: `/chat/findContacts/${enc}`, method: "GET" },
  ]);
  if (!result) return [];
  const { data } = result;
  if (Array.isArray(data)) return data;
  return (data.contacts as UnknownRecord[]) ?? [];
}

export async function fetchEvolutionChats(instanceName: string): Promise<UnknownRecord[]> {
  const enc = encodeURIComponent(instanceName);
  const result = await tryEvolution<UnknownRecord[] | { chats?: UnknownRecord[] }>([
    { path: `/chat/findChats/${enc}`, method: "POST", body: {} },
    { path: `/chat/findChats/${enc}`, method: "GET" },
  ]);
  if (!result) return [];
  const { data } = result;
  if (Array.isArray(data)) return data;
  return (data.chats as UnknownRecord[]) ?? [];
}

export async function fetchEvolutionMessages(
  instanceName: string,
  remoteJid: string,
  limit = 50
): Promise<UnknownRecord[]> {
  const enc = encodeURIComponent(instanceName);
  const body = {
    where: { key: { remoteJid } },
    limit,
  };
  const result = await tryEvolution<UnknownRecord[] | { messages?: UnknownRecord[] }>([
    { path: `/chat/findMessages/${enc}`, method: "POST", body },
    {
      path: `/chat/findMessages/${enc}`,
      method: "POST",
      body: { remoteJid, limit },
    },
  ]);
  if (!result) return [];
  const { data } = result;
  if (Array.isArray(data)) return data;
  return (data.messages as UnknownRecord[]) ?? [];
}

export async function fetchEvolutionContactProfile(
  instanceName: string,
  jid: string
): Promise<UnknownRecord | null> {
  const enc = encodeURIComponent(instanceName);
  const result = await tryEvolution<UnknownRecord>([
    {
      path: `/chat/fetchProfilePictureUrl/${enc}`,
      method: "POST",
      body: { number: jid.split("@")[0] },
    },
    {
      path: `/chat/fetchProfile/${enc}`,
      method: "POST",
      body: { number: jid.split("@")[0] },
    },
  ]);
  return result?.data ?? null;
}
