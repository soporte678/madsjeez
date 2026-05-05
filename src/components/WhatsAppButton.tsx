"use client";

import { useState } from 'react';
import { MessageCircle, X, ChevronDown, Phone } from 'lucide-react';
import { useFloatingBots } from '@/contexts/FloatingBotsContext';
import { cn } from '@/lib/utils';

export default function WhatsAppButton() {
  const { activeBot, closeBot, toggleBot } = useFloatingBots();
  const isOpen = activeBot === 'whatsapp';
  const [isMinimized, setIsMinimized] = useState(false);

  // Si el chatbot está abierto, el botón de WhatsApp debe estar oculto
  const isHidden = activeBot === 'chatbot';

  const handleToggle = () => {
    if (isOpen) {
      closeBot();
    } else {
      toggleBot('whatsapp');
      setIsMinimized(false);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (isHidden) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes whatsapp-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes whatsapp-pulse {
          0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(37, 211, 102, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
        }
        
        .whatsapp-button {
          animation: whatsapp-pulse 2s infinite;
        }
        
        .whatsapp-button:hover {
          animation: whatsapp-bounce 0.3s ease;
        }
      `}</style>

      {/* Botón Flotante de WhatsApp */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="fixed bottom-6 left-6 z-[10000] w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl shadow-green-500/40 hover:shadow-green-500/60 transition-all duration-300 whatsapp-button group"
          aria-label="Abrir WhatsApp"
        >
          <MessageCircle className="w-7 h-7 text-white fill-white" />
          
          {/* Badge de notificación */}
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-bounce">
            1
          </span>
        </button>
      )}

      {/* Ventana de WhatsApp */}
      {isOpen && (
        <div 
          className={cn(
            "fixed left-6 z-[10000] bg-white rounded-2xl shadow-2xl shadow-green-500/20 border border-green-100 overflow-hidden transition-all duration-300",
            isMinimized ? "bottom-6 w-72 h-16" : "bottom-6 w-[380px] h-[500px]"
          )}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">WhatsApp</h3>
                <p className="text-xs text-white/80 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                  En línea
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Botón Minimizar */}
              <button
                onClick={handleMinimize}
                className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                title={isMinimized ? "Maximizar" : "Minimizar"}
              >
                <ChevronDown className={cn("w-5 h-5 transition-transform", isMinimized && "rotate-180")} />
              </button>
              
              {/* Botón Cerrar */}
              <button
                onClick={closeBot}
                className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contenido - Solo visible si no está minimizado */}
          {!isMinimized && (
            <>
              {/* Mensaje de bienvenida */}
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
                      {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón de acción */}
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

              {/* Horarios */}
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
