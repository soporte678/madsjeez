import { NextRequest, NextResponse } from "next/server";
import { assertJarvisAuth, parseJarvisJson } from "@/jarvis/api-auth";
import { getJarvisConfig } from "@/jarvis/jarvis-env";
import { executeJarvisCommand } from "@/jarvis/jarvis-orchestrator";
import type { JarvisScope } from "@/jarvis/types";

type VoiceBody = {
  scope?: JarvisScope;
};

export async function POST(req: NextRequest) {
  const auth = await assertJarvisAuth(req);
  if (auth) return auth;

  const config = getJarvisConfig();
  if (!config.allowVoiceReports) {
    return NextResponse.json(
      { error: "JARVIS_ALLOW_VOICE_REPORTS=false" },
      { status: 403 }
    );
  }

  const body = await parseJarvisJson<VoiceBody>(req);
  if (body instanceof NextResponse) return body;

  const result = await executeJarvisCommand({
    command: "voice-report",
    scope: body.scope ?? "all",
    detail: "short",
  });

  return NextResponse.json({
    status: result.status,
    summary: result.summary,
    voiceReportText: result.voiceReportText,
    voiceReportUrl: result.voiceReportUrl ?? "",
    profile: config.voiceProfile,
    ttsConfigured: config.voiceEnabled && Boolean(config.voiceProvider),
    findings: result.findings,
  });
}
