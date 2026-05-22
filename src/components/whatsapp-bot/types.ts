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
  customInstructions: string | null;
  humanHandoffEnabled: boolean;
  autoReplyEnabled: boolean;
  maxAutoMessagesBeforeHandoff: number;
  businessHoursEnabled: boolean;
  businessHours: BusinessHoursConfig | null;
};

export type ConversationRow = {
  id: string;
  phone: string;
  status: string;
  leadStatus: string;
  leadName?: string | null;
  leadId?: string;
  lastMessageAt: string | null;
  lastMessage: { content: string; senderType: string; createdAt?: string } | null;
};

export type MessageRow = {
  id: string;
  direction: string;
  senderType: string;
  content: string;
  createdAt: string;
};

export type LeadRow = {
  id: string;
  phone: string;
  name?: string | null;
  status: string;
  intent: string | null;
  source?: string;
  tags?: string[];
  internalNotes?: string | null;
  email?: string | null;
  company?: string | null;
  lastMessageAt: string | null;
  createdAt?: string;
};

export type AiHealth = {
  primary: string;
  geminiConfigured: boolean;
  ollamaOk?: boolean;
  ollamaModel?: string;
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

export function displayName(c: { leadName?: string | null; phone: string }): string {
  return c.leadName?.trim() || c.phone;
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
