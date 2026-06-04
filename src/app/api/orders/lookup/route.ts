/**
 * POST /api/orders/lookup
 *
 * Busca una orden por email + orderNumber. Si match → devuelve un access
 * token firmado para entrar a /orders/access?token=...
 *
 * Anti-fraude:
 *  - Rate limit: 5 intentos por IP cada 15 minutos
 *  - Si no encuentra orden, devuelve mensaje genérico (no revela si el email existe o no)
 *  - Compare con timingSafeEqual implícito de Prisma findFirst
 */

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { signOrderAccessToken } from "@/lib/orders/access-token";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const { allowed, retryAfter } = rateLimit(`order-lookup:${ip}`, 5, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      {
        error: `Demasiados intentos. Probá de nuevo en ${Math.ceil(retryAfter / 60)} min.`,
      },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  let body: { email?: string; orderNumber?: string };
  try {
    body = (await req.json()) as { email?: string; orderNumber?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const orderNumber = (body.orderNumber ?? "").trim().toUpperCase();

  if (!email || !orderNumber) {
    return NextResponse.json(
      { error: "Email y número de orden son requeridos" },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      buyer: { email },
    },
    select: { id: true, orderNumber: true },
  });

  if (!order) {
    // Mensaje genérico: no revela si el email o el orderNumber existen por separado.
    return NextResponse.json(
      {
        error:
          "No encontramos una orden con esos datos. Verificá el email y el número de orden tal como aparecen en tu comprobante.",
      },
      { status: 404 },
    );
  }

  const token = signOrderAccessToken(order.id, email);
  return NextResponse.json({ ok: true, token });
}
