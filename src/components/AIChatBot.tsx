"use client"

import { useState, useRef, useEffect } from "react"
import { usePathname } from "next/navigation"
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react"
import { useChat, type ChatMode } from "./ChatContext"

interface Message {
  role: "user" | "assistant"
  content: string
}

const modeConfig: Record<ChatMode, { welcome: string; title: string; quick: string[] }> = {
  general: {
    welcome: "¡Hola! Soy el asistente virtual de MadsJeez 🔧 ¿En qué puedo ayudarte hoy?",
    title: "Asistente MadsJeez",
    quick: ["¿Cómo compro?", "¿Hacen envíos?", "¿Cómo vender?", "Devoluciones"],
  },
  products: {
    welcome: "¡Hola! Soy tu experto en productos de MadsJeez 🔧 ¿Qué estás buscando? Te ayudo a comparar, encontrar el mejor precio y elegir el producto ideal.",
    title: "Experto en Productos",
    quick: ["¿Qué motosierra recomendás?", "¿Cómo comparar productos?", "¿Hay envío gratis?", "Garantía de productos"],
  },
  seller: {
    welcome: "¡Hola! Soy tu asistente de ventas en MadsJeez 📈 ¿Necesitás ayuda con publicaciones, reputación, precios o estrategias para vender más?",
    title: "Asistente de Ventas",
    quick: ["¿Cómo publicar?", "¿Cuál es la comisión?", "¿Cómo mejorar reputación?", "Marketing IA"],
  },
  support: {
    welcome: "¡Hola! Soy tu soporte técnico de MadsJeez 🛠️ ¿Tenés un problema con tu compra, envío, pago o cuenta? Estoy para ayudarte.",
    title: "Soporte MadsJeez",
    quick: ["Mi pedido no llegó", "Quiero devolver un producto", "Problema con el pago", "Contactar un vendedor"],
  },
  buyer: {
    welcome: "¡Hola! Soy tu asistente de compras en MadsJeez � ¿Te ayudo a encontrar productos, entender el proceso de compra, pagos o envíos?",
    title: "Asistente de Compras",
    quick: ["¿Cómo compro?", "Medios de pago", "Costo de envío", "Seguimiento de pedido"],
  },
}

export default function AIChatBot() {
  const pathname = usePathname()
  const { isOpen, closeChat, mode } = useChat()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Hide on dashboard and admin pages (they have their own assistants)
  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin")) {
    return null
  }

  // Reset messages when mode changes or chat opens
  useEffect(() => {
    if (isOpen) {
      setMessages([
        { role: "assistant", content: modeConfig[mode].welcome },
      ])
    }
  }, [isOpen, mode])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: "user", content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, mode }),
      })

      const data = await res.json()

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Disculpá, tuve un problema técnico. Intentá de nuevo en unos segundos." },
        ])
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }])
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error de conexión. Verificá tu internet e intentá de nuevo." },
      ])
    } finally {
      setLoading(false)
    }
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
      {!isOpen && (
        <button
          onClick={() => {}} // controlled by ChatContext, but button is always visible when closed
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 group"
          aria-label="Abrir chat de ayuda"
        >
          <Bot className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10000] w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-sm">{modeConfig[mode].title}</p>
                <p className="text-xs text-blue-100 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  En línea
                </p>
              </div>
            </div>
            <button
              onClick={closeChat}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div className="bg-white text-gray-500 border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions (only show at start) */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-500 mb-2">Preguntas frecuentes:</p>
              <div className="flex flex-wrap gap-1.5">
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q)
                      setTimeout(() => {
                        const fakeMsg: Message = { role: "user", content: q }
                        const newMsgs = [...messages, fakeMsg]
                        setMessages(newMsgs)
                        setLoading(true)
                        fetch("/api/chat", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ messages: newMsgs, mode }),
                        })
                          .then((r) => r.json())
                          .then((data) => {
                            setMessages((prev) => [...prev, { role: "assistant", content: data.message || "Error" }])
                          })
                          .catch(() => {
                            setMessages((prev) => [...prev, { role: "assistant", content: "Error de conexión." }])
                          })
                          .finally(() => setLoading(false))
                        setInput("")
                      }, 0)
                    }}
                    className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribí tu consulta..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white border border-transparent focus:border-blue-300 disabled:opacity-50 transition-all"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">Powered by MadsJeez AI</p>
          </div>
        </div>
      )}
    </>
  )
}
