const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const url = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
if (!url) {
  console.error('Set DATABASE_URL or SUPABASE_DATABASE_URL');
  process.exit(1);
}

const conns = [
  { label: 'Database', url },
];

async function tryConn(label, connUrl) {
  const pool = new Pool({ connectionString: connUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
  try {
    const r = await pool.query('SELECT current_user');
    console.log(`${label}: connected as ${r.rows[0].current_user}`);

    const products = await pool.query('SELECT count(*) FROM products');
    console.log(`  Products: ${products.rows[0].count}`);

    try {
      const buckets = await pool.query('SELECT id, name, public FROM storage.buckets');
      console.log(`  Storage buckets: ${JSON.stringify(buckets.rows)}`);
    } catch (e) {
      console.log(`  Storage schema error: ${e.message}`);
    }

    const imgs = await pool.query('SELECT count(*) FROM product_images');
    console.log(`  Product images: ${imgs.rows[0].count}`);

    await pool.end();
    return true;
  } catch (e) {
    console.log(`${label}: FAILED - ${e.message}`);
    await pool.end();
    return false;
  }
}

(async () => {
  for (const c of conns) {
    await tryConn(c.label, c.url);
  }
})();
