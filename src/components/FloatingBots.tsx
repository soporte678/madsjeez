"use client";

import { usePathname } from "next/navigation";
import { FloatingBotsProvider } from "@/contexts/FloatingBotsContext";
import AIChatBot from "./AIChatBot";
import WhatsAppButton from "./WhatsAppButton";
import FloatingFabDock from "./FloatingFabDock";

// Solo se muestran en home y landing page
const ALLOWED_PATHS = ["/", "/landing"];

export default function FloatingBots() {
  const pathname = usePathname();

  if (!ALLOWED_PATHS.includes(pathname)) {
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
