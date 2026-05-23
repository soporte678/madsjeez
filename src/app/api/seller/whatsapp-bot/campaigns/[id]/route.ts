import { NextRequest, NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";
import type { WhatsappCampaignStatus } from "@prisma/client";

const STATUSES: WhatsappCampaignStatus[] = [
  "draft",
  "scheduled",
  "running",
  "paused",
  "finished",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.name === "string") data.name = body.name.slice(0, 120);
  if (typeof body.messageTemplate === "string") data.messageTemplate = body.messageTemplate;
  if (body.segment !== undefined) data.segment = body.segment;
  if (
    typeof body.status === "string" &&
    STATUSES.includes(body.status as WhatsappCampaignStatus)
  ) {
    data.status = body.status;
  }
  if (body.scheduledAt !== undefined) {
    data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
  }

  const result = await prisma.whatsappCampaign.updateMany({
    where: { id, sellerId: auth.ctx.sellerId },
    data,
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const campaign = await prisma.whatsappCampaign.findUnique({ where: { id } });
  return NextResponse.json({ campaign });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  await prisma.whatsappCampaign.deleteMany({
    where: { id, sellerId: auth.ctx.sellerId },
  });
  return NextResponse.json({ ok: true });
}
