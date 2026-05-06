"use client";

import { FloatingBotsProvider } from "@/contexts/FloatingBotsContext";
import AIChatBot from "./AIChatBot";
import WhatsAppButton from "./WhatsAppButton";
import FloatingFabDock from "./FloatingFabDock";

export default function FloatingBots() {
  return (
    <FloatingBotsProvider>
      <AIChatBot />
      <WhatsAppButton />
      <FloatingFabDock />
    </FloatingBotsProvider>
  );
}
