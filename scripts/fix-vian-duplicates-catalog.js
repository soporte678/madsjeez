const { Pool } = require("pg");

async function ensureCategory(pool, { name, slug, description }) {
  const existing = await pool.query("SELECT id FROM categories WHERE lower(name)=lower($1) LIMIT 1", [name]);
  if (existing.rows[0]?.id) return existing.rows[0].id;

  const created = await pool.query(
    `INSERT INTO categories (id, name, slug, description, created_at, updated_at)
     VALUES ($1, $2, $3, $4, now(), now())
     RETURNING id`,
    [`cat_${slug}_${Date.now()}`, name, slug, description]
  );
  return created.rows[0].id;
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const email = "vianferreteria@gmail.com";

  try {
    const catalogCategoryId = await ensureCategory(pool, {
      name: "Catálogo",
      slug: "catalogo",
      description: "Publicaciones agrupadas por catálogo",
    });
    const standardCategoryId = await ensureCategory(pool, {
      name: "General",
      slug: "general",
      description: "Importación / general",
    });

    const duplicateGroups = await pool.query(
      `
      SELECT p.meli_item_id, ARRAY_AGG(p.id ORDER BY p.created_at DESC) AS product_ids
      FROM products p
      JOIN users u ON u.id = p.seller_id
      WHERE lower(u.email) = lower($1)
        AND p.meli_item_id IS NOT NULL
      GROUP BY p.meli_item_id
      HAVING COUNT(*) > 1
      ORDER BY p.meli_item_id
      `,
      [email]
    );

    let touchedGroups = 0;
    let catalogUpdates = 0;
    let standardUpdates = 0;

    for (const row of duplicateGroups.rows) {
      const ids = row.product_ids || [];
      if (ids.length < 2) continue;

      const catalogId = ids[0];
      const standardIds = ids.slice(1);

      const upCatalog = await pool.query(
        "UPDATE products SET category_id = $1, updated_at = now() WHERE id = $2",
        [catalogCategoryId, catalogId]
      );
      catalogUpdates += upCatalog.rowCount || 0;

      const upStandard = await pool.query(
        "UPDATE products SET category_id = $1, updated_at = now() WHERE id = ANY($2::text[])",
        [standardCategoryId, standardIds]
      );
      standardUpdates += upStandard.rowCount || 0;

      touchedGroups++;
    }

    const verification = await pool.query(
      `
      SELECT p.meli_item_id, p.id, p.title, c.name AS category_name, p.created_at
      FROM products p
      JOIN users u ON u.id = p.seller_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE lower(u.email) = lower($1)
        AND p.meli_item_id IN (
          SELECT p2.meli_item_id
          FROM products p2
          JOIN users u2 ON u2.id = p2.seller_id
          WHERE lower(u2.email)=lower($1) AND p2.meli_item_id IS NOT NULL
          GROUP BY p2.meli_item_id
          HAVING COUNT(*) > 1
        )
      ORDER BY p.meli_item_id, p.created_at DESC
      `,
      [email]
    );

    console.log(
      JSON.stringify(
        {
          email,
          touchedGroups,
          catalogUpdates,
          standardUpdates,
          verification: verification.rows,
        },
        null,
        2
      )
    );
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
