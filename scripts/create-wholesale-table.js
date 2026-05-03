const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Create product_wholesale_prices table using raw SQL
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS product_wholesale_prices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        min_quantity INTEGER NOT NULL CHECK (min_quantity > 0),
        price DECIMAL(10,2) NOT NULL CHECK (price > 0),
        label TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(product_id, min_quantity)
      );
      
      CREATE INDEX IF NOT EXISTS idx_wholesale_product ON product_wholesale_prices(product_id);
      CREATE INDEX IF NOT EXISTS idx_wholesale_qty ON product_wholesale_prices(min_quantity);
    `
  });

  if (error) {
    console.error('Error creating table:', error);
    // Try alternative approach
    const { error: err2 } = await supabase.from('product_wholesale_prices').select('id').limit(1);
    if (err2 && err2.code === '42P01') {
      console.log('Table does not exist, trying to create via migration...');
    } else {
      console.log('Table already exists or other error:', err2);
    }
  } else {
    console.log('Table product_wholesale_prices created successfully!');
  }
}

main().catch(console.error);
