import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/seller/payment-gateway/mercadopago/auth
 *
 * Inicia el flujo OAuth de MercadoPago para conectar la cuenta del vendedor
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "No autorizado. Por favor, iniciá sesión nuevamente." },
        { status: 401 }
      );
    }

    // Verificar que sea vendedor (tabla profiles, columna is_seller)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_seller")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.is_seller) {
      return NextResponse.json(
        { error: "Solo los vendedores pueden conectar MercadoPago" },
        { status: 403 }
      );
    }

    const clientId = process.env.MERCADOPAGO_CLIENT_ID;
    const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      console.error("MERCADOPAGO_CLIENT_ID o MERCADOPAGO_REDIRECT_URI no configurados");
      return NextResponse.json(
        { error: "Configuración de MercadoPago incompleta" },
        { status: 500 }
      );
    }

    const authUrl = new URL("https://auth.mercadopago.com.ar/authorization");
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("platform_id", "mp");
    authUrl.searchParams.append("redirect_uri", redirectUri);

    const state = Buffer.from(user.id).toString("base64");
    authUrl.searchParams.append("state", state);

    return NextResponse.json({ authUrl: authUrl.toString() });

  } catch (error) {
    console.error("Error iniciando OAuth MercadoPago:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
