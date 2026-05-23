import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { generateBotReply as generateAiBotReply } from "@/lib/ai/aiService";
import { searchCatalogBeforeReply } from "@/lib/ai/aiService";
import { resolveWhatsappAiProvider } from "@/lib/whatsapp-bot/ai-provider";
import { formatStoreContextForPrompt, buildStoreContext } from "@/lib/whatsapp-bot/seller-knowledge-service";
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

    const catalogMatches = await searchCatalogBeforeReply(
      auth.ctx.sellerId,
      "envío CABA",
      appBase
    );

    const result = await generateAiBotReply({
      contact: {
        id: "test",
        phone: "0000000000",
        status: "warm",
      },
      conversation: {
        id: "test",
        status: "bot_active",
        botMessageCount: 0,
      },
      recentMessages: [],
      customerMessage: "Hola, ¿cuánto sale el envío a CABA?",
      catalogMatches: catalogMatches.map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        stock: p.stock,
        productUrl: p.productUrl,
      })),
      botSettings: {
        enabled: true,
        tone: botConfig?.tone ?? "cercano",
        botDisplayName: botConfig?.botDisplayName,
        customInstructions: botConfig?.customInstructions,
        humanHandoffEnabled: true,
        maxAutoMessagesBeforeHandoff: botConfig?.maxAutoMessagesBeforeHandoff ?? 12,
      },
      storeContextBlock: formatStoreContextForPrompt(storeContext),
    });

    return NextResponse.json({
      ok: Boolean(result.text),
      provider,
      usedAi: result.usedAi,
      aiProvider: result.aiProvider,
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
          provider === "ollama"
            ? "No se pudo probar Ollama. Verificá que esté corriendo (ollama serve) y OLLAMA_BASE_URL / OLLAMA_MODEL."
            : "No se pudo generar respuesta de prueba. Revisá la configuración del motor IA.",
      },
      { status: 503 }
    );
  }
}
