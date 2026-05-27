/**
 * API Route – /api/jarvis/mcp/audit
 *
 * HTTP interface for querying MCP audit logs.
 * Returns security events logged by the JARVIS governance auditor
 * for all MCP operations.
 *
 * Methods
 * -------
 * GET  – Returns recent audit logs with optional filtering.
 *
 * Query Parameters
 * ----------------
 * service    – Filter by MCP service ("github", "railway", "supabase")
 * operation  – Filter by operation name (e.g., "listCommits", "deployService")
 * status     – Filter by event status ("success" | "failure")
 * limit      – Maximum number of events to return (default: 50, max: 200)
 * offset     – Number of events to skip (default: 0)
 *
 * @module app/api/jarvis/mcp/audit/route
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getSecurityEvents,
  getMemoryBuffer,
  type AuditEntry,
} from "@/lib/jarvis/governance/auditor";

// ============================================================================
// Constants
// ============================================================================

/** Default number of events to return */
const DEFAULT_LIMIT = 50;

/** Maximum allowed limit to prevent abuse */
const MAX_LIMIT = 200;

/** Valid MCP service names for filtering */
const VALID_SERVICES = ["github", "railway", "supabase"];

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
 * Parse and validate query parameters from the request URL.
 */
function parseQueryParams(req: NextRequest): {
  service: string | null;
  operation: string | null;
  status: string | null;
  limit: number;
  offset: number;
} {
  const { searchParams } = new URL(req.url);

  const service = searchParams.get("service");
  const operation = searchParams.get("operation");
  const status = searchParams.get("status");

  let limit = parseInt(searchParams.get("limit") ?? "", 10);
  if (isNaN(limit) || limit <= 0) limit = DEFAULT_LIMIT;
  limit = Math.min(limit, MAX_LIMIT);

  let offset = parseInt(searchParams.get("offset") ?? "", 10);
  if (isNaN(offset) || offset < 0) offset = 0;

  return { service, operation, status, limit, offset };
}

/**
 * Validate query parameters and return an error response if invalid.
 */
function validateParams(params: ReturnType<typeof parseQueryParams>):
  | {
      error: NextResponse;
    }
  | {
      valid: true;
    } {
  if (
    params.service &&
    !VALID_SERVICES.includes(params.service.toLowerCase())
  ) {
    return {
      error: NextResponse.json(
        {
          error: `Invalid service filter: "${params.service}"`,
          supportedServices: VALID_SERVICES,
        },
        {
          status: 400,
          headers: {
            "X-Content-Type-Options": "nosniff",
          },
        }
      ),
    };
  }

  if (params.status && !["success", "failure"].includes(params.status)) {
    return {
      error: NextResponse.json(
        {
          error: `Invalid status filter: "${params.status}"`,
          supportedStatuses: ["success", "failure"],
        },
        {
          status: 400,
          headers: {
            "X-Content-Type-Options": "nosniff",
          },
        }
      ),
    };
  }

  return { valid: true };
}

/**
 * Retrieve recent MCP audit logs.
 * Attempts to fetch from the database first; falls back to the in-memory
 * buffer if the database is unavailable.
 *
 * @param limit  – Maximum number of events to retrieve
 * @returns Array of audit entries sorted by timestamp (newest first)
 */
async function getRecentLogs(limit: number): Promise<AuditEntry[]> {
  try {
    // getSecurityEvents attempts DB first, falls back to memory buffer
    return await getSecurityEvents(limit);
  } catch {
    // Ultimate fallback: read directly from the in-memory buffer
    const buffer = getMemoryBuffer();
    return [...buffer]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }
}

/**
 * Filter audit entries by service, operation, and status.
 */
function filterLogs(
  logs: AuditEntry[],
  filters: {
    service: string | null;
    operation: string | null;
    status: string | null;
  }
): AuditEntry[] {
  return logs.filter((entry) => {
    // Filter by service (check metadata.service or action prefix)
    if (filters.service) {
      const metaService = (entry.metadata?.service as string) || "";
      const actionPrefix = entry.action.split("_")[0].toLowerCase();
      if (
        metaService !== filters.service.toLowerCase() &&
        actionPrefix !== filters.service.toLowerCase()
      ) {
        return false;
      }
    }

    // Filter by operation (check metadata.operation or action suffix)
    if (filters.operation) {
      const metaOperation = (entry.metadata?.operation as string) || "";
      const actionParts = entry.action.split("_");
      const actionSuffix = actionParts.slice(1).join("_");
      if (
        metaOperation !== filters.operation &&
        actionSuffix !== filters.operation
      ) {
        return false;
      }
    }

    // Filter by status (check metadata.status)
    if (filters.status) {
      const metaStatus = (entry.metadata?.status as string) || "";
      if (metaStatus !== filters.status) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Strip checksums from the response to keep payloads lean.
 */
function sanitizeForResponse(
  entries: AuditEntry[]
): Omit<AuditEntry, "checksum">[] {
  return entries.map(({ checksum: _checksum, ...rest }) => rest);
}

// ============================================================================
// GET /api/jarvis/mcp/audit
// ============================================================================

/**
 * Returns recent MCP audit logs with optional filtering.
 *
 * Query params:
 * - service:   "github" | "railway" | "supabase"
 * - operation: operation name (e.g. "listCommits")
 * - status:    "success" | "failure"
 * - limit:     number (default 50, max 200)
 * - offset:    number (default 0)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const disabled = checkJarvisEnabled();
    if (disabled) return disabled;

    // ── Parse and validate query parameters ──────────────────────────────────
    const query = parseQueryParams(req);
    const validation = validateParams(query);
    if ("error" in validation) return validation.error;

    // ── Fetch and filter logs ────────────────────────────────────────────────
    const allLogs = await getRecentLogs(query.limit + query.offset);
    const filtered = filterLogs(allLogs, {
      service: query.service,
      operation: query.operation,
      status: query.status,
    });

    // Apply offset and limit after filtering
    const paginated = filtered.slice(query.offset, query.offset + query.limit);

    return NextResponse.json(
      {
        status: "ok" as const,
        timestamp: new Date().toISOString(),
        filters: {
          service: query.service,
          operation: query.operation,
          status: query.status,
        },
        pagination: {
          total: filtered.length,
          limit: query.limit,
          offset: query.offset,
          returned: paginated.length,
        },
        events: sanitizeForResponse(paginated),
      },
      {
        headers: {
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[JARVIS API] GET /mcp/audit failed:", message);
    return NextResponse.json(
      { error: "Failed to fetch audit logs", detail: message },
      {
        status: 500,
        headers: {
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  }
}
