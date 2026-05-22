import { prisma } from "@/lib/prisma";
import { getWhatsappBotEnv, parseSellerIdFromInstance } from "./config";
import { generateBotReply, FALLBACK_NO_AI } from "./ai-response-service";
import { buildStoreContext } from "./seller-knowledge-service";
import { customerWantsHuman, requestHumanHandoff } from "./human-handoff-service";
import { detectIntentSnippet, scoreLeadFromMessage } from "./lead-scoring-service";
import { getWhatsAppProvider } from "./providers/evolution-provider";

export type InboundMessageInput = {
  instanceName: string;
  phone: string;
  text: string;
  providerMessageId?: string;
};

export async function processInboundWhatsappMessage(input: InboundMessageInput) {
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

  let lead = await prisma.whatsappLead.findUnique({
    where: { sellerId_phone: { sellerId, phone } },
  });
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

  const config = await prisma.sellerBotConfig.upsert({
    where: { sellerId },
    create: { sellerId, storeId: sellerId, enabled: false },
    update: {},
  });

  if (!config.enabled || !config.autoReplyEnabled) return;

  if (conversation.status === "human_active") return;

  if (customerWantsHuman(input.text) && config.humanHandoffEnabled) {
    await requestHumanHandoff(conversation.id, "Cliente pidió hablar con humano");
    const provider = getWhatsAppProvider();
    await provider.sendMessage(
      session.providerInstanceId,
      phone,
      "Dale, te derivo con el vendedor para que te ayude personalmente."
    );
    await saveOutbound(conversation.id, "Dale, te derivo con el vendedor para que te ayude personalmente.");
    return;
  }

  if (conversation.botMessageCount >= config.maxAutoMessagesBeforeHandoff) {
    await requestHumanHandoff(conversation.id, "Límite de mensajes automáticos");
    await sendAndStore(
      session.providerInstanceId,
      phone,
      conversation.id,
      FALLBACK_NO_AI
    );
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

  await sendAndStore(session.providerInstanceId, phone, conversation.id, reply);

  await prisma.whatsappConversation.update({
    where: { id: conversation.id },
    data: { botMessageCount: { increment: 1 } },
  });
}

async function sendAndStore(
  instanceId: string,
  phone: string,
  conversationId: string,
  text: string
) {
  const provider = getWhatsAppProvider();
  await provider.sendMessage(instanceId, phone, text);
  await saveOutbound(conversationId, text);
}

async function saveOutbound(conversationId: string, content: string) {
  await prisma.whatsappMessage.create({
    data: {
      conversationId,
      direction: "outbound",
      senderType: "bot",
      content,
      messageType: "text",
    },
  });
}

export async function syncSessionConnectionState(sellerId: string) {
  const session = await prisma.whatsappSession.findUnique({ where: { sellerId } });
  if (!session) return null;

  const provider = getWhatsAppProvider();
  const state = await provider.getConnectionState(session.providerInstanceId);

  await prisma.whatsappSession.update({
    where: { id: session.id },
    data: {
      status: state.status,
      qrCode: state.qrCode ?? session.qrCode,
      phoneNumber: state.phoneNumber ?? session.phoneNumber,
      lastConnectedAt: state.status === "connected" ? new Date() : session.lastConnectedAt,
      lastError: state.error ?? null,
    },
  });

  return state;
}
