import { prisma } from "@/lib/prisma";

export async function notifySellerByEmail(params: {
  sellerId: string;
  subject: string;
  htmlBody: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

  const user = await prisma.user.findUnique({
    where: { id: params.sellerId },
    select: { email: true, sellerName: true, name: true },
  });
  if (!user?.email) return;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM?.trim() || "Madsjeez <noreply@madsjeez.com.ar>";

    await resend.emails.send({
      from,
      to: user.email,
      subject: params.subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:16px">
          <p>Hola ${user.sellerName || user.name || ""},</p>
          ${params.htmlBody}
          <p style="color:#666;font-size:12px;margin-top:24px">Madsjeez — Bot de WhatsApp</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("[whatsapp-bot] email failed", e instanceof Error ? e.message : e);
  }
}
