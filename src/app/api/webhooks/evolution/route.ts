import { NextRequest, NextResponse } from "next/server";
import { getWhatsappBotEnv } from "@/lib/whatsapp-bot/config";
import { getWhatsAppProvider } from "@/lib/whatsapp-bot/providers/evolution-provider";
import { processInboundWhatsappMessage } from "@/lib/whatsapp-bot/bot-engine";
import { prisma } from "@/lib/prisma";
import { parseSellerIdFromInstance } from "@/lib/whatsapp-bot/config";

export async function POST(req: NextRequest) {
  const { webhookSecret } = getWhatsappBotEnv();
  if (webhookSecret) {
    const header = req.headers.get("x-madsjeez-webhook-secret") || req.headers.get("apikey");
    if (header !== webhookSecret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const provider = getWhatsAppProvider();
  const parsed = provider.parseWebhook(payload);

  if (!parsed?.handled) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const instanceName = parsed.instanceName || "";
  const sellerId = parseSellerIdFromInstance(instanceName);

  if (sellerId && parsed.phone && parsed.text) {
    try {
      await processInboundWhatsappMessage({
        instanceName,
        phone: parsed.phone,
        text: parsed.text,
        providerMessageId: parsed.providerMessageId,
      });
    } catch (e) {
      console.error("[whatsapp-bot] inbound error", e instanceof Error ? e.message : e);
    }
    return NextResponse.json({ ok: true });
  }

  if (sellerId && instanceName) {
    const event = String((payload as Record<string, unknown>).event ?? "").toUpperCase();
    if (event.includes("CONNECTION")) {
      const stateRaw = JSON.stringify(payload).toLowerCase();
      const status = stateRaw.includes("open") || stateRaw.includes("connected")
        ? "connected"
        : stateRaw.includes("qr")
          ? "qr_pending"
          : "disconnected";
      await prisma.whatsappSession.updateMany({
        where: { sellerId },
        data: {
          status: status as "connected" | "qr_pending" | "disconnected",
          lastConnectedAt: status === "connected" ? new Date() : undefined,
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
