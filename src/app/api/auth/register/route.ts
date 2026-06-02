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
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
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
