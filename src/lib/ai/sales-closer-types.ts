import type { WhatsappLeadStatus } from "@prisma/client";

export type SalesCloserChannel = "whatsapp" | "marketplace" | "instagram" | "web";

export type BusinessProfileId =
  | "repuestos_maquinas"
  | "ferreteria"
  | "marketplace"
  | "servicios_web"
  | "apps"
  | "automatizaciones"
  | "ecommerce"
  | "general";

export const BUSINESS_PROFILE_IDS: BusinessProfileId[] = [
  "repuestos_maquinas",
  "ferreteria",
  "marketplace",
  "servicios_web",
  "apps",
  "automatizaciones",
  "ecommerce",
  "general",
];

export type SalesCloserInput = {
  sellerId: string;
  conversationId?: string;
  customerId?: string;
  message: string;
  channel?: SalesCloserChannel;
  businessProfile?: string;
  /** Si true, envía respuesta por WhatsApp y persiste mensaje outbound */
  sendReply?: boolean;
};

export type SalesCloserOutput = {
  rubro: string;
  intencion: string;
  etapa_lead: string;
  objecion: string;
  dato_faltante: string;
  accion_recomendada: string;
  derivar_humano: boolean;
  respuesta_cliente: string;
  etiquetas: string[];
  /** Meta interna */
  usedAi?: boolean;
  model?: string;
  aiError?: string;
};

export type SalesCloserJsonFromModel = SalesCloserOutput;

export type PlaybookProfile = {
  id: BusinessProfileId;
  label: string;
  tone: string;
  mandatoryQuestions: string[];
  neverInvent: string[];
  frequentObjections: string[];
  recommendedClosings: string[];
  handoffWhen: string[];
  diagnosticHints: string[];
};

export type LeadStage = WhatsappLeadStatus;

export type SalesCloserContext = {
  sellerId: string;
  leadId: string;
  conversationId: string | null;
  channel: SalesCloserChannel;
  businessProfile: BusinessProfileId;
  lead: {
    phone: string;
    status: LeadStage;
    intent: string | null;
    rubro: string | null;
    tags: string[];
    internalNotes: string | null;
    name: string | null;
    pushName: string | null;
    fullName: string | null;
    businessName: string | null;
  };
  recentMessages: { role: "user" | "assistant"; content: string }[];
  catalogBlock: string;
  storeContextBlock: string;
  winningExamplesBlock: string;
  customInstructions: string | null;
  botDisplayName: string | null;
  botTone: string;
};
