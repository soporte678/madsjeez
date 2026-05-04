import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";

/**
 * GET /api/seller/payment-gateway/mercadopago/status
 *
 * Devuelve el estado de la conexión de MercadoPago del vendedor actual
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Buscar la conexión de MercadoPago del vendedor
    const { data: connection, error: dbError } = await supabaseService
      .from("seller_mercadopago")
      .select("is_connected, is_active, mp_email, mp_nickname, created_at, updated_at")
      .eq("seller_id", session.user.id)
      .single();

    if (dbError && dbError.code !== "PGRST116") { // PGRST116 = no rows returned
      console.error("Error consultando estado de MercadoPago:", dbError);
      return NextResponse.json(
        { error: "Error consultando estado" },
        { status: 500 }
      );
    }

    // Si no hay conexión, devolver disconnected
    if (!connection) {
      return NextResponse.json({
        connected: false,
        active: false,
        email: null,
        nickname: null,
        connected_at: null,
      });
    }

    return NextResponse.json({
      connected: connection.is_connected,
      active: connection.is_active,
      email: connection.mp_email,
      nickname: connection.mp_nickname,
      connected_at: connection.created_at,
      updated_at: connection.updated_at,
    });
    
  } catch (error) {
    console.error("Error obteniendo estado de MercadoPago:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
