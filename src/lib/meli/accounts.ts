import { prisma } from "@/lib/prisma";

export type MeliAccountSummary = {
  id: string;
  meliUserId: string;
  nickname: string | null;
  label: string | null;
  isPrimary: boolean;
  expiresAt: string;
  lastCatalogImportAt: string | null;
  linkedProducts: number;
};

export async function listMeliAccountsForUser(userId: string): Promise<MeliAccountSummary[]> {
  const rows = await prisma.sellerMeliOAuth.findMany({
    where: { userId },
    orderBy: [{ isPrimary: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      meliUserId: true,
      nickname: true,
      label: true,
      isPrimary: true,
      expiresAt: true,
      lastCatalogImportAt: true,
      _count: { select: { products: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    meliUserId: r.meliUserId,
    nickname: r.nickname,
    label: r.label,
    isPrimary: r.isPrimary,
    expiresAt: r.expiresAt.toISOString(),
    lastCatalogImportAt: r.lastCatalogImportAt?.toISOString() ?? null,
    linkedProducts: r._count.products,
  }));
}

export async function setPrimaryMeliAccount(userId: string, accountId: string): Promise<void> {
  const owned = await prisma.sellerMeliOAuth.findFirst({
    where: { id: accountId, userId },
    select: { id: true },
  });
  if (!owned) throw new Error("Cuenta de Mercado Libre no encontrada.");

  await prisma.$transaction([
    prisma.sellerMeliOAuth.updateMany({ where: { userId }, data: { isPrimary: false } }),
    prisma.sellerMeliOAuth.update({ where: { id: accountId }, data: { isPrimary: true } }),
  ]);
}

export async function disconnectMeliAccount(userId: string, accountId: string): Promise<void> {
  const row = await prisma.sellerMeliOAuth.findFirst({
    where: { id: accountId, userId },
    select: { id: true, isPrimary: true },
  });
  if (!row) throw new Error("Cuenta no encontrada.");

  await prisma.sellerMeliOAuth.delete({ where: { id: accountId } });

  if (row.isPrimary) {
    const next = await prisma.sellerMeliOAuth.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    if (next) {
      await prisma.sellerMeliOAuth.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
  }
}
