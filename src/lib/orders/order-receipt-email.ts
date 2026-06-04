/**
 * Email transaccional para el comprador (guest o logueado) después de un
 * pago aprobado. Incluye:
 *   - Magic link firmado para ver la orden sin sesión
 *   - Código corto de orden para usar en /orders/lookup
 *   - Invitación opcional para crear contraseña si es invitado
 *
 * Si RESEND_API_KEY no está seteada, loguea la info y no falla.
 */

import { signOrderAccessToken } from "./access-token";

type OrderInfo = {
  orderId: string;
  orderNumber: string;
  buyerEmail: string;
  buyerName?: string;
  total: number;
  items: Array<{ title: string; quantity: number; unitPrice: number }>;
  isGuest: boolean;
};

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://www.madsjeez.com.ar").replace(/\/$/, "");

function moneyAR(n: number): string {
  return `$${Number(n).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}

export async function sendOrderReceiptEmail(info: OrderInfo): Promise<{ ok: boolean; sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  const token = signOrderAccessToken(info.orderId, info.buyerEmail);
  const accessUrl = `${APP_URL}/orders/access?token=${encodeURIComponent(token)}`;
  const lookupUrl = `${APP_URL}/orders/lookup`;
  const claimUrl = info.isGuest
    ? `${APP_URL}/auth/claim-account?email=${encodeURIComponent(info.buyerEmail)}&order=${encodeURIComponent(info.orderNumber)}`
    : null;

  if (!apiKey) {
    console.log(
      "[order-receipt] RESEND_API_KEY no seteada. Magic link generado pero no enviado:",
      accessUrl,
    );
    return { ok: true, sent: false, reason: "no_resend_key" };
  }

  const itemsHtml = info.items
    .map(
      (it) =>
        `<tr>
          <td style="padding:8px 0;color:#0f172a">${escapeHtml(it.title)} × ${it.quantity}</td>
          <td style="padding:8px 0;text-align:right;color:#0f172a;font-weight:600">${moneyAR(it.unitPrice * it.quantity)}</td>
        </tr>`,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#0b0f1a;color:#facc15;padding:24px;border-radius:16px 16px 0 0;text-align:center">
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.04em">MADSJEEZ</div>
      <div style="font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-top:4px">Pago confirmado</div>
    </div>

    <div style="background:#fff;padding:32px 28px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none">
      <h1 style="margin:0 0 8px;font-size:24px;color:#0f172a;font-weight:800;letter-spacing:-0.02em">¡Pago aprobado!</h1>
      <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6">
        Hola${info.buyerName ? ` ${escapeHtml(info.buyerName)}` : ""}, recibimos tu pago. Guardá este email — es tu comprobante.
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:24px 0">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.18em;color:#64748b;margin-bottom:6px">Número de orden</div>
        <div style="font-family:'JetBrains Mono',Menlo,monospace;font-size:16px;font-weight:700;color:#0f172a">${escapeHtml(info.orderNumber)}</div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;border-top:1px solid #e2e8f0">
        ${itemsHtml}
        <tr style="border-top:1px solid #e2e8f0">
          <td style="padding:12px 0 0;font-weight:800;color:#0f172a">Total</td>
          <td style="padding:12px 0 0;text-align:right;font-weight:800;color:#0f172a;font-size:18px">${moneyAR(info.total)}</td>
        </tr>
      </table>

      <a href="${accessUrl}" style="display:block;background:#facc15;color:#0b0f1a;text-decoration:none;text-align:center;padding:14px 24px;border-radius:12px;font-weight:800;letter-spacing:-0.01em;margin:24px 0">
        Ver mi orden
      </a>

      <p style="font-size:12px;color:#64748b;line-height:1.6;margin:16px 0">
        Este link es <strong>privado</strong> y solo funciona desde tu email. Caduca en 90 días.
        Si lo perdés, podés recuperar el acceso desde
        <a href="${lookupUrl}" style="color:#3483FA">${lookupUrl}</a> con tu email y el número de orden de arriba.
      </p>

      ${
        claimUrl
          ? `
        <div style="margin-top:24px;padding:16px;background:#fefce8;border:1px solid #facc15;border-radius:12px">
          <div style="font-weight:800;color:#0b0f1a;margin-bottom:6px;font-size:14px">¿Querés guardar todas tus compras?</div>
          <p style="font-size:13px;color:#475569;margin:0 0 12px;line-height:1.5">
            Creá una contraseña con este mismo email y todas tus órdenes pasadas se vinculan a tu cuenta automáticamente.
          </p>
          <a href="${claimUrl}" style="display:inline-block;background:#0b0f1a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700;font-size:13px">
            Crear contraseña
          </a>
        </div>
      `
          : ""
      }

      <p style="margin-top:32px;font-size:11px;color:#94a3b8;text-align:center;line-height:1.6">
        Madsjeez Marketplace · Argentina<br>
        Si no fuiste vos, contestá este email ahora mismo.
      </p>
    </div>
  </div>
</body></html>`;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM?.trim() || "Madsjeez <noreply@madsjeez.com.ar>";
    await resend.emails.send({
      from,
      to: info.buyerEmail,
      subject: `Pago aprobado · Orden ${info.orderNumber}`,
      html,
    });
    return { ok: true, sent: true };
  } catch (e) {
    console.error("[order-receipt] resend failed:", e instanceof Error ? e.message : e);
    return { ok: false, sent: false, reason: "resend_error" };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
