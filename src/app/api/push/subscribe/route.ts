import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/push/subscribe
export async function POST(req: NextRequest) {
  try {
    // SEGURIDAD: el userId se deriva de la sesión del servidor, NUNCA del body
    // (antes se confiaba en el cliente → se podían asociar suscripciones a
    // cualquier usuario). Si no hay sesión, la suscripción queda anónima.
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ?? null;

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { subscription } = await req.json();
    const rlKey = userId ? `push-sub:${userId}` : `push-sub:ip:${ip}`;
    const { allowed, retryAfter } = rateLimit(rlKey, 5, 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiadas suscripciones. Esperá un momento." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Subscription invalida" }, { status: 400 });
    }

    // Guardar o actualizar suscripcion
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        auth: subscription.keys?.auth,
        p256dh: subscription.keys?.p256dh,
        updatedAt: new Date(),
      },
      create: {
        endpoint: subscription.endpoint,
        userId,
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
