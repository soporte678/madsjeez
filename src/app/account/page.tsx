"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AccountPage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    } else if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}
