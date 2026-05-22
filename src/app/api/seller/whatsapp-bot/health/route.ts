import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { checkEvolutionApiHealth } from "@/lib/whatsapp-bot/evolution-health";
import { isGeminiConfigured } from "@/lib/whatsapp-bot/gemini-reply";
import { getWhatsappBotEnv } from "@/lib/whatsapp-bot/config";

export async function GET() {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const evolution = await checkEvolutionApiHealth();
  const geminiConfigured = isGeminiConfigured();
  const { ollamaConfigured } = getWhatsappBotEnv();

  return NextResponse.json({
    evolution,
    ai: {
      geminiConfigured,
      ollamaConfigured,
      primary: geminiConfigured ? "gemini" : ollamaConfigured ? "ollama" : "rules",
    },
  });
}
