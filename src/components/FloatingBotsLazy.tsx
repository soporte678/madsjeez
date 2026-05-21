"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

const FloatingBots = dynamic(() => import("@/components/FloatingBots"), { ssr: false })

export function FloatingBotsLazy() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const delay = 3500
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number })
        .requestIdleCallback(() => setMounted(true), { timeout: delay })
      return () => (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id)
    }
    const t = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(t)
  }, [])

  if (!mounted) return null
  return <FloatingBots />
}
