import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFlashAdmin, adminJson } from "@/lib/flash/auth"

/**
 * GET /api/flash/admin/zones — list all Flash zones
 */
export async function GET(req: NextRequest) {
  const admin = await requireFlashAdmin(req)
  if (admin instanceof NextResponse) return admin
  try {
    const zones = await prisma.flashZone.findMany({ orderBy: { createdAt: "desc" } })
    return adminJson(admin, { zones })
  } catch {
    return adminJson(admin, { zones: [], warning: "Tabla no migrada" })
  }
}

/**
 * POST /api/flash/admin/zones — create a new zone
 */
export async function POST(req: NextRequest) {
  const admin = await requireFlashAdmin(req)
  if (admin instanceof NextResponse) return admin

  const body = await req.json()
  const { name, type, city, province, postalCodes, radiusKm, centerLat, centerLng } = body as {
    name: string; type: string; city?: string; province?: string
    postalCodes?: string[]; radiusKm?: number; centerLat?: number; centerLng?: number
  }

  if (!name || !type) {
    return adminJson(admin, { error: "name y type son requeridos" }, { status: 400 })
  }

  const zone = await prisma.flashZone.create({
    data: {
      name, type,
      city: city ?? null, province: province ?? null,
      postalCodes: postalCodes ?? [],
      radiusKm: radiusKm ?? null,
      centerLat: centerLat ?? null, centerLng: centerLng ?? null,
    },
  })
  return adminJson(admin, { zone })
}

/**
 * PATCH /api/flash/admin/zones — update a zone
 * Body: { id, ...updates }
 */
export async function PATCH(req: NextRequest) {
  const admin = await requireFlashAdmin(req)
  if (admin instanceof NextResponse) return admin

  const body = await req.json()
  const { id, name, type, city, province, postalCodes, radiusKm, centerLat, centerLng, isActive } = body
  if (!id) return adminJson(admin, { error: "id requerido" }, { status: 400 })

  const data = Object.fromEntries(
    Object.entries({ name, type, city, province, postalCodes, radiusKm, centerLat, centerLng, isActive })
      .filter(([_, v]) => v !== undefined)
  )
  const zone = await prisma.flashZone.update({ where: { id }, data })
  return adminJson(admin, { zone })
}

/**
 * DELETE /api/flash/admin/zones — delete a zone
 */
export async function DELETE(req: NextRequest) {
  const admin = await requireFlashAdmin(req)
  if (admin instanceof NextResponse) return admin

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return adminJson(admin, { error: "id requerido" }, { status: 400 })

  await prisma.flashZone.delete({ where: { id } })
  return adminJson(admin, { ok: true })
}
