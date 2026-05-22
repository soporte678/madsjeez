import { prisma } from "@/lib/prisma";
import type { WhatsappLeadStatus } from "@prisma/client";
import { sendWhatsappOutboundToPhone } from "./message-service";
import { requestHumanHandoff } from "./human-handoff-service";

type Ctx = {
  sellerId: string;
  phone: string;
  text: string;
  leadId: string;
  conversationId: string;
  leadStatus: string;
  previousLeadStatus?: string;
  isNewContact?: boolean;
};

const VALID_STAGES: WhatsappLeadStatus[] = [
  "new",
  "warm",
  "hot",
  "customer",
  "closed",
  "lost",
];

export async function runWhatsappAutomations(ctx: Ctx) {
  const rules = await prisma.whatsappAutomation.findMany({
    where: { sellerId: ctx.sellerId, enabled: true },
  });

  for (const rule of rules) {
    const trigger = rule.triggerConfig as Record<string, unknown>;
    const action = rule.actionConfig as Record<string, unknown>;
    let match = false;

    switch (rule.triggerType) {
      case "new_message":
        match = true;
        break;
      case "keyword": {
        const kw = String(trigger.keyword ?? "").toLowerCase();
        match = kw.length > 0 && ctx.text.toLowerCase().includes(kw);
        break;
      }
      case "stage_change": {
        const stage = String(trigger.stage ?? "");
        match =
          ctx.previousLeadStatus !== undefined &&
          ctx.previousLeadStatus !== ctx.leadStatus &&
          stage === ctx.leadStatus;
        break;
      }
      case "new_contact":
        match = ctx.isNewContact === true;
        break;
      default:
        break;
    }

    if (!match) continue;

    try {
      switch (rule.actionType) {
        case "send_message": {
          const msg = String(action.message ?? "").trim();
          if (!msg) break;
          const result = await sendWhatsappOutboundToPhone({
            sellerId: ctx.sellerId,
            phone: ctx.phone,
            text: msg,
            senderType: "bot",
            leadId: ctx.leadId,
          });
          if (!result.ok) {
            console.error("[whatsapp-automation] send failed", rule.id, result.error);
          }
          break;
        }
        case "tag_contact": {
          const tag = String(action.tag ?? "").trim();
          if (!tag) break;
          const lead = await prisma.whatsappLead.findUnique({ where: { id: ctx.leadId } });
          if (!lead) break;
          const tags = [...new Set([...lead.tags, tag])];
          await prisma.whatsappLead.update({ where: { id: ctx.leadId }, data: { tags } });
          break;
        }
        case "assign_stage": {
          const stage = String(action.stage ?? "");
          if (!VALID_STAGES.includes(stage as WhatsappLeadStatus)) break;
          await prisma.whatsappLead.update({
            where: { id: ctx.leadId },
            data: { status: stage as WhatsappLeadStatus },
          });
          break;
        }
        case "notify_human": {
          await requestHumanHandoff(
            ctx.conversationId,
            `Automatización: ${rule.name}`
          );
          await prisma.whatsappBotEvent.create({
            data: {
              sellerId: ctx.sellerId,
              conversationId: ctx.conversationId,
              type: "automation_handoff",
              payload: { ruleId: rule.id, name: rule.name },
            },
          });
          break;
        }
        default:
          break;
      }

      await prisma.whatsappAutomation.update({
        where: { id: rule.id },
        data: { runCount: { increment: 1 }, lastRunAt: new Date() },
      });
    } catch (e) {
      console.error("[whatsapp-automation]", rule.id, e);
    }
  }
}
