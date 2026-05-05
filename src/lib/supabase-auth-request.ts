import { createClient } from "@supabase/supabase-js";

/**
 * Resolve Supabase Auth user from `Authorization: Bearer <access_token>`.
 * Used for routes where the client uses Supabase session (not NextAuth).
 */
export async function getSupabaseUserFromBearer(
  request: Request
): Promise<{ id: string; email?: string | null } | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email };
}
