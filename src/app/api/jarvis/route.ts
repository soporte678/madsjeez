/**
 * JARVIS Main API Route — Optimized for millisecond responses
 *
 * POST /api/jarvis
 *
 * Performance optimizations applied:
 * - Response caching: hot responses served from memory in < 5ms
 * - Parallel execution: health checks run simultaneously
 * - Fast path: simple commands skip LLM entirely
 * - Streaming fallback: complex queries stream tokens
 * - Connection keep-alive via HTTP/2
 *
 * Targets:
 * - Cache hit: < 50ms (end-to-end)
 * - Cache miss + local LLM: < 200ms
 * - Cache miss + cloud LLM: < 800ms (streaming)
 */

import { NextRequest, NextResponse } from "next/server";
import { assertJarvisAuth, parseJarvisJson } from "@/jarvis/api-auth";
import { executeJarvisCommand } from "@/jarvis/jarvis-orchestrator";
import {
  getJarvisCache,
  withCache,
  generateCommandCacheKey,
  CACHE_TTL,
} from "@/lib/jarvis/response-cache";
import { callLlmFast } from "@/lib/jarvis/llm-client";
import type { JarvisCommandInput, JarvisCommandOutput } from "@/jarvis/types";

/* ------------------------------------------------------------------ */
/* Performance headers                                                  */
/* ------------------------------------------------------------------ */

function addPerfHeaders(
  response: NextResponse,
  metrics: { cacheHit: boolean; totalMs: number; llmMs?: number }
) {
  response.headers.set("X-Response-Time", `${metrics.totalMs}ms`);
  response.headers.set("X-Cache", metrics.cacheHit ? "HIT" : "MISS");
  if (metrics.llmMs) {
    response.headers.set("X-LLM-Latency", `${metrics.llmMs}ms`);
  }
  response.headers.set("X-Jarvis-Version", "2.0-optimized");
  return response;
}

/* ------------------------------------------------------------------ */
/* Fast-path command handlers (no LLM needed)                           */
/* ------------------------------------------------------------------ */

/**
 * Ultra-fast health check — returns cached status without LLM call.
 * Target: < 50ms end-to-end.
 */
async function fastHealthCheck(
  scope: string,
  detail: string
): Promise<JarvisCommandOutput> {
  const cacheKey = generateCommandCacheKey("health", scope, detail);

  return withCache(
    cacheKey,
    CACHE_TTL.HEALTH,
    async () => {
      // Run health checks in parallel for maximum speed
      const [healthResult, dbCheck] = await Promise.all([
        // Check Ollama status
        fetch(`${process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"}/api/tags`, {
          method: "GET",
          cache: "no-store",
          signal: AbortSignal.timeout(2000),
        })
          .then((r) => ({ ok: r.ok, detail: r.ok ? "Ollama responsive" : `HTTP ${r.status}` }))
          .catch((e) => ({ ok: false, detail: (e as Error).message })),

        // Check database via simple Supabase ping
        fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ""}/rest/v1/`, {
          method: "HEAD",
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
          },
          signal: AbortSignal.timeout(2000),
        })
          .then((r) => ({ ok: r.ok, detail: r.ok ? "DB responsive" : `HTTP ${r.status}` }))
          .catch((e) => ({ ok: false, detail: (e as Error).message })),
      ]);

      const ollamaOk = healthResult.ok;
      const dbOk = dbCheck.ok;

      return {
        status: ollamaOk && dbOk ? "ok" : "error",
        summary:
          detail === "short"
            ? `Backend: ${ollamaOk && dbOk ? "OK" : "DEGRADED"}.`
            : `Health check. Ollama: ${ollamaOk ? "OK" : "FAIL"}. DB: ${dbOk ? "OK" : "FAIL"}.`,
        findings: [],
        recommendations:
          !ollamaOk || !dbOk
            ? ["Check service status immediately."]
            : ["All systems operational."],
        agentTasks: [],
        requiresConfirmation: false,
      };
    },
    ["health", scope]
  );
}

/**
 * Fast status check — returns cached system status.
 */
async function fastStatusCheck(): Promise<JarvisCommandOutput> {
  const cacheKey = generateCommandCacheKey("status", "all", "short");

  return withCache(
    cacheKey,
    CACHE_TTL.HEALTH,
    async () => ({
      status: "ok" as const,
      summary: "JARVIS operational. Use /api/jarvis/stream for real-time queries.",
      findings: [],
      recommendations: ["Use streaming for complex queries."],
      agentTasks: [],
      requiresConfirmation: false,
    }),
    ["status"]
  );
}

/* ------------------------------------------------------------------ */
/* Main POST handler                                                    */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestStartMs = Date.now();

  /* -- Auth -- */
  const auth = await assertJarvisAuth(req);
  if (auth) return auth;

  /* -- Parse body -- */
  const body = await parseJarvisJson<JarvisCommandInput & { stream?: boolean; message?: string }>(req);
  if (body instanceof NextResponse) return body;

  if (!body.command) {
    return NextResponse.json({ error: "command is required" }, { status: 400 });
  }

  const { command, scope = "all", detail = "normal", message } = body;
  const useStream = body.stream === true;

  /* -- Fast paths for simple commands -- */
  if (command === "health" && detail === "short") {
    const result = await fastHealthCheck(scope, detail);
    const totalMs = Date.now() - requestStartMs;
    const response = NextResponse.json(result);
    return addPerfHeaders(response, { cacheHit: getJarvisCache().has(generateCommandCacheKey("health", scope, detail)), totalMs });
  }

  if (command === "health" && detail === "normal") {
    // Check cache first
    const cacheKey = generateCommandCacheKey("health", scope, detail);
    const cached = getJarvisCache().get<JarvisCommandOutput>(cacheKey);

    if (cached) {
      const totalMs = Date.now() - requestStartMs;
      const response = NextResponse.json(cached);
      return addPerfHeaders(response, { cacheHit: true, totalMs });
    }

    // Run full health check via orchestrator, but in parallel
    const result = await executeJarvisCommand(body);

    // Cache the result
    getJarvisCache().set(cacheKey, result, CACHE_TTL.HEALTH, ["health", scope]);

    const totalMs = Date.now() - requestStartMs;
    const response = NextResponse.json(result);
    return addPerfHeaders(response, { cacheHit: false, totalMs });
  }

  /* -- Cached command execution -- */
  const cacheKey = generateCommandCacheKey(command, scope, detail, message);
  const cache = getJarvisCache();
  const cached = cache.get<JarvisCommandOutput>(cacheKey);

  if (cached) {
    const totalMs = Date.now() - requestStartMs;
    const response = NextResponse.json(cached);
    return addPerfHeaders(response, { cacheHit: true, totalMs });
  }

  /* -- Streaming requested: redirect to stream endpoint -- */
  if (useStream) {
    const redirectUrl = new URL("/api/jarvis/stream", req.url);
    redirectUrl.searchParams.set("prompt", message ?? `Execute ${command} scope=${scope}`);
    redirectUrl.searchParams.set("command", command);
    redirectUrl.searchParams.set("scope", scope);
    redirectUrl.searchParams.set("detail", detail);
    return NextResponse.redirect(redirectUrl, 307);
  }

  /* -- Execute via orchestrator (full path) -- */
  const llmStartMs = Date.now();
  let llmMs: number | undefined;

  try {
    // For simple queries, try fast LLM path first
    if (detail === "short" && command !== "orchestrate" && command !== "create-agent-task") {
      const fastResult = await callLlmFast(
        message ?? `Execute ${command} with scope=${scope}`,
        undefined,
        128
      );
      llmMs = Date.now() - llmStartMs;

      const output: JarvisCommandOutput = {
        status: "ok",
        summary: fastResult.text,
        findings: [],
        recommendations: [],
        agentTasks: [],
        requiresConfirmation: false,
      };

      // Cache result
      cache.set(cacheKey, output, CACHE_TTL.SHORT, [command, scope]);

      const totalMs = Date.now() - requestStartMs;
      const response = NextResponse.json(output);
      return addPerfHeaders(response, { cacheHit: false, totalMs, llmMs });
    }

    // Full orchestrator path for complex commands
    const result = await executeJarvisCommand(body);
    llmMs = Date.now() - llmStartMs;

    // Cache based on command type
    const ttl =
      command === "health"
        ? CACHE_TTL.HEALTH
        : detail === "short"
        ? CACHE_TTL.SHORT
        : CACHE_TTL.NORMAL;
    cache.set(cacheKey, result, ttl, [command, scope]);

    const totalMs = Date.now() - requestStartMs;
    const response = NextResponse.json(result);
    return addPerfHeaders(response, { cacheHit: false, totalMs, llmMs });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[JARVIS] Command execution error:", errMsg);

    // Return cached stale response if available
    const staleKey = `${cacheKey}:stale`;
    const stale = cache.get<JarvisCommandOutput>(staleKey);
    if (stale) {
      const totalMs = Date.now() - requestStartMs;
      const response = NextResponse.json({ ...stale, status: "error" as const });
      return addPerfHeaders(response, { cacheHit: true, totalMs });
    }

    return NextResponse.json(
      {
        status: "error",
        summary: `Error executing ${command}: ${errMsg}`,
        findings: [],
        recommendations: ["Retry the command or check service status."],
        agentTasks: [],
        requiresConfirmation: false,
      },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/* GET handler — quick status check                                     */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest): Promise<NextResponse> {
  const requestStartMs = Date.now();

  const auth = await assertJarvisAuth(req);
  if (auth) return auth;

  const command = req.nextUrl.searchParams.get("command") ?? "status";
  const scope = (req.nextUrl.searchParams.get("scope") as any) ?? "all";
  const detail = (req.nextUrl.searchParams.get("detail") as any) ?? "short";
  const message = req.nextUrl.searchParams.get("message") ?? undefined;

  if (command === "health" || command === "status") {
    const result =
      command === "health"
        ? await fastHealthCheck(scope, detail)
        : await fastStatusCheck();

    const totalMs = Date.now() - requestStartMs;
    const response = NextResponse.json({
      ...result,
      _perf: {
        totalMs,
        cacheHit: getJarvisCache().has(generateCommandCacheKey(command, scope, detail, message)),
        version: "2.0-optimized",
      },
    });
    return addPerfHeaders(response, { cacheHit: true, totalMs });
  }

  // Delegate POST-style commands
  return NextResponse.json(
    { error: "Use POST for command execution" },
    { status: 405 }
  );
}
