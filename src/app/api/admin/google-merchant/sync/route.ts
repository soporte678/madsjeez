import { NextRequest } from "next/server";
import { adminJson, requireAdminRequest } from "@/lib/admin-api";
import { getGoogleMerchantConfigStatus } from "@/lib/google-merchant/config";
import { fullMerchantCatalogSync } from "@/lib/google-merchant/sync";

export async function POST(request: NextRequest) {
  const ctx = await requireAdminRequest(request);
  if (ctx instanceof Response) return ctx;

  const cfg = getGoogleMerchantConfigStatus();
  if (!cfg.configured) {
    return adminJson(
      ctx,
      { error: "Google Merchant Content API no configurada", missing: cfg.missing },
      { status: 503 }
    );
  }

  let body: { limit?: number; purgeInactive?: boolean } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    /* defaults */
  }

  try {
    const report = await fullMerchantCatalogSync({
      limit: body.limit,
      purgeInactive: body.purgeInactive ?? false,
    });
    return adminJson(ctx, { ok: true, report });
  } catch (e) {
    console.error("[google-merchant/sync]", e);
    const message = e instanceof Error ? e.message : "Error al sincronizar con Merchant Center";
    return adminJson(ctx, { ok: false, error: message }, { status: 502 });
  }
}
