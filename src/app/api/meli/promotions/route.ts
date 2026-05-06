import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMeliAccessTokenForUser } from "@/lib/meli/prisma-session";
import { meliGetSellerPromotions } from "@/lib/meli/api";

/** Lista promociones tal cual devuelve Mercado Libre (para auditoría / UI). */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tok = await getMeliAccessTokenForUser(session.user.id);
    if (!tok) {
      return NextResponse.json({ error: "Conectá Mercado Libre primero." }, { status: 400 });
    }

    const res = await meliGetSellerPromotions(tok.accessToken, tok.meliUserId);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Mercado Libre HTTP ${res.status}`, detail: res.data },
        { status: 502 }
      );
    }

    return NextResponse.json(res.data);
  } catch (e) {
    console.error("meli/promotions GET:", e);
    return NextResponse.json({ error: "Error al leer promociones" }, { status: 500 });
  }
}
