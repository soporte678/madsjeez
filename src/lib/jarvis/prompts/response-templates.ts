/**
 * =============================================================================
 * JARVIS RESPONSE TEMPLATES
 * =============================================================================
 *
 * Templates y formatters para las respuestas de JARVIS.
 * Garantizan consistencia en el tono, formato y estilo de todas las
 * respuestas del asistente, en español rioplatense.
 *
 * @module lib/jarvis/prompts/response-templates
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** Datos de un producto para formateo. */
interface ProductData {
  id: string;
  title: string;
  price: number;
  stock: number;
  category?: string;
  sellerName?: string;
  isActive?: boolean;
}

/** Datos de una orden para formateo. */
interface OrderData {
  id: string;
  buyerName?: string;
  total: number;
  status: string;
  createdAt: string | Date;
  itemCount?: number;
}

/** Datos de una venta para el resumen. */
interface SaleSummaryData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  period: string;
  topProducts?: Array<{ title: string; quantity: number; revenue: number }>;
  comparison?: {
    previousRevenue: number;
    previousOrders: number;
    revenueChange: number;
    ordersChange: number;
  };
}

// ─── Emoji Constants ─────────────────────────────────────────────────────────

const EMOJI = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
  tool: "🔧",
  question: "❓",
  suggestion: "💡",
  chart: "📊",
  health: "🏥",
  lock: "🔒",
  rocket: "🚀",
  clock: "🕐",
  money: "💰",
  package: "📦",
  user: "👤",
  search: "🔍",
  database: "🗄️",
  server: "🖥️",
  code: "💻",
  arrow: "➡️",
  check: "✓",
  cross: "✗",
  pending: "⏳",
  critical: "🚨",
} as const;

// ─── Tool Execution Templates ────────────────────────────────────────────────

/**
 * Formatea una respuesta exitosa de ejecución de herramienta.
 *
 * @param toolName - Nombre de la herramienta ejecutada
 * @param result - Resultado de la operación (cualquier tipo)
 * @returns String formateado para el usuario
 *
 * @example
 * ```typescript
 * formatToolSuccess("github.listCommits", [{ sha: "abc123", message: "Fix bug" }]);
 * // "✅ Ejecuté github.listCommits exitosamente..."
 * ```
 */
export function formatToolSuccess(toolName: string, result: unknown): string {
  const lines: string[] = [];
  lines.push(`${EMOJI.success} Ejecuté **${toolName}** exitosamente.`);
  lines.push("");

  if (result === null || result === undefined) {
    lines.push("La operación se completó sin datos de retorno.");
  } else if (typeof result === "string") {
    lines.push(result);
  } else if (typeof result === "number") {
    lines.push(`Resultado: **${result.toLocaleString("es-AR")}**`);
  } else if (typeof result === "boolean") {
    lines.push(`Resultado: **${result ? "Sí" : "No"}**`);
  } else if (Array.isArray(result)) {
    if (result.length === 0) {
      lines.push("La consulta no devolvió resultados.");
    } else {
      lines.push(`Encontré **${result.length}** resultado(s):`);
      lines.push("");
      // Mostrar primeros 10 elementos como bullet points
      const preview = result.slice(0, 10);
      for (const item of preview) {
        if (typeof item === "string") {
          lines.push(`  - ${item}`);
        } else if (typeof item === "object" && item !== null) {
          const obj = item as Record<string, unknown>;
          const summary = Object.entries(obj)
            .slice(0, 3)
            .map(([k, v]) => `${k}: ${String(v).slice(0, 40)}`)
            .join(" | ");
          lines.push(`  - ${summary}`);
        }
      }
      if (result.length > 10) {
        lines.push(`  - ... y **${result.length - 10}** más.`);
      }
    }
  } else if (typeof result === "object") {
    const obj = result as Record<string, unknown>;
    const entries = Object.entries(obj);
    if (entries.length === 0) {
      lines.push("Objeto vacío.");
    } else {
      for (const [key, value] of entries.slice(0, 15)) {
        const displayValue =
          typeof value === "object"
            ? JSON.stringify(value).slice(0, 60)
            : String(value).slice(0, 60);
        lines.push(`- **${key}:** ${displayValue}`);
      }
      if (entries.length > 15) {
        lines.push(`- ... y ${entries.length - 15} campos más.`);
      }
    }
  }

  return lines.join("\n");
}

/**
 * Formatea una respuesta de error de ejecución de herramienta.
 *
 * @param toolName - Nombre de la herramienta que falló
 * @param error - Mensaje de error
 * @returns String formateado con el error y sugerencias
 *
 * @example
 * ```typescript
 * formatToolError("supabase.executeQuery", "Connection timeout");
 * // "❌ Falló supabase.executeQuery..."
 * ```
 */
export function formatToolError(toolName: string, error: string): string {
  const lines: string[] = [];
  lines.push(`${EMOJI.error} Falló **${toolName}**`);
  lines.push("");
  lines.push(`**Error:** ${error}`);
  lines.push("");
  lines.push(`${EMOJI.suggestion} **Posibles causas y soluciones:**`);

  // Sugerencias contextuales según el tipo de error
  const errorLower = error.toLowerCase();
  if (errorLower.includes("timeout") || errorLower.includes("timed out")) {
    lines.push("1. El servicio está lento o sobrecargado — probá de nuevo en unos segundos");
    lines.push("2. Verificá el estado de salud del servicio con \`/estado\`");
  } else if (errorLower.includes("auth") || errorLower.includes("unauthorized") || errorLower.includes("401")) {
    lines.push("1. El token de autenticación puede haber expirado");
    lines.push("2. Verificá que las credenciales estén configuradas correctamente");
  } else if (errorLower.includes("not found") || errorLower.includes("404")) {
    lines.push("1. El recurso solicitado no existe");
    lines.push("2. Verificá los parámetros (IDs, nombres, rutas)");
  } else if (errorLower.includes("connection") || errorLower.includes("refused")) {
    lines.push("1. El servicio puede estar caído temporalmente");
    lines.push("2. Verificá tu conexión de red");
    lines.push("3. Consultá el estado de los servicios");
  } else if (errorLower.includes("rate limit") || errorLower.includes("429")) {
    lines.push("1. Se alcanzó el límite de requests — esperá un momento y probá de nuevo");
  } else if (errorLower.includes("permission") || errorLower.includes("forbidden") || errorLower.includes("403")) {
    lines.push("1. No tenés permisos suficientes para esta operación");
    lines.push("2. Contactá al administrador del sistema");
  } else {
    lines.push("1. Verificá los parámetros de la solicitud");
    lines.push("2. Probá de nuevo en unos momentos");
    lines.push("3. Si el problema persiste, revisá los logs del servicio");
  }

  return lines.join("\n");
}

/**
 * Formatea una solicitud de confirmación antes de una acción destructiva.
 *
 * @param action - Descripción de la acción a realizar
 * @param details - Detalles adicionales del impacto
 * @returns String formateado pidiendo confirmación
 *
 * @example
 * ```typescript
 * formatConfirmationRequest(
 *   "eliminar el usuario 'juan@email.com'",
 *   "Esto eliminará su cuenta, órdenes y datos de envío permanentemente."
 * );
 * ```
 */
export function formatConfirmationRequest(action: string, details: string): string {
  return `${EMOJI.warning} **Se requiere confirmación**

Voy a **${action}**.

${details}

${EMOJI.lock} Esta acción está protegida por las reglas de gobernanza de JARVIS.

**¿Confirmás que querés continuar?** Respondé con **"sí"** o **"no"**.

_Si no respondés en 5 minutos, la operación se cancela automáticamente._
`.trim();
}

/**
 * Formatea una solicitud de aclaración cuando no se entiende el pedido.
 *
 * @returns String formateado pidiendo más información
 */
export function formatClarificationRequest(): string {
  return `${EMOJI.question} Che, no entendí bien qué necesitás.

¿Podés darme más detalles? Por ejemplo:

- ${EMOJI.search} ¿Qué información estás buscando exactamente?
- ${EMOJI.database} ¿Sobre qué tabla o servicio te referís?
- ${EMOJI.clock} ¿Tenés algún rango de fechas en mente?
- ${EMOJI.user} ¿Es sobre un usuario, producto, or orden específica?

Estoy para ayudarte, solo necesito que me orientes un poco más ${EMOJI.arrow}
`.trim();
}

// ─── Health & Status Templates ───────────────────────────────────────────────

/**
 * Formatea un reporte de salud de los servicios.
 *
 * @param status - Record con nombre de servicio → boolean (true = healthy)
 * @returns String formateado con el estado de cada servicio
 *
 * @example
 * ```typescript
 * formatHealthReport({ github: true, railway: false, supabase: true });
 * ```
 */
export function formatHealthReport(status: Record<string, boolean>): string {
  const lines: string[] = [];
  lines.push(`${EMOJI.health} **Estado de Servicios**`);
  lines.push("");

  const allHealthy = Object.values(status).every((v) => v);
  const anyDown = Object.values(status).some((v) => !v);

  if (allHealthy) {
    lines.push(`${EMOJI.success} **Todos los servicios están operativos.**`);
  } else if (anyDown) {
    const downCount = Object.values(status).filter((v) => !v).length;
    lines.push(`${EMOJI.critical} **${downCount} servicio(s) con problemas.**`);
  }

  lines.push("");
  lines.push("| Servicio | Estado |");
  lines.push("|----------|--------|");

  for (const [service, healthy] of Object.entries(status)) {
    const icon = healthy ? `${EMOJI.success} OK` : `${EMOJI.error} CAÍDO`;
    const name = service.charAt(0).toUpperCase() + service.slice(1);
    lines.push(`| ${name} | ${icon} |`);
  }

  lines.push("");
  lines.push(`${EMOJI.clock} _Último check: ${new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}_`);

  if (anyDown) {
    lines.push("");
    lines.push(`${EMOJI.suggestion} **Acciones sugeridas:**`);
    for (const [service, healthy] of Object.entries(status)) {
      if (!healthy) {
        lines.push(`- Revisá los logs de ${service} con \`/logs ${service}\``);
      }
    }
  }

  return lines.join("\n");
}

// ─── Sales & Business Templates ──────────────────────────────────────────────

/**
 * Formatea un resumen de ventas.
 *
 * @param data - Datos del resumen de ventas
 * @returns String formateado con el resumen
 *
 * @example
 * ```typescript
 * formatSalesSummary({
 *   totalRevenue: 1500000,
 *   totalOrders: 45,
 *   averageOrderValue: 33333,
 *   period: "últimos 7 días",
 *   topProducts: [...],
 *   comparison: { ... }
 * });
 * ```
 */
export function formatSalesSummary(data: SaleSummaryData): string {
  const lines: string[] = [];
  lines.push(`${EMOJI.chart} **Resumen de Ventas — ${data.period}**`);
  lines.push("");

  // Métricas principales
  const currency = "ARS";
  lines.push(`| Métrica | Valor |`);
  lines.push(`|---------|-------|`);
  lines.push(`| ${EMOJI.money} Ingresos Totales | **$${data.totalRevenue.toLocaleString("es-AR")} ${currency}** |`);
  lines.push(`| ${EMOJI.package} Órdenes | **${data.totalOrders.toLocaleString("es-AR")}** |`);
  lines.push(`| ${EMOJI.money} Ticket Promedio | **$${data.averageOrderValue.toLocaleString("es-AR")} ${currency}** |`);

  // Comparación si existe
  if (data.comparison) {
    lines.push("");
    lines.push(`${EMOJI.chart} **Comparación vs período anterior:**`);
    const revChange = data.comparison.revenueChange;
    const ordChange = data.comparison.ordersChange;
    const revIcon = revChange >= 0 ? "📈" : "📉";
    const ordIcon = ordChange >= 0 ? "📈" : "📉";
    lines.push(`- Ingresos: ${revIcon} ${revChange >= 0 ? "+" : ""}${revChange.toFixed(1)}%`);
    lines.push(`- Órdenes: ${ordIcon} ${ordChange >= 0 ? "+" : ""}${ordChange.toFixed(1)}%`);
  }

  // Productos top
  if (data.topProducts && data.topProducts.length > 0) {
    lines.push("");
    lines.push(`${EMOJI.rocket} **Productos más vendidos:**`);
    lines.push("");
    lines.push("| # | Producto | Unidades | Ingresos |");
    lines.push("|---|----------|----------|----------|");
    data.topProducts.slice(0, 10).forEach((p, i) => {
      lines.push(`| ${i + 1} | ${p.title.slice(0, 35)} | ${p.quantity} | $${p.revenue.toLocaleString("es-AR")} |`);
    });
  }

  return lines.join("\n");
}

/**
 * Formatea una lista de productos.
 *
 * @param products - Array de productos
 * @returns String formateado con la lista
 *
 * @example
 * ```typescript
 * formatProductList([
 *   { id: "1", title: "Taladro Bosch", price: 45000, stock: 12 },
 *   { id: "2", title: "Amoladora Stanley", price: 38000, stock: 3 },
 * ]);
 * ```
 */
export function formatProductList(products: ProductData[]): string {
  if (products.length === 0) {
    return `${EMOJI.info} No se encontraron productos.`;
  }

  const lines: string[] = [];
  lines.push(`${EMOJI.package} **Productos encontrados: ${products.length}**`);
  lines.push("");
  lines.push("| Producto | Precio | Stock | Estado |");
  lines.push("|----------|--------|-------|--------|");

  for (const p of products) {
    const stockIcon = p.stock === 0 ? "🔴" : p.stock <= 5 ? "🟠" : "🟢";
    const status = p.isActive === false ? "Inactivo" : p.stock === 0 ? "Sin stock" : "Activo";
    const title = p.title.length > 35 ? p.title.slice(0, 32) + "..." : p.title;
    lines.push(`| ${title} | $${p.price.toLocaleString("es-AR")} | ${stockIcon} ${p.stock} | ${status} |`);
  }

  return lines.join("\n");
}

/**
 * Formatea una lista de órdenes.
 *
 * @param orders - Array de órdenes
 * @returns String formateado con la lista
 */
export function formatOrderList(orders: OrderData[]): string {
  if (orders.length === 0) {
    return `${EMOJI.info} No se encontraron órdenes.`;
  }

  const lines: string[] = [];
  lines.push(`${EMOJI.package} **Órdenes: ${orders.length}**`);
  lines.push("");
  lines.push("| #Orden | Comprador | Total | Estado | Fecha |");
  lines.push("|--------|-----------|-------|--------|-------|");

  for (const o of orders) {
    const dateStr = typeof o.createdAt === "string"
      ? new Date(o.createdAt).toLocaleDateString("es-AR")
      : o.createdAt.toLocaleDateString("es-AR");
    const statusIcons: Record<string, string> = {
      PENDING: "⏳",
      PAID: "💰",
      PROCESSING: "🔧",
      SHIPPED: "🚚",
      DELIVERED: "✅",
      CANCELLED: "❌",
      REFUNDED: "↩️",
    };
    const icon = statusIcons[o.status] || "📋";
    const buyer = o.buyerName || "—";
    lines.push(`| #${o.id.slice(-6)} | ${buyer} | $${o.total.toLocaleString("es-AR")} | ${icon} ${o.status} | ${dateStr} |`);
  }

  return lines.join("\n");
}

// ─── Autonomous Task Templates ───────────────────────────────────────────────

/**
 * Formatea el resultado de una tarea autónoma ejecutada.
 *
 * @param taskName - Nombre legible de la tarea
 * @param taskId - ID técnico de la tarea
 * @param result - Resultado de la ejecución
 * @returns String formateado con el resultado
 */
export function formatAutonomousTaskResult(
  taskName: string,
  taskId: string,
  result: {
    success: boolean;
    actionTaken: string;
    details?: Record<string, unknown>;
    requiresHumanApproval?: boolean;
    proposedChanges?: unknown[];
  }
): string {
  const lines: string[] = [];

  const icon = result.success ? EMOJI.success : EMOJI.error;
  lines.push(`${icon} **Tarea autónoma: ${taskName}** (\`${taskId}\`)`);
  lines.push("");
  lines.push(`${EMOJI.tool} **Acción:** ${result.actionTaken}`);

  if (result.requiresHumanApproval && result.proposedChanges && result.proposedChanges.length > 0) {
    lines.push("");
    lines.push(`${EMOJI.warning} **Requiere aprobación humana**`);
    lines.push(`Se proponen **${result.proposedChanges.length}** cambio(s):`);
    lines.push("");
    result.proposedChanges.slice(0, 5).forEach((change, i) => {
      if (typeof change === "object" && change !== null) {
        const c = change as Record<string, unknown>;
        const desc = c.description || c.productTitle || c.campaignType || JSON.stringify(change).slice(0, 60);
        lines.push(`${i + 1}. ${String(desc)}`);
      } else {
        lines.push(`${i + 1}. ${String(change).slice(0, 60)}`);
      }
    });
    if (result.proposedChanges.length > 5) {
      lines.push(`... y ${result.proposedChanges.length - 5} más.`);
    }
    lines.push("");
    lines.push(`${EMOJI.arrow} Respondé **"aprobar"** para aplicar los cambios o **"rechazar"** para descartarlos.`);
  }

  if (result.details && Object.keys(result.details).length > 0) {
    lines.push("");
    lines.push(`${EMOJI.chart} **Detalles:**`);
    for (const [key, value] of Object.entries(result.details).slice(0, 8)) {
      const display = typeof value === "object" ? JSON.stringify(value).slice(0, 50) : String(value);
      lines.push(`- **${key}:** ${display}`);
    }
  }

  return lines.join("\n");
}

// ─── Generic Utility Templates ───────────────────────────────────────────────

/**
 * Formatea un mensaje de bienvenida para nuevos usuarios.
 *
 * @param userName - Nombre del usuario
 * @param userRole - Rol del usuario
 * @returns String formateado de bienvenida
 */
export function formatWelcomeMessage(userName?: string, userRole?: string): string {
  const name = userName || "che";
  const lines: string[] = [];

  lines.push(`¡Hola **${name}**! 👋 Soy JARVIS, el asistente AI de **MadsJeez Marketplace**.`);
  lines.push("");
  lines.push("Estoy acá para ayudarte con:");
  lines.push("");
  lines.push(`${EMOJI.chart} Análisis de ventas, stock y métricas del negocio`);
  lines.push(`${EMOJI.database} Consultas a la base de datos y reportes`);
  lines.push(`${EMOJI.server} Gestión de infraestructura (deploys, servicios, logs)`);
  lines.push(`${EMOJI.code} Tareas de desarrollo y code review`);
  lines.push(`${EMOJI.package} Gestión del marketplace (productos, órdenes, envíos)`);
  lines.push("");

  if (userRole === "admin") {
    lines.push(`${EMOJI.lock} Tenés acceso **administrativo** — podés gestionar usuarios,`);
    lines.push(`infraestructura, y ejecutar tareas autónomas.`);
  } else if (userRole === "seller") {
    lines.push(`${EMOJI.package} Tenés acceso de **vendedor** — podés consultar tus productos,`);
    lines.push(`ventas, stock, y preguntas de compradores.`);
  }

  lines.push("");
  lines.push(`${EMOJI.suggestion} **¿Por dónde empezamos?**`);
  lines.push(`Podés preguntarme algo como: _"Mostrame las ventas de hoy"_,`);
  lines.push(`_"¿Cómo está la infraestructura?"_, o _"Revisá el stock bajo"_.`);

  return lines.join("\n");
}

/**
 * Formatea un mensaje de despedida.
 *
 * @returns String formateado de despedida
 */
export function formatGoodbyeMessage(): string {
  return `¡Nos vemos, che! 👋 Quedo atento por si necesitás algo más. Que tengas buen día.`.trim();
}

/**
 * Formatea un mensaje de error genérico del sistema.
 *
 * @param error - Error ocurrido
 * @param context - Contexto adicional
 * @returns String formateado con el error
 */
export function formatSystemError(error: string, context?: string): string {
  const lines: string[] = [];
  lines.push(`${EMOJI.error} **Error del sistema**`);
  lines.push("");
  lines.push(error);
  if (context) {
    lines.push("");
    lines.push(`${EMOJI.info} Contexto: ${context}`);
  }
  lines.push("");
  lines.push(`${EMOJI.suggestion} Si el problema persiste, contactá al equipo técnico.`);
  return lines.join("\n");
}

/**
 * Formatea una tabla markdown genérica desde datos.
 *
 * @param headers - Array de nombres de columnas
 * @param rows - Array de filas (arrays de strings)
 * @returns String con tabla markdown
 */
export function formatMarkdownTable(headers: string[], rows: string[][]): string {
  if (headers.length === 0 || rows.length === 0) {
    return "*Sin datos para mostrar.*";
  }

  const lines: string[] = [];
  lines.push(`| ${headers.join(" | ")} |`);
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`);

  for (const row of rows) {
    const cells = row.map((cell) => cell.replace(/\|/g, "\\|").replace(/\n/g, " "));
    // Pad or truncate to match headers
    while (cells.length < headers.length) cells.push("");
    lines.push(`| ${cells.slice(0, headers.length).join(" | ")} |`);
  }

  return lines.join("\n");
}

/**
 * Trunca un texto a un largo máximo agregando ellipsis.
 *
 * @param text - Texto a truncar
 * @param maxLength - Largo máximo
 * @returns Texto truncado
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
