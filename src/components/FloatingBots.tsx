"use client";

import { usePathname } from "next/navigation";
import { FloatingBotsProvider } from "@/contexts/FloatingBotsContext";
import WhatsAppButton from "./WhatsAppButton";

// Solo se muestran en home y landing page
const ALLOWED_PATHS = ["/", "/landing"];

/**
 * Botones flotantes globales.
 *
 * Decisión producto: por ahora solo un bot, el de WhatsApp.
 * AIChatBot y FloatingFabDock estaban duplicando el FAB en pantalla
 * (se veían dos botones superpuestos). Quedan en el repo por si los
 * reactivamos cuando la IA salga a produccion.
 */
export default function FloatingBots() {
  const pathname = usePathname();

  if (!ALLOWED_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <FloatingBotsProvider>
      <WhatsAppButton />
    </FloatingBotsProvider>
  );
}
