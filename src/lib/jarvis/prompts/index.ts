/**
 * =============================================================================
 * JARVIS PROMPTS — Barrel Export
 * =============================================================================
 *
 * Exporta todos los modulos de prompts de JARVIS:
 * - System prompt builder (identidad, reglas, contexto)
 * - Tool descriptions (descripciones de herramientas para el LLM)
 * - Response templates (formatters de respuesta consistentes)
 *
 * @example
 * ```typescript
 * import {
 *   buildSystemPrompt,
 *   getToolsForLLM,
 *   formatToolSuccess,
 *   formatToolError,
 * } from "@/lib/jarvis/prompts";
 *
 * const prompt = buildSystemPrompt({ userName: "Juan", userRole: "admin" });
 * const tools = getToolsForLLM();
 * ```
 */

// ─── System Prompt Builder ───────────────────────────────────────────────────

export {
  /** Construye el system prompt completo con contexto dinamico */
  buildSystemPrompt,
  /** Construye un system prompt minimo para operaciones rapidas */
  buildMinimalSystemPrompt,
  /** Construye un system prompt para el motor autonomo */
  buildAutonomousSystemPrompt,
  /** Construye un system prompt para analisis de datos SQL */
  buildAnalyticsSystemPrompt,
  /** Construye un system prompt para modo infraestructura */
  buildInfrastructureSystemPrompt,
} from "./system-prompt";

export type {
  /** Contexto dinamico para el system prompt */
  SystemPromptContext,
} from "./system-prompt";

// ─── Tool Descriptions ───────────────────────────────────────────────────────

export {
  /** Registro maestro de todas las descripciones de herramientas */
  TOOL_DESCRIPTIONS,
  /** Genera schemas de herramientas en formato OpenAI-compatible */
  getToolsForLLM,
  /** Obtiene la descripcion de una operacion especifica */
  getOperationDescription,
  /** Verifica si una operacion requiere confirmacion */
  isOperationDestructive,
  /** Lista las operaciones de un servicio */
  getServiceOperations,
  /** Schemas Zod para validar params de GitHub */
  GitHubParamsSchema,
  /** Schemas Zod para validar params de Railway */
  RailwayParamsSchema,
  /** Schemas Zod para validar params de Supabase */
  SupabaseParamsSchema,
} from "./tool-descriptions";

export type {
  /** Esquema de herramienta para LLM (formato OpenAI) */
  ToolSchema,
} from "./tool-descriptions";

// ─── Response Templates ──────────────────────────────────────────────────────

export {
  /** Formatea una ejecucion exitosa de herramienta */
  formatToolSuccess,
  /** Formatea un error de ejecucion de herramienta */
  formatToolError,
  /** Formatea una solicitud de confirmacion */
  formatConfirmationRequest,
  /** Formatea una solicitud de aclaracion */
  formatClarificationRequest,
  /** Formatea un reporte de salud de servicios */
  formatHealthReport,
  /** Formatea un resumen de ventas */
  formatSalesSummary,
  /** Formatea una lista de productos */
  formatProductList,
  /** Formatea una lista de ordenes */
  formatOrderList,
  /** Formatea el resultado de una tarea autonoma */
  formatAutonomousTaskResult,
  /** Formatea un mensaje de bienvenida */
  formatWelcomeMessage,
  /** Formatea un mensaje de despedida */
  formatGoodbyeMessage,
  /** Formatea un error del sistema */
  formatSystemError,
  /** Formatea una tabla markdown generica */
  formatMarkdownTable,
  /** Trunca un texto a un largo maximo */
  truncateText,
} from "./response-templates";
