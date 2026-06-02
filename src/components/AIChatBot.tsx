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
}

const modeConfig: Record<ChatMode, { welcome: string; title: string; quick: string[]; label: string }> = {
  general: {
    welcome: "¡Hola! Soy Mauro, tu asistente en MadsJeez 🔧 Conozco todo sobre el marketplace: productos, envíos, pagos, ventas y más. ¿En qué te ayudo?",
    title: "Mauro - Asistente MadsJeez",
    label: "Marketplace",
    quick: ["¿Cómo compro?", "¿Hacen envíos?", "¿Cómo vender?", "Devoluciones"],
  },
  products: {
    welcome: "¡Hola! Soy Diego, especialista técnico de MadsJeez 🛠️ Te ayudo a buscar productos activos, comparar opciones, revisar stock, precios, envíos y características. ¿Qué producto necesitás encontrar?",
    title: "Diego - Experto en Productos",
    label: "Productos",
    quick: ["Buscar herramientas", "Comparar productos", "¿Hay envío gratis?", "Garantía de productos"],
  },
  seller: {
    welcome: "¡Hola! Soy Mariana, tu consultora de e-commerce en MadsJeez 📈 ¿Querés vender más? Te ayudo con publicaciones, pricing, marketing y estrategias de conversión.",
    title: "Mariana - Asesora de Ventas",
    label: "Vendedores",
    quick: ["¿Cómo publicar?", "¿Cómo cobro mis ventas?", "¿Cómo mejorar reputación?", "Marketing IA"],
  },
  support: {
    welcome: "¡Hola! Soy Laura, especialista en atención al cliente de MadsJeez 🛠️ ¿Tenés un problema con tu compra, envío, pago o cuenta? Voy a resolverlo.",
    title: "Laura - Soporte",
    label: "Soporte",
    quick: ["Problema con envío", "Cuenta suspendida", "Cambiar datos", "Contactar soporte"],
  },
  buyer: {
    welcome: "¡Hola! Soy Carlos, tu asistente de compras 🛒 Te ayudo con ofertas, cupones, pagos, envíos, pedidos y recomendaciones según la sección donde estás. ¿Qué querés hacer?",
    title: "Carlos - Asistente de Compras",
    label: "Compras",
    quick: ["Ofertas del día", "Cupones disponibles", "Estado de mi pedido", "Devoluciones"],
  },
}

function getModeForPath(pathname: string | null): ChatMode {
  if (!pathname) return "general"
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/sell") || pathname.startsWith("/seller/register")) return "seller"
  if (pathname.startsWith("/help") || pathname.startsWith("/messages") || pathname.startsWith("/settings")) return "support"
  if (pathname.startsWith("/orders") || pathname.startsWith("/checkout") || pathname.startsWith("/cart")) return "support"
  if (pathname.startsWith("/product") || pathname.startsWith("/products") || pathname.startsWith("/search") || pathname.startsWith("/category") || pathname.startsWith("/categories")) return "products"
  if (pathname.startsWith("/coupons") || pathname.startsWith("/offers") || pathname.startsWith("/deals") || pathname.startsWith("/favorites") || pathname.startsWith("/supermarket") || pathname.startsWith("/fashion")) return "buyer"
  return "general"
}

function getSectionIntro(pathname: string | null, mode: ChatMode) {
  if (!pathname) return modeConfig[mode].welcome
  if (pathname.startsWith("/coupons")) return "¡Hola! Soy Carlos 🛒 Estás en Cupones. Te ayudo a encontrar descuentos activos, copiar códigos, entender mínimos de compra y aprovechar beneficios por tienda."
  if (pathname.startsWith("/offers") || pathname.startsWith("/deals")) return "¡Hola! Soy Carlos 🛒 Estás viendo ofertas. Puedo ayudarte a comparar descuentos, encontrar oportunidades y elegir la mejor opción según precio y envío."
  if (pathname.startsWith("/search")) return "¡Hola! Soy Diego 🛠️ Estás en búsqueda. Decime qué necesitás y te ayudo a encontrar publicaciones activas, filtrar resultados y comparar productos."
  if (pathname.startsWith("/product")) return "¡Hola! Soy Diego 🛠️ Estás viendo un producto. Puedo ayudarte con características, compatibilidad, garantía, envío y alternativas similares."
  if (pathname.startsWith("/categories") || pathname.startsWith("/category")) return "¡Hola! Soy Diego 🛠️ Estás explorando categorías. Te ayudo a elegir la sección correcta y encontrar productos activos según tu necesidad."
  if (pathname.startsWith("/dashboard")) return "¡Hola! Soy Mariana 📈 Estás en tu panel vendedor. Te ayudo con publicaciones, reputación, preguntas, precios, campañas y oportunidades de mejora."
  if (pathname.startsWith("/cart") || pathname.startsWith("/checkout")) return "¡Hola! Soy Laura 🛠️ Te ayudo con carrito, pagos, envíos, cupones aplicables y cualquier problema antes de finalizar la compra."
  if (pathname.startsWith("/orders")) return "¡Hola! Soy Laura 🛠️ Te ayudo con pedidos, tracking, reclamos, devoluciones y garantías."
  return modeConfig[mode].welcome
}

export default function AIChatBot() {
  const pathname = usePathname()
  const { activeBot, closeBot, whatsappMinimized, setChatbotMinimized } = useFloatingBots()
  const isOpen = activeBot === 'chatbot'
  const [isMinimized, setIsMinimized] = useState(false)
  const initialMode = getModeForPath(pathname)
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: getSectionIntro(pathname, initialMode) }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<ChatMode>(initialMode)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) {
      setChatbotMinimized(false)
      return
    }
    setChatbotMinimized(isMinimized)
  }, [isOpen, isMinimized, setChatbotMinimized])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const nextMode = getModeForPath(pathname)
    setMode(nextMode)
    setMessages([{ role: "assistant", content: getSectionIntro(pathname, nextMode) }])
    setInput("")
    setLoading(false)
  }, [pathname])

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

  const sendQuickQuestion = async (question: string) => {
    if (loading) return
    const userMessage: Message = { role: "user", content: question }
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
  const currentConfig = modeConfig[mode]

  // Don't show on admin pages
  if (pathname?.startsWith('/admin')) {
    return null
  }

  /* WhatsApp maximizado: no mostrar panel ni CAPAs del chat (FAB va por FloatingFabDock) */
  if (activeBot === 'whatsapp' && !whatsappMinimized) {
    return null
  }

  return (
    <>
      {isOpen && (
        <div className={cn(
          "fixed right-6 z-[10001] w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl shadow-indigo-900/20 border-2 border-indigo-200/90 flex flex-col overflow-hidden transition-all duration-300",
          isMinimized ? "bottom-[9.5rem] h-16" : "bottom-6 h-[600px] max-h-[calc(100vh-8rem)]"
        )}>
          {/* Header — MadsJeez Style */}
          <div className="bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-800 p-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <button className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white">
                <Edit3 className="w-4 h-4" />
              </button>
              <button className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white">
                <Clock className="w-4 h-4" />
              </button>
            </div>
            <p className="font-bold text-sm text-white absolute left-1/2 -translate-x-1/2">{currentConfig.title}</p>
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
          <div className="px-4 pt-3 pb-1 flex items-center gap-2 flex-shrink-0 bg-slate-50/80">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
            <span className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-full font-bold shadow-sm ring-1 ring-indigo-500/40 uppercase tracking-wide">{currentConfig.label}</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
          </div>

          {/* Messages - Solo si no está minimizado */}
          {!isMinimized && (
            <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-indigo-500/35">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-2.5 rounded-2xl rounded-br-md shadow-md shadow-indigo-500/35"
                      : "bg-gray-50 text-gray-800"
                  }`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl border whitespace-pre-line ${
                      msg.role === "assistant" ? "bg-white border-gray-200 shadow-sm rounded-bl-md" : ""
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 bg-gradient-to-br from-[#00b4d8] to-[#0096c7] rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-cyan-500/30">
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
              <button onClick={() => sendQuickQuestion(quickQuestions[0])} className="w-full text-sm text-gray-700 border border-gray-200 rounded-full px-4 py-2.5 hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-300">
                {quickQuestions[0]}
              </button>
              <button onClick={() => sendQuickQuestion(quickQuestions[1])} className="w-full text-sm text-gray-700 border border-gray-200 rounded-full px-4 py-2.5 hover:bg-gradient-to-r hover:from-[#00b4d8]/10 hover:to-[#0096c7]/10 hover:border-[#00b4d8]/30 transition-all duration-300">
                {quickQuestions[1]}
              </button>
              <button onClick={() => sendQuickQuestion(quickQuestions[2])} className="w-full text-sm text-gray-700 border border-gray-200 rounded-full px-4 py-2.5 hover:bg-gradient-to-r hover:from-[#db2777]/10 hover:to-[#ec4899]/10 hover:border-[#db2777]/30 transition-all duration-300">
                {quickQuestions[2]}
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
                    onClick={() => sendQuickQuestion(q)}
                    className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all duration-300"
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
            <div className="flex items-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-full px-3 py-2 border border-gray-200 focus-within:border-indigo-400 focus-within:shadow-md focus-within:shadow-indigo-500/15 transition-all duration-300">
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
              <button className="p-1 text-gray-500 hover:text-indigo-600 transition-colors">
                <Camera className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="p-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 shadow-md shadow-indigo-500/35 hover:shadow-lg hover:shadow-violet-500/40 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
