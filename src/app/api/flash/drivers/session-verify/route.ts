import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/** Usado por middleware /driver para validar chofer activo con DB fresca (post-aprobación). */
export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    return NextResponse.json({ authenticated: false, isDriver: false }, { status: 401 })
  }

  const driver = await prisma.flashDriver.findUnique({
    where: { userId },
    select: { id: true, isActive: true },
  })

  return NextResponse.json({
    authenticated: true,
    isDriver: Boolean(driver?.isActive),
    driverId: driver?.id ?? null,
  })
}
