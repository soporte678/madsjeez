"use client"
import { useEffect } from "react"

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  // Ocultar elementos del marketplace (chat, bots) en el área de transportistas
  useEffect(() => {
    document.body.classList.add("driver-mode")
    return () => document.body.classList.remove("driver-mode")
  }, [])

  return <>{children}</>
}
