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

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { tier?: string };
    const tier = body.tier === "FREE" ? "FREE" : "FREE";

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionTier: tier,
        subscriptionExpiry: null,
      },
    });

    return NextResponse.json({ ok: true, tier });
  } catch (err) {
    console.error("activate-free:", err);
    return NextResponse.json(
      { error: "No pudimos activar el plan" },
      { status: 500 },
    );
  }
}
