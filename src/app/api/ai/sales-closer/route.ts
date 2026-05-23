import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { runSalesCloser } from "@/lib/ai/sales-closer";
import type { SalesCloserChannel } from "@/lib/ai/sales-closer-types";

const CHANNELS = new Set<SalesCloserChannel>([
  "whatsapp",
  "marketplace",
  "instagram",
  "web",
]);

export async function POST(req: NextRequest) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const message = String(body.message ?? "").trim();
  if (!message || message.length > 4000) {
    return NextResponse.json({ error: "invalid_message" }, { status: 400 });
  }

  const conversationId =
    typeof body.conversationId === "string" ? body.conversationId.trim() : undefined;
  const customerId =
    typeof body.customerId === "string" ? body.customerId.trim() : undefined;

  if (!conversationId && !customerId) {
    return NextResponse.json(
      { error: "conversationId_or_customerId_required" },
      { status: 400 }
    );
  }

  const channelRaw = String(body.channel ?? "whatsapp").toLowerCase();
  const channel = CHANNELS.has(channelRaw as SalesCloserChannel)
    ? (channelRaw as SalesCloserChannel)
    : "whatsapp";

  const businessProfile =
    typeof body.businessProfile === "string" ? body.businessProfile.trim() : undefined;

  const sendReply = body.sendReply === true;

  try {
    const result = await runSalesCloser({
      sellerId: auth.ctx.sellerId,
      conversationId,
      customerId,
      message,
      channel,
      businessProfile,
      sendReply,
    });

    return NextResponse.json({
      rubro: result.rubro,
      intencion: result.intencion,
      etapa_lead: result.etapa_lead,
      objecion: result.objecion,
      dato_faltante: result.dato_faltante,
      accion_recomendada: result.accion_recomendada,
      derivar_humano: result.derivar_humano,
      respuesta_cliente: result.respuesta_cliente,
      etiquetas: result.etiquetas,
      meta: {
        usedAi: result.usedAi ?? false,
        model: result.model,
        aiError: result.aiError,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sales_closer_failed";
    const status = msg === "lead_not_found" ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
