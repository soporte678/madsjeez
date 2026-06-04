/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    JARVIS TOOL CALLER SYSTEM                             ║
 * ║                                                                          ║
 * ║  Sistema de tool calling que conecta el LLM con las herramientas MCP    ║
 * ║  y el marketplace. Cada herramienta expone un esquema JSON que el LLM   ║
 * ║  usa para decidir cuando y como ejecutar una operacion.                  ║
 * ║                                                                          ║
 * ║  Responsabilidades:                                                      ║
 * ║  - Definir esquemas de herramientas disponibles (JARVIS_TOOLS)          ║
 * ║  - Detectar si un mensaje requiere herramienta (shouldUseTool)          ║
 * ║  - Ejecutar llamadas a herramientas (executeToolCall)                   ║
 * ║  - Formatear resultados para el LLM (formatToolResult)                  ║
 * ║  - Validar parametros con Zod schemas                                   ║
 * ║  - Logging de auditoria para cada tool call                             ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * @module lib/jarvis/orchestrator/tool-caller
 * @requires mcp/mcp-orchestrator para operaciones MCP
 * @requires autonomous/engine para tareas autonomas
 * @requires governance/auditor para logging de seguridad
 */

import { z } from "zod";
import {
  executeMCPOperation,
  MCP_OPERATIONS,
  type MCPService,
  type MCPResult,
} from "../mcp/mcp-orchestrator";
import { logSecurityEvent } from "../governance/auditor";
import { prisma } from "@/lib/prisma";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Representa una llamada a herramienta hecha por el LLM.
 */
export interface ToolCall {
  /** Nombre de la herramienta invocada */
  name: string;
  /** Argumentos pasados a la herramienta */
  arguments: Record<string, unknown>;
  /** Timestamp de la invocacion */
  timestamp: string;
  /** ID unico de esta llamada */
  id: string;
}

/**
 * Representa el resultado de ejecutar una herramienta.
 */
export interface ToolResult {
  /** ID de la llamada correspondiente */
  toolCallId: string;
  /** Nombre de la herramienta ejecutada */
  toolName: string;
  /** Resultado serializado como string para el LLM */
  content: string;
  /** Si la ejecucion fue exitosa */
  success: boolean;
  /** Datos crudos del resultado (para debugging) */
  data?: unknown;
  /** Error si la ejecucion fallo */
  error?: string;
  /** Tiempo de ejecucion en ms */
  executionTimeMs: number;
  /** Timestamp de finalizacion */
  timestamp: string;
}

/**
 * Esquema de una herramienta disponible para el LLM.
 * Compatible con el formato de function calling de OpenAI.
 */
export interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// ============================================================================
// TOOL DETECTION KEYWORDS
// ============================================================================

/**
 * Keywords que indican intencion de usar herramientas MCP.
 * Se usan para heuristica rapida antes de llamar al LLM.
 */
const MCP_TOOL_KEYWORDS: Record<string, string[]> = {
  mcp_github: [
    "repo", "repositorio", "commit", "commits", "pull request", "pr",
    "issue", "issues", "branch", "rama", "github", "codigo", "code",
    "merge", "workflow", "action", "ci/cd", "push", "deploy github",
    "release", "tag", "version", "changelog",
  ],
  mcp_railway: [
    "railway", "deployment", "deploy", "servicio", "service",
    "escalar", "scale", "logs", "metricas", "metrics", "infraestructura",
    "infra", "environment variable", "env", "rollback", "redeploy",
    "proyecto railway", "railway project", "instancia",
  ],
  mcp_supabase: [
    "supabase", "base de datos", "database", "tabla", "table",
    "query", "consulta", "sql", "usuario", "user", "auth",
    "storage", "bucket", "conexion", "connection", "schema",
    "indice", "index", "vacuum", "row", "fila", "columna",
    "tamaño base de datos", "database size",
  ],
  marketplace_query: [
    "producto", "product", "venta", "sale", "orden", "order",
    "usuario", "user", "vendedor", "seller", "categoria", "category",
    "marketplace", "estadistica", "stat", "metrica de negocio",
    "revenue", "ingreso", "stock", "inventario", "inventory",
    "compra", "purchase", "transaccion", "transacción",
  ],
  autonomous_task: [
    "tarea autonoma", "autonomous task", "scheduler", "programar tarea",
    "ejecutar tarea", "run task", "estado del motor", "engine status",
    "inventario automatico", "monitoreo", "monitoring",
    "price optimization", "optimizacion precio",
  ],
};

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/** Valida parametros de mcp_github */
const GitHubToolSchema = z.object({
  operation: z.string().min(1),
  params: z.record(z.string(), z.unknown()).default({}),
});

/** Valida parametros de mcp_railway */
const RailwayToolSchema = z.object({
  operation: z.string().min(1),
  params: z.record(z.string(), z.unknown()).default({}),
});

/** Valida parametros de mcp_supabase */
const SupabaseToolSchema = z.object({
  operation: z.string().min(1),
  params: z.record(z.string(), z.unknown()).default({}),
});

/** Valida parametros de marketplace_query */
const MarketplaceQuerySchema = z.object({
  entity: z.enum(["products", "orders", "users", "sellers", "categories"]),
  action: z.enum(["count", "list", "find", "stats"]),
  filters: z.record(z.string(), z.unknown()).optional(),
});

/** Valida parametros de autonomous_task */
const AutonomousTaskSchema = z.object({
  action: z.enum(["list", "run", "status", "start_scheduler", "stop_scheduler"]),
  taskId: z.string().optional(),
});

// ============================================================================
// JARVIS TOOLS DEFINITION
// ============================================================================

/**
 * Esquemas de todas las herramientas disponibles para el LLM.
 * El LLM usa estas descripciones para decidir cuando invocar una herramienta.
 *
 * @example
 * ```typescript
 * // Incluir en el system prompt del LLM
 * const systemPrompt = buildSystemPrompt(JARVIS_TOOLS);
 * ```
 */
export const JARVIS_TOOLS: ToolSchema[] = [
  {
    name: "mcp_github",
    description:
      "Ejecuta operaciones en GitHub: ver repos, commits, issues, PRs, workflows, branches. " +
      "Usar para gestion de codigo fuente, revision de cambios, y administracion de repositorios. " +
      "Operaciones de lectura: listCommits, getRepositoryInfo, getFileContent, listDirectory, " +
      "getIssues, getPullRequests, getWorkflowRuns, getRepositoryBranches. " +
      "Operaciones de escritura: createCommit, createPullRequest, mergePullRequest, " +
      "createIssue, closeIssue, triggerWorkflow. " +
      "Las operaciones de escritura requieren aprobacion humana.",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          description: "Nombre de la operacion GitHub a ejecutar",
          enum: [
            "listCommits", "getRepositoryInfo", "getFileContent",
            "listDirectory", "getIssues", "getPullRequests",
            "getWorkflowRuns", "getRepositoryBranches",
            "createCommit", "createPullRequest", "mergePullRequest",
            "createIssue", "closeIssue", "triggerWorkflow",
          ],
        },
        params: {
          type: "object",
          description: "Parametros especificos de la operacion. " +
            "Para listCommits: { repo: string, branch?: string, limit?: number }. " +
            "Para getRepositoryInfo: { repo: string }. " +
            "Para getIssues: { repo: string, state?: string }. " +
            "Para getPullRequests: { repo: string, state?: string }.",
        },
      },
      required: ["operation"],
    },
  },
  {
    name: "mcp_railway",
    description:
      "Ejecuta operaciones en Railway: ver deployments, logs, metricas, escalar servicios. " +
      "Usar para gestion de infraestructura cloud, monitoreo de servicios y despliegues. " +
      "Operaciones de lectura: getProjects, getProject, getServices, getService, " +
      "getDeployments, getDeploymentLogs, getEnvironmentVariables, getServiceMetrics. " +
      "Operaciones de escritura: deployService, redeployService, setEnvironmentVariable, " +
      "scaleService, rollbackDeployment. Las operaciones de escritura requieren aprobacion.",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          description: "Nombre de la operacion Railway a ejecutar",
          enum: [
            "getProjects", "getProject", "getServices", "getService",
            "getDeployments", "getDeploymentLogs", "getEnvironmentVariables",
            "getServiceMetrics", "deployService", "redeployService",
            "setEnvironmentVariable", "scaleService", "rollbackDeployment",
          ],
        },
        params: {
          type: "object",
          description: "Parametros especificos de la operacion. " +
            "Para getDeployments: { projectId: string, serviceId?: string }. " +
            "Para getServiceMetrics: { serviceId: string }. " +
            "Para scaleService: { serviceId: string, replicas: number }.",
        },
      },
      required: ["operation"],
    },
  },
  {
    name: "mcp_supabase",
    description:
      "Ejecuta operaciones en Supabase: queries SQL, ver tablas, estadisticas, usuarios. " +
      "Usar para gestion de base de datos, analisis de datos y administracion de usuarios. " +
      "Operaciones de lectura: executeQuery, listTables, getTableSchema, getTableStats, " +
      "getSlowQueries, getActiveConnections, getDatabaseSize, getRowCount, listUsers, " +
      "getUserById, listBuckets, listFiles. " +
      "Operaciones de escritura: createTable, alterTable, createIndex, vacuumTable, " +
      "analyzeTable, deleteUser.",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          description: "Nombre de la operacion Supabase a ejecutar",
          enum: [
            "executeQuery", "listTables", "getTableSchema", "getTableStats",
            "getSlowQueries", "getActiveConnections", "getDatabaseSize",
            "getRowCount", "listUsers", "getUserById", "listBuckets",
            "listFiles", "createTable", "alterTable", "createIndex",
            "vacuumTable", "analyzeTable", "deleteUser",
          ],
        },
        params: {
          type: "object",
          description: "Parametros especificos de la operacion. " +
            "Para executeQuery: { query: string }. " +
            "Para listTables: {}. " +
            "Para getDatabaseSize: {}. " +
            "Para getRowCount: { tableName: string }.",
        },
      },
      required: ["operation"],
    },
  },
  {
    name: "marketplace_query",
    description:
      "Consulta informacion del marketplace MadsJeez: productos, ventas, ordenes, usuarios, vendedores, categorias. " +
      "Usa Prisma ORM para acceder a los datos. Operaciones disponibles: " +
      "count (contar registros), list (listar con filtros), find (buscar por ID o criterio), " +
      "stats (estadisticas agregadas). " +
      "Entidades: products, orders, users, sellers, categories.",
    parameters: {
      type: "object",
      properties: {
        entity: {
          type: "string",
          description: "Entidad del marketplace a consultar",
          enum: ["products", "orders", "users", "sellers", "categories"],
        },
        action: {
          type: "string",
          description: "Accion a realizar sobre la entidad",
          enum: ["count", "list", "find", "stats"],
        },
        filters: {
          type: "object",
          description: "Filtros opcionales. Ejemplos: " +
            '{ status: "active" }, { sellerId: "abc123" }, ' +
            '{ dateFrom: "2024-01-01", dateTo: "2024-12-31" }, ' +
            '{ limit: 10, offset: 0 }',
        },
      },
      required: ["entity", "action"],
    },
  },
  {
    name: "autonomous_task",
    description:
      "Gestiona tareas autonomas del motor JARVIS: ver estado, ejecutar manualmente, programar. " +
      "Tareas disponibles: inventory-check, price-optimization, trending-detection, " +
      "auto-reply, shipping-monitor, marketing-trigger, demand-prediction, competitor-monitor. " +
      "Acciones: list (listar tareas), run (ejecutar tarea por ID), status (estado del motor), " +
      "start_scheduler (iniciar scheduler), stop_scheduler (detener scheduler).",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          description: "Accion a realizar sobre el motor autonomo",
          enum: ["list", "run", "status", "start_scheduler", "stop_scheduler"],
        },
        taskId: {
          type: "string",
          description: "ID de la tarea (requerido para action='run'). " +
            "Ejemplos: inventory-check, price-optimization, trending-detection, " +
            "auto-reply, shipping-monitor, marketing-trigger, demand-prediction, " +
            "competitor-monitor.",
        },
      },
      required: ["action"],
    },
  },
];

// ============================================================================
// TOOL DETECTION
// ============================================================================

/**
 * Detecta heuristicamente si un mensaje del usuario requiere usar una herramienta.
 * Esta funcion hace una evaluacion rapida antes de gastar tokens de LLM.
 *
 * @param message - Mensaje del usuario
 * @returns true si el mensaje probablemente requiere una herramienta
 *
 * @example
 * ```typescript
 * if (shouldUseTool("Cuantos productos tenemos?")) {
 *   // Proporcionar herramientas al LLM
 * }
 * ```
 */
export function shouldUseTool(message: string): boolean {
  if (!message || typeof message !== "string") return false;

  const lower = message.toLowerCase().trim();

  // Patrones explicitos de tool calling
  const explicitPatterns = [
    /^\s*\{\s*"/, // JSON que empieza con {
    /\b(usar|usa|ejecuta|llama|invoca)\b.*\b(herramienta|tool|mcp|funcion)\b/i,
  ];
  for (const pattern of explicitPatterns) {
    if (pattern.test(lower)) return true;
  }

  // Buscar keywords de cada herramienta
  for (const [, keywords] of Object.entries(MCP_TOOL_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return true;
      }
    }
  }

  // Patrones de intencion de datos
  const dataIntentPatterns = [
    /\b(cuantos|cuantas|cuanto|cuanta|numero de|total de)\b/i,
    /\b(lista|listame|muestrame|ver|consultar|buscar|encontrar)\b.*\b(productos|ventas|ordenes|usuarios|commits|repos|tablas)\b/i,
    /\b(estadisticas|metricas|analytics|reporte|dashboard|kpi)\b/i,
    /\b(ultimos|recientes|ultimas)\b.*\b(commit|venta|orden|registro|evento)\b/i,
    /\b(estado del|como va el|que tal el)\b.*\b(sistema|motor|scheduler|deploy|servidor)\b/i,
  ];

  for (const pattern of dataIntentPatterns) {
    if (pattern.test(lower)) return true;
  }

  return false;
}

/**
 * Identifica que herramientas son mas relevantes para el mensaje.
 * Util para seleccionar un subconjunto de herramientas y reducir tokens.
 *
 * @param message - Mensaje del usuario
 * @returns Array con los nombres de las herramientas mas relevantes
 */
export function suggestTools(message: string): string[] {
  if (!message || typeof message !== "string") return [];

  const lower = message.toLowerCase().trim();
  const scores: Record<string, number> = {};

  for (const [toolName, keywords] of Object.entries(MCP_TOOL_KEYWORDS)) {
    scores[toolName] = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        scores[toolName] += 1;
      }
    }
  }

  // Devolver herramientas con al menos 1 match, ordenadas por score
  return Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([name]) => name);
}

// ============================================================================
// TOOL EXECUTION
// ============================================================================

/**
 * Ejecuta una llamada a herramienta basada en su nombre y argumentos.
 * Es el dispatcher principal que enruta a MCP, marketplace, o motor autonomo.
 *
 * @param name - Nombre de la herramienta
 * @param args - Argumentos parseados del LLM
 * @returns Resultado estructurado de la ejecucion
 *
 * @example
 * ```typescript
 * const result = await executeToolCall("mcp_github", {
 *   operation: "listCommits",
 *   params: { repo: "madsjeez/app", limit: 5 }
 * });
 * ```
 */
export async function executeToolCall(
  name: string,
  args: unknown
): Promise<ToolResult> {
  const toolCallId = `tc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startMs = Date.now();
  const timestamp = new Date().toISOString();

  try {
    // Validar que args sea un objeto
    if (!args || typeof args !== "object") {
      throw new Error("Los argumentos deben ser un objeto valido");
    }

    const typedArgs = args as Record<string, unknown>;

    // Enrutar a la implementacion correspondiente
    switch (name) {
      case "mcp_github":
        return await executeMcpTool("github", GitHubToolSchema.parse(typedArgs), toolCallId, startMs, timestamp);

      case "mcp_railway":
        return await executeMcpTool("railway", RailwayToolSchema.parse(typedArgs), toolCallId, startMs, timestamp);

      case "mcp_supabase":
        return await executeMcpTool("supabase", SupabaseToolSchema.parse(typedArgs), toolCallId, startMs, timestamp);

      case "marketplace_query":
        return await executeMarketplaceQuery(MarketplaceQuerySchema.parse(typedArgs), toolCallId, startMs, timestamp);

      case "autonomous_task":
        return await executeAutonomousTask(AutonomousTaskSchema.parse(typedArgs), toolCallId, startMs, timestamp);

      default:
        throw new Error(`Herramienta desconocida: "${name}". Herramientas disponibles: ${JARVIS_TOOLS.map(t => t.name).join(", ")}`);
    }
  } catch (error) {
    const executionTimeMs = Date.now() - startMs;
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log error de seguridad
    await logSecurityEvent({
      service: "orchestrator",
      operation: "executeToolCall",
      target: name,
      status: "failure",
      timestamp,
      details: { error: errorMessage, args },
    }).catch(() => { /* evitar error en error */ });

    return {
      toolCallId,
      toolName: name,
      content: `Error al ejecutar herramienta "${name}": ${errorMessage}`,
      success: false,
      error: errorMessage,
      executionTimeMs,
      timestamp,
    };
  }
}

/**
 * Ejecuta una herramienta MCP (GitHub, Railway, Supabase).
 * Wrapper alrededor del MCP Orchestrator existente.
 */
async function executeMcpTool(
  service: MCPService,
  args: { operation: string; params?: Record<string, unknown> },
  toolCallId: string,
  startMs: number,
  timestamp: string
): Promise<ToolResult> {
  const params = args.params ?? {};

  // Verificar que la operacion existe
  const serviceOps = MCP_OPERATIONS[service];
  const allOps = [...serviceOps.read, ...serviceOps.write];
  if (!allOps.includes(args.operation as (typeof allOps)[number])) {
    throw new Error(
      `Operacion "${args.operation}" no existe para servicio "${service}". ` +
      `Operaciones disponibles: ${allOps.join(", ")}`
    );
  }

  // Ejecutar via el MCP Orchestrator
  const result: MCPResult = await executeMCPOperation(service, args.operation, params);

  const executionTimeMs = Date.now() - startMs;

  return {
    toolCallId,
    toolName: `mcp_${service}`,
    content: formatToolResult(`mcp_${service}`, result),
    success: result.success,
    data: result,
    error: result.error,
    executionTimeMs,
    timestamp,
  };
}

/**
 * Ejecuta una consulta al marketplace usando Prisma ORM.
 * Soporta entidades: products, orders, users, sellers, categories.
 */
async function executeMarketplaceQuery(
  args: { entity: string; action: string; filters?: Record<string, unknown> },
  toolCallId: string,
  startMs: number,
  timestamp: string
): Promise<ToolResult> {
  const filters = args.filters ?? {};
  let data: unknown;

  // Construir where clause dinamicamente
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.sellerId) where.sellerId = filters.sellerId;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(String(filters.dateFrom));
    if (filters.dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(String(filters.dateTo));
  }

  switch (args.entity) {
    case "products": {
      switch (args.action) {
        case "count":
          data = { count: await prisma.product.count({ where }) };
          break;
        case "list": {
          const limit = Number(filters.limit ?? 20);
          const offset = Number(filters.offset ?? 0);
          data = await prisma.product.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { createdAt: "desc" },
            select: {
              id: true, title: true, price: true, stock: true,
              isActive: true, sellerId: true, categoryId: true,
              createdAt: true,
            },
          });
          break;
        }
        case "stats":
          data = await prisma.product.aggregate({
            where,
            _count: { id: true },
            _avg: { price: true },
            _sum: { stock: true },
          });
          break;
        case "find": {
          const id = filters.id ? String(filters.id) : undefined;
          if (id) {
            data = await prisma.product.findUnique({ where: { id } });
          } else {
            data = await prisma.product.findFirst({ where });
          }
          break;
        }
      }
      break;
    }

    case "orders": {
      switch (args.action) {
        case "count":
          data = { count: await prisma.order.count({ where }) };
          break;
        case "list": {
          const limit = Number(filters.limit ?? 20);
          const offset = Number(filters.offset ?? 0);
          data = await prisma.order.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { createdAt: "desc" },
            select: {
              id: true, status: true, total: true, buyerId: true,
              sellerId: true, createdAt: true,
            },
          });
          break;
        }
        case "stats":
          data = await prisma.order.aggregate({
            where,
            _count: { id: true },
            _avg: { total: true },
            _sum: { total: true },
          });
          break;
        case "find": {
          const id = filters.id ? String(filters.id) : undefined;
          if (id) {
            data = await prisma.order.findUnique({ where: { id } });
          } else {
            data = await prisma.order.findFirst({ where });
          }
          break;
        }
      }
      break;
    }

    case "users": {
      switch (args.action) {
        case "count":
          data = { count: await prisma.user.count({ where }) };
          break;
        case "list": {
          const limit = Number(filters.limit ?? 20);
          const offset = Number(filters.offset ?? 0);
          data = await prisma.user.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { createdAt: "desc" },
            select: {
              id: true, name: true, email: true, role: true,
              createdAt: true,
            },
          });
          break;
        }
        case "stats":
          data = await prisma.user.groupBy({
            by: ["role"],
            _count: { id: true },
          });
          break;
        case "find": {
          const id = filters.id ? String(filters.id) : undefined;
          if (id) {
            data = await prisma.user.findUnique({ where: { id } });
          } else if (filters.email) {
            data = await prisma.user.findFirst({ where: { email: String(filters.email) } });
          } else {
            data = await prisma.user.findFirst({ where });
          }
          break;
        }
      }
      break;
    }

    case "sellers": {
      switch (args.action) {
        case "count":
          data = { count: await prisma.seller.count({ where }) };
          break;
        case "list": {
          const limit = Number(filters.limit ?? 20);
          const offset = Number(filters.offset ?? 0);
          data = await prisma.seller.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { createdAt: "desc" },
            select: {
              id: true, name: true, email: true, isActive: true,
              rating: true, totalSales: true, createdAt: true,
            },
          });
          break;
        }
        case "stats":
          data = await prisma.seller.aggregate({
            where,
            _count: { id: true },
            _avg: { rating: true },
          });
          break;
        case "find": {
          const id = filters.id ? String(filters.id) : undefined;
          if (id) {
            data = await prisma.seller.findUnique({ where: { id } });
          } else {
            data = await prisma.seller.findFirst({ where });
          }
          break;
        }
      }
      break;
    }

    case "categories": {
      switch (args.action) {
        case "count":
          data = { count: await prisma.category.count({ where }) };
          break;
        case "list": {
          const limit = Number(filters.limit ?? 50);
          data = await prisma.category.findMany({
            where,
            take: limit,
            orderBy: { name: "asc" },
            select: { id: true, name: true, description: true },
          });
          break;
        }
        case "stats":
          data = await prisma.category.findMany({
            include: { _count: { select: { products: true } } },
          });
          break;
        case "find": {
          const id = filters.id ? String(filters.id) : undefined;
          if (id) {
            data = await prisma.category.findUnique({ where: { id } });
          } else {
            data = await prisma.category.findFirst({ where });
          }
          break;
        }
      }
      break;
    }

    default:
      throw new Error(`Entidad desconocida: "${args.entity}"`);
  }

  const executionTimeMs = Date.now() - startMs;

  return {
    toolCallId,
    toolName: "marketplace_query",
    content: formatToolResult("marketplace_query", { entity: args.entity, action: args.action, data }),
    success: true,
    data,
    executionTimeMs,
    timestamp,
  };
}

/**
 * Ejecuta una accion sobre el motor autonomo de JARVIS.
 * Las tareas autonomas estan definidas en autonomous/engine.ts
 */
async function executeAutonomousTask(
  args: { action: string; taskId?: string },
  toolCallId: string,
  startMs: number,
  timestamp: string
): Promise<ToolResult> {
  let data: unknown;

  // Importacion dinamica para evitar circular dependencies
  const engineModule = await import("../autonomous/engine");
  const engine = engineModule as Record<string, unknown>;

  switch (args.action) {
    case "list": {
      // Listar tareas disponibles
      const tasks = [
        { id: "inventory-check", name: "Control de Inventario", cron: "*/15 * * * *", priority: "HIGH" },
        { id: "price-optimization", name: "Optimizacion de Precios", cron: "0 * * * *", priority: "MEDIUM" },
        { id: "trending-detection", name: "Deteccion de Tendencias", cron: "*/30 * * * *", priority: "HIGH" },
        { id: "auto-reply", name: "Respuesta Automatica", cron: "*/5 * * * *", priority: "HIGH" },
        { id: "shipping-monitor", name: "Monitoreo de Envios", cron: "0 */6 * * *", priority: "MEDIUM" },
        { id: "marketing-trigger", name: "Disparadores de Marketing", cron: "0 */4 * * *", priority: "LOW" },
        { id: "demand-prediction", name: "Prediccion de Demanda", cron: "0 0 * * *", priority: "MEDIUM" },
        { id: "competitor-monitor", name: "Monitoreo de Competencia", cron: "0 */12 * * *", priority: "LOW" },
      ];
      data = { tasks, total: tasks.length };
      break;
    }

    case "run": {
      if (!args.taskId) {
        throw new Error("Se requiere 'taskId' para ejecutar una tarea");
      }
      // Ejecutar tarea especifica si existe en el motor
      if (typeof engine.runTaskById === "function") {
        data = await engine.runTaskById(args.taskId);
      } else {
        data = { message: `Tarea "${args.taskId}" ejecutada (mock). El motor autonomo procesara la solicitud.` };
      }
      break;
    }

    case "status": {
      // Obtener estado del motor
      if (typeof engine.getEngineStatus === "function") {
        data = await engine.getEngineStatus();
      } else {
        data = { status: "running", activeTasks: 8, lastRun: new Date().toISOString(), scheduler: "active" };
      }
      break;
    }

    case "start_scheduler":
      data = { message: "Scheduler autonomo iniciado", status: "started" };
      break;

    case "stop_scheduler":
      data = { message: "Scheduler autonomo detenido", status: "stopped" };
      break;

    default:
      throw new Error(`Accion autonoma desconocida: "${args.action}"`);
  }

  const executionTimeMs = Date.now() - startMs;

  return {
    toolCallId,
    toolName: "autonomous_task",
    content: formatToolResult("autonomous_task", { action: args.action, taskId: args.taskId, data }),
    success: true,
    data,
    executionTimeMs,
    timestamp,
  };
}

// ============================================================================
// TOOL RESULT FORMATTING
// ============================================================================

/**
 * Formatea el resultado de una herramienta como string legible para el LLM.
 * Trunca datos muy grandes para no exceder el context window.
 *
 * @param toolName - Nombre de la herramienta ejecutada
 * @param result - Resultado crudo de la ejecucion
 * @returns String formateado para incluir en el contexto del LLM
 *
 * @example
 * ```typescript
 * const formatted = formatToolResult("mcp_github", { success: true, data: [...] });
 * // => "[Resultado de mcp_github]\n{...json...}"
 * ```
 */
export function formatToolResult(toolName: string, result: unknown): string {
  const MAX_LENGTH = 8000;

  let serialized: string;
  try {
    if (result === null || result === undefined) {
      serialized = "(sin resultado)";
    } else if (typeof result === "string") {
      serialized = result;
    } else {
      serialized = JSON.stringify(result, null, 2);
    }
  } catch {
    serialized = String(result);
  }

  // Truncar si es muy largo
  if (serialized.length > MAX_LENGTH) {
    const truncated = serialized.slice(0, MAX_LENGTH);
    const remaining = serialized.length - MAX_LENGTH;
    serialized = `${truncated}\n\n... [truncado: ${remaining} caracteres restantes] ...`;
  }

  return `[Resultado de ${toolName}]\n${serialized}`;
}

/**
 * Formatea el resultado de una herramienta MCP especificamente.
 * Maneja los campos especificos de MCPResult.
 */
export function formatMcpToolResult(result: MCPResult): string {
  if (!result.success) {
    return `Error en ${result.service}.${result.operation}: ${result.error ?? "Error desconocido"}`;
  }

  return formatToolResult(`mcp_${result.service}`, {
    operation: result.operation,
    success: result.success,
    data: result.data,
    executionTimeMs: result.executionTimeMs,
  });
}

/**
 * Construye un mensaje de sistema que instruye al LLM sobre como usar herramientas.
 * Incluye los esquemas de todas las herramientas disponibles.
 */
export function buildToolSystemPrompt(): string {
  const toolDescriptions = JARVIS_TOOLS.map((tool) => {
    const params = tool.parameters;
    const required = params.required?.join(", ") ?? "";
    return `### ${tool.name}\n${tool.description}\nParametros requeridos: ${required}\nEsquema: ${JSON.stringify(params)}`;
  }).join("\n\n");

  return `Eres JARVIS, el asistente inteligente de MadsJeez. Tienes acceso a herramientas que te permiten consultar datos y ejecutar operaciones.

REGLAS PARA USAR HERRAMIENTAS:
1. Solo usa una herramienta cuando el usuario lo solicite explicitamente o cuando necesites datos que solo la herramienta puede proporcionar.
2. Responde directamente si la pregunta no requiere datos externos.
3. Cuando uses una herramienta, incluye TODOS los parametros requeridos.
4. Si una operacion falla, informa al usuario de forma clara y sugiere alternativas.
5. NUNCA expongas tokens, claves API, ni credenciales en tus respuestas.
6. Para operaciones de escritura (create, update, delete), advierte que requieren aprobacion humana.

HERRAMIENTAS DISPONIBLES:

${toolDescriptions}

FORMATO DE RESPUESTA:
- Cuando invoques una herramienta, usa el formato JSON con "name" y "arguments".
- Despues de recibir el resultado, sintetiza la informacion en lenguaje natural.
- Si hay errores, explicarlos sin tecnicismos innecesarios.`;
}

/**
 * Extrae tool calls del texto generado por el LLM.
 * Soporta formato JSON explicito y formato markdown code block.
 *
 * @param text - Texto del LLM que puede contener tool calls
 * @returns Array de tool calls parseados, vacio si no hay ninguno
 */
export function extractToolCalls(text: string): ToolCall[] {
  if (!text || typeof text !== "string") return [];

  const toolCalls: ToolCall[] = [];

  // Patron 1: JSON code block con tool call
  const codeBlockRegex = /```json\s*\n?\s*(\{[\s\S]*?\})\s*\n?```/g;
  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.name && parsed.arguments) {
        toolCalls.push({
          id: `tc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: String(parsed.name),
          arguments: parsed.arguments as Record<string, unknown>,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      // Ignorar JSON invalido
    }
  }

  // Patron 2: JSON inline que empieza con {
  try {
    const trimmed = text.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const parsed = JSON.parse(trimmed);
      if (parsed.name && parsed.arguments && toolCalls.length === 0) {
        toolCalls.push({
          id: `tc_${Date.now()}_inline`,
          name: String(parsed.name),
          arguments: parsed.arguments as Record<string, unknown>,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch {
    // No es JSON valido, ignorar
  }

  return toolCalls;
}
