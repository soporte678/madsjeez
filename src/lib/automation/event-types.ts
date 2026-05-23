/** Eventos de automatización hacia n8n (webhooks). */
export const AUTOMATION_EVENT_TYPES = [
  "message.received",
  "message.replied",
  "lead.created",
  "lead.updated",
  "lead.hot",
  "lead.needs_human",
  "objection.detected",
  "followup.needed",
  "quote.requested",
  "shipping.requested",
  "payment.requested",
  "stock.requested",
  "product.interest_detected",
  "sale.closed",
  "sale.lost",
  "conversation.summary_created",
  "ai.low_confidence",
  "bot.failed",
  "human.handoff",
  "jarvis.health_check_completed",
  "jarvis.error_detected",
  "jarvis.improvement_suggested",
  "jarvis.agent_task_created",
  "jarvis.daily_report_created",
  "jarvis.voice_report_requested",
] as const;

export type AutomationEventType = (typeof AUTOMATION_EVENT_TYPES)[number];

export function isAutomationEventType(value: string): value is AutomationEventType {
  return (AUTOMATION_EVENT_TYPES as readonly string[]).includes(value);
}

export type AutomationEventPayload = {
  event: AutomationEventType;
  occurredAt?: string;
  sellerId?: string;
  leadId?: string;
  conversationId?: string;
  channel?: "whatsapp" | "marketplace" | "instagram" | "web";
  data?: Record<string, unknown>;
};
