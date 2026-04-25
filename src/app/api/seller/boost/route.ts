import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia"
})

// POST /api/seller/boost - Impulsar producto
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    if (!session.user.isSeller) {
      return NextResponse.json(
        { error: "Solo los vendedores pueden impulsar productos" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { productId, duration = 7 } = body

    // Obtener producto y verificar propiedad
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product || product.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      )
    }

    // Obtener vendedor para calcular costo según reputación
    const seller = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!seller) {
      return NextResponse.json(
        { error: "Vendedor no encontrado" },
        { status: 404 }
      )
    }

    // Calcular costo según reputación
    let multiplier = 1
    switch (seller.reputationColor) {
      case "ROJO":
        multiplier = 3 // 300% más caro
        break
      case "NARANJA":
        multiplier = 2.5
        break
      case "AMARILLO":
        multiplier = 1.8
        break
      case "VERDE":
        multiplier = 1.2
        break
      case "VERDE_OSCURO":
        multiplier = 1 // Costo base
        break
    }

    // Obtener costo base de configuración
    const config = await prisma.siteConfig.findFirst()
    const baseCost = config?.boostBaseCost || 9999
    const cost = Math.round(baseCost * multiplier)

    // Crear payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: cost,
      currency: "clp",
      metadata: {
        type: "boost",
        productId,
        sellerId: session.user.id,
      }
    })

    return NextResponse.json({
      cost,
      multiplier,
      reputationColor: seller.reputationColor,
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error("Error creating boost:", error)
    return NextResponse.json(
      { error: "Error al crear impulso" },
      { status: 500 }
    )
  }
}

// PUT /api/seller/boost - Confirmar y aplicar impulso
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { productId, cost, duration = 7, stripeId } = body

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + duration)

    // Crear registro de impulso
    await prisma.productBoost.create({
      data: {
        cost,
        duration,
        startDate,
        endDate,
        productId,
        sellerId: session.user.id,
        stripeId,
      }
    })

    // Actualizar producto
    await prisma.product.update({
      where: { id: productId },
      data: {
        isBoosted: true,
        boostExpiry: endDate,
      }
    })

    return NextResponse.json({
      message: "Producto impulsado exitosamente",
      endDate,
    })
  } catch (error) {
    console.error("Error applying boost:", error)
    return NextResponse.json(
      { error: "Error al aplicar impulso" },
      { status: 500 }
    )
  }
}
