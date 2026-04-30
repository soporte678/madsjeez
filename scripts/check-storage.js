const { Pool } = require('pg');
const dns = require('dns');

const conns = [
  { label: 'Pooler session 5432', url: 'postgresql://postgres.doweovsukuskflgnxhhn:NXnPpq963f1oFIGI@aws-0-us-east-1.pooler.supabase.com:5432/postgres' },
  { label: 'Pooler transaction 6543', url: 'postgresql://postgres.doweovsukuskflgnxhhn:NXnPpq963f1oFIGI@aws-0-us-east-1.pooler.supabase.com:6543/postgres' },
];

async function tryConn(label, url) {
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
  try {
    // Simple query first
    const r = await pool.query('SELECT current_user');
    console.log(`${label}: connected as ${r.rows[0].current_user}`);
    
    // Try product count
    const products = await pool.query('SELECT count(*) FROM products');
    console.log(`  Products: ${products.rows[0].count}`);
    
    // Try storage schema
    try {
      const buckets = await pool.query('SELECT id, name, public FROM storage.buckets');
      console.log(`  Storage buckets: ${JSON.stringify(buckets.rows)}`);
    } catch (e) {
      console.log(`  Storage schema error: ${e.message}`);
    }
    
    // Try product_images schema
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

async function main() {
  for (const c of conns) {
    await tryConn(c.label, c.url);
    console.log();
  }
}

main();
