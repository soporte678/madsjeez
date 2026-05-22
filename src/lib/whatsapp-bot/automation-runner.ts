import { prisma } from "@/lib/prisma";
import { getWhatsAppProvider } from "./providers/evolution-provider";
import { saveOutboundMessage } from "./message-service";

type Ctx = {
  sellerId: string;
  phone: string;
  text: string;
  leadId: string;
  conversationId: string;
  leadStatus: string;
};

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
        match = stage === ctx.leadStatus;
        break;
      }
      case "new_contact":
        match = ctx.leadStatus === "new";
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
          const provider = getWhatsAppProvider();
          await provider.sendText(ctx.sellerId, ctx.phone, msg);
          await saveOutboundMessage({
            conversationId: ctx.conversationId,
            content: msg,
            senderType: "bot",
          });
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
          const valid = ["new", "warm", "hot", "customer", "closed", "lost"];
          if (!valid.includes(stage)) break;
          await prisma.whatsappLead.update({
            where: { id: ctx.leadId },
            data: { status: stage as "new" },
          });
          break;
        }
        case "notify_human":
          await prisma.whatsappBotEvent.create({
            data: {
              sellerId: ctx.sellerId,
              conversationId: ctx.conversationId,
              type: "automation_handoff",
              payload: { ruleId: rule.id, name: rule.name },
            },
          });
          break;
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
