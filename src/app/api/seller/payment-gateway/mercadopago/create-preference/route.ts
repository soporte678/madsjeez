import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
 * Crea una preferencia de pago con split de comisiones
 * - 10% comisión para MadsJeez
 * - Vendedor paga 50% del envío
 * - Comprador paga 50% del envío
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

    const supabase = await createClient();

    // Verificar que el comprador esté autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener el primer vendedor (asumimos un solo vendedor por orden por ahora)
    const sellerId = items[0].seller_id;

    // Verificar que el vendedor tenga MercadoPago conectado
    const { data: mpConnection, error: mpError } = await supabase
      .from("seller_mercadopago")
      .select("mp_access_token, is_active")
      .eq("seller_id", sellerId)
      .eq("is_active", true)
      .single();

    if (mpError || !mpConnection) {
      return NextResponse.json(
        { error: "El vendedor no tiene MercadoPago conectado" },
        { status: 400 }
      );
    }

    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    
    // Comisión del marketplace: 10% del subtotal
    const marketplaceCommission = subtotal * 0.10;
    
    // Split del envío: 50% vendedor, 50% comprador
    const sellerShippingShare = shipping_cost * 0.50;
    const buyerShippingShare = shipping_cost * 0.50;
    
    // Total que paga el comprador
    const total = subtotal + buyerShippingShare;
    
    // Lo que recibe el vendedor después de comisión y su parte del envío
    const sellerReceives = subtotal - marketplaceCommission - sellerShippingShare;

    // Crear items para MercadoPago
    const mpItems = items.map(item => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: "ARS",
    }));

    // Agregar el envío como un item adicional (la parte que paga el comprador)
    if (buyerShippingShare > 0) {
      mpItems.push({
        id: "shipping_buyer_share",
        title: "Envío (50% pagado por comprador)",
        quantity: 1,
        unit_price: buyerShippingShare,
        currency_id: "ARS",
      });
    }

    // Construir la preferencia
    const preference: MercadoPagoPreference = {
      items: mpItems,
      marketplace_fee: marketplaceCommission,
      payer: {
        email: buyer_email || user.email || "",
      },
      external_reference: order_id,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.madsjeez.com.ar"}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.madsjeez.com.ar"}/checkout/success?order_id=${order_id}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.madsjeez.com.ar"}/checkout/failure?order_id=${order_id}`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.madsjeez.com.ar"}/checkout/pending?order_id=${order_id}`,
      },
      auto_return: "approved",
    };

    // Crear preferencia en MercadoPago usando el token del vendedor
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpConnection.mp_access_token}`,
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

    // Guardar información del pago en nuestra base de datos
    const { error: paymentError } = await supabase
      .from("payments")
      .insert({
        order_id: order_id,
        mp_preference_id: mpData.id,
        mp_init_point: mpData.init_point,
        mp_sandbox_init_point: mpData.sandbox_init_point,
        amount: total,
        marketplace_commission: marketplaceCommission,
        seller_receives: sellerReceives,
        shipping_seller_share: sellerShippingShare,
        shipping_buyer_share: buyerShippingShare,
        status: "pending",
        seller_id: sellerId,
        buyer_id: user.id,
        created_at: new Date().toISOString(),
      });

    if (paymentError) {
      console.error("Error guardando información de pago:", paymentError);
      // No fallamos la operación, solo loggeamos
    }

    // Actualizar last_used_at de la conexión del vendedor
    await supabase
      .from("seller_mercadopago")
      .update({ last_used_at: new Date().toISOString() })
      .eq("seller_id", sellerId);

    return NextResponse.json({
      preference_id: mpData.id,
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
      breakdown: {
        subtotal,
        shipping_cost,
        buyer_pays_shipping: buyerShippingShare,
        seller_pays_shipping: sellerShippingShare,
        marketplace_commission: marketplaceCommission,
        total,
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
