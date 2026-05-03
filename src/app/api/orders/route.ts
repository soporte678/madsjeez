export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }

  return new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
  })
}

// POST /api/orders - Crear orden
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { items, shipping } = body

    // Calcular totales
    let subtotal = 0
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })
      if (!product || product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Producto ${item.productId} no disponible` },
          { status: 400 }
        )
      }
      subtotal += product.price * item.quantity
    }

    const shippingCost = subtotal > 50000 ? 0 : 3990
    const tax = subtotal * 0.19
    const total = subtotal + shippingCost + tax

    // Crear orden
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    const order = await prisma.order.create({
      data: {
        orderNumber,
        buyerId: (session.user as any).id,
        subtotal,
        shippingCost,
        tax,
        total,
        shippingName: shipping.name,
        shippingAddress: shipping.address,
        shippingCity: shipping.city,
        shippingState: shipping.state,
        shippingZip: shipping.zip,
        shippingPhone: shipping.phone,
        items: {
          create: items.map((item: any) => ({
            quantity: item.quantity,
            price: item.price,
            productId: item.productId,
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    // Update sales count in Supabase for purchased products
    try {
      const supabase = getSupabaseClient()
      for (const item of items) {
        // Get current sales count
        const { data: product } = await supabase
          .from("products")
          .select("sales")
          .eq("id", item.productId)
          .maybeSingle()

        if (product) {
          await supabase
            .from("products")
            .update({ sales: (product.sales || 0) + item.quantity })
            .eq("id", item.productId)
        }
      }
    } catch (e) {
      console.error("Error updating sales count in Supabase:", e)
      // Don't fail the order if sales update fails
    }

    // Crear payment intent con Stripe
    const stripe = getStripeClient()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total),
      currency: "clp",
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      }
    })

    return NextResponse.json({
      order,
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: "Error al crear orden" },
      { status: 500 }
    )
  }
}

// GET /api/orders - Obtener órdenes del usuario
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const orders = await prisma.order.findMany({
      where: { buyerId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1 }
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: "Error al cargar órdenes" },
      { status: 500 }
    )
  }
}
