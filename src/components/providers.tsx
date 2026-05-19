"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"
import AISmartNotifications from "@/components/AISmartNotifications"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <AISmartNotifications />
      <Toaster richColors closeButton position="top-center" style={{ zIndex: 99999 }} />
    </SessionProvider>
  )
}
