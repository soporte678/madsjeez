import { prisma } from "@/lib/prisma";

export type MetricsPeriod = "today" | "7d" | "30d";

function periodStart(period: MetricsPeriod): Date {
  const now = new Date();
  if (period === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const days = period === "7d" ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export async function getWhatsappMetrics(sellerId: string, period: MetricsPeriod = "7d") {
  const since = periodStart(period);
  const todayStart = periodStart("today");

  const [leads, conversations, messages, automations, campaigns] = await Promise.all([
    prisma.whatsappLead.findMany({
      where: { sellerId },
      select: { status: true, createdAt: true, lastMessageAt: true },
    }),
    prisma.whatsappConversation.findMany({
      where: { sellerId },
      select: { status: true, createdAt: true, lastMessageAt: true },
    }),
    prisma.whatsappMessage.findMany({
      where: {
        conversation: { sellerId },
        createdAt: { gte: since },
      },
      select: { direction: true, senderType: true, createdAt: true },
    }),
    prisma.whatsappAutomation.count({ where: { sellerId, enabled: true } }),
    prisma.whatsappCampaign.findMany({
      where: { sellerId },
      select: { status: true, sentCount: true, repliedCount: true },
    }),
  ]);

  const leadsToday = leads.filter(
    (l) => l.createdAt >= todayStart || (l.lastMessageAt && l.lastMessageAt >= todayStart)
  ).length;

  const openChats = conversations.filter(
    (c) => c.status === "bot_active" || c.status === "human_active"
  ).length;

  const inbound = messages.filter((m) => m.direction === "inbound").length;
  const outbound = messages.filter((m) => m.direction === "outbound").length;
  const aiReplies = messages.filter(
    (m) => m.direction === "outbound" && m.senderType === "bot"
  ).length;
  const humanReplies = messages.filter(
    (m) => m.direction === "outbound" && m.senderType === "seller"
  ).length;

  const byStage = leads.reduce(
    (acc, l) => {
      acc[l.status] = (acc[l.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const customers = byStage.customer ?? 0;
  const conversionPct = leads.length > 0 ? Math.round((customers / leads.length) * 100) : 0;

  const handoffs = await prisma.whatsappHumanHandoff.count({
    where: {
      conversation: { sellerId },
      createdAt: { gte: since },
    },
  });

  const leadsByDay: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const count = leads.filter((l) => l.createdAt >= d && l.createdAt < next).length;
    leadsByDay.push({
      date: d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric" }),
      count,
    });
  }

  return {
    period,
    leadsToday,
    openChats,
    totalLeads: leads.length,
    totalConversations: conversations.length,
    messagesInbound: inbound,
    messagesOutbound: outbound,
    aiReplies,
    humanReplies,
    handoffs,
    conversionPct,
    byStage,
    automationsEnabled: automations,
    campaignsActive: campaigns.filter((c) => c.status === "running").length,
    campaignsSent: campaigns.reduce((s, c) => s + c.sentCount, 0),
    leadsByDay,
  };
}
