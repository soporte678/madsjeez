# Modelo de datos — ubicación del vendedor

## `seller_locations` (1:1 con vendedor, multi-sucursal en etapa 2)
| Campo | Tipo | Nota |
|-------|------|------|
| `id` | uuid PK | |
| `seller_id` | text UNIQUE FK→users | dueño de la ubicación |
| `place_id` | text | Google Place ID |
| `formatted_address` | text | dirección interpretada |
| `street_name`, `street_number`, `neighborhood` | text | componentes |
| `locality` | text | localidad |
| `administrative_area_level_1` | text | provincia |
| `administrative_area_level_2` | text | partido/departamento |
| `postal_code`, `country_code` | text | CP, país (AR) |
| `latitude`, `longitude` | double | **PRIVADAS** |
| `location` | geography(Point,4326) | **PRIVADA**, índice GIST, sync por trigger |
| `location_visibility` | text | exact / approximate / locality_only / hidden |
| `public_latitude`, `public_longitude` | double | **PÚBLICAS** (desplazadas) |
| `service_radius_km` | numeric | radio de entrega local |
| `pickup_enabled`, `local_delivery_enabled`, `nationwide_shipping_enabled`, `flash_enabled` | bool | logística |
| `address_verified`, `verification_method` | | verificación |
| `geo_status` | text | missing/pending_geocoding/geocoded/pending_confirmation/confirmed/rejected/needs_review |
| `instructions` | text | indicaciones |
| `pickup_contact_name`, `pickup_phone`, `pickup_hours`, `pickup_driver_instructions` | text | **PRIVADOS** (Flash) |
| `created_at`, `updated_at` | timestamptz | |

## Relación con productos
`products.seller_id → users.id → seller_locations.seller_id`.
Los productos **heredan** la ubicación; no la duplican.

## Multi-sucursal (etapa 2)
El diseño permite evolucionar a varias filas por seller (sucursales, depósitos,
puntos de retiro) quitando el UNIQUE de `seller_id` y agregando `kind` +
`is_primary`. La etapa 1 es 1:1.

## Vista pública
`public_seller_locations` — ver `docs/location-privacy.md`.

## RPC
`upsert_seller_location(...)`, `nearby_sellers(...)`, `nearby_products(...)`,
`geo_public_point(...)` — ver `docs/postgis-nearby-search.md`.
