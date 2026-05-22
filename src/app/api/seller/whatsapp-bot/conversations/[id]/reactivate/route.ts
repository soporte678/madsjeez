import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";
import { reactivateBot } from "@/lib/whatsapp-bot/human-handoff-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const conv = await prisma.whatsappConversation.findFirst({
    where: { id, sellerId: auth.ctx.sellerId },
  });
  if (!conv) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await reactivateBot(conv.id, auth.ctx.sellerId);
  return NextResponse.json({ ok: true, status: "bot_active" });
}
