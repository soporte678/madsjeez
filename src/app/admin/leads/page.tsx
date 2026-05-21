import { prisma } from "@/lib/prisma";
import LeadsCRMClient from "./LeadsCRMClient";

export const dynamic = "force-dynamic";

export default async function AdminSellerLeadsPage() {
  const leads = await prisma.sellerLead
    .findMany({
      orderBy: { createdAt: "desc" },
      take: 250,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        businessName: true,
        businessType: true,
        monthlyCatalog: true,
        message: true,
        status: true,
        createdAt: true,
        inviteCode: true,
      },
    })
    .catch(() => []);

  return (
    <LeadsCRMClient
      leads={leads.map((lead) => ({
        ...lead,
        status: lead.status.toString(),
        createdAt: lead.createdAt.toISOString(),
      }))}
    />
  );
}
