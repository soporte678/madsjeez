import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { requireFlashDriver } from "@/lib/flash/auth"

// PATCH /api/flash/drivers/me/password — cambiar contraseña de acceso al panel
export async function PATCH(req: NextRequest) {
  const auth = await requireFlashDriver()
  if (auth instanceof NextResponse) return auth

  let body: { currentPassword?: string; newPassword?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const newPassword = body.newPassword?.trim()
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "La nueva contraseña debe tener al menos 8 caracteres" },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { password: true },
  })

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  if (user.password) {
    const current = body.currentPassword ?? ""
    if (!current) {
      return NextResponse.json(
        { error: "Ingresá tu contraseña actual" },
        { status: 400 }
      )
    }
    const valid = await bcrypt.compare(current, user.password)
    if (!valid) {
      return NextResponse.json({ error: "La contraseña actual no es correcta" }, { status: 403 })
    }
  }

  await prisma.user.update({
    where: { id: auth.userId },
    data: { password: await bcrypt.hash(newPassword, 12) },
  })

  return NextResponse.json({ ok: true })
}
