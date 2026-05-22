import { NextRequest, NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";
import { getWhatsAppProvider } from "@/lib/whatsapp-bot/providers/evolution-provider";

const RATE_LIMIT_MS = 2500;

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

  const segment = campaign.segment as { stages?: string[]; tags?: string[] };
  const stages = segment.stages ?? ["new", "warm", "hot"];

  const leads = await prisma.whatsappLead.findMany({
    where: {
      sellerId: auth.ctx.sellerId,
      status: { in: stages as ("new" | "warm" | "hot" | "customer" | "closed" | "lost")[] },
    },
    take: 50,
  });

  await prisma.whatsappCampaign.update({
    where: { id },
    data: { status: "running" },
  });

  const provider = getWhatsAppProvider();
  let sent = 0;

  for (const lead of leads) {
    try {
      await provider.sendText(auth.ctx.sellerId, lead.phone, campaign.messageTemplate);
      sent++;
      await prisma.whatsappCampaign.update({
        where: { id },
        data: { sentCount: { increment: 1 } },
      });
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    } catch (e) {
      console.error("[campaign-send]", lead.phone, e);
    }
  }

  await prisma.whatsappCampaign.update({
    where: { id },
    data: { status: sent > 0 ? "finished" : "paused" },
  });

  return NextResponse.json({
    ok: true,
    sent,
    totalTargets: leads.length,
    warning: "Máximo 50 contactos por envío. Rate limit 2.5s entre mensajes.",
  });
}
