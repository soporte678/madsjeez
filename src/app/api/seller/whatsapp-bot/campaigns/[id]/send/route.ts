import { NextRequest, NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsappOutboundToPhone } from "@/lib/whatsapp-bot/message-service";

const RATE_LIMIT_MS = 2500;
const MAX_TARGETS = 50;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  if (body.confirm !== true) {
    return NextResponse.json(
      {
        error: "confirmation_required",
        message:
          "Enviá confirm: true para iniciar la campaña. Revisá segmento y mensaje antes.",
      },
      { status: 400 }
    );
  }

  const { id } = await params;
  const campaign = await prisma.whatsappCampaign.findFirst({
    where: { id, sellerId: auth.ctx.sellerId },
  });
  if (!campaign) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (campaign.status === "running") {
    return NextResponse.json({ error: "already_running" }, { status: 409 });
  }

  const session = await prisma.whatsappSession.findUnique({
    where: { sellerId: auth.ctx.sellerId },
  });
  if (!session || session.status !== "connected") {
    return NextResponse.json(
      {
        error: "whatsapp_not_connected",
        message: "Conectá WhatsApp en Configuración antes de enviar campañas.",
      },
      { status: 503 }
    );
  }

  const segment = campaign.segment as { stages?: string[]; tags?: string[] };
  const stages = (segment.stages ?? ["new", "warm", "hot"]) as (
    | "new"
    | "warm"
    | "hot"
    | "customer"
    | "closed"
    | "lost"
  )[];
  const tagFilter = Array.isArray(segment.tags)
    ? segment.tags.map((t) => String(t).toLowerCase())
    : [];

  let leads = await prisma.whatsappLead.findMany({
    where: {
      sellerId: auth.ctx.sellerId,
      status: { in: stages },
    },
    take: 200,
  });

  if (tagFilter.length > 0) {
    leads = leads.filter((l) =>
      l.tags.some((t) => tagFilter.includes(t.toLowerCase()))
    );
  }

  const targets = leads.slice(0, MAX_TARGETS);

  await prisma.whatsappCampaign.update({
    where: { id },
    data: { status: "running" },
  });

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const lead of targets) {
    const personalized = campaign.messageTemplate
      .replace(/\{\{name\}\}/gi, lead.name?.trim() || lead.phone)
      .replace(/\{\{phone\}\}/gi, lead.phone);

    const result = await sendWhatsappOutboundToPhone({
      sellerId: auth.ctx.sellerId,
      phone: lead.phone,
      text: personalized,
      senderType: "seller",
      leadId: lead.id,
    });

    if (result.ok) {
      sent++;
      await prisma.whatsappCampaign.update({
        where: { id },
        data: { sentCount: { increment: 1 }, deliveredCount: { increment: 1 } },
      });
    } else {
      failed++;
      if (errors.length < 3) errors.push(`${lead.phone}: ${result.error}`);
    }

    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  await prisma.whatsappCampaign.update({
    where: { id },
    data: { status: sent > 0 ? "finished" : "paused" },
  });

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    totalTargets: targets.length,
    errors: errors.length ? errors : undefined,
    warning: `Máximo ${MAX_TARGETS} contactos por envío. Rate limit ${RATE_LIMIT_MS / 1000}s entre mensajes.`,
  });
}
