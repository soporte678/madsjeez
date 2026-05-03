const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Check vianferreteria@gmail.com
  const { data: seller, error: sErr } = await supabase
    .from('profiles')
    .select('id, email, name, is_seller')
    .eq('email', 'vianferreteria@gmail.com')
    .maybeSingle();
  console.log('Seller vianferreteria@gmail.com:', seller || 'NOT FOUND', sErr?.message || '');

  // Check bucket
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log('Buckets:', buckets?.map(b => b.name));

  // Count total products
  const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
  console.log('Total products in DB:', count);
}

main();
