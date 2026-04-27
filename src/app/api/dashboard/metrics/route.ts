import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id
    
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Obtener productos del usuario
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price, sales, views, status, created_at')
      .eq('seller_id', userId)

    if (productsError) throw productsError

    // Obtener órdenes
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', userId)

    if (ordersError && ordersError.code !== 'PGRST116') throw ordersError

    // Calcular métricas
    const totalSales = products?.reduce((sum, product) => sum + (product.sales || 0), 0) || 0
    const totalRevenue = products?.reduce((sum, product) => sum + (product.price * (product.sales || 0)), 0) || 0
    const totalViews = products?.reduce((sum, product) => sum + (product.views || 0), 0) || 0

    const monthlyOrders = orders?.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= startOfMonth
    }) || []

    const todayOrders = orders?.filter(order => {
      const orderDate = new Date(order.created_at)
      return orderDate >= startOfDay
    }) || []

    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0)

    // Obtener preguntas pendientes
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('seller_id', userId)
      .eq('status', 'PENDING')

    if (questionsError && questionsError.code !== 'PGRST116') throw questionsError

    // Obtener reseñas
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('seller_id', userId)

    if (reviewsError && reviewsError.code !== 'PGRST116') throw reviewsError

    const averageRating = reviews && reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length 
      : 0

    const metrics = {
      sales: {
        total: totalRevenue,
        count: totalSales,
        monthly: monthlyRevenue,
        monthlyCount: monthlyOrders.length,
        today: todayRevenue,
        todayCount: todayOrders.length
      },
      products: {
        total: products?.length || 0,
        active: products?.filter(p => p.status === 'ACTIVE').length || 0,
        views: totalViews
      },
      orders: orders || [],
      questions: {
        pending: questions?.length || 0,
        total: questions?.length || 0
      },
      reviews: {
        average: averageRating,
        total: reviews?.length || 0,
        pending: 0
      },
      reputation: {
        level: "VENDEDOR NUEVO",
        color: "green",
        sales: totalSales
      }
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error)
    return NextResponse.json(
      { error: "Error al cargar las métricas del dashboard" },
      { status: 500 }
    )
  }
}
