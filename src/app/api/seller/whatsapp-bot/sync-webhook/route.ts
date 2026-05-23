import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";
import { resyncEvolutionInstanceWebhook } from "@/lib/whatsapp-bot/providers/evolution-provider";
import { getExpectedWebhookUrl } from "@/lib/whatsapp-bot/webhook-debug-store";
import { getWhatsappBotEnv } from "@/lib/whatsapp-bot/config";

/** Re-aplica webhook en Evolution (URL + secret de Railway). */
export async function POST() {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const session = await prisma.whatsappSession.findUnique({
    where: { sellerId: auth.ctx.sellerId },
  });
  if (!session?.providerInstanceId) {
    return NextResponse.json({ error: "no_whatsapp_session" }, { status: 404 });
  }

  const { webhookSecret, evolutionConfigured } = getWhatsappBotEnv();
  if (!evolutionConfigured) {
    return NextResponse.json({ error: "evolution_not_configured" }, { status: 503 });
  }

  const placeholder =
    !webhookSecret ||
    webhookSecret.length < 12 ||
    /placeholder|optional|changeme|example|secret_here/i.test(webhookSecret);

  try {
    await resyncEvolutionInstanceWebhook(session.providerInstanceId);
    return NextResponse.json({
      ok: true,
      webhookUrl: getExpectedWebhookUrl(),
      instance: session.providerInstanceId,
      webhookSecretWarning: placeholder
        ? "EVOLUTION_WEBHOOK_SECRET parece placeholder — generá uno real (openssl rand -hex 32) y ponelo en Railway + re-sync."
        : null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "webhook_sync_failed";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
