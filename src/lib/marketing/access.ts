import { prisma } from "@/lib/prisma";

export type MarketingPermission = "FULL" | "READ_ONLY";

export type MarketingAccessContext = {
  ownerUserId: string;
  actorUserId: string;
  actorEmail: string | null;
  permission: MarketingPermission;
  viaCollaborator: boolean;
};

export async function resolveMarketingAccess(
  actorUserId: string,
  actorEmail?: string | null
): Promise<MarketingAccessContext> {
  const normalizedEmail = (actorEmail || "").trim().toLowerCase();

  const ownMeli = await prisma.sellerMeliOAuth.findUnique({
    where: { userId: actorUserId },
    select: { userId: true },
  });

  if (ownMeli) {
    return {
      ownerUserId: actorUserId,
      actorUserId,
      actorEmail: normalizedEmail || null,
      permission: "FULL",
      viaCollaborator: false,
    };
  }

  if (normalizedEmail) {
    const collab = await prisma.marketingCollaboratorAccess.findFirst({
      where: {
        collaboratorEmail: normalizedEmail,
        isActive: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (collab) {
      return {
        ownerUserId: collab.ownerId,
        actorUserId,
        actorEmail: normalizedEmail,
        permission: collab.accessLevel,
        viaCollaborator: true,
      };
    }
  }

  return {
    ownerUserId: actorUserId,
    actorUserId,
    actorEmail: normalizedEmail || null,
    permission: "FULL",
    viaCollaborator: false,
  };
}
