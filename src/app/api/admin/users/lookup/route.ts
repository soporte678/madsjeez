import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase()
  if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 })

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, name: true, email: true },
  })

  if (!user) return NextResponse.json({ error: "No existe un usuario con ese email" }, { status: 404 })

  return NextResponse.json(user)
}
