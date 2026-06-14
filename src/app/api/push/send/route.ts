import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// web-push se carga condicionalmente para evitar errores cuando no esta instalado
let webpush: typeof import("web-push") | null = null;
try {
  webpush = require("web-push");
} catch {
  webpush = null;
}

// Configurar VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:soporte@madsjeez.com";

if (webpush && vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function POST(req: NextRequest) {
  try {
    // SEGURIDAD: este endpoint envía notificaciones push. Es solo server-to-server
    // (procesos internos / admin). Sin esta verificación, cualquiera podía
    // spamear/phishear a TODOS los usuarios. Requiere secreto interno.
    const internalSecret = process.env.ADMIN_SETUP_SECRET || process.env.INTERNAL_API_SECRET;
    const provided =
      req.headers.get("x-internal-secret") ||
      (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!internalSecret || !provided || provided !== internalSecret) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { userId, title, body, icon, url } = await req.json();

    // Nunca permitir blast a TODOS sin un userId explícito.
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
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
    if (!webpush) {
      return NextResponse.json({ error: "web-push no esta disponible" }, { status: 503 });
    }
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush!.sendNotification(
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
