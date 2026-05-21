import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFlashDriver } from "@/lib/flash/auth"
import { FLASH_SUPPORT_CATEGORIES } from "@/lib/flash/driver-constants"

export async function GET() {
  return NextResponse.json({ categories: FLASH_SUPPORT_CATEGORIES })
}

export async function POST(req: NextRequest) {
  const auth = await requireFlashDriver()
  if (auth instanceof NextResponse) return auth

  let body: { category?: string; message?: string; shipmentId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const category = body.category?.trim()
  if (!category) {
    return NextResponse.json({ error: "Elegí un motivo" }, { status: 400 })
  }

  const valid = FLASH_SUPPORT_CATEGORIES.some((c) => c.id === category)
  if (!valid) {
    return NextResponse.json({ error: "Categoría inválida" }, { status: 400 })
  }

  const urgent = FLASH_SUPPORT_CATEGORIES.find((c) => c.id === category)?.urgent

  const ticket = await prisma.flashSupportTicket.create({
    data: {
      driverId: auth.driverId,
      category,
      message: body.message?.trim() || null,
      shipmentId: body.shipmentId || null,
      priority: urgent ? "urgent" : "normal",
    },
  })

  return NextResponse.json({ ticket, message: "Solicitud enviada. Soporte te contactará pronto." }, { status: 201 })
}
