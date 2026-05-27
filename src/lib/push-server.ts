/**
 * Server-side push notification utilities for MADSJEEZ
 * Import this module ONLY in server contexts (API routes, server actions)
 */

import { prisma } from "@/lib/prisma";
import webpush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:soporte@madsjeez.com.ar";

let initialized = false;

function ensureVapid() {
  if (!initialized && vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    initialized = true;
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string }>;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
) {
  ensureVapid();

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("[Push] VAPID keys not configured");
    return { sent: 0, failed: 0 };
  }

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return { sent: 0, failed: 0 };

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: payload.badge || "/icons/icon-72x72.png",
    tag: payload.tag || `madsjeez-${Date.now()}`,
    data: { url: payload.url || "/dashboard" },
    requireInteraction: payload.requireInteraction ?? true,
    actions: payload.actions || [
      { action: "open", title: "Ver" },
      { action: "close", title: "Cerrar" },
    ],
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { auth: sub.auth || "", p256dh: sub.p256dh || "" } },
        pushPayload
      )
    )
  );

  const failed = subs.filter((_, i) => results[i].status === "rejected").map((s) => s.endpoint);
  if (failed.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: failed } } });
  }

  return { sent: results.filter((r) => r.status === "fulfilled").length, failed: failed.length };
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushNotificationPayload
) {
  const results = await Promise.all(userIds.map((id) => sendPushToUser(id, payload)));
  return results.reduce(
    (acc, r) => ({ sent: acc.sent + r.sent, failed: acc.failed + r.failed }),
    { sent: 0, failed: 0 }
  );
}

/**
 * Broadcast push to all subscribed users (use with caution)
 */
export async function broadcastPush(payload: PushNotificationPayload) {
  ensureVapid();

  const subs = await prisma.pushSubscription.findMany();
  if (subs.length === 0) return { sent: 0, failed: 0 };

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: payload.badge || "/icons/icon-72x72.png",
    tag: payload.tag || `madsjeez-${Date.now()}`,
    data: { url: payload.url || "/" },
    requireInteraction: payload.requireInteraction ?? false,
    actions: payload.actions || [{ action: "open", title: "Ver" }],
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { auth: sub.auth || "", p256dh: sub.p256dh || "" } },
        pushPayload
      )
    )
  );

  const failed = subs.filter((_, i) => results[i].status === "rejected").map((s) => s.endpoint);
  if (failed.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: failed } } });
  }

  return { sent: results.filter((r) => r.status === "fulfilled").length, failed: failed.length };
}

// ============================================
// BUSINESS EVENT HELPERS
// ============================================

/** Notify seller of a new sale */
export async function notifySale(sellerId: string, orderNumber: string, total: string) {
  return sendPushToUser(sellerId, {
    title: "Nueva venta!",
    body: `Orden #${orderNumber} por $${total}`,
    url: "/seller/orders",
    tag: `sale-${orderNumber}`,
  });
}

/** Notify seller of a new product question */
export async function notifyProductQuestion(sellerId: string, productName: string) {
  return sendPushToUser(sellerId, {
    title: "Nueva pregunta",
    body: `Pregunta sobre: ${productName}`,
    url: "/seller/questions",
    tag: `question-${Date.now()}`,
  });
}

/** Notify buyer that their question was answered */
export async function notifyAnsweredQuestion(buyerId: string, productName: string) {
  return sendPushToUser(buyerId, {
    title: "Te respondieron",
    body: `Respuesta sobre: ${productName}`,
    url: "/dashboard/questions",
    tag: `answer-${Date.now()}`,
  });
}

/** Notify user of a new message */
export async function notifyChatMessage(userId: string, senderName: string, preview: string) {
  return sendPushToUser(userId, {
    title: senderName,
    body: preview,
    url: "/dashboard/messages",
    tag: `msg-${Date.now()}`,
  });
}

/** Notify shipment status update */
export async function notifyShipment(userId: string, orderNumber: string, status: string) {
  const messages: Record<string, string> = {
    shipped: "Tu pedido esta en camino",
    delivered: "Tu pedido fue entregado",
    out_for_delivery: "Tu pedido esta en reparto",
    in_transit: "Tu pedido esta en transito",
  };
  return sendPushToUser(userId, {
    title: "Actualizacion de envio",
    body: messages[status] || `Orden #${orderNumber}: ${status}`,
    url: `/orders/${orderNumber}`,
    tag: `ship-${orderNumber}`,
  });
}

/** Notify seller of a new claim */
export async function notifyNewClaim(sellerId: string, orderNumber: string) {
  return sendPushToUser(sellerId, {
    title: "Nuevo reclamo",
    body: `Reclamo en orden #${orderNumber}`,
    url: "/seller/claims",
    tag: `claim-${orderNumber}`,
  });
}
