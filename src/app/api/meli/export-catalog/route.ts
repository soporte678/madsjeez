import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listMeliCatalogForExport, meliCatalogToCsv } from "@/lib/meli/export-catalog";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const accountId = url.searchParams.get("accountId")?.trim();
    const format = (url.searchParams.get("format") || "csv").toLowerCase();

    if (!accountId) {
      return NextResponse.json({ error: "Falta accountId (cuenta ML origen)." }, { status: 400 });
    }

    const rows = await listMeliCatalogForExport(session.user.id, accountId);
    if (format === "json") {
      return NextResponse.json({ ok: true, count: rows.length, items: rows });
    }

    const csv = meliCatalogToCsv(rows);
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="madsjeez-catalogo-mla-${stamp}.csv"`,
      },
    });
  } catch (e) {
    console.error("meli/export-catalog:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al exportar catálogo" },
      { status: 500 }
    );
  }
}
