/**
 * Guard reutilizable para rutas de IA (Gemini). Evita el abuso de costo:
 * sin esto, cualquiera podía llamar a las rutas que consumen la quota paga de
 * Gemini de forma ilimitada (proxy LLM gratis + gasto descontrolado).
 *
 * - requireAuth: exige sesión (rutas de seller). Para rutas buyer-facing
 *   (recommendations) se deja false pero igual se aplica rate-limit por IP.
 * - rate-limit por usuario o IP.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";

type GuardOk = { ok: true; userId: string | null };
type GuardErr = { ok: false; response: NextResponse };

export async function guardAiRoute(
  req: { headers: Headers },
  opts: { requireAuth?: boolean; max?: number; windowMs?: number } = {},
): Promise<GuardOk | GuardErr> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  if (opts.requireAuth && !userId) {
    return { ok: false, response: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  const ip = clientIpFromRequest(req);
  const key = `ai:${userId ?? `ip:${ip}`}`;
  const rl = checkRateLimit(key, { max: opts.max ?? 15, windowMs: opts.windowMs ?? 60_000 });
  if (!rl.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Demasiadas solicitudes. Esperá un momento." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      ),
    };
  }

  return { ok: true, userId };
}
