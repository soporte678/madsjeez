import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: Request) {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return NextResponse.json({
      sales: { total: 0, count: 0, monthly: 0, monthlyCount: 0, today: 0, todayCount: 0 },
      products: { total: 0, active: 0, views: 0 },
      orders: [],
      questions: { pending: 0, total: 0 },
      reviews: { average: 0, total: 0, pending: 0 },
      reputation: { level: "VENDEDOR NUEVO", color: "green", sales: 0 },
    })
  }

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
    const { data: products, error: productsError } = (await supabase
      .from('products')
      .select('id, price, sales, views, status, created_at')
      .eq('seller_id', userId)) as any

    if (productsError) throw productsError

    // Obtener órdenes
    const { data: orders, error: ordersError } = (await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', userId)) as any

    if (ordersError && ordersError.code !== 'PGRST116') throw ordersError

    type ProdRow = { price?: number; sales?: number; views?: number; status?: string; created_at?: string };
    type OrdRow = { created_at?: string; total?: number };

    const prodList = (products ?? []) as ProdRow[];
    const ordList = (orders ?? []) as OrdRow[];

    // Calcular métricas
    const totalSales = prodList.reduce((sum: number, product: ProdRow) => sum + (product.sales || 0), 0) || 0
    const totalRevenue = prodList.reduce((sum: number, product: ProdRow) => sum + ((Number(product.price) || 0) * (product.sales || 0)), 0) || 0
    const totalViews = prodList.reduce((sum: number, product: ProdRow) => sum + (product.views || 0), 0) || 0

    const monthlyOrders = ordList.filter((order: OrdRow) => {
      const orderDate = new Date(order.created_at ?? 0)
      return orderDate >= startOfMonth
    }) || []

    const todayOrders = ordList.filter((order: OrdRow) => {
      const orderDate = new Date(order.created_at ?? 0)
      return orderDate >= startOfDay
    }) || []

    const monthlyRevenue = monthlyOrders.reduce((sum: number, order: OrdRow) => sum + (order.total || 0), 0)
    const todayRevenue = todayOrders.reduce((sum: number, order: OrdRow) => sum + (order.total || 0), 0)

    // Obtener preguntas pendientes
    const { data: questions, error: questionsError } = (await supabase
      .from('questions')
      .select('*')
      .eq('seller_id', userId)
      .eq('status', 'PENDING')) as any

    if (questionsError && questionsError.code !== 'PGRST116') throw questionsError

    // Obtener reseñas
    const { data: reviews, error: reviewsError } = (await supabase
      .from('reviews')
      .select('*')
      .eq('seller_id', userId)) as any

    if (reviewsError && reviewsError.code !== 'PGRST116') throw reviewsError

    type RevRow = { rating?: number };
    const revList = (reviews ?? []) as RevRow[];

    const averageRating = revList.length > 0
      ? revList.reduce((sum: number, review: RevRow) => sum + (review.rating || 0), 0) / revList.length
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
        total: prodList.length || 0,
        active: prodList.filter((p: ProdRow) => p.status === "ACTIVE").length || 0,
        views: totalViews
      },
      orders: ordList,
      questions: {
        pending: questions?.length || 0,
        total: questions?.length || 0
      },
      reviews: {
        average: averageRating,
        total: revList.length || 0,
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
