/**
 * =============================================================================
 * JARVIS LLM-MCP BRIDGE
 * =============================================================================
 *
 * Puente principal entre el cliente LLM y el sistema MCP de JARVIS.
 * Orquesta el ciclo completo de interaccion LLM ↔ Herramientas:
 *
 *   1. Recibe mensajes del usuario + historial
 *   2. Construye el system prompt completo con contexto dinamico
 *   3. Llama al LLM con las herramientas disponibles (function calling)
 *   4. Parsea la respuesta del LLM:
 *      - Si tiene `tool_calls`, extrae cada llamada
 *      - Valida parametros con Zod schemas
 *      - Ejecuta via MCP (con governance checks automaticos)
 *      - Formatea el resultado
 *      - Reenvia al LLM con el resultado de la herramienta
 *   5. Devuelve la respuesta final al usuario
 *
 * Caracteristicas:
 * - Multi-turn tool execution (herramientas en secuencia)
 * - Validacion de parametros con Zod
 * - Manejo de errores en cada paso (parseo, ejecucion, LLM)
 * - Timeouts y rate limiting
 * - Fallback si el LLM no responde
 * - Proteccion de credenciales (nunca expuestas)
 * - Logging de auditoria en cada operacion
 * - Maximo 5 ciclos de tool calls para evitar loops infinitos
 *
 * @module lib/jarvis/llm-mcp-bridge
 */

import { z } from "zod";
import { callLlm, LlmMessage } from "./llm-client";
import {
  executeMCPOperation,
  requiresApproval,
  healthCheck,
  MCP_OPERATIONS,
} from "./mcp";
import type { MCPService } from "./mcp";
import {
  buildSystemPrompt,
  buildMinimalSystemPrompt,
  getToolsForLLM,
  formatToolSuccess,
  formatToolError,
  formatConfirmationRequest,
  GitHubParamsSchema,
  RailwayParamsSchema,
  SupabaseParamsSchema,
} from "./prompts";
import type { SystemPromptContext, ToolSchema } from "./prompts";
import { logSecurityEvent } from "./governance/auditor";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Representa una llamada a herramienta extraida de la respuesta del LLM.
 */
interface ToolCall {
  /** Nombre de la herramienta (ej: "github_listCommits") */
  name: string;
  /** Parametros parseados como record */
  arguments: Record<string, unknown>;
  /** ID original del tool_call (para tracking) */
  id?: string;
}

/**
 * Resultado del ciclo completo de procesamiento LLM + herramientas.
 */
export interface LLMResponse {
  /** Contenido textual de la respuesta final */
  content: string;
  /** Llamadas a herramientas que se ejecutaron */
  toolCalls?: ToolCall[];
  /** Motivo de terminacion */
  finishReason: "completed" | "tool_calls" | "error" | "timeout" | "max_turns_reached" | "cancelled";
  /** Metadata de la operacion */
  metadata: {
    /** Cantidad de turnos de tool calls */
    toolTurns: number;
    /** Tiempo total de procesamiento (ms) */
    totalTimeMs: number;
    /** Proveedor LLM usado */
    provider: string;
    /** Errores encontrados (si los hay) */
    errors: string[];
  };
}

/**
 * Opciones para iniciar una conversacion con herramientas.
 */
export interface ChatWithToolsOptions {
  /** Historial de mensajes (el ultimo es el del usuario) */
  messages: Array<{ role: string; content: string }>;
  /** Contexto del system prompt */
  systemContext?: Partial<SystemPromptContext>;
  /** Herramientas a exponer al LLM (default: todas) */
  tools?: ToolSchema[];
  /** Temperatura del LLM (default: 0.3) */
  temperature?: number;
  /** Maximo de tokens de respuesta (default: 1024) */
  maxTokens?: number;
  /** Timeout total del ciclo en ms (default: 30000) */
  timeoutMs?: number;
  /** Maximo de ciclos de tool calls (default: 5) */
  maxToolTurns?: number;
  /** Si es true, usa system prompt minimo (mas rapido) */
  useMinimalPrompt?: boolean;
}

/**
 * Estado interno de un ciclo de ejecucion.
 */
interface BridgeState {
  startTime: number;
  toolTurns: number;
  errors: string[];
  provider: string;
  pendingConfirmations: Map<string, ToolCall>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Maximo de turnos de tool calls por defecto (evita loops infinitos). */
const DEFAULT_MAX_TOOL_TURNS = 5;

/** Timeout total por defecto en ms. */
const DEFAULT_TIMEOUT_MS = 30_000;

/** Temperatura por defecto (baja para respuestas deterministas). */
const DEFAULT_TEMPERATURE = 0.3;

/** Maximo de tokens por defecto. */
const DEFAULT_MAX_TOKENS = 1024;

// ─── Zod Schemas for Tool Call Validation ────────────────────────────────────

/** Schema para validar una llamada a herramienta individual. */
const ToolCallSchema = z.object({
  name: z.string().min(1, "El nombre de la herramienta no puede estar vacio"),
  arguments: z.record(z.string(), z.unknown()).default({}),
  id: z.string().optional(),
});

/** Schema para validar un array de tool calls. */
const ToolCallsArraySchema = z.array(ToolCallSchema);

// ─── Service-Specific Validation ─────────────────────────────────────────────

/**
 * Valida los parametros de una llamada a herramienta segun el servicio.
 * Cada servicio tiene su propio schema Zod.
 *
 * @param service - Nombre del servicio MCP
 * @param operation - Nombre de la operacion
 * @param params - Parametros a validar
 * @returns Resultado de la validacion (ok o error)
 */
function validateToolParams(
  service: string,
  operation: string,
  params: Record<string, unknown>
): { valid: true } | { valid: false; error: string } {
  try {
    switch (service) {
      case "github": {
        // Solo validamos que tenga los campos basicos requeridos para GitHub
        const result = GitHubParamsSchema.safeParse(params);
        if (!result.success) {
          // Para read ops sin repo, es un error claro
          if (!params.repo) {
            return { valid: false, error: `Falta el parametro 'repo' (formato: 'owner/name') para ${operation}` };
          }
        }
        return { valid: true };
      }
      case "railway": {
        const result = RailwayParamsSchema.safeParse(params);
        if (!result.success) {
          const issues = result.error.issues.map((i) => i.message).join("; ");
          return { valid: false, error: `Parametros invalidos para Railway: ${issues}` };
        }
        return { valid: true };
      }
      case "supabase": {
        const result = SupabaseParamsSchema.safeParse(params);
        if (!result.success) {
          const issues = result.error.issues.map((i) => i.message).join("; ");
          return { valid: false, error: `Parametros invalidos para Supabase: ${issues}` };
        }
        return { valid: true };
      }
      default:
        return { valid: false, error: `Servicio desconocido: ${service}` };
    }
  } catch {
    return { valid: true }; // Fallback: permitir si hay error inesperado en validacion
  }
}

// ─── Tool Call Parsing ───────────────────────────────────────────────────────

/**
 * Extrae llamadas a herramientas de la respuesta del LLM.
 * Soporta multiples formatos de respuesta:
 * - Formato tool_call de OpenAI (JSON con name/arguments)
 * - Formato markdown JSON (bloques ```json con tool_calls)
 * - Formato inline (json embebido en el texto)
 *
 * @param responseText - Texto crudo de la respuesta del LLM
 * @returns Array de tool calls parseados (vacío si no hay)
 */
function extractToolCalls(responseText: string): ToolCall[] {
  if (!responseText || responseText.trim().length === 0) {
    return [];
  }

  const toolCalls: ToolCall[] = [];

  // --- Intento 1: Bloque tool_call explicito ---
  const toolCallBlockRegex = /```(?:json)?\s*\n?\s*tool_call\s*\n?\s*({[\s\S]*?})\s*\n?\s*```/gi;
  let match: RegExpExecArray | null;
  while ((match = toolCallBlockRegex.exec(responseText)) !== null) {
    try {
      const parsed = JSON.parse(match[1]!);
      if (parsed.tool && typeof parsed.tool === "string") {
        toolCalls.push({
          name: parsed.tool,
          arguments: parsed.params || parsed.arguments || {},
        });
      } else if (parsed.name && typeof parsed.name === "string") {
        toolCalls.push({
          name: parsed.name,
          arguments: parsed.arguments || parsed.params || {},
        });
      }
    } catch {
      // Ignorar bloques malformados
    }
  }
  if (toolCalls.length > 0) return toolCalls;

  // --- Intento 2: JSON con funcion explicita ---
  const functionCallRegex = /\{\s*"(?:function|tool)":\s*"([^"]+)"\s*,\s*"(?:arguments|params)":\s*(\{[^}]*\})/gi;
  while ((match = functionCallRegex.exec(responseText)) !== null) {
    try {
      const args = JSON.parse(match[2]!);
      toolCalls.push({ name: match[1]!, arguments: args });
    } catch {
      // Ignorar
    }
  }
  if (toolCalls.length > 0) return toolCalls;

  // --- Intento 3: Formato "llame a X con Y" (fallback para LLMs menos estructurados) ---
  const actionPatterns = [
    /(?:voy a |ejecutar[eé]|llamar[eé]|usar[eé])\s*(?:la herramienta |el tool |la funcion |)?[`"']?([a-z_]+\.[a-z_]+)[`"']?/i,
    /[`"']?(github|railway|supabase)_([a-z_]+)[`"']?/i,
  ];
  for (const pattern of actionPatterns) {
    const actionMatch = responseText.match(pattern);
    if (actionMatch) {
      // Intentar extraer params de la respuesta
      const paramRegex = /(?:con |usando |params?:?\s*)\s*({[^}]+}|\{[\s\S]*?\})/i;
      const paramMatch = responseText.match(paramRegex);
      let args: Record<string, unknown> = {};
      if (paramMatch) {
        try {
          args = JSON.parse(paramMatch[1]!);
        } catch {
          // No hay params parseables
        }
      }
      const service = actionMatch[1]!.toLowerCase();
      const operation = actionMatch[2] || "";
      const fullName = operation.includes("_") ? operation : `${service}_${operation}`;
      toolCalls.push({ name: fullName, arguments: args });
    }
  }

  return toolCalls;
}

/**
 * Parsea un nombre de herramienta en formato "service_operation"
 * y devuelve las partes separadas.
 *
 * @param toolName - Nombre completo de la herramienta
 * @returns Tupla [service, operation] o null si no es valido
 */
function parseToolName(toolName: string): { service: MCPService; operation: string } | null {
  const parts = toolName.split("_");
  if (parts.length < 2) return null;

  const service = parts[0] as MCPService;
  const operation = parts.slice(1).join("_");

  // Validar que el servicio existe
  if (!(service in MCP_OPERATIONS)) {
    return null;
  }

  return { service, operation };
}

// ─── Tool Execution ──────────────────────────────────────────────────────────

/**
 * Ejecuta una llamada a herramienta via el orchestrator MCP.
 * Maneja aprobaciones, validaciones, y errores.
 *
 * @param toolCall - La llamada a herramienta parseada
 * @param state - Estado actual del bridge
 * @returns Resultado de la ejecucion como string
 */
async function executeToolCall(
  toolCall: ToolCall,
  state: BridgeState
): Promise<{ success: boolean; result: string; requiresConfirmation?: boolean }> {
  const { name, arguments: params } = toolCall;

  // Parsear nombre de la herramienta
  const parsed = parseToolName(name);
  if (!parsed) {
    const error = `Nombre de herramienta invalido: "${name}". Formato esperado: "servicio_operacion" (ej: "github_listCommits")`;
    state.errors.push(error);
    return { success: false, result: formatToolError(name, error) };
  }

  const { service, operation } = parsed;

  // Verificar si la operacion existe
  const ops = MCP_OPERATIONS[service];
  const allOps = [...ops.read, ...ops.write];
  if (!allOps.includes(operation as (typeof allOps)[number])) {
    const error = `Operacion "${operation}" no existe en el servicio "${service}"`;
    state.errors.push(error);
    return { success: false, result: formatToolError(name, error) };
  }

  // Validar parametros con Zod
  const validation = validateToolParams(service, operation, params);
  if (!validation.valid) {
    state.errors.push(validation.error);
    return { success: false, result: formatToolError(name, validation.error) };
  }

  // Verificar si requiere aprobacion (operaciones destructivas)
  const needsApproval = requiresApproval(service, operation);
  if (needsApproval) {
    // Registrar intento de accion destructiva
    await logSecurityEvent({
      service,
      operation,
      target: params.repo?.toString() || params.serviceId?.toString() || params.tableName?.toString() || "unknown",
      status: "pending_approval",
      timestamp: new Date().toISOString(),
      details: { params, toolName: name },
    });

    return {
      success: false,
      result: formatConfirmationRequest(
        `ejecutar ${name}`,
        `Esta operacion afecta el servicio **${service}** y es destructiva. ` +
        `Parametros: ${JSON.stringify(params, null, 2).slice(0, 200)}`
      ),
      requiresConfirmation: true,
    };
  }

  // Ejecutar la operacion
  try {
    const startExec = Date.now();
    const result = await executeMCPOperation(service, operation, params);
    const execTime = Date.now() - startExec;

    if (result.success) {
      await logSecurityEvent({
        service,
        operation,
        target: params.repo?.toString() || params.serviceId?.toString() || params.tableName?.toString() || "unknown",
        status: "success",
        timestamp: new Date().toISOString(),
        details: { executionTimeMs: execTime, toolName: name },
      });
      return {
        success: true,
        result: formatToolSuccess(name, result.data),
      };
    } else {
      const error = result.error || "Operacion fallo sin mensaje de error";
      state.errors.push(error);
      await logSecurityEvent({
        service,
        operation,
        target: params.repo?.toString() || params.serviceId?.toString() || params.tableName?.toString() || "unknown",
        status: "failure",
        timestamp: new Date().toISOString(),
        details: { error, toolName: name },
      });
      return {
        success: false,
        result: formatToolError(name, error),
      };
    }
  } catch (execError) {
    const errorMessage = execError instanceof Error ? execError.message : String(execError);
    state.errors.push(errorMessage);
    await logSecurityEvent({
      service,
      operation,
      target: "unknown",
      status: "failure",
      timestamp: new Date().toISOString(),
      details: { error: errorMessage, toolName: name, unexpected: true },
    });
    return {
      success: false,
      result: formatToolError(name, `Error inesperado: ${errorMessage}`),
    };
  }
}

// ─── Main Bridge Function ────────────────────────────────────────────────────

/**
 * Funcion principal del puente LLM-MCP.
 *
 * Orquesta el ciclo completo: recibe mensajes del usuario, llama al LLM,
 * ejecuta herramientas si el LLM las solicita, y devuelve la respuesta final.
 *
 * @param options - Opciones de configuracion para la conversacion
 * @returns Respuesta final del ciclo LLM + herramientas
 *
 * @example
 * ```typescript
 * const response = await chatWithTools({
 *   messages: [
 *     { role: "user", content: "¿Cuántas ventas tuvimos hoy?" },
 *   ],
 *   systemContext: { userName: "Juan", userRole: "admin" },
 *   temperature: 0.3,
 *   maxToolTurns: 3,
 * });
 *
 * console.log(response.content);
 * console.log(response.metadata);
 * ```
 */
export async function chatWithTools(options: ChatWithToolsOptions): Promise<LLMResponse> {
  const startTime = Date.now();
  const maxToolTurns = options.maxToolTurns ?? DEFAULT_MAX_TOOL_TURNS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const temperature = options.temperature ?? DEFAULT_TEMPERATURE;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;

  // Estado del ciclo
  const state: BridgeState = {
    startTime,
    toolTurns: 0,
    errors: [],
    provider: "unknown",
    pendingConfirmations: new Map(),
  };

  // Timeout global
  const timeoutId = setTimeout(() => {
    state.errors.push(`Timeout despues de ${timeoutMs}ms`);
  }, timeoutMs);

  try {
    // ── Step 1: Construir system prompt ────────────────────────────────────
    const healthStatus = healthCheck();
    const systemContext: SystemPromptContext = {
      userName: options.systemContext?.userName,
      userRole: options.systemContext?.userRole ?? "guest",
      currentPage: options.systemContext?.currentPage,
      availableTools: options.systemContext?.availableTools ?? [
        "github (14 ops)", "railway (13 ops)", "supabase (18 ops)", "autonomous (8 tasks)",
      ],
      healthStatus: options.systemContext?.healthStatus ?? healthStatus,
      activeAutonomousTasks: options.systemContext?.activeAutonomousTasks ?? 8,
      isMaintenanceWindow: isInMaintenanceWindow(),
    };

    const systemPrompt = options.useMinimalPrompt
      ? buildMinimalSystemPrompt({
          userName: systemContext.userName,
          userRole: systemContext.userRole,
        })
      : buildSystemPrompt(systemContext);

    // ── Step 2: Preparar mensajes ──────────────────────────────────────────
    const llmMessages: LlmMessage[] = [
      { role: "system", content: systemPrompt },
      ...options.messages.map((m) => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content,
      })),
    ];

    // ── Step 3: Obtener herramientas ───────────────────────────────────────
    const tools = options.tools ?? getToolsForLLM();

    // ── Step 4: Ciclo LLM → Tool → LLM ─────────────────────────────────────
    let finalContent = "";
    const executedToolCalls: ToolCall[] = [];

    for (let turn = 0; turn < maxToolTurns; turn++) {
      // Verificar timeout
      if (Date.now() - startTime > timeoutMs) {
        state.errors.push(`Timeout global alcanzado (${timeoutMs}ms)`);
        finalContent = `⏳ Se alcanzo el timeout de ${timeoutMs / 1000}s. ` +
          `Se ejecutaron ${state.toolTurns} turnos de herramientas. ` +
          `Algunas operaciones pueden no haberse completado.`;
        break;
      }

      // Llamar al LLM
      let llmResponse;
      try {
        llmResponse = await callLlm(llmMessages, {
          temperature,
          maxTokens,
          timeoutMs: Math.min(timeoutMs - (Date.now() - startTime), 15000),
        });
        state.provider = llmResponse.provider;
      } catch (llmError) {
        const errorMsg = llmError instanceof Error ? llmError.message : String(llmError);
        state.errors.push(`Error del LLM: ${errorMsg}`);

        // Fallback: intentar con prompt minimo
        if (!options.useMinimalPrompt && turn === 0) {
          try {
            const minimalPrompt = buildMinimalSystemPrompt({
              userName: systemContext.userName,
              userRole: systemContext.userRole,
            });
            llmResponse = await callLlm(
              [
                { role: "system", content: minimalPrompt },
                ...options.messages.map((m) => ({
                  role: m.role as "system" | "user" | "assistant",
                  content: m.content,
                })),
              ],
              {
                temperature: 0.1,
                maxTokens: 512,
                timeoutMs: 10000,
              }
            );
            state.provider = llmResponse.provider;
            state.errors.push("Usando fallback con prompt minimo");
          } catch (fallbackError) {
            const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
            state.errors.push(`Fallback tambien fallo: ${fallbackMsg}`);
            return buildErrorResponse(state, startTime, errorMsg);
          }
        } else {
          return buildErrorResponse(state, startTime, errorMsg);
        }
      }

      const responseText = llmResponse.text;

      // ── Step 5: Extraer tool calls ───────────────────────────────────────
      const toolCalls = extractToolCalls(responseText);

      if (toolCalls.length === 0) {
        // No hay tool calls → respuesta final
        finalContent = responseText;
        break;
      }

      // ── Step 6: Ejecutar tool calls ──────────────────────────────────────
      const toolResults: string[] = [];

      for (const toolCall of toolCalls) {
        // Verificar que la herramienta existe
        const parsed = parseToolName(toolCall.name);
        if (!parsed) {
          toolResults.push(formatToolError(toolCall.name, `Herramienta desconocida: ${toolCall.name}`));
          continue;
        }

        state.toolTurns++;
        executedToolCalls.push(toolCall);

        const execResult = await executeToolCall(toolCall, state);
        toolResults.push(execResult.result);

        // Si requiere confirmacion, no seguir ejecutando más herramientas
        if (execResult.requiresConfirmation) {
          state.pendingConfirmations.set(toolCall.name, toolCall);
          finalContent = execResult.result;
          clearTimeout(timeoutId);
          return {
            content: finalContent,
            toolCalls: executedToolCalls,
            finishReason: "tool_calls",
            metadata: buildMetadata(state, startTime),
          };
        }
      }

      // ── Step 7: Reenviar resultados al LLM ───────────────────────────────
      // Agregar la respuesta original del LLM (con tool calls)
      llmMessages.push({
        role: "assistant",
        content: responseText,
      });

      // Agregar los resultados de las herramientas como mensajes del sistema
      for (const result of toolResults) {
        llmMessages.push({
          role: "user",
          content: `[RESULTADO DE HERRAMIENTA]\n${result}\n\nUsá este resultado para responder al usuario de forma clara y concisa.`,
        });
      }
    }

    // Si se alcanzo el maximo de turnos
    if (state.toolTurns >= maxToolTurns && finalContent === "") {
      finalContent = `Alcance el limite de ${maxToolTurns} ciclos de herramientas. ` +
        `Te resumo lo que encontré:\n\n${state.errors.length > 0 ? "- Errores: " + state.errors.join("; ") : "- Se ejecutaron las herramientas sin errores."}`;
    }

    clearTimeout(timeoutId);

    return {
      content: finalContent,
      toolCalls: executedToolCalls.length > 0 ? executedToolCalls : undefined,
      finishReason: state.errors.length > 0 ? "error" : "completed",
      metadata: buildMetadata(state, startTime),
    };

  } catch (error) {
    clearTimeout(timeoutId);
    const errorMessage = error instanceof Error ? error.message : String(error);
    state.errors.push(`Error inesperado en el bridge: ${errorMessage}`);

    await logSecurityEvent({
      service: "llm_bridge",
      operation: "chatWithTools",
      target: "bridge",
      status: "failure",
      timestamp: new Date().toISOString(),
      details: { error: errorMessage, turns: state.toolTurns },
    });

    return buildErrorResponse(state, startTime, errorMessage);
  }
}

// ─── Confirmation Handler ────────────────────────────────────────────────────

/**
 * Procesa una confirmacion del usuario para una accion destructiva pendiente.
 *
 * @param confirmed - true si el usuario confirmo, false si rechazo
 * @param pendingToolCall - La herramienta que estaba pendiente
 * @param state - Estado del bridge (opcional, se crea uno nuevo)
 * @returns Resultado de la ejecucion
 */
export async function processToolConfirmation(
  confirmed: boolean,
  pendingToolCall: ToolCall,
  state?: Partial<BridgeState>
): Promise<LLMResponse> {
  const startTime = Date.now();

  if (!confirmed) {
    await logSecurityEvent({
      service: "llm_bridge",
      operation: "processToolConfirmation",
      target: pendingToolCall.name,
      status: "cancelled",
      timestamp: new Date().toISOString(),
      details: { action: "rejected", toolName: pendingToolCall.name },
    });

    return {
      content: "❌ Operación cancelada por el usuario. No se realizó ningún cambio.",
      finishReason: "cancelled",
      metadata: {
        toolTurns: 0,
        totalTimeMs: Date.now() - startTime,
        provider: state?.provider ?? "unknown",
        errors: [],
      },
    };
  }

  // Ejecutar directamente sin verificar aprobacion de nuevo
  const fullState: BridgeState = {
    startTime,
    toolTurns: 0,
    errors: [],
    provider: state?.provider ?? "unknown",
    pendingConfirmations: new Map(),
  };

  try {
    const parsed = parseToolName(pendingToolCall.name);
    if (!parsed) {
      return buildErrorResponse(fullState, startTime, `Herramienta invalida: ${pendingToolCall.name}`);
    }

    // Ejecutar directamente via MCP (bypass approval check ya que el usuario confirmo)
    const result = await executeMCPOperation(
      parsed.service,
      parsed.operation,
      pendingToolCall.arguments
    );

    if (result.success) {
      await logSecurityEvent({
        service: "llm_bridge",
        operation: "processToolConfirmation",
        target: pendingToolCall.name,
        status: "success",
        timestamp: new Date().toISOString(),
        details: { action: "confirmed", toolName: pendingToolCall.name },
      });

      return {
        content: formatToolSuccess(pendingToolCall.name, result.data),
        toolCalls: [pendingToolCall],
        finishReason: "completed",
        metadata: buildMetadata(fullState, startTime),
      };
    } else {
      const error = result.error || "Operacion fallo despues de confirmacion";
      fullState.errors.push(error);
      return buildErrorResponse(fullState, startTime, error);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return buildErrorResponse(fullState, startTime, errorMessage);
  }
}

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Verifica si estamos en la ventana de mantenimiento (2AM-6AM GMT-3).
 *
 * @returns true si es horario de mantenimiento
 */
function isInMaintenanceWindow(): boolean {
  const now = new Date();
  const baTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const hour = baTime.getHours();
  return hour >= 2 && hour < 6;
}

/**
 * Construye el objeto de metadata para la respuesta.
 *
 * @param state - Estado del bridge
 * @param startTime - Timestamp de inicio
 * @returns Objeto de metadata
 */
function buildMetadata(state: BridgeState, startTime: number): LLMResponse["metadata"] {
  return {
    toolTurns: state.toolTurns,
    totalTimeMs: Date.now() - startTime,
    provider: state.provider,
    errors: [...state.errors],
  };
}

/**
 * Construye una respuesta de error estandarizada.
 *
 * @param state - Estado del bridge
 * @param startTime - Timestamp de inicio
 * @param errorMessage - Mensaje de error principal
 * @returns LLMResponse con estado de error
 */
function buildErrorResponse(
  state: BridgeState,
  startTime: number,
  errorMessage: string
): LLMResponse {
  return {
    content: `❌ **Error:** ${errorMessage}\n\n` +
      `Por favor, probá de nuevo en unos momentos. ` +
      `Si el problema persiste, contactá al equipo técnico.`,
    finishReason: "error",
    metadata: buildMetadata(state, startTime),
  };
}

/**
 * Verifica rapidamente la salud del bridge LLM-MCP.
 * Util para health checks del sistema.
 *
 * @returns Estado de salud del bridge
 */
export async function checkBridgeHealth(): Promise<{
  healthy: boolean;
  llmAvailable: boolean;
  mcpServices: Record<string, boolean>;
  toolCount: number;
}> {
  const mcpHealth = healthCheck();
  const toolCount = getToolsForLLM().length;

  // Verificar que el LLM responde
  let llmAvailable = false;
  try {
    const testResponse = await callLlm(
      [
        {
          role: "system",
          content: "Respondé solo 'OK'.",
        },
        { role: "user", content: "Ping" },
      ],
      {
        maxTokens: 10,
        temperature: 0,
        timeoutMs: 5000,
        retries: 1,
      }
    );
    llmAvailable = testResponse.text.length > 0;
  } catch {
    llmAvailable = false;
  }

  const allHealthy = llmAvailable && Object.values(mcpHealth).some((v) => v);

  return {
    healthy: allHealthy,
    llmAvailable,
    mcpServices: mcpHealth,
    toolCount,
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export type {
  ToolCall,
  ChatWithToolsOptions,
  BridgeState,
};
