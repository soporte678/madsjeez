/**
 * MCP (Model Context Protocol) Integration for JARVIS
 *
 * This barrel file exports all MCP connectors and the orchestrator,
 * providing a unified interface for JARVIS to interact with:
 * - GitHub (repository management)
 * - Railway (deployment management)
 * - Supabase (database management)
 *
 * All write operations are governed by the governance system.
 *
 * @example
 * ```typescript
 * import { executeMCPOperation, requiresApproval, getAvailableOperations } from "./mcp";
 *
 * // List available operations
 * const ops = getAvailableOperations();
 *
 * // Check if an operation needs approval
 * if (requiresApproval("github", "mergePullRequest")) {
 *   console.log("This will require human approval");
 * }
 *
 * // Execute an operation
 * const result = await executeMCPOperation("github", "listCommits", {
 *   repo: "owner/repo",
 *   branch: "main",
 *   limit: 10
 * });
 *
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 */

// ─── Orchestrator (Primary API) ──────────────────────────────────────────────

export {
  /** Execute an MCP operation with governance checks */
  executeMCPOperation,
  /** Check if an operation requires human approval */
  requiresApproval,
  /** Get all available operations organized by service */
  getAvailableOperations,
  /** Get system statistics */
  getMCPStats,
  /** Check if a specific service is healthy */
  isServiceHealthy,
  /** Check health of all MCP services */
  healthCheck,
  /** Registry of all MCP operations */
  MCP_OPERATIONS,
} from "./mcp-orchestrator";

// ─── Type Exports ────────────────────────────────────────────────────────────

export type {
  /** MCP Service names */
  MCPService,
  /** Operation classification */
  OperationType,
  /** Standard MCP result wrapper */
  MCPResult,
  /** Approval request structure */
  ApprovalRequest,
} from "./mcp-orchestrator";

// ─── GitHub Connector ────────────────────────────────────────────────────────

export {
  // Read operations
  getRepositoryInfo,
  listCommits,
  getFileContent,
  listDirectory,
  getIssues,
  getPullRequests,
  getWorkflowRuns,
  getRepositoryBranches,
  // Write operations
  createCommit,
  createPullRequest,
  mergePullRequest,
  createIssue,
  closeIssue,
  triggerWorkflow,
} from "./github-mcp";

export type {
  GitHubAction,
  RepoRef,
  CommitInfo,
  IssueInfo,
  PullRequestInfo,
  WorkflowRunInfo,
  FileContent,
  DirectoryEntry,
} from "./github-mcp";

// ─── Railway Connector ───────────────────────────────────────────────────────

export {
  // Read operations
  getProjects,
  getProject,
  getServices,
  getService,
  getDeployments,
  getDeploymentLogs,
  getEnvironmentVariables,
  getServiceMetrics,
  // Write operations
  deployService,
  redeployService,
  setEnvironmentVariable,
  scaleService,
  rollbackDeployment,
} from "./railway-mcp";

export type {
  RailwayProject,
  RailwayService,
  RailwayDeployment,
  ServiceMetrics,
} from "./railway-mcp";

// ─── Supabase Connector ──────────────────────────────────────────────────────

export {
  // Read operations
  executeQuery,
  listTables,
  getTableSchema,
  getTableStats,
  getSlowQueries,
  getActiveConnections,
  getDatabaseSize,
  getRowCount,
  // Write operations
  createTable,
  alterTable,
  createIndex,
  vacuumTable,
  analyzeTable,
  // Auth management
  listUsers,
  getUserById,
  deleteUser,
  // Storage
  listBuckets,
  listFiles,
} from "./supabase-mcp";

export type {
  ColumnDef,
  AlterChange,
  SchemaColumn,
  TableStats,
  SlowQuery,
  UserInfo,
  BucketInfo,
} from "./supabase-mcp";
