/**
 * GET /api/coupons/campaigns?month=N — plantillas de promoción del mes (~20).
 * month opcional (1-12); por defecto el mes actual. Para el panel del vendedor.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCampaignsForMonth, MONTH_NAMES } from "@/data/coupon-campaigns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const param = Number(new URL(req.url).searchParams.get("month"));
  const month = Number.isInteger(param) && param >= 1 && param <= 12 ? param : new Date().getMonth() + 1;
  return NextResponse.json({
    month,
    monthName: MONTH_NAMES[month - 1],
    templates: getCampaignsForMonth(month),
  });
}
