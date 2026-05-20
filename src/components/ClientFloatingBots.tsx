"use client"

import dynamic from "next/dynamic"

const FloatingBots = dynamic(() => import("@/components/FloatingBots"), {
  ssr: false,
})

export default function ClientFloatingBots() {
  return <FloatingBots />
}
