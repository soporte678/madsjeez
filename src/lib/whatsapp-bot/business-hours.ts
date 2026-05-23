export type DaySlot = { start: string; end: string };

/** 0 = domingo … 6 = sábado */
export type BusinessHoursConfig = {
  timezone?: string;
  days?: Partial<Record<"0" | "1" | "2" | "3" | "4" | "5" | "6", DaySlot[]>>;
  offlineMessage?: string;
};

const DEFAULT_TZ = "America/Argentina/Buenos_Aires";

const DEFAULT_OFFLINE =
  "Gracias por escribir. En este momento estamos fuera del horario de atención. Te respondemos apenas abramos.";

export function parseBusinessHours(raw: unknown): BusinessHoursConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as BusinessHoursConfig;
  if (!o.days || typeof o.days !== "object") return null;
  return {
    timezone: typeof o.timezone === "string" ? o.timezone : DEFAULT_TZ,
    days: o.days,
    offlineMessage:
      typeof o.offlineMessage === "string" ? o.offlineMessage.slice(0, 500) : DEFAULT_OFFLINE,
  };
}

function parseHm(hm: string): { h: number; m: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, m: min };
}

/** true = dentro del horario configurado */
export function isWithinBusinessHours(config: BusinessHoursConfig | null, at = new Date()): boolean {
  if (!config?.days) return true;

  const tz = config.timezone || DEFAULT_TZ;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(at);
  const weekday = parts.find((p) => p.type === "weekday")?.value?.toLowerCase() ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const dayMap: Record<string, "0" | "1" | "2" | "3" | "4" | "5" | "6"> = {
    sun: "0",
    mon: "1",
    tue: "2",
    wed: "3",
    thu: "4",
    fri: "5",
    sat: "6",
  };
  const dayKey = dayMap[weekday.slice(0, 3)];
  if (!dayKey) return true;

  const slots = config.days[dayKey];
  if (!slots || slots.length === 0) return false;

  const nowMins = hour * 60 + minute;
  for (const slot of slots) {
    const start = parseHm(slot.start);
    const end = parseHm(slot.end);
    if (!start || !end) continue;
    const startM = start.h * 60 + start.m;
    const endM = end.h * 60 + end.m;
    if (nowMins >= startM && nowMins <= endM) return true;
  }
  return false;
}

export function getOfflineMessage(config: BusinessHoursConfig | null): string {
  return config?.offlineMessage?.trim() || DEFAULT_OFFLINE;
}

export const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  timezone: DEFAULT_TZ,
  days: {
    "1": [{ start: "09:00", end: "18:00" }],
    "2": [{ start: "09:00", end: "18:00" }],
    "3": [{ start: "09:00", end: "18:00" }],
    "4": [{ start: "09:00", end: "18:00" }],
    "5": [{ start: "09:00", end: "18:00" }],
    "6": [{ start: "09:00", end: "13:00" }],
  },
  offlineMessage: DEFAULT_OFFLINE,
};
