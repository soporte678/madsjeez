import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { checkEvolutionApiHealth } from "@/lib/whatsapp-bot/evolution-health";
import { isGeminiConfigured } from "@/lib/whatsapp-bot/gemini-reply";
import { getWhatsappBotEnv } from "@/lib/whatsapp-bot/config";
import { resolveWhatsappAiProvider } from "@/lib/whatsapp-bot/ai-provider";
import { checkOllamaHealth, describeOllamaConfigIssue, isOllamaConfiguredForApp } from "@/lib/whatsapp-bot/ollama-client";
export async function GET() {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const evolution = await checkEvolutionApiHealth();
  const geminiConfigured = isGeminiConfigured();
  const { ollamaModel, ollamaBase } = getWhatsappBotEnv();
  const primary = resolveWhatsappAiProvider();
  const ollama = await checkOllamaHealth();
  const ollamaConfigIssue = describeOllamaConfigIssue();

  return NextResponse.json({
    evolution,
    ai: {
      geminiConfigured,
      ollamaOk: ollama.ok && isOllamaConfiguredForApp(),
      ollamaReachable: ollama.ok,
      ollamaModel,
      ollamaBaseUrl: ollamaBase,
      ollamaConfigIssue,
      ollamaModelCount: ollama.models?.length ?? 0,
      primary,
      providerEnv: process.env.WHATSAPP_AI_PROVIDER?.trim() || "auto",
    },
  });}
