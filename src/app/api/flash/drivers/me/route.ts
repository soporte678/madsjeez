import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/flash/drivers/me — verifica si el usuario autenticado es un chofer activo
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const driver = await prisma.flashDriver.findUnique({
    where: { userId: (session.user as { id: string }).id },
    select: { id: true, isActive: true, vehicleType: true, phone: true },
  })

  if (!driver?.isActive) {
    return NextResponse.json({ error: "No sos transportista" }, { status: 403 })
  }

  return NextResponse.json({ driver })
}
