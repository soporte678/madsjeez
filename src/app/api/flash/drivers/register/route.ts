import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// POST /api/flash/drivers/register — registro público de transportistas
// Crea cuenta de usuario + FlashDriver con isActive=false (requiere aprobación admin)
export async function POST(req: NextRequest) {
  const { name, email, password, phone, vehicleType, dni, province } = await req.json()

  if (!name || !email || !password || !phone || !vehicleType || !dni) {
    return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 })
  }
  if (!/^\d{7,8}$/.test(dni.replace(/\D/g, ""))) {
    return NextResponse.json({ error: "DNI inválido" }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    const isDriver = await prisma.flashDriver.findUnique({ where: { userId: existing.id } })
    if (isDriver) {
      return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 })
    }
    // Usuario marketplace existente: guardar contraseña si no tenía (login chofer usa credentials)
    if (!existing.password) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { password: await bcrypt.hash(password, 12) },
      })
    }
    await prisma.flashDriver.create({
      data: {
        userId: existing.id,
        phone,
        vehicleType,
        isActive: false,
      },
    })
    return NextResponse.json({ status: "pending" }, { status: 201 })
  }

  const hashed = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: "USER",
      isSeller: false,
      subscriptionTier: "FREE",
      reputationColor: "VERDE",
    },
  })

  await prisma.flashDriver.create({
    data: {
      userId: user.id,
      phone,
      vehicleType,
      isActive: false,
    },
  })

  return NextResponse.json({ status: "pending" }, { status: 201 })
}
