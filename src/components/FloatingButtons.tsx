"use client";

import { usePathname } from "next/navigation";
import { WhatsAppFloatingButton } from "./WhatsAppFloatingButton";
import AIChatBot from "./AIChatBot";

export default function FloatingButtons() {
  const pathname = usePathname();
  
  // No mostrar en la landing page (/) ni en /dashboard
  if (pathname === "/" || pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <>
      <AIChatBot />
      <WhatsAppFloatingButton />
    </>
  );
}
