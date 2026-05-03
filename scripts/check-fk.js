const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Find an existing seller user
  const { data: users } = await supabase.from('users').select('id, email, is_seller').eq('is_seller', true).limit(3);
  console.log('Seller users:', users);

  // Check if vianferreteria exists in users
  const { data: vian } = await supabase.from('users').select('id, email').eq('email', 'vianferreteria@gmail.com').maybeSingle();
  console.log('Vian in users:', vian);

  // Check profiles link
  const { data: profiles } = await supabase.from('profiles').select('id, user_id, email').eq('email', 'vianferreteria@gmail.com').maybeSingle();
  console.log('Vian in profiles:', profiles);
}

main().catch(console.error);
