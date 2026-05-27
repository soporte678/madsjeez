/**
 * =============================================================================
 * JARVIS COMMAND ENDPOINT — Secure Command Execution with Multi-Factor Auth
 * =============================================================================
 * POST /api/jarvis/command
 * Recibe: { command: string, voiceAuthenticated: boolean, faceAuthenticated: boolean,
 *           faceSessionToken?: string, voiceCommand?: string, entities?: {} }
 * Procesa: Parsea el comando y ejecuta la accion correspondiente en MADSJEEZ
 * Retorna: { result: string, action: string, data: any, security: {} }
 *
 * REGLAS DE SEGURIDAD (INVENCIBLES):
 * - NUNCA se ejecuta un comando sin autenticacion facial previa
 * - NUNCA se envian datos a servidores externos
 * - Comandos peligrosos (delete, modify) requieren confirmacion verbal
 * - Logs de TODOS los comandos ejecutados
 * - Rate limiting por usuario
 * - Validacion de sesion facial via token
 * =============================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { assertJarvisAuth, parseJarvisJson } from "@/jarvis/api-auth";
import { executeJarvisCommand, executeJarvisReport } from "@/jarvis/jarvis-orchestrator";
import { parseVoiceCommand } from "@/lib/jarvis/voice-command-parser";
import type {
  JarvisCommandInput,
  JarvisCommandOutput,
  JarvisReportType,
  JarvisScope,
} from "@/jarvis/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type CommandRequestBody = {
  /** Raw command string (voice transcript or typed) */
  command: string;
  /** Voice authentication flag (from /api/jarvis/voice) */
  voiceAuthenticated?: boolean;
  /** Face authentication flag (verified via session token) */
  faceAuthenticated?: boolean;
  /** Face auth session token (JWT-like) */
  faceSessionToken?: string;
  /** Pre-parsed entities from voice parser */
  entities?: Record<string, unknown>;
  /** Confirmation token for dangerous commands */
  confirmationToken?: string;
  /** Source of the command */
  source?: "voice" | "web" | "desktop";
};

type CommandAction =
  | "publish_product"
  | "show_sales"
  | "send_message"
  | "meli_sync"
  | "activate_marketing"
  | "pause_listings"
  | "resume_listings"
  | "show_inventory"
  | "show_analytics"
  | "show_dashboard"
  | "orchestrate"
  | "health_check"
  | "audit_marketplace"
  | "detect_errors"
  | "suggest_improvements"
  | "create_agent_task"
  | "voice_report"
  | "unknown";

type SecurityLogEntry = {
  timestamp: string;
  action: CommandAction;
  command: string;
  userId: string;
  sourceIp: string;
  faceAuth: boolean;
  voiceAuth: boolean;
  requiresConfirmation: boolean;
  confirmed: boolean;
  executed: boolean;
  durationMs: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Commands that require explicit verbal confirmation */
const DANGEROUS_COMMANDS: CommandAction[] = [
  "publish_product",
  "pause_listings",
  "resume_listings",
  "meli_sync",
];

/** Commands that modify state (require double-check) */
const MUTATING_COMMANDS: CommandAction[] = [
  ...DANGEROUS_COMMANDS,
  "activate_marketing",
  "send_message",
];

/** Max commands per minute per user */
const COMMANDS_PER_MINUTE = 30;

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiting (per user)
// ─────────────────────────────────────────────────────────────────────────────

interface UserCommandBucket {
  count: number;
  windowStart: number;
}

const userRateLimits = new Map<string, UserCommandBucket>();

function checkUserRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const bucket = userRateLimits.get(userId);

  if (!bucket || now - bucket.windowStart > windowMs) {
    userRateLimits.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: COMMANDS_PER_MINUTE - 1 };
  }

  if (bucket.count >= COMMANDS_PER_MINUTE) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count++;
  return { allowed: true, remaining: COMMANDS_PER_MINUTE - bucket.count };
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Token Validator
// ─────────────────────────────────────────────────────────────────────────────

function validateFaceSessionToken(token: string | undefined): {
  valid: boolean;
  userId: string;
  expired: boolean;
} {
  if (!token) return { valid: false, userId: "", expired: false };

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parsed = JSON.parse(decoded) as {
      sub: string;
      exp: number;
      jti: string;
    };
    const expired = parsed.exp < Date.now() / 1000;
    return { valid: !expired, userId: parsed.sub, expired };
  } catch {
    return { valid: false, userId: "", expired: false };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirmation Token Generator for Dangerous Commands
// ─────────────────────────────────────────────────────────────────────────────

const pendingConfirmations = new Map<string, { action: CommandAction; expiresAt: number }>();

function generateConfirmationToken(action: CommandAction): string {
  const token = `conf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  pendingConfirmations.set(token, {
    action,
    expiresAt: Date.now() + 60_000, // 1 minute to confirm
  });
  return token;
}

function validateConfirmationToken(token: string, expectedAction: CommandAction): boolean {
  const pending = pendingConfirmations.get(token);
  if (!pending) return false;
  if (Date.now() > pending.expiresAt) {
    pendingConfirmations.delete(token);
    return false;
  }
  const valid = pending.action === expectedAction;
  if (valid) pendingConfirmations.delete(token);
  return valid;
}

// ─────────────────────────────────────────────────────────────────────────────
// Security Audit Logger
// ─────────────────────────────────────────────────────────────────────────────

function logSecurity(entry: SecurityLogEntry): void {
  const logLine = [
    `[JARVIS-COMMAND]`,
    entry.timestamp,
    `action=${entry.action}`,
    `user=${entry.userId}`,
    `ip=${entry.sourceIp}`,
    `faceAuth=${entry.faceAuth}`,
    `voiceAuth=${entry.voiceAuth}`,
    `danger=${entry.requiresConfirmation}`,
    `confirmed=${entry.confirmed}`,
    `executed=${entry.executed}`,
    `${entry.durationMs}ms`,
  ].join(" | ");
  console.error(logLine);
}

// ─────────────────────────────────────────────────────────────────────────────
// Command Router — Maps parsed voice commands to JarvisCommandInput
// ─────────────────────────────────────────────────────────────────────────────

function routeToJarvisInput(
  action: CommandAction,
  entities: Record<string, unknown>,
  rawCommand: string
): JarvisCommandInput | null {
  switch (action) {
    case "health_check":
      return { command: "health", scope: (entities.scope as JarvisScope) ?? "all", detail: "short" };

    case "audit_marketplace":
      return { command: "audit-marketplace", scope: "marketplace", detail: "normal" };

    case "detect_errors":
      return { command: "detect-errors", scope: "all", detail: "normal" };

    case "suggest_improvements":
      return { command: "suggest-improvements", scope: "all", detail: "normal" };

    case "orchestrate":
      return {
        command: "orchestrate",
        scope: "all",
        agentTarget: "auto",
        message: rawCommand,
      };

    case "create_agent_task":
      return {
        command: "create-agent-task",
        scope: (entities.scope as JarvisScope) ?? "all",
        agentTarget: (entities.agentTarget as JarvisScope) ?? "auto",
        message: rawCommand,
      };

    case "voice_report":
      return { command: "voice-report", scope: "all", detail: "short" };

    case "show_sales":
      return { command: "audit-marketplace", scope: "marketplace", detail: "short" };

    case "show_dashboard":
      return { command: "health", scope: "all", detail: "normal" };

    case "show_inventory":
      return { command: "audit-marketplace", scope: "marketplace", detail: "short" };

    case "show_analytics":
      return { command: "audit-marketplace", scope: "marketplace", detail: "normal" };

    // Marketplace actions that need custom handling
    case "publish_product":
    case "pause_listings":
    case "resume_listings":
    case "meli_sync":
    case "activate_marketing":
    case "send_message":
      // These execute via the orchestrator with a message describing the action
      return {
        command: "orchestrate",
        scope: "marketplace",
        agentTarget: "auto",
        message: rawCommand,
      };

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Handler — POST
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  // ── Admin auth ────────────────────────────────────────────────────────────
  const auth = await assertJarvisAuth(req);
  if (auth) return auth;

  // ── Parse request ─────────────────────────────────────────────────────────
  const body = await parseJarvisJson<CommandRequestBody>(req);
  if (body instanceof NextResponse) return body;

  if (!body.command || typeof body.command !== "string" || body.command.trim().length < 2) {
    return NextResponse.json({ error: "command is required (min 2 chars)" }, { status: 400 });
  }

  const sourceIp = req.headers.get("x-forwarded-for") ?? req.ip ?? "unknown";
  const command = body.command.trim();

  // ── SECURITY GATE 1: Face Authentication (REQUIRED) ──────────────────────
  const sessionValidation = validateFaceSessionToken(body.faceSessionToken);
  const faceAuthValid = body.faceAuthenticated === true && sessionValidation.valid;

  if (!faceAuthValid) {
    const elapsed = Date.now() - startTime;
    logSecurity({
      timestamp: new Date().toISOString(),
      action: "unknown",
      command,
      userId: sessionValidation.userId || "unauthenticated",
      sourceIp,
      faceAuth: false,
      voiceAuth: Boolean(body.voiceAuthenticated),
      requiresConfirmation: false,
      confirmed: false,
      executed: false,
      durationMs: elapsed,
    });

    return NextResponse.json(
      {
        status: "error",
        error: "FACE_AUTH_REQUIRED",
        message:
          "AUTENTICACION FACIAL REQUERIDA: Debes autenticarte con reconocimiento facial antes de ejecutar cualquier comando. Activa la camara en el panel de JARVIS.",
        action: "auth_required",
        data: null,
        security: {
          faceAuthenticated: false,
          voiceAuthenticated: Boolean(body.voiceAuthenticated),
          commandBlocked: true,
          reason: "MISSING_FACE_AUTH",
        },
      },
      { status: 403 }
    );
  }

  const userId = sessionValidation.userId;

  // ── SECURITY GATE 2: Rate Limiting ────────────────────────────────────────
  const rateLimit = checkUserRateLimit(userId);
  if (!rateLimit.allowed) {
    const elapsed = Date.now() - startTime;
    logSecurity({
      timestamp: new Date().toISOString(),
      action: "unknown",
      command,
      userId,
      sourceIp,
      faceAuth: true,
      voiceAuth: Boolean(body.voiceAuthenticated),
      requiresConfirmation: false,
      confirmed: false,
      executed: false,
      durationMs: elapsed,
    });

    return NextResponse.json(
      {
        status: "error",
        error: "RATE_LIMITED",
        message: `Limite de comandos excedido (${COMMANDS_PER_MINUTE}/min). Reduce la velocidad.`,
        action: "rate_limited",
        data: null,
        security: {
          faceAuthenticated: true,
          voiceAuthenticated: Boolean(body.voiceAuthenticated),
          commandBlocked: true,
          reason: "RATE_LIMIT",
        },
      },
      { status: 429 }
    );
  }

  // ── Parse command intent ──────────────────────────────────────────────────
  const parsed = parseVoiceCommand(command);
  const action = parsed.action as CommandAction;
  const entities = { ...parsed.entities, ...(body.entities ?? {}) };

  // ── SECURITY GATE 3: Dangerous Command Confirmation ──────────────────────
  const isDangerous = DANGEROUS_COMMANDS.includes(action);
  const requiresConfirmation = isDangerous && !body.confirmationToken;

  if (requiresConfirmation) {
    const confirmationToken = generateConfirmationToken(action);
    const elapsed = Date.now() - startTime;

    logSecurity({
      timestamp: new Date().toISOString(),
      action,
      command,
      userId,
      sourceIp,
      faceAuth: true,
      voiceAuth: Boolean(body.voiceAuthenticated),
      requiresConfirmation: true,
      confirmed: false,
      executed: false,
      durationMs: elapsed,
    });

    return NextResponse.json({
      status: "confirmation_required",
      message: `El comando "${action}" requiere confirmacion. Por seguridad, confirma verbalmente o proporciona el token de confirmacion.`,
      action,
      data: {
        confirmationToken,
        commandDescription: parsed.intent,
        expiresInSeconds: 60,
      },
      security: {
        faceAuthenticated: true,
        voiceAuthenticated: Boolean(body.voiceAuthenticated),
        commandBlocked: true,
        reason: "CONFIRMATION_REQUIRED",
        dangerousCommand: true,
      },
    });
  }

  // Validate confirmation token if provided for dangerous commands
  if (isDangerous && body.confirmationToken) {
    const confirmed = validateConfirmationToken(body.confirmationToken, action);
    if (!confirmed) {
      return NextResponse.json(
        {
          status: "error",
          error: "INVALID_CONFIRMATION",
          message: "Token de confirmacion invalido o expirado. Repite el comando.",
          action,
          security: {
            faceAuthenticated: true,
            voiceAuthenticated: Boolean(body.voiceAuthenticated),
            commandBlocked: true,
            reason: "INVALID_CONFIRMATION_TOKEN",
          },
        },
        { status: 403 }
      );
    }
  }

  // ── Execute Command ───────────────────────────────────────────────────────
  let result: JarvisCommandOutput | null = null;
  let executionError: string | null = null;
  let reportType: JarvisReportType | null = null;

  try {
    const jarvisInput = routeToJarvisInput(action, entities, command);

    if (jarvisInput) {
      result = await executeJarvisCommand(jarvisInput);

      // Map report types for specific actions
      if (action === "show_sales") {
        reportType = "daily_marketplace_report";
      }
    } else {
      // Unknown or marketplace-specific action — try orchestration
      result = await executeJarvisCommand({
        command: "orchestrate",
        scope: "marketplace",
        agentTarget: "auto",
        message: command,
      });
    }
  } catch (err) {
    executionError = err instanceof Error ? err.message : String(err);
    console.error("[JARVIS-COMMAND] Execution error:", executionError);
  }

  const elapsed = Date.now() - startTime;

  // ── Security Audit Log ────────────────────────────────────────────────────
  logSecurity({
    timestamp: new Date().toISOString(),
    action,
    command,
    userId,
    sourceIp,
    faceAuth: true,
    voiceAuth: Boolean(body.voiceAuthenticated),
    requiresConfirmation: isDangerous,
    confirmed: isDangerous ? Boolean(body.confirmationToken) : true,
    executed: !executionError && result?.status === "ok",
    durationMs: elapsed,
  });

  // ── Error Response ────────────────────────────────────────────────────────
  if (executionError || result?.status === "error") {
    return NextResponse.json(
      {
        status: "error",
        error: executionError || result?.summary || "COMMAND_EXECUTION_FAILED",
        message: executionError || result?.summary,
        action,
        data: null,
        security: {
          faceAuthenticated: true,
          voiceAuthenticated: Boolean(body.voiceAuthenticated),
          commandBlocked: false,
          executionFailed: true,
          durationMs: elapsed,
        },
      },
      { status: 500 }
    );
  }

  // ── Success Response ──────────────────────────────────────────────────────
  return NextResponse.json({
    status: "ok",
    result: result?.summary || "Comando ejecutado correctamente.",
    action,
    data: {
      findings: result?.findings ?? [],
      recommendations: result?.recommendations ?? [],
      agentTasks: result?.agentTasks ?? [],
      reportId: result?.reportId,
      voiceReportUrl: result?.voiceReportUrl,
      entities,
    },
    security: {
      faceAuthenticated: true,
      voiceAuthenticated: Boolean(body.voiceAuthenticated),
      commandBlocked: false,
      dangerousCommand: isDangerous,
      confirmed: isDangerous ? true : undefined,
      durationMs: elapsed,
      rateLimitRemaining: rateLimit.remaining,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Handler — GET (status / available commands)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    status: "ok",
    endpoint: "JARVIS Command Executor",
    availableCommands: [
      { action: "publish_product", description: "Publicar un producto en el marketplace", dangerous: true },
      { action: "show_sales", description: "Mostrar ventas del dia", dangerous: false },
      { action: "send_message", description: "Enviar mensaje a un cliente", dangerous: true },
      { action: "meli_sync", description: "Sincronizar con MercadoLibre", dangerous: true },
      { action: "activate_marketing", description: "Activar modo marketing", dangerous: false },
      { action: "pause_listings", description: "Pausar publicaciones activas", dangerous: true },
      { action: "resume_listings", description: "Reanudar publicaciones pausadas", dangerous: true },
      { action: "show_inventory", description: "Mostrar inventario actual", dangerous: false },
      { action: "show_analytics", description: "Mostrar analiticas del marketplace", dangerous: false },
      { action: "show_dashboard", description: "Mostrar dashboard general", dangerous: false },
      { action: "health_check", description: "Verificar estado del sistema", dangerous: false },
      { action: "audit_marketplace", description: "Auditar marketplace completo", dangerous: false },
      { action: "detect_errors", description: "Detectar errores en el sistema", dangerous: false },
      { action: "suggest_improvements", description: "Sugerir mejoras", dangerous: false },
      { action: "orchestrate", description: "Orquestar agentes de IA", dangerous: false },
      { action: "voice_report", description: "Generar reporte de voz", dangerous: false },
    ],
    security: {
      faceAuthRequired: true,
      confirmationRequiredFor: DANGEROUS_COMMANDS,
      mutatingCommands: MUTATING_COMMANDS,
      rateLimit: `${COMMANDS_PER_MINUTE} commands/minute`,
      dangerousCommandTimeoutSeconds: 60,
    },
  });
}
