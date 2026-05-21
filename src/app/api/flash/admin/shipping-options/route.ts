import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFlashAdmin, adminJson } from "@/lib/flash/auth"

/**
 * GET /api/flash/admin/shipping-options
 * Lista todas las opciones de envío Flash (admin).
 */
export async function GET(req: NextRequest) {
  const admin = await requireFlashAdmin(req)
  if (admin instanceof NextResponse) return admin

  try {
    const options = await prisma.flashShippingOption.findMany({
      orderBy: { priority: "desc" },
    })
    return adminJson(admin, { options })
  } catch {
    // Table not yet migrated — return defaults
    return adminJson(admin, {
      options: [
        { code: "flash_local", name: "Flash Local", price: 3999, priority: 70, coverageType: "local_radius", radiusKm: 15, isActive: true, estimatedTime: "Menos de 2 hs" },
        { code: "flash_plus", name: "Flash Plus", price: 5999, priority: 100, coverageType: "priority_radius", radiusKm: 15, isActive: true, estimatedTime: "Menos de 1 hora" },
        { code: "flash_normal", name: "Flash Normal", price: 6999, priority: 50, coverageType: "flex_zone", radiusKm: null, isActive: true, estimatedTime: "Mismo día" },
      ],
      warning: "Tabla no migrada; mostrando valores por defecto.",
    })
  }
}

/**
 * PATCH /api/flash/admin/shipping-options
 * Actualiza una opción de envío Flash.
 * Body: { code, price?, isActive?, radiusKm?, estimatedTime?, name?, description? }
 */
export async function PATCH(req: NextRequest) {
  const admin = await requireFlashAdmin(req)
  if (admin instanceof NextResponse) return admin

  const body = await req.json()
  const { code, ...updates } = body as {
    code: string
    price?: number
    isActive?: boolean
    radiusKm?: number | null
    estimatedTime?: string | null
    name?: string
    description?: string
    priority?: number
  }

  if (!code) {
    return adminJson(admin, { error: "code requerido" }, { status: 400 })
  }

  try {
    const option = await prisma.flashShippingOption.update({
      where: { code },
      data: updates,
    })
    return adminJson(admin, { option })
  } catch (e) {
    const err = e as { code?: string }
    if (err.code === "P2025") {
      return adminJson(admin, { error: "Opción no encontrada" }, { status: 404 })
    }
    throw e
  }
}
