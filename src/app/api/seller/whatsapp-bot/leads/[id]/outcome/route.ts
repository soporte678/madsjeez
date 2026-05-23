import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { recordLeadSaleOutcome } from "@/lib/ai/sales-closer";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

/** Marca lead como venta ganada o perdida y registra aprendizaje (winning_response / loss). */
export async function POST(req: Request, { params }: Params) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id: leadId } = await params;
  const body = await req.json().catch(() => ({}));
  const outcome = body.outcome === "won" || body.outcome === "lost" ? body.outcome : null;
  if (!outcome) {
    return NextResponse.json({ error: "invalid_outcome" }, { status: 400 });
  }

  const lead = await prisma.whatsappLead.findFirst({
    where: { id: leadId, sellerId: auth.ctx.sellerId },
    include: {
      conversations: {
        orderBy: { lastMessageAt: "desc" },
        take: 1,
        include: {
          messages: {
            where: { direction: "outbound", senderType: "bot" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "lead_not_found" }, { status: 404 });
  }

  const lastBotMsg = lead.conversations[0]?.messages[0]?.content;
  const lastInbound = await prisma.whatsappMessage.findFirst({
    where: {
      conversation: { leadId: lead.id },
      direction: "inbound",
    },
    orderBy: { createdAt: "desc" },
  });

  try {
    await recordLeadSaleOutcome({
      sellerId: auth.ctx.sellerId,
      leadId: lead.id,
      outcome,
      lossReason: typeof body.lossReason === "string" ? body.lossReason : undefined,
      winningResponseText:
        typeof body.winningResponse === "string"
          ? body.winningResponse
          : outcome === "won"
            ? lastBotMsg
            : undefined,
      customerSnippet: lastInbound?.content?.slice(0, 400),
    });

    const updated = await prisma.whatsappLead.findUnique({ where: { id: lead.id } });
    return NextResponse.json({ ok: true, lead: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "outcome_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
