import { isGeminiConfigured, generateGeminiWhatsappReply } from "@/lib/whatsapp-bot/gemini-reply";
import type { AIProvider } from "./AIProvider";
import type { ChatMessage } from "./types";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  isConfigured(): boolean {
    return isGeminiConfigured();
  }

  async healthCheck() {
    if (!this.isConfigured()) {
      return { ok: false, error: "GEMINI_API_KEY no configurada" };
    }
    return { ok: true };
  }

  async generateReply(messages: ChatMessage[]): Promise<{ text: string; model: string }> {
    if (!this.isConfigured()) throw new Error("Gemini no configurado");
    const prompt = messages
      .map((m) => {
        if (m.role === "system") return m.content;
        return `${m.role === "user" ? "Cliente" : "Vos"}: ${m.content}`;
      })
      .join("\n\n");
    const text = await generateGeminiWhatsappReply(prompt);
    return { text, model: "gemini" };
  }
}

export const geminiProvider = new GeminiProvider();
