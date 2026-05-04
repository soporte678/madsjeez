import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";

interface CreatePreferenceRequest {
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    seller_id: string;
  }>;
  shipping_cost: number;
  buyer_email: string;
  order_id: string;
}

interface MarketplaceFee {
  amount: number;
}

interface PreferencePayer {
  email: string;
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
  payer: PreferencePayer;
  external_reference: string;
  notification_url: string;
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return: string;
  payment_methods?: {
    excluded_payment_types?: Array<{ id: string }>;
    installments?: number;
  };
}

/**
 * POST /api/seller/payment-gateway/mercadopago/create-preference
 *
 * Modelo Marketplace MercadoPago (split payments):
 *
 * FLUJO DE DINERO:
 *  - El comprador paga: subtotal + shipping_cost (costo total de envío)
 *  - MercadoPago retiene el marketplace_fee y acredita el resto al VENDEDOR
 *  - MadsJeez NUNCA recibe el dinero completo, solo el marketplace_fee
 *
 * CÁLCULO DEL marketplace_fee (lo que queda en la cuenta de MadsJeez):
 *  - 10% del subtotal (comisión por usar el marketplace)
 *  - 50% del shipping_cost (el vendedor absorbe la mitad del costo de envío)
 *  - marketplace_fee = (subtotal * 0.10) + (shipping_cost * 0.50)
 *
 * LO QUE RECIBE EL VENDEDOR (acreditado por MP automáticamente):
 *  - total_cobrado - marketplace_fee
 *  - = (subtotal + shipping_cost) - ((subtotal * 0.10) + (shipping_cost * 0.50))
 *  - = subtotal * 0.90 + shipping_cost * 0.50
 *
 * La preferencia se crea con el ACCESS TOKEN del VENDEDOR (OAuth) para que
 * el dinero vaya directo a su cuenta de MP.
 */
export async function POST(request: Request) {
  try {
    const body: CreatePreferenceRequest = await request.json();
    const { items, shipping_cost, buyer_email, order_id } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No hay items en el carrito" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sellerId = items[0].seller_id;

    // Verificar que el vendedor tenga MercadoPago conectado vía OAuth
    const { data: mpConnection, error: mpError } = await supabaseService
      .from("seller_mercadopago")
      .select("mp_access_token, is_active")
      .eq("seller_id", sellerId)
      .eq("is_active", true)
      .single();

    if (mpError || !mpConnection) {
      return NextResponse.json(
        { error: "El vendedor no tiene MercadoPago conectado. Debe vincular su cuenta desde el panel de vendedor." },
        { status: 400 }
      );
    }

    // ── CÁLCULO DEL SPLIT ──────────────────────────────────────────────────
    // El comprador paga el precio de los productos + el costo total del envío
    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const totalShipping = shipping_cost;

    // El comprador paga todo upfront
    const totalBuyerPays = subtotal + totalShipping;

    // marketplace_fee = 10% sobre productos + 50% del envío que absorbe el vendedor
    // Este monto queda en la cuenta de MadsJeez automáticamente via split
    const commissionOnProducts = Math.round(subtotal * 0.10 * 100) / 100;
    const sellerShippingShare  = Math.round(totalShipping * 0.50 * 100) / 100;
    const marketplaceFee       = commissionOnProducts + sellerShippingShare;

    // Lo que acredita MP al vendedor directamente (sin pasar por MadsJeez)
    const sellerReceives = totalBuyerPays - marketplaceFee;
    // ──────────────────────────────────────────────────────────────────────

    // Items para la preferencia de MP
    const mpItems: Array<{ id: string; title: string; quantity: number; unit_price: number; currency_id: string }> = items.map(item => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: "ARS",
    }));

    // El envío aparece como ítem separado (el comprador lo ve desglosado)
    if (totalShipping > 0) {
      mpItems.push({
        id: "shipping",
        title: "Costo de envío",
        quantity: 1,
        unit_price: totalShipping,
        currency_id: "ARS",
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.madsjeez.com.ar";

    // Preferencia con el token OAuth del VENDEDOR → dinero va a su cuenta
    // marketplace_fee → va a la cuenta de MadsJeez (la del CLIENT_ID de la app)
    const preference: MercadoPagoPreference = {
      items: mpItems,
      marketplace_fee: marketplaceFee,
      payer: {
        email: buyer_email || session.user.email || "",
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

    // Crear preferencia usando el ACCESS TOKEN OAuth del vendedor
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpConnection.mp_access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json();
      console.error("Error creando preferencia de MercadoPago:", errorData);
      return NextResponse.json(
        { error: "Error creando preferencia de pago", details: errorData },
        { status: 500 }
      );
    }

    const mpData = await mpResponse.json();

    // Registrar el pago en nuestra BD (referencia y desglose)
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
      buyer_id: session.user.id,
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
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
