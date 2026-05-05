"use client";

import { FloatingBotsProvider } from "@/contexts/FloatingBotsContext";
import AIChatBot from "./AIChatBot";
import WhatsAppButton from "./WhatsAppButton";

export default function FloatingBots() {
  return (
    <FloatingBotsProvider>
      <AIChatBot />
      <WhatsAppButton />
    </FloatingBotsProvider>
  );
}
