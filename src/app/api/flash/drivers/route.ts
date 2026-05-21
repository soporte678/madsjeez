import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — lista choferes (admin): activos + pendientes de aprobación
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get("filter") // "active" | "pending" | undefined = all

  const where = filter === "active" ? { isActive: true }
    : filter === "pending" ? { isActive: false }
    : {}

  const drivers = await prisma.flashDriver.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, image: true } },
      _count: { select: { shipments: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ drivers })
}

// POST — registra un nuevo chofer
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { userId, vehicleType, licenseNumber, phone } = await req.json()

  const existing = await prisma.flashDriver.findUnique({ where: { userId } })
  if (existing) return NextResponse.json({ error: "Este usuario ya es chofer" }, { status: 409 })

  const driver = await prisma.flashDriver.create({
    data: { userId, vehicleType: vehicleType ?? "moto", licenseNumber, phone },
    include: { user: { select: { name: true, email: true } } },
  })

  return NextResponse.json({ driver }, { status: 201 })
}
