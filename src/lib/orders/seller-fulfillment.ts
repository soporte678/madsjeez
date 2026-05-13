
/** Estados operativos del vendedor (hasta API de envíos). */
export type SellerFulfillmentStage =
  | "pending_pickup"
  | "preparing"
  | "awaiting_stock"
  | "dispatched"
  | "sent"
  | "completed";

export type SellerFulfillment = {
  stage: SellerFulfillmentStage;
  /** Primera vez que MP marcó la orden como pagada (ISO). */
  paid_at?: string | null;
  dispatched_at?: string | null;
  /** Cuando se aplicó el contador de demora al vendedor (idempotente). */
  delay_penalty_applied_at?: string | null;
  /** Solicitud de revisión por demora (con pruebas). */
  delay_review?: {
    requested_at: string;
    reason: string;
    proof_urls?: string[];
  } | null;
};

export const SLA_DISPATCH_HOURS = 24;

export const FULFILLMENT_STAGE_LABEL: Record<SellerFulfillmentStage, string> = {
  pending_pickup: "Pendiente de despacho",
  preparing: "En proceso de preparación",
  awaiting_stock: "Por ingresar stock",
  dispatched: "Despachado",
  sent: "Enviado",
  completed: "Entrega finalizada",
};

const DEFAULT_FULFILLMENT: SellerFulfillment = {
  stage: "pending_pickup",
};

export function parseSellerFulfillment(shipping: unknown): SellerFulfillment {
  if (!shipping || typeof shipping !== "object") return { ...DEFAULT_FULFILLMENT };
  const o = shipping as Record<string, unknown>;
  const raw = o.seller_fulfillment;
  if (!raw || typeof raw !== "object") return { ...DEFAULT_FULFILLMENT };
  const s = raw as Record<string, unknown>;
  const stage = (typeof s.stage === "string" ? s.stage : "pending_pickup") as SellerFulfillmentStage;
  const allowed: SellerFulfillmentStage[] = [
    "pending_pickup",
    "preparing",
    "awaiting_stock",
    "dispatched",
    "sent",
    "completed",
  ];
  return {
    stage: allowed.includes(stage) ? stage : "pending_pickup",
    paid_at: typeof s.paid_at === "string" ? s.paid_at : null,
    dispatched_at: typeof s.dispatched_at === "string" ? s.dispatched_at : null,
    delay_penalty_applied_at: typeof s.delay_penalty_applied_at === "string" ? s.delay_penalty_applied_at : null,
    delay_review:
      s.delay_review && typeof s.delay_review === "object"
        ? (s.delay_review as SellerFulfillment["delay_review"])
        : null,
  };
}

export function mergeSellerFulfillmentIntoShipping(
  shipping: unknown,
  patch: Partial<SellerFulfillment>
): Record<string, unknown> {
  const base =
    shipping && typeof shipping === "object" ? { ...(shipping as Record<string, unknown>) } : {};
  const prev = parseSellerFulfillment(shipping);
  base.seller_fulfillment = {
    ...prev,
    ...patch,
    delay_review: patch.delay_review !== undefined ? patch.delay_review : prev.delay_review,
  };
  return base;
}

export type DelayCompute = {
  paymentSettled: boolean;
  /** Orden pagada en MP (status paid / preparing / shipped…). */
  isPaidLike: boolean;
  paidAt: Date | null;
  /** Si pasaron 24h desde paidAt sin estar en etapa que cuenta como “despachado”. */
  isDispatchLate: boolean;
  /** Días completos desde el vencimiento de las 24h (mínimo 1 si isDispatchLate). */
  delayDays: number;
  /** Texto para UI: “Paquete demorado 3 días”. */
  delayLabel: string | null;
  fulfillment: SellerFulfillment;
};

/** Etapas que cierran la obligación de despacho en 24h. */
export function stageCountsAsDispatched(stage: SellerFulfillmentStage): boolean {
  return stage === "dispatched" || stage === "sent" || stage === "completed";
}

function isPaidLikeMpStatus(sb: string): boolean {
  const u = sb.toLowerCase();
  return u === "paid" || u === "preparing" || u === "shipped" || u === "delivered" || u === "completed";
}

export function computeDispatchDelay(args: {
  mpStatus: string;
  shipping_address: unknown;
  now?: Date;
}): DelayCompute {
  const now = args.now ?? new Date();
  const fulfillment = parseSellerFulfillment(args.shipping_address);
  const isPaidLike = isPaidLikeMpStatus(args.mpStatus);
  let paidAt: Date | null = null;
  if (fulfillment.paid_at) {
    const d = new Date(fulfillment.paid_at);
    if (!Number.isNaN(d.getTime())) paidAt = d;
  }
  const paymentSettled = isPaidLike && paidAt !== null;
  const dispatchedOk = stageCountsAsDispatched(fulfillment.stage);

  let isDispatchLate = false;
  let delayDays = 0;
  if (paymentSettled && paidAt && !dispatchedOk) {
    const deadline = new Date(paidAt.getTime() + SLA_DISPATCH_HOURS * 60 * 60 * 1000);
    if (now.getTime() > deadline.getTime()) {
      isDispatchLate = true;
      const ms = now.getTime() - deadline.getTime();
      delayDays = Math.max(1, Math.floor(ms / (24 * 60 * 60 * 1000)));
    }
  }

  const delayLabel =
    isDispatchLate && delayDays > 0 ? `Paquete demorado ${delayDays} día${delayDays === 1 ? "" : "s"}` : null;

  return {
    paymentSettled,
    isPaidLike,
    paidAt,
    isDispatchLate,
    delayDays,
    delayLabel,
    fulfillment,
  };
}
