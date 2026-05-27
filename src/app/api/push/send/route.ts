import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

// Configurar VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:soporte@madsjeez.com.ar";

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, icon, url } = await req.json();

    // Buscar suscripciones del usuario
    const subscriptions = await prisma.pushSubscription.findMany({
      where: userId ? { userId } : {},
    });

    const payload = JSON.stringify({
      title: title || "Madsjeez",
      body: body || "Tenes una nueva notificacion",
      icon: icon || "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: `madsjeez-${Date.now()}`,
      data: { url: url || "/dashboard" },
      requireInteraction: true,
      actions: [
        { action: "open", title: "Ver" },
        { action: "close", title: "Cerrar" },
      ],
    });

    // Enviar a todas las suscripciones
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              auth: sub.auth || "",
              p256dh: sub.p256dh || "",
            },
          },
          payload
        )
      )
    );

    // Limpiar suscripciones invalidas
    const failedEndpoints = subscriptions
      .filter((_, i) => results[i].status === "rejected")
      .map((sub) => sub.endpoint);

    if (failedEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: failedEndpoints } },
      });
    }

    return NextResponse.json({
      sent: results.filter((r) => r.status === "fulfilled").length,
      failed: failedEndpoints.length,
    });
  } catch (error) {
    console.error("[Push] Error enviando:", error);
    return NextResponse.json({ error: "Error enviando notificacion" }, { status: 500 });
  }
}
