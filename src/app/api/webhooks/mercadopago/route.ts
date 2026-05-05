import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import crypto from "crypto";

const WEBHOOK_TS_SKEW_MS = 5 * 60 * 1000;

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
      console.warn("Invalid JSON body from MercadoPago webhook");
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("MERCADOPAGO_WEBHOOK_SECRET is not configured; rejecting webhook");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing x-signature" }, { status: 401 });
    }

    const ts = signature.split(",").find((p) => p.startsWith("ts="))?.split("=")[1];
    const v1 = signature.split(",").find((p) => p.startsWith("v1="))?.split("=")[1];

    if (!ts || !v1) {
      return NextResponse.json({ error: "Invalid signature format" }, { status: 401 });
    }

    const tsMs = Number(ts) * 1000;
    if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > WEBHOOK_TS_SKEW_MS) {
      return NextResponse.json({ error: "Stale or invalid timestamp" }, { status: 401 });
    }

    const dataObj = notification?.data as { id?: string } | undefined;
    const dataId = dataObj?.id != null ? String(dataObj.id) : requestId;
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const expected = crypto.createHmac("sha256", webhookSecret).update(manifest).digest("hex");

    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(v1, "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      console.warn("MercadoPago webhook signature mismatch");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const type = notification.type as string | undefined;
    const data = notification.data as { id?: string | number } | undefined;

    if (type === "payment") {
      const paymentId = data?.id != null ? String(data.id) : null;
      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

      const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!mpAccessToken) {
        console.error("MERCADOPAGO_ACCESS_TOKEN not configured");
        return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
      }

      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      });

      if (!mpRes.ok) {
        console.error("Failed to fetch payment from MP:", paymentId);
        return NextResponse.json({ received: true });
      }

      const payment = (await mpRes.json()) as {
        status?: string;
        external_reference?: string;
      };
      const { status, external_reference: orderId } = payment;

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

      const { error: orderError } = await supabaseService
        .from("orders")
        .update({ status: orderStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (orderError) {
        console.error("Error updating order status:", orderError);
      }

      const { error: paymentError } = await supabaseService
        .from("payments")
        .update({
          status: orderStatus,
          mp_payment_id: String(paymentId),
          mp_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);

      if (paymentError) {
        console.error("Error updating payment record:", paymentError);
      }

      await supabaseService.from("mp_webhook_processed").upsert(
        {
          payment_id: paymentId,
          last_mp_status: status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "payment_id" }
      );

      console.log(`Webhook: order ${orderId} → ${orderStatus} (MP status: ${status})`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
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
