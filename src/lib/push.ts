/**
 * Utilidades server-side para enviar push notifications
 * Uso: importar desde API routes o server actions cuando ocurren eventos de negocio
 */

import { prisma } from "@/lib/prisma";
import webpush from "web-push";

// Configurar VAPID keys (solo en server-side)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:soporte@madsjeez.com";

// Inicializar web-push solo si hay keys configuradas
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

/**
 * Envia notificacion push a un usuario especifico
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("[Push] VAPID keys no configuradas, skipping push notification");
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: payload.tag || `madsjeez-${Date.now()}`,
    data: { url: payload.url || "/dashboard" },
    requireInteraction: true,
    actions: [
      { action: "open", title: "Ver" },
      { action: "close", title: "Cerrar" },
    ],
  });

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
        pushPayload
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

  return {
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: failedEndpoints.length,
  };
}

// ============================================
// HELPERS PARA EVENTOS DE NEGOCIO
// ============================================

/**
 * Notificar al vendedor sobre una nueva venta
 */
export async function notifyNewSale(sellerId: string, orderNumber: string, total: string) {
  return sendPushToUser(sellerId, {
    title: "\uD83D\uDD25 Nueva venta!",
    body: `Orden #${orderNumber} - Total: $${total}`,
    url: "/seller/orders",
    tag: `sale-${orderNumber}`,
  });
}

/**
 * Notificar al vendedor sobre una nueva pregunta en un producto
 */
export async function notifyNewQuestion(sellerId: string, productTitle: string) {
  return sendPushToUser(sellerId, {
    title: "\u2753 Nueva pregunta",
    body: `Te preguntaron sobre: ${productTitle}`,
    url: "/seller/questions",
    tag: `question-${Date.now()}`,
  });
}

/**
 * Notificar al usuario sobre una respuesta a su pregunta
 */
export async function notifyQuestionAnswered(buyerId: string, productTitle: string) {
  return sendPushToUser(buyerId, {
    title: "\u2705 Te respondieron",
    body: `Respondieron tu pregunta sobre: ${productTitle}`,
    url: "/dashboard/questions",
    tag: `answer-${Date.now()}`,
  });
}

/**
 * Notificar al usuario sobre un nuevo mensaje
 */
export async function notifyNewMessage(userId: string, senderName: string, messagePreview: string) {
  return sendPushToUser(userId, {
    title: `\uD83D\uDCAC ${senderName}`,
    body: messagePreview,
    url: "/dashboard/messages",
    tag: `message-${Date.now()}`,
  });
}

/**
 * Notificar actualizacion de envio
 */
export async function notifyShipmentUpdate(userId: string, orderNumber: string, status: string) {
  const statusMessages: Record<string, string> = {
    shipped: "Tu pedido esta en camino \uD83D\uDE9A",
    delivered: "Tu pedido fue entregado \u2705",
    out_for_delivery: "Tu pedido esta en reparto \uD83D\uDCE6",
    in_transit: "Tu pedido esta en transito \uD83D\uDEDF",
  };

  return sendPushToUser(userId, {
    title: "\uD83D\uDCE6 Actualizacion de envio",
    body: statusMessages[status] || `Orden #${orderNumber}: ${status}`,
    url: `/orders/${orderNumber}`,
    tag: `shipment-${orderNumber}`,
  });
}

/**
 * Notificar al comprador que el vendedor respondio su reclamo
 */
export async function notifyClaimUpdate(userId: string, orderNumber: string, message: string) {
  return sendPushToUser(userId, {
    title: "\u26A0\uFE0F Actualizacion de reclamo",
    body: message,
    url: `/orders/${orderNumber}?tab=claims`,
    tag: `claim-${orderNumber}`,
  });
}

/**
 * Notificar al vendedor sobre un nuevo reclamo
 */
export async function notifyNewClaim(sellerId: string, orderNumber: string) {
  return sendPushToUser(sellerId, {
    title: "\u26A0\uFE0F Nuevo reclamo",
    body: `Tenés un nuevo reclamo en la orden #${orderNumber}`,
    url: "/seller/claims",
    tag: `new-claim-${orderNumber}`,
  });
}
