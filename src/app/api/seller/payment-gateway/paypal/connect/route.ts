/**
 * POST /api/seller/payment-gateway/paypal/connect
 *
 * El seller pega su email de PayPal Business + merchant ID opcional.
 * Guarda la conexión en seller_paypal.
 *
 * Validación: hacemos un GET dummy contra api PayPal con nuestras
 * credenciales para confirmar que la cuenta destino existe (no que es la
 * suya — eso requiere OAuth Partner). Por ahora confiamos en el email.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { upsertSellerPaypal, getSellerPaypalConnection } from "@/lib/paypal/seller-connection";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const conn = await getSellerPaypalConnection(session.user.id);
  return NextResponse.json({
    connected: !!conn,
    email: conn?.paypal_email ?? null,
    merchantId: conn?.paypal_merchant_id ?? null,
    currency: conn?.default_currency ?? "USD",
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  let body: { email?: string; merchantId?: string; currency?: string };
  try {
    body = (await req.json()) as { email?: string; merchantId?: string; currency?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!body.email) {
    return NextResponse.json({ error: "Email PayPal es requerido" }, { status: 400 });
  }
  const r = await upsertSellerPaypal({
    sellerId: session.user.id,
    paypalEmail: body.email,
    merchantId: body.merchantId,
    currency: body.currency,
  });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { supabaseService } = await import("@/lib/supabase/service");
  await supabaseService
    .from("seller_paypal")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("seller_id", session.user.id);
  return NextResponse.json({ ok: true });
}
