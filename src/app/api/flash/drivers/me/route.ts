import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFlashDriver } from "@/lib/flash/auth"

const driverSelect = {
  id: true,
  isActive: true,
  vehicleType: true,
  phone: true,
  licenseNumber: true,
  user: { select: { name: true, email: true } },
} as const

// GET /api/flash/drivers/me
export async function GET() {
  const auth = await requireFlashDriver()
  if (auth instanceof NextResponse) return auth

  const driver = await prisma.flashDriver.findUnique({
    where: { userId: auth.userId },
    select: driverSelect,
  })

  if (!driver?.isActive) {
    return NextResponse.json({ error: "No sos transportista" }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { password: true },
  })

  return NextResponse.json({
    driver,
    hasPassword: Boolean(user?.password),
  })
}

// PATCH /api/flash/drivers/me — teléfono, vehículo, licencia
export async function PATCH(req: NextRequest) {
  const auth = await requireFlashDriver()
  if (auth instanceof NextResponse) return auth

  let body: { phone?: string; vehicleType?: string; licenseNumber?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const data: { phone?: string; vehicleType?: string; licenseNumber?: string | null } = {}

  if (body.phone !== undefined) {
    const phone = body.phone.trim()
    if (!phone) {
      return NextResponse.json({ error: "El teléfono no puede estar vacío" }, { status: 400 })
    }
    data.phone = phone
  }

  if (body.vehicleType !== undefined) {
    const vehicleType = body.vehicleType.trim()
    if (!vehicleType) {
      return NextResponse.json({ error: "Indicá el tipo de vehículo" }, { status: 400 })
    }
    data.vehicleType = vehicleType
  }

  if (body.licenseNumber !== undefined) {
    data.licenseNumber = body.licenseNumber?.trim() || null
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No hay datos para actualizar" }, { status: 400 })
  }

  const driver = await prisma.flashDriver.update({
    where: { id: auth.driverId },
    data,
    select: driverSelect,
  })

  return NextResponse.json({ driver })
}
