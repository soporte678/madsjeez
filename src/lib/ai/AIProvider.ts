import type { BotReplyOutput, ChatMessage } from "./types";

export interface AIProvider {
  readonly name: string;
  generateReply(messages: ChatMessage[]): Promise<{ text: string; model: string }>;
  isConfigured(): boolean;
  healthCheck(): Promise<{ ok: boolean; error?: string; models?: string[] }>;
}

export type { BotReplyOutput };
