"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useAuth(requireAuth: boolean = true) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated"
  const user = session?.user

  useEffect(() => {
    if (requireAuth && !isLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=" + encodeURIComponent(window.location.pathname))
    }
  }, [requireAuth, isLoading, isAuthenticated, router])

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
  }
}

export function useAuthRedirect(redirectTo: string = "/dashboard") {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push(redirectTo)
    }
  }, [status, router, redirectTo])

  return { status }
}
