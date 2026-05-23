import { NextRequest, NextResponse } from "next/server";
import { assertJarvisAuth, parseJarvisJson } from "@/jarvis/api-auth";
import { executeJarvisReport } from "@/jarvis/jarvis-orchestrator";
import type { JarvisReportType, JarvisScope } from "@/jarvis/types";

type ReportBody = {
  type?: JarvisReportType;
  scope?: JarvisScope;
  detail?: "short" | "normal" | "full";
};

export async function POST(req: NextRequest) {
  const auth = await assertJarvisAuth(req);
  if (auth) return auth;

  const body = await parseJarvisJson<ReportBody>(req);
  if (body instanceof NextResponse) return body;

  const type = body.type ?? "daily_marketplace_report";
  const scope = body.scope ?? "all";
  const detail = body.detail ?? "normal";

  const out = await executeJarvisReport(type, scope, detail);
  return NextResponse.json({
    status: "ok",
    reportId: out.report.reportId,
    summary: out.report.summary,
    markdown: out.markdown,
    findings: out.report.findings,
    problems: out.report.problems,
    opportunities: out.report.opportunities,
    recommendedActions: out.report.recommendedActions,
  });
}
