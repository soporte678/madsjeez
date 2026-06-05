/**
 * Split de checkout marketplace + escrow de comisión afiliado (anti-fraude).
 *
 * Reglas de negocio (auditoría):
 * ---------------------------------------------------------------------------
 * P = product_subtotal (suma de ítems, sin envío)
 * S = shipping_cost total (API logística / regla de negocio; ej. fijo por carrito)
 *
 * 1) El COMPRADOR paga solo la mitad del envío:
 *    buyer_shipping_share = S / 2
 *    total_buyer_charged  = P + buyer_shipping_share
 *
 * 2) La otra mitad del envío la absorbe el VENDEDOR (se descuenta de lo que recibe):
 *    seller_shipping_share = S / 2
 *
 * 3) Comisión de AFILIADO: solo sobre precio de producto (no sobre envío).
 *    affiliate_commission_amount = P * (affiliate_pct / 100)   [si hay afiliado válido]
 *
 * 4) Comisión del MARKETPLACE ("tu fee") sobre producto:
 *    marketplace_sales_fee_amount = P * (marketplace_sales_fee_pct / 100)
 *
 * 5) Neto que debe recibir el vendedor vía split Mercado Pago:
 *    seller_net_payout = P - affiliate_commission_amount - marketplace_sales_fee_amount - seller_shipping_share
 *
 * 6) Lo que retiene la cuenta recolectora del marketplace (marketplace_fee en Checkout Pro):
 *    marketplace_total_retention = total_buyer_charged - seller_net_payout
 *
 *    Identidad (comprobación): marketplace_total_retention = buyer_shipping_share + affiliate_commission_amount
 *                              + marketplace_sales_fee_amount + seller_shipping_share
 */

export type EscrowSplitInput = {
  /** Suma de líneas de producto (sin envío). */
  productSubtotal: number;
  /** Costo total de envío; 0 si gratis. */
  shippingCostFull: number;
  /** Porcentaje afiliado sobre P (0 si no hay referido). Ej: 10 → 10%. */
  affiliateCommissionPercent: number;
  /** Fee del marketplace sobre P. Ej: 5 → 5%. */
  marketplaceSalesFeePercent: number;
};

export type EscrowSplitResult = {
  totalBuyerCharged: number;
  buyerShippingShare: number;
  sellerShippingShare: number;
  affiliateCommissionAmount: number;
  marketplaceSalesFeeAmount: number;
  sellerNetPayout: number;
  marketplaceTotalRetention: number;
};

/** ARS: redondeo a centavos evita drift en MP. */
export function roundMoney(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export function computeCheckoutEscrowSplit(input: EscrowSplitInput): EscrowSplitResult {
  const P = roundMoney(Math.max(0, input.productSubtotal));
  const S = roundMoney(Math.max(0, input.shippingCostFull));

  // El comprador abona el envío completo (precio único). El vendedor no
  // absorbe nada del envío en este modelo.
  const buyerShippingShare = S > 0 ? S : 0;
  const sellerShippingShare = 0;

  const affPct = Math.max(0, Math.min(100, input.affiliateCommissionPercent));
  const mpPct = Math.max(0, Math.min(100, input.marketplaceSalesFeePercent));

  const affiliateCommissionAmount =
    affPct > 0 ? roundMoney((P * affPct) / 100) : 0;
  const marketplaceSalesFeeAmount =
    mpPct > 0 ? roundMoney((P * mpPct) / 100) : 0;

  const totalBuyerCharged = roundMoney(P + buyerShippingShare);

  const sellerNetPayout = roundMoney(
    P - affiliateCommissionAmount - marketplaceSalesFeeAmount - sellerShippingShare
  );

  const marketplaceTotalRetention = roundMoney(totalBuyerCharged - sellerNetPayout);

  // Sanity check (tolerancia por redondeo)
  const expectedRetention = roundMoney(
    buyerShippingShare + affiliateCommissionAmount + marketplaceSalesFeeAmount + sellerShippingShare
  );
  const drift = Math.abs(marketplaceTotalRetention - expectedRetention);
  if (drift > 0.02) {
    console.warn("[escrow-split] Retention identity drift", {
      marketplaceTotalRetention,
      expectedRetention,
      drift,
    });
  }

  return {
    totalBuyerCharged,
    buyerShippingShare,
    sellerShippingShare,
    affiliateCommissionAmount,
    marketplaceSalesFeeAmount,
    sellerNetPayout,
    marketplaceTotalRetention,
  };
}

/** Cookie donde el front guarda el UUID del perfil afiliado (Supabase profiles.id). */
export const AFFILIATE_COOKIE_NAME = "mj_affiliate_id";

export function parseCookieHeader(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const prefix = `${name}=`;
  const raw = parts.find((p) => p.startsWith(prefix));
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw.slice(prefix.length));
  } catch {
    return raw.slice(prefix.length);
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidLike(s: string): boolean {
  return UUID_RE.test(s.trim());
}
