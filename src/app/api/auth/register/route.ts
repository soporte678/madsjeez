import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { name, email, password, isSeller, sellerName } = await req.json()

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

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isSeller: isSeller || false,
        sellerName: isSeller ? sellerName : null,
        sellerSince: isSeller ? new Date() : null,
        role: isSeller ? "SELLER" : "USER",
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
    console.error("Error en registro:", error)
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    )
  }
}
