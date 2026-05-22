import { prisma } from "@/lib/prisma";

export async function requestHumanHandoff(conversationId: string, reason: string) {
  const conv = await prisma.whatsappConversation.findUnique({
    where: { id: conversationId },
    select: { sellerId: true },
  });
  if (!conv) return;

  await prisma.$transaction([
    prisma.whatsappConversation.update({
      where: { id: conversationId },
      data: { status: "human_active" },
    }),
    prisma.whatsappHumanHandoff.create({
      data: {
        conversationId,
        reason: reason.slice(0, 500),
        status: "requested",
      },
    }),
    prisma.whatsappBotEvent.create({
      data: {
        sellerId: conv.sellerId,
        conversationId,
        type: "human_handoff_requested",
        payload: { reason },
      },
    }),
  ]);
}

export async function reactivateBot(conversationId: string, sellerId: string) {
  await prisma.whatsappConversation.updateMany({
    where: { id: conversationId, sellerId },
    data: { status: "bot_active", botMessageCount: 0 },
  });
  await prisma.whatsappHumanHandoff.updateMany({
    where: { conversationId, status: { in: ["requested", "accepted"] } },
    data: { status: "resolved", resolvedAt: new Date() },
  });
}

export function customerWantsHuman(message: string): boolean {
  return /humano|persona|vendedor|hablar con|alguien|operador|dueño|dueña/.test(
    message.toLowerCase()
  );
}
