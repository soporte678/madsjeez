"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { MessageCircle, X, Send, Bot, User, Loader2, Edit3, Clock, Maximize2, Plus, Camera, Mic, HelpCircle, ChevronDown } from "lucide-react"
import { useChat, type ChatMode } from "./ChatContext"
import { useFloatingBots } from "@/contexts/FloatingBotsContext"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  isRecommendation?: boolean
  productName?: string
  productLink?: string
}

const modeConfig: Record<ChatMode, { welcome: string; title: string; quick: string[] }> = {
  general: {
    welcome: "¡Hola! Soy Mauro, tu asistente en MadsJeez 🔧 Conozco todo sobre el marketplace: productos, envíos, pagos, ventas y más. ¿En qué te ayudo?",
    title: "Mauro - Asistente MadsJeez",
    quick: ["¿Cómo compro?", "¿Hacen envíos?", "¿Cómo vender?", "Devoluciones"],
  },
  products: {
    welcome: "¡Hola! Soy Diego, el especialista técnico de MadsJeez � ¿Buscás herramientas, maquinaria o repuestos? Te ayudo a comparar especificaciones y encontrar el mejor producto para tu trabajo.",
    title: "Diego - Experto en Productos",
    quick: ["¿Qué motosierra recomendás?", "¿Cómo comparar productos?", "¿Hay envío gratis?", "Garantía de productos"],
  },
  seller: {
    welcome: "¡Hola! Soy Mariana, tu consultora de e-commerce en MadsJeez 📈 ¿Querés vender más? Te ayudo con publicaciones, pricing, marketing y estrategias de conversión.",
    title: "Mariana - Asesora de Ventas",
    quick: ["¿Cómo publicar?", "¿Cuál es la comisión?", "¿Cómo mejorar reputación?", "Marketing IA"],
  },
  support: {
    welcome: "¡Hola! Soy Laura, especialista en atención al cliente de MadsJeez 🛠️ ¿Tenés un problema con tu compra, envío, pago o cuenta? Voy a resolverlo.",
    title: "Laura - Soporte",
    quick: ["Problema con envío", "Cuenta suspendida", "Cambiar datos", "Contactar soporte"],
  },
  buyer: {
    welcome: "¡Hola! Soy tu asistente de compras. ¿Buscás algún producto específico?",
    title: "Asistente de Compras",
    quick: ["Ofertas del día", "Productos recomendados", "Estado de mi pedido", "Devoluciones"],
  },
}

export default function AIChatBot() {
  const pathname = usePathname()
  const { activeBot, closeBot, toggleBot } = useFloatingBots()
  const isOpen = activeBot === 'chatbot'
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Un clip puede ayudarte a mejorar la exposición de tu publicación y llamar más la atención en los resultados. \n\nTenés 1 publicación con oportunidad de video:",
      isRecommendation: true,
      productName: "Cuchilla Para Desmalezadora 3 Puntas Lusqtoff Niwa Gamma.",
      productLink: "#"
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<ChatMode>("general")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Don't show on certain pages
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard')) {
    return null
  }

  // Si WhatsApp está abierto, ocultar el botón del chatbot
  const isHidden = activeBot === 'whatsapp'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])


  const sendChatRequest = async (currentMessages: Message[]) => {
    setLoading(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentMessages, mode }),
      })

      if (!res.ok) {
        const status = res.status
        let errorMsg = "Disculpá, tuve un problema técnico. Intentá de nuevo en unos segundos."
        if (status === 404) errorMsg = "⚠️ El servicio de IA no está disponible en este momento (endpoint no encontrado)."
        if (status === 500) errorMsg = "⚠️ Error interno del servidor. Estamos trabajando para solucionarlo."
        if (status === 429) errorMsg = "⚠️ Muchas solicitudes seguidas. Esperá unos segundos e intentá de nuevo."
        setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }])
        return
      }

      const data = await res.json()

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Disculpá, tuve un problema técnico. Intentá de nuevo en unos segundos." },
        ])
      } else {
        const isFallback = data._meta?.fallback
        const messageContent = isFallback
          ? data.message + "\n\n— ⚠️ Modo respuestas predefinidas: la IA avanzada no está configurada. Agregá GEMINI_API_KEY en las variables de entorno."
          : data.message
        setMessages((prev) => [...prev, { role: "assistant", content: messageContent }])
      }
    } catch (error: any) {
      const msg = error?.message?.includes("Timeout")
        ? "⚠️ El servidor tardó demasiado en responder. Puede estar redeployeando. Esperá 1-2 minutos y probá de nuevo."
        : "⚠️ Error de conexión. Verificá tu internet o probá de nuevo en unos segundos."
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: msg },
      ])
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: "user", content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    await sendChatRequest(newMessages)
  }

  const minimizeChat = () => {
    setIsMinimized((prev) => !prev)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickQuestions = modeConfig[mode].quick

  return (
    <>
      {/* Chat Button */}
      {!isOpen && !isHidden && (
        <button
          onClick={() => { toggleBot('chatbot'); setIsMinimized(false); }}
          className="fixed bottom-6 right-6 z-[10000] bg-gradient-to-r from-[#FF6B4A] to-[#FF8C42] text-white rounded-full p-4 shadow-xl shadow-orange-500/40 hover:shadow-2xl hover:shadow-orange-500/60 hover:scale-110 transition-all duration-300 group animate-pulse-glow"
          aria-label="Abrir chat de ayuda"
        >
          <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#7CFC00] rounded-full border-2 border-white animate-bounce" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          "fixed right-6 z-[10000] w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl shadow-orange-500/20 border-2 border-[#FF6B4A]/20 flex flex-col overflow-hidden transition-all duration-300",
          isMinimized ? "bottom-6 h-16" : "bottom-24 h-[600px] max-h-[calc(100vh-8rem)]"
        )}>
          {/* Header — MadsJeez Style */}
          <div className="bg-gradient-to-r from-[#FF6B4A] to-[#FF8C42] p-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <button className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white">
                <Edit3 className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white">
                <Clock className="w-4 h-4" />
              </button>
            </div>
            <p className="font-bold text-sm text-white absolute left-1/2 -translate-x-1/2">Asistente</p>
            <div className="flex items-center gap-1">
              {/* Botón Minimizar */}
              <button 
                onClick={minimizeChat}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white"
                title={isMinimized ? "Maximizar" : "Minimizar"}
              >
                <ChevronDown className={cn("w-5 h-5 transition-transform", isMinimized && "rotate-180")} />
              </button>
              <button 
                onClick={closeBot}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Nuevo label */}
          <div className="px-4 pt-3 pb-1 flex items-center gap-2 flex-shrink-0">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#FF6B4A]/30 to-transparent" />
            <span className="text-xs bg-gradient-to-r from-[#FF6B4A] to-[#FF8C42] text-white px-2 py-0.5 rounded-full font-bold">Nuevo</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#FF6B4A]/30 to-transparent" />
          </div>

          {/* Messages - Solo si no está minimizado */}
          {!isMinimized && (
            <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 bg-gradient-to-br from-[#FF6B4A] to-[#FF8C42] rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-orange-500/30">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-[#FF6B4A] to-[#FF8C42] text-white px-4 py-2.5 rounded-2xl rounded-br-md shadow-md shadow-orange-500/30"
                      : "bg-gray-50 text-gray-800"
                  }`}
                >
                  {msg.isRecommendation ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-700 leading-relaxed">{msg.content}</p>
                      {msg.productName && (
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">{msg.productName}</span> ⭐
                        </p>
                      )}
                      {msg.productLink && (
                        <a
                          href={msg.productLink}
                          className="inline-block text-blue-600 text-sm font-medium hover:underline"
                        >
                          Ir a crear clip
                        </a>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`px-4 py-2.5 rounded-2xl border ${
                        msg.role === "assistant" ? "bg-white border-gray-200 shadow-sm rounded-bl-md" : ""
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 bg-gradient-to-br from-[#00D4FF] to-[#00B4E6] rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-cyan-500/30">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Action Buttons */}
          {!isMinimized && messages.length <= 1 && (
            <div className="px-4 py-3 bg-white flex-shrink-0 space-y-2">
              <button className="w-full text-sm text-gray-700 border border-gray-200 rounded-full px-4 py-2.5 hover:bg-gradient-to-r hover:from-[#FF6B4A]/10 hover:to-[#FF8C42]/10 hover:border-[#FF6B4A]/30 transition-all duration-300">
                Quiero otra recomendación
              </button>
              <button className="w-full text-sm text-gray-700 border border-gray-200 rounded-full px-4 py-2.5 hover:bg-gradient-to-r hover:from-[#00D4FF]/10 hover:to-[#00B4E6]/10 hover:border-[#00D4FF]/30 transition-all duration-300">
                Conocer tareas pendientes
              </button>
              <button className="w-full text-sm text-gray-700 border border-gray-200 rounded-full px-4 py-2.5 hover:bg-gradient-to-r hover:from-[#FF2E8C]/10 hover:to-[#FF6B9D]/10 hover:border-[#FF2E8C]/30 transition-all duration-300">
                Consultar por otro tema
              </button>
            </div>
          )}

          {/* Quick Questions (only show at start) */}
          {!isMinimized && messages.length <= 1 && (
            <div className="px-4 py-2 bg-white border-t border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-500 mb-2">Preguntas frecuentes:</p>
              <div className="flex flex-wrap gap-1.5">
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      const fakeMsg: Message = { role: "user", content: q }
                      const newMsgs = [...messages, fakeMsg]
                      setMessages(newMsgs)
                      setInput("")
                      sendChatRequest(newMsgs)
                    }}
                    className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gradient-to-r hover:from-[#FF6B4A]/10 hover:to-[#FF8C42]/10 hover:border-[#FF6B4A]/30 hover:text-[#FF6B4A] transition-all duration-300"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input — MadsJeez Style (solo si no está minimizado) */}
          {!isMinimized && (
          <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-full px-3 py-2 border border-gray-200 focus-within:border-[#FF6B4A]/50 focus-within:shadow-md focus-within:shadow-orange-500/10 transition-all duration-300">
              <button className="p-1 text-gray-500 hover:text-gray-700 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Preguntale al asistente..."
                disabled={loading}
                className="flex-1 bg-transparent text-sm focus:outline-none disabled:opacity-50"
              />
              <button className="p-1 text-gray-500 hover:text-[#FF6B4A] transition-colors">
                <Camera className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-2 bg-gradient-to-r from-[#FF6B4A] to-[#FF8C42] text-white rounded-full hover:from-[#FF8C42] hover:to-[#FFC107] transition-all duration-300 shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">Este asistente usa inteligencia artificial para responderte.</p>
          </div>
          )}
          </>
          )}
        </div>
      )}
    </>
  )
}
