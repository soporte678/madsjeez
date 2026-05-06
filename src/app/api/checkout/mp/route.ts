import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseService } from "@/lib/supabase/service";
import {
  getProfileUuidByEmail,
  getProfileUuidForPrismaUserId,
} from "@/lib/supabase-profile-map";

/**
 * Checkout Mercado Pago: carrito Prisma → orden Supabase → preferencia MP (mismo vendedor).
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(session.user as { id?: string }).id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const buyerPrismaId = (session.user as { id: string }).id;
    const buyerUuid = await getProfileUuidByEmail(session.user.email);
    if (!buyerUuid) {
      return NextResponse.json(
        {
          error:
            "Tu cuenta no tiene perfil en la tienda (Supabase). Usá el mismo email que en el registro o contactá soporte.",
        },
        { status: 400 }
      );
    }

    const body = (await req.json()) as {
      shipping?: Record<string, unknown>;
      buyer_email?: string;
    };
    const shippingAddress = body.shipping ?? {};

    const cart = await prisma.cart.findUnique({
      where: { userId: buyerPrismaId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart?.items.length) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
    }

    const sellerIds = new Set(cart.items.map((i) => i.product.sellerId));
    if (sellerIds.size !== 1) {
      return NextResponse.json(
        {
          error:
            "Por ahora solo podés pagar productos del mismo vendedor en un solo pago. Dejá solo ítems de un vendedor en el carrito.",
        },
        { status: 400 }
      );
    }

    const sellerPrismaId = [...sellerIds][0];
    const sellerUuid = await getProfileUuidForPrismaUserId(sellerPrismaId);
    if (!sellerUuid) {
      return NextResponse.json(
        { error: "No se pudo resolver el vendedor para cobrar. Probá más tarde." },
        { status: 400 }
      );
    }

    const lines = cart.items;
    const subtotal = lines.reduce((s, i) => s + i.price * i.quantity, 0);
    const shippingCost = lines.some((i) => !i.product.freeShipping) ? 2500 : 0;
    const orderTotal = subtotal + shippingCost;
    const commissionAmount = subtotal * 0.1;

    const { data: order, error: orderErr } = await supabaseService
      .from("orders")
      .insert({
        buyer_id: buyerUuid,
        seller_id: sellerUuid,
        status: "pending",
        total_amount: orderTotal,
        shipping_cost: shippingCost,
        discount_amount: 0,
        commission_amount: commissionAmount,
        shipping_address: shippingAddress,
        notes: null,
      })
      .select("id")
      .single();

    if (orderErr || !order?.id) {
      console.error("checkout mp insert order:", orderErr);
      return NextResponse.json({ error: "No se pudo crear la orden" }, { status: 500 });
    }

    const orderId = order.id as string;

    for (const item of lines) {
      const unit = item.price;
      const totalLine = unit * item.quantity;
      const { error: liErr } = await supabaseService.from("order_items").insert({
        order_id: orderId,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: unit,
        total_price: totalLine,
        commission_rate: 10,
        commission_amount: totalLine * 0.1,
      });
      if (liErr) {
        console.error("order_items insert:", liErr);
        await supabaseService.from("orders").delete().eq("id", orderId);
        return NextResponse.json({ error: "No se pudieron guardar los ítems" }, { status: 500 });
      }
    }

    const { data: mpConnection, error: mpErr } = await supabaseService
      .from("seller_mercadopago")
      .select("mp_access_token, is_active")
      .eq("seller_id", sellerUuid)
      .eq("is_active", true)
      .maybeSingle();

    if (mpErr || !mpConnection?.mp_access_token) {
      await supabaseService.from("orders").delete().eq("id", orderId);
      return NextResponse.json(
        {
          error:
            "El vendedor no tiene Mercado Pago conectado. Elegí otro vendedor o avisale que vincule su cuenta.",
        },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const buyerEmail = body.buyer_email || session.user.email || "";

    const mpItems = lines.map((row) => ({
      id: row.productId,
      title: row.product.title.slice(0, 120),
      quantity: row.quantity,
      unit_price: Number(row.price),
      currency_id: "ARS",
    }));

    if (shippingCost > 0) {
      mpItems.push({
        id: "shipping",
        title: "Costo de envío",
        quantity: 1,
        unit_price: shippingCost,
        currency_id: "ARS",
      });
    }

    const commissionOnProducts = Math.round(subtotal * 0.1 * 100) / 100;
    const sellerShippingShare = Math.round(shippingCost * 0.5 * 100) / 100;
    const marketplaceFee = commissionOnProducts + sellerShippingShare;

    const preference = {
      items: mpItems,
      marketplace_fee: marketplaceFee,
      payer: { email: buyerEmail },
      external_reference: orderId,
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${appUrl}/checkout/success?order_id=${orderId}`,
        failure: `${appUrl}/checkout/failure?order_id=${orderId}`,
        pending: `${appUrl}/checkout/pending?order_id=${orderId}`,
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
      const errData = await mpResponse.json().catch(() => ({}));
      console.error("MP preference error:", errData);
      await supabaseService.from("orders").delete().eq("id", orderId);
      return NextResponse.json(
        { error: "No se pudo iniciar el pago con Mercado Pago", details: errData },
        { status: 502 }
      );
    }

    const mpData = await mpResponse.json();

    const { error: payErr } = await supabaseService.from("payments").insert({
      order_id: orderId,
      mp_preference_id: mpData.id,
      mp_init_point: mpData.init_point,
      mp_sandbox_init_point: mpData.sandbox_init_point,
      amount: orderTotal,
      marketplace_commission: commissionOnProducts,
      marketplace_fee_total: marketplaceFee,
      seller_receives: orderTotal - marketplaceFee,
      shipping_cost: shippingCost,
      shipping_seller_share: sellerShippingShare,
      shipping_buyer_share: shippingCost - sellerShippingShare,
      status: "pending",
      seller_id: sellerUuid,
      buyer_id: buyerUuid,
      created_at: new Date().toISOString(),
    });
    if (payErr) {
      console.error("checkout mp payments insert (non-fatal):", payErr);
    }

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return NextResponse.json({
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      order_id: orderId,
    });
  } catch (e) {
    console.error("checkout/mp:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
