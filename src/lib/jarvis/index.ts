/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    JARVIS — ENTRY POINT UNIFICADO                        ║
 * ║                                                                          ║
 * ║  Este es el barrel export principal de JARVIS. TODA interaccion con    ║
 * ║  el sistema debe pasar por aqui para garantizar:                        ║
 * ║                                                                          ║
 * ║  1. Consistencia de imports                                              ║
 * ║  2. Single source of truth                                               ║
 * ║  3. Type safety completo                                                 ║
 * ║  4. Facil testing y mocking                                              ║
 * ║                                                                          ║
 * ║  Regla: SIEMPRE importar desde @/lib/jarvis, NUNCA de submodulos.     ║
 * ║                                                                          ║
 * ║  Ejemplo:                                                                ║
 * ║    import { processJarvisMessage, getJarvisConfig } from "@/lib/jarvis"; ║
 * ║                                                                          ║
 * ║  NO importar asi:                                                        ║
 * ║    import { processJarvisMessage } from "@/lib/jarvis/orchestrator";     ║
 * ║  (excepto dentro del propio modulo JARVIS)                               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * @module lib/jarvis
 * @version 1.0.0
 */

// ═════════════════════════════════════════════════════════════════════════════
// ORCHESTRADOR — Cerebro central de JARVIS
// ═════════════════════════════════════════════════════════════════════════════

export {
  /** Procesa un mensaje del usuario y devuelve la respuesta completa */
  processJarvisMessage,
  /** Procesa un mensaje con streaming (SSE) */
  processJarvisMessageStream,
  /** Obtiene estadisticas del orquestador */
  getOrchestratorStats,
  /** Resetea el estado del orquestador (testing) */
  resetOrchestratorState,
  /** Health check del orquestador */
  healthCheckOrchestrator,
  /** Error especifico del orquestador */
  JarvisOrchestratorError,
} from "./orchestrator";

export type {
  /** Opciones para procesar un mensaje */
  ProcessMessageOptions,
  /** Respuesta estructurada de JARVIS */
  JarvisResponse,
  /** Chunk de streaming SSE */
  StreamChunk,
} from "./orchestrator";

// ═════════════════════════════════════════════════════════════════════════════
// LLM-MCP BRIDGE — Puente LLM ↔ Herramientas MCP
// ═════════════════════════════════════════════════════════════════════════════

export {
  /** Chatea con el LLM usando herramientas MCP */
  chatWithTools,
  /** Procesa una confirmacion de tool call */
  processToolConfirmation,
  /** Health check del bridge */
  checkBridgeHealth,
} from "./llm-mcp-bridge";

export type {
  /** Respuesta del LLM */
  LLMResponse,
  /** Opciones para chatWithTools */
  ChatWithToolsOptions,
} from "./llm-mcp-bridge";

// ═════════════════════════════════════════════════════════════════════════════
// PROMPTS — Construccion de prompts del sistema
// ═════════════════════════════════════════════════════════════════════════════

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
  /** Obtiene las herramientas disponibles para el LLM en formato OpenAI */
  getToolsForLLM,
  /** Obtiene la descripcion de una operacion especifica */
  getOperationDescription,
  /** Verifica si una operacion es destructiva */
  isOperationDestructive,
  /** Lista las operaciones de un servicio */
  getServiceOperations,
  /** Registro maestro de descripciones de herramientas */
  TOOL_DESCRIPTIONS,
  /** Formatea resultado exitoso de herramienta */
  formatToolSuccess,
  /** Formatea error de herramienta */
  formatToolError,
  /** Formatea solicitud de confirmacion */
  formatConfirmationRequest,
  /** Formatea mensaje de bienvenida */
  formatWelcomeMessage,
  /** Formatea error del sistema */
  formatSystemError,
  /** Schemas Zod para parametros de GitHub */
  GitHubParamsSchema,
  /** Schemas Zod para parametros de Railway */
  RailwayParamsSchema,
  /** Schemas Zod para parametros de Supabase */
  SupabaseParamsSchema,
} from "./prompts";

export type {
  /** Contexto dinamico para el system prompt */
  SystemPromptContext,
  /** Esquema de herramienta para LLM */
  ToolSchema,
} from "./prompts";

// ═════════════════════════════════════════════════════════════════════════════
// MCP — Model Context Protocol
// ═════════════════════════════════════════════════════════════════════════════

export {
  /** Ejecuta una operacion MCP con governance checks */
  executeMCPOperation,
  /** Verifica si una operacion requiere aprobacion humana */
  requiresApproval,
  /** Obtiene todas las operaciones disponibles */
  getAvailableOperations,
  /** Obtiene estadisticas de MCP */
  getMCPStats,
  /** Verifica si un servicio esta saludable */
  isServiceHealthy,
  /** Health check de todos los servicios MCP */
  healthCheck,
  /** Registro de todas las operaciones MCP */
  MCP_OPERATIONS,
  // GitHub
  getRepositoryInfo,
  listCommits,
  getFileContent,
  listDirectory,
  getIssues,
  getPullRequests,
  getWorkflowRuns,
  getRepositoryBranches,
  createCommit,
  createPullRequest,
  mergePullRequest,
  createIssue,
  closeIssue,
  triggerWorkflow,
  // Railway
  getProjects,
  getProject,
  getServices,
  getService,
  getDeployments,
  getDeploymentLogs,
  getEnvironmentVariables,
  getServiceMetrics,
  deployService,
  redeployService,
  setEnvironmentVariable,
  scaleService,
  rollbackDeployment,
  // Supabase
  executeQuery,
  listTables,
  getTableSchema,
  getTableStats,
  getSlowQueries,
  getActiveConnections,
  getDatabaseSize,
  getRowCount,
  createTable,
  alterTable,
  createIndex,
  vacuumTable,
  analyzeTable,
  listUsers,
  getUserById,
  deleteUser,
  listBuckets,
  listFiles,
} from "./mcp";

export type {
  /** Servicios MCP disponibles */
  MCPService,
  /** Tipo de operacion (read/write/admin) */
  OperationType,
  /** Resultado estandar de operacion MCP */
  MCPResult,
  /** Solicitud de aprobacion */
  ApprovalRequest,
  // GitHub
  GitHubAction,
  RepoRef,
  CommitInfo,
  IssueInfo,
  PullRequestInfo,
  WorkflowRunInfo,
  FileContent,
  DirectoryEntry,
  // Railway
  RailwayProject,
  RailwayService,
  RailwayDeployment,
  ServiceMetrics,
  // Supabase
  ColumnDef,
  AlterChange,
  SchemaColumn,
  TableStats,
  SlowQuery,
  UserInfo,
  BucketInfo,
} from "./mcp";

// ═════════════════════════════════════════════════════════════════════════════
// AUTOCONFIGURATION — Inicializacion y configuracion
// ═════════════════════════════════════════════════════════════════════════════

export {
  /** Inicializa JARVIS (crea tablas, seed config, verifica conexion) */
  initializeJarvis,
  /** Verifica conexion a Supabase */
  checkSupabaseConnection,
  /** Verifica existencia de tabla jarvis_config */
  checkJarvisConfigTable,
  /** Crea tabla jarvis_config */
  createJarvisConfigTable,
  /** Inserta configuracion por defecto */
  seedDefaultConfig,
  /** Crea tabla de memoria de conversacion */
  createConversationMemoryTable,
  /** Crea tabla de auditoria */
  createAuditLogTable,
  /** Obtiene un valor de config por key */
  getJarvisConfig,
  /** Establece un valor de config */
  setJarvisConfig,
  /** Obtiene toda la configuracion como record */
  getAllJarvisConfig,
  /** Verifica si JARVIS esta habilitado */
  isJarvisEnabled,
  /** Obtiene metadata de una config key */
  getJarvisConfigMeta,
  /** Elimina una config key */
  deleteJarvisConfig,
  /** Obtiene configs por categoria */
  getJarvisConfigByCategory,
  /** Obtiene resumen de salud del sistema */
  getJarvisHealthStatus,
  /** Configuracion por defecto */
  DEFAULT_CONFIG,
} from "./init-jarvis";

export type {
  /** Resultado de un paso de inicializacion */
  InitStep,
  /** Resultado completo de la inicializacion */
  InitResult,
} from "./init-jarvis";

// ═════════════════════════════════════════════════════════════════════════════
// AUTONOMOUS — Motor de tareas autonomas
// ═════════════════════════════════════════════════════════════════════════════

export {
  /** Ejecuta una tarea autonoma */
  runAutonomousTask,
  /** Obtiene la lista de tareas autonomas disponibles */
  getAutonomousTasks,
  /** Registro de todas las tareas autonomas */
  AUTONOMOUS_TASKS,
  /** Obtiene el scheduler global */
  getScheduler,
  /** Destruye el scheduler global */
  destroyScheduler,
} from "./autonomous";

export type {
  /** Definicion de una tarea autonoma */
  AutonomousTask,
  /** Resultado de una tarea */
  TaskResult,
  /** Prioridad de tarea */
  TaskPriority,
  /** Tarea programada */
  ScheduledTask,
  /** Registro de ejecucion */
  TaskRunRecord,
} from "./autonomous";

// ═════════════════════════════════════════════════════════════════════════════
// GOVERNANCE — Sistema de gobernanza y auditoria
// ═════════════════════════════════════════════════════════════════════════════

export {
  /** Evalua una accion propuesta contra la constitucion */
  evaluateAction,
  /** Escaneo rapido de seguridad */
  quickScan,
  /** Ejecuta una funcion con enforcement de gobernanza */
  executeWithEnforcement,
  /** Registra un evento de seguridad */
  logSecurityEvent,
  /** Obtiene eventos de seguridad */
  getSecurityEvents,
  /** Obtiene eventos por nivel */
  getSecurityEventsByLevel,
  /** Obtiene eventos por regla */
  getSecurityEventsByRule,
  /** Obtiene el buffer de memoria del auditor */
  getMemoryBuffer,
  /** Limpia el buffer de memoria */
  clearMemoryBuffer,
  /** Verifica integridad de una entrada */
  verifyEntryIntegrity,
  /** Obtiene estadisticas de auditoria */
  getAuditStats,
  // Constitucion
  JARVIS_CONSTITUTION,
  CONSTITUTION_VERSION,
  CONSTITUTION_RULE_COUNT,
  CONSTITUTION_CHECKSUM,
  CONSTITUTION_CREATED,
  CONSTITUTION_UPDATED,
  // Vault
  sanitize,
  sanitizeObject,
  createSafePrompt,
  containsSensitiveData,
  detectSensitiveData,
  maskSpecific,
  redactForLogging,
  safeStringify,
  verifySanitization,
  getVaultInfo,
} from "./governance";

export type {
  /** Accion propuesta para evaluacion */
  ProposedAction,
  /** Resultado del enforcement */
  EnforcementResult,
  /** Evento de seguridad */
  SecurityEvent,
  /** Nivel de seguridad */
  SecurityLevel,
  /** Entrada de auditoria */
  AuditEntry,
  /** Violacion de regla */
  RuleViolation,
} from "./governance";

// ═════════════════════════════════════════════════════════════════════════════
// VOICE — Comandos de voz y wake word
// ═════════════════════════════════════════════════════════════════════════════

export {
  /** Parsea un comando de voz en una accion estructurada */
  parseVoiceCommand,
  /** Obtiene sugerencias de comandos de voz */
  getSuggestedCommands,
  /** Formatea feedback para voz */
  formatVoiceFeedback,
  /** Verifica si un texto contiene el wake word */
  hasWakeWord,
  /** Remueve el prefijo de wake word */
  stripWakePrefix,
  /** Parsea una transcripcion de voz */
  parseVoiceTranscript,
  /** Verifica si el wake word es requerido */
  isWakeWordRequired,
} from "./voice-command-parser";

export type {
  /** Accion de voz posible */
  VoiceAction,
  /** Resultado del parseo de voz */
  VoiceCommandParseResult,
  /** Entidades extraidas del comando de voz */
  VoiceEntities,
  /** Resultado del parseo de transcripcion */
  VoiceParseResult,
} from "./voice-command-parser";

// ═════════════════════════════════════════════════════════════════════════════
// LLM CLIENT — Cliente para llamadas a LLM
// ═════════════════════════════════════════════════════════════════════════════

export {
  /** Llama al LLM con mensajes */
  callLlm,
} from "./llm-client";

export type {
  /** Mensaje para el LLM */
  LlmMessage,
  /** Respuesta del LLM */
  LlmResponse,
  /** Opciones de request al LLM */
  LlmRequestOptions,
} from "./llm-client";

// ═════════════════════════════════════════════════════════════════════════════
// CONVERSATION MEMORY — Memoria de conversacion
// ═════════════════════════════════════════════════════════════════════════════

export {
  /** Agrega un mensaje a la memoria */
  addMessage,
  /** Obtiene mensajes recientes de un usuario */
  getRecentMessages,
  /** Obtiene el contexto de una conversacion */
  getConversationContext,
  /** Limpia el historial de un usuario */
  clearHistory,
  /** Formatea mensajes para el LLM */
  formatMessagesForLLM,
  /** Obtiene estadisticas de memoria */
  getMemoryStats,
  /** Configura la memoria */
  configureMemory,
  /** Limpia conversaciones expiradas */
  cleanupExpiredConversations,
} from "./orchestrator";

export type {
  /** Mensaje de conversacion */
  ConversationMessage,
} from "./orchestrator";

// ═════════════════════════════════════════════════════════════════════════════
// TOOL CALLER — Ejecucion de herramientas
// ═════════════════════════════════════════════════════════════════════════════

export {
  /** Lista de todas las herramientas disponibles */
  JARVIS_TOOLS,
  /** Ejecuta una llamada a herramienta */
  executeToolCall,
  /** Formatea el resultado de una herramienta */
  formatToolResult,
  /** Determina si un mensaje requiere herramientas */
  shouldUseTool,
  /** Sugiere herramientas para un mensaje */
  suggestTools,
  /** Construye instrucciones de herramientas para el system prompt */
  buildToolSystemPrompt,
  /** Extrae tool calls de una respuesta de LLM */
  extractToolCalls,
} from "./orchestrator";

// ═════════════════════════════════════════════════════════════════════════════
// VERSION
// ═════════════════════════════════════════════════════════════════════════════

/** Version actual del sistema JARVIS */
export const JARVIS_VERSION = "1.0.0";

/** Nombre del sistema */
export const JARVIS_NAME = "JARVIS";

/** Nombre completo del sistema */
export const JARVIS_FULL_NAME = "Just A Rather Very Intelligent System";
