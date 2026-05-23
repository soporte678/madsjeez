# Google Shopping, SEO local y backlinks

## Google Shopping (productos en Google)

### 1. Feed de productos (ya en el sitio)

URL del feed (producción):

`https://www.madsjeez.com.ar/feeds/google-shopping.xml`

- Se genera en **runtime** (`force-dynamic`); caché CDN ~1 h (`s-maxage=3600`).
- Incluye productos activos con stock e imagen.
- Formato compatible con **Google Merchant Center**.

### 2. Pasos en Google Merchant Center

1. Crear cuenta en [Google Merchant Center](https://merchants.google.com/).
2. Verificar dominio `www.madsjeez.com.ar` (HTML tag o DNS, igual que Search Console).
3. **Productos → Feeds → Añadir feed** → país Argentina, idioma español.
4. Tipo: **Feed programado** → URL del feed anterior.
5. Revisar diagnósticos (imagen, precio, disponibilidad, GTIN si aplica).
6. Vincular con **Google Ads** si querés campañas Shopping.

Variables opcionales en Railway:

- `GOOGLE_MERCHANT_BRAND` — nombre de marca en el feed (default: MadsJeez Marketplace).

### 2b. Content API for Shopping (push desde MadsJeez)

Además del feed XML, el backend puede **insertar/actualizar** productos vía **Content API v2.1** (`products.custombatch`).

**Variables Railway (obligatorias para API):**

| Variable | Uso |
|----------|-----|
| `GOOGLE_MERCHANT_CENTER_ID` | ID numérico de la cuenta Merchant |
| `GOOGLE_MERCHANT_CLIENT_ID` | OAuth Client (Google Cloud Console) |
| `GOOGLE_MERCHANT_CLIENT_SECRET` | OAuth secret |
| `GOOGLE_MERCHANT_REFRESH_TOKEN` | Refresh token con scope `content` |
| `GOOGLE_MERCHANT_BRAND` | Marca en productos |
| `GOOGLE_MERCHANT_CONTENT_LANGUAGE` | `es` (default) |
| `GOOGLE_MERCHANT_TARGET_COUNTRY` | `AR` (default) |

**Obtener refresh token (una vez):**

1. En Google Cloud: API **Content API for Shopping** habilitada; OAuth consent + redirect URI  
   `https://www.madsjeez.com.ar/api/admin/google-merchant/oauth/callback`
2. Logueado como admin en el panel:  
   `GET /api/admin/google-merchant/oauth/url?redirect_uri=...` → abrir `authorizeUrl`
3. Tras autorizar, el callback devuelve `refresh_token` → pegarlo en Railway.

**Endpoints admin (sesión admin Supabase):**

| Método | Ruta |
|--------|------|
| GET | `/api/admin/google-merchant/status` |
| POST | `/api/admin/google-merchant/sync` body `{ "limit": 5000, "purgeInactive": true }` |

**Cron / CI:**

```bash
POST /api/internal/google-merchant/sync
Authorization: Bearer {ADMIN_SETUP_SECRET}
```

Script: `npm run merchant:sync -- https://www.madsjeez.com.ar`

El feed XML (`/feeds/google-shopping.xml`) puede coexistir; en Merchant Center evitá dos fuentes contradictorias para el mismo país (elegí **API** o **feed programado**, no ambos con reglas distintas).

### 3. Datos estructurados en ficha de producto

Cada `/product/[id]` incluye JSON-LD `Product` + `Offer` (precio ARS, stock, imágenes con caption SEO).

---

## Fase A — Tiendas públicas y programmatic «comprar»

### Tiendas vendedor

- URL: `https://www.madsjeez.com.ar/tienda/[slug]`
- `/seller/[id]` redirige a `/tienda/[slug]` si el vendedor tiene slug
- Panel en Dashboard → Perfil: copiar link, HTML y badge
- API: `GET/PATCH /api/seller/public-store`
- Migración: `store_slug` en `users`
- Backfill: `npm run backfill:store-slugs` o `POST /api/internal/backfill-store-slugs` con `Authorization: Bearer {ADMIN_SETUP_SECRET}`
- **Cada vendedor** con ≥1 producto activo con imagen obtiene URL `/tienda/[slug]` (no hace falta flag manual)
- Dashboard → Ventas → **Mi tienda pública** (copiar link y badge HTML)

### Landings «comprar categoría en ciudad»

- URL: `/comprar/[categoria]/en/[ciudad]` (solo si la categoría tiene ≥3 productos con stock)
- Índice: `/comprar`
- Incluidas en sitemap junto con `/tienda/*`

---

## SEO local «marketplace + provincia/ciudad»

Landings generadas:

- `/marketplace` — índice nacional
- `/marketplace/[provincia]` — 24 jurisdicciones
- `/marketplace/[provincia]/[localidad]` — ciudades principales (~80+ URLs)

Están en el **sitemap** automático. Para ampliar localidades, editar `src/lib/seo/argentina-locations.ts`.

**Importante:** posicionar en página 1 para «marketplace» en todas las ciudades del país requiere tiempo, autoridad de dominio, contenido único y enlaces **reales** — no se logra solo con páginas automáticas.

---

## Backlinks: por qué NO comprar 20.000 enlaces

Comprar o generar ~20.000 backlinks artificiales (granjas de enlaces, PBNs, spam) suele:

- Provocar **penalización manual o algorítmica** de Google.
- Dañar la reputación del dominio durante años.
- No mejorar Shopping ni SpeedAnalytics.

### Estrategia legítima (recomendada)

| Acción | Prioridad |
|--------|-----------|
| Google Business Profile (Spegazzini / Zona Sur) | Alta |
| Directorios de calidad (Cámara comercio, guías locales) | Media |
| Notas de prensa / alianzas con vendedores que enlacen su web | Media |
| Contenido útil (blog guías, comparativas categoría) | Media |
| Redes sociales con enlace al sitio | Media |
| Evitar herramientas «X backlinks por $» | — |

Objetivo realista: **decenas a cientos** de enlaces relevantes en 6–12 meses, no 20.000 de baja calidad.

---

## Rendimiento (SpeedAnalytics / PageSpeed)

Cambios aplicados en código:

- Un solo pool de carruseles en home (no miles de requests).
- Carruseles bajo el pliegue con lazy load.
- `next/image` → WebP/AVIF para productos.
- Alt SEO por título de producto.
- Fotos estáticas comprimidas (script `npm run optimize:images`).
- Caché larga en `/_next/static` y `/team/`.

Tras deploy, medir de nuevo en móvil 4G.
