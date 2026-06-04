/**
 * POST /api/auth/reset-password
 *
 * Verifica token + actualiza password en DB.
 * Rate limit: 5 intentos por IP por 15 min.
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { verifyResetToken } from "@/lib/auth/password-reset-token";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfter } = rateLimit(`reset-pw:${ip}`, 5, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      token?: string;
      password?: string;
    };
    const token = body.token ?? "";
    const password = body.password ?? "";

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 },
      );
    }

    const verify = verifyResetToken(token);
    if (!verify.ok) {
      const map: Record<string, string> = {
        malformed: "El link es inválido.",
        bad_signature: "El link fue manipulado o es inválido.",
        expired: "El link caducó. Pedí uno nuevo desde 'Olvidé mi contraseña'.",
      };
      return NextResponse.json({ error: map[verify.reason] }, { status: 400 });
    }

    const email = verify.payload.e;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "No encontramos esa cuenta." }, { status: 404 });
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    logger.info("reset-pw: password actualizado", { email });
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error("reset-pw error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
