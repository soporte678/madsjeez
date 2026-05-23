import type { WebhookHandleResult } from "./providers/whatsapp-provider";

function extractMessageText(
  message: Record<string, unknown>,
  data: Record<string, unknown>
): string {
  if (typeof data.text === "string" && data.text.trim()) return data.text.trim();
  if (typeof message.conversation === "string" && message.conversation.trim()) {
    return message.conversation.trim();
  }
  const ext = message.extendedTextMessage as Record<string, unknown> | undefined;
  if (typeof ext?.text === "string" && ext.text.trim()) return ext.text.trim();
  const image = message.imageMessage as Record<string, unknown> | undefined;
  if (typeof image?.caption === "string" && image.caption.trim()) return image.caption.trim();
  const video = message.videoMessage as Record<string, unknown> | undefined;
  if (typeof video?.caption === "string" && video.caption.trim()) return video.caption.trim();
  const doc = message.documentMessage as Record<string, unknown> | undefined;
  if (typeof doc?.caption === "string" && doc.caption.trim()) return doc.caption.trim();
  const btn = message.buttonsResponseMessage as Record<string, unknown> | undefined;
  if (typeof btn?.selectedDisplayText === "string" && btn.selectedDisplayText.trim()) {
    return btn.selectedDisplayText.trim();
  }
  const list = message.listResponseMessage as Record<string, unknown> | undefined;
  if (typeof list?.title === "string" && list.title.trim()) return list.title.trim();
  return "";
}

function resolveInstanceName(p: Record<string, unknown>, data: Record<string, unknown>): string {
  const raw =
    p.instance ?? p.instanceName ?? data.instance ?? data.instanceName ?? data.instanceId;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>;
    const name = o.instanceName ?? o.instance ?? o.name;
    if (typeof name === "string") return name;
  }
  return "";
}

function resolvePhone(data: Record<string, unknown>, key: Record<string, unknown>): string {
  const candidates = [
    key.remoteJidAlt,
    data.remoteJidAlt,
    data.senderPn,
    key.participant,
    data.participant,
    key.remoteJid,
    data.remoteJid,
  ];

  for (const raw of candidates) {
    const jid = String(raw ?? "");
    if (!jid) continue;
    if (jid.endsWith("@g.us")) continue;
    if (jid.includes("@s.whatsapp.net") || jid.includes("@c.us")) {
      const digits = jid.split("@")[0]?.replace(/\D/g, "") ?? "";
      if (digits.length >= 8) return digits;
    }
  }

  const remoteJid = String(key.remoteJid ?? data.remoteJid ?? "");
  if (remoteJid.endsWith("@lid")) {
    const lidDigits = remoteJid.split("@")[0]?.replace(/\D/g, "") ?? "";
    if (lidDigits.length >= 6) return lidDigits;
  }

  return remoteJid.split("@")[0]?.replace(/\D/g, "") ?? "";
}

function parseOneMessageItem(
  item: Record<string, unknown>,
  envelope: Record<string, unknown>
): WebhookHandleResult | null {
  const key = (item.key ?? {}) as Record<string, unknown>;
  const fromMe = Boolean(key.fromMe ?? item.fromMe);
  if (fromMe) return { handled: false, fromMe: true };

  const remoteJid = String(key.remoteJid ?? item.remoteJid ?? "");
  if (remoteJid.endsWith("@g.us")) {
    return {
      handled: false,
      isGroup: true,
      instanceName: resolveInstanceName(envelope, item),
    };
  }

  const message = (item.message ?? {}) as Record<string, unknown>;
  const text = extractMessageText(message, item);
  const phone = resolvePhone(item, key);
  const instanceName = resolveInstanceName(envelope, item);

  if (!phone || !text) {
    return {
      handled: false,
      instanceName,
      phone: phone || undefined,
      remoteJid: remoteJid || undefined,
    };
  }

  return {
    handled: true,
    instanceName,
    phone,
    text,
    providerMessageId: String(key.id ?? item.messageId ?? ""),
    fromMe: false,
    remoteJid,
  };
}

function isMessageUpsertEvent(event: string): boolean {
  const e = event.toUpperCase();
  return e.includes("MESSAGES_UPSERT") || e.includes("MESSAGES.UPSERT");
}

function isConnectionEvent(event: string): boolean {
  return event.toUpperCase().includes("CONNECTION");
}

/** Parsea uno o más mensajes inbound del payload Evolution v1/v2. */
export function parseEvolutionWebhookBatch(payload: unknown): {
  event: string;
  connectionOnly: boolean;
  items: WebhookHandleResult[];
  skipReason?: string;
} {
  if (!payload || typeof payload !== "object") {
    return { event: "", connectionOnly: false, items: [], skipReason: "invalid_payload" };
  }

  const p = payload as Record<string, unknown>;
  const event = String(p.event ?? p.type ?? "");
  const instanceName = resolveInstanceName(p, (p.data ?? {}) as Record<string, unknown>);

  if (isConnectionEvent(event)) {
    return {
      event,
      connectionOnly: true,
      items: [{ handled: true, instanceName }],
    };
  }

  if (event && !isMessageUpsertEvent(event)) {
    return { event, connectionOnly: false, items: [], skipReason: `ignored_event:${event}` };
  }

  const data = p.data ?? p;
  const envelope = p;
  const results: WebhookHandleResult[] = [];

  if (Array.isArray(data)) {
    for (const row of data) {
      if (row && typeof row === "object") {
        const parsed = parseOneMessageItem(row as Record<string, unknown>, envelope);
        if (parsed) results.push(parsed);
      }
    }
  } else if (data && typeof data === "object") {
    const parsed = parseOneMessageItem(data as Record<string, unknown>, envelope);
    if (parsed) results.push(parsed);
  }

  if (!results.length) {
    return { event, connectionOnly: false, items: [], skipReason: "no_parseable_messages" };
  }

  return { event, connectionOnly: false, items: results };
}
