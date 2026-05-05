import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createMpOAuthState } from "@/lib/mp-oauth-state";

/**
 * GET /api/seller/payment-gateway/mercadopago/auth
 *
 * Inicia el flujo OAuth de MercadoPago para conectar la cuenta del vendedor.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado. Por favor, iniciá sesión nuevamente." },
        { status: 401 }
      );
    }

    if (!session.user.isSeller) {
      return NextResponse.json(
        { error: "Solo los vendedores pueden conectar MercadoPago" },
        { status: 403 }
      );
    }

    const stateSecret = process.env.MP_OAUTH_STATE_SECRET;
    if (!stateSecret || stateSecret.length < 16) {
      console.error("MP_OAUTH_STATE_SECRET missing or too short");
      return NextResponse.json(
        { error: "Configuración de seguridad OAuth incompleta (MP_OAUTH_STATE_SECRET)" },
        { status: 500 }
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

    const state = createMpOAuthState(session.user.id as string, stateSecret);
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
