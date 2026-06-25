import crypto from "crypto";
import { NextResponse } from "next/server";
import { processMeliNotification } from "@/lib/meli/notifications-handler";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function verifyMeliSignature(req: Request, _rawBody: string): boolean {
  const secret = process.env.MELI_WEBHOOK_SECRET;
  if (!secret) return true; // backward compatible: skip if not configured

  const sigHeader = req.headers.get("x-signature");
  if (!sigHeader) return false;

  let ts: string | undefined;
  let v1: string | undefined;
  for (const part of sigHeader.split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (key === "ts") ts = val;
    else if (key === "v1") v1 = val;
  }
  if (!ts || !v1) return false;

  const dataId = new URL(req.url).searchParams.get("data.id") ?? "";
  const manifest = `id:${dataId};request-id:${req.headers.get("x-request-id") ?? ""};ts:${ts};`;

  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const a = expected.trim().toLowerCase();
  const b = v1.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(a) || !/^[0-9a-f]+$/.test(b) || a.length !== b.length || a.length % 2 !== 0) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const text = await req.text();

    if (!verifyMeliSignature(req, text)) {
      console.warn("[meli notifications] Invalid signature — rejecting");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
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
