import { prisma } from "@/lib/prisma";
import type { WhatsappMessageSenderType } from "@prisma/client";
import { getWhatsAppProvider } from "./providers/evolution-provider";

export async function isDuplicateInboundMessage(providerMessageId?: string): Promise<boolean> {
  if (!providerMessageId) return false;
  const existing = await prisma.whatsappMessage.findFirst({
    where: { providerMessageId },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function saveOutboundMessage(
  conversationId: string,
  content: string,
  senderType: WhatsappMessageSenderType,
  providerMessageId?: string,
  source: "webhook" | "history_sync" | "manual" | "bot" = "webhook"
) {
  return prisma.whatsappMessage.create({
    data: {
      conversationId,
      direction: "outbound",
      senderType,
      content,
      messageType: "text",
      providerMessageId,
      source: senderType === "bot" ? "bot" : source,
    },
  });
}

export async function sendSellerWhatsappMessage(params: {
  sellerId: string;
  conversationId: string;
  text: string;
  autoHandoff?: boolean;
}) {
  const text = params.text.trim().slice(0, 4000);
  if (!text) throw new Error("empty_message");

  const conversation = await prisma.whatsappConversation.findFirst({
    where: { id: params.conversationId, sellerId: params.sellerId },
    include: { session: true },
  });
  if (!conversation) throw new Error("conversation_not_found");

  const session =
    conversation.session ??
    (await prisma.whatsappSession.findUnique({ where: { sellerId: params.sellerId } }));
  if (!session || session.status !== "connected") {
    throw new Error("whatsapp_not_connected");
  }

  if (params.autoHandoff !== false && conversation.status === "bot_active") {
    const { requestHumanHandoff } = await import("./human-handoff-service");
    await requestHumanHandoff(conversation.id, "Vendedor respondió desde el panel");
  }

  const provider = getWhatsAppProvider();
  const sent = await provider.sendMessage(session.providerInstanceId, conversation.phone, text);
  if (!sent.ok) throw new Error(sent.error || "send_failed");

  const msg = await saveOutboundMessage(
    conversation.id,
    text,
    "seller",
    sent.providerMessageId
  );

  await prisma.whatsappConversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  return msg;
}

/** Envío outbound genérico (bot, automatizaciones, campañas). */
export async function sendWhatsappOutboundToPhone(params: {
  sellerId: string;
  phone: string;
  text: string;
  senderType: WhatsappMessageSenderType;
  leadId?: string;
}): Promise<{ ok: true; conversationId: string } | { ok: false; error: string }> {
  const text = params.text.trim().slice(0, 4000);
  if (!text) return { ok: false, error: "empty_message" };

  const session = await prisma.whatsappSession.findUnique({
    where: { sellerId: params.sellerId },
  });
  if (!session || session.status !== "connected") {
    return { ok: false, error: "whatsapp_not_connected" };
  }

  const phone = params.phone.replace(/\D/g, "");
  const lead =
    params.leadId != null
      ? await prisma.whatsappLead.findFirst({
          where: { id: params.leadId, sellerId: params.sellerId },
        })
      : await prisma.whatsappLead.findUnique({
          where: { sellerId_phone: { sellerId: params.sellerId, phone } },
        });
  if (!lead) return { ok: false, error: "lead_not_found" };

  let conversation = await prisma.whatsappConversation.findUnique({
    where: { sellerId_phone: { sellerId: params.sellerId, phone } },
  });
  if (!conversation) {
    conversation = await prisma.whatsappConversation.create({
      data: {
        sellerId: params.sellerId,
        storeId: params.sellerId,
        leadId: lead.id,
        whatsappSessionId: session.id,
        phone,
        status: "bot_active",
        lastMessageAt: new Date(),
      },
    });
  }

  const provider = getWhatsAppProvider();
  const sent = await provider.sendMessage(session.providerInstanceId, phone, text);
  if (!sent.ok) return { ok: false, error: sent.error || "send_failed" };

  await saveOutboundMessage(conversation.id, text, params.senderType, sent.providerMessageId);
  const now = new Date();
  await prisma.whatsappConversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: now },
  });
  await prisma.whatsappLead.update({
    where: { id: lead.id },
    data: { lastMessageAt: now },
  });

  return { ok: true, conversationId: conversation.id };
}
