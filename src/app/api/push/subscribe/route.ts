import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/push/subscribe
export async function POST(req: NextRequest) {
  try {
    const { subscription, userId } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Subscription invalida" }, { status: 400 });
    }

    // Guardar o actualizar suscripcion
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId: userId || null,
        auth: subscription.keys?.auth,
        p256dh: subscription.keys?.p256dh,
        updatedAt: new Date(),
      },
      create: {
        endpoint: subscription.endpoint,
        userId: userId || null,
        auth: subscription.keys?.auth,
        p256dh: subscription.keys?.p256dh,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Push] Error al suscribir:", error);
    return NextResponse.json({ error: "Error al guardar suscripcion" }, { status: 500 });
  }
}
