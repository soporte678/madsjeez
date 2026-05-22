import { prisma } from "@/lib/prisma";
import { getWhatsappBotEnv, parseSellerIdFromInstance } from "./config";
import { generateBotReply, FALLBACK_NO_AI } from "./ai-response-service";
import { buildStoreContext } from "./seller-knowledge-service";
import { customerWantsHuman, requestHumanHandoff } from "./human-handoff-service";
import { detectIntentSnippet, scoreLeadFromMessage } from "./lead-scoring-service";
import { getWhatsAppProvider } from "./providers/evolution-provider";
import {
  isDuplicateInboundMessage,
  saveOutboundMessage,
} from "./message-service";
import { parseBusinessHours, isWithinBusinessHours, getOfflineMessage } from "./business-hours";
import { notifySellerWhatsapp } from "./seller-notifications";

export type InboundMessageInput = {
  instanceName: string;
  phone: string;
  text: string;
  providerMessageId?: string;
};

export async function processInboundWhatsappMessage(input: InboundMessageInput) {
  if (await isDuplicateInboundMessage(input.providerMessageId)) {
    return;
  }

  const sellerId = parseSellerIdFromInstance(input.instanceName);
  if (!sellerId) {
    console.warn("[whatsapp-bot] unknown instance", input.instanceName);
    return;
  }

  const session = await prisma.whatsappSession.findUnique({
    where: { sellerId },
  });
  if (!session) return;

  const phone = input.phone.replace(/\D/g, "");
  const now = new Date();
  const preview = input.text.slice(0, 80);

  let lead = await prisma.whatsappLead.findUnique({
    where: { sellerId_phone: { sellerId, phone } },
  });
  const previousLeadStatus = lead?.status;

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
      providerMessageId: input.providerMessageId,
    },
  });

  const { runWhatsappAutomations } = await import("./automation-runner");
  await runWhatsappAutomations({
    sellerId,
    phone,
    text: input.text,
    leadId: lead.id,
    conversationId: conversation.id,
    leadStatus: lead.status,
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

  if (!config.enabled || !config.autoReplyEnabled) return;
  if (conversation.status === "human_active") return;
  if (session.status !== "connected") return;

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

  const { appBase } = getWhatsappBotEnv();
  const storeContext = await buildStoreContext(sellerId, input.text, appBase);

  const recent = await prisma.whatsappMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const recentMessages = recent.reverse().map((m) => ({
    role: (m.direction === "inbound" ? "user" : "assistant") as "user" | "assistant",
    content: m.content.slice(0, 400),
  }));

  const { text: reply } = await generateBotReply({
    customerMessage: input.text,
    storeContext,
    tone: config.tone,
    customInstructions: config.customInstructions,
    recentMessages,
  });

  await sendAndStore(session.providerInstanceId, phone, conversation.id, reply, "bot");

  await prisma.whatsappConversation.update({
    where: { id: conversation.id },
    data: { botMessageCount: { increment: 1 } },
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
