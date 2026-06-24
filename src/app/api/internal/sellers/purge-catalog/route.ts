import { NextRequest, NextResponse } from "next/server";
import { purgeSellerCatalogByEmail, type SellerCatalogPurgeMode } from "@/lib/seller-catalog-purge";

/**
 * Mismo purge que admin, con secret (curl / cron).
 * Authorization: Bearer {ADMIN_SETUP_SECRET}
 * POST { "email": "vianferreteria@gmail.com", "mode": "delete" }
 */
export async function POST(request: NextRequest) {
  const secret = process.env.INTERNAL_PURGE_SECRET?.trim() || process.env.ADMIN_SETUP_SECRET?.trim();
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!secret || auth !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { email?: string; mode?: SellerCatalogPurgeMode } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "email requerido" }, { status: 400 });
  }

  const mode: SellerCatalogPurgeMode =
    body.mode === "deactivate" ? "deactivate" : "delete";

  try {
    const report = await purgeSellerCatalogByEmail(email, mode);
    return NextResponse.json({ ok: true, report });
  } catch (e) {
    console.error("[internal/sellers/purge-catalog]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al vaciar catálogo" },
      { status: 502 }
    );
  }
}
