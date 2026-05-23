import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { checkEvolutionApiHealth } from "@/lib/whatsapp-bot/evolution-health";
import { isGeminiConfigured } from "@/lib/whatsapp-bot/gemini-reply";
import { getWhatsappBotEnv } from "@/lib/whatsapp-bot/config";
import { getExpectedWebhookUrl } from "@/lib/whatsapp-bot/webhook-debug-store";
import { prisma } from "@/lib/prisma";
import { resolveWhatsappAiProvider } from "@/lib/whatsapp-bot/ai-provider";
import { checkOllamaHealth, describeOllamaConfigIssue, isOllamaConfiguredForApp } from "@/lib/whatsapp-bot/ollama-client";
export async function GET() {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const evolution = await checkEvolutionApiHealth();
  const geminiConfigured = isGeminiConfigured();
  const { ollamaModel, ollamaBase } = getWhatsappBotEnv();
  const primary = resolveWhatsappAiProvider();
  const ollama = await checkOllamaHealth();
  const ollamaConfigIssue = describeOllamaConfigIssue();

  const [session, botConfig, lastInbound] = await Promise.all([
    prisma.whatsappSession.findUnique({ where: { sellerId: auth.ctx.sellerId } }),
    prisma.sellerBotConfig.findUnique({ where: { sellerId: auth.ctx.sellerId } }),
    prisma.whatsappMessage.findFirst({
      where: {
        direction: "inbound",
        source: "webhook",
        conversation: { sellerId: auth.ctx.sellerId },
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, content: true },
    }),
  ]);

  const { webhookSecret } = getWhatsappBotEnv();
  const webhookSecretWeak =
    !webhookSecret ||
    webhookSecret.length < 12 ||
    /placeholder|optional|changeme|example|secret_here/i.test(webhookSecret);

  return NextResponse.json({
    evolution,
    pipeline: {
      webhookUrl: getExpectedWebhookUrl(),
      webhookSecretOk: !webhookSecretWeak,
      whatsappConnected: session?.status === "connected",
      botEnabled: Boolean(botConfig?.enabled),
      autoReplyEnabled: Boolean(botConfig?.autoReplyEnabled ?? true),
      lastInboundAt: lastInbound?.createdAt ?? null,
      lastInboundPreview: lastInbound?.content?.slice(0, 80) ?? null,
      ollamaOk: ollama.ok && isOllamaConfiguredForApp(),
    },
    ai: {
      geminiConfigured,
      ollamaOk: ollama.ok && isOllamaConfiguredForApp(),
      ollamaReachable: ollama.ok,
      ollamaModel,
      ollamaBaseUrl: ollamaBase,
      ollamaConfigIssue,
      ollamaModelCount: ollama.models?.length ?? 0,
      primary,
      providerEnv: process.env.WHATSAPP_AI_PROVIDER?.trim() || "auto",
    },
  });
}

