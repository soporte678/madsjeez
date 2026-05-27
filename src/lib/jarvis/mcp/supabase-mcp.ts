/**
 * Supabase MCP Connector
 * Allows JARVIS to manage Supabase databases
 * All write and destructive operations require governance approval via the orchestrator
 *
 * @module supabase-mcp
 * @requires governance/auditor for security logging
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logSecurityEvent } from "../governance/auditor";

// ─── Configuration ───────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.warn(
    "[Supabase MCP] SUPABASE_URL environment variable is not set. " +
      "Supabase operations will fail."
  );
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[Supabase MCP] SUPABASE_SERVICE_ROLE_KEY environment variable is not set. " +
      "Supabase operations will fail."
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

/** Column definition for creating tables */
export interface ColumnDef {
  name: string;
  type: string;
  nullable?: boolean;
  default?: string;
  primary?: boolean;
  unique?: boolean;
  references?: {
    table: string;
    column: string;
  };
}

/** Table alteration change types */
export type AlterChange =
  | { type: "add_column"; column: ColumnDef }
  | { type: "drop_column"; columnName: string }
  | { type: "rename_column"; oldName: string; newName: string }
  | { type: "alter_column"; columnName: string; newType: string }
  | { type: "set_default"; columnName: string; defaultValue: string }
  | { type: "drop_default"; columnName: string };

/** Table schema column info */
export interface SchemaColumn {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  columnDefault: string | null;
  isPrimaryKey: boolean;
  foreignKey?: {
    referencesTable: string;
    referencesColumn: string;
  };
}

/** Table statistics */
export interface TableStats {
  tableName: string;
  rowCount: number;
  totalSize: string;
  indexSize: string;
  toastSize: string;
  lastVacuum: string | null;
  lastAnalyze: string | null;
}

/** Slow query entry */
export interface SlowQuery {
  query: string;
  meanTimeMs: number;
  calls: number;
  rows: number;
}

/** Minimal user info from Supabase Auth */
export interface UserInfo {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  confirmedAt: string | null;
  role: string;
}

/** Bucket info */
export interface BucketInfo {
  id: string;
  name: string;
  public: boolean;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
  size: number;
}

// ─── Singleton Client ────────────────────────────────────────────────────────

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create the Supabase client instance (singleton).
 */
function getClient(): SupabaseClient {
  if (!supabaseClient) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "Supabase credentials missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
      );
    }
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseClient;
}

/**
 * Log an operation event to the security audit system.
 */
function logOperation(
  operation: string,
  target: string,
  status: "success" | "failure",
  details?: Record<string, unknown>
): void {
  logSecurityEvent({
    service: "supabase",
    operation,
    target,
    status,
    timestamp: new Date().toISOString(),
    details,
  }).catch((err) => {
    console.error(`[Supabase MCP] Audit logging failed: ${err.message}`);
  });
}

/**
 * Check if a query contains destructive operations.
 * Used as an additional safety layer even for raw queries.
 */
function containsDestructiveSQL(query: string): boolean {
  const destructive = [
    /\bDROP\b/i,
    /\bDELETE\b/i,
    /\bTRUNCATE\b/i,
    /\bALTER\s+.*\bDROP\b/i,
  ];
  return destructive.some((pattern) => pattern.test(query));
}

// ═══════════════════════════════════════════════════════════════════════════════
// READ OPERATIONS — Safe, no approval required
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Execute a read-only SQL query against the database.
 * Only SELECT and EXPLAIN queries are allowed.
 *
 * @param query - SQL query (must be SELECT or EXPLAIN)
 * @param params - Query parameters
 * @returns Query results as array of row objects
 */
export async function executeQuery(
  query: string,
  params?: unknown[]
): Promise<unknown[]> {
  // Safety: reject non-read queries
  const trimmed = query.trim().toUpperCase();
  if (!trimmed.startsWith("SELECT") && !trimmed.startsWith("EXPLAIN")) {
    throw new Error(
      "Only SELECT and EXPLAIN queries are allowed through executeQuery. " +
        "Use dedicated write functions for modifications."
    );
  }

  if (containsDestructiveSQL(query)) {
    throw new Error("Query contains potentially destructive SQL patterns.");
  }

  try {
    const { data, error } = await getClient().rpc("exec_sql", {
      query_text: query,
      query_params: params || [],
    });

    if (error) {
      throw new Error(`Query failed: ${error.message}`);
    }

    const results = (data as unknown[]) || [];
    logOperation("executeQuery", "database", "success", {
      queryPreview: query.slice(0, 100),
      rowCount: results.length,
    });
    return results;
  } catch (error) {
    logOperation("executeQuery", "database", "failure", {
      queryPreview: query.slice(0, 100),
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * List all user tables in the public schema (excludes system tables).
 *
 * @returns Array of table names
 */
export async function listTables(): Promise<string[]> {
  try {
    const { data, error } = await getClient()
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_type", "BASE TABLE");

    if (error) {
      throw new Error(`Failed to list tables: ${error.message}`);
    }

    // Filter out Supabase system tables
    const systemTables = [
      "pg_stat_statements",
      "schema_migrations",
      "spatial_ref_sys",
    ];
    const tables = (data || [])
      .map((row: { table_name: string }) => row.table_name)
      .filter((name) => !name.startsWith("pg_") && !systemTables.includes(name));

    logOperation("listTables", "database", "success", { count: tables.length });
    return tables;
  } catch (error) {
    logOperation("listTables", "database", "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get the schema definition for a table.
 *
 * @param tableName - Name of the table
 * @returns Array of column definitions
 */
export async function getTableSchema(tableName: string): Promise<SchemaColumn[]> {
  try {
    // Get columns
    const { data: columns, error: colError } = await getClient()
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable, column_default")
      .eq("table_schema", "public")
      .eq("table_name", tableName);

    if (colError) {
      throw new Error(`Failed to get columns: ${colError.message}`);
    }

    // Get primary key info
    const { data: pkData } = await getClient().rpc("exec_sql", {
      query_text: `
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
          AND tc.table_name = $1
          AND tc.constraint_type = 'PRIMARY KEY'
      `,
      query_params: [tableName],
    });

    const pkColumns = new Set(
      ((pkData as Array<{ column_name: string }>) || []).map(
        (row) => row.column_name
      )
    );

    // Get foreign key info
    const { data: fkData } = await getClient().rpc("exec_sql", {
      query_text: `
        SELECT
          kcu.column_name,
          ccu.table_name AS references_table,
          ccu.column_name AS references_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_schema = 'public'
          AND tc.table_name = $1
          AND tc.constraint_type = 'FOREIGN KEY'
      `,
      query_params: [tableName],
    });

    const fkMap = new Map<string, { table: string; column: string }>();
    (
      (fkData as Array<{
        column_name: string;
        references_table: string;
        references_column: string;
      }>) || []
    ).forEach((row) => {
      fkMap.set(row.column_name, {
        table: row.references_table,
        column: row.references_column,
      });
    });

    const schema: SchemaColumn[] = (columns || []).map(
      (col: {
        column_name: string;
        data_type: string;
        is_nullable: string;
        column_default: string | null;
      }) => ({
        columnName: col.column_name,
        dataType: col.data_type,
        isNullable: col.is_nullable === "YES",
        columnDefault: col.column_default,
        isPrimaryKey: pkColumns.has(col.column_name),
        foreignKey: fkMap.get(col.column_name),
      })
    );

    logOperation("getTableSchema", tableName, "success", {
      columns: schema.length,
    });
    return schema;
  } catch (error) {
    logOperation("getTableSchema", tableName, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get statistics for a table.
 *
 * @param tableName - Name of the table
 * @returns Table statistics
 */
export async function getTableStats(tableName: string): Promise<TableStats> {
  try {
    const { data, error } = await getClient().rpc("exec_sql", {
      query_text: `
        SELECT
          relname AS table_name,
          n_live_tup AS row_count,
          pg_size_pretty(pg_total_relation_size($1)) AS total_size,
          pg_size_pretty(pg_indexes_size($1)) AS index_size,
          pg_size_pretty(pg_total_relation_size($1) - pg_relation_size($1)) AS toast_size,
          last_vacuum::text,
          last_analyze::text
        FROM pg_stat_user_tables
        WHERE relname = $1
      `,
      query_params: [tableName],
    });

    if (error) {
      throw new Error(`Failed to get table stats: ${error.message}`);
    }

    const rows = data as Array<{
      table_name: string;
      row_count: number;
      total_size: string;
      index_size: string;
      toast_size: string;
      last_vacuum: string | null;
      last_analyze: string | null;
    }>;

    if (!rows || rows.length === 0) {
      return {
        tableName,
        rowCount: 0,
        totalSize: "0 bytes",
        indexSize: "0 bytes",
        toastSize: "0 bytes",
        lastVacuum: null,
        lastAnalyze: null,
      };
    }

    const row = rows[0];
    const stats: TableStats = {
      tableName: row.table_name,
      rowCount: row.row_count || 0,
      totalSize: row.total_size || "0 bytes",
      indexSize: row.index_size || "0 bytes",
      toastSize: row.toast_size || "0 bytes",
      lastVacuum: row.last_vacuum,
      lastAnalyze: row.last_analyze,
    };

    logOperation("getTableStats", tableName, "success", stats);
    return stats;
  } catch (error) {
    logOperation("getTableStats", tableName, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get slow-running queries from pg_stat_statements.
 *
 * @returns Array of slow query records
 */
export async function getSlowQueries(): Promise<SlowQuery[]> {
  try {
    const { data, error } = await getClient().rpc("exec_sql", {
      query_text: `
        SELECT
          query,
          mean_exec_time AS mean_time_ms,
          calls,
          rows
        FROM pg_stat_statements
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY mean_exec_time DESC
        LIMIT 20
      `,
      query_params: [],
    });

    if (error) {
      throw new Error(`Failed to get slow queries: ${error.message}`);
    }

    const queries: SlowQuery[] = (
      (data as Array<{
        query: string;
        mean_time_ms: number;
        calls: number;
        rows: number;
      }>) || []
    ).map((row) => ({
      query: row.query,
      meanTimeMs: Math.round(row.mean_time_ms * 100) / 100,
      calls: Number(row.calls),
      rows: Number(row.rows),
    }));

    logOperation("getSlowQueries", "database", "success", {
      count: queries.length,
    });
    return queries;
  } catch (error) {
    logOperation("getSlowQueries", "database", "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get the current number of active database connections.
 *
 * @returns Number of active connections
 */
export async function getActiveConnections(): Promise<number> {
  try {
    const { data, error } = await getClient().rpc("exec_sql", {
      query_text: `
        SELECT COUNT(*) AS count FROM pg_stat_activity
        WHERE state = 'active'
      `,
      query_params: [],
    });

    if (error) {
      throw new Error(`Failed to get connections: ${error.message}`);
    }

    const count = Number((data as Array<{ count: number }>)[0]?.count || 0);
    logOperation("getActiveConnections", "database", "success", { count });
    return count;
  } catch (error) {
    logOperation("getActiveConnections", "database", "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get the total database size.
 *
 * @returns Human-readable database size string
 */
export async function getDatabaseSize(): Promise<string> {
  try {
    const { data, error } = await getClient().rpc("exec_sql", {
      query_text: `
        SELECT pg_size_pretty(pg_database_size(current_database())) AS size
      `,
      query_params: [],
    });

    if (error) {
      throw new Error(`Failed to get database size: ${error.message}`);
    }

    const size = (data as Array<{ size: string }>)[0]?.size || "unknown";
    logOperation("getDatabaseSize", "database", "success", { size });
    return size;
  } catch (error) {
    logOperation("getDatabaseSize", "database", "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get the row count for a specific table.
 *
 * @param tableName - Name of the table
 * @returns Number of rows
 */
export async function getRowCount(tableName: string): Promise<number> {
  try {
    const { data, error } = await getClient().rpc("exec_sql", {
      query_text: `SELECT COUNT(*) AS count FROM "${tableName.replace(/"/g, '\\"')}"`,
      query_params: [],
    });

    if (error) {
      throw new Error(`Failed to get row count: ${error.message}`);
    }

    const count = Number((data as Array<{ count: number }>)[0]?.count || 0);
    logOperation("getRowCount", tableName, "success", { count });
    return count;
  } catch (error) {
    logOperation("getRowCount", tableName, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WRITE OPERATIONS — Require governance approval
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new table in the database.
 *
 * @param name - Table name
 * @param columns - Column definitions
 */
export async function createTable(
  name: string,
  columns: ColumnDef[]
): Promise<void> {
  if (!columns || columns.length === 0) {
    throw new Error("At least one column definition is required.");
  }

  // Sanitize table name
  const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, "");
  if (!sanitizedName) {
    throw new Error("Invalid table name.");
  }

  try {
    // Build column definitions
    const columnDefs = columns.map((col) => {
      const colName = col.name.replace(/[^a-zA-Z0-9_]/g, "");
      let def = `"${colName}" ${col.type}`;
      if (col.primary) {
        def += " PRIMARY KEY";
      }
      if (col.unique && !col.primary) {
        def += " UNIQUE";
      }
      if (col.default !== undefined) {
        def += ` DEFAULT ${col.default}`;
      }
      if (col.nullable === false && !col.primary) {
        def += " NOT NULL";
      }
      if (col.nullable !== false) {
        def += " NULL";
      }
      if (col.references) {
        def += ` REFERENCES "${col.references.table.replace(/[^a-zA-Z0-9_]/g, "")}"("${col.references.column.replace(/[^a-zA-Z0-9_]/g, "")}")`;
      }
      return def;
    });

    const sql = `CREATE TABLE IF NOT EXISTS "${sanitizedName}" (${columnDefs.join(", ")})`;

    const { error } = await getClient().rpc("exec_sql", {
      query_text: sql,
      query_params: [],
    });

    if (error) {
      throw new Error(`Failed to create table: ${error.message}`);
    }

    logOperation("createTable", sanitizedName, "success", {
      columns: columns.map((c) => c.name),
    });
  } catch (error) {
    logOperation("createTable", name, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Alter an existing table structure.
 *
 * @param name - Table name
 * @param changes - Array of alteration changes
 */
export async function alterTable(
  name: string,
  changes: AlterChange[]
): Promise<void> {
  if (!changes || changes.length === 0) {
    throw new Error("At least one alteration change is required.");
  }

  const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, "");

  try {
    for (const change of changes) {
      let sql = "";

      switch (change.type) {
        case "add_column": {
          const col = change.column;
          const colName = col.name.replace(/[^a-zA-Z0-9_]/g, "");
          sql = `ALTER TABLE "${sanitizedName}" ADD COLUMN "${colName}" ${col.type}`;
          if (col.nullable === false) sql += " NOT NULL";
          if (col.default !== undefined) sql += ` DEFAULT ${col.default}`;
          break;
        }
        case "drop_column": {
          const dropName = change.columnName.replace(/[^a-zA-Z0-9_]/g, "");
          sql = `ALTER TABLE "${sanitizedName}" DROP COLUMN "${dropName}"`;
          break;
        }
        case "rename_column": {
          const oldName = change.oldName.replace(/[^a-zA-Z0-9_]/g, "");
          const newName = change.newName.replace(/[^a-zA-Z0-9_]/g, "");
          sql = `ALTER TABLE "${sanitizedName}" RENAME COLUMN "${oldName}" TO "${newName}"`;
          break;
        }
        case "alter_column": {
          const colName = change.columnName.replace(/[^a-zA-Z0-9_]/g, "");
          sql = `ALTER TABLE "${sanitizedName}" ALTER COLUMN "${colName}" TYPE ${change.newType}`;
          break;
        }
        case "set_default": {
          const colName = change.columnName.replace(/[^a-zA-Z0-9_]/g, "");
          sql = `ALTER TABLE "${sanitizedName}" ALTER COLUMN "${colName}" SET DEFAULT ${change.defaultValue}`;
          break;
        }
        case "drop_default": {
          const colName = change.columnName.replace(/[^a-zA-Z0-9_]/g, "");
          sql = `ALTER TABLE "${sanitizedName}" ALTER COLUMN "${colName}" DROP DEFAULT`;
          break;
        }
        default:
          throw new Error(`Unknown alteration type: ${(change as AlterChange).type}`);
      }

      const { error } = await getClient().rpc("exec_sql", {
        query_text: sql,
        query_params: [],
      });

      if (error) {
        throw new Error(`Failed to alter table: ${error.message}`);
      }
    }

    logOperation("alterTable", sanitizedName, "success", {
      changes: changes.map((c) => c.type),
    });
  } catch (error) {
    logOperation("alterTable", name, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Create an index on a table column.
 *
 * @param tableName - Table name
 * @param columnName - Column to index
 * @param indexName - Optional custom index name
 */
export async function createIndex(
  tableName: string,
  columnName: string,
  indexName?: string
): Promise<void> {
  const sanitizedTable = tableName.replace(/[^a-zA-Z0-9_]/g, "");
  const sanitizedColumn = columnName.replace(/[^a-zA-Z0-9_]/g, "");
  const idxName =
    indexName?.replace(/[^a-zA-Z0-9_]/g, "") ||
    `idx_${sanitizedTable}_${sanitizedColumn}`;

  try {
    const sql = `CREATE INDEX IF NOT EXISTS "${idxName}" ON "${sanitizedTable}"("${sanitizedColumn}")`;

    const { error } = await getClient().rpc("exec_sql", {
      query_text: sql,
      query_params: [],
    });

    if (error) {
      throw new Error(`Failed to create index: ${error.message}`);
    }

    logOperation("createIndex", sanitizedTable, "success", {
      column: sanitizedColumn,
      indexName: idxName,
    });
  } catch (error) {
    logOperation("createIndex", tableName, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Run VACUUM on a table to reclaim storage and update statistics.
 *
 * @param tableName - Table to vacuum
 */
export async function vacuumTable(tableName: string): Promise<void> {
  const sanitizedTable = tableName.replace(/[^a-zA-Z0-9_]/g, "");

  try {
    const { error } = await getClient().rpc("exec_sql", {
      query_text: `VACUUM ANALYZE "${sanitizedTable}"`,
      query_params: [],
    });

    if (error) {
      throw new Error(`Failed to vacuum table: ${error.message}`);
    }

    logOperation("vacuumTable", sanitizedTable, "success");
  } catch (error) {
    logOperation("vacuumTable", tableName, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Run ANALYZE on a table to update query planner statistics.
 *
 * @param tableName - Table to analyze
 */
export async function analyzeTable(tableName: string): Promise<void> {
  const sanitizedTable = tableName.replace(/[^a-zA-Z0-9_]/g, "");

  try {
    const { error } = await getClient().rpc("exec_sql", {
      query_text: `ANALYZE "${sanitizedTable}"`,
      query_params: [],
    });

    if (error) {
      throw new Error(`Failed to analyze table: ${error.message}`);
    }

    logOperation("analyzeTable", sanitizedTable, "success");
  } catch (error) {
    logOperation("analyzeTable", tableName, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH MANAGEMENT — Write operations require approval
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * List Supabase Auth users.
 *
 * @param limit - Maximum users to return
 * @returns Array of user info objects
 */
export async function listUsers(limit: number = 50): Promise<UserInfo[]> {
  try {
    const { data, error } = await getClient().auth.admin.listUsers({
      page: 1,
      perPage: Math.min(limit, 100),
    });

    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    const users: UserInfo[] = (data.users || []).map((user) => ({
      id: user.id,
      email: user.email || null,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at || null,
      confirmedAt: user.confirmed_at || null,
      role: user.role || "user",
    }));

    logOperation("listUsers", "auth", "success", { count: users.length });
    return users;
  } catch (error) {
    logOperation("listUsers", "auth", "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Get a single user by their ID.
 *
 * @param userId - Supabase user UUID
 * @returns User info object
 */
export async function getUserById(userId: string): Promise<UserInfo> {
  try {
    const { data, error } = await getClient().auth.admin.getUserById(userId);

    if (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }

    const user = data.user;
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const info: UserInfo = {
      id: user.id,
      email: user.email || null,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at || null,
      confirmedAt: user.confirmed_at || null,
      role: user.role || "user",
    };

    logOperation("getUserById", userId, "success");
    return info;
  } catch (error) {
    logOperation("getUserById", userId, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * Delete a user from Supabase Auth.
 * This is a DESTRUCTIVE operation requiring governance approval.
 *
 * @param userId - Supabase user UUID
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    const { error } = await getClient().auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    logOperation("deleteUser", userId, "success");
  } catch (error) {
    logOperation("deleteUser", userId, "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STORAGE OPERATIONS — Read operations
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * List all storage buckets.
 *
 * @returns Array of bucket info objects
 */
export async function listBuckets(): Promise<BucketInfo[]> {
  try {
    const { data, error } = await getClient().storage.listBuckets();

    if (error) {
      throw new Error(`Failed to list buckets: ${error.message}`);
    }

    const buckets: BucketInfo[] = (data || []).map((bucket) => ({
      id: bucket.id,
      name: bucket.name,
      public: bucket.public,
      createdAt: bucket.created_at,
      updatedAt: bucket.updated_at,
      fileCount: 0, // Supabase doesn't expose this directly
      size: 0,
    }));

    logOperation("listBuckets", "storage", "success", { count: buckets.length });
    return buckets;
  } catch (error) {
    logOperation("listBuckets", "storage", "failure", {
      error: (error as Error).message,
    });
    throw error;
  }
}

/**
 * List files in a storage bucket (optionally within a path).
 *
 * @param bucket - Bucket name
 * @param path - Optional folder path within the bucket
 * @returns Array of file paths
 */
export async function listFiles(
  bucket: string,
  path?: string
): Promise<string[]> {
  try {
    const { data, error } = await getClient().storage
      .from(bucket)
      .list(path || "");

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    const files = (data || []).map(
      (item) => (path ? `${path}/` : "") + item.name
    );

    logOperation("listFiles", bucket, "success", { path, count: files.length });
    return files;
  } catch (error) {
    logOperation("listFiles", bucket, "failure", {
      path,
      error: (error as Error).message,
    });
    throw error;
  }
}
