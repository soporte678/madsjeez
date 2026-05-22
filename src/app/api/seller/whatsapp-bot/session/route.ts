import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import {
  connectSellerWhatsapp,
  disconnectSellerWhatsapp,
  refreshSellerQr,
} from "@/lib/whatsapp-bot/session-service";
import { syncSessionConnectionState } from "@/lib/whatsapp-bot/bot-engine";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await syncSessionConnectionState(auth.ctx.sellerId);
  const session = await prisma.whatsappSession.findUnique({
    where: { sellerId: auth.ctx.sellerId },
  });
  const config = await prisma.sellerBotConfig.findUnique({
    where: { sellerId: auth.ctx.sellerId },
  });

  const connected = session?.status === "connected";

  return NextResponse.json({
    session: session
      ? {
          id: session.id,
          status: session.status,
          phoneNumber: session.phoneNumber,
          hasQr: connected ? false : Boolean(session.qrCode),
          lastConnectedAt: session.lastConnectedAt,
          lastError: session.lastError,
        }
      : null,
    config: config ?? { enabled: false },
  });
}

export async function POST() {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const session = await connectSellerWhatsapp(auth.ctx.sellerId);
    return NextResponse.json({
      session: {
        id: session.id,
        status: session.status,
        phoneNumber: session.phoneNumber,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "connect_failed";
    return NextResponse.json(
      {
        error: msg.includes("evolution") ? "evolution_error" : "connect_failed",
        message: msg,
      },
      { status: 503 }
    );
  }
}

export async function DELETE() {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const session = await disconnectSellerWhatsapp(auth.ctx.sellerId);
  return NextResponse.json({ session });
}
