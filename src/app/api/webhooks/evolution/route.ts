import { NextRequest, NextResponse } from "next/server";
import { getWhatsappBotEnv, parseSellerIdFromInstance } from "@/lib/whatsapp-bot/config";
import { getWhatsAppProvider } from "@/lib/whatsapp-bot/providers/evolution-provider";
import { processInboundWhatsappMessage } from "@/lib/whatsapp-bot/bot-engine";
import { prisma } from "@/lib/prisma";
import { simpleRateLimit } from "@/lib/simple-rate-limit";

export async function POST(req: NextRequest) {
  const { webhookSecret } = getWhatsappBotEnv();
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && !webhookSecret) {
    console.error("[whatsapp-bot] EVOLUTION_WEBHOOK_SECRET required in production");
    return NextResponse.json({ error: "misconfigured" }, { status: 503 });
  }

  if (webhookSecret) {
    const header =
      req.headers.get("x-madsjeez-webhook-secret") ||
      req.headers.get("apikey") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (header !== webhookSecret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rl = simpleRateLimit(`evolution-webhook:${ip}`, 120, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
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
    const config = await prisma.sellerBotConfig.findUnique({ where: { sellerId } });
    if (parsed.isGroup && !config?.allowWhatsAppGroups) {
      return NextResponse.json({ ok: true, skipped: "group" });
    }

    const msgRl = simpleRateLimit(`wa-in:${sellerId}:${parsed.phone}`, 30, 60_000);
    if (!msgRl.ok) {
      return NextResponse.json({ ok: true, rate_limited: true });
    }

    try {
      await processInboundWhatsappMessage({
        instanceName,
        phone: parsed.phone,
        text: parsed.text,
        providerMessageId: parsed.providerMessageId,
        remoteJid: parsed.remoteJid,
        isGroup: parsed.isGroup,
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
