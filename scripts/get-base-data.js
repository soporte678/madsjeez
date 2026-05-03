const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Get last SKU
  const { data: lastSku, error: skuError } = await supabase
    .from('products')
    .select('sku')
    .ilike('sku', 'MADSJEEZ-%')
    .order('sku', { ascending: false })
    .limit(1);

  if (skuError) {
    console.error('SKU Error:', skuError);
  } else {
    console.log('Last SKU:', lastSku?.[0]?.sku || 'NONE');
  }

  // Get seller
  const { data: seller, error: sellerError } = await supabase
    .from('profiles')
    .select('id, email, name')
    .eq('email', 'vianferreteria@gmail.com')
    .single();

  if (sellerError) {
    console.error('Seller Error:', sellerError);
  } else {
    console.log('Seller ID:', seller?.id);
  }

  // Get a default category
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('id, name, slug')
    .limit(1)
    .single();

  if (catError) {
    console.error('Category Error:', catError);
  } else {
    console.log('Default Category ID:', category?.id);
  }
}

main();
