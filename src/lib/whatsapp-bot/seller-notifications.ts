import { prisma } from "@/lib/prisma";
import { getWhatsappBotEnv } from "./config";
import { notifySellerByEmail } from "./seller-email";

type WhatsappNotifyTopic =
  | "new_message"
  | "handoff_requested"
  | "lead_hot"
  | "session_disconnected";

export async function notifySellerWhatsapp(params: {
  sellerId: string;
  conversationId: string;
  topic: WhatsappNotifyTopic;
  title: string;
  message: string;
  sendEmail?: boolean;
}) {
  const { appBase } = getWhatsappBotEnv();
  const dashboardLink = `${appBase}/dashboard#whatsapp-bot`;

  try {
    await prisma.notification.create({
      data: {
        userId: params.sellerId,
        type: "whatsapp",
        topic: params.topic,
        resourceId: params.conversationId,
        title: params.title,
        message: params.message,
        webhookUrl: dashboardLink,
      },
    });
  } catch (e) {
    console.error("[whatsapp-bot] notification create failed", e instanceof Error ? e.message : e);
  }

  if (params.sendEmail) {
    await notifySellerByEmail({
      sellerId: params.sellerId,
      subject: params.title,
      htmlBody: `<p>${params.message}</p><p><a href="${dashboardLink}">Abrir Bot de WhatsApp en Madsjeez</a></p>`,
    });
  }
}
