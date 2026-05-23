import { NextRequest, NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const campaigns = await prisma.whatsappCampaign.findMany({
    where: { sellerId: auth.ctx.sellerId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const messageTemplate = String(body.messageTemplate ?? "").trim();
  if (!name || !messageTemplate) {
    return NextResponse.json({ error: "name_and_message_required" }, { status: 400 });
  }

  const campaign = await prisma.whatsappCampaign.create({
    data: {
      sellerId: auth.ctx.sellerId,
      name,
      messageTemplate,
      segment: body.segment ?? { stages: ["new", "warm"] },
      status: "draft",
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
