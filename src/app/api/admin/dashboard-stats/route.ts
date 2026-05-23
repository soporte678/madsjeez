import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { OrderStatus, ClaimStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await requireAdminRequest(request);
  if (admin instanceof NextResponse) return admin;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      ventasHoyRows,
      enviosDemora,
      mediacionesAbiertas,
      fraudesBloqueados,
      totalUsuarios,
      totalProductos,
      totalOrdenes,
      revenueRows,
    ] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: today },
          status: OrderStatus.DELIVERED,
        },
        select: { total: true },
      }),
      prisma.shipment.count({ where: { status: "delayed" } }),
      prisma.claim.count({ where: { status: ClaimStatus.OPEN } }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint AS count FROM flagged_messages
        WHERE created_at >= ${last24h}
      `.then((rows) => Number(rows[0]?.count ?? 0)).catch(() => 0),
      prisma.user.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.findMany({
        where: {
          createdAt: { gte: firstDayOfMonth },
          status: OrderStatus.DELIVERED,
        },
        select: { total: true },
      }),
    ]);

    const ventasDia = ventasHoyRows.reduce((acc, o) => acc + (o.total || 0), 0);
    const ingresosMes = revenueRows.reduce((acc, o) => acc + (o.total || 0), 0);

    return NextResponse.json({
      ventasDia,
      enviosDemora,
      mediacionesAbiertas,
      fraudesBloqueados,
      totalUsuarios,
      totalProductos,
      totalOrdenes,
      ingresosMes,
    });
  } catch (error) {
    console.error("[admin/dashboard-stats]", error);
    return NextResponse.json(
      { error: "No se pudieron cargar las estadísticas" },
      { status: 500 }
    );
  }
}
