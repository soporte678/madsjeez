import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/seller/payment-gateway/mercadopago/disconnect
 * 
 * Desconecta la cuenta de MercadoPago del vendedor
 */
export async function POST() {
  try {
    const supabase = await createClient();
    
    // Verificar que el usuario esté autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Eliminar la conexión de la base de datos
    const { error: deleteError } = await supabase
      .from("seller_mercadopago")
      .delete()
      .eq("seller_id", user.id);

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
