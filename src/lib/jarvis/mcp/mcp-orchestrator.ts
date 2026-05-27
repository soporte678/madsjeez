/**
 * MCP Orchestrator
 * Central hub for all MCP operations
 * Routes requests to appropriate connector
 * Enforces governance rules on all operations
 *
 * @module mcp-orchestrator
 * @requires governance/enforcer for approval checks
 * @requires governance/auditor for security logging
 *
 * @example
 * ```typescript
 * // Execute a read operation (no approval needed)
 * const commits = await executeMCPOperation("github", "listCommits", {
 *   repo: "owner/repo",
 *   branch: "main",
 *   limit: 10
 * });
 *
 * // Execute a write operation (triggers governance approval)
 * const pr = await executeMCPOperation("github", "createPullRequest", {
 *   repo: "owner/repo",
 *   title: "Fix bug",
 *   body: "Description...",
 *   head: "feature-branch",
 *   base: "main"
 * });
 * ```
 */

import { evaluateAction } from "../governance/enforcer";
import { logSecurityEvent } from "../governance/auditor";

// Import all connector functions
import * as github from "./github-mcp";
import * as railway from "./railway-mcp";
import * as supabase from "./supabase-mcp";

// ─── Operation Registry ──────────────────────────────────────────────────────

/**
 * Registry of all available MCP operations grouped by service and access level.
 * This is the single source of truth for what JARVIS can do.
 */
export const MCP_OPERATIONS = {
  github: {
    read: [
      "getRepositoryInfo",
      "listCommits",
      "getFileContent",
      "listDirectory",
      "getIssues",
      "getPullRequests",
      "getWorkflowRuns",
      "getRepositoryBranches",
    ] as const,
    write: [
      "createCommit",
      "createPullRequest",
      "mergePullRequest",
      "createIssue",
      "closeIssue",
      "triggerWorkflow",
    ] as const,
  },
  railway: {
    read: [
      "getProjects",
      "getProject",
      "getServices",
      "getDeployments",
      "getDeploymentLogs",
      "getEnvironmentVariables",
      "getServiceMetrics",
      "getService",
    ] as const,
    write: [
      "deployService",
      "redeployService",
      "setEnvironmentVariable",
      "scaleService",
      "rollbackDeployment",
    ] as const,
  },
  supabase: {
    read: [
      "executeQuery",
      "listTables",
      "getTableSchema",
      "getTableStats",
      "getSlowQueries",
      "getActiveConnections",
      "getDatabaseSize",
      "getRowCount",
      "listUsers",
      "getUserById",
      "listBuckets",
      "listFiles",
    ] as const,
    write: [
      "createTable",
      "alterTable",
      "createIndex",
      "vacuumTable",
      "analyzeTable",
      "deleteUser",
    ] as const,
  },
} as const;

/** Supported MCP services */
export type MCPService = keyof typeof MCP_OPERATIONS;

/** Operation classification */
export type OperationType = "read" | "write";

/** Result of an MCP operation execution */
export interface MCPResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  approvalRequired?: boolean;
  approved?: boolean;
  operation: string;
  service: MCPService;
  timestamp: string;
  executionTimeMs: number;
}

/** Approval request payload */
export interface ApprovalRequest {
  id: string;
  service: MCPService;
  operation: string;
  type: OperationType;
  params: Record<string, unknown>;
  requestedAt: string;
  expiresAt: string;
  reason: string;
}

// ─── Internal Maps ───────────────────────────────────────────────────────────

/**
 * Map of service + operation name to the actual connector function.
 */
const OPERATION_HANDLERS: Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (...args: any[]) => Promise<unknown>
> = {
  // ── GitHub ──
  "github_getRepositoryInfo": github.getRepositoryInfo,
  "github_listCommits": github.listCommits,
  "github_getFileContent": github.getFileContent,
  "github_listDirectory": github.listDirectory,
  "github_getIssues": github.getIssues,
  "github_getPullRequests": github.getPullRequests,
  "github_getWorkflowRuns": github.getWorkflowRuns,
  "github_getRepositoryBranches": github.getRepositoryBranches,
  "github_createCommit": github.createCommit,
  "github_createPullRequest": github.createPullRequest,
  "github_mergePullRequest": github.mergePullRequest,
  "github_createIssue": github.createIssue,
  "github_closeIssue": github.closeIssue,
  "github_triggerWorkflow": github.triggerWorkflow,

  // ── Railway ──
  "railway_getProjects": railway.getProjects,
  "railway_getProject": railway.getProject,
  "railway_getServices": railway.getServices,
  "railway_getService": railway.getService,
  "railway_getDeployments": railway.getDeployments,
  "railway_getDeploymentLogs": railway.getDeploymentLogs,
  "railway_getEnvironmentVariables": railway.getEnvironmentVariables,
  "railway_getServiceMetrics": railway.getServiceMetrics,
  "railway_deployService": railway.deployService,
  "railway_redeployService": railway.redeployService,
  "railway_setEnvironmentVariable": railway.setEnvironmentVariable,
  "railway_scaleService": railway.scaleService,
  "railway_rollbackDeployment": railway.rollbackDeployment,

  // ── Supabase ──
  "supabase_executeQuery": supabase.executeQuery,
  "supabase_listTables": supabase.listTables,
  "supabase_getTableSchema": supabase.getTableSchema,
  "supabase_getTableStats": supabase.getTableStats,
  "supabase_getSlowQueries": supabase.getSlowQueries,
  "supabase_getActiveConnections": supabase.getActiveConnections,
  "supabase_getDatabaseSize": supabase.getDatabaseSize,
  "supabase_getRowCount": supabase.getRowCount,
  "supabase_listUsers": supabase.listUsers,
  "supabase_getUserById": supabase.getUserById,
  "supabase_listBuckets": supabase.listBuckets,
  "supabase_listFiles": supabase.listFiles,
  "supabase_createTable": supabase.createTable,
  "supabase_alterTable": supabase.alterTable,
  "supabase_createIndex": supabase.createIndex,
  "supabase_vacuumTable": supabase.vacuumTable,
  "supabase_analyzeTable": supabase.analyzeTable,
  "supabase_deleteUser": supabase.deleteUser,
};

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Validate that a service and operation combination is valid.
 */
function validateOperation(
  service: string,
  operation: string
): { service: MCPService; type: OperationType } | null {
  if (!(service in MCP_OPERATIONS)) {
    return null;
  }

  const svc = MCP_OPERATIONS[service as MCPService];

  if (svc.read.includes(operation as (typeof svc.read)[number])) {
    return { service: service as MCPService, type: "read" };
  }
  if (svc.write.includes(operation as (typeof svc.write)[number])) {
    return { service: service as MCPService, type: "write" };
  }

  return null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Check if an operation requires human approval.
 *
 * @param service - MCP service name ("github", "railway", "supabase")
 * @param operation - Operation name
 * @returns true if the operation requires governance approval
 *
 * @example
 * ```typescript
 * if (requiresApproval("github", "mergePullRequest")) {
 *   console.log("This will trigger an approval flow");
 * }
 * ```
 */
export function requiresApproval(service: string, operation: string): boolean {
  const validated = validateOperation(service, operation);
  if (!validated) {
    // Unknown operations are treated as requiring approval for safety
    return true;
  }
  return validated.type === "write";
}

/**
 * Get all available operations grouped by service.
 *
 * @returns The complete operations registry
 *
 * @example
 * ```typescript
 * const ops = getAvailableOperations();
 * console.log(ops.github.read);  // ["getRepositoryInfo", ...]
 * console.log(ops.github.write); // ["createCommit", ...]
 * ```
 */
export function getAvailableOperations(): typeof MCP_OPERATIONS {
  return MCP_OPERATIONS;
}

/**
 * Build the parameter list for a specific operation from the params record.
 */
function buildArgs(
  service: MCPService,
  operation: string,
  params: Record<string, unknown>
): unknown[] {
  // Each connector function defines its own parameter order
  // We map the params record to positional arguments
  switch (`${service}_${operation}`) {
    // ═══ GitHub ═══
    case "github_getRepositoryInfo":
      return [params.repo];
    case "github_listCommits":
      return [params.repo, params.branch, params.limit];
    case "github_getFileContent":
      return [params.repo, params.path, params.branch];
    case "github_listDirectory":
      return [params.repo, params.path, params.branch];
    case "github_getIssues":
      return [params.repo, params.state, params.labels];
    case "github_getPullRequests":
      return [params.repo, params.state];
    case "github_getWorkflowRuns":
      return [params.repo, params.workflowId];
    case "github_getRepositoryBranches":
      return [params.repo];
    case "github_createCommit":
      return [params.repo, params.path, params.content, params.message, params.branch];
    case "github_createPullRequest":
      return [params.repo, params.title, params.body, params.head, params.base];
    case "github_mergePullRequest":
      return [params.repo, params.prNumber];
    case "github_createIssue":
      return [params.repo, params.title, params.body, params.labels];
    case "github_closeIssue":
      return [params.repo, params.issueNumber];
    case "github_triggerWorkflow":
      return [params.repo, params.workflowId, params.branch];

    // ═══ Railway ═══
    case "railway_getProjects":
      return [];
    case "railway_getProject":
      return [params.projectId];
    case "railway_getServices":
      return [params.projectId];
    case "railway_getService":
      return [params.serviceId];
    case "railway_getDeployments":
      return [params.serviceId];
    case "railway_getDeploymentLogs":
      return [params.deploymentId];
    case "railway_getEnvironmentVariables":
      return [params.serviceId];
    case "railway_getServiceMetrics":
      return [params.serviceId];
    case "railway_deployService":
      return [params.serviceId];
    case "railway_redeployService":
      return [params.serviceId];
    case "railway_setEnvironmentVariable":
      return [params.serviceId, params.key, params.value];
    case "railway_scaleService":
      return [params.serviceId, params.replicas];
    case "railway_rollbackDeployment":
      return [params.serviceId, params.deploymentId];

    // ═══ Supabase ═══
    case "supabase_executeQuery":
      return [params.query, params.params];
    case "supabase_listTables":
      return [];
    case "supabase_getTableSchema":
      return [params.tableName];
    case "supabase_getTableStats":
      return [params.tableName];
    case "supabase_getSlowQueries":
      return [];
    case "supabase_getActiveConnections":
      return [];
    case "supabase_getDatabaseSize":
      return [];
    case "supabase_getRowCount":
      return [params.tableName];
    case "supabase_listUsers":
      return [params.limit];
    case "supabase_getUserById":
      return [params.userId];
    case "supabase_listBuckets":
      return [];
    case "supabase_listFiles":
      return [params.bucket, params.path];
    case "supabase_createTable":
      return [params.name, params.columns];
    case "supabase_alterTable":
      return [params.name, params.changes];
    case "supabase_createIndex":
      return [params.tableName, params.columnName, params.indexName];
    case "supabase_vacuumTable":
      return [params.tableName];
    case "supabase_analyzeTable":
      return [params.tableName];
    case "supabase_deleteUser":
      return [params.userId];

    default:
      // Fallback: pass params as single object
      return [params];
  }
}

/**
 * Execute an MCP operation with full governance checks.
 *
 * Read operations execute immediately (but are logged).
 * Write operations require governance approval before execution.
 * Unknown operations are rejected.
 *
 * @param service - MCP service name ("github", "railway", "supabase")
 * @param operation - Operation name
 * @param params - Operation parameters
 * @returns MCP result with data, status, and metadata
 *
 * @example
 * ```typescript
 * // Read operation - executes immediately
 * const result = await executeMCPOperation("github", "listCommits", {
 *   repo: "acme-corp/website",
 *   branch: "main",
 *   limit: 5
 * });
 * if (result.success) {
 *   console.log(result.data);
 * }
 *
 * // Write operation - triggers approval flow
 * const result = await executeMCPOperation("supabase", "deleteUser", {
 *   userId: "uuid-here"
 * });
 * if (!result.approved) {
 *   console.log("Waiting for human approval...");
 * }
 * ```
 */
export async function executeMCPOperation(
  service: "github" | "railway" | "supabase",
  operation: string,
  params: Record<string, unknown>
): Promise<MCPResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // ── Step 1: Validate the operation exists ─────────────────────────────────
  const validated = validateOperation(service, operation);
  if (!validated) {
    const error = `Unknown operation: "${operation}" for service "${service}"`;
    await logSecurityEvent({
      service,
      operation,
      target: "unknown",
      status: "failure",
      timestamp,
      details: { error, params },
    });
    return {
      success: false,
      error,
      operation,
      service,
      timestamp,
      executionTimeMs: Date.now() - startTime,
    };
  }

  // ── Step 2: Check governance for write operations ─────────────────────────
  if (validated.type === "write") {
    let governanceResult;
    try {
      governanceResult = await evaluateAction({
        service,
        operation,
        params,
        riskLevel: "medium", // Write operations default to medium risk
        timestamp,
      });
    } catch (govError) {
      const error = `Governance check failed: ${(govError as Error).message}`;
      await logSecurityEvent({
        service,
        operation,
        target: extractTarget(service, params),
        status: "failure",
        timestamp,
        details: { error, params },
      });
      return {
        success: false,
        error,
        approvalRequired: true,
        approved: false,
        operation,
        service,
        timestamp,
        executionTimeMs: Date.now() - startTime,
      };
    }

    if (!governanceResult.approved) {
      await logSecurityEvent({
        service,
        operation,
        target: extractTarget(service, params),
        status: "failure",
        timestamp,
        details: {
          reason: governanceResult.reason,
          params,
          rejected: true,
        },
      });
      return {
        success: false,
        error: governanceResult.reason || "Operation rejected by governance policy",
        approvalRequired: true,
        approved: false,
        operation,
        service,
        timestamp,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  // ── Step 3: Resolve the handler ───────────────────────────────────────────
  const handlerKey = `${service}_${operation}`;
  const handler = OPERATION_HANDLERS[handlerKey];
  if (!handler) {
    const error = `Handler not implemented for "${handlerKey}"`;
    await logSecurityEvent({
      service,
      operation,
      target: extractTarget(service, params),
      status: "failure",
      timestamp,
      details: { error },
    });
    return {
      success: false,
      error,
      operation,
      service,
      timestamp,
      executionTimeMs: Date.now() - startTime,
    };
  }

  // ── Step 4: Execute ───────────────────────────────────────────────────────
  try {
    const args = buildArgs(service, operation, params);
    // Filter out undefined values at the end of the args list
    const trimmedArgs = trimTrailingUndefined(args);
    const data = await handler(...trimmedArgs);

    const executionTimeMs = Date.now() - startTime;

    // Log successful execution
    await logSecurityEvent({
      service,
      operation,
      target: extractTarget(service, params),
      status: "success",
      timestamp,
      details: {
        executionTimeMs,
        params,
        type: validated.type,
      },
    });

    return {
      success: true,
      data,
      approvalRequired: validated.type === "write",
      approved: validated.type === "write" ? true : undefined,
      operation,
      service,
      timestamp,
      executionTimeMs,
    };
  } catch (execError) {
    const executionTimeMs = Date.now() - startTime;
    const error = (execError as Error).message;

    // Log failed execution
    await logSecurityEvent({
      service,
      operation,
      target: extractTarget(service, params),
      status: "failure",
      timestamp,
      details: { error, executionTimeMs, params },
    });

    return {
      success: false,
      error,
      approvalRequired: validated.type === "write",
      approved: validated.type === "write" ? true : undefined,
      operation,
      service,
      timestamp,
      executionTimeMs,
    };
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/**
 * Extract a human-readable target identifier from operation params.
 */
function extractTarget(
  service: string,
  params: Record<string, unknown>
): string {
  if (params.repo) return String(params.repo);
  if (params.projectId) return String(params.projectId);
  if (params.serviceId) return String(params.serviceId);
  if (params.deploymentId) return String(params.deploymentId);
  if (params.tableName) return String(params.tableName);
  if (params.userId) return String(params.userId);
  if (params.bucket) return String(params.bucket);
  if (params.name) return String(params.name);
  if (params.path) return String(params.path);
  return `${service}:unknown`;
}

/**
 * Remove trailing undefined values from an array.
 * This allows optional parameters to work correctly.
 */
function trimTrailingUndefined(arr: unknown[]): unknown[] {
  let end = arr.length;
  while (end > 0 && arr[end - 1] === undefined) {
    end--;
  }
  return arr.slice(0, end);
}

/**
 * Get statistics about the MCP system.
 * Useful for monitoring and diagnostics.
 */
export function getMCPStats(): {
  services: number;
  totalOperations: number;
  readOperations: number;
  writeOperations: number;
} {
  let totalOps = 0;
  let readOps = 0;
  let writeOps = 0;

  for (const svc of Object.values(MCP_OPERATIONS)) {
    readOps += svc.read.length;
    writeOps += svc.write.length;
    totalOps += svc.read.length + svc.write.length;
  }

  return {
    services: Object.keys(MCP_OPERATIONS).length,
    totalOperations: totalOps,
    readOperations: readOps,
    writeOperations: writeOps,
  };
}

/**
 * Check if a service is healthy (has required credentials configured).
 *
 * @param service - Service to check
 * @returns true if the service is configured and ready
 */
export function isServiceHealthy(service: MCPService): boolean {
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
 * Health check for all MCP services.
 *
 * @returns Record of service health status
 */
export function healthCheck(): Record<MCPService, boolean> {
  return {
    github: isServiceHealthy("github"),
    railway: isServiceHealthy("railway"),
    supabase: isServiceHealthy("supabase"),
  };
}
