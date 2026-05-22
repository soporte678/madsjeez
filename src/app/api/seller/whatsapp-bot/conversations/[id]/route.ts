import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const conversation = await prisma.whatsappConversation.findFirst({
    where: { id, sellerId: auth.ctx.sellerId },
    include: {
      lead: { select: { id: true, phone: true, status: true, name: true, intent: true } },
      handoffs: {
        where: { status: { in: ["requested", "accepted"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}
