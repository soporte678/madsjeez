import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { testOllamaConnection } from "@/lib/ai/aiService";
import { resolveWhatsappAiProvider } from "@/lib/whatsapp-bot/ai-provider";
import { getWhatsappBotEnv } from "@/lib/whatsapp-bot/config";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const config = await prisma.sellerBotConfig.findUnique({
    where: { sellerId: auth.ctx.sellerId },
  });

  if (!config?.enabled) {
    // Permitir probar Ollama aunque el bot esté apagado
  }

  const { ollamaModel, ollamaBase } = getWhatsappBotEnv();
  const provider = resolveWhatsappAiProvider();

  if (!ollamaModel) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_model",
        message: "Falta configurar OLLAMA_MODEL",
      },
      { status: 400 }
    );
  }

  const result = await testOllamaConnection();

  return NextResponse.json({
    ...result,
    activeProvider: provider,
    configuredModel: ollamaModel,
    configuredBaseUrl: ollamaBase,
  });
}
