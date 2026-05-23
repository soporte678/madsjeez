import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { warmupOllamaModels } from "@/lib/ai/ollama-client";
import { getModelRouterEnv } from "@/lib/ai/sales-closer-env";

export async function POST(req: NextRequest) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const force = body.force === true;

  const router = getModelRouterEnv();
  if (!router.preloadModels && !force) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "AI_PRELOAD_MODELS=false",
    });
  }

  const results = await warmupOllamaModels();
  const ok = results.every((r) => r.ok);

  return NextResponse.json({
    ok,
    results,
    primaryModel: router.marketplaceModel,
    timestamp: new Date().toISOString(),
  });
}

export async function GET() {
  const router = getModelRouterEnv();
  return NextResponse.json({
    endpoint: "/api/ai/warmup",
    method: "POST",
    description: "Precarga modelos Ollama (7B prioritario). Requiere sesión vendedor.",
    warmupIntervalMinutes: router.warmupIntervalMinutes,
    preloadEnabled: router.preloadModels,
  });
}
