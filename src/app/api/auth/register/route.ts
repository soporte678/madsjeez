import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { checkRateLimitAsync, clientIpFromRequest } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"
import { TRIAL_MS } from "@/lib/subscription/effective-tier"

export async function POST(req: Request) {
  // Rate limiting: max 3 intentos por IP cada 15 minutos
  const ip = clientIpFromRequest(req)
  const rl = await checkRateLimitAsync(`register:${ip}`, { max: 3, windowMs: 15 * 60 * 1000 })
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    )
  }

  try {
    const body = await req.json()
    const rawName: unknown = body?.name ?? body?.full_name
    const rawEmail: unknown = body?.email
    const rawPassword: unknown = body?.password
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : ""
    const password = typeof rawPassword === "string" ? rawPassword : ""
    // Nombre opcional en registro rápido: se deriva del email si no viene
    const nameInput = typeof rawName === "string" ? rawName.trim() : ""
    const name = nameInput.length >= 2 ? nameInput : email.split("@")[0].replace(/[._-]/g, " ")

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
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

    // Trial 6 meses con beneficios ULTRA al primer registro.
    // One-shot: solo si trial_ends_at es null (nunca tuvo trial).
    // Lo seteamos via SQL puro porque el cliente Prisma no tiene el campo declarado.
    const trialEnd = new Date(Date.now() + TRIAL_MS)
    try {
      await prisma.$executeRaw`
        UPDATE users SET trial_ends_at = ${trialEnd}
        WHERE id = ${user.id} AND trial_ends_at IS NULL
      `
    } catch (e) {
      logger.warn("No se pudo activar trial 6m en registro:", e)
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
