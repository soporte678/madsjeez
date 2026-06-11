# Google Maps Platform — configuración (Madsjeez)

Para activar mapas y geolocalización necesitás un proyecto de Google Cloud con
billing habilitado. El código ya está preparado; solo faltan las claves.

## 1. Crear proyecto y habilitar APIs
En https://console.cloud.google.com → APIs y servicios → Biblioteca, habilitá:
- **Maps JavaScript API**
- **Places API (New)**
- **Geocoding API**
- **Routes API** (solo se usa bajo demanda: checkout, "cómo llegar")

## 2. Clave PÚBLICA (navegador)
Credenciales → Crear credencial → Clave de API. Restringila:
- **Restricción de aplicación:** Sitios web (HTTP referrers).
  - `https://www.madsjeez.com.ar/*`
  - `https://madsjeez.com.ar/*`
  - (opcional dev) `http://localhost:3000/*`
- **Restricción de API:** solo Maps JavaScript API + Places API (New).

Guardala en Railway como `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

## 3. Map ID (estilo + AdvancedMarkerElement)
Google Maps → Estilos de mapa → Crear Map ID (tipo JavaScript / Vector).
Guardalo como `NEXT_PUBLIC_GOOGLE_MAP_ID`.

## 4. Clave PRIVADA (servidor)
Crear otra Clave de API. Restricción de API: Geocoding API + Routes API.
**Sin** restricción de referrer (es server-side). Guardala como
`GOOGLE_MAPS_SERVER_API_KEY`. **Nunca** la pongas con prefijo `NEXT_PUBLIC_`
ni la expongas al cliente.

## 5. Cargar en Railway
Variables del servicio `madsjeez`:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_GOOGLE_MAP_ID=...
GOOGLE_MAPS_SERVER_API_KEY=...
```
Railway redeploya solo.

## Reglas (cumplir siempre)
- La clave pública SOLO con las 2 APIs de navegador y restringida por dominio.
- La clave privada SOLO en el servidor (Geocoding/Routes).
- No usar `google.maps.Marker` legado → usar `AdvancedMarkerElement`.
- No usar Distance Matrix legacy → Routes API solo cuando haga falta.
- Routes API NUNCA en listados masivos (ver `docs/postgis-nearby-search.md`).
