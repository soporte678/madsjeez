"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface UserSubscription {
  tier: {
    max_images_per_product: number
    commission_rate: number
  } | null
}

export function useAuthUser() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const supabase = createClient()
  
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const user = session?.user
  const isAuthenticated = status === "authenticated"

  useEffect(() => {
    if (status === "loading") return
    
    if (!isAuthenticated) {
      router.push("/auth/login")
      return
    }

    // Fetch user subscription from Supabase
    const fetchSubscription = async () => {
      if (!user?.id) return
      
      try {
        const { data } = await supabase
          .from("subscriptions")
          .select(`
            tier:subscription_tiers(max_images_per_product, commission_rate)
          `)
          .eq("user_id", user.id)
          .eq("status", "active")
          .single()

        if (data?.tier) {
          setSubscription({ tier: data.tier as any })
        } else {
          // Default free tier
          setSubscription({
            tier: {
              max_images_per_product: 5,
              commission_rate: 0,
            },
          })
        }
      } catch (error) {
        console.error("Error fetching subscription:", error)
        setSubscription({
          tier: {
            max_images_per_product: 5,
            commission_rate: 10,
          },
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscription()
  }, [isAuthenticated, status, router, supabase, user?.id])

  return {
    user,
    session,
    subscription,
    isLoading: isLoading || status === "loading",
    isAuthenticated,
    supabase,
  }
}
