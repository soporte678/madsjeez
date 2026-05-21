import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listMeliAccountsForUser } from "@/lib/meli/accounts";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const accounts = await listMeliAccountsForUser(session.user.id);
  const primary = accounts.find((a) => a.isPrimary) || accounts[0] || null;

  return NextResponse.json({
    connected: accounts.length > 0,
    accounts,
    meliUserId: primary?.meliUserId ?? null,
    expiresAt: primary?.expiresAt ?? null,
    accountId: primary?.id ?? null,
  });
}
