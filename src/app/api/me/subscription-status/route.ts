/**
 * GET /api/me/subscription-status
 *
 * Devuelve el estado del seller para la UI:
 *  - tier efectivo (considera trial 14 días)
 *  - si está en trial y cuánto le queda
 *  - cuántas publicaciones activas tiene y el máximo
 *  - hint para mostrar banner "Trial PRO termina en X días"
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getEffectiveTier,
  canPublishMore,
} from "@/lib/subscription/effective-tier";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userRow = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionTier: true, subscriptionExpiry: true },
  });
  const trialRow = await prisma.$queryRaw<Array<{ trial_ends_at: Date | null }>>`
    SELECT trial_ends_at FROM users WHERE id = ${session.user.id}
  `;

  const effective = getEffectiveTier({
    subscriptionTier: userRow?.subscriptionTier ?? "FREE",
    subscriptionExpiry: userRow?.subscriptionExpiry ?? null,
    trialEndsAt: trialRow[0]?.trial_ends_at ?? null,
  });

  const activeCount = await prisma.product.count({
    where: { sellerId: session.user.id, isActive: true },
  });
  const limit = canPublishMore(effective.tier, activeCount);

  return NextResponse.json({
    storedTier: userRow?.subscriptionTier ?? "FREE",
    effectiveTier: effective.tier,
    inTrial: effective.inTrial,
    trialEndsAt: effective.trialEndsAt ? effective.trialEndsAt.toISOString() : null,
    trialDaysRemaining:
      effective.trialRemainingMs != null
        ? Math.ceil(effective.trialRemainingMs / (24 * 60 * 60 * 1000))
        : null,
    subscriptionExpiry: userRow?.subscriptionExpiry?.toISOString() ?? null,
    publications: {
      active: activeCount,
      max: Number.isFinite(limit.max) ? limit.max : null, // null = ilimitado
      remaining: Number.isFinite(limit.remaining) ? limit.remaining : null,
      canPublishMore: limit.allowed,
    },
  });
}
