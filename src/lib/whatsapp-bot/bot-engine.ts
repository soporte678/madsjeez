import { prisma } from "@/lib/prisma";
import { getWhatsappBotEnv, parseSellerIdFromInstance } from "./config";
import { generateBotReply as generateAiBotReply } from "@/lib/ai/aiService";
import { runSalesCloser } from "@/lib/ai/sales-closer";
import { isSalesCloserAutoReplyEnabled } from "@/lib/ai/sales-closer-env";
import { formatStoreContextForPrompt, buildStoreContext } from "./seller-knowledge-service";
import { searchCatalogBeforeReply } from "@/lib/ai/aiService";
import { FALLBACK_NO_AI } from "./ai-response-service";
import { customerWantsHuman, requestHumanHandoff } from "./human-handoff-service";
import { detectIntentSnippet, scoreLeadFromMessage } from "./lead-scoring-service";
import { getWhatsAppProvider } from "./providers/evolution-provider";
import {
  loadDuplicateInboundRetryContext,
  saveOutboundMessage,
} from "./message-service";
import { parseBusinessHours, isWithinBusinessHours, getOfflineMessage } from "./business-hours";
import { notifySellerWhatsapp } from "./seller-notifications";

export type InboundMessageInput = {
  instanceName: string;
  phone: string;
  text: string;
  providerMessageId?: string;
  remoteJid?: string;
  isGroup?: boolean;
};

type AutoReplyContext = {
  input: InboundMessageInput;
  sellerId: string;
  session: NonNullable<Awaited<ReturnType<typeof prisma.whatsappSession.findUnique>>>;
  conversation: { id: string; status: string; botMessageCount: number; sellerId: string };
  lead: {
    id: string;
    phone: string;
    name: string | null;
    pushName: string | null;
    fullName: string | null;
    businessName: string | null;
    status: import("@prisma/client").WhatsappLeadStatus;
    intent: string | null;
    tags: string[];
  };
  config: NonNullable<Awaited<ReturnType<typeof prisma.sellerBotConfig.findUnique>>>;
  phone: string;
  now: Date;
};

async function runBotAutoReply(ctx: AutoReplyContext) {
  const { input, sellerId, session, conversation, lead, config, phone, now } = ctx;

  if (!config.enabled || !config.autoReplyEnabled) {
    console.info("[whatsapp-bot] auto-reply skipped: bot disabled", {
      sellerId,
      enabled: config.enabled,
      autoReplyEnabled: config.autoReplyEnabled,
    });
    return;
  }
  if (conversation.status === "human_active") {
    console.info("[whatsapp-bot] auto-reply skipped: human_active", { conversationId: conversation.id });
    return;
  }
  if (session.status !== "connected") {
    console.info("[whatsapp-bot] auto-reply skipped: session not connected", {
      sellerId,
      sessionStatus: session.status,
    });
    return;
  }
  if (input.isGroup && !config.allowWhatsAppGroups) return;

  if (config.businessHoursEnabled) {
    const hours = parseBusinessHours(config.businessHours);
    if (hours && !isWithinBusinessHours(hours, now)) {
      const offlineMsg = getOfflineMessage(hours);
      await sendAndStore(session.providerInstanceId, phone, conversation.id, offlineMsg, "bot");
      return;
    }
  }

  if (customerWantsHuman(input.text) && config.humanHandoffEnabled) {
    await requestHumanHandoff(conversation.id, "Cliente pidió hablar con humano", {
      notifySeller: true,
      phone,
    });
    const handoffMsg = "Dale, te derivo con el vendedor para que te ayude personalmente.";
    await sendAndStore(session.providerInstanceId, phone, conversation.id, handoffMsg, "bot");
    return;
  }

  if (conversation.botMessageCount >= config.maxAutoMessagesBeforeHandoff) {
    await requestHumanHandoff(conversation.id, "Límite de mensajes automáticos", {
      notifySeller: true,
      phone,
    });
    await sendAndStore(session.providerInstanceId, phone, conversation.id, FALLBACK_NO_AI, "bot");
    return;
  }

  if (isSalesCloserAutoReplyEnabled()) {
    console.info("[whatsapp-bot] running sales closer", { sellerId, conversationId: conversation.id });
    await runSalesCloser({
      sellerId,
      conversationId: conversation.id,
      customerId: lead.id,
      message: input.text,
      channel: "whatsapp",
      businessProfile: config.businessProfile ?? undefined,
      sendReply: true,
    });
    return;
  }

  const { appBase } = getWhatsappBotEnv();
  const storeContext = await buildStoreContext(sellerId, input.text, appBase);
  const catalogMatches = await searchCatalogBeforeReply(sellerId, input.text, appBase, 12);

  const recent = await prisma.whatsappMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const recentMessages = recent.reverse().map((m) => ({
    direction: m.direction as "inbound" | "outbound",
    senderType: m.senderType,
    content: m.content.slice(0, 600),
    createdAt: m.createdAt,
  }));

  const aiResult = await generateAiBotReply({
    contact: {
      id: lead.id,
      phone: lead.phone,
      name: lead.name,
      pushName: lead.pushName,
      fullName: lead.fullName,
      businessName: lead.businessName,
      status: lead.status,
      intent: lead.intent,
      tags: lead.tags,
    },
    conversation: {
      id: conversation.id,
      status: conversation.status,
      botMessageCount: conversation.botMessageCount,
    },
    recentMessages,
    customerMessage: input.text,
    catalogMatches: catalogMatches.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      stock: p.stock,
      productUrl: p.productUrl,
      imageUrl: p.imageUrl,
      sku: p.sku,
      category: p.category,
      freeShipping: p.freeShipping,
      description: p.description,
    })),
    botSettings: {
      enabled: config.enabled,
      tone: config.tone,
      botDisplayName: config.botDisplayName,
      customInstructions: config.customInstructions,
      humanHandoffEnabled: config.humanHandoffEnabled,
      maxAutoMessagesBeforeHandoff: config.maxAutoMessagesBeforeHandoff,
    },
    storeContextBlock: formatStoreContextForPrompt(storeContext),
  });

  await prisma.whatsappLead.update({
    where: { id: lead.id },
    data: {
      intent: aiResult.intent,
      ...(aiResult.suggestedStage ? { status: aiResult.suggestedStage } : {}),
    },
  });

  if (aiResult.shouldHandoff && config.humanHandoffEnabled) {
    await requestHumanHandoff(conversation.id, aiResult.reason ?? "derivacion_ia", {
      notifySeller: true,
      phone,
    });
    await sendAndStore(
      session.providerInstanceId,
      phone,
      conversation.id,
      aiResult.text || "Te derivo con el vendedor.",
      "bot"
    );
    await prisma.whatsappBotEvent.create({
      data: {
        sellerId,
        conversationId: conversation.id,
        type: "ai_handoff",
        payload: { intent: aiResult.intent, reason: aiResult.reason },
      },
    });
    return;
  }

  if (!aiResult.text.trim()) {
    console.warn("[whatsapp-bot] auto-reply empty", { sellerId, aiError: aiResult.aiError });
    return;
  }

  await sendAndStore(session.providerInstanceId, phone, conversation.id, aiResult.text, "bot");

  await prisma.whatsappBotEvent.create({
    data: {
      sellerId,
      conversationId: conversation.id,
      type: aiResult.usedAi ? "ai_reply" : "rule_reply",
      payload: {
        intent: aiResult.intent,
        provider: aiResult.aiProvider,
        error: aiResult.aiError,
      },
    },
  });

  await prisma.whatsappConversation.update({
    where: { id: conversation.id },
    data: { botMessageCount: { increment: 1 } },
  });
}

export async function processInboundWhatsappMessage(input: InboundMessageInput) {
  if (input.isGroup) {
    console.info("[whatsapp-bot] skip group message", input.phone);
    return;
  }

  if (input.providerMessageId) {
    const dup = await loadDuplicateInboundRetryContext(input.providerMessageId);
    if (dup) {
      if (dup.alreadyReplied) {
        console.info("[whatsapp-bot] skip duplicate (already replied)", input.providerMessageId);
        return;
      }
      const sellerId = dup.conversation.sellerId;
      const session = await prisma.whatsappSession.findUnique({ where: { sellerId } });
      if (!session) {
        console.warn("[whatsapp-bot] duplicate retry — no session", sellerId);
        return;
      }
      const config = await prisma.sellerBotConfig.findUnique({ where: { sellerId } });
      if (!config) return;
      console.info("[whatsapp-bot] duplicate inbound — retry auto-reply", {
        providerMessageId: input.providerMessageId,
        conversationId: dup.conversation.id,
      });
      await runBotAutoReply({
        input,
        sellerId,
        session,
        conversation: dup.conversation,
        lead: dup.lead,
        config,
        phone: input.phone.replace(/\D/g, ""),
        now: dup.inbound.createdAt,
      });
      return;
    }
  }

  const sellerId = parseSellerIdFromInstance(input.instanceName);
  if (!sellerId) {
    console.warn("[whatsapp-bot] unknown instance", input.instanceName);
    return;
  }

  const session = await prisma.whatsappSession.findUnique({
    where: { sellerId },
  });
  if (!session) {
    console.warn("[whatsapp-bot] no session for seller", sellerId, "instance", input.instanceName);
    return;
  }

  const phone = input.phone.replace(/\D/g, "");
  const now = new Date();
  const preview = input.text.slice(0, 80);

  let lead = await prisma.whatsappLead.findUnique({
    where: { sellerId_phone: { sellerId, phone } },
  });
  const previousLeadStatus = lead?.status;
  const isNewContact = !lead;

  if (!lead) {
    lead = await prisma.whatsappLead.create({
      data: {
        sellerId,
        storeId: sellerId,
        phone,
        source: "whatsapp",
        status: "new",
        lastMessageAt: now,
        intent: detectIntentSnippet(input.text),
      },
    });
  } else {
    const newStatus = scoreLeadFromMessage(input.text, lead.status);
    await prisma.whatsappLead.update({
      where: { id: lead.id },
      data: {
        status: newStatus,
        lastMessageAt: now,
        intent: detectIntentSnippet(input.text),
      },
    });
    lead = { ...lead, status: newStatus };
  }

  let conversation = await prisma.whatsappConversation.findUnique({
    where: { sellerId_phone: { sellerId, phone } },
  });
  if (!conversation) {
    conversation = await prisma.whatsappConversation.create({
      data: {
        sellerId,
        storeId: sellerId,
        leadId: lead.id,
        whatsappSessionId: session.id,
        phone,
        status: "bot_active",
        lastMessageAt: now,
      },
    });
  } else {
    await prisma.whatsappConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: now },
    });
  }

  await prisma.whatsappMessage.create({
    data: {
      conversationId: conversation.id,
      direction: "inbound",
      senderType: "customer",
      content: input.text,
      messageType: "text",
      source: "webhook",
      providerMessageId: input.providerMessageId,
      remoteJid: input.remoteJid,
    },
  });

  console.info("[whatsapp-bot] inbound saved", {
    sellerId,
    conversationId: conversation.id,
    phone,
    preview: preview.slice(0, 60),
  });

  const { runWhatsappAutomations } = await import("./automation-runner");
  await runWhatsappAutomations({
    sellerId,
    phone,
    text: input.text,
    leadId: lead.id,
    conversationId: conversation.id,
    leadStatus: lead.status,
    previousLeadStatus,
    isNewContact,
  });

  await notifySellerWhatsapp({
    sellerId,
    conversationId: conversation.id,
    topic: "new_message",
    title: "Nuevo mensaje por WhatsApp",
    message: `${phone}: ${preview}`,
  });

  if (lead.status === "hot" && previousLeadStatus !== "hot") {
    await notifySellerWhatsapp({
      sellerId,
      conversationId: conversation.id,
      topic: "lead_hot",
      title: "Lead caliente por WhatsApp",
      message: `${phone} muestra intención de compra: ${detectIntentSnippet(input.text)}`,
      sendEmail: true,
    });
  }

  const config = await prisma.sellerBotConfig.upsert({
    where: { sellerId },
    create: { sellerId, storeId: sellerId, enabled: false },
    update: {},
  });

  await runBotAutoReply({
    input,
    sellerId,
    session,
    conversation,
    lead,
    config,
    phone,
    now,
  });
}

async function sendAndStore(
  instanceId: string,
  phone: string,
  conversationId: string,
  text: string,
  senderType: "bot" | "system" = "bot"
) {
  const provider = getWhatsAppProvider();
  await provider.sendMessage(instanceId, phone, text);
  await saveOutboundMessage(conversationId, text, senderType);
}

export async function syncSessionConnectionState(sellerId: string) {
  const session = await prisma.whatsappSession.findUnique({ where: { sellerId } });
  if (!session) return null;

  const provider = getWhatsAppProvider();
  const state = await provider.getConnectionState(session.providerInstanceId);
  const wasConnected = session.status === "connected";

  const isConnected = state.status === "connected";

  await prisma.whatsappSession.update({
    where: { id: session.id },
    data: {
      status: state.status,
      qrCode: isConnected ? null : (state.qrCode ?? session.qrCode),
      phoneNumber: state.phoneNumber ?? session.phoneNumber,
      lastConnectedAt: isConnected ? new Date() : session.lastConnectedAt,
      lastError: state.error ?? null,
    },
  });

  if (wasConnected && state.status === "disconnected") {
    const conv = await prisma.whatsappConversation.findFirst({
      where: { sellerId },
      orderBy: { lastMessageAt: "desc" },
      select: { id: true },
    });
    if (conv) {
      await notifySellerWhatsapp({
        sellerId,
        conversationId: conv.id,
        topic: "session_disconnected",
        title: "WhatsApp desconectado",
        message: "Tu sesión de WhatsApp se desconectó. Volvé al panel para reconectar con QR.",
        sendEmail: true,
      });
    }
  }

  return state;
}
