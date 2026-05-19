import { CampaignType, type Campaign } from "@prisma/client";

/** Duración máxima de una oferta relámpago creada por el vendedor (48 h). */
export const MAX_FLASH_SALE_MS = 48 * 60 * 60 * 1000;

/** Duración mínima (1 h). */
export const MIN_FLASH_SALE_MS = 60 * 60 * 1000;

export function flashSaleDurationMs(campaign: Pick<Campaign, "startDate" | "endDate">): number {
  return campaign.endDate.getTime() - campaign.startDate.getTime();
}

export function isValidFlashSaleWindow(
  campaign: Pick<Campaign, "type" | "startDate" | "endDate" | "status">,
  now = new Date()
): boolean {
  if (campaign.type !== CampaignType.FLASH_SALE) return false;
  if (campaign.status !== "ACTIVE") return false;
  if (campaign.startDate > now || campaign.endDate < now) return false;
  const duration = flashSaleDurationMs(campaign);
  return duration >= MIN_FLASH_SALE_MS && duration <= MAX_FLASH_SALE_MS;
}

export function formatFlashWindow(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  };
  return `${start.toLocaleString("es-AR", opts)} – ${end.toLocaleString("es-AR", opts)}`;
}
