export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { MercadoPagoConfig, Preference } from "mercadopago"
import {
  getMarketplaceAccessToken,
  invalidateMarketplaceAccessToken,
} from "@/lib/mercadopago/marketplace-token"

/** Construye el client MP con un token siempre fresco (auto-refresh). */
async function getMpClient() {
  try {
    const accessToken = await getMarketplaceAccessToken()
    return new MercadoPagoConfig({
      accessToken,
      options: { timeout: 5000 },
    })
  } catch (e) {
    console.error("No pudimos obtener token MP:", e)
    return null
  }
}

// Planes y precios base (3 tiers).
// FREE se activa en /api/subscriptions/activate-free (sin MP).
// GOLD legacy aceptado para no romper suscriptores actuales — alias de PLATA.
const PLAN_PRICES: Record<string, number> = {
  PLATA: 9999,     // PRO — 200 publicaciones
  GOLD: 9999,      // legacy alias
  PLATINUM: 19999, // ULTRA — ilimitadas
}

// Descuentos por período
const DISCOUNTS: Record<number, number> = {
  1: 0,    // Mensual - sin descuento
  6: 20,   // 6 meses - 20% off
  12: 30   // 12 meses - 30% off
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

    let mpClient = await getMpClient()
    if (!mpClient) {
      return NextResponse.json(
        { error: "MercadoPago no está configurado" },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { tier, billingCycle, totalAmount, discountPercent } = body

    // Validar plan
    if (!PLAN_PRICES[tier]) {
      return NextResponse.json(
        { error: "Plan no válido" },
        { status: 400 }
      )
    }

    // Validar ciclo de facturación
    if (!DISCOUNTS[billingCycle]) {
      return NextResponse.json(
        { error: "Ciclo de facturación no válido" },
        { status: 400 }
      )
    }

    const basePrice = PLAN_PRICES[tier]
    const discount = DISCOUNTS[billingCycle]
    const months = billingCycle
    
    // Calcular precios
    const totalWithoutDiscount = basePrice * months
    const discountAmount = totalWithoutDiscount * (discount / 100)
    const finalPrice = totalWithoutDiscount - discountAmount

    // Calcular fechas
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + months)

    // Crear la suscripción en la base de datos (pendiente de pago)
    const subscription = await prisma.subscription.create({
      data: {
        tier,
        price: basePrice,
        billingCycle: months,
        totalAmount: finalPrice,
        discountPercent: discount,
        startDate,
        endDate,
        status: "pending", // Se actualizará cuando el pago se complete
        userId: session.user.id,
      }
    })

    // Crear preferencia de MercadoPago
    const preference = new Preference(mpClient)
    
    const preferenceData = {
      items: [
        {
          id: subscription.id,
          title: `Suscripción ${tier} - MadsJeez (${months} meses)`,
          description: `Acceso a la plataforma MadsJeez - Plan ${tier} por ${months} meses${discount > 0 ? ` (${discount}% de descuento)` : ''}`,
          quantity: 1,
          unit_price: finalPrice,
          currency_id: "ARS",
        }
      ],
      payer: {
        email: session.user.email || "",
        name: session.user.name || undefined,
      },
      external_reference: subscription.id,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/subscriptions/success?subscription=${subscription.id}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/subscriptions/failure?subscription=${subscription.id}`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/subscriptions/pending?subscription=${subscription.id}`,
      },
      auto_return: "approved",
      // Excluir pagos en efectivo para suscripciones
      payment_methods: {
        excluded_payment_types: [
          { id: "ticket" },
          { id: "atm" }
        ],
        installments: 1, // Solo un pago (no cuotas para suscripciones)
      },
    }

    // Crear preference. Si MP responde 401 (token revocado/expirado),
    // forzamos refresh REAL (force:true, no re-lee el env vencido) y reintentamos.
    let preferenceResponse
    try {
      preferenceResponse = await preference.create({ body: preferenceData as any })
    } catch (mpErr: any) {
      const status = mpErr?.status || mpErr?.cause?.status
      const msg = String(mpErr?.message || "").toLowerCase()
      const looksUnauthorized = status === 401 || msg.includes("unauthorized") || msg.includes("invalid access token")
      if (looksUnauthorized) {
        // force:true ignora el env vencido y pide token fresco por client_credentials.
        invalidateMarketplaceAccessToken()
        const freshToken = await getMarketplaceAccessToken({ force: true })
        const retry = new Preference(new MercadoPagoConfig({ accessToken: freshToken, options: { timeout: 5000 } }))
        preferenceResponse = await retry.create({ body: preferenceData as any })
      } else {
        // Logueamos el detalle real de MP para diagnóstico.
        console.error("MP preference error:", JSON.stringify({
          status, message: mpErr?.message, cause: mpErr?.cause,
        }).slice(0, 800))
        throw mpErr
      }
    }

    // Actualizar la suscripción con el ID de preferencia
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        mpPreferenceId: preferenceResponse.id,
      }
    })

    return NextResponse.json({
      subscription,
      initPoint: preferenceResponse.init_point,
      sandboxInitPoint: preferenceResponse.sandbox_init_point,
    })
  } catch (error: any) {
    // Detalle real de MP/Prisma para diagnóstico (el SDK de MP anida la causa).
    const detail =
      error?.cause?.[0]?.description ||
      error?.cause?.message ||
      error?.message ||
      "Error al crear suscripción"
    console.error("Error creating subscription:", JSON.stringify({
      message: error?.message, status: error?.status, cause: error?.cause,
    }).slice(0, 1000))
    return NextResponse.json(
      { error: detail, message: detail },
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
        OR: [
          { status: "active" },
          { status: "pending" }
        ],
        endDate: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error("Error fetching subscription:", error)
    return NextResponse.json(
      { error: "Error al obtener suscripción" },
      { status: 500 }
    )
  }
}
