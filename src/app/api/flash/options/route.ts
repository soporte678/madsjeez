import { NextResponse } from "next/server"

// Precios de negocio Flash — fuente única de verdad.
// Para cambiar precios solo modificar aquí (se reflejan en toda la app).
const FLASH_OPTIONS = [
  {
    code: "flash_local",
    name: "Flash Local",
    price: 3999,
    badge: "Rápido",
    description: "Busca un conductor local disponible para retirar y entregar tu pedido lo antes posible.",
    available: true,
    recommended: false,
  },
  {
    code: "flash_plus",
    name: "Flash Plus",
    price: 5999,
    badge: "Prioridad alta",
    description: "Entrega prioritaria. Tu pedido pasa a los primeros lugares de la cola.",
    available: true,
    recommended: true,
  },
  {
    code: "flash_normal",
    name: "Flash Normal",
    price: 6999,
    badge: "Cobertura ampliada",
    description: "Cobertura ampliada en zonas Flash establecidas.",
    available: true,
    recommended: false,
  },
] as const

export async function GET() {
  return NextResponse.json(FLASH_OPTIONS, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  })
}
