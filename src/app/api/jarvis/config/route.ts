/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║              JARVIS CONFIG API — /api/jarvis/config                         ║
 * ║                                                                              ║
 * ║  Endpoint para leer y escribir la configuracion del sistema JARVIS.        ║
 * ║  Almacena y gestiona pares key-value en la tabla jarvis_config.            ║
 * ║                                                                              ║
 * ║  Endpoints:                                                                  ║
 * ║  - GET  /api/jarvis/config              — lista toda la configuracion       ║
 * ║  - GET  /api/jarvis/config?key=XXX      — obtiene una key especifica        ║
 * ║  - GET  /api/jarvis/config?category=XXX — filtra por categoria              ║
 * ║  - POST /api/jarvis/config              — crea o actualiza config           ║
 * ║  - DELETE /api/jarvis/config?key=XXX    — elimina una key                   ║
 * ║                                                                              ║
 * ║  Seguridad:                                                                  ║
 * ║  - GET  requiere autenticacion de admin                                     ║
 * ║  - POST requiere admin + puede requerir token de aprobacion                 ║
 * ║  - DELETE requiere admin + token de aprobacion                              ║
 * ║  - Rate limiting integrado                                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase/service";
import {
  getJarvisConfig,
  getAllJarvisConfig,
  setJarvisConfig,
  deleteJarvisConfig,
  getJarvisConfigByCategory,
  getJarvisConfigMeta,
  isJarvisEnabled,
} from "@/lib/jarvis/init-jarvis";
import { tryAdminRequest, requireAdminRequest } from "@/lib/admin-api";
import { logSecurityEvent } from "@/lib/jarvis/governance/auditor";

// ───────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ───────────────────────────────────────────────────────────────────────────────

const TABLE_CONFIG = "jarvis_config";

/** Ventana de rate limiting en ms */
const RATE_LIMIT_WINDOW_MS = 60_000;

/** Maximo de requests por ventana */
const RATE_LIMIT_MAX = 30;

/** Keys protegidas que requieren token de aprobacion para modificar */
const PROTECTED_KEYS = [
  "JARVIS_ENABLED",
  "JARVIS_VERSION",
  "JARVIS_APPROVAL_TOKEN",
  "AUTONOMOUS_ENABLED",
];

// ───────────────────────────────────────────────────────────────────────────────
// RATE LIMITING (IN-MEMORY)
// ───────────────────────────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, number[]>();

function cleanupRateLimitMap(): void {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const filtered = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
    if (filtered.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, filtered);
    }
  }
}

if (typeof globalThis !== "undefined") {
  setInterval(cleanupRateLimitMap, 5 * 60 * 1000);
}

/**
 * Verifica rate limit para una IP.
 */
function checkRateLimit(ip: string, maxRequests: number = RATE_LIMIT_MAX): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const withinWindow = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (withinWindow.length >= maxRequests) {
    rateLimitMap.set(ip, withinWindow);
    return false;
  }

  withinWindow.push(now);
  rateLimitMap.set(ip, withinWindow);
  return true;
}

// ───────────────────────────────────────────────────────────────────────────────
// UTILIDADES
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Extrae la IP real del cliente.
 */
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Verifica si una key es protegida (requiere token de aprobacion).
 */
function isProtectedKey(key: string): boolean {
  return PROTECTED_KEYS.includes(key);
}

/**
 * Verifica el token de aprobacion para operaciones en keys protegidas.
 */
async function verifyApprovalToken(req: NextRequest): Promise<boolean> {
  const provided = req.headers.get("x-approval-token")?.trim() ?? "";
  if (!provided) return false;

  const storedToken = await getJarvisConfig("JARVIS_APPROVAL_TOKEN");
  if (!storedToken) return false;

  return provided === storedToken;
}

/**
 * Obtiene el actor (email o identificador) del request.
 */
async function getActor(req: NextRequest): Promise<string> {
  const adminCtx = await tryAdminRequest(req);
  if (adminCtx) {
    return adminCtx.adminUser.email ?? adminCtx.adminUser.user_id ?? "unknown";
  }
  return `ip:${getClientIp(req)}`;
}

/**
 * Verifica si JARVIS esta habilitado.
 */
async function checkJarvisEnabled(): Promise<boolean> {
  try {
    return await isJarvisEnabled();
  } catch {
    return true; // Si no podemos verificar, asumimos habilitado
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// VALIDACION
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Valida una key de configuracion.
 */
function validateKey(key: unknown): { valid: boolean; error?: string } {
  if (typeof key !== "string") {
    return { valid: false, error: "La key debe ser un string" };
  }
  if (key.length === 0 || key.length > 100) {
    return { valid: false, error: "La key debe tener entre 1 y 100 caracteres" };
  }
  if (!/^[A-Z0-9_]+$/.test(key)) {
    return {
      valid: false,
      error: "La key debe contener solo mayusculas, numeros y guiones bajos (A-Z, 0-9, _)",
    };
  }
  return { valid: true };
}

/**
 * Valida un valor de configuracion.
 */
function validateValue(value: unknown): { valid: boolean; error?: string } {
  if (typeof value !== "string") {
    return { valid: false, error: "El valor debe ser un string" };
  }
  if (value.length > 10000) {
    return { valid: false, error: "El valor excede el maximo de 10000 caracteres" };
  }
  return { valid: true };
}

/**
 * Valida una categoria.
 */
function validateCategory(category: unknown): { valid: boolean; error?: string } {
  if (typeof category !== "string") {
    return { valid: false, error: "La categoria debe ser un string" };
  }
  if (category.length === 0 || category.length > 50) {
    return { valid: false, error: "La categoria debe tener entre 1 y 50 caracteres" };
  }
  return { valid: true };
}

// ───────────────────────────────────────────────────────────────────────────────
// GET — Obtener configuracion
// ───────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/jarvis/config
 *
 * Obtiene la configuracion de JARVIS.
 *
 * Query params:
 * - `key` — Devuelve solo esa key especifica
 * - `category` — Filtra por categoria (general, llm, security, etc.)
 * - `meta` — Si es "true", incluye metadata completa (solo con key)
 *
 * @param req - Request de Next.js
 * @returns JSON con la configuracion solicitada
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const ip = getClientIp(req);

  // Rate limiting
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  // Verificar autenticacion de admin
  const adminCtx = await tryAdminRequest(req);
  if (!adminCtx) {
    return NextResponse.json(
      { error: "No autorizado — se requiere sesion de administrador" },
      { status: 401 }
    );
  }

  // Parsear query params
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key")?.trim();
  const category = searchParams.get("category")?.trim();
  const includeMeta = searchParams.get("meta")?.toLowerCase() === "true";

  try {
    // Caso 1: Obtener una key especifica con metadata completa
    if (key && includeMeta) {
      const meta = await getJarvisConfigMeta(key);
      if (!meta) {
        return NextResponse.json(
          { error: `Configuracion '${key}' no encontrada` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        key: meta.key,
        value: meta.value,
        category: meta.category,
        description: meta.description,
        is_encrypted: meta.is_encrypted,
        created_at: meta.created_at,
        updated_at: meta.updated_at,
        _meta: {
          requestMs: Date.now() - startTime,
        },
      });
    }

    // Caso 2: Obtener una key especifica (solo valor)
    if (key) {
      const validation = validateKey(key);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const value = await getJarvisConfig(key);
      if (value === null) {
        return NextResponse.json(
          { error: `Configuracion '${key}' no encontrada` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        key,
        value,
        _meta: { requestMs: Date.now() - startTime },
      });
    }

    // Caso 3: Filtrar por categoria
    if (category) {
      const catValidation = validateCategory(category);
      if (!catValidation.valid) {
        return NextResponse.json({ error: catValidation.error }, { status: 400 });
      }

      const configs = await getJarvisConfigByCategory(category);
      return NextResponse.json({
        category,
        count: configs.length,
        configs,
        _meta: { requestMs: Date.now() - startTime },
      });
    }

    // Caso 4: Obtener toda la configuracion
    const allConfig = await getAllJarvisConfig();
    const client = getSupabaseService();

    // Obtener categorias disponibles
    const { data: categories } = await client
      .from(TABLE_CONFIG)
      .select("category")
      .order("category");

    const uniqueCategories = [...new Set(categories?.map((c) => c.category) ?? [])];

    // Estadisticas
    const totalKeys = Object.keys(allConfig).length;
    const encryptedKeys = await client
      .from(TABLE_CONFIG)
      .select("key")
      .eq("is_encrypted", true);

    return NextResponse.json({
      count: totalKeys,
      categories: uniqueCategories,
      encrypted: encryptedKeys.data?.length ?? 0,
      config: allConfig,
      _meta: {
        requestMs: Date.now() - startTime,
        jarvisEnabled: await checkJarvisEnabled(),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    await logSecurityEvent({
      level: "WARNING",
      rule: "JARVIS_CONFIG_API",
      action: "GET_FAILED",
      description: `Error al obtener configuracion: ${msg}`,
      userId: adminCtx.adminUser.email ?? undefined,
      ipAddress: ip,
    });

    return NextResponse.json(
      { error: `Error al obtener configuracion: ${msg}` },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// POST — Crear o actualizar configuracion
// ───────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/jarvis/config
 *
 * Crea o actualiza una configuracion de JARVIS.
 *
 * Body JSON:
 * ```json
 * {
 *   "key": "MI_CONFIG",
 *   "value": "mi valor",
 *   "category": "general",        // opcional
 *   "description": "Descripcion", // opcional
 *   "is_encrypted": false         // opcional
 * }
 * ```
 *
 * Para keys protegidas, incluir header: `x-approval-token: <token>`
 *
 * @param req - Request de Next.js
 * @returns JSON con el resultado de la operacion
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const ip = getClientIp(req);

  // Rate limiting (mas estricto para writes)
  if (!checkRateLimit(ip, RATE_LIMIT_MAX / 2)) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  // Verificar admin
  const adminCtx = await requireAdminRequest(req);
  if (adminCtx instanceof NextResponse) {
    return NextResponse.json(
      { error: "No autorizado — se requiere sesion de administrador" },
      { status: 401 }
    );
  }

  // Parsear body
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body JSON invalido" }, { status: 400 });
  }

  const { key, value, category, description, is_encrypted } = body;

  // Validaciones
  const keyValidation = validateKey(key);
  if (!keyValidation.valid) {
    return NextResponse.json({ error: keyValidation.error }, { status: 400 });
  }

  const valueValidation = validateValue(value);
  if (!valueValidation.valid) {
    return NextResponse.json({ error: valueValidation.error }, { status: 400 });
  }

  // Verificar key protegida
  if (isProtectedKey(key as string)) {
    const approved = await verifyApprovalToken(req);
    if (!approved) {
      await logSecurityEvent({
        level: "WARNING",
        rule: "JARVIS_CONFIG_API",
        action: "PROTECTED_KEY_DENIED",
        description: `Intento de modificar key protegida '${key}' sin token de aprobacion`,
        userId: adminCtx.adminUser.email ?? undefined,
        ipAddress: ip,
      });

      return NextResponse.json(
        {
          error: `La key '${key}' esta protegida`,
          hint: "Incluye el header 'x-approval-token' con el token de aprobacion",
        },
        { status: 403 }
      );
    }
  }

  try {
    const client = getSupabaseService();
    const existing = await client
      .from(TABLE_CONFIG)
      .select("id")
      .eq("key", key as string)
      .maybeSingle();

    const isUpdate = existing.data !== null;

    if (isUpdate) {
      // UPDATE — solo actualizamos los campos proporcionados
      const updateData: Record<string, unknown> = {
        value,
        updated_at: new Date().toISOString(),
      };
      if (category !== undefined) updateData.category = category;
      if (description !== undefined) updateData.description = description;
      if (is_encrypted !== undefined) updateData.is_encrypted = is_encrypted;

      const { error } = await client
        .from(TABLE_CONFIG)
        .update(updateData)
        .eq("key", key as string);

      if (error) {
        throw new Error(`Error actualizando: ${error.message}`);
      }
    } else {
      // INSERT — creamos nuevo registro
      const insertData: Record<string, unknown> = {
        key,
        value,
        category: category ?? "general",
        description: description ?? `Creado via API el ${new Date().toISOString()}`,
        is_encrypted: is_encrypted ?? false,
      };

      const { error } = await client.from(TABLE_CONFIG).insert(insertData);

      if (error) {
        throw new Error(`Error creando: ${error.message}`);
      }
    }

    // Log de auditoria
    await logSecurityEvent({
      level: "INFO",
      rule: "JARVIS_CONFIG_API",
      action: isUpdate ? "CONFIG_UPDATED" : "CONFIG_CREATED",
      description: `Config '${key}' ${isUpdate ? "actualizada" : "creada"} por ${adminCtx.adminUser.email ?? "admin"}`,
      userId: adminCtx.adminUser.email ?? undefined,
      ipAddress: ip,
      metadata: { key, category, isUpdate },
    });

    return NextResponse.json({
      success: true,
      key,
      action: isUpdate ? "updated" : "created",
      value: value as string,
      _meta: { requestMs: Date.now() - startTime },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    await logSecurityEvent({
      level: "WARNING",
      rule: "JARVIS_CONFIG_API",
      action: "POST_FAILED",
      description: `Error al guardar config '${key}': ${msg}`,
      userId: adminCtx.adminUser.email ?? undefined,
      ipAddress: ip,
    });

    return NextResponse.json(
      { error: `Error al guardar configuracion: ${msg}` },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// DELETE — Eliminar configuracion
// ───────────────────────────────────────────────────────────────────────────────

/**
 * DELETE /api/jarvis/config?key=XXX
 *
 * Elimina una configuracion de JARVIS.
 * Las keys protegidas requieren token de aprobacion.
 *
 * @param req - Request de Next.js
 * @returns JSON con el resultado de la operacion
 */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const ip = getClientIp(req);

  // Rate limiting (mas estricto para deletes)
  if (!checkRateLimit(ip, RATE_LIMIT_MAX / 3)) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  // Verificar admin
  const adminCtx = await requireAdminRequest(req);
  if (adminCtx instanceof NextResponse) {
    return NextResponse.json(
      { error: "No autorizado — se requiere sesion de administrador" },
      { status: 401 }
    );
  }

  // Obtener key de query params
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key")?.trim();

  if (!key) {
    return NextResponse.json(
      { error: "Parametro 'key' requerido" },
      { status: 400 }
    );
  }

  const keyValidation = validateKey(key);
  if (!keyValidation.valid) {
    return NextResponse.json({ error: keyValidation.error }, { status: 400 });
  }

  // No permitir eliminar keys protegidas
  if (isProtectedKey(key)) {
    return NextResponse.json(
      {
        error: `La key '${key}' esta protegida y no puede ser eliminada`,
      },
      { status: 403 }
    );
  }

  try {
    // Verificar que existe
    const existing = await getJarvisConfig(key);
    if (existing === null) {
      return NextResponse.json(
        { error: `Configuracion '${key}' no encontrada` },
        { status: 404 }
      );
    }

    // Eliminar
    await deleteJarvisConfig(key);

    // Log de auditoria
    await logSecurityEvent({
      level: "INFO",
      rule: "JARVIS_CONFIG_API",
      action: "CONFIG_DELETED",
      description: `Config '${key}' eliminada por ${adminCtx.adminUser.email ?? "admin"}`,
      userId: adminCtx.adminUser.email ?? undefined,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      key,
      action: "deleted",
      previousValue: existing,
      _meta: { requestMs: Date.now() - startTime },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    await logSecurityEvent({
      level: "WARNING",
      rule: "JARVIS_CONFIG_API",
      action: "DELETE_FAILED",
      description: `Error al eliminar config '${key}': ${msg}`,
      userId: adminCtx.adminUser.email ?? undefined,
      ipAddress: ip,
    });

    return NextResponse.json(
      { error: `Error al eliminar configuracion: ${msg}` },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// PATCH — Actualizacion parcial
// ───────────────────────────────────────────────────────────────────────────────

/**
 * PATCH /api/jarvis/config
 *
 * Actualizacion parcial de una configuracion existente.
 * Solo actualiza los campos proporcionados.
 *
 * Body JSON:
 * ```json
 * {
 *   "key": "MI_CONFIG",
 *   "value": "nuevo valor",       // opcional
 *   "category": "otra",           // opcional
 *   "description": "Nueva desc"   // opcional
 * }
 * ```
 *
 * @param req - Request de Next.js
 * @returns JSON con el resultado de la operacion
 */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const ip = getClientIp(req);

  // Rate limiting
  if (!checkRateLimit(ip, RATE_LIMIT_MAX / 2)) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  // Verificar admin
  const adminCtx = await requireAdminRequest(req);
  if (adminCtx instanceof NextResponse) {
    return NextResponse.json(
      { error: "No autorizado — se requiere sesion de administrador" },
      { status: 401 }
    );
  }

  // Parsear body
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body JSON invalido" }, { status: 400 });
  }

  const { key, value, category, description } = body;

  const keyValidation = validateKey(key);
  if (!keyValidation.valid) {
    return NextResponse.json({ error: keyValidation.error }, { status: 400 });
  }

  // Verificar key protegida
  if (isProtectedKey(key as string)) {
    const approved = await verifyApprovalToken(req);
    if (!approved) {
      return NextResponse.json(
        {
          error: `La key '${key}' esta protegida`,
          hint: "Incluye el header 'x-approval-token'",
        },
        { status: 403 }
      );
    }
  }

  try {
    // Verificar que existe
    const client = getSupabaseService();
    const { data: existing } = await client
      .from(TABLE_CONFIG)
      .select("key, value, category, description")
      .eq("key", key as string)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json(
        { error: `Configuracion '${key}' no encontrada` },
        { status: 404 }
      );
    }

    // Solo actualizamos los campos proporcionados
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (value !== undefined) {
      const valValidation = validateValue(value);
      if (!valValidation.valid) {
        return NextResponse.json({ error: valValidation.error }, { status: 400 });
      }
      updateData.value = value;
    }
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;

    const { error } = await client
      .from(TABLE_CONFIG)
      .update(updateData)
      .eq("key", key as string);

    if (error) {
      throw new Error(`Error actualizando: ${error.message}`);
    }

    // Log de auditoria
    await logSecurityEvent({
      level: "INFO",
      rule: "JARVIS_CONFIG_API",
      action: "CONFIG_PATCHED",
      description: `Config '${key}' actualizada parcialmente por ${adminCtx.adminUser.email ?? "admin"}`,
      userId: adminCtx.adminUser.email ?? undefined,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      key,
      action: "patched",
      previous: existing,
      changes: Object.keys(updateData).filter((k) => k !== "updated_at"),
      _meta: { requestMs: Date.now() - startTime },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Error al actualizar configuracion: ${msg}` },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// OPTIONS
// ───────────────────────────────────────────────────────────────────────────────

/**
 * OPTIONS /api/jarvis/config
 *
 * Para CORS preflight requests.
 */
export async function OPTIONS(): Promise<NextResponse> {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Allow", "GET, POST, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, x-approval-token"
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}
