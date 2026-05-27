/**
 * API Route – /api/jarvis/init
 *
 * Inicialización automática de JARVIS.
 * Crea tablas, inserta config por defecto, y verifica estado.
 * Seguro para ejecutar múltiples veces (idempotente).
 *
 * POST – Ejecuta la inicialización completa
 * GET  – Verifica el estado actual sin modificar nada
 *
 * @module app/api/jarvis/init/route
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/service";
import { JARVIS_INIT_SQL, DEFAULT_CONFIG_ROWS, DEFAULT_AUTONOMOUS_TASKS } from "@/lib/jarvis/init-sql";

// ============================================================================
// Constants
// ============================================================================

/** Tables managed by JARVIS */
const JARVIS_TABLES = [
  "jarvis_config",
  "jarvis_conversation_memory",
  "jarvis_audit_log",
  "jarvis_autonomous_tasks",
];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if a table exists in the database
 */
async function tableExists(supabase: any, tableName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("information_schema.tables")
    .select("table_name")
    .eq("table_schema", "public")
    .eq("table_name", tableName)
    .maybeSingle();

  return !error && !!data;
}

/**
 * Execute raw SQL via RPC if available, otherwise use workarounds
 */
async function execSql(supabase: any, sql: string): Promise<{ success: boolean; error?: string }> {
  // Try RPC first (requires exec_sql function in Supabase)
  const { error } = await supabase.rpc("exec_sql", { query: sql });
  if (!error) return { success: true };

  // Fallback: try via REST API
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return { success: false, error: "Missing Supabase credentials" };

    const response = await fetch(`${url}/rest/v1/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
        "apikey": key,
        "Prefer": "params=single-object",
      },
      body: JSON.stringify({ query: sql }),
    });

    if (response.ok) return { success: true };
    return { success: false, error: `HTTP ${response.status}: ${await response.text()}` };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Seed default config values (idempotent)
 */
async function seedConfig(supabase: any): Promise<{ inserted: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0;

  for (const row of DEFAULT_CONFIG_ROWS) {
    const { error } = await supabase
      .from("jarvis_config")
      .upsert(
        {
          key: row.key,
          value: row.value,
          category: row.category,
          description: row.description,
          is_encrypted: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

    if (error) {
      errors.push(`${row.key}: ${error.message}`);
    } else {
      inserted++;
    }
  }

  return { inserted, errors };
}

/**
 * Seed default autonomous tasks (idempotent)
 */
async function seedTasks(supabase: any): Promise<{ inserted: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0;

  for (const task of DEFAULT_AUTONOMOUS_TASKS) {
    const { error } = await supabase
      .from("jarvis_autonomous_tasks")
      .upsert(
        {
          id: task.id,
          name: task.name,
          description: task.description,
          interval_ms: task.interval_ms,
          is_enabled: true,
          error_count: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (error) {
      errors.push(`${task.id}: ${error.message}`);
    } else {
      inserted++;
    }
  }

  return { inserted, errors };
}

// ============================================================================
// GET – Check status without modifying anything
// ============================================================================

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseService();
    const results: Record<string, boolean> = {};

    for (const table of JARVIS_TABLES) {
      results[table] = await tableExists(supabase, table);
    }

    const allReady = Object.values(results).every(Boolean);

    return NextResponse.json(
      {
        status: allReady ? "ready" : "pending",
        tables: results,
        message: allReady
          ? "JARVIS is fully initialized and ready"
          : "Some tables are missing. POST to this endpoint to initialize.",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST – Initialize JARVIS (idempotent)
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const steps: Array<{
    step: string;
    status: "ok" | "error" | "skipped";
    message: string;
  }> = [];
  const errors: string[] = [];

  try {
    const supabase = getSupabaseService();

    // ── Step 1: Verify Supabase connection ──────────────────────────────────
    const { error: connError } = await supabase.from("information_schema.tables").select("table_name").limit(1);
    if (connError) {
      steps.push({ step: "supabase-connection", status: "error", message: connError.message });
      return NextResponse.json({ success: false, steps, errors: [connError.message] }, { status: 500 });
    }
    steps.push({ step: "supabase-connection", status: "ok", message: "Connected to Supabase" });

    // ── Step 2: Create jarvis_config table ──────────────────────────────────
    const configExists = await tableExists(supabase, "jarvis_config");
    if (!configExists) {
      const result = await execSql(supabase, JARVIS_INIT_SQL.createConfigTable);
      if (result.success) {
        steps.push({ step: "create-config-table", status: "ok", message: "Created jarvis_config" });
      } else {
        steps.push({ step: "create-config-table", status: "error", message: result.error || "Unknown error" });
        errors.push(`Config table: ${result.error}`);
      }
    } else {
      steps.push({ step: "create-config-table", status: "skipped", message: "Already exists" });
    }

    // ── Step 3: Create jarvis_conversation_memory table ─────────────────────
    const memoryExists = await tableExists(supabase, "jarvis_conversation_memory");
    if (!memoryExists) {
      const result = await execSql(supabase, JARVIS_INIT_SQL.createMemoryTable);
      if (result.success) {
        steps.push({ step: "create-memory-table", status: "ok", message: "Created jarvis_conversation_memory" });
      } else {
        steps.push({ step: "create-memory-table", status: "error", message: result.error || "Unknown error" });
        errors.push(`Memory table: ${result.error}`);
      }
    } else {
      steps.push({ step: "create-memory-table", status: "skipped", message: "Already exists" });
    }

    // ── Step 4: Create jarvis_audit_log table ───────────────────────────────
    const auditExists = await tableExists(supabase, "jarvis_audit_log");
    if (!auditExists) {
      const result = await execSql(supabase, JARVIS_INIT_SQL.createAuditTable);
      if (result.success) {
        steps.push({ step: "create-audit-table", status: "ok", message: "Created jarvis_audit_log" });
      } else {
        steps.push({ step: "create-audit-table", status: "error", message: result.error || "Unknown error" });
        errors.push(`Audit table: ${result.error}`);
      }
    } else {
      steps.push({ step: "create-audit-table", status: "skipped", message: "Already exists" });
    }

    // ── Step 5: Create jarvis_autonomous_tasks table ────────────────────────
    const tasksExists = await tableExists(supabase, "jarvis_autonomous_tasks");
    if (!tasksExists) {
      const result = await execSql(supabase, JARVIS_INIT_SQL.createTasksTable);
      if (result.success) {
        steps.push({ step: "create-tasks-table", status: "ok", message: "Created jarvis_autonomous_tasks" });
      } else {
        steps.push({ step: "create-tasks-table", status: "error", message: result.error || "Unknown error" });
        errors.push(`Tasks table: ${result.error}`);
      }
    } else {
      steps.push({ step: "create-tasks-table", status: "skipped", message: "Already exists" });
    }

    // ── Step 6: Seed default config ─────────────────────────────────────────
    const configSeeded = await seedConfig(supabase);
    steps.push({
      step: "seed-config",
      status: configSeeded.errors.length === 0 ? "ok" : "error",
      message: `Inserted ${configSeeded.inserted}/${DEFAULT_CONFIG_ROWS.length} config rows`,
    });
    if (configSeeded.errors.length > 0) errors.push(...configSeeded.errors);

    // ── Step 7: Seed default autonomous tasks ───────────────────────────────
    const tasksSeeded = await seedTasks(supabase);
    steps.push({
      step: "seed-tasks",
      status: tasksSeeded.errors.length === 0 ? "ok" : "error",
      message: `Inserted ${tasksSeeded.inserted}/${DEFAULT_AUTONOMOUS_TASKS.length} tasks`,
    });
    if (tasksSeeded.errors.length > 0) errors.push(...tasksSeeded.errors);

    // ── Determine overall success ───────────────────────────────────────────
    const criticalSteps = ["supabase-connection"];
    const allCriticalOk = criticalSteps.every((s) =>
      steps.find((st) => st.step === s)?.status === "ok"
    );

    return NextResponse.json(
      {
        success: allCriticalOk,
        steps,
        errors,
        summary: {
          tablesCreated: steps.filter((s) => s.status === "ok" && s.step.startsWith("create-")).length,
          tablesSkipped: steps.filter((s) => s.status === "skipped").length,
          configRows: configSeeded.inserted,
          taskRows: tasksSeeded.inserted,
        },
      },
      { status: allCriticalOk ? 200 : 500 }
    );
  } catch (error) {
    const message = (error as Error).message;
    steps.push({ step: "fatal", status: "error", message });
    return NextResponse.json({ success: false, steps, errors: [message] }, { status: 500 });
  }
}
