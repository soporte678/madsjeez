import { NextResponse } from "next/server";
import { processMeliNotification } from "@/lib/meli/notifications-handler";

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
