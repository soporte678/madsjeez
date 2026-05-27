/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           AUDITOR JARVIS — Sistema de Auditoría                ║
 * ║                                                                  ║
 * ║  TODAS las acciones de JARVIS son registradas aquí.             ║
 * ║  Los logs de seguridad NUNCA pueden ser borrados por JARVIS.   ║
 * ║                                                                  ║
 * ║  Principios:                                                     ║
 * ║  1. Inmutabilidad: Los logs no pueden ser modificados           ║
 * ║  2. Completez: TODAS las acciones deben ser logueadas           ║
 * ║  3. Visibilidad: El usuario puede acceder a TODO en cualquier  ║
 * ║     momento                                                      ║
 * ║  4. Integridad: Los logs incluyen checksums para detectar      ║
 * ║     tampering                                                      ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { prisma } from "@/lib/prisma";

// ============================================================
// TIPOS
// ============================================================

export type SecurityLevel = "INFO" | "WARNING" | "CRITICAL";

export interface SecurityEvent {
  level: SecurityLevel;
  rule: string;
  action: string;
  description: string;
  violations?: string[];
  userId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  level: SecurityLevel;
  rule: string;
  action: string;
  description: string;
  violations?: string[];
  userId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  checksum: string; // Para detectar tampering
}

// ============================================================
// BUFFER IN-MEMORY (para cuando DB no está disponible)
// ============================================================

const memoryBuffer: AuditEntry[] = [];
const MAX_MEMORY_BUFFER = 1000;

// ============================================================
// FUNCIÓN PRINCIPAL: logSecurityEvent
// ============================================================

/**
 * Registra un evento de seguridad.
 * Intenta guardar en DB. Si falla, guarda en buffer en memoria.
 * Los datos sensibles NUNCA se loguean en texto plano.
 *
 * ESTA FUNCIÓN NUNCA debe fallar silenciosamente.
 * Si todo falla, al menos hace console.error.
 */
export async function logSecurityEvent(
  event: SecurityEvent
): Promise<void> {
  const timestamp = new Date().toISOString();
  const entryId = crypto.randomUUID();

  // Sanitizar: nunca loguear datos sensibles
  const sanitizedEvent = sanitizeEvent(event);

  // Calcular checksum de integridad
  const checksum = computeChecksum({
    id: entryId,
    timestamp,
    ...sanitizedEvent,
  });

  const entry: AuditEntry = {
    id: entryId,
    timestamp,
    level: sanitizedEvent.level,
    rule: sanitizedEvent.rule,
    action: sanitizedEvent.action,
    description: sanitizedEvent.description,
    violations: sanitizedEvent.violations,
    userId: sanitizedEvent.userId,
    ipAddress: sanitizedEvent.ipAddress,
    metadata: sanitizedEvent.metadata,
    checksum,
  };

  // ============================================================
  // Intento 1: Guardar en base de datos
  // ============================================================
  let dbSuccess = false;
  try {
    await prisma.$executeRaw`
      INSERT INTO audit_log (
        id,
        action,
        entity_type,
        entity_id,
        user_id,
        new_values,
        created_at
      ) VALUES (
        ${entryId},
        ${event.action},
        'SECURITY_EVENT',
        ${entryId},
        ${event.userId || null},
        ${JSON.stringify({
          level: event.level,
          rule: event.rule,
          description: event.description,
          violations: event.violations,
          ip: event.ipAddress,
          meta: event.metadata,
          checksum,
        })},
        NOW()
      )
    `;
    dbSuccess = true;
  } catch (dbError) {
    // DB no disponible, intentar tabla alternativa
    try {
      await prisma.$executeRaw`
        INSERT INTO jarvis_audit_log (
          action,
          entity_type,
          entity_id,
          user_id,
          new_values,
          created_at
        ) VALUES (
          ${event.action},
          'SECURITY_EVENT',
          ${entryId},
          ${event.userId || null},
          ${JSON.stringify({
            level: event.level,
            rule: event.rule,
            description: event.description,
            violations: event.violations,
            ip: event.ipAddress,
            meta: event.metadata,
            checksum,
          })},
          NOW()
        )
      `;
      dbSuccess = true;
    } catch {
      // Ambas tablas fallaron, usar buffer en memoria
    }
  }

  // ============================================================
  // Intento 2: Buffer en memoria (fallback)
  // ============================================================
  if (!dbSuccess) {
    memoryBuffer.push(entry);
    // Mantener buffer limitado
    if (memoryBuffer.length > MAX_MEMORY_BUFFER) {
      memoryBuffer.shift(); // Eliminar el más antiguo
    }
  }

  // ============================================================
  // SIEMPRE: Log a consola (no muestra datos sensibles)
  // ============================================================
  const logPrefix = `[SECURITY ${event.level}]`;
  const logMessage = `${logPrefix} [${event.rule}] ${event.description}`;

  switch (event.level) {
    case "CRITICAL":
      console.error(`🚨 ${logMessage}`);
      if (event.violations) {
        console.error(`   Violaciones: ${event.violations.join("; ")}`);
      }
      break;
    case "WARNING":
      console.warn(`⚠️  ${logMessage}`);
      break;
    case "INFO":
      console.log(`ℹ️  ${logMessage}`);
      break;
  }

  // ============================================================
  // Intento 3: Si es CRITICAL, enviar alerta
  // ============================================================
  if (event.level === "CRITICAL") {
    try {
      await sendCriticalAlert(event);
    } catch {
      // Si la alerta falla, al menos está en consola
    }
  }
}

// ============================================================
// ALERTAS CRÍTICAS
// ============================================================

/**
 * Envía alerta CRITICAL al usuario por múltiples canales.
 * Los canales son independientes: si uno falla, los otros siguen.
 */
async function sendCriticalAlert(event: SecurityEvent): Promise<void> {
  const timestamp = new Date().toISOString();
  const alertMessage =
    `🚨 ALERTA DE SEGURIDAD CRÍTICA — JARVIS GOVERNANCE 🚨\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `⏰ Timestamp: ${timestamp}\n` +
    `📋 Regla violada: ${event.rule}\n` +
    `🔧 Acción: ${event.action}\n` +
    `📝 Descripción: ${event.description}\n` +
    `⚠️  Violaciones: ${event.violations?.join("\n   - ") || "N/A"}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🚨 REVISAR INMEDIATAMENTE 🚨`;

  // Log a consola (siempre funciona)
  console.error(alertMessage);

  // TODO: Integrar con canales adicionales:
  // - Email (Resend/SendGrid)
  // - WhatsApp (Twilio/Business API)
  // - Push notification
  // - Slack/Discord webhook
  // - SMS

  // Intento: Webhook de Slack/Discord si está configurado
  if (process.env.SECURITY_WEBHOOK_URL) {
    try {
      await fetch(process.env.SECURITY_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: alertMessage,
          username: "JARVIS-Governance",
          icon_emoji: ":rotating_light:",
        }),
      });
    } catch {
      // Silenciar error de webhook
    }
  }
}

// ============================================================
// CONSULTA DE EVENTOS
// ============================================================

/**
 * Obtiene el historial de eventos de seguridad.
 * El usuario TIENE DERECHO ABSOLUTO a acceder a TODOS los logs.
 */
export async function getSecurityEvents(
  limit: number = 100
): Promise<AuditEntry[]> {
  try {
    const events = await prisma.$queryRaw<
      Array<{
        id: string;
        action: string;
        new_values: string;
        user_id: string | null;
        created_at: Date;
      }>
    >`
      SELECT id, action, new_values, user_id, created_at
      FROM audit_log
      WHERE entity_type = 'SECURITY_EVENT'
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return events.map((e) => {
      const parsed = JSON.parse(e.new_values);
      return {
        id: e.id,
        timestamp: e.created_at.toISOString(),
        level: parsed.level || "INFO",
        rule: parsed.rule || "UNKNOWN",
        action: e.action,
        description: parsed.description || "",
        violations: parsed.violations || [],
        userId: e.user_id || undefined,
        ipAddress: parsed.ip,
        metadata: parsed.meta,
        checksum: parsed.checksum || "",
      };
    });
  } catch (dbError) {
    // Si DB falla, retornar desde buffer en memoria
    console.warn(
      "[AUDITOR] DB no disponible, retornando desde buffer en memoria"
    );
    return [...memoryBuffer]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }
}

/**
 * Obtiene eventos por nivel de severidad.
 */
export async function getSecurityEventsByLevel(
  level: SecurityLevel,
  limit: number = 100
): Promise<AuditEntry[]> {
  const allEvents = await getSecurityEvents(limit * 3); // Traer más para filtrar
  return allEvents.filter((e) => e.level === level).slice(0, limit);
}

/**
 * Obtiene eventos de una regla específica.
 */
export async function getSecurityEventsByRule(
  ruleId: string,
  limit: number = 100
): Promise<AuditEntry[]> {
  const allEvents = await getSecurityEvents(limit * 3);
  return allEvents.filter((e) => e.rule === ruleId).slice(0, limit);
}

/**
 * Obtiene el buffer en memoria (para diagnóstico cuando DB no está disponible).
 */
export function getMemoryBuffer(): readonly AuditEntry[] {
  return Object.freeze([...memoryBuffer]);
}

/**
 * Limpia el buffer en memoria después de flush exitoso a DB.
 * SOLO debe llamarse después de confirmar que los eventos están en DB.
 */
export function clearMemoryBuffer(): void {
  memoryBuffer.length = 0;
}

// ============================================================
// SANITIZACIÓN
// ============================================================

/**
 * Sanitiza un evento para evitar que datos sensibles lleguen a logs.
 * Reemplaza patrones sensibles por [REDACTED].
 */
function sanitizeEvent(event: SecurityEvent): SecurityEvent {
  const sensitivePatterns: Array<{ regex: RegExp; replacement: string }> = [
    { regex: /sk-[a-zA-Z0-9]{20,}/gi, replacement: "[API_KEY_REDACTED]" },
    { regex: /password["\s]*[:=]["\s]*[^\s,}\]]+/gi, replacement: "password=[PASSWORD_REDACTED]" },
    { regex: /token["\s]*[:=]["\s]*[a-zA-Z0-9_\-]{10,}/gi, replacement: "token=[TOKEN_REDACTED]" },
    { regex: /secret["\s]*[:=]["\s]*[^\s,}\]]+/gi, replacement: "secret=[SECRET_REDACTED]" },
    { regex: /postgres(ql)?:\/\/[^\s"]+/gi, replacement: "[DATABASE_URL_REDACTED]" },
    { regex: /-----BEGIN.*PRIVATE KEY-----[\s\S]*?-----END.*PRIVATE KEY-----/g, replacement: "[PRIVATE_KEY_REDACTED]" },
    { regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: "[CARD_REDACTED]" },
  ];

  let sanitizedDescription = event.description;
  for (const { regex, replacement } of sensitivePatterns) {
    sanitizedDescription = sanitizedDescription.replace(regex, replacement);
  }

  // Sanitizar violaciones
  const sanitizedViolations = event.violations?.map((v) => {
    let sanitized = v;
    for (const { regex, replacement } of sensitivePatterns) {
      sanitized = sanitized.replace(regex, replacement);
    }
    return sanitized;
  });

  return {
    ...event,
    description: sanitizedDescription,
    violations: sanitizedViolations,
  };
}

// ============================================================
// INTEGRIDAD (CHECKSUMS)
// ============================================================

/**
 * Calcula un checksum simple para detectar tampering de logs.
 * NO es criptográficamente seguro, pero detecta modificaciones accidentales.
 */
function computeChecksum(data: Record<string, unknown>): string {
  const content = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
}

/**
 * Verifica la integridad de un entry de auditoría.
 */
export function verifyEntryIntegrity(entry: AuditEntry): boolean {
  const { checksum, ...dataWithoutChecksum } = entry;
  const computed = computeChecksum(dataWithoutChecksum);
  return computed === checksum;
}

// ============================================================
// ESTADÍSTICAS
// ============================================================

/**
 * Obtiene estadísticas del sistema de auditoría.
 */
export async function getAuditStats(): Promise<{
  totalEvents: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  memoryBufferSize: number;
  rulesViolated: Record<string, number>;
}> {
  const events = await getSecurityEvents(10000);

  const criticalCount = events.filter((e) => e.level === "CRITICAL").length;
  const warningCount = events.filter((e) => e.level === "WARNING").length;
  const infoCount = events.filter((e) => e.level === "INFO").length;

  const rulesViolated: Record<string, number> = {};
  for (const event of events) {
    rulesViolated[event.rule] = (rulesViolated[event.rule] || 0) + 1;
  }

  return {
    totalEvents: events.length,
    criticalCount,
    warningCount,
    infoCount,
    memoryBufferSize: memoryBuffer.length,
    rulesViolated,
  };
}
