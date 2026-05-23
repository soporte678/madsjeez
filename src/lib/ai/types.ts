import type { WhatsappBotTone, WhatsappLeadStatus } from "@prisma/client";

export type LeadStage = WhatsappLeadStatus;

export type BotContact = {
  id: string;
  phone: string;
  name?: string | null;
  pushName?: string | null;
  fullName?: string | null;
  businessName?: string | null;
  status: LeadStage;
  intent?: string | null;
  tags?: string[];
};

export type BotConversation = {
  id: string;
  status: string;
  botMessageCount: number;
};

export type BotMessage = {
  direction: "inbound" | "outbound";
  senderType: string;
  content: string;
  createdAt: Date | string;
};

export type CatalogProductMatch = {
  id: string;
  title: string;
  price: number;
  stock: number;
  productUrl?: string;
  imageUrl?: string | null;
  sku?: string | null;
  category?: string | null;
  freeShipping?: boolean;
  description?: string | null;
};

export type BotSettings = {
  enabled: boolean;
  tone: WhatsappBotTone;
  botDisplayName?: string | null;
  customInstructions?: string | null;
  humanHandoffEnabled: boolean;
  maxAutoMessagesBeforeHandoff: number;
};

export type BotReplyInput = {
  contact: BotContact;
  conversation: BotConversation;
  recentMessages: BotMessage[];
  customerMessage: string;
  catalogMatches?: CatalogProductMatch[];
  botSettings: BotSettings;
  storeContextBlock?: string;
};

export type BotReplyOutput = {
  text: string;
  intent: string;
  confidence: number;
  suggestedStage?: LeadStage;
  shouldHandoff: boolean;
  reason?: string;
  usedAi: boolean;
  aiProvider?: string;
  aiError?: string;
};

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
