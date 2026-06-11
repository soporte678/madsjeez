/**
 * /api/saved-searches — búsquedas guardadas del comprador.
 *   GET                          → lista.
 *   POST { query, categorySlug, filters, label, notify } → guardar.
 *   DELETE ?id=                  → eliminar.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { data, error } = await supabaseService
    .from("saved_searches")
    .select("id, label, query, category_slug, filters, notify, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Error" }, { status: 500 });
  return NextResponse.json({ searches: data ?? [] });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const query = typeof b.query === "string" ? b.query.trim().slice(0, 200) : null;
  const categorySlug = typeof b.categorySlug === "string" ? b.categorySlug.slice(0, 120) : null;
  if (!query && !categorySlug) {
    return NextResponse.json({ error: "Búsqueda vacía" }, { status: 400 });
  }
  // Tope por usuario para evitar abuso
  const { count } = await supabaseService
    .from("saved_searches")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.user.id);
  if ((count ?? 0) >= 50) {
    return NextResponse.json({ error: "Llegaste al máximo de búsquedas guardadas" }, { status: 400 });
  }

  const { data, error } = await supabaseService
    .from("saved_searches")
    .insert({
      user_id: session.user.id,
      label: typeof b.label === "string" ? b.label.slice(0, 80) : (query || categorySlug),
      query,
      category_slug: categorySlug,
      filters: b.filters && typeof b.filters === "object" ? b.filters : {},
      notify: b.notify !== false,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  const { error } = await supabaseService
    .from("saved_searches")
    .delete()
    .eq("user_id", session.user.id)
    .eq("id", id);
  if (error) return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
