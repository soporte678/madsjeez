import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";

/**
 * POST /api/seller/payment-gateway/mercadopago/disconnect
 *
 * Desconecta la cuenta de MercadoPago del vendedor
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Eliminar la conexión de la base de datos
    const { error: deleteError } = await supabaseService
      .from("seller_mercadopago")
      .delete()
      .eq("seller_id", session.user.id);

    if (deleteError) {
      console.error("Error desconectando MercadoPago:", deleteError);
      return NextResponse.json(
        { error: "Error al desconectar" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Cuenta de MercadoPago desconectada correctamente",
    });
    
  } catch (error) {
    console.error("Error desconectando MercadoPago:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
