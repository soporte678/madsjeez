import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { getWhatsappMetrics } from "@/lib/whatsapp-bot/metrics-service";
import { checkEvolutionApiHealth } from "@/lib/whatsapp-bot/evolution-health";
import { resolveWhatsappAiProvider } from "@/lib/whatsapp-bot/ai-provider";

export async function GET() {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [metrics, evolution] = await Promise.all([
    getWhatsappMetrics(auth.ctx.sellerId, "7d"),
    checkEvolutionApiHealth(),
  ]);

  const recent = await import("@/lib/prisma").then(({ prisma }) =>
    prisma.whatsappConversation.findMany({
      where: { sellerId: auth.ctx.sellerId },
      orderBy: { lastMessageAt: "desc" },
      take: 5,
      include: {
        lead: { select: { name: true, phone: true, status: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true } },
      },
    })
  );

  return NextResponse.json({
    metrics,
    evolution: { ok: evolution.ok, error: evolution.error },
    aiProvider: resolveWhatsappAiProvider(),
    recentConversations: recent.map((c) => ({
      id: c.id,
      phone: c.phone,
      name: c.lead.name,
      status: c.lead.status,
      conversationStatus: c.status,
      preview: c.messages[0]?.content?.slice(0, 80) ?? "",
      lastMessageAt: c.lastMessageAt,
    })),
    alerts: [
      !evolution.ok
        ? "Evolution API no responde. Revisá variables EVOLUTION_API_URL y EVOLUTION_API_KEY."
        : null,
      metrics.openChats > 20 ? "Muchos chats abiertos — considerá derivar a humano." : null,
      metrics.automationsEnabled === 0
        ? "No tenés automatizaciones activas."
        : null,
      metrics.campaignsActive > 0 ? "Hay campañas en ejecución." : null,
    ].filter(Boolean),
  });
}
