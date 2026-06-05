/**
 * Helpers para conexión PayPal de un seller.
 *
 * Estrategia simple: cada seller pega su PayPal Business email + merchant ID
 * en /dashboard/tarifas-pagos. Las orders se crean con `payee.email_address`
 * para que el cobro caiga directo en su PayPal.
 *
 * Para OAuth completo (Partner Referrals) hace falta enrollment en PayPal
 * como Partner — proceso largo. Esta implementación usa el modo simple
 * (Direct Payment con payee override) que funciona para start.
 */

import { supabaseService } from "@/lib/supabase/service";

export type SellerPaypalRow = {
  seller_id: string;
  paypal_merchant_id: string | null;
  paypal_email: string | null;
  paypal_access_token: string | null;
  paypal_refresh_token: string | null;
  paypal_expires_at: string | null;
  is_active: boolean;
  default_currency: string;
};

export async function getSellerPaypalConnection(
  sellerId: string,
): Promise<SellerPaypalRow | null> {
  const { data, error } = await supabaseService
    .from("seller_paypal")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    console.error("[paypal] seller lookup error:", error);
    return null;
  }
  return (data as SellerPaypalRow | null) ?? null;
}

export async function upsertSellerPaypal(input: {
  sellerId: string;
  paypalEmail: string;
  merchantId?: string | null;
  currency?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const email = input.paypalEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Email PayPal inválido" };
  }
  const { error } = await supabaseService.from("seller_paypal").upsert(
    {
      seller_id: input.sellerId,
      paypal_email: email,
      paypal_merchant_id: input.merchantId ?? null,
      default_currency: (input.currency ?? "USD").toUpperCase(),
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "seller_id" },
  );
  if (error) {
    console.error("[paypal] seller upsert error:", error);
    return { ok: false, error: "No pudimos guardar la conexión" };
  }
  return { ok: true };
}
