import type { BusinessHoursConfig } from "@/lib/whatsapp-bot/business-hours";

export type WaNavId =
  | "resumen"
  | "conversaciones"
  | "contactos"
  | "automatizaciones"
  | "catalogo"
  | "campanas"
  | "metricas"
  | "configuracion";

export type SessionState = {
  id: string;
  status: string;
  phoneNumber: string | null;
  hasQr: boolean;
  lastConnectedAt: string | null;
  lastError: string | null;
};

export type BotConfig = {
  enabled: boolean;
  tone: string;
  botDisplayName: string | null;
  customInstructions: string | null;
  humanHandoffEnabled: boolean;
  autoReplyEnabled: boolean;
  maxAutoMessagesBeforeHandoff: number;
  businessHoursEnabled: boolean;
  businessHours: BusinessHoursConfig | null;
  allowWhatsAppGroups?: boolean;
};

export type ConversationRow = {
  id: string;
  phone: string;
  status: string;
  leadStatus: string;
  leadName?: string | null;
  leadFullName?: string | null;
  leadPushName?: string | null;
  leadProfilePicUrl?: string | null;
  leadTags?: string[];
  leadWhatsappLabels?: string[];
  leadLastSyncedAt?: string | null;
  leadId?: string;
  lastMessageAt: string | null;
  lastMessage: { content: string; senderType: string; createdAt?: string } | null;
};

export type MessageRow = {
  id: string;
  direction: string;
  senderType: string;
  content: string;
  source?: string;
  createdAt: string;
};

export type LeadRow = {
  id: string;
  phone: string;
  name?: string | null;
  pushName?: string | null;
  firstName?: string | null;
  fullName?: string | null;
  businessName?: string | null;
  verifiedName?: string | null;
  profilePicUrl?: string | null;
  isBusiness?: boolean;
  whatsappLabels?: string[];
  status: string;
  intent: string | null;
  source?: string;
  tags?: string[];
  internalNotes?: string | null;
  email?: string | null;
  company?: string | null;
  lastMessageAt: string | null;
  lastSyncedAt?: string | null;
  createdAt?: string;
};

export type AiHealth = {
  primary: string;
  geminiConfigured: boolean;
  ollamaOk?: boolean;
  ollamaReachable?: boolean;
  ollamaModel?: string;
  ollamaBaseUrl?: string;
  ollamaConfigIssue?: string | null;
  providerEnv?: string;
};

export type FilterTab = "all" | "bot" | "human" | "leads" | "unread";

export const STATUS_LABEL: Record<string, string> = {
  disconnected: "Desconectado",
  qr_pending: "Esperando QR",
  connected: "Conectado",
  error: "Error",
};

export const LEAD_LABEL: Record<string, string> = {
  new: "Nuevo",
  warm: "Tibio",
  hot: "Caliente",
  customer: "Cliente",
  closed: "Cerrado",
  lost: "Perdido",
};

export const LEAD_TONE: Record<string, "blue" | "orange" | "red" | "green" | "slate"> = {
  new: "blue",
  warm: "orange",
  hot: "red",
  customer: "green",
  closed: "slate",
  lost: "slate",
};

export const LEAD_STATUSES = ["new", "warm", "hot", "customer", "closed", "lost"] as const;

export function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export function displayName(c: {
  leadName?: string | null;
  leadFullName?: string | null;
  leadPushName?: string | null;
  name?: string | null;
  phone: string;
  fullName?: string | null;
  firstName?: string | null;
  pushName?: string | null;
  businessName?: string | null;
  verifiedName?: string | null;
}): string {
  const full = (c.fullName ?? c.leadFullName)?.trim();
  const push = (c.pushName ?? c.leadPushName)?.trim();
  const verified = c.verifiedName?.trim();
  const business = c.businessName?.trim();
  const alias = c.leadName?.trim() || c.name?.trim() || c.firstName?.trim();
  return full || push || verified || business || alias || c.phone;
}

export function formatSyncedAt(iso: string | null | undefined): string {
  if (!iso) return "Nunca";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function computeMetrics(leads: LeadRow[], conversations: ConversationRow[]) {
  const leadsToday = leads.filter(
    (l) => isToday(l.createdAt) || isToday(l.lastMessageAt)
  ).length;
  const openChats = conversations.filter(
    (c) => c.status === "bot_active" || c.status === "human_active"
  ).length;
  const customers = leads.filter((l) => l.status === "customer").length;
  const conversionPct =
    leads.length > 0 ? Math.round((customers / leads.length) * 100) : null;
  return { leadsToday, openChats, conversionPct };
}
