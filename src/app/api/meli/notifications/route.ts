import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/meli/notifications
 *
 * Callback de notificaciones de Mercado Libre (IPN). ML envía JSON con al menos
 * `topic` y `resource`; hay que responder **200 lo antes posible** (ideal en menos de ~500 ms)
 * y luego procesar en background si hace falta.
 *
 * Registrar en Developers: Notificaciones callbacks URL →
 * https://www.madsjeez.com.ar/api/meli/notifications
 */
export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (process.env.NODE_ENV === "development" && text) {
      try {
        console.info("[meli notifications]", JSON.parse(text));
      } catch {
        console.info("[meli notifications] body:", text.slice(0, 500));
      }
    }
    // TODO: encolar según topic (items, orders_v2, questions, etc.) y refrescar datos locales
  } catch {
    // igual ACK para que ML no deshabilite el topic por errores transitarios
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}

/** Algunos chequeos de disponibilidad / navegador */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
