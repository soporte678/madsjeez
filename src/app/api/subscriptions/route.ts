export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Stripe from "stripe"

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }

  return new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
  })
}

// POST /api/subscriptions - Crear suscripción
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const stripe = getStripeClient()

    const body = await req.json()
    const { tier, paymentMethodId } = body

    // Obtener precios de configuración
    const config = await prisma.siteConfig.findFirst()
    
    let price = 0
    let stripePriceId = ""
    
    switch (tier) {
      case "PLATA":
        price = config?.pricePlata || 9999
        stripePriceId = process.env.STRIPE_PRICE_PLATA!
        break
      case "GOLD":
        price = config?.priceGold || 19999
        stripePriceId = process.env.STRIPE_PRICE_GOLD!
        break
      case "PLATINUM":
        price = config?.pricePlatinum || 49999
        stripePriceId = process.env.STRIPE_PRICE_PLATINUM!
        break
      default:
        return NextResponse.json(
          { error: "Plan no válido" },
          { status: 400 }
        )
    }

    // Crear o obtener cliente de Stripe
    let customerId = ""
    const existingSubs = await prisma.subscription.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }
    })
    
    if (existingSubs?.stripeId) {
      customerId = existingSubs.stripeId
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || undefined,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
      customerId = customer.id
    }

    // Crear suscripción en Stripe
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: stripePriceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    })

    // Calcular fechas
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)

    // Crear suscripción en base de datos
    const subscription = await prisma.subscription.create({
      data: {
        tier,
        price,
        startDate,
        endDate,
        stripeId: stripeSubscription.id,
        stripePriceId,
        userId: session.user.id,
      }
    })

    // Actualizar usuario
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionTier: tier,
        subscriptionExpiry: endDate,
      }
    })

    return NextResponse.json({
      subscription,
      clientSecret: (stripeSubscription.latest_invoice as any).payment_intent?.client_secret,
    })
  } catch (error) {
    console.error("Error creating subscription:", error)
    return NextResponse.json(
      { error: "Error al crear suscripción" },
      { status: 500 }
    )
  }
}

// GET /api/subscriptions - Obtener suscripción actual
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "active",
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(subscription)
  } catch (error) {
    console.error("Error fetching subscription:", error)
    return NextResponse.json(
      { error: "Error al cargar suscripción" },
      { status: 500 }
    )
  }
}
