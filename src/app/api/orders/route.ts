export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchMergedBuyerOrders } from "@/lib/orders/merge-buyer-orders";

// POST /api/orders - deshabilitado: el flujo oficial de pago es Mercado Pago.
export async function POST() {
  return NextResponse.json(
    {
      code: "LEGACY_STRIPE_DISABLED",
      error:
        "Este endpoint está deshabilitado. Usá el flujo oficial de checkout Mercado Pago en /api/checkout/mp.",
    },
    { status: 410 }
  );
}

// GET /api/orders - Órdenes Prisma + Mercado Pago (Supabase) del comprador
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !(session.user as { id?: string }).id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const merged = await fetchMergedBuyerOrders(session.user.id, session.user.email);
    return NextResponse.json(merged);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Error al cargar órdenes" }, { status: 500 });
  }
}
