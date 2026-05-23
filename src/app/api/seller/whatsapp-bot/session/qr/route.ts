import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { refreshSellerQr } from "@/lib/whatsapp-bot/session-service";
import { syncSessionConnectionState } from "@/lib/whatsapp-bot/bot-engine";

export async function GET() {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await syncSessionConnectionState(auth.ctx.sellerId);

  try {
    const session = await refreshSellerQr(auth.ctx.sellerId);
    if (!session.qrCode && session.status !== "connected") {
      return NextResponse.json({ error: "qr_not_available", status: session.status }, { status: 404 });
    }
    return NextResponse.json({
      status: session.status,
      qrCode: session.status === "connected" ? null : session.qrCode,
      phoneNumber: session.phoneNumber,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "qr_failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
