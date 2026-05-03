const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Get seller
  const { data: seller } = await supabase
    .from('users')
    .select('id')
    .eq('email', 'vianferreteria@gmail.com')
    .maybeSingle();

  if (!seller) {
    console.log('Seller not found');
    return;
  }

  // Get all products for this seller ordered by SKU
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, sku')
    .eq('seller_id', seller.id)
    .ilike('sku', 'MADSJEEZ-%')
    .order('sku', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total products with MADSJEEZ- SKU: ${products?.length || 0}`);

  // Find duplicates by title
  const seen = new Map();
  const duplicates = [];

  for (const product of products || []) {
    if (seen.has(product.title)) {
      duplicates.push(product);
    } else {
      seen.set(product.title, product.id);
    }
  }

  console.log(`Unique products: ${seen.size}`);
  console.log(`Duplicate products to remove: ${duplicates.length}`);

  if (duplicates.length === 0) {
    console.log('No duplicates found!');
    return;
  }

  // Delete duplicates
  let deleted = 0;
  for (const dup of duplicates) {
    // Delete images first
    await supabase.from('product_images').delete().eq('product_id', dup.id);
    // Delete attributes
    await supabase.from('product_attributes').delete().eq('product_id', dup.id);
    // Delete product
    const { error: delErr } = await supabase.from('products').delete().eq('id', dup.id);
    
    if (delErr) {
      console.error(`Failed to delete ${dup.title} (${dup.sku}):`, delErr);
    } else {
      console.log(`Deleted duplicate: ${dup.title} (${dup.sku})`);
      deleted++;
    }
  }

  console.log(`\nDone! Deleted ${deleted}/${duplicates.length} duplicate products.`);
  console.log(`Remaining unique products: ${seen.size}`);
}

main().catch(console.error);
