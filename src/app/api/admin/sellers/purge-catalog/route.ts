import { NextRequest } from "next/server";
import { adminJson, requireAdminRequest } from "@/lib/admin-api";
import { purgeSellerCatalogByEmail, type SellerCatalogPurgeMode } from "@/lib/seller-catalog-purge";

/**
 * Vacía el catálogo de un vendedor por email (admin logueado).
 * POST { "email": "vianferreteria@gmail.com", "mode": "delete" | "deactivate" }
 */
export async function POST(request: NextRequest) {
  const ctx = await requireAdminRequest(request);
  if (ctx instanceof Response) return ctx;

  let body: { email?: string; mode?: SellerCatalogPurgeMode } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return adminJson(ctx, { error: "JSON inválido" }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return adminJson(ctx, { error: "email requerido" }, { status: 400 });
  }

  const mode: SellerCatalogPurgeMode =
    body.mode === "deactivate" ? "deactivate" : "delete";

  try {
    const report = await purgeSellerCatalogByEmail(email, mode);
    return adminJson(ctx, { ok: true, report });
  } catch (e) {
    console.error("[admin/sellers/purge-catalog]", e);
    const message = e instanceof Error ? e.message : "Error al vaciar catálogo";
    return adminJson(ctx, { ok: false, error: message }, { status: 502 });
  }
}
