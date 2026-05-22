import { NextRequest, NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";
import { sendSellerWhatsappMessage } from "@/lib/whatsapp-bot/message-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const conv = await prisma.whatsappConversation.findFirst({
    where: { id, sellerId: auth.ctx.sellerId },
    select: { id: true },
  });
  if (!conv) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const limit = Math.min(100, Number(req.nextUrl.searchParams.get("limit") || 50));
  const messages = await prisma.whatsappMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      direction: true,
      senderType: true,
      content: true,
      messageType: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ messages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text_required" }, { status: 400 });
  }

  try {
    const message = await sendSellerWhatsappMessage({
      sellerId: auth.ctx.sellerId,
      conversationId: id,
      text,
      autoHandoff: true,
    });
    return NextResponse.json({ message });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "send_failed";
    const status =
      msg === "conversation_not_found"
        ? 404
        : msg === "whatsapp_not_connected"
          ? 503
          : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
