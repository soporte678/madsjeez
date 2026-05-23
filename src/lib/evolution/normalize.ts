import type { Prisma } from "@prisma/client";

export type NormalizedWhatsappContact = {
  jid: string;
  phone: string;
  pushName?: string | null;
  firstName?: string | null;
  fullName?: string | null;
  businessName?: string | null;
  verifiedName?: string | null;
  profilePicUrl?: string | null;
  isBusiness?: boolean;
  whatsappLabels?: string[];
  about?: string | null;
  raw: Prisma.InputJsonValue;
};

export function jidToPhone(jid: string): string {
  const base = jid.split("@")[0] ?? jid;
  return base.replace(/\D/g, "");
}

export function isGroupJid(jid: string): boolean {
  return jid.endsWith("@g.us") || jid.includes("@g.us");
}

export function normalizeWhatsappContact(raw: Record<string, unknown>): NormalizedWhatsappContact | null {
  const jid = String(
    raw.remoteJid ?? raw.jid ?? raw.id ?? (raw.key as Record<string, unknown>)?.remoteJid ?? ""
  );
  if (!jid || isGroupJid(jid)) return null;

  const phone = jidToPhone(jid);
  if (phone.length < 8) return null;

  const pushName = pickString(raw.pushName, raw.notify, raw.name);
  const profileName = raw.profileName as Record<string, unknown> | undefined;

  return {
    jid,
    phone,
    pushName,
    firstName: pickString(raw.firstName, profileName?.firstName),
    fullName: pickString(raw.fullName, profileName?.fullName, raw.contactName),
    businessName: pickString(raw.businessName, profileName?.businessName),
    verifiedName: pickString(raw.verifiedName, profileName?.verifiedName),
    profilePicUrl: pickString(raw.profilePicUrl, raw.profilePictureUrl, raw.imgUrl),
    isBusiness: Boolean(raw.isBusiness ?? profileName?.isBusiness),
    whatsappLabels: Array.isArray(raw.labels)
      ? raw.labels.map(String).slice(0, 20)
      : Array.isArray(raw.labelIds)
        ? raw.labelIds.map(String).slice(0, 20)
        : [],
    about: pickString(raw.about, raw.status),
    raw: raw as Prisma.InputJsonValue,
  };
}

function pickString(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim().slice(0, 200);
  }
  return null;
}

export function resolveContactDisplayName(c: {
  fullName?: string | null;
  pushName?: string | null;
  businessName?: string | null;
  verifiedName?: string | null;
  name?: string | null;
  phone: string;
}): string {
  return (
    c.fullName?.trim() ||
    c.pushName?.trim() ||
    c.businessName?.trim() ||
    c.verifiedName?.trim() ||
    c.name?.trim() ||
    c.phone
  );
}

export type NormalizedWhatsappMessage = {
  remoteJid: string;
  phone: string;
  providerMessageId?: string;
  body: string;
  direction: "inbound" | "outbound";
  senderType: "customer" | "bot" | "seller" | "system";
  timestamp: Date;
  fromMe: boolean;
  raw: Prisma.InputJsonValue;
};

export function normalizeWhatsappMessage(raw: Record<string, unknown>): NormalizedWhatsappMessage | null {
  const key = (raw.key ?? {}) as Record<string, unknown>;
  const remoteJid = String(key.remoteJid ?? raw.remoteJid ?? "");
  if (!remoteJid || isGroupJid(remoteJid)) return null;

  const fromMe = Boolean(key.fromMe ?? raw.fromMe);
  const message = (raw.message ?? raw) as Record<string, unknown>;
  const body =
    pickString(message.conversation) ??
    pickString((message.extendedTextMessage as Record<string, unknown>)?.text) ??
    pickString(raw.text, message.text) ??
    "";

  if (!body.trim()) return null;

  const tsRaw = key.messageTimestamp ?? raw.messageTimestamp ?? raw.timestamp;
  const tsSec = typeof tsRaw === "number" ? tsRaw : Number(tsRaw);
  const timestamp = tsSec > 1e12 ? new Date(tsSec) : new Date(tsSec * 1000);

  const phone = jidToPhone(remoteJid);

  return {
    remoteJid,
    phone,
    providerMessageId: pickString(key.id) ?? undefined,
    body: body.trim().slice(0, 4000),
    direction: fromMe ? "outbound" : "inbound",
    senderType: fromMe ? "seller" : "customer",
    timestamp: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp,
    fromMe,
    raw: raw as Prisma.InputJsonValue,
  };
}
