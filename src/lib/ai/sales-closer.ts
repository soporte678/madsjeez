import type { WhatsappLeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scoreLeadFromMessage } from "@/lib/whatsapp-bot/lead-scoring-service";
import { requestHumanHandoff } from "@/lib/whatsapp-bot/human-handoff-service";
import { getWhatsAppProvider } from "@/lib/whatsapp-bot/providers/evolution-provider";
import { saveOutboundMessage } from "@/lib/whatsapp-bot/message-service";
import { ollamaChatJson } from "@/lib/ai/ollama-json";
import { buildCloserSystemPrompt, CLOSER_JSON_RETRY_USER } from "@/lib/ai/prompts/closer-system";
import { detectIntencion, detectObjecion } from "@/lib/ai/prompts/closer-router";
import {
  buildSalesCloserContext,
  formatClientBlock,
  formatHistoryBlock,
} from "@/lib/ai/sales-closer-context";
import type {
  SalesCloserInput,
  SalesCloserOutput,
} from "@/lib/ai/sales-closer-types";
import { normalizeBusinessProfile } from "@/lib/ai/prompts/closer-router";

const VALID_STAGES = new Set<string>([
  "new",
  "warm",
  "hot",
  "customer",
  "closed",
  "lost",
]);

function parseCloserOutput(
  parsed: unknown,
  fallbackRubro: string,
  fallbackIntent: string,
  currentStage: WhatsappLeadStatus
): SalesCloserOutput {
  const o = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  const etapa =
    typeof o.etapa_lead === "string" && VALID_STAGES.has(o.etapa_lead)
      ? o.etapa_lead
      : currentStage;
  const respuesta =
    typeof o.respuesta_cliente === "string" ? o.respuesta_cliente.trim() : "";
  return {
    rubro: typeof o.rubro === "string" ? o.rubro : fallbackRubro,
    intencion: typeof o.intencion === "string" ? o.intencion : fallbackIntent,
    etapa_lead: etapa,
    objecion: typeof o.objecion === "string" ? o.objecion : detectObjecion(fallbackIntent),
    dato_faltante: typeof o.dato_faltante === "string" ? o.dato_faltante : "",
    accion_recomendada:
      typeof o.accion_recomendada === "string" ? o.accion_recomendada : "calificar",
    derivar_humano: Boolean(o.derivar_humano),
    respuesta_cliente: respuesta,
    etiquetas: Array.isArray(o.etiquetas)
      ? o.etiquetas.map(String).slice(0, 12)
      : [],
  };
}

function ruleBasedFallback(params: {
  ctx: Awaited<ReturnType<typeof buildSalesCloserContext>>;
  message: string;
}): SalesCloserOutput {
  const intent = detectIntencion(params.message);
  const rubro = params.ctx.businessProfile;
  const stage = scoreLeadFromMessage(params.message, params.ctx.lead.status);
  const derivar =
    intent === "reclamo" ||
    intent === "pedido_humano" ||
    /humano|persona|vendedor/.test(params.message.toLowerCase());

  const botName = params.ctx.botDisplayName?.trim();
  let respuesta = botName
    ? `Hola, soy ${botName}. Gracias por escribir. Contame qué necesitás y te ayudo a cerrar la compra.`
    : "Gracias por escribir. Contame qué necesitás y te ayudo a cerrar la compra.";
  if (intent === "objecion_precio") {
    respuesta =
      "Entiendo la duda de precio. Revisemos el producto exacto del catálogo y te confirmo valor y stock real. ¿Qué modelo o medida buscás?";
  } else if (intent === "compra" || stage === "hot") {
    respuesta = "¡Genial! ¿Confirmamos cantidad y si preferís retiro o envío a tu CP?";
  } else if (["servicios_web", "apps", "automatizaciones"].includes(rubro)) {
    respuesta =
      "Para darte un presupuesto serio necesito entender tu objetivo y alcance. ¿Qué querés lograr con el proyecto y para cuándo lo necesitás?";
  }

  return {
    rubro,
    intencion: intent,
    etapa_lead: stage,
    objecion: detectObjecion(intent),
    dato_faltante: "",
    accion_recomendada: derivar ? "derivar" : "calificar",
    derivar_humano: derivar,
    respuesta_cliente: respuesta,
    etiquetas: [rubro, intent].filter(Boolean),
    usedAi: false,
  };
}

async function persistCloserDecision(params: {
  sellerId: string;
  leadId: string;
  conversationId: string | null;
  channel: string;
  businessProfile: string;
  output: SalesCloserOutput;
  model?: string;
  rawJson?: unknown;
}) {
  const { output } = params;
  const newTags = Array.from(
    new Set([...(output.etiquetas ?? []), output.rubro, output.intencion].filter(Boolean))
  ).slice(0, 16);

  const stageUpdate = VALID_STAGES.has(output.etapa_lead)
    ? (output.etapa_lead as WhatsappLeadStatus)
    : undefined;

  const existing = await prisma.whatsappLead.findUnique({
    where: { id: params.leadId },
    select: { tags: true },
  });
  const mergedTags = Array.from(
    new Set([...(existing?.tags ?? []), ...newTags])
  ).slice(0, 20);

  await prisma.whatsappLead.update({
    where: { id: params.leadId },
    data: {
      intent: output.intencion,
      rubro: output.rubro,
      objecion: output.objecion || null,
      datoFaltante: output.dato_faltante || null,
      businessProfile: params.businessProfile,
      ...(stageUpdate ? { status: stageUpdate } : {}),
      tags: mergedTags,
      lastMessageAt: new Date(),
    },
  });

  await prisma.whatsappCloserDecision.create({
    data: {
      sellerId: params.sellerId,
      leadId: params.leadId,
      conversationId: params.conversationId,
      channel: params.channel,
      businessProfile: params.businessProfile,
      rubro: output.rubro,
      intencion: output.intencion,
      etapaLead: output.etapa_lead,
      objecion: output.objecion || null,
      datoFaltante: output.dato_faltante || null,
      accionRecomendada: output.accion_recomendada,
      derivarHumano: output.derivar_humano,
      respuestaCliente: output.respuesta_cliente,
      etiquetas: output.etiquetas,
      modelUsed: params.model ?? null,
      rawJson: params.rawJson as object | undefined,
    },
  });

  await prisma.whatsappBotEvent.create({
    data: {
      sellerId: params.sellerId,
      conversationId: params.conversationId,
      type: "sales_closer_decision",
      payload: {
        rubro: output.rubro,
        intencion: output.intencion,
        etapa_lead: output.etapa_lead,
        objecion: output.objecion,
        derivar_humano: output.derivar_humano,
        accion: output.accion_recomendada,
      },
    },
  });
}

/** Marca venta ganada/perdida y alimenta aprendizaje sin fine-tuning */
export async function recordLeadSaleOutcome(params: {
  sellerId: string;
  leadId: string;
  outcome: "won" | "lost";
  lossReason?: string;
  winningResponseText?: string;
  customerSnippet?: string;
}) {
  const lead = await prisma.whatsappLead.findFirst({
    where: { id: params.leadId, sellerId: params.sellerId },
  });
  if (!lead) throw new Error("lead_not_found");

  const status: WhatsappLeadStatus = params.outcome === "won" ? "closed" : "lost";

  await prisma.whatsappLead.update({
    where: { id: lead.id },
    data: {
      saleOutcome: params.outcome,
      status,
      lossReason: params.outcome === "lost" ? params.lossReason?.slice(0, 500) ?? null : null,
    },
  });

  if (params.outcome === "won" && params.winningResponseText?.trim()) {
    await prisma.whatsappWinningResponse.create({
      data: {
        sellerId: params.sellerId,
        leadId: lead.id,
        rubro: lead.rubro ?? "general",
        intencion: lead.intent,
        objecion: lead.objecion,
        customerSnippet: params.customerSnippet?.slice(0, 400),
        winningResponse: params.winningResponseText.slice(0, 2000),
        tags: lead.tags ?? [],
      },
    });
  }

  if (params.outcome === "lost") {
    await prisma.whatsappBotEvent.create({
      data: {
        sellerId: params.sellerId,
        type: "sale_lost",
        payload: {
          leadId: lead.id,
          lossReason: params.lossReason,
          objecion: lead.objecion,
          rubro: lead.rubro,
        },
      },
    });
  }
}

/**
 * Motor principal Super Closer: contexto DB → prompt dinámico → Ollama JSON → persistencia.
 */
export async function runSalesCloser(input: SalesCloserInput): Promise<SalesCloserOutput> {
  const channel = input.channel ?? "whatsapp";
  const profile = normalizeBusinessProfile(input.businessProfile);

  const ctx = await buildSalesCloserContext({
    sellerId: input.sellerId,
    conversationId: input.conversationId,
    customerId: input.customerId,
    message: input.message,
    channel,
    businessProfile: profile,
  });

  const fallbackIntent = detectIntencion(input.message);
  let output: SalesCloserOutput;
  let model: string | undefined;
  let rawJson: unknown;

  const system = buildCloserSystemPrompt({
    rubro: ctx.businessProfile,
    channel,
    storeContextBlock: ctx.storeContextBlock,
    catalogBlock: ctx.catalogBlock,
    winningExamplesBlock: ctx.winningExamplesBlock,
    clientBlock: formatClientBlock(ctx),
    historyBlock: formatHistoryBlock(ctx),
    customInstructions: ctx.customInstructions,
    botDisplayName: ctx.botDisplayName,
  });

  try {
    const { parsed, model: m, raw } = await ollamaChatJson({
      messages: [
        { role: "system", content: system },
        ...ctx.recentMessages,
        { role: "user", content: input.message },
      ],
      retryUserMessage: CLOSER_JSON_RETRY_USER,
    });
    model = m;
    rawJson = parsed;
    output = parseCloserOutput(parsed, ctx.businessProfile, fallbackIntent, ctx.lead.status);
    output.usedAi = true;
    output.model = model;
    if (!output.respuesta_cliente) {
      output.respuesta_cliente = ruleBasedFallback({ ctx, message: input.message }).respuesta_cliente;
    }
  } catch (e) {
    output = ruleBasedFallback({ ctx, message: input.message });
    output.aiError = e instanceof Error ? e.message : "sales_closer_failed";
  }

  if (!output.etiquetas.length) {
    output.etiquetas = [output.rubro, output.intencion].filter(Boolean);
  }

  if (input.sendReply && output.respuesta_cliente && ctx.conversationId) {
    const session = await prisma.whatsappSession.findUnique({
      where: { sellerId: input.sellerId },
    });
    if (session?.status === "connected" && session.providerInstanceId) {
      const provider = getWhatsAppProvider();
      await provider.sendMessage(
        session.providerInstanceId,
        ctx.lead.phone,
        output.respuesta_cliente
      );
      await saveOutboundMessage(ctx.conversationId, output.respuesta_cliente, "bot");
      await prisma.whatsappConversation.update({
        where: { id: ctx.conversationId },
        data: { botMessageCount: { increment: 1 } },
      });
      console.info("[whatsapp-bot] closer reply sent", {
        sellerId: input.sellerId,
        conversationId: ctx.conversationId,
        usedAi: output.usedAi,
        aiError: output.aiError,
      });
    } else {
      console.warn("[whatsapp-bot] closer reply skipped — session not connected", {
        sellerId: input.sellerId,
        sessionStatus: session?.status,
      });
    }
  }

  if (output.derivar_humano && ctx.conversationId) {
    const botConfig = await prisma.sellerBotConfig.findUnique({
      where: { sellerId: input.sellerId },
    });
    if (botConfig?.humanHandoffEnabled !== false) {
      await requestHumanHandoff(ctx.conversationId, output.accion_recomendada || "closer_derivar", {
        notifySeller: true,
        phone: ctx.lead.phone,
      });
    }
  }

  try {
    await persistCloserDecision({
      sellerId: input.sellerId,
      leadId: ctx.leadId,
      conversationId: ctx.conversationId,
      channel,
      businessProfile: profile,
      output,
      model,
      rawJson,
    });
  } catch (e) {
    console.error(
      "[whatsapp-bot] closer persist failed (reply may have been sent)",
      e instanceof Error ? e.message : e
    );
  }

  return output;
}
