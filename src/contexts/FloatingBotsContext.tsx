"use client"

import React, { createContext, useContext, useState, useCallback } from 'react';

type BotType = 'whatsapp' | 'chatbot' | null;

interface FloatingBotsContextType {
  activeBot: BotType;
  /** Panel expandido (no minimizado): oculta el FAB del otro botón */
  whatsappMinimized: boolean;
  chatbotMinimized: boolean;
  setWhatsappMinimized: (v: boolean) => void;
  setChatbotMinimized: (v: boolean) => void;
  openBot: (bot: BotType) => void;
  closeBot: () => void;
  toggleBot: (bot: Exclude<BotType, null>) => void;
}

const FloatingBotsContext = createContext<FloatingBotsContextType | undefined>(undefined);

export function FloatingBotsProvider({ children }: { children: React.ReactNode }) {
  const [activeBot, setActiveBot] = useState<BotType>(null);
  const [whatsappMinimized, setWhatsappMinimized] = useState(false);
  const [chatbotMinimized, setChatbotMinimized] = useState(false);

  const openBot = useCallback((bot: BotType) => {
    setActiveBot(bot);
    if (bot === 'whatsapp') setWhatsappMinimized(false);
    if (bot === 'chatbot') setChatbotMinimized(false);
  }, []);

  const closeBot = useCallback(() => {
    setActiveBot(null);
    setWhatsappMinimized(false);
    setChatbotMinimized(false);
  }, []);

  const toggleBot = useCallback((bot: Exclude<BotType, null>) => {
    setActiveBot((current) => {
      if (current === bot) {
        setWhatsappMinimized(false);
        setChatbotMinimized(false);
        return null;
      }
      /* Cambiar de panel: siempre arrancar maximizado */
      setWhatsappMinimized(false);
      setChatbotMinimized(false);
      return bot;
    });
  }, []);

  return (
    <FloatingBotsContext.Provider
      value={{
        activeBot,
        whatsappMinimized,
        chatbotMinimized,
        setWhatsappMinimized,
        setChatbotMinimized,
        openBot,
        closeBot,
        toggleBot,
      }}
    >
      {children}
    </FloatingBotsContext.Provider>
  );
}

export function useFloatingBots() {
  const context = useContext(FloatingBotsContext);
  if (context === undefined) {
    throw new Error('useFloatingBots must be used within a FloatingBotsProvider');
  }
  return context;
}
