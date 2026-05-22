import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { generateBotReply } from "@/lib/whatsapp-bot/ai-response-service";
import { resolveWhatsappAiProvider } from "@/lib/whatsapp-bot/ai-provider";
import { buildStoreContext } from "@/lib/whatsapp-bot/seller-knowledge-service";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const provider = resolveWhatsappAiProvider();
  const appBase =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://www.madsjeez.com.ar";

  try {
    const [storeContext, botConfig] = await Promise.all([
      buildStoreContext(auth.ctx.sellerId, "consulta de prueba envío", appBase),
      prisma.sellerBotConfig.findUnique({ where: { sellerId: auth.ctx.sellerId } }),
    ]);

    const result = await generateBotReply({
      customerMessage: "Hola, ¿cuánto sale el envío a CABA?",
      storeContext,
      tone: botConfig?.tone ?? "cercano",
      customInstructions: botConfig?.customInstructions,
    });

    return NextResponse.json({
      ok: true,
      provider,
      usedAi: result.usedAi,
      reply: result.text.slice(0, 500),
      aiError: result.aiError,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ai_test_failed";
    return NextResponse.json(
      {
        ok: false,
        provider,
        error: msg,
        message:
          "No se pudo generar respuesta de prueba. Revisá GEMINI_API_KEY u Ollama local.",
      },
      { status: 503 }
    );
  }
}
