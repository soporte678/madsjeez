"use client";

import { MessageCircle, Bot } from "lucide-react";
import { useFloatingBots } from "@/contexts/FloatingBotsContext";

/**
 * Botones flotantes apilados a la derecha: WhatsApp arriba, asistente abajo.
 * Si un panel está expandido (abierto y no minimizado), se oculta el FAB del otro.
 */
export default function FloatingFabDock() {
  const {
    activeBot,
    whatsappMinimized,
    chatbotMinimized,
    toggleBot,
  } = useFloatingBots();

  const whatsappExpanded = activeBot === "whatsapp" && !whatsappMinimized;
  const chatbotExpanded = activeBot === "chatbot" && !chatbotMinimized;

  /** Panel abierto y maximizado: sin FAB (ni duplicados ni solapamiento). Minimizar → reaparecen ambos. */
  const showStack = !whatsappExpanded && !chatbotExpanded;

  return (
    <>
      <style>{`
        @keyframes wa-pulse {
          0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.55); }
          70% { box-shadow: 0 0 0 14px rgba(37, 211, 102, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }
        .fab-wa { animation: wa-pulse 2.4s infinite; }
      `}</style>

      {showStack && (
        <div
          className="fixed bottom-6 right-6 z-[10000] flex flex-col-reverse gap-3 items-center pointer-events-none [&>button]:pointer-events-auto"
          aria-hidden={false}
        >
          <button
              type="button"
              onClick={() => {
                toggleBot("chatbot");
              }}
              className="relative bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full p-4 shadow-xl shadow-indigo-500/45 hover:shadow-2xl hover:shadow-violet-500/45 hover:scale-110 transition-all duration-300 group"
              aria-label="Abrir asistente"
            >
              <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              {/* Badge NO verde (evita confundir con WhatsApp) */}
              <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
            </button>

          <button
              type="button"
              onClick={() => toggleBot("whatsapp")}
              className="relative fab-wa w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40 hover:shadow-green-500/60 transition-all duration-300 group"
              aria-label="Abrir WhatsApp"
            >
              <MessageCircle className="w-7 h-7 text-white fill-white" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white">
                1
              </span>
            </button>
        </div>
      )}
    </>
  );
}
