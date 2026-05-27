/**
 * API Route – /api/jarvis/mcp/health
 *
 * Lightweight health-check endpoint for all MCP services.
 * Returns the configuration and connectivity status of each
 * service (GitHub, Railway, Supabase) without executing any
 * remote operations.
 *
 * Methods
 * -------
 * GET  – Returns per-service health status and configuration state.
 *
 * @module app/api/jarvis/mcp/health/route
 */

import { NextResponse } from "next/server";
import {
  isServiceHealthy,
  MCPService,
} from "@/lib/jarvis/mcp";

// ============================================================================
// Constants
// ============================================================================

/** MCP services to include in the health report */
const SERVICES: MCPService[] = ["github", "railway", "supabase"];

/** Human-readable labels for each service */
const SERVICE_LABELS: Record<MCPService, string> = {
  github: "GitHub API",
  railway: "Railway API",
  supabase: "Supabase API",
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if JARVIS is enabled via environment variable.
 * Returns a 503 response if not enabled.
 */
function checkJarvisEnabled(): NextResponse | null {
  if (process.env.JARVIS_ENABLED !== "true") {
    return NextResponse.json(
      { error: "JARVIS is not enabled" },
      {
        status: 503,
        headers: {
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  }
  return null;
}

/**
 * Determine whether a service is configured based on the presence
 * of required environment variables.
 */
function isServiceConfigured(service: MCPService): boolean {
  switch (service) {
    case "github":
      return !!process.env.GITHUB_TOKEN;
    case "railway":
      return !!process.env.RAILWAY_API_TOKEN;
    case "supabase":
      return !!(
        process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    default:
      return false;
  }
}

/**
 * Build a per-service health record.
 */
function buildServiceHealth(service: MCPService) {
  const configured = isServiceConfigured(service);
  const healthy = isServiceHealthy(service);

  return {
    healthy,
    configured,
    label: SERVICE_LABELS[service],
  };
}

// ============================================================================
// GET /api/jarvis/mcp/health
// ============================================================================

/**
 * Returns the health status of all MCP services.
 *
 * Response shape:
 * {
 *   status: "ok",
 *   timestamp: ISO string,
 *   services: {
 *     github:  { healthy: boolean, configured: boolean },
 *     railway: { healthy: boolean, configured: boolean },
 *     supabase:{ healthy: boolean, configured: boolean }
 *   }
 * }
 */
export async function GET(): Promise<NextResponse> {
  try {
    const disabled = checkJarvisEnabled();
    if (disabled) return disabled;

    const services = Object.fromEntries(
      SERVICES.map((svc) => [svc, buildServiceHealth(svc)])
    ) as Record<
      MCPService,
      { healthy: boolean; configured: boolean; label: string }
    >;

    return NextResponse.json(
      {
        status: "ok" as const,
        timestamp: new Date().toISOString(),
        services,
      },
      {
        headers: {
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[JARVIS API] GET /mcp/health failed:", message);
    return NextResponse.json(
      { error: "Health check failed", detail: message },
      {
        status: 500,
        headers: {
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  }
}
