import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseService } from "@/lib/supabase/service"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

const BUCKET = "flash-photos"
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"]

// POST /api/flash/photos/upload — sube una foto al bucket y devuelve la URL firmada
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const shipmentId = formData.get("shipmentId") as string | null

  if (!file) return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 })
  if (!shipmentId) return NextResponse.json({ error: "shipmentId requerido" }, { status: 400 })

  // Ownership check: el usuario debe ser el comprador o el driver del envío
  const shipment = await prisma.flashShipment.findUnique({
    where: { id: shipmentId },
    select: { order: { select: { buyerId: true } }, driver: { select: { userId: true } } }
  })
  const userId = (session.user as { id: string }).id
  if (!shipment || (shipment.order.buyerId !== userId && shipment.driver?.userId !== userId)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: `Tipo de archivo no permitido: ${file.type}` }, { status: 415 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "El archivo supera el límite de 5 MB" }, { status: 413 })
  }

  const ext = file.type === "image/webp" ? "webp"
    : file.type === "image/png" ? "png"
    : file.type === "image/heic" ? "heic"
    : "jpg"

  const filename = `${shipmentId}/${userId}_${randomBytes(8).toString("hex")}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await supabaseService.storage
    .from(BUCKET)
    .upload(filename, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error("flash photo upload:", uploadError)
    return NextResponse.json({ error: "Error al subir la foto" }, { status: 500 })
  }

  // URL firmada con 1 año de vigencia (suficiente para auditoría)
  const { data: signed, error: signError } = await supabaseService.storage
    .from(BUCKET)
    .createSignedUrl(filename, 60 * 60 * 24 * 365)

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "No se pudo generar la URL de la foto" }, { status: 500 })
  }

  return NextResponse.json({ url: signed.signedUrl, path: filename })
}
