import { NextRequest } from "next/server";
import { adminJson, requireAdminRequest } from "@/lib/admin-api";
import { getGoogleMerchantConfigStatus } from "@/lib/google-merchant/config";

export async function GET(request: NextRequest) {
  const ctx = await requireAdminRequest(request);
  if (ctx instanceof Response) return ctx;

  const status = getGoogleMerchantConfigStatus();

  return adminJson(ctx, {
    ...status,
    feedXmlUrl: `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://www.madsjeez.com.ar"}/feeds/google-shopping.xml`,
    contentApi: "v2.1",
    note: "El feed XML sigue disponible; Content API empuja el mismo catálogo vía products.custombatch.",
  });
}
