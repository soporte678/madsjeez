import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/webhooks/mercadopago
 *
 * Recibe notificaciones IPN/Webhook de MercadoPago y actualiza
 * el estado de pagos y órdenes en la base de datos.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-signature") || "";
    const requestId = req.headers.get("x-request-id") || "";

    // Validate webhook signature
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const ts = signature.split(",").find((p) => p.startsWith("ts="))?.split("=")[1];
      const v1 = signature.split(",").find((p) => p.startsWith("v1="))?.split("=")[1];

      if (ts && v1) {
        const manifest = `id:${requestId};request-id:${requestId};ts:${ts};`;
        const expected = crypto
          .createHmac("sha256", webhookSecret)
          .update(manifest)
          .digest("hex");

        if (expected !== v1) {
          console.warn("MercadoPago webhook signature mismatch");
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
      }
    }

    const notification = JSON.parse(body);
    const { type, data } = notification;

    if (type === "payment") {
      const paymentId = data?.id;
      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

      // Fetch payment details from MercadoPago
      const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      });

      if (!mpRes.ok) {
        console.error("Failed to fetch payment from MP:", paymentId);
        return NextResponse.json({ received: true });
      }

      const payment = await mpRes.json();
      const { status, external_reference: orderId, transaction_amount } = payment;

      if (!orderId) {
        return NextResponse.json({ received: true });
      }

      // Map MP status to our order status
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

      // Update order status
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: orderStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (orderError) {
        console.error("Error updating order status:", orderError);
      }

      // Update payment record
      const { error: paymentError } = await supabase
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
