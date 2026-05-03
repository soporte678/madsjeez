const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Check profiles table columns
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (pErr) {
    console.error('profiles error:', pErr);
  } else if (profiles && profiles.length > 0) {
    console.log('profiles columns:', Object.keys(profiles[0]));
    console.log('Sample profile:', profiles[0]);
  } else {
    console.log('profiles table empty or not accessible');
  }

  // Check users table
  const { data: users, error: uErr } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (uErr) {
    console.error('users error:', uErr.message);
  } else if (users && users.length > 0) {
    console.log('users columns:', Object.keys(users[0]));
  } else {
    console.log('users table empty or not accessible');
  }

  // Check auth users via RPC
  const { data: authUsers } = await supabase.rpc('get_auth_users');
  console.log('auth users accessible:', !!authUsers);
}

main().catch(console.error);
