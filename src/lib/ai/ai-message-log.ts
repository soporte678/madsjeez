import { prisma } from "@/lib/prisma";

export type AiMessageLogInput = {
  conversationId?: string | null;
  customerId?: string | null;
  channel: string;
  incomingMessage: string;
  selectedModel?: string | null;
  modelReason?: string | null;
  confidence?: number | null;
  latencyMs?: number | null;
  escalatedTo14b?: boolean;
  detectedRubro?: string | null;
  detectedIntent?: string | null;
  detectedStage?: string | null;
  objection?: string | null;
  reply?: string | null;
  fallbackUsed?: boolean;
  errorMessage?: string | null;
};

export async function logAiMessage(input: AiMessageLogInput): Promise<void> {
  try {
    await prisma.aiMessageLog.create({
      data: {
        conversationId: input.conversationId ?? null,
        customerId: input.customerId ?? null,
        channel: input.channel,
        incomingMessage: input.incomingMessage.slice(0, 4000),
        selectedModel: input.selectedModel ?? null,
        modelReason: input.modelReason ?? null,
        confidence: input.confidence ?? null,
        latencyMs: input.latencyMs ?? null,
        escalatedTo14b: input.escalatedTo14b ?? false,
        detectedRubro: input.detectedRubro ?? null,
        detectedIntent: input.detectedIntent ?? null,
        detectedStage: input.detectedStage ?? null,
        objection: input.objection ?? null,
        reply: input.reply?.slice(0, 4000) ?? null,
        fallbackUsed: input.fallbackUsed ?? false,
        errorMessage: input.errorMessage?.slice(0, 1000) ?? null,
      },
    });
  } catch (e) {
    console.error(
      "[ai-router] log failed",
      e instanceof Error ? e.message : e
    );
  }
}
