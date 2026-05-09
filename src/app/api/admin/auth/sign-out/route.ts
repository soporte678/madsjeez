import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function applyPendingCookies(
  res: NextResponse,
  pending: { name: string; value: string; options: CookieOptions }[]
) {
  pending.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return NextResponse.json({ ok: true });
  }

  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          pendingCookies.push({ name, value, options: options ?? {} })
        );
      },
    },
  });

  await supabase.auth.signOut();

  const res = NextResponse.json({ ok: true });
  applyPendingCookies(res, pendingCookies);
  return res;
}
