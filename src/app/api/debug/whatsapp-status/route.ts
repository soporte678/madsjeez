import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWhatsappBotEnv } from "@/lib/whatsapp-bot/config";
import {
  getExpectedWebhookUrl,
  getWebhookDebugLog,
} from "@/lib/whatsapp-bot/webhook-debug-store";
import { checkEvolutionApiHealth } from "@/lib/whatsapp-bot/evolution-health";
import { requireAdminRequest } from "@/lib/admin-api";

function authDebug(req: NextRequest): boolean {
  const { webhookSecret } = getWhatsappBotEnv();
  if (!webhookSecret) return false;
  const q = req.nextUrl.searchParams.get("secret");
  const h = req.headers.get("x-madsjeez-webhook-secret");
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.headers.get("x-debug-secret");
  return q === webhookSecret || h === webhookSecret || bearer === webhookSecret;
}

export async function GET(req: NextRequest) {
  // Layer 1: admin session required
  const adminResult = await requireAdminRequest(req)
  if (adminResult instanceof NextResponse) return adminResult

  // Layer 2: webhook secret check (existing)
  if (!authDebug(req)) {
    return NextResponse.json(
      {
        error: "unauthorized",
        hint: "Pasá ?secret=EVOLUTION_WEBHOOK_SECRET o header x-madsjeez-webhook-secret",
      },
      { status: 401 }
    );
  }

  const { webhookSecret, evolutionConfigured, appBase } = getWhatsappBotEnv();
  const evolution = await checkEvolutionApiHealth();

  const [lastMessage, lastConversation, lastLead, lastWebhookEvent, recentErrors] =
    await Promise.all([
      prisma.whatsappMessage.findFirst({
        where: { direction: "inbound", source: "webhook" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          createdAt: true,
          conversationId: true,
          providerMessageId: true,
        },
      }),
      prisma.whatsappConversation.findFirst({
        orderBy: { createdAt: "desc" },
        select: { id: true, phone: true, sellerId: true, createdAt: true, lastMessageAt: true },
      }),
      prisma.whatsappLead.findFirst({
        orderBy: { createdAt: "desc" },
        select: { id: true, phone: true, sellerId: true, createdAt: true, lastMessageAt: true },
      }),
      prisma.whatsappBotEvent.findFirst({
        where: { type: { in: ["sales_closer_decision", "ai_reply", "ai_handoff"] } },
        orderBy: { createdAt: "desc" },
        select: { type: true, createdAt: true, payload: true },
      }),
      prisma.whatsappBotEvent.findMany({
        where: {
          type: { contains: "error" },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { type: true, createdAt: true, payload: true },
      }),
    ]);

  const sessions = await prisma.whatsappSession.findMany({
    select: {
      sellerId: true,
      status: true,
      providerInstanceId: true,
      phoneNumber: true,
      lastConnectedAt: true,
    },
    take: 10,
  });

  const webhookLog = getWebhookDebugLog();
  const lastRequest = webhookLog[0] ?? null;
  const recentAuthFailures = webhookLog.filter((e) => e.error === "unauthorized").slice(0, 5);

  return NextResponse.json({
    ok: true,
    configured: {
      webhookUrl: getExpectedWebhookUrl(),
      appBase,
      webhookSecretSet: Boolean(webhookSecret),
      evolutionConfigured,
      evolutionApiUrl: getWhatsappBotEnv().evolutionUrl || null,
      configureInEvolution: {
        url: getExpectedWebhookUrl(),
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
        headers: webhookSecret
          ? { "x-madsjeez-webhook-secret": "(valor de EVOLUTION_WEBHOOK_SECRET en Railway)" }
          : {},
        note: "También aceptamos apikey de Evolution (EVOLUTION_API_KEY) en header o body.",
      },
    },
    evolution,
    sessions,
    lastWebhookRequestInMemory: lastRequest,
    recentWebhookRequests: webhookLog.slice(0, 10),
    recentAuthFailures,
    database: {
      lastInboundMessage: lastMessage,
      lastConversation,
      lastLead,
      lastBotEvent: lastWebhookEvent,
    },
    panel: {
      api: "/api/seller/whatsapp-bot/conversations",
      pollingSeconds: 4,
      table: "whatsapp_conversations + whatsapp_messages",
    },
    recentErrors,
    checkedAt: new Date().toISOString(),
  });
}
