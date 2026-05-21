const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      p.id,
      p.title,
      p.sku,
      p.meli_item_id,
      p.category_id,
      c.name AS category_name,
      p.created_at
    FROM products p
    JOIN users u ON u.id = p.seller_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE lower(u.email) = 'vianferreteria@gmail.com'
    ORDER BY p.meli_item_id NULLS LAST, p.created_at DESC
  `);

  const dupes = await prisma.$queryRawUnsafe(`
    SELECT p.meli_item_id, COUNT(*)::int AS qty
    FROM products p
    JOIN users u ON u.id = p.seller_id
    WHERE lower(u.email) = 'vianferreteria@gmail.com'
      AND p.meli_item_id IS NOT NULL
    GROUP BY p.meli_item_id
    HAVING COUNT(*) > 1
    ORDER BY qty DESC, p.meli_item_id
  `);

  console.log(JSON.stringify({ total: rows.length, duplicateGroups: dupes.length, dupes, rows }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
