const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Find products with MAQJEEZ- or MADSJEEZ- prefix in title
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title')
    .ilike('title', 'MAQJEEZ-%');

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Found ${products?.length || 0} products with MAQJEEZ- prefix in title`);

  let updated = 0;
  for (const product of products || []) {
    // Clean title: remove "MAQJEEZ-XXXXXX - " prefix
    const cleanTitle = product.title.replace(/^MAQJEEZ-\d+\s*-\s*/i, '').trim();
    
    if (cleanTitle !== product.title) {
      const { error: updateErr } = await supabase
        .from('products')
        .update({ title: cleanTitle })
        .eq('id', product.id);
      
      if (updateErr) {
        console.error(`Failed to update ${product.id}:`, updateErr);
      } else {
        console.log(`Updated: "${product.title}" → "${cleanTitle}"`);
        updated++;
      }
    }
  }

  // Also check for MADSJEEZ- prefix (just in case)
  const { data: products2, error: err2 } = await supabase
    .from('products')
    .select('id, title')
    .ilike('title', 'MADSJEEZ-%');

  if (err2) {
    console.error('Error fetching MADSJEEZ products:', err2);
    return;
  }

  console.log(`Found ${products2?.length || 0} products with MADSJEEZ- prefix in title`);

  for (const product of products2 || []) {
    const cleanTitle = product.title.replace(/^MADSJEEZ-\d+\s*-\s*/i, '').trim();
    
    if (cleanTitle !== product.title) {
      const { error: updateErr } = await supabase
        .from('products')
        .update({ title: cleanTitle })
        .eq('id', product.id);
      
      if (updateErr) {
        console.error(`Failed to update ${product.id}:`, updateErr);
      } else {
        console.log(`Updated: "${product.title}" → "${cleanTitle}"`);
        updated++;
      }
    }
  }

  console.log(`\nDone! Updated ${updated} product titles.`);
}

main().catch(console.error);
