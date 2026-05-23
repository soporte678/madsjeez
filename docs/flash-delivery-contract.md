# Flash delivery — contrato API (Windsurf)

## Cotizar
GET /api/flash/shipping-options?postalCode=&city=&province=
Sin auth. Usar price y code de la respuesta.

## Pagar
POST /api/checkout/mp
Incluir body.flash: FlashAddressData + shippingTier + shippingPrice + priorityScore.

## Envío / conductor
Usar /api/flash/shipments/[id]/* (accept, pickup, deliver, assign).
Conductor: mpLinked via /api/flash/drivers/me/mp-link.

## Precios iniciales
flash_local 3999 | flash_plus 5999 | flash_normal 6999

Detalle: docs/api/recursos/flash.md
