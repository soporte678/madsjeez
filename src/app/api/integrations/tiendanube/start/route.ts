/**
 * GET /api/integrations/tiendanube/start
 *
 * Inicia el flujo OAuth de Tienda Nube. Redirige al consentimiento de la
 * tienda. Requiere TIENDANUBE_APP_ID configurado.
 *
 * Doc: https://tiendanube.github.io/api-documentation/authentication
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const appId = process.env.TIENDANUBE_APP_ID;
  if (!appId) {
    return NextResponse.json(
      {
        error:
          "La conexión directa con Tienda Nube todavía no está configurada. Usá la importación por CSV mientras tanto.",
        notConfigured: true,
      },
      { status: 503 },
    );
  }

  // Tienda Nube redirige a la redirect_uri configurada en el panel de la app.
  const authUrl = `https://www.tiendanube.com/apps/${appId}/authorize`;
  return NextResponse.redirect(authUrl);
}
