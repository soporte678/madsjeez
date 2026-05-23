import { prisma } from "@/lib/prisma";
import type { WhatsappMessageSource, WhatsappSyncJobStatus } from "@prisma/client";
import { fetchEvolutionChats, fetchEvolutionMessages } from "./evolution-api";
import { syncContactByJid, syncWhatsappContacts } from "./contactSyncService";
import {
  isGroupJid,
  jidToPhone,
  normalizeWhatsappMessage,
  normalizeWhatsappContact,
} from "./normalize";

export type ChatSyncOptions = {
  chatLimit?: number;
  messagesPerChat?: number;
  includeGroups?: boolean;
  enrichProfile?: boolean;
  jobId?: string;
  phone?: string;
};

export async function syncWhatsappMessagesForChat(
  sellerId: string,
  instanceName: string,
  sessionId: string,
  remoteJid: string,
  options?: { limit?: number; messagesPerChat?: number }
) {
  const limit = options?.limit ?? options?.messagesPerChat ?? 50;
  const rawMessages = await fetchEvolutionMessages(instanceName, remoteJid, limit);

  if (rawMessages.length === 0) {
    return {
      imported: 0,
      skipped: 0,
      noHistory: true,
      message:
        "Esta instancia de Evolution no devolvió historial anterior. El sistema seguirá capturando mensajes nuevos por webhook.",
    };
  }

  const phone = jidToPhone(remoteJid);
  let lead = await prisma.whatsappLead.findUnique({
    where: { sellerId_phone: { sellerId, phone } },
  });
  if (!lead) {
    const upsert = await syncContactByJid(sellerId, instanceName, { remoteJid, jid: remoteJid });
    if ("leadId" in upsert) {
      lead = await prisma.whatsappLead.findUnique({ where: { id: upsert.leadId } });
    }
  }
  if (!lead) {
    lead = await prisma.whatsappLead.create({
      data: {
        sellerId,
        storeId: sellerId,
        phone,
        jid: remoteJid,
        source: "whatsapp",
        status: "new",
      },
    });
  }

  let conversation = await prisma.whatsappConversation.findUnique({
    where: { sellerId_phone: { sellerId, phone } },
  });
  if (!conversation) {
    conversation = await prisma.whatsappConversation.create({
      data: {
        sellerId,
        storeId: sellerId,
        leadId: lead.id,
        whatsappSessionId: sessionId,
        phone,
        status: "bot_active",
      },
    });
  }

  let imported = 0;
  let skipped = 0;

  for (const raw of rawMessages) {
    const norm = normalizeWhatsappMessage(raw as Record<string, unknown>);
    if (!norm) {
      skipped++;
      continue;
    }

    if (norm.providerMessageId) {
      const dup = await prisma.whatsappMessage.findFirst({
        where: { providerMessageId: norm.providerMessageId },
      });
      if (dup) {
        skipped++;
        continue;
      }
    } else {
      const dup = await prisma.whatsappMessage.findFirst({
        where: {
          conversationId: conversation.id,
          content: norm.body,
          createdAt: {
            gte: new Date(norm.timestamp.getTime() - 60_000),
            lte: new Date(norm.timestamp.getTime() + 60_000),
          },
        },
      });
      if (dup) {
        skipped++;
        continue;
      }
    }

    await prisma.whatsappMessage.create({
      data: {
        conversationId: conversation.id,
        direction: norm.direction,
        senderType: norm.senderType,
        content: norm.body,
        messageType: "text",
        source: "history_sync" satisfies WhatsappMessageSource,
        providerMessageId: norm.providerMessageId,
        remoteJid: norm.remoteJid,
        metadata: norm.raw,
        createdAt: norm.timestamp,
      },
    });
    imported++;
  }

  if (imported > 0) {
    const last = await prisma.whatsappMessage.findFirst({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
    });
    await prisma.whatsappConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: last?.createdAt ?? new Date() },
    });
    await prisma.whatsappLead.update({
      where: { id: lead.id },
      data: { lastMessageAt: last?.createdAt ?? new Date() },
    });
  }

  return { imported, skipped, noHistory: false };
}

export async function syncWhatsappChats(
  sellerId: string,
  instanceName: string,
  sessionId: string,
  options: ChatSyncOptions = {}
) {
  const job =
    options.jobId != null
      ? { id: options.jobId }
      : await prisma.whatsappSyncJob.create({
          data: { sellerId, type: "chats", status: "running" },
        });

  const errors: string[] = [];
  let totalFound = 0;
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let noHistoryWarning = false;

  try {
    let chats = await fetchEvolutionChats(instanceName);
    totalFound = chats.length;

    if (options.phone) {
      const digits = options.phone.replace(/\D/g, "");
      chats = chats.filter((c) => {
        const jid = String(c.remoteJid ?? c.id ?? c.jid ?? "");
        return jidToPhone(jid).includes(digits);
      });
    }

    const chatLimit = options.chatLimit ?? 30;
    chats = chats.slice(0, chatLimit);

    if (chats.length === 0) {
      errors.push(
        "Evolution no devolvió chats. El historial puede no estar disponible en esta versión."
      );
      noHistoryWarning = true;
    }

    for (const chat of chats) {
      const jid = String(chat.remoteJid ?? chat.id ?? chat.jid ?? "");
      if (!jid) continue;
      if (!options.includeGroups && isGroupJid(jid)) {
        totalSkipped++;
        continue;
      }

      try {
        const contactNorm = normalizeWhatsappContact(chat as Record<string, unknown>);
        if (contactNorm) {
          const r = await syncContactByJid(sellerId, instanceName, chat as Record<string, unknown>, {
            enrichProfile: options.enrichProfile,
          });
          if ("created" in r && r.created) totalCreated++;
          else if ("updated" in r && r.updated) totalUpdated++;
        }

        const msgResult = await syncWhatsappMessagesForChat(
          sellerId,
          instanceName,
          sessionId,
          jid,
          { messagesPerChat: options.messagesPerChat ?? 40 }
        );
        if (msgResult.noHistory) noHistoryWarning = true;
        totalUpdated += msgResult.imported;
        totalSkipped += msgResult.skipped;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : "chat_sync_error");
      }
    }

    const status: WhatsappSyncJobStatus =
      errors.length > 0 && totalUpdated === 0 && totalCreated === 0
        ? "failed"
        : errors.length > 0 || noHistoryWarning
          ? "partial_error"
          : "completed";

    await prisma.whatsappSyncJob.update({
      where: { id: job.id },
      data: {
        status,
        finishedAt: new Date(),
        totalFound,
        totalCreated,
        totalUpdated,
        totalSkipped,
        errors,
        metadata: { noHistoryWarning },
      },
    });

    return {
      jobId: job.id,
      totalFound,
      totalCreated,
      totalUpdated,
      totalSkipped,
      errors,
      noHistoryWarning,
      status,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sync_failed";
    await prisma.whatsappSyncJob.update({
      where: { id: job.id },
      data: { status: "failed", finishedAt: new Date(), errors: [msg] },
    });
    throw e;
  }
}

export async function syncWhatsappFull(
  sellerId: string,
  instanceName: string,
  sessionId: string,
  options: ChatSyncOptions = {}
) {
  const job = await prisma.whatsappSyncJob.create({
    data: { sellerId, type: "full", status: "running" },
  });

  const contacts = await syncWhatsappContacts(sellerId, instanceName, {
    enrichProfile: options.enrichProfile,
    jobId: job.id,
  });

  const chats = await syncWhatsappChats(sellerId, instanceName, sessionId, {
    ...options,
    jobId: job.id,
  });

  await prisma.whatsappSyncJob.update({
    where: { id: job.id },
    data: {
      status: chats.status === "failed" && contacts.status === "failed" ? "failed" : "completed",
      finishedAt: new Date(),
      totalFound: contacts.totalFound + chats.totalFound,
      totalCreated: contacts.totalCreated + chats.totalCreated,
      totalUpdated: contacts.totalUpdated + chats.totalUpdated,
      totalSkipped: contacts.totalSkipped + chats.totalSkipped,
      errors: [...contacts.errors, ...chats.errors],
      metadata: { contacts, chats },
    },
  });

  return { jobId: job.id, contacts, chats };
}

export { syncWhatsappMessagesForChat as syncRecentMessages };
