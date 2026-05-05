import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with service role. Never import in client components.
 * Requires env vars — no hardcoded fallbacks.
 */
function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Configure server environment variables."
    );
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

let _supabaseService: SupabaseClient | null = null;

export function getSupabaseService(): SupabaseClient {
  if (!_supabaseService) {
    _supabaseService = createServiceClient();
  }
  return _supabaseService;
}

/** Use in API routes / server code only. Lazily initialized on first access. */
export const supabaseService: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseService();
    const value = Reflect.get(client as object, prop, receiver);
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
}) as SupabaseClient;
