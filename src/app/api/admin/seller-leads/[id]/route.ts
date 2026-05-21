import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRequest } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

const validStatuses = new Set(["NEW", "CONTACTED", "ACTIVATED", "SELLING"]);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminRequest(request);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { status?: string };
  const status = body.status?.trim().toUpperCase();
  if (!status || !validStatuses.has(status)) {
    return NextResponse.json({ error: "Estado invalido" }, { status: 400 });
  }

  const lead = await prisma.sellerLead.update({
    where: { id },
    data: { status: status as "NEW" | "CONTACTED" | "ACTIVATED" | "SELLING" },
  });

  return NextResponse.json({ lead });
}
