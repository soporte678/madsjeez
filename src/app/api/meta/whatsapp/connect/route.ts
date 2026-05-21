import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { isMarketplaceAdminEmail } from "@/lib/admin-api"

// API para conectar número de WhatsApp Business
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { phoneNumber, businessName, sellerId } = await request.json()
    const isAdmin = await isMarketplaceAdminEmail(session.user.email)
    if (!isAdmin && sellerId !== session.user.id) {
      return NextResponse.json({ error: "No tienes permiso para modificar este vendedor" }, { status: 403 })
    }

    const supabase = await createClient()

    // Verificar que el vendedor exista
    const { data: seller, error: sellerError } = await supabase
      .from("users")
      .select("*")
      .eq("id", sellerId)
      .single()

    if (sellerError || !seller) {
      return NextResponse.json({ error: "Vendedor no encontrado" }, { status: 404 })
    }

    // Guardar configuración de WhatsApp
    const { data: config, error: configError } = await supabase
      .from("whatsapp_config")
      .upsert({
        seller_id: sellerId,
        phone_number: phoneNumber,
        business_name: businessName,
        is_connected: false, // Se conecta cuando Meta verifica
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: 500 })
    }

    // Aquí iría la llamada real a Meta API para registrar el número
    // Por ahora devolvemos el flujo de verificación
    return NextResponse.json({
      success: true,
      message: "Número registrado. Verifica el código SMS enviado a " + phoneNumber,
      configId: config.id,
      nextStep: "verify_code",
      phoneNumber
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
