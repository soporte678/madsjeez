"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FloatingBotsProvider } from "@/contexts/FloatingBotsContext";
import AIChatBot from "./AIChatBot";
import WhatsAppButton from "./WhatsAppButton";
import FloatingFabDock from "./FloatingFabDock";

export default function FloatingBots() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const update = () => setHash(window.location.hash);
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/driver") ||
    hash === "#whatsapp-bot"
  ) {
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
