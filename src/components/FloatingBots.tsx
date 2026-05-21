"use client";

import { usePathname } from "next/navigation";
import { FloatingBotsProvider } from "@/contexts/FloatingBotsContext";
import AIChatBot from "./AIChatBot";
import WhatsAppButton from "./WhatsAppButton";
import FloatingFabDock from "./FloatingFabDock";

export default function FloatingBots() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <FloatingBotsProvider>
      <AIChatBot />
      <WhatsAppButton />
      <FloatingFabDock />
    </FloatingBotsProvider>
  );
}
