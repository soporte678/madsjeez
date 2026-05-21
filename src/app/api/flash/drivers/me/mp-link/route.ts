import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFlashDriver } from "@/lib/flash/auth"
import { isPrismaSchemaDriftError } from "@/lib/flash/prisma-safe"

/**
 * POST /api/flash/drivers/me/mp-link
 * El conductor vincula su billetera de MercadoPago.
 * Por seguridad, solo se guarda una referencia no-sensible (email MP o alias).
 */
export async function POST(req: NextRequest) {
  const auth = await requireFlashDriver()
  if (auth instanceof NextResponse) return auth

  let body: { mpAccountRef?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const ref = body.mpAccountRef?.trim()
  if (!ref || ref.length < 3) {
    return NextResponse.json({ error: "Ingresá tu email o alias de MercadoPago" }, { status: 400 })
  }

  try {
    const driver = await prisma.flashDriver.update({
      where: { id: auth.driverId },
      data: {
        mpLinked: true,
        mpAccountRef: ref,
        mpLinkedAt: new Date(),
      },
      select: { mpLinked: true, mpAccountRef: true, mpLinkedAt: true },
    })
    return NextResponse.json({ driver })
  } catch (e) {
    if (isPrismaSchemaDriftError(e)) {
      return NextResponse.json({
        driver: { mpLinked: true, mpAccountRef: ref, mpLinkedAt: new Date() },
        warning: "Migración pendiente; dato no persistido.",
      })
    }
    throw e
  }
}

/**
 * DELETE /api/flash/drivers/me/mp-link
 * Desvincular MercadoPago
 */
export async function DELETE() {
  const auth = await requireFlashDriver()
  if (auth instanceof NextResponse) return auth

  try {
    const driver = await prisma.flashDriver.update({
      where: { id: auth.driverId },
      data: {
        mpLinked: false,
        mpAccountRef: null,
        mpLinkedAt: null,
      },
      select: { mpLinked: true },
    })
    return NextResponse.json({ driver })
  } catch (e) {
    if (isPrismaSchemaDriftError(e)) {
      return NextResponse.json({ driver: { mpLinked: false } })
    }
    throw e
  }
}
