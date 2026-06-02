/**
 * GET/PUT /api/seller/payment-gateway/mercadopago/settings
 *
 * Lee y actualiza la configuración de cuotas + medios de pago que el seller
 * ofrece a sus compradores en checkout. Estos valores se inyectan en la
 * preference de Mercado Pago al crear el checkout.
 *
 * - installments_max: tope de cuotas (1..24) o NULL para usar default MP del seller.
 * - accepted_payment_types: array de strings o NULL/[] para aceptar todos.
 * - interest_free_installments: cuotas sin interés que absorbe el seller (informativo).
 *
 * Política: Madsjeez NO cobra comisión por venta — esto solo afecta cómo se
 * cobra al comprador, no qué retiene la plataforma.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const VALID_PAYMENT_TYPES = new Set([
  "credit_card",
  "debit_card",
  "ticket",
  "bank_transfer",
  "atm",
]);

function supabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

const COLUMNS =
  "installments_max, accepted_payment_types_json, interest_free_installments, is_active";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sb = supabaseService();
  const { data, error } = await sb
    .from("seller_mercadopago")
    .select(COLUMNS)
    .eq("seller_id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Lookup falló" }, { status: 500 });
  }

  return NextResponse.json({
    connected: !!data?.is_active,
    installments_max: data?.installments_max ?? null,
    accepted_payment_types: data?.accepted_payment_types_json ?? null,
    interest_free_installments: data?.interest_free_installments ?? null,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Validar installments_max
  let installmentsMax: number | null = null;
  if (body.installments_max != null) {
    const n = Number(body.installments_max);
    if (!Number.isInteger(n) || n < 1 || n > 24) {
      return NextResponse.json(
        { error: "installments_max debe ser entero entre 1 y 24" },
        { status: 400 },
      );
    }
    installmentsMax = n;
  }

  // Validar interest_free_installments
  let interestFree: number | null = null;
  if (body.interest_free_installments != null) {
    const n = Number(body.interest_free_installments);
    if (!Number.isInteger(n) || n < 0 || n > 24) {
      return NextResponse.json(
        { error: "interest_free_installments debe ser entero entre 0 y 24" },
        { status: 400 },
      );
    }
    interestFree = n;
  }

  // Validar accepted_payment_types
  let acceptedTypes: string[] | null = null;
  if (Array.isArray(body.accepted_payment_types)) {
    const filtered = body.accepted_payment_types
      .filter((t): t is string => typeof t === "string")
      .filter((t) => VALID_PAYMENT_TYPES.has(t));
    acceptedTypes = filtered.length > 0 ? filtered : null;
  }

  const sb = supabaseService();
  const { error } = await sb
    .from("seller_mercadopago")
    .update({
      installments_max: installmentsMax,
      accepted_payment_types_json: acceptedTypes,
      interest_free_installments: interestFree,
    })
    .eq("seller_id", userId);

  if (error) {
    return NextResponse.json({ error: "Update falló: " + error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
