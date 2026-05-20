/**
 * Asigna store_slug a vendedores sin slug.
 * Uso: node scripts/backfill-store-slugs.mjs
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(input) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function main() {
  const sellers = await prisma.user.findMany({
    where: { isSeller: true, storeSlug: null },
    select: { id: true, sellerName: true, name: true },
  });
  console.log(`Vendedores sin slug: ${sellers.length}`);
  for (const s of sellers) {
    const base = slugify(s.sellerName || s.name || "tienda") || `tienda-${s.id.slice(0, 8)}`;
    let slug = base.length >= 3 ? base : `tienda-${s.id.slice(0, 8)}`;
    let n = 0;
    while (n < 30) {
      const trySlug = n === 0 ? slug : `${slug}-${n}`;
      const exists = await prisma.user.findFirst({ where: { storeSlug: trySlug } });
      if (!exists) {
        await prisma.user.update({ where: { id: s.id }, data: { storeSlug: trySlug } });
        console.log(`  ${s.id} → ${trySlug}`);
        break;
      }
      n++;
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
