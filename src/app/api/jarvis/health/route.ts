import { NextRequest, NextResponse } from "next/server";
import { assertJarvisAuth } from "@/jarvis/api-auth";
import { runJarvisHealthCheck, getRecentBotErrors, getOllamaLatencySummary } from "@/jarvis/jarvis-health";
import { getJarvisConfig } from "@/jarvis/jarvis-env";

export async function GET(req: NextRequest) {
  const auth = await assertJarvisAuth(req);
  if (auth) return auth;

  const health = await runJarvisHealthCheck();
  const config = getJarvisConfig();
  const errors = await getRecentBotErrors(5);
  const latency = await getOllamaLatencySummary();

  return NextResponse.json({
    status: "ok",
    health,
    latency,
    recentErrors: errors.map((e) => ({ at: e.at, error: e.error.slice(0, 200) })),
    models: {
      fast: config.modelFast,
      smart: config.modelSmart,
      report: config.modelReport,
    },
    voice: {
      enabled: config.voiceEnabled,
      profile: config.voiceProfile,
      providerConfigured: Boolean(config.voiceProvider),
    },
  });
}
