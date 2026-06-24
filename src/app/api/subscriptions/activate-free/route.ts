/**
 * POST /api/subscriptions/activate-free
 *
 * Activa el plan BÁSICO (FREE) o la prueba gratuita de 6 meses (PLATA/PRO)
 * para nuevos vendedores, sin pasar por MercadoPago.
 *
 * tier = "FREE"  → plan básico permanente (50 publicaciones)
 * tier = "PLATA" → 6 meses gratis con beneficios ULTRA (one-shot para nuevos)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TRIAL_MS } from "@/lib/subscription/effective-tier";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { allowed } = rateLimit(`activate-free:${session.user.id}`, 1, 86_400_000)
  if (!allowed) {
    return NextResponse.json(
      { error: "Ya activaste el plan gratuito hoy. Intentá mañana." },
      { status: 429 }
    )
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { tier?: string };
    const requestedTier = body.tier === "PLATA" ? "PLATA" : "FREE";
    const tier = "FREE"; // tier base siempre FREE; el trial sube el tier efectivo

    // Leemos trialEndsAt via Supabase porque el client Prisma aún no
    // tiene este campo declarado (lo agregamos en migración SQL pura).
    const existing = await prisma.$queryRaw<Array<{ trial_ends_at: Date | null }>>`
      SELECT trial_ends_at FROM users WHERE id = ${session.user.id}
    `;
    const alreadyHadTrial = existing[0]?.trial_ends_at != null;

    // Solo otorgar trial si se pidió PLATA y nunca tuvo trial previo
    const grantTrial = requestedTier === "PLATA" && !alreadyHadTrial;

    const now = new Date();
    const trialEnd = grantTrial ? new Date(now.getTime() + TRIAL_MS) : null;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionTier: tier,
        subscriptionExpiry: null,
      },
    });

    if (grantTrial) {
      await prisma.$executeRaw`
        UPDATE users SET trial_ends_at = ${trialEnd} WHERE id = ${session.user.id}
      `;
    }

    return NextResponse.json({
      ok: true,
      tier,
      trialEndsAt: trialEnd ? trialEnd.toISOString() : null,
      trialGranted: grantTrial,
      trialDays: grantTrial ? 180 : 0,
    });
  } catch (err) {
    console.error("activate-free:", err);
    return NextResponse.json(
      { error: "No pudimos activar el plan" },
      { status: 500 },
    );
  }
}
