# Privacidad de ubicación — Madsjeez

Garantía central: **las coordenadas privadas (domicilio real) nunca llegan al
navegador del comprador.**

## Cómo se logra
1. **Separación de columnas** en `seller_locations`:
   - `latitude` / `longitude` / `location` (geography): PRIVADAS.
   - `public_latitude` / `public_longitude`: PÚBLICAS (desplazadas).
2. **RLS:** la tabla `seller_locations` tiene Row Level Security y **no** tiene
   políticas para `anon`/`authenticated`. Solo el service role (backend) la lee.
   El cliente no puede hacer `select * from seller_locations`.
3. **Vista segura** `public_seller_locations` (granted a anon/authenticated):
   expone solo localidad, provincia, partido, coords públicas, flags logísticos
   y `formatted_address` **únicamente si la visibilidad es `exact`**.
4. **RPC** `nearby_sellers` / `nearby_products` calculan distancia con las coords
   PÚBLICAS. Nunca devuelven privadas.

## Niveles de visibilidad
| Nivel | Qué ve el comprador | Coords públicas |
|-------|---------------------|-----------------|
| `exact` | Dirección completa + pin exacto + "Cómo llegar" | = privadas (local comercial) |
| `approximate` | Zona con círculo, "Ubicación aproximada" | desplazadas 300–1.500 m |
| `locality_only` | "Vendedor en [localidad]", mapa de zona | desplazadas 2–4 km |
| `hidden` | Sin mapa, solo opciones de envío | NULL (no expone) |

**Default = `approximate`.** Mensaje al vendedor: "Si vendés desde tu domicilio,
mostrá solo una zona aproximada. Tu dirección exacta no será pública."

## Offset estable
`geo_public_point(lat, lng, seller_id, visibility)` deriva rumbo y distancia de
`md5(seller_id)` → el desplazamiento es **reproducible** (no cambia entre
solicitudes) pero no revela la vivienda. Validado: 895 m para un caso real.

## Auditoría
`seller_location_audit` registra: cambio de dirección, cambio de privacidad,
acceso logístico a dirección privada, override de admin, alta de punto de retiro.

## Reglas SEO/analytics
- No incluir coords privadas en HTML, JSON-LD, metadatos, sitemaps, APIs públicas ni logs.
- Analytics solo recibe localidad/provincia/rango/radio, nunca lat-lng exactas.
- `LocalBusiness` con dirección exacta SOLO para locales públicos verificados.
