import { NextRequest, NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";

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
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (typeof body.triggerType === "string") data.triggerType = body.triggerType;
  if (body.triggerConfig !== undefined) data.triggerConfig = body.triggerConfig;
  if (typeof body.actionType === "string") data.actionType = body.actionType;
  if (body.actionConfig !== undefined) data.actionConfig = body.actionConfig;

  const result = await prisma.whatsappAutomation.updateMany({
    where: { id, sellerId: auth.ctx.sellerId },
    data,
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const automation = await prisma.whatsappAutomation.findUnique({ where: { id } });
  return NextResponse.json({ automation });
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
  const result = await prisma.whatsappAutomation.deleteMany({
    where: { id, sellerId: auth.ctx.sellerId },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
