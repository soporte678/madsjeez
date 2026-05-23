import { prisma } from "@/lib/prisma";
import type { WhatsappSyncJobStatus } from "@prisma/client";
import {
  fetchEvolutionContacts,
  fetchEvolutionContactProfile,
} from "./evolution-api";
import {
  normalizeWhatsappContact,
  resolveContactDisplayName,
  type NormalizedWhatsappContact,
} from "./normalize";


async function enrichContactFromWhatsapp(
  instanceName: string,
  contact: NormalizedWhatsappContact
): Promise<NormalizedWhatsappContact> {
  if (contact.profilePicUrl) return contact;
  try {
    const profile = await fetchEvolutionContactProfile(instanceName, contact.jid);
    if (profile) {
      const url =
        typeof profile.profilePictureUrl === "string"
          ? profile.profilePictureUrl
          : typeof profile.url === "string"
            ? profile.url
            : null;
      if (url) return { ...contact, profilePicUrl: url };
    }
  } catch {
    /* optional */
  }
  return contact;
}

export async function syncContactByJid(
  sellerId: string,
  instanceName: string,
  raw: Record<string, unknown>,
  options?: { enrichProfile?: boolean }
) {
  const normalized = normalizeWhatsappContact(raw);
  if (!normalized) return { skipped: true as const };

  const enriched =
    options?.enrichProfile !== false
      ? await enrichContactFromWhatsapp(instanceName, normalized)
      : normalized;

  return upsertLeadFromContact(sellerId, enriched);
}

async function upsertLeadFromContact(
  sellerId: string,
  c: NormalizedWhatsappContact
) {
  const displayName = resolveContactDisplayName(c);
  const existing = await prisma.whatsappLead.findUnique({
    where: { sellerId_phone: { sellerId, phone: c.phone } },
  });

  const data = {
    jid: c.jid,
    pushName: c.pushName,
    firstName: c.firstName,
    fullName: c.fullName,
    businessName: c.businessName,
    verifiedName: c.verifiedName,
    profilePicUrl: c.profilePicUrl,
    isBusiness: c.isBusiness ?? false,
    whatsappLabels: c.whatsappLabels ?? [],
    about: c.about,
    rawWhatsappData: c.raw,
    lastSyncedAt: new Date(),
    name: displayName,
    source: "whatsapp" as const,
  };

  if (existing) {
    await prisma.whatsappLead.update({
      where: { id: existing.id },
      data: {
        ...data,
        tags: existing.tags,
      },
    });
    return { created: false as const, updated: true as const, leadId: existing.id };
  }

  const lead = await prisma.whatsappLead.create({
    data: {
      sellerId,
      storeId: sellerId,
      phone: c.phone,
      status: "new",
      tags: [],
      ...data,
    },
  });
  return { created: true as const, updated: false as const, leadId: lead.id };
}

export async function syncWhatsappContacts(
  sellerId: string,
  instanceName: string,
  options?: { enrichProfile?: boolean; jobId?: string }
) {
  const job =
    options?.jobId != null
      ? { id: options.jobId }
      : await prisma.whatsappSyncJob.create({
          data: {
            sellerId,
            type: "contacts",
            status: "running",
          },
        });

  const errors: string[] = [];
  let totalFound = 0;
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  try {
    const rawContacts = await fetchEvolutionContacts(instanceName);
    totalFound = rawContacts.length;

    if (rawContacts.length === 0) {
      errors.push(
        "Evolution no devolvió contactos. Puede que la instancia no exponga esta API o la sesión no tenga agenda disponible."
      );
    }

    for (const raw of rawContacts) {
      try {
        const result = await syncContactByJid(sellerId, instanceName, raw, {
          enrichProfile: options?.enrichProfile,
        });
        if ("skipped" in result && result.skipped) {
          totalSkipped++;
          continue;
        }
        if ("created" in result && result.created) totalCreated++;
        else if ("updated" in result && result.updated) totalUpdated++;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : "contact_sync_error");
      }
    }

    const status: WhatsappSyncJobStatus =
      errors.length > 0 && totalCreated + totalUpdated === 0
        ? "failed"
        : errors.length > 0
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
      },
    });

    return {
      jobId: job.id,
      totalFound,
      totalCreated,
      totalUpdated,
      totalSkipped,
      errors,
      status,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "sync_failed";
    await prisma.whatsappSyncJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        errors: [msg],
      },
    });
    throw e;
  }
}
