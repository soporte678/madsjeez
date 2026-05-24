import { NextRequest, NextResponse } from "next/server";
import { assertJarvisAuth, parseJarvisJson } from "@/jarvis/api-auth";
import { executeJarvisCommand, executeJarvisReport } from "@/jarvis/jarvis-orchestrator";
import { parseVoiceTranscript as parseWake, isWakeWordRequired } from "@/lib/jarvis/wake-word";
import { routeVoiceCommand } from "@/lib/jarvis/voice-intent";

type VoiceCommandBody = { text: string };

export async function POST(req: NextRequest) {
  const auth = await assertJarvisAuth(req);
  if (auth) return auth;

  const body = await parseJarvisJson<VoiceCommandBody>(req);
  if (body instanceof NextResponse) return body;

  if (!body.text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const parsed = parseWake(body.text, isWakeWordRequired());
  if (!parsed.ok) {
    return NextResponse.json(
      {
        status: "error",
        summary: parsed.reason,
        wakeWordOk: false,
        raw: parsed.raw,
      },
      { status: 400 }
    );
  }

  const routed = routeVoiceCommand(parsed.command);

  if (routed.kind === "desktop") {
    return NextResponse.json({
      status: "desktop_only",
      summary: routed.summary,
      hint: routed.hint,
      wakeWordOk: true,
      command: parsed.command,
    });
  }

  if (routed.kind === "unknown") {
    return NextResponse.json({
      status: "error",
      summary: routed.summary,
      wakeWordOk: true,
      command: parsed.command,
    });
  }

  if (routed.reportType) {
    const report = await executeJarvisReport(routed.reportType, routed.input.scope ?? "all", "normal");
    return NextResponse.json({
      status: "ok",
      summary: report.report.summary,
      wakeWordOk: true,
      command: parsed.command,
      reportId: report.report.reportId,
      findings: report.report.findings,
      recommendations: report.report.recommendedActions,
    });
  }

  const result = await executeJarvisCommand(routed.input);
  return NextResponse.json({
    ...result,
    wakeWordOk: true,
    command: parsed.command,
  });
}
