/**
 * POST /api/coupons/campaigns/adopt — el vendedor activa una plantilla de promo.
 * Crea un Coupon real para su tienda con los valores sugeridos + código único.
 * Idempotente: si ya activó esa plantilla, devuelve el cupón existente.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCouponTemplateById } from "@/data/coupon-campaigns";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: { templateId?: string; discountValue?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const tpl = getCouponTemplateById(String(body.templateId || ""));
  if (!tpl) return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });

  // Código único por vendedor + plantilla (idempotente).
  const code = `${tpl.codePrefix}-${userId.slice(-5).toUpperCase()}`;

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ coupon: existing, alreadyActive: true });
  }

  // El vendedor puede ajustar el % sugerido (dentro de rangos sanos).
  let value = tpl.discountValue;
  if (typeof body.discountValue === "number" && body.discountValue > 0) {
    value = tpl.discountType === "percentage" ? Math.min(80, body.discountValue) : body.discountValue;
  }

  const now = new Date();
  const expires = new Date(now.getTime() + tpl.durationDays * 24 * 60 * 60 * 1000);

  const coupon = await prisma.coupon.create({
    data: {
      sellerId: userId,
      code,
      description: `${tpl.emoji} ${tpl.title} — ${tpl.occasion}`,
      discountType: tpl.discountType,
      discountValue: value,
      minPurchase: tpl.minPurchase ?? null,
      maxDiscount: tpl.maxDiscount ?? null,
      startsAt: now,
      expiresAt: expires,
    },
  });

  return NextResponse.json({ coupon }, { status: 201 });
}
