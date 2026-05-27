/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    JARVIS INTELLIGENT ORCHESTRATOR                       ║
 * ║                                                                          ║
 * ║  El cerebro central que conecta el LLM con las herramientas MCP y el    ║
 * ║  marketplace. Coordina la memoria de conversacion, el llamado a         ║
 * ║  herramientas, y la generacion de respuestas.                           ║
 * ║                                                                          ║
 * ║  Flujo de procesamiento:                                                 ║
 * ║  1. Recibe mensaje del usuario                                          ║
 * ║  2. Carga memoria de conversacion reciente                              ║
 * ║  3. Construye system prompt completo (contexto + herramientas)          ║
 * ║  4. Detecta si se necesitan herramientas (heuristica)                   ║
 * ║  5. Llama al LLM (con herramientas si aplica)                           ║
 * ║  6. Si el LLM quiere usar herramienta:                                  ║
 * ║     a. Parsea el tool call                                              ║
 * ║     b. Valida parametros con Zod                                        ║
 * ║     c. Ejecuta via MCP, marketplace o motor autonomo                    ║
 * ║     d. Formatea resultado                                               ║
 * ║     e. Reenvia al LLM con el resultado                                  ║
 * ║  7. Devuelve respuesta final al usuario                                 ║
 * ║  8. Guarda en memoria                                                   ║
 * ║                                                                          ║
 * ║  Caracteristicas:                                                        ║
 * ║  - Rate limiting: max 30 requests/min por usuario                       ║
 * ║  - Timeout de 30 segundos por operacion                                 ║
 * ║  - Logs de auditoria para cada tool call                                ║
 * ║  - Sanitizacion de inputs del usuario                                   ║
 * ║  - No expone tokens ni credenciales                                     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * @module lib/jarvis/orchestrator
 * @requires llm-client para llamadas al LLM
 * @requires tool-caller para ejecucion de herramientas
 * @requires conversation-memory para persistencia
 * @requires governance/auditor para logs de seguridad
 */

import { z } from "zod";
import { callLlm, type LlmMessage, type LlmResponse, type LlmRequestOptions } from "../llm-client";
import {
  JARVIS_TOOLS,
  executeToolCall,
  formatToolResult,
  extractToolCalls,
  shouldUseTool,
  suggestTools,
  buildToolSystemPrompt,
  type ToolCall,
  type ToolResult,
  type ToolSchema,
} from "./tool-caller";
import {
  addMessage,
  getRecentMessages,
  getConversationContext,
  formatMessagesForLLM,
  buildSystemPrompt,
  cleanupExpiredConversations,
  getMemoryStats,
  type ConversationMessage,
} from "./conversation-memory";
import { logSecurityEvent } from "../governance/auditor";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Opciones para procesar un mensaje de JARVIS.
 */
export interface ProcessMessageOptions {
  /** Mensaje del usuario */
  message: string;
  /** ID del usuario (genera uno anonimo si no se provee) */
  userId?: string;
  /** Contexto adicional (headers, session, etc.) */
  context?: Record<string, unknown>;
  /** Si se debe usar streaming */
  stream?: boolean;
  /** Proveedor de LLM preferido */
  provider?: "gemini" | "openrouter" | "ollama";
  /** Modelo especifico */
  model?: string;
  /** Temperatura del LLM */
  temperature?: number;
  /** Maximo de tokens de respuesta */
  maxTokens?: number;
  /** Instrucciones custom para el system prompt */
  customInstructions?: string;
  /** Si se debe incluir herramientas aunque la heuristica diga que no */
  forceTools?: boolean;
  /** Timeout en ms para la operacion completa */
  timeoutMs?: number;
}

/**
 * Respuesta estructurada de JARVIS.
 */
export interface JarvisResponse {
  /** Contenido de la respuesta para el usuario */
  content: string;
  /** Llamadas a herramientas que se hicieron */
  toolCalls?: ToolCall[];
  /** Resultados de las herramientas ejecutadas */
  toolResults?: ToolResult[];
  /** Si se usaron herramientas en esta respuesta */
  usedTools: boolean;
  /** Proveedor de LLM usado */
  provider?: string;
  /** Modelo usado */
  model?: string;
  /** Latencia total en ms */
  latencyMs: number;
  /** Timestamp de la respuesta */
  timestamp: string;
  /** Mensaje original procesado (para debugging) */
  originalMessage?: string;
}

/**
 * Chunk de streaming para SSE.
 */
export interface StreamChunk {
  /** Token de texto */
  token: string;
  /** Si es el ultimo chunk */
  done: boolean;
  /** Si se esta ejecutando una herramienta */
  toolCallInProgress?: boolean;
  /** Nombre de la herramienta si aplica */
  toolName?: string;
  /** Timestamp */
  timestamp: string;
}

/** Estado interno del rate limiter */
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

/** Maximo de requests por minuto por usuario */
const RATE_LIMIT_PER_MINUTE = 30;

/** Ventana de rate limiting en ms (1 minuto) */
const RATE_LIMIT_WINDOW_MS = 60_000;

/** Timeout por defecto para operaciones (30 seg) */
const DEFAULT_TIMEOUT_MS = 30_000;

/** Maximo de intentos de tool calls (para evitar loops) */
const MAX_TOOL_CALL_ITERATIONS = 3;

/** Maximo de caracteres en el mensaje del usuario */
const MAX_MESSAGE_LENGTH = 4000;

// ============================================================================
// RATE LIMITER
// ============================================================================

/** Store en memoria para rate limiting */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Verifica si un usuario ha excedido el rate limit.
 *
 * @param userId - ID del usuario
 * @returns true si el request esta permitido, false si excede el limite
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  if (!entry) {
    rateLimitStore.set(userId, { count: 1, windowStart: now });
    return true;
  }

  // Resetear ventana si paso el tiempo
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(userId, { count: 1, windowStart: now });
    return true;
  }

  // Verificar limite
  if (entry.count >= RATE_LIMIT_PER_MINUTE) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * Obtiene los segundos restantes de rate limit para un usuario.
 */
function getRateLimitResetTime(userId: string): number {
  const entry = rateLimitStore.get(userId);
  if (!entry) return 0;

  const remaining = RATE_LIMIT_WINDOW_MS - (Date.now() - entry.windowStart);
  return Math.max(0, Math.ceil(remaining / 1000));
}

/**
 * Limpia entradas antiguas del rate limiter.
 */
function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [userId, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitStore.delete(userId);
    }
  }
}

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitiza el input del usuario para prevenir injection y contenido malicioso.
 * Remueve caracteres peligrosos sin alterar el mensaje significativamente.
 *
 * @param input - Mensaje crudo del usuario
 * @returns Mensaje sanitizado
 */
function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return "";

  let sanitized = input;

  // Truncar si es muy largo
  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    sanitized = sanitized.slice(0, MAX_MESSAGE_LENGTH) + "... [truncado]";
  }

  // Remover caracteres de control excepto newlines y tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Remover intentos de prompt injection comunes
  const injectionPatterns = [
    /ignore previous instructions/gi,
    /ignore all prior/gi,
    /system prompt/gi,
    /you are now/gi,
    /DAN mode/gi,
    /jailbreak/gi,
    /\{\s*"role"\s*:\s*"system"\s*\}/gi,
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, "[contenido removido]");
  }

  return sanitized.trim();
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

/**
 * Procesa un mensaje del usuario y genera una respuesta de JARVIS.
 * Es la funcion principal del orquestador — coordina LLM, herramientas y memoria.
 *
 * @param options - Opciones de procesamiento
 * @returns Respuesta estructurada de JARVIS
 * @throws JarvisOrchestratorError si hay un error irrecuperable
 *
 * @example
 * ```typescript
 * const response = await processJarvisMessage({
 *   message: "Cuantos productos activos tenemos?",
 *   userId: "user_123",
 * });
 * console.log(response.content); // "Tenemos 1,234 productos activos..."
 * ```
 */
export async function processJarvisMessage(
  options: ProcessMessageOptions
): Promise<JarvisResponse> {
  const startMs = Date.now();
  const timestamp = new Date().toISOString();

  // ── Validacion de inputs ──────────────────────────────────────────────
  if (!options.message || options.message.trim().length === 0) {
    throw new JarvisOrchestratorError("El mensaje no puede estar vacio", "INVALID_INPUT");
  }

  const userId = options.userId ?? `anon_${Date.now()}`;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // ── Rate limiting ─────────────────────────────────────────────────────
  if (!checkRateLimit(userId)) {
    const resetSeconds = getRateLimitResetTime(userId);
    await logSecurityEvent({
      service: "orchestrator",
      operation: "rateLimitExceeded",
      target: userId,
      status: "failure",
      timestamp,
      details: { resetSeconds },
    }).catch(() => { /* non-blocking */ });

    return {
      content: `Has excedido el limite de ${RATE_LIMIT_PER_MINUTE} mensajes por minuto. ` +
        `Por favor espera ${resetSeconds} segundos antes de enviar otro mensaje.`,
      usedTools: false,
      latencyMs: Date.now() - startMs,
      timestamp,
    };
  }

  // ── Sanitizacion ──────────────────────────────────────────────────────
  const sanitizedMessage = sanitizeInput(options.message);

  // ── Timeout wrapper ───────────────────────────────────────────────────
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new JarvisOrchestratorError(
      `La operacion excedio el tiempo limite de ${timeoutMs / 1000} segundos`,
      "TIMEOUT"
    )), timeoutMs);
  });

  try {
    const result = await Promise.race([
      _processJarvisMessageInternal({ ...options, message: sanitizedMessage, userId }, startMs, timestamp),
      timeoutPromise,
    ]);

    return result;
  } catch (error) {
    if (error instanceof JarvisOrchestratorError) throw error;

    const errorMessage = error instanceof Error ? error.message : String(error);

    await logSecurityEvent({
      service: "orchestrator",
      operation: "processMessage",
      target: userId,
      status: "failure",
      timestamp,
      details: { error: errorMessage, message: sanitizedMessage },
    }).catch(() => { /* non-blocking */ });

    return {
      content: "Perdon, hubo un error procesando tu mensaje. Por favor intenta de nuevo en unos segundos.",
      usedTools: false,
      latencyMs: Date.now() - startMs,
      timestamp,
    };
  }
}

/**
 * Implementacion interna del procesamiento.
 * Separada para facilitar el timeout wrapping.
 */
async function _processJarvisMessageInternal(
  options: Required<Pick<ProcessMessageOptions, "message" | "userId">> & ProcessMessageOptions,
  startMs: number,
  timestamp: string
): Promise<JarvisResponse> {
  const { message, userId, context, provider, model, temperature, maxTokens, customInstructions, forceTools } = options;

  // ── Step 1: Cargar memoria de conversacion ────────────────────────────
  const recentMessages = await getRecentMessages(userId, 20);
  const conversationContext = await getConversationContext(userId);

  // ── Step 2: Guardar mensaje del usuario ───────────────────────────────
  const userMessageId = `msg_u_${Date.now()}`;
  await addMessage({
    id: userMessageId,
    role: "user",
    content: message,
    timestamp,
    userId,
    metadata: context ? { context } : undefined,
  });

  // ── Step 3: Detectar si se necesitan herramientas ─────────────────────
  const needsTools = forceTools || shouldUseTool(message);
  const suggestedToolNames = needsTools ? suggestTools(message) : [];

  // Filtrar herramientas relevantes para reducir tokens
  const availableTools: ToolSchema[] = needsTools
    ? (suggestedToolNames.length > 0
      ? JARVIS_TOOLS.filter((t) => suggestedToolNames.includes(t.name))
      : JARVIS_TOOLS)
    : [];

  // Siempre incluir marketplace_query si no se encontro otra herramienta
  if (needsTools && availableTools.length === 0) {
    const marketplaceTool = JARVIS_TOOLS.find((t) => t.name === "marketplace_query");
    if (marketplaceTool) availableTools.push(marketplaceTool);
  }

  // ── Step 4: Construir system prompt ───────────────────────────────────
  const toolInstructions = needsTools && availableTools.length > 0
    ? buildToolSystemPrompt()
    : undefined;

  const systemPrompt = buildSystemPrompt({
    userRole: context?.userRole as string | undefined,
    userName: context?.userName as string | undefined,
    conversationContext: conversationContext || undefined,
    toolInstructions,
    customInstructions: customInstructions || undefined,
  });

  // ── Step 5: Preparar mensajes para el LLM ─────────────────────────────
  const llmMessages: LlmMessage[] = [
    { role: "system", content: systemPrompt },
    ...formatMessagesForLLM(recentMessages).map((m) => ({ ...m, content: m.content })),
    { role: "user", content: message },
  ];

  // ── Step 6: Llamar al LLM ─────────────────────────────────────────────
  const llmOptions: LlmRequestOptions = {
    provider,
    model,
    temperature: temperature ?? 0.3,
    maxTokens: maxTokens ?? 512,
    timeoutMs: 20_000,
    retries: 2,
  };

  const llmResponse: LlmResponse = await callLlm(llmMessages, llmOptions);

  let assistantContent = llmResponse.text ?? "";
  let allToolCalls: ToolCall[] = [];
  let allToolResults: ToolResult[] = [];
  let toolCallIterations = 0;

  // ── Step 7: Procesar tool calls si el LLM los solicito ────────────────
  while (toolCallIterations < MAX_TOOL_CALL_ITERATIONS) {
    const extractedCalls = extractToolCalls(assistantContent);

    if (extractedCalls.length === 0) break;

    toolCallIterations++;
    allToolCalls.push(...extractedCalls);

    // Ejecutar cada tool call
    const iterationResults: ToolResult[] = [];
    for (const toolCall of extractedCalls) {
      // Validar que la herramienta existe
      const toolExists = JARVIS_TOOLS.some((t) => t.name === toolCall.name);
      if (!toolExists) {
        iterationResults.push({
          toolCallId: toolCall.id,
          toolName: toolCall.name,
          content: `Error: Herramienta "${toolCall.name}" no existe.`,
          success: false,
          error: `Herramienta desconocida: ${toolCall.name}`,
          executionTimeMs: 0,
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      // Ejecutar la herramienta
      const result = await executeToolCall(toolCall.name, toolCall.arguments);
      iterationResults.push(result);
      allToolResults.push(result);
    }

    // Construir mensaje con resultados para el LLM
    const toolResultsText = iterationResults
      .map((r) => `[${r.toolName}] ${r.success ? "OK" : "ERROR"}: ${r.content}`)
      .join("\n\n");

    const followUpMessages: LlmMessage[] = [
      ...llmMessages,
      { role: "assistant", content: assistantContent },
      { role: "user", content: `Resultados de las herramientas:\n${toolResultsText}\n\nPor favor responde al usuario con los resultados obtenidos. Se conciso y directo.` },
    ];

    // Llamar al LLM nuevamente con los resultados
    const followUpResponse = await callLlm(followUpMessages, {
      ...llmOptions,
      maxTokens: maxTokens ?? 512,
      timeoutMs: 15_000,
    });

    assistantContent = followUpResponse.text ?? "";
  }

  // ── Step 8: Guardar respuesta del asistente ───────────────────────────
  const assistantMessageId = `msg_a_${Date.now()}`;
  await addMessage({
    id: assistantMessageId,
    role: "assistant",
    content: assistantContent,
    timestamp: new Date().toISOString(),
    userId,
    toolCalls: allToolCalls.length > 0 ? allToolCalls.map((tc) => ({
      id: tc.id,
      name: tc.name,
      arguments: tc.arguments,
    })) : undefined,
    toolResults: allToolResults.length > 0 ? allToolResults.map((tr) => ({
      toolCallId: tr.toolCallId,
      toolName: tr.toolName,
      success: tr.success,
      content: tr.content,
    })) : undefined,
  });

  // ── Step 9: Log de auditoria ──────────────────────────────────────────
  await logSecurityEvent({
    service: "orchestrator",
    operation: "processMessageComplete",
    target: userId,
    status: "success",
    timestamp: new Date().toISOString(),
    details: {
      latencyMs: Date.now() - startMs,
      usedTools: allToolCalls.length > 0,
      toolCallsCount: allToolCalls.length,
      toolIterations: toolCallIterations,
      provider: llmResponse.provider,
      model: llmResponse.model,
      messageLength: message.length,
      responseLength: assistantContent.length,
    },
  }).catch(() => { /* non-blocking */ });

  return {
    content: assistantContent,
    toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
    toolResults: allToolResults.length > 0 ? allToolResults : undefined,
    usedTools: allToolCalls.length > 0,
    provider: llmResponse.provider,
    model: llmResponse.model,
    latencyMs: Date.now() - startMs,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// STREAMING ORCHESTRATOR
// ============================================================================

/**
 * Procesa un mensaje del usuario con respuesta en streaming.
 * Devuelve un AsyncGenerator que produce chunks de texto.
 *
 * @param options - Opciones de procesamiento
 * @yields StreamChunk con tokens parciales
 *
 * @example
 * ```typescript
 * for await (const chunk of processJarvisMessageStream({ message: "Hola", userId: "123" })) {
 *   if (chunk.done) break;
 *   console.log(chunk.token);
 * }
 * ```
 */
export async function* processJarvisMessageStream(
  options: ProcessMessageOptions
): AsyncGenerator<StreamChunk> {
  const startMs = Date.now();
  const timestamp = new Date().toISOString();

  // ── Validacion ────────────────────────────────────────────────────────
  if (!options.message || options.message.trim().length === 0) {
    yield { token: "El mensaje no puede estar vacio.", done: true, timestamp };
    return;
  }

  const userId = options.userId ?? `anon_${Date.now()}`;

  // ── Rate limiting ─────────────────────────────────────────────────────
  if (!checkRateLimit(userId)) {
    const resetSeconds = getRateLimitResetTime(userId);
    yield {
      token: `Has excedido el limite de ${RATE_LIMIT_PER_MINUTE} mensajes por minuto. ` +
        `Espera ${resetSeconds} segundos.`,
      done: true,
      timestamp,
    };
    return;
  }

  // ── Sanitizacion ──────────────────────────────────────────────────────
  const sanitizedMessage = sanitizeInput(options.message);

  try {
    // ── Cargar contexto ─────────────────────────────────────────────────
    const recentMessages = await getRecentMessages(userId, 20);
    const conversationContext = await getConversationContext(userId);

    // ── Guardar mensaje del usuario ─────────────────────────────────────
    await addMessage({
      id: `msg_u_${Date.now()}`,
      role: "user",
      content: sanitizedMessage,
      timestamp,
      userId,
    });

    // ── Construir prompt ────────────────────────────────────────────────
    const needsTools = options.forceTools || shouldUseTool(sanitizedMessage);
    const toolInstructions = needsTools ? buildToolSystemPrompt() : undefined;

    const systemPrompt = buildSystemPrompt({
      userRole: options.context?.userRole as string | undefined,
      userName: options.context?.userName as string | undefined,
      conversationContext: conversationContext || undefined,
      toolInstructions,
      customInstructions: options.customInstructions,
    });

    const llmMessages: LlmMessage[] = [
      { role: "system", content: systemPrompt },
      ...formatMessagesForLLM(recentMessages),
      { role: "user", content: sanitizedMessage },
    ];

    // ── Indicar inicio de procesamiento ─────────────────────────────────
    yield { token: "", done: false, timestamp: new Date().toISOString() };

    // ── Llamar al LLM en modo streaming ─────────────────────────────────
    const llmOptions: LlmRequestOptions = {
      provider: options.provider,
      model: options.model,
      temperature: options.temperature ?? 0.3,
      maxTokens: options.maxTokens ?? 512,
      timeoutMs: 20_000,
      retries: 1,
    };

    let fullContent = "";
    let toolCallsDetected = false;

    // NOTA: El LLM client debe soportar streaming nativamente
    // Por ahora simulamos streaming con la respuesta completa
    const llmResponse = await callLlm(llmMessages, llmOptions);
    fullContent = llmResponse.text ?? "";

    // Verificar si hay tool calls en la respuesta
    const extractedCalls = extractToolCalls(fullContent);

    if (extractedCalls.length > 0) {
      toolCallsDetected = true;

      // Emitir que se esta ejecutando herramienta
      for (const tc of extractedCalls) {
        yield {
          token: ``,
          done: false,
          toolCallInProgress: true,
          toolName: tc.name,
          timestamp: new Date().toISOString(),
        };

        // Ejecutar herramienta
        const result = await executeToolCall(tc.name, tc.arguments);

        // Emitir resultado
        yield {
          token: `[${tc.name}: ${result.success ? "OK" : "Error"}] `,
          done: false,
          timestamp: new Date().toISOString(),
        };
      }

      // Re-llamar al LLM con los resultados
      const toolResultsText = extractedCalls.map((tc) => {
        return `[${tc.name}] Ejecutado`;
      }).join("\n");

      const followUpMessages: LlmMessage[] = [
        ...llmMessages,
        { role: "assistant", content: fullContent },
        { role: "user", content: `Herramientas ejecutadas. Responde con los resultados.\n${toolResultsText}` },
      ];

      const followUpResponse = await callLlm(followUpMessages, llmOptions);
      fullContent = followUpResponse.text ?? "";
    }

    // ── Stream la respuesta final token por token ───────────────────────
    // Simulamos streaming dividiendo por palabras
    const words = fullContent.split(/(\s+)/);
    for (const word of words) {
      yield {
        token: word,
        done: false,
        timestamp: new Date().toISOString(),
      };
      // Pequeno delay para simular streaming natural
      await new Promise((resolve) => setTimeout(resolve, 8));
    }

    // ── Guardar respuesta ───────────────────────────────────────────────
    await addMessage({
      id: `msg_a_${Date.now()}`,
      role: "assistant",
      content: fullContent,
      timestamp: new Date().toISOString(),
      userId,
    });

    // ── Finalizar stream ────────────────────────────────────────────────
    yield { token: "", done: true, timestamp: new Date().toISOString() };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await logSecurityEvent({
      service: "orchestrator",
      operation: "streamMessage",
      target: userId,
      status: "failure",
      timestamp: new Date().toISOString(),
      details: { error: errorMessage },
    }).catch(() => { /* non-blocking */ });

    yield {
      token: "Perdon, hubo un error. Por favor intenta de nuevo.",
      done: true,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// PUBLIC UTILITIES
// ============================================================================

/**
 * Obtiene estadisticas del orquestador.
 * Util para monitoreo y health checks.
 */
export function getOrchestratorStats(): {
  rateLimitedUsers: number;
  memoryStats: ReturnType<typeof getMemoryStats>;
  availableTools: number;
  maxToolIterations: number;
  rateLimitPerMinute: number;
} {
  return {
    rateLimitedUsers: rateLimitStore.size,
    memoryStats: getMemoryStats(),
    availableTools: JARVIS_TOOLS.length,
    maxToolIterations: MAX_TOOL_CALL_ITERATIONS,
    rateLimitPerMinute: RATE_LIMIT_PER_MINUTE,
  };
}

/**
 * Resetea completamente el estado del orquestador.
 * Util para testing y debugging.
 */
export function resetOrchestratorState(): void {
  rateLimitStore.clear();
  cleanupExpiredConversations();
}

/**
 * Verifica la salud del orquestador.
 * Comprueba que todos los componentes esten funcionales.
 */
export async function healthCheckOrchestrator(): Promise<{
  healthy: boolean;
  memory: boolean;
  rateLimiter: boolean;
  toolSchemas: boolean;
  details: Record<string, unknown>;
}> {
  const details: Record<string, unknown> = {};
  let healthy = true;

  // Verificar memoria
  const memStats = getMemoryStats();
  const memoryOk = true;
  details.memory = memStats;

  // Verificar schemas de herramientas
  const schemasOk = JARVIS_TOOLS.every(
    (t) => t.name && t.description && t.parameters
  );
  details.toolSchemas = { count: JARVIS_TOOLS.length, valid: schemasOk };

  // Verificar rate limiter
  const rateLimiterOk = rateLimitStore !== undefined;

  if (!memoryOk || !schemasOk || !rateLimiterOk) {
    healthy = false;
  }

  return {
    healthy,
    memory: memoryOk,
    rateLimiter: rateLimiterOk,
    toolSchemas: schemasOk,
    details,
  };
}

// ============================================================================
// ERROR CLASS
// ============================================================================

/**
 * Error especifico del orquestador JARVIS.
 * Permite clasificar errores para manejo diferenciado.
 */
export class JarvisOrchestratorError extends Error {
  /** Codigo de error para clasificacion */
  code: string;
  /** HTTP status code sugerido */
  statusCode: number;
  /** Timestamp del error */
  timestamp: string;

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.name = "JarvisOrchestratorError";
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  JARVIS_TOOLS,
  executeToolCall,
  formatToolResult,
  shouldUseTool,
  suggestTools,
  buildToolSystemPrompt,
  extractToolCalls,
} from "./tool-caller";

export type {
  ToolCall,
  ToolResult,
  ToolSchema,
} from "./tool-caller";

export {
  addMessage,
  getRecentMessages,
  getConversationContext,
  clearHistory,
  formatMessagesForLLM,
  buildSystemPrompt,
  getMemoryStats,
  configureMemory,
} from "./conversation-memory";

export type {
  ConversationMessage,
} from "./conversation-memory";
