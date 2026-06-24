/**
 * POST /api/auth/claim-account
 *
 * Seteo de password para un guest user existente (sin password).
 * Si el email existe y no tiene password → setea password + activa trial 6 meses.
 * Si el email existe y tiene password → 409 (ya está claim-eado, debe loguearse).
 * Si no existe → crea el user normal.
 *
 * Resultado: las orders pasadas con buyer.email = email quedan
 * automáticamente vinculadas a este user (porque buyerId == user.id desde
 * el upsert que hace /api/checkout/mp).
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIpFromRequest } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { TRIAL_MS } from "@/lib/subscription/effective-tier";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);
  const { allowed, retryAfter } = rateLimit(`claim-account:${ip}`, 5, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
      name?: string;
    };
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const name = (body.name ?? "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true, name: true },
    });

    if (existing?.password) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email. Iniciá sesión." },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    let userId: string;
    if (existing) {
      // Guest user existente (sin password) → claim
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          password: hashed,
          ...(name && !existing.name ? { name } : {}),
        },
      });
      userId = existing.id;
      logger.info("claim-account: guest user claim-eado", { email, userId });
    } else {
      // Usuario completamente nuevo
      const created = await prisma.user.create({
        data: {
          email,
          password: hashed,
          name: name || email.split("@")[0],
          isSeller: false,
          role: "USER",
        },
      });
      userId = created.id;
    }

    // Activar trial 6 meses si nunca tuvo (one-shot)
    const trialEnd = new Date(Date.now() + TRIAL_MS);
    try {
      await prisma.$executeRaw`
        UPDATE users SET trial_ends_at = ${trialEnd}
        WHERE id = ${userId} AND trial_ends_at IS NULL
      `;
    } catch (e) {
      logger.warn("claim-account: trial activation failed (non-fatal)", e);
    }

    return NextResponse.json({ ok: true, userId });
  } catch (e) {
    logger.error("claim-account error:", e);
    return NextResponse.json({ error: "Error al crear cuenta" }, { status: 500 });
  }
}
