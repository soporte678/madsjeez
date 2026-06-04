/**
 * POST /api/subscriptions/activate-free
 *
 * Activa el plan BÁSICO (FREE) sin pasar por MercadoPago.
 * Setea User.subscriptionTier = FREE y expiry = null.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TRIAL_MS } from "@/lib/subscription/effective-tier";

export const dynamic = "force-dynamic";

/**
 * Activa el plan BÁSICO (FREE).
 *
 * Si el seller NUNCA tuvo trial (trialEndsAt es null), le otorgamos 14
 * días con beneficios ULTRA. Trial es one-shot: si ya lo usó (aunque haya
 * terminado), no se renueva.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { tier?: string };
    const tier = body.tier === "FREE" ? "FREE" : "FREE";

    // Leemos trialEndsAt via Supabase porque el client Prisma aún no
    // tiene este campo declarado (lo agregamos en migración SQL pura).
    const existing = await prisma.$queryRaw<Array<{ trial_ends_at: Date | null }>>`
      SELECT trial_ends_at FROM users WHERE id = ${session.user.id}
    `;
    const alreadyHadTrial = existing[0]?.trial_ends_at != null;

    const now = new Date();
    const trialEnd = alreadyHadTrial ? null : new Date(now.getTime() + TRIAL_MS);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionTier: tier,
        subscriptionExpiry: null,
      },
    });

    if (!alreadyHadTrial) {
      await prisma.$executeRaw`
        UPDATE users SET trial_ends_at = ${trialEnd} WHERE id = ${session.user.id}
      `;
    }

    return NextResponse.json({
      ok: true,
      tier,
      trialEndsAt: trialEnd ? trialEnd.toISOString() : null,
      trialGranted: !alreadyHadTrial,
    });
  } catch (err) {
    console.error("activate-free:", err);
    return NextResponse.json(
      { error: "No pudimos activar el plan" },
      { status: 500 },
    );
  }
}
