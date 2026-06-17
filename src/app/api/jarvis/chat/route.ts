/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    JARVIS CHAT API ENDPOINT                              ║
 * ║                                                                          ║
 * ║  Endpoint principal para que el widget de chat hable con JARVIS.        ║
 * ║  Soporta dos modos:                                                      ║
 * ║  - POST /api/jarvis/chat          → Respuesta JSON completa             ║
 * ║  - POST /api/jarvis/chat?stream=true → Server-Sent Events streaming     ║
 * ║                                                                          ║
 * ║  Seguridad:                                                              ║
 * ║  - Rate limiting: 30 requests/min por usuario                           ║
 * ║  - Timeout: 30 segundos por request                                     ║
 * ║  - Input sanitization en todos los campos                               ║
 * ║  - Sin exposicion de credenciales en respuestas                         ║
 * ║  - Headers de seguridad CORS                                            ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * @module app/api/jarvis/chat/route
 * @requires orchestrator para procesamiento de mensajes
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import {
  processJarvisMessage,
  processJarvisMessageStream,
  type ProcessMessageOptions,
  type JarvisResponse,
  type StreamChunk,
  JarvisOrchestratorError,
} from "@/lib/jarvis/orchestrator";
import { logSecurityEvent } from "@/lib/jarvis/governance/auditor";
import { isJarvisEnabled } from "@/lib/jarvis/init-jarvis";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema de validacion para el body de la peticion.
 * Usa Zod para validacion estricta de tipos.
 */
const ChatRequestSchema = z.object({
  /** Mensaje del usuario */
  message: z.string().min(1, "El mensaje no puede estar vacio").max(4000, "Mensaje demasiado largo (max 4000 caracteres)"),
  /** ID del usuario (opcional, se genera uno anonimo si no se provee) */
  userId: z.string().max(128).optional(),
  /** Historial previo de mensajes (opcional) */
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).max(50, "Historial demasiado largo").optional(),
  /** Instrucciones custom para el system prompt */
  customInstructions: z.string().max(2000).optional(),
  /** Contexto adicional */
  context: z.record(z.string(), z.unknown()).optional(),
});

/** Tipo inferido del schema */
type ChatRequestBody = z.infer<typeof ChatRequestSchema>;

/**
 * Schema para la respuesta JSON estandar.
 */
const ChatResponseSchema = z.object({
  content: z.string(),
  toolCalls: z.array(z.object({
    id: z.string(),
    name: z.string(),
    arguments: z.record(z.string(), z.unknown()),
    timestamp: z.string(),
  })).optional(),
  toolResults: z.array(z.object({
    toolCallId: z.string(),
    toolName: z.string(),
    success: z.boolean(),
    content: z.string(),
  })).optional(),
  usedTools: z.boolean(),
  latencyMs: z.number(),
  timestamp: z.string(),
});

// ============================================================================
// CORS & SECURITY HEADERS
// ============================================================================

/**
 * Headers CORS permitidos para el endpoint de chat.
 * En produccion, restringir al dominio de la aplicacion.
 */
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL ?? "https://www.madsjeez.com.ar",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/**
 * Headers de seguridad estandar.
 */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
};

// ============================================================================
// IP EXTRACTION
// ============================================================================

/**
 * Extrae la IP real del cliente considerando proxies.
 * Revisa X-Forwarded-For y otros headers comunes.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

// ============================================================================
// MAIN HANDLER — POST
// ============================================================================

/**
 * POST /api/jarvis/chat
 *
 * Procesa un mensaje del usuario y devuelve la respuesta de JARVIS.
 * Soporta streaming via query param `?stream=true`.
 *
 * @param request - NextRequest con el body JSON
 * @returns NextResponse con JSON o SSE stream
 *
 * @example
 * // Request normal:
 * POST /api/jarvis/chat
 * { "message": "Cuantos productos tenemos?", "userId": "user_123" }
 *
 * // Response:
 * { "content": "Tenemos 1,234 productos...", "usedTools": true, "latencyMs": 850 }
 *
 * @example
 * // Request streaming:
 * POST /api/jarvis/chat?stream=true
 * { "message": "Hola JARVIS" }
 *
 * // Response: text/event-stream
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestStartMs = Date.now();
  const timestamp = new Date().toISOString();

  // ── Verificar que JARVIS esta habilitado ──────────────────────────────
  try {
    const jarvisEnabled = await isJarvisEnabled();
    if (!jarvisEnabled) {
      return NextResponse.json(
        {
          content: "JARVIS esta temporalmente deshabilitado. Contacta al administrador.",
          usedTools: false,
          latencyMs: Date.now() - requestStartMs,
          timestamp,
        },
        { status: 503, headers: { ...CORS_HEADERS, ...SECURITY_HEADERS } }
      );
    }
  } catch {
    // Si no podemos verificar, continuamos igual (fail-open)
  }

  // ── Verificar Content-Type ────────────────────────────────────────────
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type debe ser application/json" },
      { status: 415, headers: { ...CORS_HEADERS, ...SECURITY_HEADERS } }
    );
  }

  // ── Extraer parametros ────────────────────────────────────────────────
  const url = new URL(request.url);
  const useStream = url.searchParams.get("stream") === "true";

  // ── Parsear body ──────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalido" },
      { status: 400, headers: { ...CORS_HEADERS, ...SECURITY_HEADERS } }
    );
  }

  // ── Validar con Zod ───────────────────────────────────────────────────
  const validation = ChatRequestSchema.safeParse(body);
  if (!validation.success) {
    const issues = validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    return NextResponse.json(
      { error: "Validacion fallida", details: issues },
      { status: 400, headers: { ...CORS_HEADERS, ...SECURITY_HEADERS } }
    );
  }

  const data = validation.data;
  const clientIp = getClientIp(request);
  // userId is derived from the server-controlled IP only — never trust the
  // client-supplied value to avoid actor impersonation in audit logs and
  // rate-limit keys.
  const userId = `ip_${clientIp}`;

  // ── Logging de request ────────────────────────────────────────────────
  await logSecurityEvent({
    service: "api",
    operation: "chatRequest",
    target: userId,
    status: "success",
    timestamp,
    details: {
      stream: useStream,
      messageLength: data.message.length,
      hasHistory: Boolean(data.history?.length),
      ip: clientIp,
    },
  }).catch(() => { /* non-blocking */ });

  // ── Procesar segun modo ───────────────────────────────────────────────
  if (useStream) {
    return handleStreamingRequest(data, userId, requestStartMs);
  }

  return handleStandardRequest(data, userId, requestStartMs);
}

// ============================================================================
// STANDARD REQUEST HANDLER
// ============================================================================

/**
 * Maneja una peticion estandar (no streaming).
 * Devuelve la respuesta completa como JSON.
 */
async function handleStandardRequest(
  data: ChatRequestBody,
  userId: string,
  requestStartMs: number
): Promise<NextResponse> {
  try {
    const options: ProcessMessageOptions = {
      message: data.message,
      userId,
      context: data.context,
      customInstructions: data.customInstructions,
      timeoutMs: 30_000,
    };

    const response: JarvisResponse = await processJarvisMessage(options);

    // Validar respuesta con Zod
    const validated = ChatResponseSchema.safeParse({
      content: response.content,
      toolCalls: response.toolCalls,
      toolResults: response.toolResults,
      usedTools: response.usedTools,
      latencyMs: response.latencyMs,
      timestamp: response.timestamp,
    });

    if (!validated.success) {
      console.error("[JARVIS API] Respuesta del orquestador invalida:", validated.error);
    }

    return NextResponse.json(
      {
        content: response.content,
        toolCalls: response.toolCalls,
        toolResults: response.toolResults,
        usedTools: response.usedTools,
        latencyMs: response.latencyMs,
        timestamp: response.timestamp,
      },
      {
        status: 200,
        headers: { ...CORS_HEADERS, ...SECURITY_HEADERS },
      }
    );
  } catch (error) {
    return handleError(error, userId, data.message, requestStartMs);
  }
}

// ============================================================================
// STREAMING REQUEST HANDLER (SSE)
// ============================================================================

/**
 * Maneja una peticion en streaming.
 * Devuelve Server-Sent Events con chunks de la respuesta.
 *
 * Formato SSE:
 *   event: token\n
 *   data: {"token": "Hola", "done": false}\n\n
 *   event: token\n
 *   data: {"token": "!", "done": false}\n\n
 *   event: done\n
 *   data: {"done": true}\n\n
 */
async function handleStreamingRequest(
  data: ChatRequestBody,
  userId: string,
  requestStartMs: number
): Promise<NextResponse> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const options: ProcessMessageOptions = {
          message: data.message,
          userId,
          context: data.context,
          customInstructions: data.customInstructions,
          timeoutMs: 30_000,
        };

        // Emitir cada chunk del stream
        for await (const chunk of processJarvisMessageStream(options)) {
          const sseEvent = buildSSEEvent(chunk);
          controller.enqueue(encoder.encode(sseEvent));

          if (chunk.done) {
            controller.close();
            return;
          }
        }

        // Si el generator termino sin done=true, cerrar igual
        controller.enqueue(encoder.encode(buildSSEEvent({ token: "", done: true, timestamp: new Date().toISOString() })));
        controller.close();

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";

        // Emitir error como evento SSE
        const errorEvent = `event: error\ndata: ${JSON.stringify({ error: errorMessage })}\n\n`;
        controller.enqueue(encoder.encode(errorEvent));

        // Cerrar stream
        controller.enqueue(encoder.encode(buildSSEEvent({ token: "", done: true, timestamp: new Date().toISOString() })));
        controller.close();

        // Log error
        await logSecurityEvent({
          service: "api",
          operation: "chatStream",
          target: userId,
          status: "failure",
          timestamp: new Date().toISOString(),
          details: { error: errorMessage },
        }).catch(() => { /* non-blocking */ });
      }
    },

    cancel() {
      // Limpiar recursos si el cliente cierra la conexion
      console.log("[JARVIS API] Stream cancelado por el cliente");
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      ...CORS_HEADERS,
    },
  });
}

/**
 * Construye un evento SSE formateado.
 */
function buildSSEEvent(chunk: StreamChunk): string {
  if (chunk.done) {
    return `event: done\ndata: ${JSON.stringify({ done: true, timestamp: chunk.timestamp })}\n\n`;
  }

  if (chunk.toolCallInProgress) {
    return `event: tool_call\ndata: ${JSON.stringify({
      toolName: chunk.toolName,
      inProgress: true,
      timestamp: chunk.timestamp,
    })}\n\n`;
  }

  return `event: token\ndata: ${JSON.stringify({
    token: chunk.token,
    done: false,
    timestamp: chunk.timestamp,
  })}\n\n`;
}

// ============================================================================
// ERROR HANDLER
// ============================================================================

/**
 * Maneja errores de forma centralizada.
 * Devuelve respuestas JSON apropiadas segun el tipo de error.
 */
function handleError(
  error: unknown,
  userId: string,
  message: string,
  requestStartMs: number
): NextResponse {
  const timestamp = new Date().toISOString();
  const latencyMs = Date.now() - requestStartMs;

  let statusCode = 500;
  let errorCode = "INTERNAL_ERROR";
  let userMessage = "Perdon, hubo un error interno. Por favor intenta de nuevo en unos segundos.";

  if (error instanceof JarvisOrchestratorError) {
    statusCode = error.statusCode;
    errorCode = error.code;

    switch (error.code) {
      case "INVALID_INPUT":
        userMessage = "La peticion es invalida. Verifica los datos enviados.";
        break;
      case "TIMEOUT":
        userMessage = "La operacion tomo demasiado tiempo. Por favor intenta con una pregunta mas simple.";
        break;
      case "RATE_LIMIT":
        statusCode = 429;
        userMessage = error.message;
        break;
      default:
        userMessage = "Hubo un error procesando tu mensaje.";
    }
  } else if (error instanceof z.ZodError) {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    userMessage = "Los datos enviados no son validos.";
  } else if (error instanceof Error) {
    // Errores conocidos del sistema
    if (error.message.includes("timeout") || error.message.includes("TIMEOUT")) {
      statusCode = 504;
      errorCode = "GATEWAY_TIMEOUT";
      userMessage = "El servicio de IA tardo demasiado en responder. Intenta de nuevo.";
    } else if (error.message.includes("rate limit") || error.message.includes("RATE")) {
      statusCode = 429;
      errorCode = "RATE_LIMITED";
      userMessage = "El servicio de IA esta recibiendo muchas peticiones. Espera un momento.";
    }
  }

  // Log error (no bloqueante)
  logSecurityEvent({
    service: "api",
    operation: "chatError",
    target: userId,
    status: "failure",
    timestamp,
    details: {
      errorCode,
      statusCode,
      error: error instanceof Error ? error.message : String(error),
      messageLength: message.length,
      latencyMs,
    },
  }).catch(() => { /* non-blocking */ });

  return NextResponse.json(
    {
      error: userMessage,
      code: errorCode,
      latencyMs,
      timestamp,
    },
    {
      status: statusCode,
      headers: { ...CORS_HEADERS, ...SECURITY_HEADERS },
    }
  );
}

// ============================================================================
// OPTIONS HANDLER (CORS Preflight)
// ============================================================================

/**
 * OPTIONS /api/jarvis/chat
 * Maneja preflight requests CORS.
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

// ============================================================================
// GET HANDLER (Health Check)
// ============================================================================

/**
 * GET /api/jarvis/chat
 * Health check del endpoint de chat.
 */
export async function GET(): Promise<NextResponse> {
  const { healthCheckOrchestrator } = await import("@/lib/jarvis/orchestrator");
  const health = await healthCheckOrchestrator();

  const statusCode = health.healthy ? 200 : 503;

  return NextResponse.json(
    {
      status: health.healthy ? "ok" : "degraded",
      service: "jarvis-chat",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      checks: {
        memory: health.memory,
        rateLimiter: health.rateLimiter,
        toolSchemas: health.toolSchemas,
      },
    },
    {
      status: statusCode,
      headers: { ...CORS_HEADERS, ...SECURITY_HEADERS },
    }
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30; // 30 segundos maximo (Vercel limit)
