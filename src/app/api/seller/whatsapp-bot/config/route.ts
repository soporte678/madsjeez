import { NextRequest, NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";
import type { WhatsappBotTone } from "@prisma/client";
import { parseBusinessHours, DEFAULT_BUSINESS_HOURS } from "@/lib/whatsapp-bot/business-hours";

const TONES: WhatsappBotTone[] = ["cercano", "profesional", "rapido", "experto"];

export async function GET() {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const config = await prisma.sellerBotConfig.upsert({
    where: { sellerId: auth.ctx.sellerId },
    create: { sellerId: auth.ctx.sellerId, storeId: auth.ctx.sellerId },
    update: {},
  });

  return NextResponse.json({ config });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (typeof body.autoReplyEnabled === "boolean") data.autoReplyEnabled = body.autoReplyEnabled;
  if (typeof body.humanHandoffEnabled === "boolean") data.humanHandoffEnabled = body.humanHandoffEnabled;
  if (typeof body.customInstructions === "string") {
    data.customInstructions = body.customInstructions.slice(0, 2000);
  }
  if (body.botDisplayName === null || body.botDisplayName === "") {
    data.botDisplayName = null;
  } else if (typeof body.botDisplayName === "string") {
    const name = body.botDisplayName.trim().slice(0, 64);
    data.botDisplayName = name.length > 0 ? name : null;
  }
  if (typeof body.tone === "string" && TONES.includes(body.tone as WhatsappBotTone)) {
    data.tone = body.tone;
  }
  if (typeof body.maxAutoMessagesBeforeHandoff === "number") {
    data.maxAutoMessagesBeforeHandoff = Math.min(50, Math.max(3, Math.floor(body.maxAutoMessagesBeforeHandoff)));
  }
  if (typeof body.businessHoursEnabled === "boolean") {
    data.businessHoursEnabled = body.businessHoursEnabled;
  }
  if (typeof body.allowWhatsAppGroups === "boolean") {
    data.allowWhatsAppGroups = body.allowWhatsAppGroups;
  }
  if (body.businessHours !== undefined) {
    const parsed = parseBusinessHours(body.businessHours);
    data.businessHours = parsed ?? DEFAULT_BUSINESS_HOURS;
  }
  if (typeof body.businessProfile === "string") {
    data.businessProfile = body.businessProfile.slice(0, 64);
  }

  const config = await prisma.sellerBotConfig.upsert({
    where: { sellerId: auth.ctx.sellerId },
    create: {
      sellerId: auth.ctx.sellerId,
      storeId: auth.ctx.sellerId,
      ...data,
    },
    update: data,
  });

  return NextResponse.json({ config });
}
