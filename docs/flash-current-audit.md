# Flash — auditoría backend (estado en main)

Commit: 036b4e12 — sistema Flash con 3 modalidades, precios y pago al conductor.

## Existe en el repo

- Prisma: FlashShipment, FlashDriver, FlashShippingOption, FlashZone, FlashDriverSettlement, etc.
- GET /api/flash/shipping-options (cotización checkout)
- POST /api/checkout/mp con body.flash (tier, price, dirección)
- /api/flash/shipments/*, /api/flash/drivers/*
- docs/api/recursos/flash.md (referencia completa)

## No duplicar

Segundo módulo Flash, modelos FlashOrderShipping, endpoints paralelos.

## Coordinación Windsurf

Ver docs/flash-delivery-contract.md y docs/flash-frontend-audit.md
