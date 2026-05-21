/**
 * Asigna store_slug a vendedores sin slug.
 * Uso: npm run backfill:store-slugs
 * Requiere DATABASE_URL en .env o .env.local (Prisma 7 + adapter pg).
 */
import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const root = process.cwd();
if (existsSync(resolve(root, ".env.local"))) config({ path: resolve(root, ".env.local") });
else if (existsSync(resolve(root, ".env"))) config({ path: resolve(root, ".env") });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL no configurada");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

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
  const withProducts = await prisma.user.findMany({
    where: {
      products: { some: { isActive: true, images: { some: {} } } },
    },
    select: { id: true, sellerName: true, name: true, storeSlug: true, isSeller: true },
  });

  let promoted = 0;
  for (const s of withProducts) {
    if (!s.isSeller) {
      await prisma.user.update({
        where: { id: s.id },
        data: { isSeller: true, sellerSince: new Date() },
      });
      promoted++;
    }
  }

  const sellers = withProducts.filter((s) => !s.storeSlug);
  console.log(`Cuentas con productos: ${withProducts.length}, sin slug: ${sellers.length}, promovidos isSeller: ${promoted}`);

  let created = 0;
  for (const s of sellers) {
    const base = slugify(s.sellerName || s.name || "tienda") || `tienda-${s.id.slice(0, 8)}`;
    let slug = base.length >= 3 ? base : `tienda-${s.id.slice(0, 8)}`;
    for (let n = 0; n < 30; n++) {
      const trySlug = n === 0 ? slug : `${slug}-${n}`;
      const exists = await prisma.user.findFirst({ where: { storeSlug: trySlug } });
      if (!exists) {
        await prisma.user.update({ where: { id: s.id }, data: { storeSlug: trySlug } });
        console.log(`  ${s.id} → ${trySlug}`);
        created++;
        break;
      }
    }
  }
  console.log(`Slugs creados: ${created}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
