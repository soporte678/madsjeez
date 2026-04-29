const { Pool } = require('pg');
const dns = require('dns');

const pass = 'NXnPpq963f1oFIGI';
const proj = 'doweovsukuskflgnxhhn';

const urls = [
  { label: '1. Pooler transaction (6543)', url: `postgresql://postgres.${proj}:${pass}@aws-0-us-east-1.pooler.supabase.com:6543/postgres` },
  { label: '2. Pooler session (5432)', url: `postgresql://postgres.${proj}:${pass}@aws-0-us-east-1.pooler.supabase.com:5432/postgres` },
  { label: '3. Direct (IPv4 forced)', url: `postgresql://postgres:${pass}@db.${proj}.supabase.co:5432/postgres` },
  { label: '4. Direct user=postgres only', url: `postgresql://postgres:${pass}@db.${proj}.supabase.co:6543/postgres` },
];

async function tryConnect(label, connUrl) {
  console.log(`\n${label}`);
  console.log(`  URL: ${connUrl.replace(pass, '****')}`);
  const pool = new Pool({ connectionString: connUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
  try {
    const r = await pool.query('SELECT current_user, current_database()');
    console.log(`  ✅ SUCCESS:`, r.rows[0]);
    await pool.end();
    return true;
  } catch (e) {
    console.log(`  ❌ FAIL: ${e.message}`);
    await pool.end();
    return false;
  }
}

// Also resolve IP for direct host
dns.resolve4(`db.${proj}.supabase.co`, (err, addrs) => {
  if (err) console.log('No IPv4 for direct host:', err.message);
  else console.log('Direct host IPv4:', addrs);
});

(async () => {
  for (const { label, url } of urls) {
    const ok = await tryConnect(label, url);
    if (ok) { console.log('\n🎉 Working connection found!'); break; }
  }
})();
