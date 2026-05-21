"use server"
import type { FlashShipmentWithRelations } from "./types"
import { generateQrDataUrl } from "./qr"

export async function generateLabelHtml(shipment: FlashShipmentWithRelations, sellerName: string, sellerPhone: string): Promise<string> {
  const qrDataUrl = await generateQrDataUrl(shipment.qrToken)
  const address = [
    `${shipment.street} ${shipment.streetNumber}${shipment.apartment ? `, ${shipment.apartment}` : ""}`,
    `Entre: ${shipment.betweenStreet1} y ${shipment.betweenStreet2}`,
    `${shipment.city}, ${shipment.province}`,
    `CP: ${shipment.postalCode}`,
  ].join("<br/>")

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; background:#fff; }
  .label { width:10cm; min-height:15cm; border:2px solid #000; padding:12px; }
  .header { display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #FFD700; padding-bottom:8px; margin-bottom:8px; }
  .brand { font-size:28px; font-weight:900; letter-spacing:2px; }
  .lightning { font-size:32px; }
  .tagline { font-size:9px; color:#666; text-transform:uppercase; letter-spacing:1px; }
  .section { margin-bottom:10px; }
  .section-title { font-size:9px; text-transform:uppercase; font-weight:700; color:#555; border-bottom:1px solid #ddd; margin-bottom:4px; }
  .recipient-name { font-size:16px; font-weight:700; }
  .detail { font-size:11px; line-height:1.5; }
  .qr-block { text-align:center; margin:8px 0; }
  .qr-block img { width:120px; height:120px; }
  .order-num { font-size:10px; font-weight:700; text-align:center; background:#FFD700; padding:4px; border-radius:4px; margin-top:6px; }
  .sender { font-size:10px; border-top:1px dashed #999; padding-top:6px; color:#444; }
  .badge { display:inline-block; background:#FFD700; color:#000; font-weight:700; font-size:9px; padding:2px 6px; border-radius:3px; margin-bottom:4px; }
</style>
</head>
<body>
<div class="label">
  <div class="header">
    <div>
      <div class="brand">⚡ FLASH</div>
      <div class="tagline">Entrega en menos de 24 hs</div>
    </div>
    <div class="qr-block">
      <img src="${qrDataUrl}" alt="QR"/>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Destinatario</div>
    <div class="badge">ENVÍO FLASH</div>
    <div class="recipient-name">${shipment.recipientName}</div>
    <div class="detail">DNI: ${shipment.recipientDni}</div>
    <div class="detail">📱 WhatsApp: ${shipment.recipientPhone}</div>
  </div>

  <div class="section">
    <div class="section-title">Dirección de entrega</div>
    <div class="detail">${address}</div>
  </div>

  <div class="section">
    <div class="section-title">Remitente</div>
    <div class="sender">${sellerName} · ${sellerPhone}</div>
  </div>

  <div class="order-num">PEDIDO #${shipment.order?.orderNumber ?? shipment.orderId}</div>
  <div style="font-size:8px;text-align:center;color:#999;margin-top:4px;">
    Generada: ${new Date().toLocaleString("es-AR")}
  </div>
</div>
</body>
</html>`
}
