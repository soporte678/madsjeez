import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SellerAuthContext = {
  sellerId: string;
  userId: string;
  email: string;
};

export async function requireSellerSession(): Promise<
  { ok: true; ctx: SellerAuthContext } | { ok: false; status: number; error: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isSeller: true, role: true },
  });

  if (!user) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  const canSell = user.isSeller || user.role === "SELLER" || user.role === "ADMIN";
  if (!canSell) {
    return { ok: false, status: 403, error: "seller_required" };
  }

  return {
    ok: true,
    ctx: { sellerId: user.id, userId: user.id, email: user.email },
  };
}
