# Credenciales pendientes — Madsjeez

Funciones implementadas en código pero que necesitan que el dueño cargue claves
externas para activarse. Mientras no estén, el código no rompe nada (degrada o
queda detrás de flag).

| Función | Variables | Dónde se obtienen | Estado del código |
|---------|-----------|-------------------|-------------------|
| **Mapas (geo UI)** | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAP_ID`, `GOOGLE_MAPS_SERVER_API_KEY` | Google Cloud Console (ver `docs/maps-setup.md`) | Backend PostGIS + API listos. UI pendiente. |
| **Conexión directa Tienda Nube** | `TIENDANUBE_APP_ID`, `TIENDANUBE_CLIENT_SECRET` | partners.tiendanube.com | OAuth start/callback listos; sin claves muestra "usá CSV". |
| **Cifrado integraciones** | `INTEGRATION_ENC_KEY` | generar 32 bytes (`openssl rand -base64 32`) | Cae a derivar de NEXTAUTH_SECRET si falta. |
| **Push interno** | `ADMIN_SETUP_SECRET` (ya existe) o `INTERNAL_API_SECRET` | definir en Railway | Requerido para enviar push; sin él /api/push/send rechaza todo. |
| **Email transaccional buyer** | `RESEND_API_KEY` (ya existe para admin) | resend.com | Plantillas listas; falta cablear emails al comprador. |
| **Merchant Center** | (sin clave; requiere alta manual en Merchant + subir feed URL) | merchants.google.com | Feed pendiente de construir (Wave D). |

## Cómo proceder cuando tengas una clave
1. Cargala en Railway → Variables del servicio `madsjeez`.
2. Railway redeploya solo.
3. Avisá y activamos el feature flag correspondiente.
