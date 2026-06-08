/**
 * POST /api/import/commit
 *
 * Crea los productos normalizados (subidos por archivo CSV/Excel) en el
 * catálogo del seller. La lógica vive en lib/import/import-rows.ts y la
 * comparte con la conexión directa OAuth/API.
 *
 * Body JSON: { rows: NormalizedRow[], platform?: string }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { importNormalizedRows } from "@/lib/import/import-rows";
import type { NormalizedRow } from "@/lib/import/platforms";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.isSeller) {
    return NextResponse.json({ error: "Solo vendedores" }, { status: 403 });
  }

  let rows: NormalizedRow[];
  try {
    const body = await req.json();
    rows = body.rows;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No hay productos para importar" }, { status: 400 });
  }

  const summary = await importNormalizedRows(session.user.id, rows);
  return NextResponse.json({ ok: true, ...summary });
}
