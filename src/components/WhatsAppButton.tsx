"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X, ChevronDown, Phone } from "lucide-react";
import { useFloatingBots } from "@/contexts/FloatingBotsContext";
import { cn } from "@/lib/utils";

export default function WhatsAppButton() {
  const {
    activeBot,
    closeBot,
    chatbotMinimized,
    setWhatsappMinimized,
  } = useFloatingBots();
  const isOpen = activeBot === "whatsapp";
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsMinimized(false);
      setWhatsappMinimized(false);
      return;
    }
    setWhatsappMinimized(isMinimized);
  }, [isOpen, isMinimized, setWhatsappMinimized]);

  /* Chatbot maximizado: ocultamos WhatsApp por completo para no pisarse */
  if (activeBot === "chatbot" && !chatbotMinimized) {
    return null;
  }

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Ventana de WhatsApp — por encima del dock de FABs */}
      {isOpen && (
        <div
          className={cn(
            "fixed right-6 z-[10001] bg-white rounded-2xl shadow-2xl shadow-green-500/20 border border-green-100 overflow-hidden transition-all duration-300",
            isMinimized
              ? "bottom-[9.5rem] w-[min(380px,calc(100vw-3rem))] h-16"
              : "bottom-6 w-[min(380px,calc(100vw-3rem))] h-[500px] max-h-[min(500px,calc(100vh-7rem))]"
          )}
        >
          <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">WhatsApp</h3>
                <p className="text-xs text-white/80 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                  En línea
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMinimize}
                className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                title={isMinimized ? "Maximizar" : "Minimizar"}
              >
                <ChevronDown className={cn("w-5 h-5 transition-transform", isMinimized && "rotate-180")} />
              </button>

              <button
                type="button"
                onClick={closeBot}
                className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="p-4 bg-[#DCF8C6]/30">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white p-3 rounded-2xl rounded-tl-md shadow-sm max-w-[85%]">
                    <p className="text-sm text-slate-700">
                      👋 ¡Hola! ¿En qué podemos ayudarte? Escríbenos por WhatsApp y te atenderemos a la brevedad.
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <a
                  href="https://wa.me/5491121816064?text=Hola%20MadsJeez%2C%20tengo%20una%20consulta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
                >
                  <Phone className="w-5 h-5" />
                  Iniciar conversación
                </a>

                <p className="text-xs text-center text-slate-400 mt-3">
                  Te redirigiremos a WhatsApp Web o la app
                </p>
              </div>

              <div className="px-4 pb-4">
                <div className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs font-semibold text-slate-600">Horario de atención</p>
                  <p className="text-xs text-slate-500 mt-1">Lunes a Viernes: 9:00 - 18:00</p>
                  <p className="text-xs text-slate-500">Sábados: 9:00 - 13:00</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
