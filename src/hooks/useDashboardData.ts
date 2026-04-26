"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { createClient } from "@/lib/supabase/client"

interface DashboardData {
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    role: string
    isSeller: boolean
    reputationColor: string
    totalSales: number
    subscriptionTier: string
  } | null
  stats: {
    pendingQuestions: number
    itemsToImprove: number
    expressShipping: number
    competitivePrices: number
    monthlyRevenue: number
    monthlyViews: number
    conversionRate: number
  }
  products: any[]
  orders: any[]
  isLoading: boolean
  error: string | null
}

export function useDashboardData(): DashboardData {
  const { data: session, status } = useSession()
  const supabase = createClient()
  
  const [data, setData] = useState<DashboardData>({
    user: null,
    stats: {
      pendingQuestions: 0,
      itemsToImprove: 0,
      expressShipping: 0,
      competitivePrices: 0,
      monthlyRevenue: 0,
      monthlyViews: 0,
      conversionRate: 0,
    },
    products: [],
    orders: [],
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchDashboardData(session.user.id)
    }
  }, [status, session])

  const fetchDashboardData = async (userId: string) => {
    try {
      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()

      if (userError) throw userError

      // Fetch products count
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact" })
        .eq("seller_id", userId)

      // Fetch orders
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false })
        .limit(10)

      // Calculate stats
      const totalRevenue = ordersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

      setData({
        user: userData,
        stats: {
          pendingQuestions: 0, // TODO: Implement questions table
          itemsToImprove: productsCount || 0,
          expressShipping: 0, // TODO: Calculate from products
          competitivePrices: 0, // TODO: Calculate from market analysis
          monthlyRevenue: totalRevenue,
          monthlyViews: userData?.monthly_views || 0,
          conversionRate: userData?.conversion_rate || 0,
        },
        products: [],
        orders: ordersData || [],
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error)
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }))
    }
  }

  return data
}
