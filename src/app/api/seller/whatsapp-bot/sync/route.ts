import { NextRequest, NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";
import { syncWhatsappContacts } from "@/lib/evolution/contactSyncService";
import { syncWhatsappChats, syncWhatsappFull } from "@/lib/evolution/chatHistorySyncService";

async function requireConnectedSession(sellerId: string) {
  const session = await prisma.whatsappSession.findUnique({ where: { sellerId } });
  if (!session || session.status !== "connected") {
    return {
      error: NextResponse.json(
        {
          error: "whatsapp_not_connected",
          message: "Conectá WhatsApp en Configuración antes de sincronizar.",
        },
        { status: 503 }
      ),
    };
  }
  return { session };
}

export async function POST(req: NextRequest) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "contacts");

  const conn = await requireConnectedSession(auth.ctx.sellerId);
  if ("error" in conn) return conn.error;

  const { session } = conn;
  const instanceName = session.providerInstanceId;

  try {
    if (action === "contacts") {
      const result = await syncWhatsappContacts(auth.ctx.sellerId, instanceName, {
        enrichProfile: body.enrichProfile !== false,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "chats" || action === "recent") {
      const result = await syncWhatsappChats(auth.ctx.sellerId, instanceName, session.id, {
        chatLimit: Number(body.chatLimit) || 30,
        messagesPerChat: Number(body.messagesPerChat) || 40,
        includeGroups: body.includeGroups === true,
        enrichProfile: body.enrichProfile !== false,
        phone: typeof body.phone === "string" ? body.phone : undefined,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "full") {
      const result = await syncWhatsappFull(auth.ctx.sellerId, instanceName, session.id, {
        chatLimit: Number(body.chatLimit) || 30,
        messagesPerChat: Number(body.messagesPerChat) || 40,
        includeGroups: body.includeGroups === true,
        enrichProfile: body.enrichProfile !== false,
      });
      return NextResponse.json({ ok: true, ...result });
    }

    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sync_failed";
    return NextResponse.json({ error: msg, message: msg }, { status: 500 });
  }
}
