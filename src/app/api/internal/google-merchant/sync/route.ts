import { NextRequest, NextResponse } from "next/server";
import { getGoogleMerchantConfigStatus } from "@/lib/google-merchant/config";
import { fullMerchantCatalogSync } from "@/lib/google-merchant/sync";

/**
 * Sync programado (cron Railway / GitHub Action).
 * Authorization: Bearer {ADMIN_SETUP_SECRET}
 */
export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_SETUP_SECRET?.trim();
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const cfg = getGoogleMerchantConfigStatus();
  if (!cfg.configured) {
    return NextResponse.json({ error: "Merchant API no configurada", missing: cfg.missing }, { status: 503 });
  }

  try {
    const report = await fullMerchantCatalogSync({ purgeInactive: true });
    return NextResponse.json({ ok: true, report });
  } catch (e) {
    console.error("[internal/google-merchant/sync]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 502 }
    );
  }
}
