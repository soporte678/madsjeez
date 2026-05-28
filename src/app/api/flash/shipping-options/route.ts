import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/flash/shipping-options?postalCode=1812&city=Carlos+Spegazzini&province=Buenos+Aires
 *
 * Devuelve las 3 opciones Flash con disponibilidad según la dirección del comprador.
 * Público (no requiere auth) — se llama desde el checkout.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const postalCode = searchParams.get("postalCode") ?? ""
  const city = searchParams.get("city") ?? ""
  const province = searchParams.get("province") ?? ""

  // Cargar opciones activas
  let options: {
    id: string
    code: string
    name: string
    description: string
    price: number
    priority: number
    coverageType: string
    radiusKm: number | null
    isActive: boolean
    estimatedTime: string | null
  }[] = []

  try {
    options = (await prisma.flashShippingOption.findMany({
      where: { isActive: true },
      orderBy: { priority: "desc" },
    })).map((o) => ({ ...o, price: Number(o.price) }))
  } catch {
    // Table may not exist yet — return defaults
    options = [
      {
        id: "flash_local",
        code: "flash_local",
        name: "Flash Local — Entrega lo antes posible",
        description: "Busca un conductor local disponible para retirar y entregar el pedido lo antes posible.",
        price: 3999,
        priority: 70,
        coverageType: "local_radius",
        radiusKm: 15,
        isActive: true,
        estimatedTime: "Menos de 2 hs",
      },
      {
        id: "flash_plus",
        code: "flash_plus",
        name: "Flash Plus — Prioridad alta",
        description: "Entrega prioritaria con conductor local. El pedido pasa a los primeros lugares de la cola de asignación.",
        price: 5999,
        priority: 100,
        coverageType: "priority_radius",
        radiusKm: 15,
        isActive: true,
        estimatedTime: "Menos de 1 hora",
      },
      {
        id: "flash_normal",
        code: "flash_normal",
        name: "Flash Normal — Cobertura ampliada",
        description: "Entrega Flash en radio más amplio, usando zonas estables predefinidas.",
        price: 6999,
        priority: 50,
        coverageType: "flex_zone",
        radiusKm: null,
        isActive: true,
        estimatedTime: "Mismo día",
      },
    ]
  }

  // Check zones for flex coverage
  let zones: { postalCodes: string[]; province: string | null; isActive: boolean }[] = []
  try {
    zones = await prisma.flashZone.findMany({
      where: { isActive: true },
      select: { postalCodes: true, province: true, isActive: true },
    })
  } catch {
    // Table not yet created — assume all zones available
  }

  const inFlexZone =
    zones.length === 0 || // if no zones configured, assume available everywhere
    zones.some(
      (z) =>
        (z.postalCodes.length === 0 || z.postalCodes.includes(postalCode)) &&
        (!z.province || z.province.toLowerCase() === province.toLowerCase())
    )

  // For local_radius and priority_radius, we can't compute real distance without geocoding.
  // Instead, we use postal code + province match as proxy. If the address is in the same province
  // as any configured zone center, we consider it "in radius". Admin can refine later.
  const inLocalRadius = inFlexZone // simplified: same zone check. Future: geocode + haversine.

  const result = options.map((opt) => {
    let available = true
    let unavailableReason: string | null = null

    if (opt.coverageType === "local_radius" || opt.coverageType === "priority_radius") {
      if (!inLocalRadius) {
        available = false
        unavailableReason = `${opt.name.split("—")[0].trim()} no está disponible para esta dirección.`
      }
    }

    if (opt.coverageType === "flex_zone") {
      if (!inFlexZone) {
        available = false
        unavailableReason = "Flash Normal no disponible para esta dirección."
      }
    }

    // If no address info at all, show all as available (user hasn't typed yet)
    if (!postalCode && !city && !province) {
      available = true
      unavailableReason = null
    }

    return {
      code: opt.code,
      name: opt.name,
      description: opt.description,
      price: opt.price,
      priority: opt.priority,
      coverageType: opt.coverageType,
      radiusKm: opt.radiusKm,
      estimatedTime: opt.estimatedTime,
      available,
      unavailableReason,
      recommended: opt.code === "flash_plus",
    }
  })

  return NextResponse.json({ options: result })
}
