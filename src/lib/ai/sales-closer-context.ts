import { prisma } from "@/lib/prisma";
import { formatStoreContextForPrompt, buildStoreContext } from "@/lib/whatsapp-bot/seller-knowledge-service";
import { getSalesCloserEnv } from "@/lib/ai/sales-closer-env";
import { detectRubro, normalizeBusinessProfile } from "@/lib/ai/prompts/closer-router";
import type {
  BusinessProfileId,
  SalesCloserChannel,
  SalesCloserContext,
} from "@/lib/ai/sales-closer-types";

function buildCatalogBlock(fullCatalogBlock: string, relevantBlock: string): string {
  return [fullCatalogBlock, relevantBlock].filter(Boolean).join("\n\n");
}

export async function loadWinningExamplesBlock(params: {
  sellerId: string;
  rubro: string;
  intencion?: string;
  limit?: number;
}): Promise<string> {
  const rows = await prisma.whatsappWinningResponse.findMany({
    where: {
      sellerId: params.sellerId,
      rubro: params.rubro,
    },
    orderBy: [{ useCount: "desc" }, { createdAt: "desc" }],
    take: params.limit ?? 3,
  });

  if (!rows.length) {
    return "RESPUESTAS GANADORAS PREVIAS: ninguna registrada aún para este rubro.";
  }

  await prisma.whatsappWinningResponse.updateMany({
    where: { id: { in: rows.map((r) => r.id) } },
    data: { useCount: { increment: 1 } },
  });

  const lines = rows.map(
    (r, i) =>
      `${i + 1}. [${r.intencion ?? "consulta"}${r.objecion ? ` / obj:${r.objecion}` : ""}] Cliente: "${(r.customerSnippet ?? "").slice(0, 80)}" → Respuesta exitosa: "${r.winningResponse.slice(0, 280)}"`
  );
  return `RESPUESTAS GANADORAS PREVIAS (inspirate en el estilo, no copies literal):\n${lines.join("\n")}`;
}

export async function buildSalesCloserContext(params: {
  sellerId: string;
  conversationId?: string;
  customerId?: string;
  message: string;
  channel: SalesCloserChannel;
  businessProfile?: string;
}): Promise<SalesCloserContext> {
  const { appBase } = getSalesCloserEnv();

  let lead = null;
  let conversation = null;

  if (params.conversationId) {
    conversation = await prisma.whatsappConversation.findFirst({
      where: { id: params.conversationId, sellerId: params.sellerId },
      include: { lead: true },
    });
    if (conversation) lead = conversation.lead;
  }

  if (!lead && params.customerId) {
    lead = await prisma.whatsappLead.findFirst({
      where: { id: params.customerId, sellerId: params.sellerId },
    });
    if (lead && !conversation) {
      conversation = await prisma.whatsappConversation.findFirst({
        where: { sellerId: params.sellerId, leadId: lead.id },
        orderBy: { lastMessageAt: "desc" },
      });
    }
  }

  if (!lead) {
    throw new Error("lead_not_found");
  }

  const botConfig = await prisma.sellerBotConfig.findUnique({
    where: { sellerId: params.sellerId },
  });

  const profileHint =
    params.businessProfile ||
    botConfig?.businessProfile ||
    lead.businessProfile ||
    "general";
  const businessProfile = normalizeBusinessProfile(profileHint);

  const storeContext = await buildStoreContext(params.sellerId, params.message, appBase);
  const rubroDetected = detectRubro({
    message: params.message,
    businessProfileHint: businessProfile,
    catalogTitles: storeContext.products.map((p) => p.title),
  });
  const winningExamplesBlock = await loadWinningExamplesBlock({
    sellerId: params.sellerId,
    rubro: rubroDetected,
    intencion: undefined,
  });

  const recentRows = conversation
    ? await prisma.whatsappMessage.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: "desc" },
        take: 12,
      })
    : [];

  const recentMessages = recentRows.reverse().map((m) => ({
    role: (m.direction === "inbound" ? "user" : "assistant") as "user" | "assistant",
    content: m.content.slice(0, 600),
  }));

  const clientName =
    lead.fullName?.trim() ||
    lead.pushName?.trim() ||
    lead.businessName?.trim() ||
    lead.name?.trim() ||
    lead.phone;

  return {
    sellerId: params.sellerId,
    leadId: lead.id,
    conversationId: conversation?.id ?? null,
    channel: params.channel,
    businessProfile: rubroDetected as BusinessProfileId,
    lead: {
      phone: lead.phone,
      status: lead.status,
      intent: lead.intent,
      rubro: lead.rubro,
      tags: lead.tags ?? [],
      internalNotes: lead.internalNotes,
      name: lead.name,
      pushName: lead.pushName,
      fullName: lead.fullName,
      businessName: lead.businessName,
    },
    recentMessages,
    catalogBlock: buildCatalogBlock(storeContext.fullCatalogBlock, storeContext.relevantCatalogBlock),
    storeContextBlock: formatStoreContextForPrompt(storeContext),
    winningExamplesBlock,
    customInstructions: botConfig?.customInstructions ?? null,
    botDisplayName: botConfig?.botDisplayName ?? null,
    botTone: botConfig?.tone ?? "cercano",
  };
}

export function formatClientBlock(ctx: SalesCloserContext): string {
  const l = ctx.lead;
  return [
    `Tel: ${l.phone}`,
    l.fullName || l.pushName || l.name ? `Nombre: ${l.fullName || l.pushName || l.name}` : "",
    `Etapa actual: ${l.status}`,
    l.intent ? `Intención previa: ${l.intent}` : "",
    l.rubro ? `Rubro previo: ${l.rubro}` : "",
    l.tags.length ? `Etiquetas: ${l.tags.join(", ")}` : "",
    l.internalNotes ? `Notas internas: ${l.internalNotes.slice(0, 400)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatHistoryBlock(ctx: SalesCloserContext): string {
  if (!ctx.recentMessages.length) return "(sin historial previo)";
  return ctx.recentMessages
    .map((m) => `${m.role === "user" ? "Cliente" : "Vendedor/Bot"}: ${m.content}`)
    .join("\n");
}
