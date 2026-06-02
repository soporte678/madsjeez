import { NextRequest, NextResponse } from "next/server";

import { getWhatsappBotEnv, parseSellerIdFromInstance } from "@/lib/whatsapp-bot/config";

import { processInboundWhatsappMessage } from "@/lib/whatsapp-bot/bot-engine";

import { prisma } from "@/lib/prisma";

import { simpleRateLimit } from "@/lib/rate-limit";

import { verifyEvolutionWebhookAuth, pickWebhookHeaders } from "@/lib/whatsapp-bot/webhook-auth";

import { parseEvolutionWebhookBatch } from "@/lib/whatsapp-bot/webhook-parse";

import { recordWebhookDebug } from "@/lib/whatsapp-bot/webhook-debug-store";



function bodyPreview(payload: unknown, max = 1200): string {

  try {

    return JSON.stringify(payload).slice(0, max);

  } catch {

    return String(payload).slice(0, max);

  }

}



export async function GET() {

  return NextResponse.json({

    ok: true,

    endpoint: "/api/webhooks/evolution",

    method: "POST",

    hint: "Evolution debe enviar eventos MESSAGES_UPSERT y CONNECTION_UPDATE a esta URL.",

  });

}



export async function POST(req: NextRequest) {

  const ip =

    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||

    req.headers.get("x-real-ip") ||

    "unknown";



  const rl = simpleRateLimit(`evolution-webhook:${ip}`, 120, 60_000);

  if (!rl.ok) {

    recordWebhookDebug({

      at: new Date().toISOString(),

      method: "POST",

      ip,

      auth: "rate_limited",

      error: "429",

    });

    return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  }



  let payload: unknown;

  try {

    payload = await req.json();

  } catch {

    recordWebhookDebug({

      at: new Date().toISOString(),

      method: "POST",

      ip,

      auth: "invalid_json",

      error: "invalid_json",

      headersPreview: pickWebhookHeaders(req),

    });

    return NextResponse.json({ error: "invalid_json" }, { status: 400 });

  }



  const bodyObj =

    payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};



  const auth = verifyEvolutionWebhookAuth(req, bodyObj);

  if (!auth.ok) {

    recordWebhookDebug({

      at: new Date().toISOString(),

      method: "POST",

      ip,

      auth: auth.reason,

      event: String(bodyObj.event ?? ""),

      error: "unauthorized",

      headersPreview: pickWebhookHeaders(req),

      bodyPreview: bodyPreview(payload),

    });

    return NextResponse.json({ error: "unauthorized", reason: auth.reason }, { status: 401 });

  }



  const batch = parseEvolutionWebhookBatch(payload);

  const event = batch.event || String(bodyObj.event ?? "");



  recordWebhookDebug({

    at: new Date().toISOString(),

    method: "POST",

    ip,

    auth: auth.reason,

    event,

    parseStatus: batch.skipReason ?? `items:${batch.items.length}`,

    headersPreview: pickWebhookHeaders(req),

    bodyPreview: bodyPreview(payload),

  });



  if (batch.connectionOnly) {

    const instanceName = batch.items[0]?.instanceName || "";

    const sellerId = parseSellerIdFromInstance(instanceName);

    if (sellerId && instanceName) {

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

      recordWebhookDebug({

        at: new Date().toISOString(),

        method: "POST",

        ip,

        auth: auth.reason,

        event,

        instanceName,

        saveStatus: `connection_${status}`,

      });

    }

    return NextResponse.json({ ok: true, type: "connection" });

  }



  if (batch.skipReason && !batch.items.length) {

    return NextResponse.json({ ok: true, skipped: batch.skipReason });

  }



  let processed = 0;

  const errors: string[] = [];



  for (const parsed of batch.items) {

    if (!parsed.handled) {

      recordWebhookDebug({

        at: new Date().toISOString(),

        method: "POST",

        ip,

        auth: auth.reason,

        event,

        instanceName: parsed.instanceName,

        phone: parsed.phone,

        parseStatus: parsed.fromMe

          ? "skipped_from_me"

          : parsed.isGroup

            ? "skipped_group"

            : "skipped_no_text_or_phone",

      });

      continue;

    }



    const instanceName = parsed.instanceName || "";

    const sellerId = parseSellerIdFromInstance(instanceName);



    if (!sellerId || !parsed.phone || !parsed.text) {

      recordWebhookDebug({

        at: new Date().toISOString(),

        method: "POST",

        ip,

        auth: auth.reason,

        event,

        instanceName,

        phone: parsed.phone,

        textPreview: parsed.text?.slice(0, 120),

        parseStatus: "missing_seller_or_fields",

      });

      continue;

    }



    const config = await prisma.sellerBotConfig.findUnique({ where: { sellerId } });

    if (parsed.isGroup && !config?.allowWhatsAppGroups) {

      recordWebhookDebug({

        at: new Date().toISOString(),

        method: "POST",

        ip,

        auth: auth.reason,

        event,

        instanceName,

        phone: parsed.phone,

        parseStatus: "skipped_group_config",

      });

      continue;

    }



    const msgRl = simpleRateLimit(`wa-in:${sellerId}:${parsed.phone}`, 30, 60_000);

    if (!msgRl.ok) {

      recordWebhookDebug({

        at: new Date().toISOString(),

        method: "POST",

        ip,

        auth: auth.reason,

        event,

        instanceName,

        phone: parsed.phone,

        parseStatus: "rate_limited_inbound",

      });

      continue;

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

      processed += 1;

      recordWebhookDebug({

        at: new Date().toISOString(),

        method: "POST",

        ip,

        auth: auth.reason,

        event,

        instanceName,

        phone: parsed.phone,

        textPreview: parsed.text.slice(0, 120),

        saveStatus: "saved_ok",

      });

    } catch (e) {

      const errMsg = e instanceof Error ? e.message : String(e);

      errors.push(errMsg);

      console.error("[whatsapp-bot] inbound error", errMsg);

      recordWebhookDebug({

        at: new Date().toISOString(),

        method: "POST",

        ip,

        auth: auth.reason,

        event,

        instanceName,

        phone: parsed.phone,

        textPreview: parsed.text.slice(0, 120),

        saveStatus: "save_failed",

        error: errMsg,

      });

    }

  }



  return NextResponse.json({

    ok: true,

    processed,

    errors: errors.length ? errors : undefined,

    skipped: batch.skipReason,

  });

}


