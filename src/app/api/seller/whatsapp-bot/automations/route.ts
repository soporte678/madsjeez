import { NextRequest, NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const automations = await prisma.whatsappAutomation.findMany({
    where: { sellerId: auth.ctx.sellerId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ automations });
}

export async function POST(req: NextRequest) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  const automation = await prisma.whatsappAutomation.create({
    data: {
      sellerId: auth.ctx.sellerId,
      name,
      triggerType: String(body.triggerType ?? "new_message"),
      triggerConfig: body.triggerConfig ?? {},
      actionType: String(body.actionType ?? "send_message"),
      actionConfig: body.actionConfig ?? { message: "¡Hola! ¿En qué te puedo ayudar?" },
      enabled: body.enabled !== false,
    },
  });

  return NextResponse.json({ automation }, { status: 201 });
}
