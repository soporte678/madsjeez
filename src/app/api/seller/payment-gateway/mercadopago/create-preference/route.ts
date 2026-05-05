import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { getSupabaseUserFromBearer } from "@/lib/supabase-auth-request";

interface OrderItemRow {
  quantity: number;
  unit_price: number;
  product_id: string;
  product: {
    id: string;
    title: string;
    seller_id: string;
  } | null;
}

interface MercadoPagoPreference {
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    currency_id: string;
  }>;
  marketplace_fee: number;
  payer: { email: string };
  external_reference: string;
  notification_url: string;
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return: string;
}

/**
 * POST /api/seller/payment-gateway/mercadopago/create-preference
 *
 * Montos e ítems se reconstruyen desde la orden en Supabase (anti-tampering).
 * Auth: Authorization Bearer = access_token de Supabase (mismo flujo que checkout).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order_id = body?.order_id as string | undefined;
    const buyer_email = (body?.buyer_email as string | undefined) || undefined;

    if (!order_id) {
      return NextResponse.json({ error: "order_id es requerido" }, { status: 400 });
    }

    const authUser = await getSupabaseUserFromBearer(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "No autorizado. Enviá Authorization: Bearer con el access_token de Supabase." },
        { status: 401 }
      );
    }

    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .select("id, buyer_id, seller_id, status, shipping_cost, total_amount")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (order.buyer_id !== authUser.id) {
      return NextResponse.json({ error: "No autorizado para esta orden" }, { status: 403 });
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "La orden ya no está pendiente de pago" },
        { status: 409 }
      );
    }

    const { data: lines, error: linesError } = await supabaseService
      .from("order_items")
      .select(
        `
        quantity,
        unit_price,
        product_id,
        product:products ( id, title, seller_id )
      `
      )
      .eq("order_id", order_id);

    if (linesError || !lines?.length) {
      return NextResponse.json(
        { error: "La orden no tiene ítems válidos" },
        { status: 400 }
      );
    }

    const typedLines = lines as unknown as OrderItemRow[];
    const sellerId = order.seller_id as string;

    for (const row of typedLines) {
      if (!row.product || row.product.seller_id !== sellerId) {
        return NextResponse.json(
          { error: "Inconsistencia vendedor/producto en la orden" },
          { status: 400 }
        );
      }
    }

    const subtotal = typedLines.reduce(
      (sum, row) => sum + Number(row.unit_price) * row.quantity,
      0
    );
    const totalShipping = Number(order.shipping_cost ?? 0);

    const subtotalFromOrder = Number(order.total_amount ?? 0);
    if (Math.abs(subtotal - subtotalFromOrder) > 0.02) {
      return NextResponse.json(
        { error: "Totales de orden inconsistentes. Recargá el checkout." },
        { status: 400 }
      );
    }

    const { data: mpConnection, error: mpError } = await supabaseService
      .from("seller_mercadopago")
      .select("mp_access_token, is_active")
      .eq("seller_id", sellerId)
      .eq("is_active", true)
      .single();

    if (mpError || !mpConnection?.mp_access_token) {
      return NextResponse.json(
        {
          error:
            "El vendedor no tiene MercadoPago conectado. Debe vincular su cuenta desde el panel de vendedor.",
        },
        { status: 400 }
      );
    }

    const totalBuyerPays = subtotal + totalShipping;
    const commissionOnProducts = Math.round(subtotal * 0.1 * 100) / 100;
    const sellerShippingShare = Math.round(totalShipping * 0.5 * 100) / 100;
    const marketplaceFee = commissionOnProducts + sellerShippingShare;
    const sellerReceives = totalBuyerPays - marketplaceFee;

    const mpItems: MercadoPagoPreference["items"] = typedLines.map((row) => ({
      id: row.product_id,
      title: row.product?.title ?? "Producto",
      quantity: row.quantity,
      unit_price: Number(row.unit_price),
      currency_id: "ARS",
    }));

    if (totalShipping > 0) {
      mpItems.push({
        id: "shipping",
        title: "Costo de envío",
        quantity: 1,
        unit_price: totalShipping,
        currency_id: "ARS",
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const preference: MercadoPagoPreference = {
      items: mpItems,
      marketplace_fee: marketplaceFee,
      payer: {
        email: buyer_email || authUser.email || "",
      },
      external_reference: order_id,
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${appUrl}/checkout/success?order_id=${order_id}`,
        failure: `${appUrl}/checkout/failure?order_id=${order_id}`,
        pending: `${appUrl}/checkout/pending?order_id=${order_id}`,
      },
      auto_return: "approved",
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpConnection.mp_access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json().catch(() => ({}));
      console.error("Error creando preferencia de MercadoPago:", errorData);
      return NextResponse.json(
        { error: "Error creando preferencia de pago", details: errorData },
        { status: 500 }
      );
    }

    const mpData = await mpResponse.json();

    const { error: paymentError } = await supabaseService.from("payments").insert({
      order_id,
      mp_preference_id: mpData.id,
      mp_init_point: mpData.init_point,
      mp_sandbox_init_point: mpData.sandbox_init_point,
      amount: totalBuyerPays,
      marketplace_commission: commissionOnProducts,
      marketplace_fee_total: marketplaceFee,
      seller_receives: sellerReceives,
      shipping_cost: totalShipping,
      shipping_seller_share: sellerShippingShare,
      shipping_buyer_share: totalShipping - sellerShippingShare,
      status: "pending",
      seller_id: sellerId,
      buyer_id: authUser.id,
      created_at: new Date().toISOString(),
    });

    if (paymentError) {
      console.error("Error guardando información de pago:", paymentError);
    }

    await supabaseService
      .from("seller_mercadopago")
      .update({ last_used_at: new Date().toISOString() })
      .eq("seller_id", sellerId);

    return NextResponse.json({
      preference_id: mpData.id,
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      breakdown: {
        subtotal,
        shipping_cost: totalShipping,
        total_buyer_pays: totalBuyerPays,
        commission_on_products: commissionOnProducts,
        seller_shipping_share: sellerShippingShare,
        marketplace_fee: marketplaceFee,
        seller_receives: sellerReceives,
      },
    });
  } catch (error) {
    console.error("Error creando preferencia de MercadoPago:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
