const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check(table) {
  const { data, error } = await supabase.from(table).select('*').limit(1);
  if (error) { console.error(table, error.message); return; }
  if (data && data.length > 0) {
    console.log(table, 'columns:', Object.keys(data[0]).sort().join(', '));
  } else {
    console.log(table, 'empty');
  }
}

async function main() {
  await check('products');
  await check('product_images');
  await check('product_attributes');
  await check('categories');
}

main().catch(console.error);
