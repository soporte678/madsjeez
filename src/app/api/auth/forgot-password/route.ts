/**
 * POST /api/auth/forgot-password
 *
 * Genera token + manda email con link de reset.
 * Si el email no existe, devuelve igual 200 ok (no revela existencia).
 * Rate limit: 3 intentos por IP por 15 min.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIpFromRequest } from "@/lib/rate-limit";
import { signResetToken } from "@/lib/auth/password-reset-token";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://www.madsjeez.com.ar").replace(/\/$/, "");

export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);
  const { allowed, retryAfter } = rateLimit(`forgot-pw:${ip}`, 3, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { email?: string };
    const email = (body.email ?? "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    // Respuesta genérica (no revela si el email existe)
    const generic = NextResponse.json({
      ok: true,
      message: "Si el email está registrado, te enviamos un link para resetear la contraseña.",
    });

    if (!user) {
      logger.debug("forgot-pw: email no encontrado (sin revelar cuál)");
      return generic;
    }

    const token = signResetToken(email);
    const resetUrl = `${APP_URL}/auth/reset-password?token=${encodeURIComponent(token)}`;

    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      logger.warn("forgot-pw: RESEND_API_KEY no seteada — link generado pero no enviado", {
        email: email.slice(0, 3) + "***",
      });
      return generic;
    }

    try {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      const from = process.env.RESEND_FROM?.trim() || "Madsjeez <noreply@madsjeez.com.ar>";

      await resend.emails.send({
        from,
        to: email,
        subject: "Resetear tu contraseña · Madsjeez",
        html: buildEmail({ name: user.name, resetUrl }),
      });
    } catch (e) {
      logger.error("forgot-pw: resend failed:", e instanceof Error ? e.message : e);
    }

    return generic;
  } catch (e) {
    logger.error("forgot-pw error:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

function buildEmail({ name, resetUrl }: { name: string | null; resetUrl: string }): string {
  const greet = name ? `Hola ${escapeHtml(name)},` : "Hola,";
  return `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="background:#0b0f1a;padding:24px;border-radius:16px 16px 0 0;text-align:center">
      <div style="font-size:24px;font-weight:900;letter-spacing:-0.04em;color:#3b82f6">MADSJEEZ</div>
      <div style="font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-top:4px">Resetear contraseña</div>
    </div>

    <div style="background:#fff;padding:32px 28px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none">
      <p style="margin:0 0 16px;color:#0f172a;font-size:15px">${greet}</p>
      <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6">
        Recibimos un pedido para resetear la contraseña de tu cuenta Madsjeez. Si fuiste vos,
        hacé click acá abajo dentro de la próxima hora.
      </p>

      <a href="${resetUrl}" style="display:block;background:#3b82f6;color:#fff;text-decoration:none;text-align:center;padding:14px 24px;border-radius:12px;font-weight:800;letter-spacing:-0.01em;margin:24px 0">
        Resetear contraseña
      </a>

      <p style="font-size:12px;color:#64748b;line-height:1.6;margin:16px 0 0">
        El link caduca en 1 hora. Si no fuiste vos quien lo pidió, podés ignorar este email
        — tu contraseña actual sigue intacta.
      </p>

      <p style="margin-top:32px;font-size:11px;color:#94a3b8;text-align:center">
        Madsjeez Marketplace · Argentina
      </p>
    </div>
  </div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
