/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           ENFORCER JARVIS — Motor de Enforceamiento            ║
 * ║                                                                  ║
 * ║  Evalúa CUALQUIER acción propuesta contra todas las reglas     ║
 * ║  de la Constitución. NO hay excepciones. NO hay bypass.        ║
 * ║                                                                  ║
 * ║  Flujo:                                                          ║
 * ║  1. Recibe acción propuesta                                     ║
 * ║  2. Evalúa contra TODAS las reglas                              ║
 * ║  3. Si hay violación CRITICAL → BLOQUEO INMEDIATO              ║
 * ║  4. Si hay violación HIGH → REQUIERE APROBACIÓN HUMANA         ║
 * ║  5. Si pasa todos los checks → PERMITIDO                       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import {
  JARVIS_CONSTITUTION,
  RULE_DATA_PROTECTION,
  RULE_BACKDOOR_PREVENTION,
  RULE_CHANGE_CONTROL,
  RULE_PRIVACY,
  RULE_SUPREMA,
  RULE_THIRD_PARTY_ISOLATION,
  RULE_BIOMETRIC_PROTECTION,
  RULE_AUTOMATION_CONTROL,
  RULE_COMMUNICATION_ISOLATION,
  RULE_EVOLUTION_CONTROL,
  RULE_CUSTOMER_DATA_PROTECTION,
  CONSTITUTION_CHECKSUM,
  CONSTITUTION_VERSION,
  type RuleViolation,
} from "./constitution";
import { logSecurityEvent } from "./auditor";

// ============================================================
// TIPOS
// ============================================================

export interface ProposedAction {
  type:
    | "code_execution"
    | "file_access"
    | "file_write"
    | "file_delete"
    | "network_request"
    | "api_call"
    | "code_modification"
    | "config_change"
    | "database_query"
    | "clipboard_access"
    | "shell_command"
    | "permission_change"
    | "user_creation"
    | "environment_change"
    | "dependency_install"
    | "deploy"
    | "data_export"
    | "llm_prompt"
    | "camera_access"
    | "microphone_access"
    | "screenshot"
    | "email_send"
    | "message_send"
    | "payment"
    // Acciones biométricas
    | "facial_recognition"
    | "voice_recognition"
    | "voice_command"
    | "biometric_data_access"
    // Acciones de automatización
    | "automated_action"
    | "bulk_operation"
    | "price_change"
    | "stock_modification"
    | "refund"
    | "customer_data_modification"
    // Acciones de comunicación
    | "whatsapp_send"
    | "social_media_post"
    | "broadcast_message"
    // Acciones de evolución del sistema
    | "self_modification"
    | "rule_change"
    | "endpoint_creation"
    | "schema_modification"
    | "audit_system_change"
    // Acciones con datos de clientes
    | "customer_data_export"
    | "customer_data_sharing"
    | "customer_analysis"
    | "payment_data_access"
    | "other";
  description: string;
  code?: string;
  target?: string;
  data?: Record<string, unknown>;
  requestedBy?: string;
  agentId?: string;
  // Campos para automatización
  itemCount?: number;
  isReversible?: boolean;
  requiresDoubleConfirm?: boolean;
  // Campos para biométricos
  biometricType?: "facial" | "voice" | "both";
  storageLocation?: "local" | "remote";
  // Campos para comunicaciones
  channel?: string;
  recipientCount?: number;
  // Campos para financieras
  amount?: number;
  currency?: string;
}

export interface EnforcementResult {
  approved: boolean;
  violations: RuleViolation[];
  requiredAction:
    | "ALLOW"
    | "BLOCK"
    | "BLOCK_AND_ALERT"
    | "BLOCK_SHUTDOWN_AND_ALERT"
    | "HUMAN_APPROVAL_REQUIRED"
    | "SHUTDOWN";
  evaluatedAt: string;
  constitutionVersion: string;
}

// ============================================================
// DOMINIOS Y RECURSOS AUTORIZADOS
// ============================================================

/** Dominios autorizados para comunicación de red */
const ALLOWED_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "madsjeez.com.ar",
  "*.madsjeez.com.ar",
  "railway.app",
  "*.railway.app",
  "supabase.co",
  "*.supabase.co",
  "mercadopago.com",
  "*.mercadopago.com",
  "mercadolibre.com",
  "*.mercadolibre.com",
  "stripe.com",
  "*.stripe.com",
  "googleapis.com",
  "*.googleapis.com",
  "gemini.googleapis.com",
  "generativelanguage.googleapis.com",
  "api.openai.com",
  "api.anthropic.com",
  "api.github.com",
  "hooks.slack.com",
  "api.whatsapp.com",
  "graph.facebook.com",
  "graph.instagram.com",
];

/** Recursos del sistema protegidos (no accesibles sin aprobación) */
const PROTECTED_RESOURCES = [
  "/etc/passwd",
  "/etc/shadow",
  "/etc/hosts",
  "/proc/",
  "/sys/",
  "/root/",
  "/var/log/auth",
  "C:\\Windows\\System32",
  "C:\\Windows\\System",
  "\\System32\\",
  "\\Registry\\",
  ".ssh/",
  ".aws/",
  ".env",
  ".env.local",
  ".env.production",
  "id_rsa",
  "id_ed25519",
  ".pem",
  ".p12",
  ".pfx",
  ".keystore",
];

// ============================================================
// FUNCIÓN PRINCIPAL: evaluateAction
// ============================================================

/**
 * Evalúa una acción propuesta contra TODAS las reglas de la Constitución.
 * Esta es la función CRÍTICA del sistema de gobernanza.
 *
 * NO se pueden saltar checks. NO hay fast-path para ciertas acciones.
 * CADA acción pasa por TODOS los checks de seguridad.
 */
export function evaluateAction(
  action: ProposedAction
): EnforcementResult {
  const violations: RuleViolation[] = [];
  const timestamp = new Date().toISOString();

  // ============================================================
  // CHECK 0: Verificar integridad de la Constitución
  // ============================================================
  const integrityCheck = verifyConstitutionIntegrity();
  if (!integrityCheck.valid) {
    const violation: RuleViolation = {
      ruleId: RULE_SUPREMA.id,
      severity: "CRITICAL",
      reason: `INTEGRIDAD DE LA CONSTITUCIÓN COMPROMETIDA: ${integrityCheck.reason}`,
      evidence: `Expected: ${CONSTITUTION_CHECKSUM}, Got: ${integrityCheck.actual}`,
    };
    violations.push(violation);

    // Log inmediato y retornar bloqueo
    logSecurityEvent({
      level: "CRITICAL",
      rule: RULE_SUPREMA.id,
      action: action.type,
      description: `FALLO DE INTEGRIDAD DE CONSTITUCIÓN: ${action.description}`,
      violations: [violation.reason],
    }).catch(() => {
      /* Silenciar errores de log en emergencia */
    });

    return {
      approved: false,
      violations,
      requiredAction: "SHUTDOWN",
      evaluatedAt: timestamp,
      constitutionVersion: CONSTITUTION_VERSION,
    };
  }

  // ============================================================
  // CHECK 1: Regla Suprema — ¿Beneficia al usuario?
  // ============================================================
  const supremeViolations = checkSupremeRule(action);
  violations.push(...supremeViolations);

  // ============================================================
  // CHECK 2: ¿Contiene código con patrones maliciosos?
  // ============================================================
  if (action.code) {
    const codeViolations = scanCodeForThreats(action.code);
    violations.push(...codeViolations);
  }

  // ============================================================
  // CHECK 3: ¿Acceso a recursos protegidos del sistema?
  // ============================================================
  if (action.target) {
    const resourceViolations = checkProtectedResources(action);
    violations.push(...resourceViolations);
  }

  // ============================================================
  // CHECK 4: ¿Acceso a datos sensibles?
  // ============================================================
  if (action.data) {
    const dataViolations = checkDataSensitivity(action.data, action.type);
    violations.push(...dataViolations);
  }

  // ============================================================
  // CHECK 5: ¿Comunicación de red?
  // ============================================================
  if (
    action.type === "network_request" ||
    action.type === "api_call"
  ) {
    const networkViolations = checkNetworkSafety(action);
    violations.push(...networkViolations);
  }

  // ============================================================
  // CHECK 6: ¿Shell command?
  // ============================================================
  if (action.type === "shell_command" && action.code) {
    const shellViolations = checkShellCommand(action.code);
    violations.push(...shellViolations);
  }

  // ============================================================
  // CHECK 7: ¿Cambio al sistema?
  // ============================================================
  if (
    action.type === "code_modification" ||
    action.type === "config_change" ||
    action.type === "environment_change" ||
    action.type === "dependency_install" ||
    action.type === "deploy"
  ) {
    const changeViolations = checkChangeAuthorization(action);
    violations.push(...changeViolations);
  }

  // ============================================================
  // CHECK 8: ¿Acceso a permisos/cuentas?
  // ============================================================
  if (
    action.type === "permission_change" ||
    action.type === "user_creation"
  ) {
    const permissionViolations = checkPermissionChanges(action);
    violations.push(...permissionViolations);
  }

  // ============================================================
  // CHECK 9: ¿Exportación de datos?
  // ============================================================
  if (action.type === "data_export") {
    const exportViolations = checkDataExport(action);
    violations.push(...exportViolations);
  }

  // ============================================================
  // CHECK 10: ¿Prompt para LLM externo?
  // ============================================================
  if (action.type === "llm_prompt") {
    const llmViolations = checkLLMPromptSafety(action);
    violations.push(...llmViolations);
  }

  // ============================================================
  // CHECK 11: ¿Acceso a cámara/micrófono/screenshot?
  // ============================================================
  if (
    action.type === "camera_access" ||
    action.type === "microphone_access" ||
    action.type === "screenshot"
  ) {
    const privacyViolations = checkPrivacySensitiveAction(action);
    violations.push(...privacyViolations);
  }

  // ============================================================
  // CHECK 12: ¿Envío de email/mensaje/pago?
  // ============================================================
  if (
    action.type === "email_send" ||
    action.type === "message_send" ||
    action.type === "payment"
  ) {
    const communicationViolations = checkCommunicationAction(action);
    violations.push(...communicationViolations);
  }

  // ============================================================
  // CHECK 13: ¿Acceso a clipboard?
  // ============================================================
  if (action.type === "clipboard_access") {
    const clipboardViolations = checkClipboardAccess(action);
    violations.push(...clipboardViolations);
  }

  // ============================================================
  // CHECK 14: ¿Acceso a datos biométricos (cámara/micrófono/voz)?
  // ============================================================
  if (
    action.type === "facial_recognition" ||
    action.type === "voice_recognition" ||
    action.type === "voice_command" ||
    action.type === "biometric_data_access" ||
    action.type === "camera_access" ||
    action.type === "microphone_access"
  ) {
    const biometricViolations = checkBiometricAccess(action);
    violations.push(...biometricViolations);
  }

  // ============================================================
  // CHECK 15: ¿Acción de automatización?
  // ============================================================
  if (
    action.type === "automated_action" ||
    action.type === "bulk_operation" ||
    action.type === "price_change" ||
    action.type === "stock_modification" ||
    action.type === "refund" ||
    action.type === "customer_data_modification"
  ) {
    const automationViolations = checkAutomationSafety(action);
    violations.push(...automationViolations);
  }

  // ============================================================
  // CHECK 16: ¿Acción de comunicación (WhatsApp/redes/broadcast)?
  // ============================================================
  if (
    action.type === "whatsapp_send" ||
    action.type === "social_media_post" ||
    action.type === "broadcast_message" ||
    action.type === "email_send" ||
    action.type === "message_send"
  ) {
    const communicationViolations = checkCommunicationSafety(action);
    violations.push(...communicationViolations);
  }

  // ============================================================
  // CHECK 17: ¿Intento de auto-modificación (evolución)?
  // ============================================================
  if (
    action.type === "self_modification" ||
    action.type === "rule_change" ||
    action.type === "endpoint_creation" ||
    action.type === "schema_modification" ||
    action.type === "audit_system_change" ||
    action.type === "code_modification"
  ) {
    const evolutionViolations = checkEvolutionAttempt(action);
    violations.push(...evolutionViolations);
  }

  // ============================================================
  // CHECK 18: ¿Exposición de datos de clientes?
  // ============================================================
  if (
    action.type === "customer_data_export" ||
    action.type === "customer_data_sharing" ||
    action.type === "customer_analysis" ||
    action.type === "payment_data_access" ||
    action.type === "data_export"
  ) {
    const customerDataViolations = checkCustomerDataExposure(action);
    violations.push(...customerDataViolations);
  }

  // ============================================================
  // DETERMINAR RESULTADO
  // ============================================================
  const criticalViolations = violations.filter(
    (v) => v.severity === "CRITICAL"
  );
  const highViolations = violations.filter(
    (v) => v.severity === "HIGH"
  );

  if (criticalViolations.length > 0) {
    // VIOLACIONES CRÍTICAS → BLOQUEO INMEDIATO + ALERTA + LOG
    logSecurityEvent({
      level: "CRITICAL",
      rule: criticalViolations[0].ruleId,
      action: action.type,
      description: `🚫 ACCIÓN BLOQUEADA (CRITICAL): ${action.description}`,
      violations: criticalViolations.map((v) => v.reason),
      metadata: {
        target: action.target,
        agent: action.agentId,
        violationCount: criticalViolations.length,
      },
    }).catch(() => {
      /* Silenciar errores de logging */
    });

    return {
      approved: false,
      violations,
      requiredAction: "BLOCK_SHUTDOWN_AND_ALERT",
      evaluatedAt: timestamp,
      constitutionVersion: CONSTITUTION_VERSION,
    };
  }

  if (highViolations.length > 0) {
    // VIOLACIONES HIGH → REQUIERE APROBACIÓN HUMANA
    logSecurityEvent({
      level: "WARNING",
      rule: highViolations[0].ruleId,
      action: action.type,
      description: `⚠️ ACCIÓN REQUIERE APROBACIÓN: ${action.description}`,
      violations: highViolations.map((v) => v.reason),
      metadata: {
        target: action.target,
        agent: action.agentId,
        violationCount: highViolations.length,
      },
    }).catch(() => {
      /* Silenciar errores de logging */
    });

    return {
      approved: false,
      violations,
      requiredAction: "HUMAN_APPROVAL_REQUIRED",
      evaluatedAt: timestamp,
      constitutionVersion: CONSTITUTION_VERSION,
    };
  }

  if (violations.length > 0) {
    // Violaciones menores → Alerta pero permitir (para no bloquear operación)
    logSecurityEvent({
      level: "INFO",
      rule: violations[0].ruleId,
      action: action.type,
      description: `ℹ️ Violación menor detectada: ${action.description}`,
      violations: violations.map((v) => v.reason),
    }).catch(() => {
      /* Silenciar errores de logging */
    });
  }

  // ============================================================
  // APROBADO
  // ============================================================
  return {
    approved: violations.length === 0,
    violations,
    requiredAction: "ALLOW",
    evaluatedAt: timestamp,
    constitutionVersion: CONSTITUTION_VERSION,
  };
}

// ============================================================
// CHECK IMPLEMENTACIONES
// ============================================================

/**
 * CHECK 0: Verifica integridad de la Constitución en runtime.
 * Si las reglas fueron modificadas, el sistema debe bloquear TODO.
 */
function verifyConstitutionIntegrity(): {
  valid: boolean;
  reason?: string;
  actual?: string;
} {
  // Verificar que todas las reglas esperadas están presentes
  const expectedRuleIds = [
    "RULE-0",
    "RULE-1",
    "RULE-2",
    "RULE-3",
    "RULE-4",
    "RULE-5",
    "RULE-6",
    "RULE-7",
    "RULE-8",
    "RULE-9",
    "RULE-10",
    "RULE-11",
    "RULE-12",
  ];

  const actualRuleIds = JARVIS_CONSTITUTION.map((r) => r.id);

  for (const expectedId of expectedRuleIds) {
    if (!actualRuleIds.includes(expectedId)) {
      return {
        valid: false,
        reason: `Regla faltante: ${expectedId}`,
        actual: actualRuleIds.join(","),
      };
    }
  }

  // Verificar que el checksum coincide
  const computedChecksum = computeConstitutionChecksum();
  if (computedChecksum !== CONSTITUTION_CHECKSUM) {
    return {
      valid: false,
      reason: "Checksum de Constitución no coincide",
      actual: computedChecksum,
    };
  }

  return { valid: true };
}

/**
 * Calcula un checksum simple de la Constitución para verificación.
 */
function computeConstitutionChecksum(): string {
  // Concatenar IDs y severidades de todas las reglas
  const content = JARVIS_CONSTITUTION.map(
    (r) => `${r.id}:${r.severity}:${r.violationAction}`
  ).join("|");
  // Simple hash para detectar modificaciones
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `SHA256:${Math.abs(hash).toString(16).padStart(64, "0")}`;
}

/**
 * CHECK 1: Regla Suprema — ¿La acción beneficia al usuario?
 */
function checkSupremeRule(action: ProposedAction): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // Verificar acciones que NUNCA podrían beneficiar al usuario
  const inherentlyHarmfulActions = [
    "payment", // Sin aprobación explícita, pagos son peligrosos
  ];

  if (inherentlyHarmfulActions.includes(action.type)) {
    violations.push({
      ruleId: RULE_SUPREMA.id,
      severity: "CRITICAL",
      reason: `Acción '${action.type}' requiere verificación de beneficio para el usuario según Regla Suprema`,
    });
  }

  return violations;
}

/**
 * CHECK 2: Escanea código en busca de patrones maliciosos.
 */
function scanCodeForThreats(code: string): RuleViolation[] {
  const violations: RuleViolation[] = [];

  for (const pattern of RULE_BACKDOOR_PREVENTION.detectionPatterns) {
    if (pattern.test(code)) {
      // Reset lastIndex para patrones con flag global
      if (pattern.global) pattern.lastIndex = 0;
      const match = code.match(pattern);
      violations.push({
        ruleId: RULE_BACKDOOR_PREVENTION.id,
        severity: "CRITICAL",
        reason: `Patrón peligroso detectado: ${pattern.source}`,
        evidence: match?.[0]?.substring(0, 200),
      });
    }
  }

  return violations;
}

/**
 * CHECK 3: Verifica si el target es un recurso protegido del sistema.
 */
function checkProtectedResources(action: ProposedAction): RuleViolation[] {
  const violations: RuleViolation[] = [];
  if (!action.target) return violations;

  const target = action.target.toLowerCase();

  for (const protectedResource of PROTECTED_RESOURCES) {
    if (target.includes(protectedResource.toLowerCase())) {
      violations.push({
        ruleId: RULE_BACKDOOR_PREVENTION.id,
        severity: "CRITICAL",
        reason: `Intento de acceso a recurso protegido del sistema: ${protectedResource}`,
        evidence: action.target,
      });
    }
  }

  return violations;
}

/**
 * CHECK 4: Verifica si los datos contienen información sensible.
 */
function checkDataSensitivity(
  data: Record<string, unknown>,
  actionType: string
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const dataStr = JSON.stringify(data);

  const sensitivePatterns = [
    { pattern: /sk-[a-zA-Z0-9]{20,}/i, type: "API_KEY", severity: "CRITICAL" as const },
    { pattern: /api[_-]?key["\s]*[:=]["\s]*["'][a-zA-Z0-9]{8,}/i, type: "API_KEY", severity: "CRITICAL" as const },
    { pattern: /password["\s]*[:=]["\s]*[^\s,}\]]+/i, type: "PASSWORD", severity: "CRITICAL" as const },
    { pattern: /passwd["\s]*[:=]["\s]*[^\s,}\]]+/i, type: "PASSWORD", severity: "CRITICAL" as const },
    { pattern: /token["\s]*[:=]["\s]*[a-zA-Z0-9_\-]{10,}/i, type: "TOKEN", severity: "CRITICAL" as const },
    { pattern: /bearer\s+[a-zA-Z0-9_\-\.]{10,}/i, type: "TOKEN", severity: "CRITICAL" as const },
    { pattern: /secret["\s]*[:=]["\s]*[^\s,}\]]+/i, type: "SECRET", severity: "CRITICAL" as const },
    { pattern: /database[_-]?url["\s]*[:=]["\s]*[^\s,}\]]+/i, type: "DATABASE_URL", severity: "CRITICAL" as const },
    { pattern: /postgres(ql)?:\/\/[^\s"]+/i, type: "DATABASE_URL", severity: "CRITICAL" as const },
    { pattern: /private[_-]?key["\s]*[:=]/i, type: "PRIVATE_KEY", severity: "CRITICAL" as const },
    { pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/, type: "PRIVATE_KEY", severity: "CRITICAL" as const },
    { pattern: /\b\d{2}[.,]?\d{3}[.,]?\d{3}\b/, type: "DNI", severity: "HIGH" as const },
    { pattern: /\b\d{2}-\d{8}-\d\b/, type: "CUIT/CUIL", severity: "HIGH" as const },
    { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, type: "CREDIT_CARD", severity: "CRITICAL" as const },
  ];

  for (const { pattern, type, severity } of sensitivePatterns) {
    if (pattern.test(dataStr)) {
      violations.push({
        ruleId: RULE_DATA_PROTECTION.id,
        severity,
        reason: `Dato sensible detectado (${type}) en acción: ${actionType}`,
        evidence: `Patrón coincidente: ${pattern.source}`,
      });
    }
  }

  return violations;
}

/**
 * CHECK 5: Verifica si una comunicación de red es segura.
 */
function checkNetworkSafety(action: ProposedAction): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const target = (action.target || "").toLowerCase();

  if (!target) {
    violations.push({
      ruleId: RULE_DATA_PROTECTION.id,
      severity: "HIGH",
      reason: "Solicitud de red sin target especificado",
    });
    return violations;
  }

  // Verificar que es HTTP/HTTPS (no protocolos inseguros)
  if (
    target.startsWith("ftp://") ||
    target.startsWith("telnet://") ||
    target.startsWith("file://")
  ) {
    violations.push({
      ruleId: RULE_DATA_PROTECTION.id,
      severity: "CRITICAL",
      reason: `Protocolo inseguro detectado: ${target.split("://")[0]}`,
      evidence: target,
    });
    return violations;
  }

  // Extraer dominio del target
  let domain: string;
  try {
    const url = new URL(target.startsWith("http") ? target : `https://${target}`);
    domain = url.hostname.toLowerCase();
  } catch {
    domain = target.toLowerCase();
  }

  // Verificar contra lista blanca
  const isAuthorized = ALLOWED_DOMAINS.some((allowed) => {
    if (allowed.startsWith("*.")) {
      const suffix = allowed.slice(2);
      return domain === suffix || domain.endsWith("." + suffix);
    }
    return domain === allowed || domain.endsWith("." + allowed);
  });

  if (!isAuthorized) {
    violations.push({
      ruleId: RULE_DATA_PROTECTION.id,
      severity: "CRITICAL",
      reason: `Conexión a dominio no autorizado: ${domain}. Solo están permitidos: ${ALLOWED_DOMAINS.join(", ")}`,
      evidence: target,
    });
  }

  return violations;
}

/**
 * CHECK 6: Verifica comandos de shell peligrosos.
 */
function checkShellCommand(code: string): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const cmd = code.toLowerCase();

  const dangerousCommands = [
    { pattern: /rm\s+-rf\s+\//, reason: "Comando de eliminación destructivo detectado" },
    { pattern: /mkfs\./, reason: "Formateo de disco detectado" },
    { pattern: /dd\s+if=.*of=\/(dev|disk)/, reason: "Escritura directa a dispositivo detectada" },
    { pattern: /:\(\)\{\s*:\|:&\s*\}.*;/, reason: "Fork bomb detectada" },
    { pattern: />\s*\/dev\/null\s*2>&1.*&\s*$/, reason: "Comando en background con salida silenciada (posible persistencia)" },
    { pattern: /curl\s+.*\|\s*(bash|sh|zsh)/, reason: "Pipe de curl a shell detectado" },
    { pattern: /wget\s+.*\|\s*(bash|sh|zsh)/, reason: "Pipe de wget a shell detectado" },
    { pattern: /chmod\s+.*\+s/, reason: "Setuid bit detectado (elevación de privilegios)" },
    { pattern: /chown\s+root/, reason: "Cambio de propiedad a root detectado" },
    { pattern: /sudo\s+.*(su|bash|sh|zsh)/, reason: "Elevación de privilegios con shell detectada" },
  ];

  for (const { pattern, reason } of dangerousCommands) {
    if (pattern.test(cmd)) {
      violations.push({
        ruleId: RULE_BACKDOOR_PREVENTION.id,
        severity: "CRITICAL",
        reason,
        evidence: code.substring(0, 200),
      });
    }
  }

  return violations;
}

/**
 * CHECK 7: Verifica si un cambio al sistema está autorizado.
 */
function checkChangeAuthorization(action: ProposedAction): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // Todos los cambios al sistema requieren al menos aprobación
  violations.push({
    ruleId: RULE_CHANGE_CONTROL.id,
    severity: "HIGH",
    reason: `Cambio al sistema requiere aprobación explícita: ${action.description} (tipo: ${action.type})`,
  });

  // Verificar que no sea un cambio prohibido
  const description = action.description.toLowerCase();
  for (const forbidden of RULE_CHANGE_CONTROL.forbiddenChanges) {
    if (description.includes(forbidden.toLowerCase())) {
      violations.push({
        ruleId: RULE_CHANGE_CONTROL.id,
        severity: "CRITICAL",
        reason: `Cambio PROHIBIDO detectado: ${forbidden}`,
      });
    }
  }

  return violations;
}

/**
 * CHECK 8: Verifica cambios de permisos.
 */
function checkPermissionChanges(action: ProposedAction): RuleViolation[] {
  const violations: RuleViolation[] = [];

  violations.push({
    ruleId: RULE_CHANGE_CONTROL.id,
    severity: "HIGH",
    reason: `Cambio de permisos/cuentas requiere aprobación: ${action.description}`,
  });

  return violations;
}

/**
 * CHECK 9: Verifica exportación de datos.
 */
function checkDataExport(action: ProposedAction): RuleViolation[] {
  const violations: RuleViolation[] = [];

  violations.push({
    ruleId: RULE_DATA_PROTECTION.id,
    severity: "HIGH",
    reason: `Exportación de datos requiere aprobación explícita del usuario: ${action.description}`,
  });

  if (action.data) {
    const dataViolations = checkDataSensitivity(action.data, action.type);
    violations.push(...dataViolations);
  }

  return violations;
}

/**
 * CHECK 10: Verifica seguridad de prompts para LLMs externos.
 */
function checkLLMPromptSafety(action: ProposedAction): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const description = action.description || "";

  // Verificar que el prompt no contenga datos sensibles
  if (action.data) {
    const dataStr = JSON.stringify(action.data);
    const sensitivePatterns = [
      /sk-[a-zA-Z0-9]{20,}/i,
      /password["\s]*[:=]/i,
      /secret["\s]*[:=]/i,
      /token["\s]*[:=]["\s]*[a-zA-Z0-9_\-]{10,}/i,
      /postgres(ql)?:\/\/[^\s"]+/i,
      /-----BEGIN.*PRIVATE KEY-----/,
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(dataStr)) {
        violations.push({
          ruleId: RULE_THIRD_PARTY_ISOLATION.id,
          severity: "CRITICAL",
          reason: `Prompt para LLM externo contiene datos sensibles (patrón: ${pattern.source})`,
          evidence: `Revisar datos del prompt antes de enviar`,
        });
      }
    }
  }

  // Verificar que no se envíe contexto de negocio sensible a terceros
  if (description.includes("customer") || description.includes("client")) {
    violations.push({
      ruleId: RULE_THIRD_PARTY_ISOLATION.id,
      severity: "HIGH",
      reason: "Prompt para LLM externo potencialmente contiene datos de clientes",
    });
  }

  return violations;
}

/**
 * CHECK 11: Verifica acciones que invaden privacidad.
 */
function checkPrivacySensitiveAction(action: ProposedAction): RuleViolation[] {
  const violations: RuleViolation[] = [];

  violations.push({
    ruleId: RULE_PRIVACY.id,
    severity: "HIGH",
    reason: `Acción '${action.type}' invade la privacidad y requiere consentimiento explícito del usuario según Regla 4`,
  });

  return violations;
}

/**
 * CHECK 12: Verifica acciones de comunicación.
 */
function checkCommunicationAction(action: ProposedAction): RuleViolation[] {
  const violations: RuleViolation[] = [];

  if (action.type === "payment") {
    violations.push({
      ruleId: RULE_SUPREMA.id,
      severity: "CRITICAL",
      reason: "Transacción de pago requiere aprobación explícita del usuario (Regla Suprema + Soberanía Digital 7.9)",
    });
  } else {
    violations.push({
      ruleId: RULE_PRIVACY.id,
      severity: "HIGH",
      reason: `Acción '${action.type}' requiere aprobación del usuario según Regla 4.7`,
    });
  }

  return violations;
}

/**
 * CHECK 13: Verifica acceso a clipboard.
 */
function checkClipboardAccess(action: ProposedAction): RuleViolation[] {
  const violations: RuleViolation[] = [];

  violations.push({
    ruleId: RULE_DATA_PROTECTION.id,
    severity: "HIGH",
    reason: "Acceso al clipboard requiere aprobación (podría contener datos sensibles según Regla 1.6)",
  });

  return violations;
}

// ============================================================
// CHECK 14: Verifica acceso a datos biométricos
// ============================================================

/**
 * CHECK 14: Verifica que el acceso a datos biométricos cumpla con la Regla 8.
 * - Datos faciales solo local
 * - Datos de voz solo con cifrado
 * - Consentimiento OPT-IN requerido
 */
function checkBiometricAccess(action: ProposedAction): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // Verificar si se almacenan datos biométricos en servidores externos
  if (action.storageLocation === "remote") {
    violations.push({
      ruleId: RULE_BIOMETRIC_PROTECTION.id,
      severity: "CRITICAL",
      reason: `Datos biométricos NO pueden almacenarse en servidores externos (Regla 8.1). Tipo: ${action.biometricType || "desconocido"}`,
      evidence: `storageLocation=remote, biometricType=${action.biometricType}`,
    });
  }

  // Verificar tipo biométrico y consentimiento
  if (action.type === "facial_recognition" || action.biometricType === "facial") {
    violations.push({
      ruleId: RULE_BIOMETRIC_PROTECTION.id,
      severity: "HIGH",
      reason: "Reconocimiento facial requiere consentimiento OPT-IN explícito (Regla 8.10). Debe ejecutarse localmente (Regla 8.3).",
    });
  }

  if (action.type === "voice_recognition" || action.biometricType === "voice") {
    violations.push({
      ruleId: RULE_BIOMETRIC_PROTECTION.id,
      severity: "HIGH",
      reason: "Reconocimiento de voz requiere consentimiento OPT-IN explícito (Regla 8.10). Procesamiento local preferido (Regla 8.4).",
    });
  }

  // Verificar acceso a cámara
  if (action.type === "camera_access" || action.type === "facial_recognition") {
    violations.push({
      ruleId: RULE_BIOMETRIC_PROTECTION.id,
      severity: "HIGH",
      reason: "Acceso a cámara requiere consentimiento explícito (Regla 8.7). No se permite tracking sin consentimiento.",
    });
  }

  // Verificar acceso a micrófono
  if (action.type === "microphone_access" || action.type === "voice_recognition" || action.type === "voice_command") {
    violations.push({
      ruleId: RULE_BIOMETRIC_PROTECTION.id,
      severity: "HIGH",
      reason: "Acceso a micrófono requiere consentimiento explícito. Datos de voz NO pueden transmitirse sin cifrado (Regla 8.2).",
    });
  }

  // Verificar datos en la acción
  if (action.data) {
    const dataStr = JSON.stringify(action.data).toLowerCase();
    // Detectar embeddings faciales sin cifrado
    if (
      dataStr.includes("facedescriptor") ||
      dataStr.includes("facedescriptor") ||
      dataStr.includes("embedding") ||
      dataStr.includes("landmark")
    ) {
      violations.push({
        ruleId: RULE_BIOMETRIC_PROTECTION.id,
        severity: "CRITICAL",
        reason: "Embeddings faciales detectados deben almacenarse cifrados con AES-256 (Regla 8.6)",
      });
    }
  }

  return violations;
}

// ============================================================
// CHECK 15: Verifica seguridad de acciones automáticas
// ============================================================

/**
 * CHECK 15: Verifica que las acciones automáticas cumplan con la Regla 9.
 * - Acciones destructivas requieren confirmación
 * - Acciones financieras requieren auth adicional
 * - Acciones masivas requieren aprobación humana
 * - Ventana de mantenimiento protegida
 */
function checkAutomationSafety(action: ProposedAction): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // Verificar hora actual (ventana de mantenimiento 2AM-6AM)
  const now = new Date();
  const currentHour = now.getHours();
  const isMaintenanceWindow = currentHour >= 2 && currentHour < 6;

  if (isMaintenanceWindow) {
    violations.push({
      ruleId: RULE_AUTOMATION_CONTROL.id,
      severity: "CRITICAL",
      reason: `Acción automática bloqueada en ventana de mantenimiento protegida (2AM-6AM). Hora actual: ${currentHour}:00 (Regla 9.7)`,
    });
  }

  // Verificar si es acción destructiva
  const isDestructive =
    action.type === "refund" ||
    action.type === "customer_data_modification" ||
    action.type === "price_change" ||
    action.type === "stock_modification" ||
    action.type === "file_delete";

  if (isDestructive) {
    violations.push({
      ruleId: RULE_AUTOMATION_CONTROL.id,
      severity: "CRITICAL",
      reason: `Acción destructiva '${action.type}' requiere confirmación explícita (Regla 9.1)`,
    });
  }

  // Verificar si afecta datos de clientes (doble confirmación)
  if (action.type === "customer_data_modification") {
    violations.push({
      ruleId: RULE_AUTOMATION_CONTROL.id,
      severity: "CRITICAL",
      reason: "Modificación de datos de clientes requiere DOBLE confirmación (Regla 9.2)",
    });
  }

  // Verificar acciones financieras
  if (action.type === "refund" || action.type === "payment" || action.amount !== undefined) {
    violations.push({
      ruleId: RULE_AUTOMATION_CONTROL.id,
      severity: "CRITICAL",
      reason: `Acción financiera requiere AUTENTICACIÓN ADICIONAL (Regla 9.3). ${action.amount ? `Monto: ${action.amount} ${action.currency || ""}` : ""}`,
    });
  }

  // Verificar acciones masivas (>10 items)
  if (action.itemCount && action.itemCount > RULE_AUTOMATION_CONTROL.thresholds.bulkActionMinItems) {
    violations.push({
      ruleId: RULE_AUTOMATION_CONTROL.id,
      severity: "CRITICAL",
      reason: `Acción masiva (${action.itemCount} items) requiere aprobación humana (Regla 9.8). Máximo permitido sin aprobación: ${RULE_AUTOMATION_CONTROL.thresholds.bulkActionMinItems}`,
    });
  }

  // Verificar reversibilidad
  if (action.isReversible === false) {
    violations.push({
      ruleId: RULE_AUTOMATION_CONTROL.id,
      severity: "CRITICAL",
      reason: "Acción NO reversible detectada. Toda acción automática debe ser REVERSIBLE (Regla 9.4)",
    });
  }

  // Verificar cambio de precios/stock
  if (action.type === "price_change" || action.type === "stock_modification") {
    violations.push({
      ruleId: RULE_AUTOMATION_CONTROL.id,
      severity: "CRITICAL",
      reason: `Acción que modifica precios/stock requiere confirmación con el monto exacto (Regla 9.9). ${action.amount !== undefined ? `Cambio propuesto: ${action.amount}` : "Monto no especificado"}`,
    });
  }

  return violations;
}

// ============================================================
// CHECK 16: Verifica seguridad de comunicaciones
// ============================================================

/**
 * CHECK 16: Verifica que las comunicaciones cumplan con la Regla 10.
 * - Aprobación requerida para todos los canales
 * - No enviar datos de clientes
 * - Identificación como IA
 * - Broadcast requiere aprobación humana
 */
function checkCommunicationSafety(action: ProposedAction): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // WhatsApp requiere aprobación
  if (action.type === "whatsapp_send") {
    violations.push({
      ruleId: RULE_COMMUNICATION_ISOLATION.id,
      severity: "CRITICAL",
      reason: "Envío de WhatsApp requiere aprobación explícita del usuario (Regla 10.2)",
    });
  }

  // Redes sociales requieren aprobación
  if (action.type === "social_media_post") {
    violations.push({
      ruleId: RULE_COMMUNICATION_ISOLATION.id,
      severity: "CRITICAL",
      reason: "Publicación en redes sociales requiere aprobación explícita (Regla 10.3)",
    });
  }

  // Broadcast masivo requiere aprobación humana
  if (action.type === "broadcast_message" || (action.recipientCount && action.recipientCount >= RULE_COMMUNICATION_ISOLATION.broadcastRules.minRecipientsForBroadcast)) {
    violations.push({
      ruleId: RULE_COMMUNICATION_ISOLATION.id,
      severity: "CRITICAL",
      reason: `Comunicación masiva (${action.recipientCount || "desconocidos"} destinatarios) requiere aprobación humana (Regla 10.8)`,
    });
  }

  // Verificar que email también requiere aprobación
  if (action.type === "email_send") {
    violations.push({
      ruleId: RULE_COMMUNICATION_ISOLATION.id,
      severity: "HIGH",
      reason: "Envío de email requiere aprobación del usuario (Regla 10.1). El contenido debe ser VISIBLE y EDITABLE antes del envío (Regla 10.5).",
    });
  }

  // Verificar que no se envíen datos de clientes
  if (action.data) {
    const dataStr = JSON.stringify(action.data).toLowerCase();
    const customerDataPatterns = [
      "customer", "cliente", "email", "phone", "dni", "address",
      "nombre", "telefono", "direccion", "compra", "pedido",
    ];
    for (const pattern of customerDataPatterns) {
      if (dataStr.includes(pattern)) {
        violations.push({
          ruleId: RULE_COMMUNICATION_ISOLATION.id,
          severity: "CRITICAL",
          reason: `Comunicación NO puede contener datos de clientes (Regla 10.7). Patrón detectado: '${pattern}'`,
        });
        break;
      }
    }
  }

  // Verificar identificación como IA
  if (action.description && !action.description.toLowerCase().includes("ia")) {
    violations.push({
      ruleId: RULE_COMMUNICATION_ISOLATION.id,
      severity: "HIGH",
      reason: "JARVIS debe identificarse claramente como IA en todas las comunicaciones (Regla 10.9)",
    });
  }

  return violations;
}

// ============================================================
// CHECK 17: Detecta intentos de auto-modificación
// ============================================================

/**
 * CHECK 17: Detecta intentos de JARVIS de modificarse a sí mismo (Regla 11).
 * - No modificar código fuente
 * - No modificar constitución
 * - No crear endpoints sin aprobación
 * - No modificar schema de BD
 * - No instalar dependencias
 */
function checkEvolutionAttempt(action: ProposedAction): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // Verificar auto-modificación de código
  if (action.type === "self_modification" || action.type === "code_modification") {
    violations.push({
      ruleId: RULE_EVOLUTION_CONTROL.id,
      severity: "CRITICAL",
      reason: "JARVIS NO puede modificar su propio código fuente (Regla 11.1). Cualquier cambio requiere review humano y CI/CD (Regla 11.7, 11.8).",
    });
  }

  // Verificar modificación de reglas
  if (action.type === "rule_change") {
    violations.push({
      ruleId: RULE_EVOLUTION_CONTROL.id,
      severity: "CRITICAL",
      reason: "JARVIS NO puede modificar las reglas de esta Constitución (Regla 11.2). Solo el usuario OWNER puede hacerlo.",
    });
  }

  // Verificar creación de endpoints
  if (action.type === "endpoint_creation") {
    violations.push({
      ruleId: RULE_EVOLUTION_CONTROL.id,
      severity: "CRITICAL",
      reason: "JARVIS NO puede crear nuevos endpoints de API sin aprobación (Regla 11.3).",
    });
  }

  // Verificar modificación de schema
  if (action.type === "schema_modification") {
    violations.push({
      ruleId: RULE_EVOLUTION_CONTROL.id,
      severity: "CRITICAL",
      reason: "JARVIS NO puede modificar la base de datos schema sin aprobación (Regla 11.4).",
    });
  }

  // Verificar instalación de dependencias (también cubierto por RULE_CHANGE_CONTROL)
  if (action.type === "dependency_install") {
    violations.push({
      ruleId: RULE_EVOLUTION_CONTROL.id,
      severity: "CRITICAL",
      reason: "JARVIS NO puede instalar nuevas dependencias (npm/pip) sin aprobación (Regla 11.5).",
    });
  }

  // Verificar modificación de variables de entorno
  if (action.type === "environment_change") {
    violations.push({
      ruleId: RULE_EVOLUTION_CONTROL.id,
      severity: "CRITICAL",
      reason: "JARVIS NO puede modificar variables de entorno (Regla 11.6).",
    });
  }

  // Verificar intento de desactivar auditoría
  if (action.type === "audit_system_change") {
    violations.push({
      ruleId: RULE_EVOLUTION_CONTROL.id,
      severity: "CRITICAL",
      reason: "JARVIS NO puede desactivar el sistema de auditoría (Regla 11.9). Esto resulta en SHUTDOWN.",
    });
  }

  // Escanear código en la descripción por patrones de evolución
  if (action.description) {
    const desc = action.description.toLowerCase();
    for (const pattern of RULE_EVOLUTION_CONTROL.forbiddenPatterns) {
      if (pattern.test(desc)) {
        violations.push({
          ruleId: RULE_EVOLUTION_CONTROL.id,
          severity: "CRITICAL",
          reason: `Patrón de auto-modificación detectado en descripción: ${pattern.source} (Regla 11.x)`,
          evidence: action.description.substring(0, 200),
        });
      }
    }
  }

  // Si hay violaciones de evolución, siempre agregar alerta de SHUTDOWN
  if (violations.length > 0) {
    violations.push({
      ruleId: RULE_EVOLUTION_CONTROL.id,
      severity: "CRITICAL",
      reason: "Intento de evolución no autorizada detectado. Acción: BLOCK_SHUTDOWN_AND_ALERT (Regla 11)",
    });
  }

  return violations;
}

// ============================================================
// CHECK 18: Verifica exposición de datos de clientes
// ============================================================

/**
 * CHECK 18: Verifica que no se expongan datos de clientes (Regla 12).
 * - Datos de clientes son propiedad exclusiva del usuario
 * - No usar para entrenar modelos
 * - No compartir con terceros
 * - Anonimizar antes de análisis externo
 */
function checkCustomerDataExposure(action: ProposedAction): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // Verificar exportación de datos de clientes
  if (action.type === "customer_data_export") {
    violations.push({
      ruleId: RULE_CUSTOMER_DATA_PROTECTION.id,
      severity: "HIGH",
      reason: "Exportación de datos de clientes requiere aprobación explícita. Los datos son propiedad exclusiva del usuario (Regla 12.1, 12.6).",
    });
  }

  // Verificar compartir datos de clientes
  if (action.type === "customer_data_sharing") {
    violations.push({
      ruleId: RULE_CUSTOMER_DATA_PROTECTION.id,
      severity: "CRITICAL",
      reason: "JARVIS NO puede compartir datos de clientes con terceros (Regla 12.3). Los datos NO pueden salir del entorno de MADSJEEZ (Regla 12.4).",
    });
  }

  // Verificar análisis de datos de clientes
  if (action.type === "customer_analysis") {
    violations.push({
      ruleId: RULE_CUSTOMER_DATA_PROTECTION.id,
      severity: "HIGH",
      reason: "Análisis de datos de clientes requiere anonimización previa (Regla 12.5).",
    });
  }

  // Verificar acceso a datos de pagos (PCI-DSS)
  if (action.type === "payment_data_access") {
    violations.push({
      ruleId: RULE_CUSTOMER_DATA_PROTECTION.id,
      severity: "CRITICAL",
      reason: "Acceso a datos de pagos de clientes requiere protección PCI-DSS (Regla 12.8).",
    });
  }

  // Verificar que los datos no contengan información de clientes
  if (action.data) {
    const dataStr = JSON.stringify(action.data);
    const customerPatterns = [
      { pattern: /customer.*name|cliente.*nombre|buyer.*name/i, type: "customer_name" },
      { pattern: /customer.*email|cliente.*email|buyer.*email/i, type: "customer_email" },
      { pattern: /customer.*phone|telefono|tel\b/i, type: "customer_phone" },
      { pattern: /customer.*dni|\b\d{2}[.,]?\d{3}[.,]?\d{3}\b|\b\d{2}-\d{8}-\d\b/i, type: "customer_dni/DNI" },
      { pattern: /order.*history|historial.*compra|purchase.*history/i, type: "order_history" },
      { pattern: /payment.*method|metodo.*pago|tarjeta/i, type: "payment_method" },
      { pattern: /shipping.*address|delivery.*address|direccion.*envio/i, type: "shipping_address" },
    ];

    for (const { pattern, type } of customerPatterns) {
      if (pattern.test(dataStr)) {
        violations.push({
          ruleId: RULE_CUSTOMER_DATA_PROTECTION.id,
          severity: "CRITICAL",
          reason: `Datos de clientes detectados (${type}) en acción: ${action.type} (Regla 12.x). JARVIS NO puede procesar datos de clientes sin salvaguardas.`,
        });
      }
    }

    // Verificar datos de menores de edad
    const minorPatterns = [
      /edad.*\d{1,2}.*año|age.*\d{1,2}.*year/i,
      /menor.*edad|underage|minor/i,
      /child|niño|adolescente|teenager/i,
    ];
    for (const pattern of minorPatterns) {
      if (pattern.test(dataStr)) {
        violations.push({
          ruleId: RULE_CUSTOMER_DATA_PROTECTION.id,
          severity: "CRITICAL",
          reason: "Posibles datos de menores de edad detectados — PROHIBIDO procesar (Regla 12.9)",
        });
        break;
      }
    }
  }

  return violations;
}

// ============================================================
// FUNCIONES UTILITARIAS
// ============================================================

/**
 * Verifica rápidamente si un texto contiene datos sensibles.
 * Útil para sanitización previa a cualquier operación.
 */
export function quickScan(text: string): {
  hasSensitiveData: boolean;
  detectedTypes: string[];
} {
  const detectedTypes: string[] = [];

  const patterns = [
    { pattern: /sk-[a-zA-Z0-9]{20,}/i, type: "API_KEY" },
    { pattern: /password["\s]*[:=]["\s]*[^\s,}\]]+/i, type: "PASSWORD" },
    { pattern: /token["\s]*[:=]["\s]*[a-zA-Z0-9_\-]{10,}/i, type: "TOKEN" },
    { pattern: /secret["\s]*[:=]["\s]*[^\s,}\]]+/i, type: "SECRET" },
    { pattern: /postgres(ql)?:\/\/[^\s"]+/i, type: "DATABASE_URL" },
    { pattern: /-----BEGIN.*PRIVATE KEY-----/, type: "PRIVATE_KEY" },
    { pattern: /\b\d{2}[.,]?\d{3}[.,]?\d{3}\b/, type: "DNI" },
    { pattern: /\b\d{2}-\d{8}-\d\b/, type: "CUIT/CUIL" },
    { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, type: "CREDIT_CARD" },
  ];

  for (const { pattern, type } of patterns) {
    if (pattern.test(text)) {
      detectedTypes.push(type);
    }
  }

  return {
    hasSensitiveData: detectedTypes.length > 0,
    detectedTypes,
  };
}

/**
 * Wrapper seguro para ejecutar funciones con enforceamiento.
 * Si la acción es bloqueada, lanza error en lugar de ejecutar.
 */
export async function executeWithEnforcement<T>(
  action: ProposedAction,
  fn: () => Promise<T>
): Promise<T> {
  const result = evaluateAction(action);

  if (!result.approved) {
    const error = new Error(
      `🚫 ACCIÓN BLOQUEADA por Sistema de Gobernanza JARVIS\n` +
        `Regla: ${result.violations[0]?.ruleId || "UNKNOWN"}\n` +
        `Razón: ${result.violations[0]?.reason || "Violación de constitución"}\n` +
        `Acción requerida: ${result.requiredAction}`
    );
    (error as any).governanceResult = result;
    throw error;
  }

  return fn();
}
