import { prisma } from "@/lib/prisma";
import { buildInstanceName, getWhatsappBotEnv } from "./config";
import { getWhatsAppProvider } from "./providers/evolution-provider";

export async function getOrCreateWhatsappSession(sellerId: string) {
  const storeId = sellerId;
  const existing = await prisma.whatsappSession.findUnique({ where: { sellerId } });
  if (existing) return existing;

  const instanceName = buildInstanceName(sellerId);
  return prisma.whatsappSession.create({
    data: {
      sellerId,
      storeId,
      provider: "evolution",
      providerInstanceId: instanceName,
      status: "disconnected",
    },
  });
}

export async function connectSellerWhatsapp(sellerId: string) {
  const env = getWhatsappBotEnv();
  if (!env.evolutionConfigured) {
    throw new Error("evolution_not_configured");
  }

  const session = await getOrCreateWhatsappSession(sellerId);
  const provider = getWhatsAppProvider();
  const result = await provider.createSession(sellerId, session.storeId);

  const updated = await prisma.whatsappSession.update({
    where: { id: session.id },
    data: {
      status: result.status,
      qrCode: result.qrCode ?? null,
      phoneNumber: result.phoneNumber ?? null,
      lastError: result.error ?? null,
      providerInstanceId: result.providerInstanceId,
    },
  });

  return updated;
}

export async function refreshSellerQr(sellerId: string) {
  const session = await getOrCreateWhatsappSession(sellerId);
  const provider = getWhatsAppProvider();
  const result = await provider.getQRCode(session.providerInstanceId);
  return prisma.whatsappSession.update({
    where: { id: session.id },
    data: {
      status: result.status,
      qrCode: result.qrCode ?? null,
      lastError: result.error ?? null,
    },
  });
}

export async function disconnectSellerWhatsapp(sellerId: string) {
  const session = await prisma.whatsappSession.findUnique({ where: { sellerId } });
  if (!session) return null;
  const provider = getWhatsAppProvider();
  await provider.disconnect(session.providerInstanceId);
  return prisma.whatsappSession.update({
    where: { id: session.id },
    data: {
      status: "disconnected",
      qrCode: null,
      lastError: null,
    },
  });
}
