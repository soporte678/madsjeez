import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://doweovsukuskflgnxhhn.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvd2VvdnN1a3Vza2ZsZ254aGhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIxOTI3MSwiZXhwIjoyMDkyNzk1MjcxfQ.n_AmXBei2WuvPUWj4fWWtcWBO7cQXOkUi44ygoGJUPo";

export const supabaseService = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
