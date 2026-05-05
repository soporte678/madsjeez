const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const connUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
if (!connUrl) {
  console.error('Set DATABASE_URL or SUPABASE_DATABASE_URL in .env.local');
  process.exit(1);
}

async function tryConnect() {
  const pool = new Pool({
    connectionString: connUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  try {
    const r = await pool.query('SELECT current_user, current_database()');
    console.log('✅ SUCCESS:', r.rows[0]);
    await pool.end();
  } catch (e) {
    console.log('❌ FAIL:', e.message);
    await pool.end();
    process.exit(1);
  }
}

tryConnect();
