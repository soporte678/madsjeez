"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export type ChatMode = "general" | "products" | "seller" | "support" | "buyer"

interface ChatContextType {
  isOpen: boolean
  mode: ChatMode
  openChat: (mode?: ChatMode) => void
  closeChat: () => void
  toggleChat: () => void
}

const ChatContext = createContext<ChatContextType | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<ChatMode>("general")

  const openChat = useCallback((newMode: ChatMode = "general") => {
    setMode(newMode)
    setIsOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  return (
    <ChatContext.Provider value={{ isOpen, mode, openChat, closeChat, toggleChat }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChat must be used within ChatProvider")
  }
  return context
}
