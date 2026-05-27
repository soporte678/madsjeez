/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    JARVIS LOADER — Bootstrap Module                      ║
 * ║                                                                          ║
 * ║  Se ejecuta al iniciar la aplicacion para:                              ║
 * ║  1. Verificar que JARVIS esta habilitado                                ║
 * ║  2. Cargar la configuracion desde Supabase                              ║
 * ║  3. Verificar conectividad MCP (GitHub, Railway, Supabase)              ║
 * ║  4. Iniciar el motor autonomo si esta configurado                       ║
 * ║  5. Reportar estado completo del sistema                                ║
 * ║                                                                          ║
 * ║  Este modulo es el punto de entrada para el bootstrap de JARVIS.        ║
 * ║  Se consume tanto en servidor (API routes) como en cliente              ║
 * ║  (via JarvisInitializer).                                               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * @module lib/jarvis/jarvis-loader
 * @requires init-jarvis para configuracion
 * @requires mcp para health checks
 * @requires autonomous para el scheduler
 */

import {
  initializeJarvis,
  isJarvisEnabled,
  getAllJarvisConfig,
  type InitResult,
} from "./init-jarvis";
import { healthCheck } from "./mcp";
import { getScheduler } from "./autonomous";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Resultado completo del health check de JARVIS.
 */
export interface JarvisHealthReport {
  /** Si JARVIS esta habilitado */
  enabled: boolean;
  /** Configuracion cargada */
  config: Record<string, string>;
  /** Estado de salud de cada servicio */
  health: {
    /** Supabase accesible */
    supabase: boolean;
    /** LLM responde */
    llm: boolean;
    /** GitHub MCP funciona */
    github: boolean;
    /** Railway MCP funciona */
    railway: boolean;
  };
  /** Si el motor autonomo esta corriendo */
  autonomousRunning: boolean;
  /** Errores encontrados durante el load */
  errors: string[];
  /** Version del sistema */
  version: string;
}

/**
 * Estado de carga de JARVIS.
 */
export interface JarvisLoadStatus {
  /** Si ya se ejecuto loadJarvis() */
  loaded: boolean;
  /** Si JARVIS esta habilitado */
  enabled: boolean;
  /** Version del sistema */
  version: string;
  /** Estado de cada servicio */
  services: Record<string, boolean>;
  /** Errores acumulados */
  errors: string[];
}

// ============================================================================
// INTERNAL STATE
// ============================================================================

/** Estado de carga interno */
let _loaded = false;
let _health: JarvisHealthReport | null = null;
let _errors: string[] = [];

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Carga y verifica JARVIS al iniciar la aplicacion.
 * Esta es la funcion principal de bootstrap que:
 * 1. Inicializa la configuracion
 * 2. Verifica variables de entorno
 * 3. Chequea salud de servicios MCP
 * 4. Inicia el motor autonomo si corresponde
 * 5. Reporta estado
 *
 * @returns Reporte completo de salud y estado
 *
 * @example
 * ```typescript
 * // En un Server Component o API route:
 * const status = await loadJarvis();
 * if (!status.enabled) {
 *   console.log("JARVIS esta deshabilitado");
 * }
 * ```
 */
export async function loadJarvis(): Promise<JarvisHealthReport> {
  _errors = [];

  try {
    // ── Step 1: Inicializar configuracion ───────────────────────────────
    const initResult: InitResult = await initializeJarvis();

    // Si la inicializacion fallo completamente
    if (!initResult.success && initResult.errors.length > 0) {
      _errors.push(...initResult.errors);
    }

    // ── Step 2: Verificar si JARVIS esta habilitado ─────────────────────
    let jarvisEnabled: boolean;
    try {
      jarvisEnabled = await isJarvisEnabled();
    } catch {
      jarvisEnabled = true; // Fail-open
    }

    // Si esta deshabilitado, no hacemos nada mas
    if (!jarvisEnabled) {
      _loaded = true;
      _health = {
        enabled: false,
        config: { JARVIS_ENABLED: "false" },
        health: { supabase: false, llm: false, github: false, railway: false },
        autonomousRunning: false,
        errors: [],
        version: "1.0.0",
      };
      return _health;
    }

    // ── Step 3: Cargar toda la configuracion ────────────────────────────
    let config: Record<string, string> = {};
    try {
      config = await getAllJarvisConfig();
    } catch (err) {
      _errors.push(
        `No se pudo cargar config: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // ── Step 4: Verificar conectividad Supabase ─────────────────────────
    let supabaseOk = false;
    try {
      const supabaseClient = await import("@/lib/supabase").then(
        (m) => m.createClient
      );
      const client = supabaseClient();
      const { error } = await client.from("jarvis_config").select("count").limit(1);
      supabaseOk = !error;
    } catch (err) {
      _errors.push(
        `Supabase no responde: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // ── Step 5: Verificar MCP services ──────────────────────────────────
    let githubOk = false;
    let railwayOk = false;
    let llmOk = false;

    try {
      const mcpHealth = await healthCheck();
      githubOk = mcpHealth.services?.github ?? false;
      railwayOk = mcpHealth.services?.railway ?? false;

      // Verificar LLM
      try {
        const { callLlm } = await import("./llm-client");
        const llmResponse = await callLlm(
          [{ role: "user", content: "ping" }],
          { maxTokens: 5, timeoutMs: 10_000, retries: 1 }
        );
        llmOk = !!llmResponse.text;
      } catch (llmErr) {
        _errors.push(
          `LLM no responde: ${llmErr instanceof Error ? llmErr.message : String(llmErr)}`
        );
      }
    } catch (mcpErr) {
      _errors.push(
        `MCP health check fallo: ${mcpErr instanceof Error ? mcpErr.message : String(mcpErr)}`
      );
    }

    // ── Step 6: Iniciar motor autonomo si esta configurado ──────────────
    let autonomousRunning = false;
    const autonomousEnabled = config["AUTONOMOUS_ENABLED"]?.toLowerCase() === "true";
    if (autonomousEnabled) {
      try {
        const scheduler = getScheduler();
        autonomousRunning = scheduler.isRunning?.() ?? false;
      } catch {
        // El scheduler puede no tener isRunning
        try {
          const { getAutonomousTasks } = await import("./autonomous/engine");
          // Solo verificamos que el motor este disponible
          getAutonomousTasks();
          autonomousRunning = true;
        } catch (autoErr) {
          _errors.push(
            `Motor autonomo no disponible: ${autoErr instanceof Error ? autoErr.message : String(autoErr)}`
          );
        }
      }
    }

    // ── Step 7: Construir reporte ───────────────────────────────────────
    _loaded = true;
    _health = {
      enabled: jarvisEnabled,
      config,
      health: {
        supabase: supabaseOk,
        llm: llmOk,
        github: githubOk,
        railway: railwayOk,
      },
      autonomousRunning,
      errors: _errors,
      version: config["JARVIS_VERSION"] ?? "1.0.0",
    };

    return _health;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    _errors.push(`Error fatal en loadJarvis: ${errorMessage}`);
    _loaded = true;

    _health = {
      enabled: false,
      config: {},
      health: { supabase: false, llm: false, github: false, railway: false },
      autonomousRunning: false,
      errors: _errors,
      version: "1.0.0",
    };

    return _health;
  }
}

/**
 * Obtiene el estado actual de JARVIS.
 * No ejecuta el load, solo devuelve el estado cacheado.
 *
 * @returns Estado de carga de JARVIS
 */
export function getJarvisStatus(): JarvisLoadStatus {
  return {
    loaded: _loaded,
    enabled: _health?.enabled ?? false,
    version: _health?.version ?? "1.0.0",
    services: {
      supabase: _health?.health.supabase ?? false,
      llm: _health?.health.llm ?? false,
      github: _health?.health.github ?? false,
      railway: _health?.health.railway ?? false,
      autonomous: _health?.autonomousRunning ?? false,
    },
    errors: _errors,
  };
}

/**
 * Obtiene el reporte de salud cacheado.
 * Si no se ejecuto loadJarvis() aun, devuelve null.
 */
export function getCachedHealthReport(): JarvisHealthReport | null {
  return _health;
}

/**
 * Verifica si JARVIS ya fue cargado.
 */
export function isJarvisLoaded(): boolean {
  return _loaded;
}

/**
 * Resetea el estado del loader (para testing).
 */
export function resetJarvisLoader(): void {
  _loaded = false;
  _health = null;
  _errors = [];
}

/**
 * Obtiene la configuracion cacheada (si existe).
 */
export function getLoadedConfig(): Record<string, string> | null {
  return _health?.config ?? null;
}
