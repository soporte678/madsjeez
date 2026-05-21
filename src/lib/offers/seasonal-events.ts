export type SeasonalEventSlug =
  | "black_friday"
  | "cyber_monday"
  | "hot_sale"
  | "navidad"
  | "liquidacion"
  | "dia_madre";

export type SeasonalEvent = {
  slug: SeasonalEventSlug;
  name: string;
  badge: string;
  badgeColor: "hot" | "flash" | "day" | "top";
  /** Mes 1-12 */
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  keywords: string[];
};

/** Calendario comercial Argentina — ventanas aproximadas por año. */
export const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    slug: "hot_sale",
    name: "Hot Sale",
    badge: "HOT SALE",
    badgeColor: "hot",
    startMonth: 5,
    startDay: 15,
    endMonth: 5,
    endDay: 31,
    keywords: ["hot sale", "hot_sale", "hotsale"],
  },
  {
    slug: "dia_madre",
    name: "Día de la Madre",
    badge: "DÍA DE LA MADRE",
    badgeColor: "day",
    startMonth: 10,
    startDay: 1,
    endMonth: 10,
    endDay: 20,
    keywords: ["dia de la madre", "día de la madre", "madre"],
  },
  {
    slug: "black_friday",
    name: "Black Friday",
    badge: "BLACK FRIDAY",
    badgeColor: "hot",
    startMonth: 11,
    startDay: 22,
    endMonth: 11,
    endDay: 30,
    keywords: ["black friday", "black_friday", "blackfriday"],
  },
  {
    slug: "cyber_monday",
    name: "Cyber Monday",
    badge: "CYBER MONDAY",
    badgeColor: "flash",
    startMonth: 11,
    startDay: 28,
    endMonth: 12,
    endDay: 5,
    keywords: ["cyber monday", "cyber_monday", "cybermonday", "cyber"],
  },
  {
    slug: "navidad",
    name: "Navidad",
    badge: "NAVIDAD",
    badgeColor: "top",
    startMonth: 12,
    startDay: 1,
    endMonth: 12,
    endDay: 24,
    keywords: ["navidad", "christmas", "fiestas"],
  },
  {
    slug: "liquidacion",
    name: "Liquidación",
    badge: "LIQUIDACIÓN",
    badgeColor: "day",
    startMonth: 1,
    startDay: 2,
    endMonth: 1,
    endDay: 31,
    keywords: ["liquidacion", "liquidación", "clearance"],
  },
];

function isInWindow(now: Date, startMonth: number, startDay: number, endMonth: number, endDay: number): boolean {
  const y = now.getFullYear();
  const start = new Date(y, startMonth - 1, startDay, 0, 0, 0, 0);
  let end = new Date(y, endMonth - 1, endDay, 23, 59, 59, 999);
  if (end < start) {
    if (now >= start) return true;
    end = new Date(y + 1, endMonth - 1, endDay, 23, 59, 59, 999);
  }
  return now >= start && now <= end;
}

export function getActiveSeasonalEvents(now = new Date()): SeasonalEvent[] {
  return SEASONAL_EVENTS.filter((e) =>
    isInWindow(now, e.startMonth, e.startDay, e.endMonth, e.endDay)
  );
}

export function matchSeasonalEventForText(text: string, now = new Date()): SeasonalEvent | null {
  const lower = text.toLowerCase();
  for (const event of getActiveSeasonalEvents(now)) {
    if (event.keywords.some((k) => lower.includes(k))) return event;
  }
  return null;
}

export function getSeasonalEventBySlug(slug: string): SeasonalEvent | undefined {
  return SEASONAL_EVENTS.find((e) => e.slug === slug);
}
