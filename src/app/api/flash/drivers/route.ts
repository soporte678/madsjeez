import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { adminJson, requireFlashAdmin } from "@/lib/flash/auth"
import { logger } from "@/lib/logger"

// GET — lista choferes (solo admin del panel /admin)
export async function GET(req: NextRequest) {
  try {
    const admin = await requireFlashAdmin(req)
    if (admin instanceof NextResponse) return admin

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get("filter")

    const where =
      filter === "active"
        ? { isActive: true }
        : filter === "pending"
          ? { isActive: false }
          : {}

    const drivers = await prisma.flashDriver.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, image: true } },
        _count: { select: { shipments: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return adminJson(admin, { drivers })
  } catch (error) {
    logger.error("flash/drivers GET error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// POST — registra un nuevo chofer (admin): email + contraseña provisional obligatoria
export async function POST(req: NextRequest) {
  try {
  const admin = await requireFlashAdmin(req)
  if (admin instanceof NextResponse) return admin

  const body = await req.json()
  const {
    email: rawEmail,
    userId: rawUserId,
    vehicleType,
    licenseNumber,
    phone,
    provisionalPassword,
    name,
  } = body as {
    email?: string
    userId?: string
    vehicleType?: string
    licenseNumber?: string
    phone?: string
    provisionalPassword?: string
    name?: string
  }

  const pwd = provisionalPassword?.trim()
  if (!pwd || pwd.length < 8) {
    return adminJson(
      admin,
      { error: "La contraseña provisional es obligatoria (mínimo 8 caracteres)." },
      { status: 400 }
    )
  }

  if (!phone?.trim()) {
    return adminJson(admin, { error: "El teléfono es obligatorio." }, { status: 400 })
  }

  let user = null as { id: string; email: string } | null

  if (rawEmail?.trim()) {
    const email = rawEmail.trim().toLowerCase()
    user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    })
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: (name ?? email.split("@")[0]).trim(),
          email,
          password: await bcrypt.hash(pwd, 12),
          role: "USER",
          isSeller: false,
          subscriptionTier: "FREE",
          reputationColor: "VERDE",
        },
        select: { id: true, email: true },
      })
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: await bcrypt.hash(pwd, 12) },
      })
    }
  } else if (rawUserId) {
    user = await prisma.user.findUnique({
      where: { id: rawUserId },
      select: { id: true, email: true },
    })
    if (!user) {
      return adminJson(admin, { error: "Usuario no encontrado" }, { status: 404 })
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(pwd, 12) },
    })
  } else {
    return adminJson(admin, { error: "Indicá el email del chofer." }, { status: 400 })
  }

  const existing = await prisma.flashDriver.findUnique({ where: { userId: user.id } })
  if (existing) {
    return adminJson(admin, { error: "Este usuario ya es chofer" }, { status: 409 })
  }

  const driver = await prisma.flashDriver.create({
    data: {
      userId: user.id,
      vehicleType: vehicleType ?? "moto",
      licenseNumber: licenseNumber?.trim() || null,
      phone: phone.trim(),
      isActive: true,
    },
    include: { user: { select: { name: true, email: true } } },
  })

  return adminJson(
    admin,
    {
      driver,
      loginUrl: "https://www.madsjeez.com.ar/driver/login",
      note: "Compartí el email y la contraseña provisional; el chofer puede cambiarla en Mi perfil.",
    },
    { status: 201 }
  )
  } catch (error) {
    logger.error("flash/drivers POST error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
