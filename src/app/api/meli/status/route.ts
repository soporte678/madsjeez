import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const row = await prisma.sellerMeliOAuth.findUnique({
    where: { userId: session.user.id },
    select: { meliUserId: true, expiresAt: true, updatedAt: true },
  });

  return NextResponse.json({
    connected: Boolean(row),
    meliUserId: row?.meliUserId ?? null,
    expiresAt: row?.expiresAt?.toISOString() ?? null,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  });
}
