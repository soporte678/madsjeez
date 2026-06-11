# Google Merchant Center — configuración (Madsjeez)

El feed de productos ya está implementado y se genera solo desde la base de
datos. Solo falta darlo de alta en Merchant Center.

## Feed
- **URL:** `https://www.madsjeez.com.ar/api/feed/google-merchant.xml`
- **Formato:** RSS 2.0 con namespace `g:` (formato oficial de Google).
- **Contenido:** solo productos activos con stock, precio e imagen válida.
  Precio/stock salen de la misma DB que la página y el JSON-LD (consistentes).
- **Moneda:** ARS. **País:** AR.
- Se omiten (no se envían) los productos sin imagen, sin precio o sin stock.
  Para ver cuáles y por qué: `GET /api/feed/diagnostics` (requiere admin).

## Pasos en Merchant Center
1. Crear cuenta en https://merchants.google.com (gratis).
2. Configurar datos del negocio (Madsjeez, Argentina, ARS).
3. Verificar y reclamar el sitio `www.madsjeez.com.ar` (vía Search Console o
   etiqueta — el sitio ya tiene metadatos).
4. **Productos → Fuentes de datos → Agregar fuente → Desde un archivo →
   Programar obtención**:
   - Nombre: `Madsjeez feed principal`
   - País de venta: Argentina · Idioma: Español
   - URL del archivo: `https://www.madsjeez.com.ar/api/feed/google-merchant.xml`
   - Frecuencia: diaria (el feed se regenera con cache de 30 min).
5. Configurar **envío** y **impuestos** a nivel cuenta (Argentina).

## Campos del feed
| Campo Google | Origen real | Nota |
|---|---|---|
| `g:id` | product.id | |
| `title` | product.title | máx 150 |
| `description` | product.description | sin HTML |
| `link` | /product/{id} | URL pública |
| `g:image_link` | product_images[0] | obligatorio |
| `g:additional_image_link` | resto de imágenes | hasta 10 |
| `g:availability` | in_stock (solo se envían con stock) | |
| `g:condition` | product.condition | new/used/refurbished |
| `g:price` / `g:sale_price` | price / compare_price | si hay oferta real |
| `g:mpn` | product.sku | si existe |
| `g:identifier_exists` | `no` si no hay sku/brand/gtin | correcto, no inventamos |
| `g:product_type` | nombre de categoría | |
| `g:shipping` | free_shipping / shipping_cost | ARS |

## Importante (cumplir reglas)
- No se inventan brand/gtin/mpn. Si el producto no tiene identificadores reales,
  se declara `identifier_exists=no` (Google lo acepta para productos sin GTIN).
- Si más adelante se agregan columnas reales `brand`/`gtin` a `products`, el feed
  las incluirá automáticamente (extender el SELECT).
- Precio y stock del feed = página = JSON-LD. No tocar uno sin el otro.
