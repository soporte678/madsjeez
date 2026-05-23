import { prisma } from "@/lib/prisma";

export type MeliCatalogExportRow = {
  productId: string;
  mla: string;
  sku: string | null;
  title: string;
  price: number;
  stock: number;
  isActive: boolean;
  meliStatus: string | null;
  meliPermalink: string | null;
  sourceAccountId: string;
  sourceAccountLabel: string;
};

export async function listMeliCatalogForExport(
  userId: string,
  accountId: string
): Promise<MeliCatalogExportRow[]> {
  const account = await prisma.sellerMeliOAuth.findFirst({
    where: { id: accountId, userId },
    select: { id: true, nickname: true, label: true, meliUserId: true },
  });
  if (!account) return [];

  const label = account.label || account.nickname || `ML ${account.meliUserId}`;

  const products = await prisma.product.findMany({
    where: {
      sellerId: userId,
      meliOAuthAccountId: accountId,
      meliItemId: { not: null },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      meliItemId: true,
      sku: true,
      title: true,
      price: true,
      stock: true,
      isActive: true,
      meliStatus: true,
      meliPermalink: true,
    },
  });

  return products.map((p) => ({
    productId: p.id,
    mla: p.meliItemId as string,
    sku: p.sku,
    title: p.title,
    price: p.price,
    stock: p.stock,
    isActive: p.isActive,
    meliStatus: p.meliStatus,
    meliPermalink: p.meliPermalink,
    sourceAccountId: account.id,
    sourceAccountLabel: label,
  }));
}

export function meliCatalogToCsv(rows: MeliCatalogExportRow[]): string {
  const header = [
    "product_id",
    "mla",
    "sku",
    "titulo",
    "precio",
    "stock",
    "activo_marketplace",
    "estado_meli",
    "url_meli",
    "cuenta_origen",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.productId,
        r.mla,
        r.sku ?? "",
        csvCell(r.title),
        String(r.price),
        String(r.stock),
        r.isActive ? "1" : "0",
        r.meliStatus ?? "",
        r.meliPermalink ?? "",
        csvCell(r.sourceAccountLabel),
      ].join(",")
    );
  }
  return "\uFEFF" + lines.join("\r\n");
}

function csvCell(value: string): string {
  const v = value.replace(/"/g, '""');
  if (/[",\r\n]/.test(v)) return `"${v}"`;
  return v;
}

/** Normaliza IDs MLA desde CSV, texto pegado o lista. */
export function parseMlaIds(input: string[] | string | undefined): string[] {
  if (!input) return [];
  const raw = Array.isArray(input) ? input.join("\n") : input;
  const found = raw.match(/MLA\d+/gi) ?? [];
  return [...new Set(found.map((x) => x.toUpperCase()))];
}
