import { NextRequest, NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";
import type { WhatsappLeadStatus } from "@prisma/client";

const STATUSES: WhatsappLeadStatus[] = [
  "new",
  "warm",
  "hot",
  "customer",
  "closed",
  "lost",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: {
    status?: WhatsappLeadStatus;
    name?: string;
    assignedTo?: string | null;
    internalNotes?: string | null;
    tags?: string[];
    email?: string | null;
    company?: string | null;
  } = {};

  if (typeof body.status === "string" && STATUSES.includes(body.status as WhatsappLeadStatus)) {
    data.status = body.status as WhatsappLeadStatus;
  }
  if (typeof body.name === "string") data.name = body.name.slice(0, 120);
  if (body.assignedTo === null || typeof body.assignedTo === "string") {
    data.assignedTo = body.assignedTo;
  }
  if (body.internalNotes === null || typeof body.internalNotes === "string") {
    data.internalNotes = body.internalNotes;
  }
  if (Array.isArray(body.tags)) {
    data.tags = body.tags.map((t: unknown) => String(t).slice(0, 40)).slice(0, 12);
  }
  if (body.email === null || typeof body.email === "string") data.email = body.email;
  if (body.company === null || typeof body.company === "string") data.company = body.company;

  const lead = await prisma.whatsappLead.updateMany({
    where: { id, sellerId: auth.ctx.sellerId },
    data,
  });

  if (lead.count === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updated = await prisma.whatsappLead.findUnique({ where: { id } });
  return NextResponse.json({ lead: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const deleted = await prisma.whatsappLead.deleteMany({
    where: { id, sellerId: auth.ctx.sellerId },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
