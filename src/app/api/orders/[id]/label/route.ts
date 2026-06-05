/**
 * GET /api/orders/[id]/label
 *
 * Genera etiqueta de envío para una orden estándar (no-Flash). Solo el
 * seller del producto puede acceder. Devuelve HTML listo para imprimir
 * (10x15cm formato estándar correo argentino).
 *
 * Para órdenes Flash, usar /api/flash/shipments/[id]/label (ya existe).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function moneyAR(n: number): string {
  return `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        buyer: { select: { name: true, email: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                sellerId: true,
                seller: {
                  select: { id: true, name: true, sellerName: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Solo el seller dueño de los productos puede ver
    const sellerIds = new Set(order.items.map((i) => i.product.sellerId));
    if (sellerIds.size === 0) {
      return NextResponse.json({ error: "Orden sin vendedor" }, { status: 400 });
    }
    if (!sellerIds.has(session.user.id)) {
      return NextResponse.json({ error: "No autorizado para esta orden" }, { status: 403 });
    }

    const seller = order.items[0]?.product.seller;
    const sellerLabel = seller?.sellerName || seller?.name || "Vendedor";
    const itemsTotal = order.items.reduce((s, i) => s + i.quantity, 0);
    const itemsHtml = order.items
      .map(
        (it) =>
          `<tr><td>${escapeHtml(it.product.title)}</td><td style="text-align:right">×${it.quantity}</td></tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Etiqueta ${escapeHtml(order.orderNumber)}</title>
<style>
  @page { size: 10cm 15cm; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; font-family: Arial, sans-serif; }
  body { background:#fff; padding:0; }
  .label { width:10cm; min-height:15cm; padding:10px; border:2px solid #000; }
  .header { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #facc15; padding-bottom:6px; margin-bottom:8px; }
  .brand { font-size:22px; font-weight:900; letter-spacing:1px; }
  .tagline { font-size:8px; color:#666; text-transform:uppercase; letter-spacing:1px; }
  .order-num { font-size:11px; font-weight:700; text-align:center; background:#facc15; padding:5px; border-radius:4px; margin:6px 0; }
  .section { margin-bottom:8px; }
  .section-title { font-size:8px; text-transform:uppercase; font-weight:700; color:#555; border-bottom:1px solid #ddd; margin-bottom:3px; }
  .recipient-name { font-size:14px; font-weight:700; }
  .detail { font-size:10px; line-height:1.4; }
  .items { font-size:9.5px; }
  .items table { width:100%; border-collapse:collapse; }
  .items td { padding:1.5px 0; border-bottom:1px dashed #ddd; }
  .sender { font-size:9px; border-top:1px dashed #999; padding-top:5px; margin-top:8px; color:#444; }
  .footer { text-align:center; font-size:8px; color:#888; margin-top:8px; }
  .badge-free { display:inline-block; background:#10b981; color:#fff; font-weight:700; font-size:8.5px; padding:2px 6px; border-radius:3px; }
  .print-only { display:none; }
  @media print {
    body { padding:0; }
    .label { border:none; }
    .no-print { display:none; }
  }
</style>
</head>
<body>
<div class="label">
  <div class="header">
    <div>
      <div class="brand">MADSJEEZ</div>
      <div class="tagline">Marketplace · Argentina</div>
    </div>
    <div style="font-size:9px; text-align:right;">
      <div><strong>Fecha</strong></div>
      <div>${new Date(order.createdAt).toLocaleDateString("es-AR")}</div>
    </div>
  </div>

  <div class="order-num">Orden ${escapeHtml(order.orderNumber)}</div>

  <div class="section">
    <div class="section-title">Destinatario</div>
    <div class="recipient-name">${escapeHtml(order.shippingName)}</div>
    <div class="detail">${escapeHtml(order.shippingAddress)}</div>
    <div class="detail">${escapeHtml(order.shippingCity)}, ${escapeHtml(order.shippingState)} · CP ${escapeHtml(order.shippingZip)}</div>
    <div class="detail">Tel: ${escapeHtml(order.shippingPhone)}</div>
    ${order.buyer?.email ? `<div class="detail">Email: ${escapeHtml(order.buyer.email)}</div>` : ""}
  </div>

  <div class="section items">
    <div class="section-title">Contenido (${itemsTotal} unidad${itemsTotal > 1 ? "es" : ""})</div>
    <table>${itemsHtml}</table>
  </div>

  <div class="section">
    <div class="section-title">Resumen</div>
    <div class="detail">Subtotal: <strong>${moneyAR(Number(order.subtotal))}</strong></div>
    <div class="detail">Envío: ${Number(order.shippingCost) === 0 ? '<span class="badge-free">GRATIS</span>' : `<strong>${moneyAR(Number(order.shippingCost))}</strong>`}</div>
    <div class="detail" style="font-size:11px;">Total: <strong>${moneyAR(Number(order.total))}</strong></div>
  </div>

  <div class="sender">
    <strong>Remitente:</strong> ${escapeHtml(sellerLabel)}<br/>
    Madsjeez Marketplace · madsjeez.com.ar
  </div>

  <div class="footer">Pegar este lado hacia afuera · Llevar al correo / chofer</div>
</div>

<div class="no-print" style="text-align:center; padding:20px;">
  <button onclick="window.print()" style="padding:12px 24px; background:#0b0f1a; color:#facc15; border:none; border-radius:8px; font-weight:bold; font-size:14px; cursor:pointer;">
    🖨 Imprimir etiqueta
  </button>
</div>

<script>
  // Auto-print en producción si query ?autoprint=1
  if (new URLSearchParams(location.search).get('autoprint') === '1') {
    setTimeout(() => window.print(), 400);
  }
</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    logger.error("orders/label:", e);
    return NextResponse.json({ error: "Error generando etiqueta" }, { status: 500 });
  }
}
