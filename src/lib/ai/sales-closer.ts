import type { WhatsappLeadStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { scoreLeadFromMessage } from "@/lib/whatsapp-bot/lead-scoring-service";

import { requestHumanHandoff } from "@/lib/whatsapp-bot/human-handoff-service";

import { getWhatsAppProvider } from "@/lib/whatsapp-bot/providers/evolution-provider";

import { saveOutboundMessage } from "@/lib/whatsapp-bot/message-service";

import { chatOllama } from "@/lib/ai/ollama-client";

import { extractJsonObject } from "@/lib/ai/ollama-json";

import { logAiMessage } from "@/lib/ai/ai-message-log";

import {

  classifyMessage,

  parseCloserRoutedOutput,

  parseMarketplaceOutput,

  selectModelForMessage,

  shouldEscalateTo14B,

  type ClassifierOutput,

  type ModelSelection,

} from "@/lib/ai/model-router";

import {

  buildCloserRoutedSystemPrompt,

  CLOSER_ROUTED_RETRY_USER,

} from "@/lib/ai/prompts/closer";

import {

  buildMarketplaceSystemPrompt,

  MARKETPLACE_RETRY_USER,

} from "@/lib/ai/prompts/marketplace";

import { detectIntencion, detectObjecion } from "@/lib/ai/prompts/closer-router";

import {

  buildSalesCloserContext,

  formatClientBlock,

  formatHistoryBlock,

} from "@/lib/ai/sales-closer-context";

import {

  getModelRouterEnv,

  MANDATORY_FALLBACK_MESSAGE,

} from "@/lib/ai/sales-closer-env";

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



export type GenerateSalesReplyMeta = {
  modelReason?: string;
  confidence?: number;
  latencyMs?: number;
  escalatedTo14b?: boolean;
  fallbackUsed?: boolean;
  classifier?: ClassifierOutput | null;
  rawJson?: unknown;
};

export type GenerateSalesReplyResult = SalesCloserOutput & GenerateSalesReplyMeta;



function ruleBasedFallback(params: {

  ctx: Awaited<ReturnType<typeof buildSalesCloserContext>>;

  message: string;

  useMandatory?: boolean;

}): SalesCloserOutput {

  if (params.useMandatory) {

    return {

      rubro: params.ctx.businessProfile,

      intencion: detectIntencion(params.message),

      etapa_lead: params.ctx.lead.status,

      objecion: "",

      dato_faltante: "",

      accion_recomendada: "derivar",

      derivar_humano: true,

      respuesta_cliente: MANDATORY_FALLBACK_MESSAGE,

      etiquetas: ["fallback"],

      usedAi: false,

    };

  }



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



function closerOutputFromParsed(

  parsed: ReturnType<typeof parseCloserRoutedOutput>,

  currentStage: WhatsappLeadStatus

): SalesCloserOutput {

  const etapa =

    typeof parsed.etapa_lead === "string" && VALID_STAGES.has(parsed.etapa_lead)

      ? parsed.etapa_lead

      : currentStage;

  return {

    rubro: parsed.rubro,

    intencion: parsed.intencion,

    etapa_lead: etapa,

    objecion: parsed.objecion || detectObjecion(parsed.intencion),

    dato_faltante: parsed.dato_faltante,

    accion_recomendada: parsed.accion_recomendada,

    derivar_humano: parsed.derivar_humano,

    respuesta_cliente: parsed.respuesta_cliente,

    etiquetas: parsed.etiquetas,

  };

}



async function callMarketplaceModel(params: {

  ctx: Awaited<ReturnType<typeof buildSalesCloserContext>>;

  message: string;

  selection: ModelSelection;

}): Promise<{

  output: ReturnType<typeof parseMarketplaceOutput>;

  model: string;

  latencyMs: number;

  rawJson: unknown;

}> {

  const system = buildMarketplaceSystemPrompt({

    storeContextBlock: params.ctx.storeContextBlock,

    catalogBlock: params.ctx.catalogBlock,

    clientBlock: formatClientBlock(params.ctx),

    historyBlock: formatHistoryBlock(params.ctx),

    customInstructions: params.ctx.customInstructions,

    botDisplayName: params.ctx.botDisplayName,

  });



  const run = async (extra?: { role: "user"; content: string }[]) => {

    const messages = [

      { role: "system" as const, content: system },

      ...params.ctx.recentMessages,

      { role: "user" as const, content: params.message },

      ...(extra ?? []),

    ];

    return chatOllama({

      model: params.selection.model,

      tier: "marketplace",

      format: "json",

      messages,

    });

  };



  let result = await run();

  let parsed = extractJsonObject(result.raw);

  if (!parsed) {

    result = await run([

      { role: "user", content: MARKETPLACE_RETRY_USER },

    ]);

    parsed = extractJsonObject(result.raw);

  }

  if (!parsed) throw new Error("ollama_invalid_json");



  return {

    output: parseMarketplaceOutput(parsed),

    model: result.model,

    latencyMs: result.latencyMs,

    rawJson: parsed,

  };

}



async function callCloserModel(params: {

  ctx: Awaited<ReturnType<typeof buildSalesCloserContext>>;

  message: string;

  selection: ModelSelection;

  channel: string;

}): Promise<{

  output: ReturnType<typeof parseCloserRoutedOutput>;

  model: string;

  latencyMs: number;

  rawJson: unknown;

}> {

  const system = buildCloserRoutedSystemPrompt({

    rubro: params.ctx.businessProfile,

    channel: params.channel,

    storeContextBlock: params.ctx.storeContextBlock,

    catalogBlock: params.ctx.catalogBlock,

    winningExamplesBlock: params.ctx.winningExamplesBlock,

    clientBlock: formatClientBlock(params.ctx),

    historyBlock: formatHistoryBlock(params.ctx),

    customInstructions: params.ctx.customInstructions,

    botDisplayName: params.ctx.botDisplayName,

  });



  const run = async (extra?: { role: "user"; content: string }[]) => {

    const messages = [

      { role: "system" as const, content: system },

      ...params.ctx.recentMessages,

      { role: "user" as const, content: params.message },

      ...(extra ?? []),

    ];

    return chatOllama({

      model: params.selection.model,

      tier: "closer",

      format: "json",

      messages,

    });

  };



  let result = await run();

  let parsed = extractJsonObject(result.raw);

  if (!parsed) {

    result = await run([{ role: "user", content: CLOSER_ROUTED_RETRY_USER }]);

    parsed = extractJsonObject(result.raw);

  }

  if (!parsed) throw new Error("ollama_invalid_json");



  const fallbackIntent = detectIntencion(params.message);

  return {

    output: parseCloserRoutedOutput(parsed, params.ctx.businessProfile, fallbackIntent),

    model: result.model,

    latencyMs: result.latencyMs,

    rawJson: parsed,

  };

}



/**

 * Genera respuesta comercial con enrutamiento multi-modelo (3B → 7B → 14B).

 * Siempre devuelve texto al cliente; usa fallback obligatorio si falla la IA.

 */

export async function generateSalesReply(params: {

  ctx: Awaited<ReturnType<typeof buildSalesCloserContext>>;

  message: string;

  channel: string;

  businessProfile: string;

}): Promise<GenerateSalesReplyResult> {

  const fallbackIntent = detectIntencion(params.message);

  const routerEnv = getModelRouterEnv();

  let classifier: ClassifierOutput | null = null;

  let selection: ModelSelection;

  let totalLatency = 0;

  let confidence: number | undefined;

  let escalatedTo14b = false;

  let model: string | undefined;

  let modelReason: string | undefined;

  let rawJson: unknown;

  let aiError: string | undefined;



  try {

    if (routerEnv.routerEnabled) {

      classifier = await classifyMessage(params.message);

      if (classifier) totalLatency += 0;

    }

    selection = selectModelForMessage({

      message: params.message,

      businessProfile: params.businessProfile,

      classifier: classifier ?? undefined,

    });

    modelReason = selection.reason;



    if (selection.tier === "closer") {

      const closer = await callCloserModel({

        ctx: params.ctx,

        message: params.message,

        selection,

        channel: params.channel,

      });

      totalLatency += closer.latencyMs;

      model = closer.model;

      rawJson = closer.rawJson;

      confidence = closer.output.confianza;

      const output = closerOutputFromParsed(closer.output, params.ctx.lead.status);

      output.usedAi = true;

      output.model = model;

      if (!output.respuesta_cliente) {

        const fb = ruleBasedFallback({ ctx: params.ctx, message: params.message });

        output.respuesta_cliente = fb.respuesta_cliente;

      }

      return {

        ...output,

        modelReason,

        confidence,

        latencyMs: totalLatency,

        escalatedTo14b: false,

        fallbackUsed: false,

        classifier,

      };

    }



    const marketplace = await callMarketplaceModel({

      ctx: params.ctx,

      message: params.message,

      selection,

    });

    totalLatency += marketplace.latencyMs;

    model = marketplace.model;

    rawJson = marketplace.rawJson;

    confidence = marketplace.output.confianza;



    const escalation = shouldEscalateTo14B({

      message: params.message,

      marketplace: marketplace.output,

    });



    if (escalation.escalate && routerEnv.escalateTo14B) {

      escalatedTo14b = true;

      const closerSelection: ModelSelection = {

        tier: "closer",

        model: routerEnv.closerModel,

        reason: escalation.reason,

        classifier: classifier ?? undefined,

      };

      const closer = await callCloserModel({

        ctx: params.ctx,

        message: params.message,

        selection: closerSelection,

        channel: params.channel,

      });

      totalLatency += closer.latencyMs;

      model = closer.model;

      rawJson = closer.rawJson;

      confidence = closer.output.confianza;

      modelReason = `${selection.reason} → ${escalation.reason}`;

      const output = closerOutputFromParsed(closer.output, params.ctx.lead.status);

      output.usedAi = true;

      output.model = model;

      if (!output.respuesta_cliente) {

        output.respuesta_cliente = marketplace.output.respuesta_cliente || MANDATORY_FALLBACK_MESSAGE;

      }

      return {

        ...output,

        modelReason,

        confidence,

        latencyMs: totalLatency,

        escalatedTo14b: true,

        fallbackUsed: false,

        classifier,

      };

    }



    const output: SalesCloserOutput = {

      rubro: params.ctx.businessProfile,

      intencion: classifier?.intencion ?? fallbackIntent,

      etapa_lead: VALID_STAGES.has(marketplace.output.etapa_lead)

        ? marketplace.output.etapa_lead

        : params.ctx.lead.status,

      objecion: detectObjecion(classifier?.intencion ?? fallbackIntent),

      dato_faltante: marketplace.output.dato_faltante,

      accion_recomendada: marketplace.output.accion_recomendada,

      derivar_humano: marketplace.output.accion_recomendada === "derivar",

      respuesta_cliente:

        marketplace.output.respuesta_cliente ||

        ruleBasedFallback({ ctx: params.ctx, message: params.message }).respuesta_cliente,

      etiquetas: marketplace.output.etiquetas.length

        ? marketplace.output.etiquetas

        : [params.ctx.businessProfile, fallbackIntent],

      usedAi: true,

      model,

    };



    return {

      ...output,

      modelReason,

      confidence,

      latencyMs: totalLatency,

      escalatedTo14b: false,

      fallbackUsed: false,

      classifier,

    };

  } catch (e) {

    aiError = e instanceof Error ? e.message : "sales_closer_failed";

    const output = ruleBasedFallback({

      ctx: params.ctx,

      message: params.message,

      useMandatory: true,

    });

    return {

      ...output,

      modelReason: modelReason ?? "error_fallback",

      confidence: 0,

      latencyMs: totalLatency,

      escalatedTo14b,

      fallbackUsed: true,

      aiError,

      classifier,

      rawJson,

    } as GenerateSalesReplyResult;

  }

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

 * Motor principal Super Closer: contexto DB → router multi-modelo → persistencia.

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



  const result = await generateSalesReply({

    ctx,

    message: input.message,

    channel,

    businessProfile: profile,

  });



  if (!result.respuesta_cliente) {

    result.respuesta_cliente = MANDATORY_FALLBACK_MESSAGE;

    result.fallbackUsed = true;

  }



  if (!result.etiquetas.length) {

    result.etiquetas = [result.rubro, result.intencion].filter(Boolean);

  }



  await logAiMessage({

    conversationId: ctx.conversationId,

    customerId: ctx.leadId,

    channel,

    incomingMessage: input.message,

    selectedModel: result.model,

    modelReason: result.modelReason,

    confidence: result.confidence,

    latencyMs: result.latencyMs,

    escalatedTo14b: result.escalatedTo14b,

    detectedRubro: result.rubro,

    detectedIntent: result.intencion,

    detectedStage: result.etapa_lead,

    objection: result.objecion,

    reply: result.respuesta_cliente,

    fallbackUsed: result.fallbackUsed,

    errorMessage: result.aiError,

  });



  if (input.sendReply && result.respuesta_cliente && ctx.conversationId) {

    const session = await prisma.whatsappSession.findUnique({

      where: { sellerId: input.sellerId },

    });

    if (session?.status === "connected" && session.providerInstanceId) {

      const provider = getWhatsAppProvider();

      await provider.sendMessage(

        session.providerInstanceId,

        ctx.lead.phone,

        result.respuesta_cliente

      );

      await saveOutboundMessage(ctx.conversationId, result.respuesta_cliente, "bot");

      await prisma.whatsappConversation.update({

        where: { id: ctx.conversationId },

        data: { botMessageCount: { increment: 1 } },

      });

      console.info("[whatsapp-bot] closer reply sent", {

        sellerId: input.sellerId,

        conversationId: ctx.conversationId,

        usedAi: result.usedAi,

        model: result.model,

        escalated: result.escalatedTo14b,

        aiError: result.aiError,

      });

    } else {

      console.warn("[whatsapp-bot] closer reply skipped — session not connected", {

        sellerId: input.sellerId,

        sessionStatus: session?.status,

      });

    }

  }



  if (result.derivar_humano && ctx.conversationId) {

    const botConfig = await prisma.sellerBotConfig.findUnique({

      where: { sellerId: input.sellerId },

    });

    if (botConfig?.humanHandoffEnabled !== false) {

      await requestHumanHandoff(ctx.conversationId, result.accion_recomendada || "closer_derivar", {

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

      output: result,

      model: result.model,

    });

  } catch (e) {

    console.error(

      "[whatsapp-bot] closer persist failed (reply may have been sent)",

      e instanceof Error ? e.message : e

    );

  }



  return result;

}



export { MANDATORY_FALLBACK_MESSAGE };


