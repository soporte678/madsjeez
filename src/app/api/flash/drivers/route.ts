import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminActorId, adminJson, requireFlashAdmin } from "@/lib/flash/auth"

// GET — lista choferes (solo admin del panel /admin)
export async function GET(req: NextRequest) {
  const admin = await requireFlashAdmin(req)
  if (admin instanceof NextResponse) return admin

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get("filter")

  const where =
    filter === "active"
      ? { isActive: true }
      : filter === "pending"
        ? { isActive: false }
        : {}

  const drivers = await prisma.flashDriver.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, image: true } },
      _count: { select: { shipments: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return adminJson(admin, { drivers })
}

// POST — registra un nuevo chofer (admin)
export async function POST(req: NextRequest) {
  const admin = await requireFlashAdmin(req)
  if (admin instanceof NextResponse) return admin

  const { userId, vehicleType, licenseNumber, phone } = await req.json()

  const existing = await prisma.flashDriver.findUnique({ where: { userId } })
  if (existing) return adminJson(admin, { error: "Este usuario ya es chofer" }, { status: 409 })

  const driver = await prisma.flashDriver.create({
    data: {
      userId,
      vehicleType: vehicleType ?? "moto",
      licenseNumber,
      phone,
      isActive: true,
    },
    include: { user: { select: { name: true, email: true } } },
  })

  return adminJson(admin, { driver }, { status: 201 })
}
