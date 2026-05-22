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
  providerMessageId?: string
) {
  return prisma.whatsappMessage.create({
    data: {
      conversationId,
      direction: "outbound",
      senderType,
      content,
      messageType: "text",
      providerMessageId,
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
