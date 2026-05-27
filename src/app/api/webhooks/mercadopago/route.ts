import { NextRequest, NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { supabaseService } from "@/lib/supabase/service";
import { mergeSellerFulfillmentIntoShipping, parseSellerFulfillment } from "@/lib/orders/seller-fulfillment";
import {
  hasActiveStockReservation,
  markStockReleased,
  restorePrismaStock,
  type StockReservationLine,
} from "@/lib/orders/stock-reservation";
import { pushStockToMeliForProductIds } from "@/lib/meli/stock-sync";
import { tryCreateZipnovaShipmentForPaidOrder } from "@/lib/zipnova/create-shipment";
import crypto from "crypto";
import { logger } from "@/lib/logger";

const WEBHOOK_TS_SKEW_MS = 5 * 60 * 1000;

/** Mercado Pago envía `ts` en segundos o milisegundos según entorno; ambos aparecen en sus ejemplos. */
function parseWebhookTsToMs(tsRaw: string): number {
  const n = Number(tsRaw);
  if (!Number.isFinite(n)) return NaN;
  return n < 1e12 ? n * 1000 : n;
}

/**
 * MP firma con `id` = query param `data.id` (prioritario). Si es alfanumérico hex, va en minúsculas.
 * @see https://www.mercadopago.com.ar/developers/en/docs/your-integrations/notifications/webhooks
 */
function normalizeManifestResourceId(id: string): string {
  const t = id.trim();
  if (/^[a-fA-F0-9]+$/.test(t)) return t.toLowerCase();
  return t;
}

function parseXSignature(header: string): { ts: string; v1: string } | null {
  let ts: string | undefined;
  let v1: string | undefined;
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === "ts") ts = value;
    else if (key === "v1") v1 = value;
  }
  if (!ts || !v1) return null;
  return { ts, v1 };
}

function buildSignatureManifest(dataIdRaw: string, requestId: string, ts: string): string | null {
  const rid = requestId.trim();
  if (!rid) {
    logger.warn("MercadoPago webhook: missing x-request-id; cannot verify signature");
    return null;
  }
  const id = normalizeManifestResourceId(dataIdRaw.trim());
  return `id:${id};request-id:${rid};ts:${ts};`;
}

/**
 * Mercado Pago firma usando `data.id` de la URL de la notificación (query).
 * Algunos proxies / CDNs pierden la query en `req.url`; probamos variantes válidas con la misma clave secreta.
 * @see https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
function manifestCandidates(opts: {
  url: URL;
  notification: Record<string, unknown>;
  requestId: string;
  ts: string;
}): string[] {
  const bodyData = opts.notification?.data as { id?: string | number } | undefined;
  const bodyId = bodyData?.id != null ? String(bodyData.id).trim() : "";
  const qId = opts.url.searchParams.get("data.id")?.trim() ?? "";

  const ordered: string[] = [];
  if (qId) ordered.push(qId);
  if (bodyId && bodyId !== qId) ordered.push(bodyId);

  const manifests: string[] = [];
  const seen = new Set<string>();
  for (const raw of ordered) {
    const m = buildSignatureManifest(raw, opts.requestId, opts.ts);
    if (m && !seen.has(m)) {
      seen.add(m);
      manifests.push(m);
    }
  }

  if (manifests.length === 0) {
    logger.warn("MercadoPago webhook: missing data.id (query and body); cannot verify signature");
  }
  return manifests;
}

function webhookSignaturesMatch(expectedHex: string, v1FromHeader: string): boolean {
  const a = expectedHex.trim().toLowerCase();
  const b = v1FromHeader.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(a) || !/^[0-9a-f]+$/.test(b) || a.length !== b.length || a.length % 2 !== 0) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/** external_reference del checkout cuando Supabase no persistió la orden (tmp_<ts>_<buyerPrismaId>). */
function prismaShadowOrderNumberFromTmpRef(orderId: string): string | null {
  if (!orderId.startsWith("tmp_")) return null;
  const suffix = orderId.replace(/^tmp_/, "");
  if (!suffix) return null;
  return `MP-${suffix.slice(0, 22).toUpperCase()}`;
}

function buyerPrismaIdFromTmpExternalRef(orderId: string): string | null {
  if (!orderId.startsWith("tmp_")) return null;
  const rest = orderId.slice(4);
  const idx = rest.indexOf("_");
  if (idx === -1 || idx === rest.length - 1) return null;
  return rest.slice(idx + 1);
}

function prismaStatusFromSupabaseWebhook(status: string): OrderStatus | null {
  const map: Record<string, OrderStatus> = {
    paid: OrderStatus.PAID,
    pending: OrderStatus.PENDING,
    cancelled: OrderStatus.CANCELLED,
    refunded: OrderStatus.REFUNDED,
  };
  return map[status] ?? null;
}

async function fetchSupabaseOrderStockLines(orderId: string): Promise<StockReservationLine[]> {
  const { data, error } = await supabaseService
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);

  if (error) {
    logger.warn("MercadoPago webhook: no se pudieron leer items para restaurar stock", error);
    return [];
  }

  return (data ?? [])
    .map((row) => ({
      productId: typeof row.product_id === "string" ? row.product_id : "",
      quantity: Number(row.quantity ?? 0),
    }))
    .filter((line) => line.productId && line.quantity > 0);
}

async function fetchMercadoPagoPaymentJson(
  paymentId: string
): Promise<{ ok: true; payment: Record<string, unknown> } | { ok: false; status: number }> {
  const tokens: string[] = [];
  const primary = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (primary) tokens.push(primary);

  const { data: sellerRows } = await supabaseService
    .from("seller_mercadopago")
    .select("mp_access_token")
    .eq("is_active", true);

  for (const row of sellerRows ?? []) {
    const t = row?.mp_access_token as string | null | undefined;
    if (t && !tokens.includes(t)) tokens.push(t);
  }

  if (!tokens.length) {
    logger.error("No Mercado Pago access tokens available for payment fetch");
    return { ok: false, status: 503 };
  }

  for (const token of tokens) {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (mpRes.ok) {
      return { ok: true, payment: (await mpRes.json()) as Record<string, unknown> };
    }
  }

  return { ok: false, status: 404 };
}

/**
 * POST /api/webhooks/mercadopago
 *
 * Notificaciones IPN/Webhook de MercadoPago. Firma obligatoria si MERCADOPAGO_WEBHOOK_SECRET está definido.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-signature") || "";
    const requestId = req.headers.get("x-request-id") || "";

    let notification: Record<string, unknown> = {};
    try {
      notification = JSON.parse(body) as Record<string, unknown>;
    } catch {
      logger.warn("Invalid JSON body from MercadoPago webhook");
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error("MERCADOPAGO_WEBHOOK_SECRET is not configured; rejecting webhook");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing x-signature" }, { status: 401 });
    }

    const parsed = parseXSignature(signature);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid signature format" }, { status: 401 });
    }
    const { ts, v1 } = parsed;

    const tsMs = parseWebhookTsToMs(ts);
    if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > WEBHOOK_TS_SKEW_MS) {
      return NextResponse.json({ error: "Stale or invalid timestamp" }, { status: 401 });
    }

    const url = req.nextUrl ?? new URL(req.url);
    const secret = webhookSecret.trim();
    const manifests = manifestCandidates({ url, notification, requestId, ts });

    let verified = false;
    let usedManifest: string | null = null;
    for (const manifest of manifests) {
      const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
      if (webhookSignaturesMatch(expected, v1)) {
        verified = true;
        usedManifest = manifest;
        break;
      }
    }

    if (!verified) {
      const primary = manifests[0];
      logger.warn("MercadoPago webhook signature mismatch", {
        triedManifests: manifests.length,
        manifestPreview: primary?.slice(0, 96),
        queryDataId: url.searchParams.get("data.id"),
        bodyDataId: (notification?.data as { id?: unknown } | undefined)?.id,
        hint: "Comprobá MERCADOPAGO_WEBHOOK_SECRET (Tu integración → Webhooks → clave de firma) y que la URL notificada incluya ?data.id=…",
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    if (manifests.length > 1 && usedManifest && usedManifest !== manifests[0]) {
      logger.warn("MercadoPago webhook: firma válida con manifest alternativo (query sin data.id; usado body)");
    }

    const type = (notification.type ?? notification.topic) as string | undefined;
    const data = notification.data as { id?: string | number } | undefined;

    if (type === "payment") {
      const paymentId = data?.id != null ? String(data.id) : null;
      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

      const fetched = await fetchMercadoPagoPaymentJson(paymentId);
      if (!fetched.ok) {
        logger.error("Failed to fetch payment from MP:", paymentId, "last HTTP:", fetched.status);
        return NextResponse.json({ received: true });
      }

      const payment = fetched.payment;
      const status = typeof payment.status === "string" ? payment.status : undefined;
      const orderId =
        typeof payment.external_reference === "string" ? payment.external_reference : undefined;

      if (!orderId) {
        return NextResponse.json({ received: true });
      }

      if (!status) {
        return NextResponse.json({ received: true });
      }

      const { data: seen } = await supabaseService
        .from("mp_webhook_processed")
        .select("last_mp_status")
        .eq("payment_id", paymentId)
        .maybeSingle();

      if (seen?.last_mp_status === status) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      const statusMap: Record<string, string> = {
        approved: "paid",
        pending: "pending",
        in_process: "pending",
        rejected: "cancelled",
        cancelled: "cancelled",
        refunded: "refunded",
        charged_back: "refunded",
      };
      const orderStatus = statusMap[status] || "pending";

      const { data: prevOrder } = await supabaseService
        .from("orders")
        .select("shipping_address, status, seller_id, total_amount")
        .eq("id", orderId)
        .maybeSingle();

      let shippingPatch: Record<string, unknown> | undefined;
      if (orderStatus === "paid") {
        const prevSt = typeof (prevOrder as { status?: string } | null)?.status === "string"
          ? String((prevOrder as { status: string }).status).toLowerCase()
          : "";
        const prevFul = parseSellerFulfillment((prevOrder as { shipping_address?: unknown } | null)?.shipping_address);
        if (prevSt !== "paid" && !prevFul.paid_at) {
          let merged = mergeSellerFulfillmentIntoShipping(
            (prevOrder as { shipping_address?: unknown } | null)?.shipping_address,
            { paid_at: new Date().toISOString() }
          );
          const po = prevOrder as { seller_id?: string; total_amount?: number | string | null } | null;
          const sellerPid = typeof po?.seller_id === "string" ? po.seller_id.trim() : "";
          if (sellerPid) {
            merged = await tryCreateZipnovaShipmentForPaidOrder({
              orderId,
              shippingAddress: merged,
              sellerProfileId: sellerPid,
              declaredValue: Number(po?.total_amount ?? 0),
            });
          }
          shippingPatch = merged;
        }
      } else if (
        (orderStatus === "cancelled" || orderStatus === "refunded") &&
        hasActiveStockReservation((prevOrder as { shipping_address?: unknown } | null)?.shipping_address)
      ) {
        const linesToRestore = await fetchSupabaseOrderStockLines(orderId);
        if (linesToRestore.length) {
          await restorePrismaStock(prisma, linesToRestore);
          void pushStockToMeliForProductIds(linesToRestore.map((l) => l.productId));
          shippingPatch = markStockReleased(
            (prevOrder as { shipping_address?: unknown } | null)?.shipping_address
          );
        }
      }

      const orderUpdate: Record<string, unknown> = {
        status: orderStatus,
        updated_at: new Date().toISOString(),
      };
      if (shippingPatch) orderUpdate.shipping_address = shippingPatch;

      const { error: orderError } = await supabaseService.from("orders").update(orderUpdate).eq("id", orderId);

      if (orderError) {
        logger.error("Error updating order status:", orderError);
      }

      const paymentFullPatch = {
        status: orderStatus,
        mp_payment_id: String(paymentId),
        mp_status: status,
        updated_at: new Date().toISOString(),
      };
      let { error: paymentError } = await supabaseService
        .from("payments")
        .update(paymentFullPatch)
        .eq("order_id", orderId);

      const payErrCode = (paymentError as { code?: string } | null)?.code;
      const payErrMsg = String((paymentError as { message?: string } | null)?.message ?? "");
      if (
        paymentError &&
        (payErrCode === "PGRST204" || payErrMsg.includes("mp_payment_id"))
      ) {
        const paymentFallbackPatch = {
          status: paymentFullPatch.status,
          updated_at: paymentFullPatch.updated_at,
        };
        const retry = await supabaseService
          .from("payments")
          .update(paymentFallbackPatch)
          .eq("order_id", orderId);
        paymentError = retry.error;
        if (paymentError) {
          logger.error("Error updating payment record:", paymentError);
        } else {
          logger.warn(
            "payments: actualizado sin mp_payment_id/mp_status (columnas ausentes en Supabase; agregalas o NOTIFY pgrst)."
          );
        }
      } else if (paymentError) {
        logger.error("Error updating payment record:", paymentError);
      }

      const prismaSt = prismaStatusFromSupabaseWebhook(orderStatus);
      const shadowNum = prismaShadowOrderNumberFromTmpRef(orderId);
      const buyerPid = buyerPrismaIdFromTmpExternalRef(orderId);
      if (prismaSt && shadowNum && buyerPid) {
        try {
          const pr = await prisma.order.updateMany({
            where: { buyerId: buyerPid, orderNumber: shadowNum },
            data: { status: prismaSt },
          });
          if (pr.count > 0) {
            logger.info(`Webhook: Prisma shadow order ${shadowNum} → ${prismaSt}`);
          }
        } catch (e) {
          logger.warn("Prisma shadow order status update (non-fatal):", e);
        }
      }

      if (orderStatus === "refunded") {
        const { error: ledgerErr } = await supabaseService
          .from("affiliate_ledger")
          .update({ status: "refunded", updated_at: new Date().toISOString() })
          .eq("order_id", orderId)
          .eq("status", "pending");
        if (ledgerErr) {
          logger.warn("affiliate_ledger refund update (non-fatal):", ledgerErr);
        }
      }

      await supabaseService.from("mp_webhook_processed").upsert(
        {
          payment_id: paymentId,
          last_mp_status: status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "payment_id" }
      );

      logger.info(`Webhook: order ${orderId} → ${orderStatus} (MP status: ${status})`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const challenge = url.searchParams.get("hub.challenge");
  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ status: "ok" });
}
