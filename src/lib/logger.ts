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
        console.info(`[INFO] ${msg}`, ...sanitizeForLog(args));
      }
    },
    warn: (msg: string, ...args: unknown[]) => {
      console.warn(`[WARN] ${msg}`, ...sanitizeForLog(args));
    },
    error: (msg: string, ...args: unknown[]) => {
      // Error siempre se loguea pero sin datos sensibles
      const sanitized = sanitizeForLog(args);
      console.error(`[ERROR] ${msg}`, ...sanitized);
    },
  };
}

function sanitizeArg(arg: unknown): unknown {
  if (typeof arg === "string") {
    return arg
      .replace(/([?&]token=)[^&\s]+/gi, "$1[REDACTED]")
      .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [REDACTED]")
      .replace(/password=([^&\s]+)/gi, "password=[REDACTED]");
  }
  if (arg && typeof arg === "object" && !Array.isArray(arg)) {
    const sensitiveKeys = ["password", "token", "secret", "key", "authorization", "credit_card"];
    const sanitized = { ...(arg as Record<string, unknown>) };
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        sanitized[key] = "[REDACTED]";
      }
    }
    return sanitized;
  }
  return arg;
}

function sanitizeForLog(args: unknown[]): unknown[] {
  return args.map(sanitizeArg);
}

export const logger = createLogger();
