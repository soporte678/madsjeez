"use client"

import React, { createContext, useContext, useState, useCallback } from 'react';

type BotType = 'whatsapp' | 'chatbot' | null;

interface FloatingBotsContextType {
  activeBot: BotType;
  openBot: (bot: BotType) => void;
  closeBot: () => void;
  toggleBot: (bot: Exclude<BotType, null>) => void;
}

const FloatingBotsContext = createContext<FloatingBotsContextType | undefined>(undefined);

export function FloatingBotsProvider({ children }: { children: React.ReactNode }) {
  const [activeBot, setActiveBot] = useState<BotType>(null);

  const openBot = useCallback((bot: BotType) => {
    setActiveBot(bot);
  }, []);

  const closeBot = useCallback(() => {
    setActiveBot(null);
  }, []);

  const toggleBot = useCallback((bot: Exclude<BotType, null>) => {
    setActiveBot((current) => current === bot ? null : bot);
  }, []);

  return (
    <FloatingBotsContext.Provider value={{ activeBot, openBot, closeBot, toggleBot }}>
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
