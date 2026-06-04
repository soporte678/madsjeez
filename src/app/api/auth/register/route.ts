import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  // Rate limiting: max 3 intentos por IP cada 15 minutos
  const ip = req.headers.get("x-forwarded-for") || "unknown"
  const { allowed, retryAfter } = rateLimit(`register:${ip}`, 3, 15 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  try {
    const body = await req.json()
    // Aceptamos name o full_name (compat con clientes legacy) + sanitizamos.
    const rawName: unknown = body?.name ?? body?.full_name
    const rawEmail: unknown = body?.email
    const rawPassword: unknown = body?.password
    const name = typeof rawName === "string" ? rawName.trim() : ""
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : ""
    const password = typeof rawPassword === "string" ? rawPassword : ""

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          error: "Faltan campos requeridos",
          missing: { name: !name, email: !email, password: !password },
        },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      )
    }
    if (name.length < 2) {
      return NextResponse.json(
        { error: "Ingresá tu nombre completo" },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      )
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // HIGH-7: nunca aceptar isSeller/role desde el body. El upgrade a SELLER requiere
    // un flow autenticado separado (/api/seller/onboarding) con verificación.
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isSeller: false,
        role: "USER",
      }
    })

    // Trial 14 días con beneficios ULTRA al primer registro.
    // One-shot: si por algún motivo el user ya existía (no debería) no
    // pisamos el trial_ends_at. Lo seteamos via SQL puro porque el cliente
    // Prisma no tiene el campo declarado todavía.
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    try {
      await prisma.$executeRaw`
        UPDATE users SET trial_ends_at = ${trialEnd}
        WHERE id = ${user.id} AND trial_ends_at IS NULL
      `
    } catch (e) {
      logger.warn("No se pudo activar trial 14d en registro:", e)
    }

    return NextResponse.json({
      message: "Usuario creado exitosamente",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isSeller: user.isSeller,
      }
    })
  } catch (error) {
    logger.error("Error en registro:", error)
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    )
  }
}
