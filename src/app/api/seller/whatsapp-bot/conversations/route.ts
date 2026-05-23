import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const conversations = await prisma.whatsappConversation.findMany({
    where: { sellerId: auth.ctx.sellerId },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    include: {
      lead: { select: { status: true, name: true, intent: true, pushName: true, fullName: true, businessName: true, profilePicUrl: true, tags: true, whatsappLabels: true, lastSyncedAt: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true, senderType: true },
      },
    },
  });

  return NextResponse.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      phone: c.phone,
      status: c.status,
      leadId: c.leadId,
      leadStatus: c.lead.status,
      leadName: c.lead.name,
      leadFullName: c.lead.fullName,
      leadPushName: c.lead.pushName,
      leadProfilePicUrl: c.lead.profilePicUrl,
      leadTags: c.lead.tags,
      leadWhatsappLabels: c.lead.whatsappLabels,
      leadLastSyncedAt: c.lead.lastSyncedAt,
      leadIntent: c.lead.intent,
      lastMessageAt: c.lastMessageAt,
      lastMessage: c.messages[0]
        ? {
            content: c.messages[0].content.slice(0, 200),
            senderType: c.messages[0].senderType,
            createdAt: c.messages[0].createdAt,
          }
        : null,
    })),
  });
}
