export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/coupons - Listar cupones del vendedor logueado
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      where: {
        sellerId: (session.user as any).id,
      },
      orderBy: { startsAt: "desc" },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({ error: "Error al obtener cupones" }, { status: 500 });
  }
}

// POST /api/coupons - Crear cupón
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxUses,
      startsAt,
      expiresAt,
      maxDiscount,
    } = body;

    if (!code || !discountType || discountValue === undefined || !startsAt || !expiresAt) {
      return NextResponse.json(
        { error: "Código, tipo de descuento, valor, fecha de inicio y fecha de fin son requeridos" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        sellerId: (session.user as any).id,
        code,
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        minPurchase: minPurchase ? parseFloat(minPurchase) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        startsAt: new Date(startsAt),
        expiresAt: new Date(expiresAt),
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating coupon:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "El código de cupón ya existe" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear cupón" }, { status: 500 });
  }
}
