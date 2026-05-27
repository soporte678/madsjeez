/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║           VAULT JARVIS — Protección de Datos Sensibles         ║
 * ║                                                                  ║
 * ║  Todos los datos sensibles pasan por este vault antes de ser   ║
 * ║  procesados por cualquier agente.                              ║
 * ║                                                                  ║
 * ║  El vault:                                                       ║
 * ║  1. Enmascara datos sensibles                                   ║
 * ║  2. Reemplaza secrets por placeholders                          ║
 * ║  3. Solo desenmascara con aprobación explícita                  ║
 * ║  4. Verifica que prompts para LLMs externos estén sanitizados   ║
 * ║  5. Previene filtración de datos sensibles en logs/debug        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ============================================================
// PLACEHOLDERS PARA DATOS SENSIBLES
// ============================================================

const MASKS: Record<string, string> = {
  API_KEY: "[API_KEY_REDACTED]",
  PASSWORD: "[PASSWORD_REDACTED]",
  TOKEN: "[TOKEN_REDACTED]",
  SECRET: "[SECRET_REDACTED]",
  DATABASE_URL: "[DB_URL_REDACTED]",
  DNI: "[DNI_REDACTED]",
  CUIT: "[CUIT_REDACTED]",
  BANK_ACCOUNT: "[BANK_ACCOUNT_REDACTED]",
  PHONE: "[PHONE_REDACTED]",
  EMAIL: "[EMAIL_REDACTED]",
  ADDRESS: "[ADDRESS_REDACTED]",
  PRIVATE_KEY: "[PRIVATE_KEY_REDACTED]",
  WEBHOOK_SECRET: "[WEBHOOK_SECRET_REDACTED]",
  CREDIT_CARD: "[CREDIT_CARD_REDACTED]",
  LOCATION_GPS: "[LOCATION_REDACTED]",
  CONVERSATION: "[CONVERSATION_REDACTED]",
  BUSINESS_SECRET: "[BUSINESS_SECRET_REDACTED]",
  FINANCIAL_DATA: "[FINANCIAL_DATA_REDACTED]",
  CUSTOMER_DATA: "[CUSTOMER_DATA_REDACTED]",
  CREDENTIAL: "[CREDENTIAL_REDACTED]",
};

// ============================================================
// PATRONES REGEX PARA DETECTAR DATOS SENSIBLES
// ============================================================

interface SensitivePattern {
  name: string;
  pattern: RegExp;
  mask: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  category: string;
}

const SENSITIVE_PATTERNS: SensitivePattern[] = [
  // 🔴 CRITICAL: Credenciales y claves
  {
    name: "OPENAI_API_KEY",
    pattern: /sk-[a-zA-Z0-9]{48}/g,
    mask: MASKS.API_KEY,
    severity: "CRITICAL",
    category: "CREDENTIAL",
  },
  {
    name: "GEMINI_API_KEY",
    pattern: /AIzaSy[A-Za-z0-9_\-]{33}/g,
    mask: MASKS.API_KEY,
    severity: "CRITICAL",
    category: "CREDENTIAL",
  },
  {
    name: "ANTHROPIC_API_KEY",
    pattern: /sk-ant-[a-zA-Z0-9_\-]{40,}/g,
    mask: MASKS.API_KEY,
    severity: "CRITICAL",
    category: "CREDENTIAL",
  },
  {
    name: "GENERIC_API_KEY",
    pattern: /[a-zA-Z0-9]{32,64}-[a-zA-Z0-9]{10,20}/g,
    mask: MASKS.API_KEY,
    severity: "CRITICAL",
    category: "CREDENTIAL",
  },
  {
    name: "PASSWORD_FIELD",
    pattern: /password["\s]*[:=]["\s]*[^\s,}\]]+/gi,
    mask: MASKS.PASSWORD,
    severity: "CRITICAL",
    category: "CREDENTIAL",
  },
  {
    name: "SECRET_FIELD",
    pattern: /secret["\s]*[:=]["\s]*[^\s,}\]]+/gi,
    mask: MASKS.SECRET,
    severity: "CRITICAL",
    category: "CREDENTIAL",
  },
  {
    name: "BEARER_TOKEN",
    pattern: /bearer\s+[a-zA-Z0-9_\-\.]{20,}/gi,
    mask: `${MASKS.TOKEN}`,
    severity: "CRITICAL",
    category: "CREDENTIAL",
  },
  {
    name: "ACCESS_TOKEN",
    pattern: /access[_-]?token["\s]*[:=]["\s]*[a-zA-Z0-9_\-\.]{10,}/gi,
    mask: MASKS.TOKEN,
    severity: "CRITICAL",
    category: "CREDENTIAL",
  },
  {
    name: "PRIVATE_KEY_BLOCK",
    pattern: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    mask: MASKS.PRIVATE_KEY,
    severity: "CRITICAL",
    category: "CREDENTIAL",
  },

  // 🔴 CRITICAL: Database URLs
  {
    name: "DATABASE_URL",
    pattern: /postgres(ql)?:\/\/[^:]+:[^@]+@[^\s"]+/gi,
    mask: MASKS.DATABASE_URL,
    severity: "CRITICAL",
    category: "DATABASE",
  },
  {
    name: "MONGODB_URL",
    pattern: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@[^\s"]+/gi,
    mask: MASKS.DATABASE_URL,
    severity: "CRITICAL",
    category: "DATABASE",
  },
  {
    name: "MYSQL_URL",
    pattern: /mysql:\/\/[^:]+:[^@]+@[^\s"]+/gi,
    mask: MASKS.DATABASE_URL,
    severity: "CRITICAL",
    category: "DATABASE",
  },

  // 🟡 HIGH: Documentos argentinos
  {
    name: "DNI_ARGENTINA",
    pattern: /\b\d{1,2}[.,]?\d{3}[.,]?\d{3}\b/g,
    mask: MASKS.DNI,
    severity: "HIGH",
    category: "PERSONAL_ID",
  },
  {
    name: "CUIT_CUIL",
    pattern: /\b\d{2}-\d{8}-\d\b/g,
    mask: MASKS.CUIT,
    severity: "HIGH",
    category: "PERSONAL_ID",
  },

  // 🟡 HIGH: Tarjetas de crédito
  {
    name: "CREDIT_CARD",
    pattern: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
    mask: MASKS.CREDIT_CARD,
    severity: "HIGH",
    category: "FINANCIAL",
  },
  {
    name: "CREDIT_CARD_LUHN",
    pattern: /\b(?:4\d{3}|5[1-5]\d{2}|3[47]\d{2}|6011)[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    mask: MASKS.CREDIT_CARD,
    severity: "HIGH",
    category: "FINANCIAL",
  },

  // 🟡 HIGH: Teléfonos
  {
    name: "PHONE_ARGENTINA",
    pattern: /\+?54[-\s]?\d{2,4}[-\s]?\d{6,8}/g,
    mask: MASKS.PHONE,
    severity: "HIGH",
    category: "CONTACT",
  },
  {
    name: "PHONE_GENERIC",
    pattern: /\+?\d{1,3}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{4}/g,
    mask: MASKS.PHONE,
    severity: "HIGH",
    category: "CONTACT",
  },

  // 🟡 HIGH: Emails
  {
    name: "EMAIL_ADDRESS",
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    mask: MASKS.EMAIL,
    severity: "HIGH",
    category: "CONTACT",
  },

  // 🟡 HIGH: Webhook secrets
  {
    name: "WEBHOOK_SECRET",
    pattern: /whsec_[a-zA-Z0-9]{24,}/g,
    mask: MASKS.WEBHOOK_SECRET,
    severity: "HIGH",
    category: "CREDENTIAL",
  },

  // 🟠 MEDIUM: Datos de ubicación
  {
    name: "GPS_COORDINATES",
    pattern: /-?\d{1,3}\.\d{6,},\s*-?\d{1,3}\.\d{6,}/g,
    mask: MASKS.LOCATION_GPS,
    severity: "MEDIUM",
    category: "LOCATION",
  },
  {
    name: "IP_ADDRESS",
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    mask: "[IP_REDACTED]",
    severity: "MEDIUM",
    category: "LOCATION",
  },
];

// ============================================================
// FUNCIÓN PRINCIPAL: sanitize
// ============================================================

/**
 * Sanitiza un texto reemplazando datos sensibles por placeholders.
 * Aplica TODOS los patrones de detección.
 *
 * @param text Texto a sanitizar
 * @returns Texto con datos sensibles enmascarados
 */
export function sanitize(text: string): string {
  if (!text || typeof text !== "string") {
    return text;
  }

  let sanitized = text;

  for (const { pattern, mask } of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, mask);
  }

  return sanitized;
}

// ============================================================
// FUNCIÓN: sanitizeObject (recursiva)
// ============================================================

/**
 * Sanitiza un objeto recursivamente.
 * Recorre todas las propiedades y sanitiza strings.
 *
 * @param obj Objeto a sanitizar
 * @returns Objeto sanitizado
 */
export function sanitizeObject<T>(obj: T): T {
  // Caso string
  if (typeof obj === "string") {
    return sanitize(obj) as unknown as T;
  }

  // Caso array
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject) as unknown as T;
  }

  // Caso null
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Caso objeto
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitizar también el nombre de la clave si contiene datos sensibles
      const sanitizedKey = sanitize(key);
      result[sanitizedKey] = sanitizeObject(value);
    }
    return result as unknown as T;
  }

  // Primitivos (number, boolean, etc.)
  return obj;
}

// ============================================================
// FUNCIÓN: createSafePrompt
// ============================================================

/**
 * Crea un prompt seguro para enviar a LLMs externos.
 * Reemplaza TODOS los datos sensibles antes de enviar.
 *
 * @param userMessage Mensaje del usuario
 * @param context Contexto adicional (opcional)
 * @returns Prompt sanitizado listo para enviar a LLM
 */
export function createSafePrompt(
  userMessage: string,
  context?: Record<string, unknown>
): string {
  const safeMessage = sanitize(userMessage);
  const safeContext = context ? sanitizeObject(context) : null;

  let prompt = safeMessage;

  if (safeContext) {
    prompt += `\n\n--- Contexto ---\n${JSON.stringify(safeContext, null, 2)}`;
  }

  // Agregar recordatorio de privacidad
  prompt += `\n\n[NOTA DE PRIVACIDAD JARVIS: Este mensaje ha sido sanitizado automáticamente. `;
  prompt += `No contiene datos personales, credenciales, API keys, contraseñas, `;
  prompt += `ni información sensible del usuario ni de MADSJEEZ. `;
  prompt += `Cualquier dato sensible detectado fue reemplazado por placeholders.]`;

  return prompt;
}

// ============================================================
// FUNCIÓN: containsSensitiveData
// ============================================================

/**
 * Verifica si un texto contiene datos sensibles no enmascarados.
 * Útil para validación previa a cualquier operación.
 *
 * @param text Texto a verificar
 * @returns true si contiene datos sensibles
 */
export function containsSensitiveData(text: string): boolean {
  if (!text || typeof text !== "string") {
    return false;
  }

  for (const { pattern } of SENSITIVE_PATTERNS) {
    // Reset lastIndex para patrones globales
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      return true;
    }
  }

  return false;
}

// ============================================================
// FUNCIÓN: detectSensitiveData
// ============================================================

/**
 * Detecta y reporta qué tipos de datos sensibles contiene un texto.
 * Útil para logging y alertas.
 *
 * @param text Texto a analizar
 * @returns Lista de tipos de datos sensibles detectados
 */
export function detectSensitiveData(text: string): Array<{
  type: string;
  severity: string;
  category: string;
  count: number;
}> {
  const detections: Map<
    string,
    { type: string; severity: string; category: string; count: number }
  > = new Map();

  for (const { name, pattern, severity, category } of SENSITIVE_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      const existing = detections.get(name);
      if (existing) {
        existing.count += matches.length;
      } else {
        detections.set(name, {
          type: name,
          severity,
          category,
          count: matches.length,
        });
      }
    }
  }

  return Array.from(detections.values());
}

// ============================================================
// FUNCIÓN: maskSpecific
// ============================================================

/**
 * Enmascara un tipo específico de dato sensible.
 *
 * @param text Texto a procesar
 * @param type Tipo de dato a enmascarar (ej: "API_KEY", "EMAIL")
 * @returns Texto con solo ese tipo enmascarado
 */
export function maskSpecific(text: string, type: string): string {
  const pattern = SENSITIVE_PATTERNS.find((p) => p.name === type);
  if (!pattern) {
    return text;
  }
  return text.replace(pattern.pattern, pattern.mask);
}

// ============================================================
// FUNCIÓN: redactForLogging
// ============================================================

/**
 * Redacta un objeto para uso en logs.
 * Elimina completamente campos sensibles en lugar de reemplazarlos.
 *
 * @param obj Objeto a redactar
 * @returns Objeto con campos sensibles eliminados
 */
export function redactForLogging<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const sensitiveKeys = [
    "password",
    "secret",
    "token",
    "api_key",
    "apikey",
    "private_key",
    "database_url",
    "db_url",
    "credential",
    "credit_card",
    "cvv",
    "pin",
  ];

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();

    if (sensitiveKeys.some((sk) => keyLower.includes(sk))) {
      result[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      result[key] = redactForLogging(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ============================================================
// FUNCIÓN: createDebugOutput
// ============================================================

/**
 * Crea una salida segura para debugging.
 * NUNCA expone datos sensibles en mensajes de error o debug.
 *
 * @param label Etiqueta del debug
 * @param data Datos a mostrar
 * @returns String seguro para console.log/error
 */
export function createDebugOutput(
  label: string,
  data: unknown
): string {
  const safeData = sanitizeObject(data);
  return `[${label}] ${JSON.stringify(safeData, null, 2)}`;
}

// ============================================================
// FUNCIÓN: safeStringify
// ============================================================

/**
 * JSON.stringify seguro que nunca expone datos sensibles.
 * Usar SIEMPRE en lugar de JSON.stringify para logging.
 *
 * @param obj Objeto a serializar
 * @returns String JSON seguro
 */
export function safeStringify(
  obj: unknown,
  space?: number
): string {
  const safe = sanitizeObject(obj);
  return JSON.stringify(safe, null, space);
}

// ============================================================
// FUNCIÓN: verifySanitization
// ============================================================

/**
 * Verifica que un texto esté completamente sanitizado.
 * Lanza error si encuentra datos sensibles no enmascarados.
 *
 * @param text Texto a verificar
 * @param context Contexto para el mensaje de error
 * @throws Error si el texto contiene datos sensibles
 */
export function verifySanitization(
  text: string,
  context?: string
): void {
  const detections = detectSensitiveData(text);
  const criticalDetections = detections.filter(
    (d) => d.severity === "CRITICAL"
  );

  if (criticalDetections.length > 0) {
    const types = criticalDetections.map((d) => d.type).join(", ");
    throw new Error(
      `🔒 VAULT SECURITY VIOLATION: Datos sensibles (CRITICAL) detectados ` +
        `en ${context || "texto"}: ${types}. ` +
        `Los datos sensibles NO pueden ser transmitidos. ` +
        `Usar vault.sanitize() antes de cualquier operación.`
    );
  }
}

// ============================================================
// INFORMACIÓN DEL VAULT
// ============================================================

/**
 * Obtiene información sobre el vault.
 * Útil para debugging y auditoría.
 */
export function getVaultInfo(): {
  version: string;
  patternCount: number;
  patternsBySeverity: Record<string, number>;
  patternsByCategory: Record<string, number>;
} {
  const patternsBySeverity: Record<string, number> = {};
  const patternsByCategory: Record<string, number> = {};

  for (const pattern of SENSITIVE_PATTERNS) {
    patternsBySeverity[pattern.severity] =
      (patternsBySeverity[pattern.severity] || 0) + 1;
    patternsByCategory[pattern.category] =
      (patternsByCategory[pattern.category] || 0) + 1;
  }

  return {
    version: "1.0.0",
    patternCount: SENSITIVE_PATTERNS.length,
    patternsBySeverity,
    patternsByCategory,
  };
}
