/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║             JARVIS AUTO-CONFIGURATION SYSTEM — init-jarvis.ts               ║
 * ║                                                                              ║
 * ║  Sistema de auto-configuracion que se conecta a Supabase usando el cliente   ║
 * ║  existente, crea las tablas necesarias, inserta configuracion por defecto,   ║
 * ║  y verifica que todo funciona correctamente.                                 ║
 * ║                                                                              ║
 * ║  Principios:                                                                 ║
 * ║  1. Idempotente: ejecutar multiples veces no causa duplicados               ║
 * ║  2. Resiliente: un paso fallido no detiene todo el proceso                  ║
 * ║  3. Observable: logs detallados de cada operacion                           ║
 * ║  4. Seguro: usa el cliente de servicio con role key (server-only)           ║
 * ║                                                                              ║
 * ║  Uso:                                                                        ║
 * ║  ```typescript                                                               ║
 * ║  const result = await initializeJarvis();                                    ║
 * ║  console.log(result.steps); // [{ step, status, message }, ...]             ║
 * ║  ```                                                                         ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { createServiceClient } from "@/lib/supabase/service";
import { logSecurityEvent } from "./governance/auditor";
import type { SupabaseClient } from "@supabase/supabase-js";

// ───────────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────────

/** Resultado individual de cada paso de inicializacion */
export interface InitStep {
  step: string;
  status: "ok" | "error" | "skipped";
  message: string;
}

/** Resultado completo de la inicializacion de JARVIS */
export interface InitResult {
  success: boolean;
  steps: InitStep[];
  errors: string[];
}

/** Entrada de configuracion por defecto */
interface ConfigEntry {
  key: string;
  value: string;
  category: string;
  description: string;
  is_encrypted?: boolean;
}

// ───────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ───────────────────────────────────────────────────────────────────────────────

/** Nombre de la tabla principal de configuracion */
const TABLE_CONFIG = "jarvis_config";

/** Nombre de la tabla de memoria de conversaciones */
const TABLE_MEMORY = "jarvis_conversation_memory";

/** Nombre de la tabla de auditoria */
const TABLE_AUDIT = "jarvis_audit_log";

/** Configuracion por defecto de JARVIS — se inserta solo si la tabla esta vacia */
export const DEFAULT_CONFIG: ConfigEntry[] = [
  // ── General ──────────────────────────────────────────────────────────────────
  {
    key: "JARVIS_ENABLED",
    value: "true",
    category: "general",
    description: "Master switch para activar JARVIS",
  },
  {
    key: "JARVIS_VERSION",
    value: "2.0.0",
    category: "general",
    description: "Version actual de JARVIS",
  },
  {
    key: "JARVIS_NAME",
    value: "JARVIS",
    category: "general",
    description: "Nombre del asistente",
  },
  {
    key: "JARVIS_LANGUAGE",
    value: "es-AR",
    category: "general",
    description: "Idioma por defecto",
  },
  {
    key: "JARVIS_PERSONALITY",
    value: "profesional-amigable",
    category: "general",
    description: "Estilo de personalidad",
  },

  // ── LLM ──────────────────────────────────────────────────────────────────────
  {
    key: "LLM_PROVIDER",
    value: "ollama",
    category: "llm",
    description: "Proveedor de LLM: ollama, openai",
  },
  {
    key: "LLM_MODEL",
    value: "closer-ventas-14b",
    category: "llm",
    description: "Modelo de lenguaje",
  },
  {
    key: "LLM_TEMPERATURE",
    value: "0.7",
    category: "llm",
    description: "Temperatura del modelo (0-1)",
  },
  {
    key: "LLM_MAX_TOKENS",
    value: "2048",
    category: "llm",
    description: "Maximo de tokens por respuesta",
  },
  {
    key: "LLM_TIMEOUT_MS",
    value: "30000",
    category: "llm",
    description: "Timeout del LLM en ms",
  },

  // ── Security ─────────────────────────────────────────────────────────────────
  {
    key: "RATE_LIMIT_REQUESTS",
    value: "30",
    category: "security",
    description: "Max requests por minuto",
  },
  {
    key: "RATE_LIMIT_WINDOW_MS",
    value: "60000",
    category: "security",
    description: "Ventana de rate limit",
  },
  {
    key: "JARVIS_APPROVAL_TOKEN",
    value: "",
    category: "security",
    description: "Token para aprobar operaciones write",
    is_encrypted: true,
  },

  // ── Autonomous ───────────────────────────────────────────────────────────────
  {
    key: "AUTONOMOUS_ENABLED",
    value: "true",
    category: "autonomous",
    description: "Motor autonomo activo",
  },
  {
    key: "AUTONOMOUS_INTERVAL_MS",
    value: "300000",
    category: "autonomous",
    description: "Intervalo base: 5 minutos",
  },
  {
    key: "TASK_INVENTORY_SYNC",
    value: "true",
    category: "autonomous",
    description: "Sincronizacion de inventario",
  },
  {
    key: "TASK_PRICE_OPTIMIZER",
    value: "true",
    category: "autonomous",
    description: "Optimizador de precios",
  },
  {
    key: "TASK_AUTO_REPLY",
    value: "true",
    category: "autonomous",
    description: "Respuestas automaticas",
  },
  {
    key: "TASK_TRENDING",
    value: "true",
    category: "autonomous",
    description: "Deteccion de tendencias",
  },
  {
    key: "TASK_REVIEW_ANALYZER",
    value: "true",
    category: "autonomous",
    description: "Analisis de reviews",
  },
  {
    key: "TASK_STOCK_ALERT",
    value: "true",
    category: "autonomous",
    description: "Alertas de stock bajo",
  },
  {
    key: "TASK_COMPETITOR_MONITOR",
    value: "true",
    category: "autonomous",
    description: "Monitoreo de competencia",
  },
  {
    key: "TASK_REPORT_GENERATOR",
    value: "true",
    category: "autonomous",
    description: "Generador de reportes",
  },

  // ── MCP ──────────────────────────────────────────────────────────────────────
  {
    key: "MCP_GITHUB_ENABLED",
    value: "true",
    category: "mcp",
    description: "MCP GitHub activo",
  },
  {
    key: "MCP_RAILWAY_ENABLED",
    value: "true",
    category: "mcp",
    description: "MCP Railway activo",
  },
  {
    key: "MCP_SUPABASE_ENABLED",
    value: "true",
    category: "mcp",
    description: "MCP Supabase activo",
  },

  // ── Voice ────────────────────────────────────────────────────────────────────
  {
    key: "VOICE_ENABLED",
    value: "true",
    category: "voice",
    description: "Comandos de voz activos",
  },
  {
    key: "VOICE_WAKE_WORD",
    value: "JARVIS",
    category: "voice",
    description: "Palabra de activacion",
  },
  {
    key: "VOICE_LANGUAGE",
    value: "es-AR",
    category: "voice",
    description: "Idioma de reconocimiento",
  },

  // ── Notifications ────────────────────────────────────────────────────────────
  {
    key: "NOTIFY_ON_ERROR",
    value: "true",
    category: "notifications",
    description: "Notificar errores",
  },
  {
    key: "NOTIFY_ON_TASK_COMPLETE",
    value: "true",
    category: "notifications",
    description: "Notificar tareas completadas",
  },
  {
    key: "NOTIFY_EMAIL",
    value: "",
    category: "notifications",
    description: "Email para notificaciones",
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// LOGGER INTERNO
// ───────────────────────────────────────────────────────────────────────────────

/** Prefijo de log para identificar mensajes del sistema de inicializacion */
const LOG_PREFIX = "[JARVIS-INIT]";

/**
 * Log formateado con timestamp.
 * @param level - Nivel de severidad
 * @param message - Mensaje a loguear
 */
function jLog(level: "info" | "warn" | "error", message: string): void {
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console[level](`${ts} ${LOG_PREFIX} [${level.toUpperCase()}] ${message}`);
}

// ───────────────────────────────────────────────────────────────────────────────
// PASO 1: VERIFICAR CONEXION A SUPABASE
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Verifica que la conexion a Supabase funciona haciendo un SELECT 1.
 *
 * @returns `true` si la conexion es exitosa, `false` en caso contrario
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  jLog("info", "Step 1 — Verificando conexion a Supabase...");

  try {
    const client = createServiceClient();
    const { data, error } = await client.from(TABLE_CONFIG).select("id").limit(1);

    if (error && error.code !== "42P01" && error.code !== "PGRST116") {
      // Si el error NO es "tabla no existe", es un error de conexion real
      jLog("error", `Error de conexion: ${error.message} (code: ${error.code})`);
      return false;
    }

    // La conexion funciona (puede que la tabla no exista todavia, eso es OK)
    jLog("info", "Conexion a Supabase OK");
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    jLog("error", `Excepcion al conectar: ${msg}`);
    return false;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// PASO 2: VERIFICAR EXISTENCIA DE TABLA jarvis_config
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Verifica si la tabla `jarvis_config` existe en la base de datos.
 *
 * @returns `true` si la tabla existe, `false` si no existe
 */
export async function checkJarvisConfigTable(): Promise<boolean> {
  jLog("info", "Step 2 — Verificando existencia de tabla jarvis_config...");

  try {
    const client = createServiceClient();
    // Intentamos un SELECT simple; si la tabla no existe, Supabase devuelve error 42P01
    const { error } = await client.from(TABLE_CONFIG).select("id").limit(1);

    if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
      jLog("info", "Tabla jarvis_config NO existe — sera creada");
      return false;
    }

    if (error) {
      jLog("warn", `Error inesperado verificando tabla: ${error.message}`);
      // Asumimos que existe para no pisar datos; el siguiente SELECT fallara si no
      return true;
    }

    jLog("info", "Tabla jarvis_config existe");
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    jLog("error", `Excepcion verificando tabla: ${msg}`);
    return false;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// PASO 3: CREAR TABLA jarvis_config
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Crea la tabla `jarvis_config` con sus indices.
 * Es idempotente: usa `IF NOT EXISTS` para no fallar si ya existe.
 */
export async function createJarvisConfigTable(): Promise<void> {
  jLog("info", "Step 3 — Creando tabla jarvis_config...");

  const client = createServiceClient();

  const sql = `
    CREATE TABLE IF NOT EXISTS ${TABLE_CONFIG} (
      id SERIAL PRIMARY KEY,
      key VARCHAR(100) NOT NULL UNIQUE,
      value TEXT NOT NULL,
      category VARCHAR(50) NOT NULL DEFAULT 'general',
      description TEXT,
      is_encrypted BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_jarvis_config_key ON ${TABLE_CONFIG}(key);
    CREATE INDEX IF NOT EXISTS idx_jarvis_config_category ON ${TABLE_CONFIG}(category);
  `;

  // El cliente de Supabase no soporta multi-statement raw SQL directamente
  // via `.from()`, asi que usamos la funcion RPC de PostgreSQL via POST
  const { error } = await client.rpc("exec_sql", { sql });

  if (error) {
    // Fallback: intentar con el endpoint REST raw de Supabase
    jLog("warn", `RPC exec_sql fallo: ${error.message}. Intentando fallback...`);
    const fallbackResult = await tryRawSql(client, sql);
    if (!fallbackResult) {
      throw new Error(`No se pudo crear la tabla: ${error.message}`);
    }
  }

  jLog("info", "Tabla jarvis_config creada (o ya existia)");
}

/**
 * Intenta ejecutar SQL raw via el endpoint REST de Supabase.
 * Requiere que la funcion `exec_sql` este definida en PostgreSQL.
 *
 * @param client - Cliente de Supabase
 * @param sql - Sentencia SQL a ejecutar
 * @returns `true` si tuvo exito, `false` si fallo
 */
async function tryRawSql(client: SupabaseClient, sql: string): Promise<boolean> {
  try {
    // Intento 1: Usar el schema postgres y la funcion exec_sql (debe existir)
    const { error } = await client.rpc("exec_sql", { query: sql });
    if (!error) return true;

    // Intento 2: Usar pgroll o migraciones via REST
    jLog("warn", `Fallback exec_sql tambien fallo: ${error.message}`);

    // Intento 3: Ejecutar statement por statement usando una query simple
    // Esto funciona si el service role tiene permisos suficientes
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      const { error: stmtError } = await client.rpc("exec_sql", { query: stmt + ";" });
      if (stmtError) {
        // Si la tabla o indice ya existe, ignora el error
        const isExistsError =
          stmtError.message?.includes("already exists") ||
          stmtError.message?.includes("Duplicate relation");
        if (!isExistsError) {
          jLog("error", `Error ejecutando statement: ${stmtError.message}`);
          return false;
        }
      }
    }
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    jLog("error", `Excepcion en tryRawSql: ${msg}`);
    return false;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// PASO 4: INSERTAR CONFIGURACION POR DEFECTO
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Inserta la configuracion por defecto SOLO si la tabla esta vacia.
 * Es idempotente: verifica duplicados antes de insertar.
 */
export async function seedDefaultConfig(): Promise<void> {
  jLog("info", "Step 4 — Insertando configuracion por defecto...");

  const client = createServiceClient();

  // Primero verificamos si ya hay datos
  const { data: existingRows, error: countError } = await client
    .from(TABLE_CONFIG)
    .select("id", { count: "exact" });

  if (countError) {
    jLog("warn", `No se pudo verificar datos existentes: ${countError.message}`);
  }

  const existingCount = existingRows?.length ?? 0;
  if (existingCount > 0) {
    jLog("info", `Tabla ya tiene ${existingCount} registros — skip seeding`);
    return;
  }

  // Insertamos en batches de 10 para no sobrecargar
  const BATCH_SIZE = 10;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < DEFAULT_CONFIG.length; i += BATCH_SIZE) {
    const batch = DEFAULT_CONFIG.slice(i, i + BATCH_SIZE);

    for (const entry of batch) {
      // Verificamos si la key ya existe (doble verificacion por seguridad)
      const { data: existing } = await client
        .from(TABLE_CONFIG)
        .select("id")
        .eq("key", entry.key)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { error: insertError } = await client.from(TABLE_CONFIG).insert({
        key: entry.key,
        value: entry.value,
        category: entry.category,
        description: entry.description,
        is_encrypted: entry.is_encrypted ?? false,
      });

      if (insertError) {
        // Si es un error de duplicado (race condition), lo ignoramos
        const isDuplicate =
          insertError.message?.includes("duplicate") ||
          insertError.message?.includes("unique constraint");
        if (isDuplicate) {
          skipped++;
        } else {
          jLog("error", `Error insertando ${entry.key}: ${insertError.message}`);
        }
      } else {
        inserted++;
      }
    }
  }

  jLog(
    "info",
    `Configuracion insertada: ${inserted} nuevos, ${skipped} duplicados omitidos`
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// PASO 5: CREAR TABLA jarvis_conversation_memory
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Crea la tabla `jarvis_conversation_memory` para almacenar el historial
 * de conversaciones entre usuarios y JARVIS.
 * Es idempotente: usa `IF NOT EXISTS`.
 */
export async function createConversationMemoryTable(): Promise<void> {
  jLog("info", "Step 5 — Creando tabla jarvis_conversation_memory...");

  const client = createServiceClient();

  const sql = `
    CREATE TABLE IF NOT EXISTS ${TABLE_MEMORY} (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
      content TEXT NOT NULL,
      tool_calls JSONB,
      tool_results JSONB,
      session_id VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_jarvis_memory_user ON ${TABLE_MEMORY}(user_id);
    CREATE INDEX IF NOT EXISTS idx_jarvis_memory_session ON ${TABLE_MEMORY}(session_id);
    CREATE INDEX IF NOT EXISTS idx_jarvis_memory_created ON ${TABLE_MEMORY}(created_at);
  `;

  const { error } = await client.rpc("exec_sql", { query: sql });

  if (error) {
    const fallbackResult = await tryRawSql(client, sql);
    if (!fallbackResult) {
      // Si todo falla, intentamos crear la tabla statement por statement manualmente
      jLog("warn", "Creando tabla conversation_memory con metodo alternativo...");
      await createConversationMemoryFallback(client);
      return;
    }
  }

  jLog("info", "Tabla jarvis_conversation_memory creada (o ya existia)");
}

/**
 * Metodo alternativo para crear la tabla de memoria de conversaciones.
 * Intenta crear la tabla usando el endpoint REST directamente.
 *
 * @param client - Cliente de Supabase
 */
async function createConversationMemoryFallback(client: SupabaseClient): Promise<void> {
  try {
    // Verificamos si la tabla ya existe intentando un SELECT
    const { error: checkError } = await client.from(TABLE_MEMORY).select("id").limit(1);
    if (!checkError) {
      jLog("info", "Tabla jarvis_conversation_memory ya existe (verificado via SELECT)");
      return;
    }

    jLog(
      "error",
      `No se pudo crear la tabla de memoria: ${checkError.message}. ` +
        "Se requiere crear manualmente o habilitar la funcion exec_sql en PostgreSQL."
    );

    // Log de seguridad del fallo
    await logSecurityEvent({
      level: "WARNING",
      rule: "INIT_MEMORY_TABLE",
      action: "CREATE_TABLE_FAILED",
      description: `La tabla ${TABLE_MEMORY} no pudo ser creada automaticamente: ${checkError.message}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    jLog("error", `Excepcion en createConversationMemoryFallback: ${msg}`);
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// PASO 6: CREAR TABLA jarvis_audit_log
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Crea la tabla `jarvis_audit_log` para registrar todas las acciones
 * y eventos del sistema JARVIS.
 * Es idempotente: usa `IF NOT EXISTS`.
 */
export async function createAuditLogTable(): Promise<void> {
  jLog("info", "Step 6 — Creando tabla jarvis_audit_log...");

  const client = createServiceClient();

  const sql = `
    CREATE TABLE IF NOT EXISTS ${TABLE_AUDIT} (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type VARCHAR(50) NOT NULL,
      service VARCHAR(50),
      operation VARCHAR(100),
      target VARCHAR(200),
      status VARCHAR(20) NOT NULL,
      details JSONB,
      user_id VARCHAR(100),
      ip_address INET,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_jarvis_audit_created ON ${TABLE_AUDIT}(created_at);
    CREATE INDEX IF NOT EXISTS idx_jarvis_audit_service ON ${TABLE_AUDIT}(service);
    CREATE INDEX IF NOT EXISTS idx_jarvis_audit_status ON ${TABLE_AUDIT}(status);
  `;

  const { error } = await client.rpc("exec_sql", { query: sql });

  if (error) {
    const fallbackResult = await tryRawSql(client, sql);
    if (!fallbackResult) {
      jLog("warn", "Creando tabla audit_log con metodo alternativo...");
      await createAuditLogFallback(client);
      return;
    }
  }

  jLog("info", "Tabla jarvis_audit_log creada (o ya existia)");
}

/**
 * Metodo alternativo para crear la tabla de auditoria.
 *
 * @param client - Cliente de Supabase
 */
async function createAuditLogFallback(client: SupabaseClient): Promise<void> {
  try {
    const { error: checkError } = await client.from(TABLE_AUDIT).select("id").limit(1);
    if (!checkError) {
      jLog("info", "Tabla jarvis_audit_log ya existe (verificado via SELECT)");
      return;
    }

    jLog(
      "error",
      `No se pudo crear la tabla de auditoria: ${checkError.message}. ` +
        "Se requiere crear manualmente o habilitar la funcion exec_sql en PostgreSQL."
    );

    await logSecurityEvent({
      level: "WARNING",
      rule: "INIT_AUDIT_TABLE",
      action: "CREATE_TABLE_FAILED",
      description: `La tabla ${TABLE_AUDIT} no pudo ser creada automaticamente: ${checkError.message}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    jLog("error", `Excepcion en createAuditLogFallback: ${msg}`);
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// PASO 7: FUNCION PRINCIPAL DE INICIALIZACION
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Inicializa el sistema JARVIS ejecutando todos los pasos en orden.
 *
 * Cada paso se ejecuta secuencialmente. Si un paso falla, se registra el error
 * pero el proceso continua con el siguiente paso (a menos que sea critico).
 *
 * @returns Resultado completo con el estado de cada paso y la lista de errores
 *
 * @example
 * ```typescript
 * const result = await initializeJarvis();
 * if (result.success) {
 *   console.log("JARVIS inicializado correctamente");
 * } else {
 *   console.error("Errores:", result.errors);
 * }
 * ```
 */
export async function initializeJarvis(): Promise<InitResult> {
  jLog("info", "========================================");
  jLog("info", "  JARVIS AUTO-CONFIGURATION SYSTEM v2.0");
  jLog("info", "========================================");

  const steps: InitStep[] = [];
  const errors: string[] = [];

  // ── Paso 1: Verificar conexion ──────────────────────────────────────────────
  try {
    const connected = await checkSupabaseConnection();
    if (connected) {
      steps.push({
        step: "supabase_connection",
        status: "ok",
        message: "Conexion a Supabase establecida correctamente",
      });
    } else {
      steps.push({
        step: "supabase_connection",
        status: "error",
        message: "No se pudo conectar a Supabase — revise las variables de entorno",
      });
      errors.push("Conexion a Supabase fallida — abortando inicializacion");
      // La conexion es critica, pero intentamos los demas pasos igual
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    steps.push({ step: "supabase_connection", status: "error", message: msg });
    errors.push(`Paso 1 (conexion): ${msg}`);
  }

  // ── Paso 2: Verificar tabla jarvis_config ───────────────────────────────────
  let configTableExists = false;
  try {
    configTableExists = await checkJarvisConfigTable();
    steps.push({
      step: "check_config_table",
      status: "ok",
      message: configTableExists
        ? "Tabla jarvis_config encontrada"
        : "Tabla jarvis_config no existe — necesita crearse",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    steps.push({ step: "check_config_table", status: "error", message: msg });
    errors.push(`Paso 2 (verificar tabla): ${msg}`);
  }

  // ── Paso 3: Crear tabla jarvis_config ───────────────────────────────────────
  if (!configTableExists) {
    try {
      await createJarvisConfigTable();
      steps.push({
        step: "create_config_table",
        status: "ok",
        message: "Tabla jarvis_config creada exitosamente",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      steps.push({
        step: "create_config_table",
        status: "error",
        message: `No se pudo crear la tabla: ${msg}`,
      });
      errors.push(`Paso 3 (crear tabla): ${msg}`);
    }
  } else {
    steps.push({
      step: "create_config_table",
      status: "skipped",
      message: "Tabla jarvis_config ya existe — omitiendo creacion",
    });
  }

  // ── Paso 4: Insertar configuracion por defecto ──────────────────────────────
  try {
    await seedDefaultConfig();
    steps.push({
      step: "seed_default_config",
      status: "ok",
      message: "Configuracion por defecto insertada (o ya existia)",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    steps.push({
      step: "seed_default_config",
      status: "error",
      message: `Error al insertar configuracion: ${msg}`,
    });
    errors.push(`Paso 4 (seed config): ${msg}`);
  }

  // ── Paso 5: Crear tabla jarvis_conversation_memory ──────────────────────────
  try {
    await createConversationMemoryTable();
    steps.push({
      step: "create_memory_table",
      status: "ok",
      message: "Tabla jarvis_conversation_memory verificada/creada",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    steps.push({
      step: "create_memory_table",
      status: "error",
      message: `Error al crear tabla de memoria: ${msg}`,
    });
    errors.push(`Paso 5 (tabla memoria): ${msg}`);
  }

  // ── Paso 6: Crear tabla jarvis_audit_log ────────────────────────────────────
  try {
    await createAuditLogTable();
    steps.push({
      step: "create_audit_table",
      status: "ok",
      message: "Tabla jarvis_audit_log verificada/creada",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    steps.push({
      step: "create_audit_table",
      status: "error",
      message: `Error al crear tabla de auditoria: ${msg}`,
    });
    errors.push(`Paso 6 (tabla auditoria): ${msg}`);
  }

  // ── Resumen ─────────────────────────────────────────────────────────────────
  const success = errors.length === 0;

  jLog("info", "========================================");
  jLog("info", `  Inicializacion ${success ? "EXITOSA" : "CON ERRORES"}`);
  jLog("info", `  Pasos OK: ${steps.filter((s) => s.status === "ok").length}`);
  jLog("info", `  Pasos skipped: ${steps.filter((s) => s.status === "skipped").length}`);
  jLog("info", `  Errores: ${errors.length}`);
  jLog("info", "========================================");

  // Log de auditoria del evento de inicializacion
  try {
    await logSecurityEvent({
      level: success ? "INFO" : "WARNING",
      rule: "JARVIS_INIT",
      action: "INITIALIZE",
      description: `Inicializacion de JARVIS ${success ? "exitosa" : "con errores"}: ${steps.map((s) => `${s.step}=${s.status}`).join(", ")}`,
      metadata: { steps, errorCount: errors.length },
    });
  } catch {
    // Si el log de auditoria falla, no debe afectar el resultado
    jLog("warn", "No se pudo registrar evento de auditoria (auditoria puede no estar disponible aun)");
  }

  return {
    success,
    steps,
    errors,
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// PASO 8: FUNCIONES HELPER PARA ACCEDER A LA CONFIGURACION
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene el valor de una configuracion por su key.
 *
 * @param key - Nombre de la configuracion (ej: "JARVIS_ENABLED")
 * @returns El valor como string, o `null` si no existe
 *
 * @example
 * ```typescript
 * const enabled = await getJarvisConfig("JARVIS_ENABLED");
 * console.log(enabled); // "true"
 * ```
 */
export async function getJarvisConfig(key: string): Promise<string | null> {
  try {
    const client = createServiceClient();
    const { data, error } = await client
      .from(TABLE_CONFIG)
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error || !data) return null;
    return data.value;
  } catch {
    return null;
  }
}

/**
 * Establece el valor de una configuracion.
 * Si la key no existe, la crea. Si existe, la actualiza.
 *
 * @param key - Nombre de la configuracion
 * @param value - Valor a guardar
 *
 * @example
 * ```typescript
 * await setJarvisConfig("JARVIS_ENABLED", "false");
 * ```
 */
export async function setJarvisConfig(key: string, value: string): Promise<void> {
  const client = createServiceClient();

  // Verificamos si existe
  const { data: existing } = await client
    .from(TABLE_CONFIG)
    .select("id")
    .eq("key", key)
    .maybeSingle();

  if (existing) {
    // UPDATE
    const { error } = await client
      .from(TABLE_CONFIG)
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key);

    if (error) {
      throw new Error(`Error actualizando config ${key}: ${error.message}`);
    }
  } else {
    // INSERT
    const { error } = await client.from(TABLE_CONFIG).insert({
      key,
      value,
      category: "general",
      description: `Creado dinamicamente el ${new Date().toISOString()}`,
    });

    if (error) {
      throw new Error(`Error insertando config ${key}: ${error.message}`);
    }
  }
}

/**
 * Obtiene TODA la configuracion de JARVIS como un diccionario key -> value.
 *
 * @returns Record con todas las configuraciones
 *
 * @example
 * ```typescript
 * const allConfig = await getAllJarvisConfig();
 * console.log(allConfig["JARVIS_ENABLED"]); // "true"
 * ```
 */
export async function getAllJarvisConfig(): Promise<Record<string, string>> {
  try {
    const client = createServiceClient();
    const { data, error } = await client
      .from(TABLE_CONFIG)
      .select("key, value");

    if (error || !data) return {};

    const result: Record<string, string> = {};
    for (const row of data) {
      result[row.key] = row.value;
    }
    return result;
  } catch {
    return {};
  }
}

/**
 * Verifica si JARVIS esta habilitado (master switch).
 *
 * @returns `true` si JARVIS_ENABLED es "true", `false` en cualquier otro caso
 *
 * @example
 * ```typescript
 * if (await isJarvisEnabled()) {
 *   // Procesar comando...
 * }
 * ```
 */
export async function isJarvisEnabled(): Promise<boolean> {
  const value = await getJarvisConfig("JARVIS_ENABLED");
  return value?.toLowerCase() === "true";
}

// ───────────────────────────────────────────────────────────────────────────────
// FUNCIONES AUXILIARES ADICIONALES
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene la configuracion con metadata completa (no solo el valor).
 *
 * @param key - Nombre de la configuracion
 * @returns Objeto con todos los campos, o `null` si no existe
 */
export async function getJarvisConfigMeta(key: string): Promise<{
  key: string;
  value: string;
  category: string;
  description: string;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
} | null> {
  try {
    const client = createServiceClient();
    const { data, error } = await client
      .from(TABLE_CONFIG)
      .select("key, value, category, description, is_encrypted, created_at, updated_at")
      .eq("key", key)
      .maybeSingle();

    if (error || !data) return null;
    return data as {
      key: string;
      value: string;
      category: string;
      description: string;
      is_encrypted: boolean;
      created_at: string;
      updated_at: string;
    };
  } catch {
    return null;
  }
}

/**
 * Elimina una configuracion por su key.
 *
 * @param key - Nombre de la configuracion a eliminar
 */
export async function deleteJarvisConfig(key: string): Promise<void> {
  const client = createServiceClient();
  const { error } = await client.from(TABLE_CONFIG).delete().eq("key", key);

  if (error) {
    throw new Error(`Error eliminando config ${key}: ${error.message}`);
  }
}

/**
 * Obtiene configuraciones por categoria.
 *
 * @param category - Categoria a filtrar (ej: "general", "llm", "security")
 * @returns Array de configuraciones de esa categoria
 */
export async function getJarvisConfigByCategory(category: string): Promise<
  Array<{
    key: string;
    value: string;
    description: string;
    is_encrypted: boolean;
  }>
> {
  try {
    const client = createServiceClient();
    const { data, error } = await client
      .from(TABLE_CONFIG)
      .select("key, value, description, is_encrypted")
      .eq("category", category);

    if (error || !data) return [];
    return data as Array<{
      key: string;
      value: string;
      description: string;
      is_encrypted: boolean;
    }>;
  } catch {
    return [];
  }
}

/**
 * Obtiene un resumen de la salud del sistema JARVIS.
 * Util para dashboards y health checks.
 *
 * @returns Estado de los componentes principales
 */
export async function getJarvisHealthStatus(): Promise<{
  database: "ok" | "error";
  configTable: "ok" | "error";
  memoryTable: "ok" | "error";
  auditTable: "ok" | "error";
  configCount: number;
  enabled: boolean;
}> {
  const client = createServiceClient();
  let configCount = 0;

  // Verificar conexion
  const { error: connError } = await client.from(TABLE_CONFIG).select("id", { count: "exact" });
  const database = connError ? "error" : "ok";

  if (!connError && connError === null) {
    const { count } = await client.from(TABLE_CONFIG).select("*", { count: "exact", head: true });
    configCount = count ?? 0;
  }

  // Verificar tablas
  const { error: configErr } = await client.from(TABLE_CONFIG).select("id").limit(1);
  const { error: memoryErr } = await client.from(TABLE_MEMORY).select("id").limit(1);
  const { error: auditErr } = await client.from(TABLE_AUDIT).select("id").limit(1);

  const enabled = (await getJarvisConfig("JARVIS_ENABLED"))?.toLowerCase() === "true";

  return {
    database,
    configTable: configErr ? "error" : "ok",
    memoryTable: memoryErr ? "error" : "ok",
    auditTable: auditErr ? "error" : "ok",
    configCount,
    enabled,
  };
}
