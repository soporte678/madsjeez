/**
 * API Route – /api/jarvis/mcp
 *
 * HTTP interface for the JARVIS MCP (Model Context Protocol) system.
 * Provides access to all MCP operations across GitHub, Railway, and Supabase
 * with full governance enforcement.
 *
 * Methods
 * -------
 * GET  – Returns MCP system stats, health status, and available operations.
 * POST – Executes an MCP operation on a specific service.
 *
 * POST Body
 * ---------
 * {
 *   service: "github" | "railway" | "supabase",
 *   operation: string,
 *   params: Record<string, unknown>
 * }
 *
 * Security
 * --------
 * - JARVIS must be enabled (JARVIS_ENABLED === "true")
 * - Write operations require X-JARVIS-Approval-Token header
 * - All operations are logged to the governance auditor
 *
 * @module app/api/jarvis/mcp/route
 */

import { NextRequest, NextResponse } from "next/server";
import {
  executeMCPOperation,
  getAvailableOperations,
  getMCPStats,
  healthCheck,
  requiresApproval,
  MCPService,
} from "@/lib/jarvis/mcp";

// ============================================================================
// Constants
// ============================================================================

/** Valid MCP service names */
const VALID_SERVICES: MCPService[] = ["github", "railway", "supabase"];

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
 * Validate that a service name is a known MCP service.
 */
function isValidService(service: string): service is MCPService {
  return VALID_SERVICES.includes(service as MCPService);
}

/**
 * Verify the approval token for write operations.
 * Returns a 403 response if the token is missing or invalid.
 */
function verifyApprovalToken(req: NextRequest): NextResponse | null {
  const token = req.headers.get("X-JARVIS-Approval-Token");
  const expectedToken = process.env.JARVIS_APPROVAL_TOKEN;

  if (!expectedToken) {
    return NextResponse.json(
      { error: "JARVIS approval token is not configured on the server" },
      {
        status: 500,
        headers: {
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  }

  if (token !== expectedToken) {
    return NextResponse.json(
      { error: "Invalid or missing X-JARVIS-Approval-Token header" },
      {
        status: 403,
        headers: {
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  }

  return null;
}

/**
 * Build the response payload for GET /api/jarvis/mcp.
 */
function buildStatusPayload() {
  const stats = getMCPStats();
  const health = healthCheck();
  const operations = getAvailableOperations();

  return {
    status: "ok" as const,
    stats,
    health,
    operations,
    meta: {
      fetchedAt: new Date().toISOString(),
      version: "1.0.0",
    },
  };
}

// ============================================================================
// GET /api/jarvis/mcp
// ============================================================================

/**
 * Returns comprehensive MCP system information:
 * - Service statistics (total, read, write operation counts)
 * - Per-service health status
 * - Complete operations registry
 */
export async function GET(): Promise<NextResponse> {
  try {
    const disabled = checkJarvisEnabled();
    if (disabled) return disabled;

    const payload = buildStatusPayload();

    return NextResponse.json(payload, {
      headers: {
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[JARVIS API] GET /mcp failed:", message);
    return NextResponse.json(
      { error: "Failed to fetch MCP system info", detail: message },
      {
        status: 500,
        headers: {
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  }
}

// ============================================================================
// POST /api/jarvis/mcp
// ============================================================================

/**
 * Executes an MCP operation on the specified service.
 *
 * Request body must include:
 * - service: Target MCP service ("github", "railway", "supabase")
 * - operation: Name of the operation to execute
 * - params: Operation-specific parameters
 *
 * Write operations require the X-JARVIS-Approval-Token header.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const disabled = checkJarvisEnabled();
    if (disabled) return disabled;

    // ── Parse request body ───────────────────────────────────────────────────
    let body: {
      service?: string;
      operation?: string;
      params?: Record<string, unknown>;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        {
          status: 400,
          headers: {
            "X-Content-Type-Options": "nosniff",
          },
        }
      );
    }

    const { service, operation, params } = body;

    // ── Validate required fields ─────────────────────────────────────────────
    if (!service || typeof service !== "string") {
      return NextResponse.json(
        {
          error: "Missing or invalid field: service",
          hint: "Provide one of: github, railway, supabase",
        },
        {
          status: 400,
          headers: {
            "X-Content-Type-Options": "nosniff",
          },
        }
      );
    }

    if (!isValidService(service)) {
      return NextResponse.json(
        {
          error: `Invalid service: "${service}"`,
          supportedServices: VALID_SERVICES,
        },
        {
          status: 400,
          headers: {
            "X-Content-Type-Options": "nosniff",
          },
        }
      );
    }

    if (!operation || typeof operation !== "string") {
      return NextResponse.json(
        {
          error: "Missing or invalid field: operation",
          hint: "Use GET /api/jarvis/mcp to list available operations",
        },
        {
          status: 400,
          headers: {
            "X-Content-Type-Options": "nosniff",
          },
        }
      );
    }

    const operationParams =
      params && typeof params === "object" && !Array.isArray(params)
        ? params
        : {};

    // ── Check approval token for write operations ────────────────────────────
    if (requiresApproval(service, operation)) {
      const approvalError = verifyApprovalToken(req);
      if (approvalError) return approvalError;
    }

    // ── Execute the MCP operation ────────────────────────────────────────────
    const result = await executeMCPOperation(
      service,
      operation,
      operationParams
    );

    const statusCode = result.success ? 200 : 400;

    return NextResponse.json(result, {
      status: statusCode,
      headers: {
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[JARVIS API] POST /mcp failed:", message);
    return NextResponse.json(
      { error: "MCP operation execution failed", detail: message },
      {
        status: 500,
        headers: {
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  }
}
