import { NextRequest, NextResponse } from "next/server";
import { assertJarvisAuth, parseJarvisJson } from "@/jarvis/api-auth";
import { executeJarvisCommand } from "@/jarvis/jarvis-orchestrator";
import type { JarvisScope } from "@/jarvis/types";

type AuditBody = {
  scope?: JarvisScope;
  detail?: "short" | "normal" | "full";
  mode?: "marketplace" | "repo" | "all";
};

export async function POST(req: NextRequest) {
  const auth = await assertJarvisAuth(req);
  if (auth) return auth;

  const body = await parseJarvisJson<AuditBody>(req);
  if (body instanceof NextResponse) return body;

  const scope = body.scope ?? "all";
  const detail = body.detail ?? "normal";
  const mode = body.mode ?? "all";

  const marketplace = mode === "marketplace" || mode === "all"
    ? await executeJarvisCommand({ command: "audit-marketplace", scope, detail })
    : null;

  const errors = mode === "repo" || mode === "all"
    ? await executeJarvisCommand({ command: "detect-errors", scope: "repo", detail })
    : null;

  const improvements = mode === "all"
    ? await executeJarvisCommand({ command: "suggest-improvements", scope, detail })
    : null;

  const findings = [
    ...(marketplace?.findings ?? []),
    ...(errors?.findings ?? []),
    ...(improvements?.findings ?? []),
  ];

  return NextResponse.json({
    status: "ok",
    mode,
    summary: [marketplace?.summary, errors?.summary, improvements?.summary].filter(Boolean).join(" "),
    findings,
    recommendations: [
      ...(marketplace?.recommendations ?? []),
      ...(errors?.recommendations ?? []),
      ...(improvements?.recommendations ?? []),
    ],
    requiresConfirmation: Boolean(
      marketplace?.requiresConfirmation || improvements?.requiresConfirmation
    ),
  });
}
