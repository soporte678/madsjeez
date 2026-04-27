"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { supabase } from "@/lib/supabase"

interface DashboardMetrics {
  sales: {
    total: number
    count: number
    today: number
    todayCount: number
  }
  products: {
    total: number
    views: number
  }
  orders: any[]
  claims: {
    open: number
  }
  reviews: {
    pending: number
    average: number
    total: number
  }
  questions: {
    pending: number
  }
  promotions: {
    active: number
  }
  shipping: {
    express: number
  }
}

interface DashboardData {
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    role: string
    isSeller: boolean
    reputationColor: string
    subscriptionTier: string
    totalSales: number
  } | null
  metrics: DashboardMetrics | null
  isLoading: boolean
  error: string | null
}

export function useDashboardData(): DashboardData & { refresh: () => void } {
  const { data: session, status } = useSession()
  
  const [data, setData] = useState<DashboardData>({
    user: null,
    metrics: null,
    isLoading: true,
    error: null,
  })

  const fetchDashboardData = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) return

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }))

      // Obtener datos del usuario desde Supabase
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userError && userError.code !== 'PGRST116') {
        // Si el usuario no existe, crearlo
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) throw createError
        // Usar el nuevo usuario creado
        userData = newUser
      }

      // Obtener productos del usuario
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, price, sales, views, status, created_at')
        .eq('seller_id', session.user.id)

      if (productsError) throw productsError

      // Obtener órdenes
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (ordersError && ordersError.code !== 'PGRST116') throw ordersError

      // Obtener preguntas pendientes
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('seller_id', session.user.id)
        .eq('status', 'PENDING')

      if (questionsError && questionsError.code !== 'PGRST116') throw questionsError

      // Obtener reseñas pendientes
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('seller_id', session.user.id)
        .eq('status', 'PENDING')

      if (reviewsError && reviewsError.code !== 'PGRST116') throw reviewsError

      // Calcular métricas
      const totalSales = productsData?.reduce((sum, product) => sum + (product.sales || 0), 0) || 0
      const totalRevenue = productsData?.reduce((sum, product) => sum + (product.price * (product.sales || 0)), 0) || 0
      const totalViews = productsData?.reduce((sum, product) => sum + (product.views || 0), 0) || 0

      const today = new Date()
      const todaySales = ordersData?.filter(order => {
        const orderDate = new Date(order.created_at)
        return orderDate.toDateString() === today.toDateString()
      }).length || 0

      const todayRevenue = ordersData?.filter(order => {
        const orderDate = new Date(order.created_at)
        return orderDate.toDateString() === today.toDateString()
      }).reduce((sum, order) => sum + (order.total || 0), 0) || 0

      const metrics: DashboardMetrics = {
        sales: {
          total: totalRevenue,
          count: totalSales,
          today: todayRevenue,
          todayCount: todaySales
        },
        products: {
          total: productsData?.length || 0,
          views: totalViews
        },
        orders: ordersData || [],
        claims: {
          open: 0
        },
        reviews: {
          pending: reviewsData?.length || 0,
          average: 0,
          total: reviewsData?.length || 0
        },
        questions: {
          pending: questionsData?.length || 0
        },
        promotions: {
          active: 0
        },
        shipping: {
          express: 0
        }
      }

      setData({
        user: {
          id: userData?.id || session.user.id,
          name: userData?.seller_name || userData?.name || session.user.name || null,
          email: userData?.email || session.user.email || '',
          image: userData?.image || session.user.image || null,
          role: userData?.role || 'user',
          isSeller: userData?.is_seller || false,
          reputationColor: userData?.reputation_color || 'green',
          subscriptionTier: userData?.subscription_tier || 'free',
          totalSales: totalSales
        },
        metrics,
        isLoading: false,
        error: null
      })
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setData(prev => ({
        ...prev,
        error: "Error al cargar los datos del dashboard",
        isLoading: false
      }))
    }
  }, [session, status])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const refresh = useCallback(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return {
    ...data,
    refresh
  }
}
