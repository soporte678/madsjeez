# Búsqueda por proximidad (PostGIS) — Madsjeez

El filtrado geográfico se hace **en la base de datos**, nunca cargando todo a JS.

## Modelo
- `seller_locations.location geography(Point,4326)` con índice GIST.
- Coordenadas públicas separadas de las privadas (ver `location-privacy.md`).
- `products.seller_id → users.id → seller_locations.seller_id` (los productos
  NO duplican la dirección; heredan la del vendedor).

## RPC disponibles

### `nearby_sellers(buyer_lat, buyer_lng, radius_km=25, p_limit=50, p_offset=0)`
Vendedores con ≥1 producto activo en stock dentro del radio, ordenados por
distancia. Devuelve coords públicas, localidad/provincia, distancia_km, flags
logísticos, `active_product_count`, `minimum_product_price`.

### `nearby_products(buyer_lat, buyer_lng, radius_km, category, search, min_price, max_price, pickup_only, flash_only, limit, offset)`
Productos activos en stock de vendedores dentro del radio, ordenados por
distancia. Filtros por categoría, texto, precio, retiro y flash.

Ambas usan `ST_DWithin` (filtro indexado) + `ST_Distance` (orden) sobre
`geography`, con `LIMIT` acotado.

## API HTTP
- `GET /api/geo/nearby-sellers?lat=&lng=&radius=&limit=&offset=`
- `GET /api/geo/nearby-products?lat=&lng=&radius=&category=&q=&minPrice=&maxPrice=&pickup=&flash=&limit=&offset=`

Validan coordenadas, acotan `radius` (1–200 km) y `limit`.

## Bounding box (vista mapa — futuro)
Para la vista de mapa con "Buscar en esta zona", agregar una RPC que reciba
`north/south/east/west` y use `ST_MakeEnvelope` + `ST_Intersects`, con debounce
en el frontend (no consultar en cada movimiento mínimo).

## Routes API (NO usar en listados)
La distancia en línea recta (PostGIS) sirve para descubrir cercanía. Para
costo/tiempo real de viaje usar Routes API **solo**: al abrir un producto, en
"cómo llegar", en checkout y en Flash, con caché por origen+destino+modo.
