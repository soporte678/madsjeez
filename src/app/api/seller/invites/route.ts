import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const makeCode = () => randomBytes(5).toString("hex").toUpperCase();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const invites = await prisma.sellerInvite.findMany({
    where: { ownerUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ invites });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { source?: string; campaignName?: string };
  const invite = await prisma.sellerInvite.create({
    data: {
      code: makeCode(),
      ownerUserId: session.user.id,
      source: body.source?.trim() || "direct",
      campaignName: body.campaignName?.trim() || null,
    },
  });
  return NextResponse.json({ invite }, { status: 201 });
}
