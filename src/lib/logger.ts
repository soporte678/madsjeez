/**
 * Logger estructurado para MadsJeez
 * Solo loguea en development, en produccion usa servicio externo o silencia
 */

const IS_DEV = process.env.NODE_ENV === "development";
const IS_TEST = process.env.NODE_ENV === "test";

function createLogger() {
  // En produccion, los logs de debug se silencian
  const shouldLog = IS_DEV || IS_TEST;

  return {
    debug: (msg: string, ...args: unknown[]) => {
      if (shouldLog) console.debug(`[DEBUG] ${msg}`, ...args);
    },
    info: (msg: string, ...args: unknown[]) => {
      // Info se muestra en dev, en prod solo si JARVIS_LOG_LEVEL=info
      if (shouldLog || process.env.JARVIS_LOG_LEVEL === "info") {
        console.info(`[INFO] ${msg}`, ...args);
      }
    },
    warn: (msg: string, ...args: unknown[]) => {
      console.warn(`[WARN] ${msg}`, ...args);
    },
    error: (msg: string, ...args: unknown[]) => {
      // Error siempre se loguea pero sin datos sensibles
      const sanitized = sanitizeForLog(args);
      console.error(`[ERROR] ${msg}`, ...sanitized);
    },
  };
}

function sanitizeForLog(args: unknown[]): unknown[] {
  const sensitiveKeys = ["password", "token", "secret", "key", "authorization", "credit_card"];
  return args.map((arg) => {
    if (typeof arg === "object" && arg !== null) {
      const sanitized = { ...(arg as Record<string, unknown>) };
      for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
          sanitized[key] = "[REDACTED]";
        }
      }
      return sanitized;
    }
    return arg;
  });
}

export const logger = createLogger();
