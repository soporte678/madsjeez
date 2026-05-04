import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// URL y key hardcodeados (mismo valor que en server.ts)
const supabaseUrl = "https://doweovsukuskflgnxhhn.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvd2VvdnN1a3Vza2ZsZ254aGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTkyNzEsImV4cCI6MjA5Mjc5NTI3MX0.a0H7VrFwHWZavy8L0DjUyoAecQAdEf22UsA-a0p0u4Y";

/**
 * GET /api/seller/payment-gateway/mercadopago/auth
 * 
 * Inicia el flujo OAuth de MercadoPago para conectar la cuenta del vendedor
 */
export async function GET(request: NextRequest) {
  try {
    // Crear response para manejar cookies
    const response = NextResponse.next();
    
    // Crear cliente de Supabase con cookies de la request
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );
    
    // Verificar que el usuario esté autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "No autorizado. Por favor, iniciá sesión nuevamente." },
        { status: 401 }
      );
    }

    // Verificar que sea vendedor
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("isSeller")
      .eq("id", user.id)
      .single();

    if (userError || !userData?.isSeller) {
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

    // Construir URL de autorización de MercadoPago
    const authUrl = new URL("https://auth.mercadopago.com.ar/authorization");
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("platform_id", "mp");
    authUrl.searchParams.append("redirect_uri", redirectUri);
    
    // Estado para validar el callback (user_id para verificar después)
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
