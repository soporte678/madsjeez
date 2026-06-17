import { NextResponse } from "next/server";
import { processMeliNotification } from "@/lib/meli/notifications-handler";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const text = await req.text();
    let payload: Record<string, unknown> = {};
    if (text) {
      try {
        payload = JSON.parse(text) as Record<string, unknown>;
      } catch {
        payload = {};
      }
    }

    // Validar que el user_id esté presente
    if (!payload.user_id) {
      console.warn("[meli notifications] Missing user_id in payload — silent 200");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Verificar que el seller existe en nuestra DB antes de procesar
    const { data: sellerExists } = await supabaseService
      .from("profiles")
      .select("id")
      .eq("meli_user_id", String(payload.user_id))
      .maybeSingle();

    if (!sellerExists) {
      console.warn("[meli notifications] Unknown seller user_id:", payload.user_id, "— silent 200");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    void processMeliNotification({
      topic: typeof payload.topic === "string" ? payload.topic : undefined,
      resource: typeof payload.resource === "string" ? payload.resource : undefined,
      user_id: payload.user_id as number | string | undefined,
    }).catch((e) => console.error("[meli notifications]", e));
  } catch {
    /* ACK igual */
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
