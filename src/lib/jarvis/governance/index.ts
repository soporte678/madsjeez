/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║     SISTEMA DE GOBERNANZA JARVIS — Export Centralizado         ║
 * ║                                                                  ║
 * ║  Este archivo exporta TODO el sistema de gobernanza.            ║
 * ║  Para usar el sistema de gobernanza:                            ║
 * ║                                                                  ║
 * ║    import { evaluateAction, sanitize, logSecurityEvent }       ║
 * ║      from "@/lib/jarvis/governance";                            ║
 * ║                                                                  ║
 * ║  NUNCA importar directamente de los submódulos.                ║
 * ║  SIEMPRE usar este barrel file.                                 ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════
// CONSTITUCIÓN — Reglas Inviolables
// ═══════════════════════════════════════════════════════════

export {
  JARVIS_CONSTITUTION,
  RULE_SUPREMA,
  RULE_DATA_PROTECTION,
  RULE_BACKDOOR_PREVENTION,
  RULE_CHANGE_CONTROL,
  RULE_PRIVACY,
  RULE_TRANSPARENCY,
  RULE_THIRD_PARTY_ISOLATION,
  RULE_DIGITAL_SOVEREIGNTY,
  CONSTITUTION_VERSION,
  CONSTITUTION_CHECKSUM,
  CONSTITUTION_CREATED,
  CONSTITUTION_OWNER,
  CONSTITUTION_RULE_COUNT,
  CONSTITUTION_SIGNATURE,
} from "./constitution";

export type { RuleViolation } from "./constitution";

// ═══════════════════════════════════════════════════════════
// ENFORCER — Motor de Enforceamiento
// ═══════════════════════════════════════════════════════════

export {
  evaluateAction,
  quickScan,
  executeWithEnforcement,
} from "./enforcer";

export type {
  ProposedAction,
  EnforcementResult,
} from "./enforcer";

// ═══════════════════════════════════════════════════════════
// AUDITOR — Sistema de Auditoría
// ═══════════════════════════════════════════════════════════

export {
  logSecurityEvent,
  getSecurityEvents,
  getSecurityEventsByLevel,
  getSecurityEventsByRule,
  getMemoryBuffer,
  clearMemoryBuffer,
  verifyEntryIntegrity,
  getAuditStats,
} from "./auditor";

export type {
  SecurityEvent,
  SecurityLevel,
  AuditEntry,
} from "./auditor";

// ═══════════════════════════════════════════════════════════
// VAULT — Protección de Datos Sensibles
// ═══════════════════════════════════════════════════════════

export {
  sanitize,
  sanitizeObject,
  createSafePrompt,
  containsSensitiveData,
  detectSensitiveData,
  maskSpecific,
  redactForLogging,
  createDebugOutput,
  safeStringify,
  verifySanitization,
  getVaultInfo,
} from "./vault";
