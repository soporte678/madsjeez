import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMeliAccessTokenForUser } from "@/lib/meli/prisma-session";
import { syncMeliPromotionsForUser } from "@/lib/meli/promotions-sync";

/** Convierte promociones ML en registros `Campaign` locales (mejora campañas). */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tok = await getMeliAccessTokenForUser(session.user.id);
    if (!tok) {
      return NextResponse.json({ error: "Conectá Mercado Libre primero." }, { status: 400 });
    }

    const out = await syncMeliPromotionsForUser(session.user.id, tok.accessToken, tok.meliUserId);
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    console.error("meli/promotions/sync:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al sincronizar campañas" },
      { status: 500 }
    );
  }
}
