# Flash — Contrato de APIs Frontend ↔ Backend

> Documento compartido Windsurf (frontend) + Cursor (backend)  
> Última actualización: Mayo 2026  
> Estado: BORRADOR — Cursor debe confirmar o ajustar cada endpoint

---

## Reglas de coordinación

- **Windsurf** consume estos endpoints desde el frontend.
- **Cursor** implementa o confirma estos endpoints en el backend.
- Si un endpoint cambia su contrato, documentar aquí antes de implementar.
- Los mocks temporales en frontend están claramente marcados con `// MOCK TEMPORAL`.
- **Nunca** confirmar pagos con precios hardcodeados o de mock.

---

## 1. Opciones Flash disponibles (PENDIENTE — Cursor debe implementar)

### `POST /api/flash/options`

**Quién lo llama**: Checkout (`/checkout`) al elegir método Flash y tener dirección.

**Request**:
```json
{
  "postalCode": "1043",
  "city": "Buenos Aires",
  "province": "CABA"
}
```

**Response esperada**:
```json
{
  "available": true,
  "options": [
    {
      "code": "flash_local",
      "name": "Flash Local",
      "price": 3999,
      "badge": "Rápido",
      "description": "Busca un conductor local disponible para retirar y entregar tu pedido lo antes posible.",
      "available": true
    },
    {
      "code": "flash_plus",
      "name": "Flash Plus",
      "price": 5999,
      "badge": "Prioridad alta",
      "description": "Entrega prioritaria. Tu pedido pasa a los primeros lugares de la cola.",
      "recommended": true,
      "available": true
    },
    {
      "code": "flash_normal",
      "name": "Flash Normal",
      "price": 6999,
      "badge": "Cobertura ampliada",
      "description": "Cobertura ampliada en zonas Flash establecidas.",
      "available": true
    }
  ]
}
```

**Response si no hay cobertura**:
```json
{
  "available": false,
  "options": [],
  "reason": "No disponible para esta dirección."
}
```

**Response si error**:
```json
{
  "error": "No pudimos calcular el envío Flash. Intentá nuevamente."
}
```

**Notas Cursor**:
- Si no existe lógica de zonas aún, devolver las 3 opciones disponibles cuando `province === "CABA" || province === "Buenos Aires"`, y `available: false` para el resto.
- Los precios deben ser configurables desde `FlashRateConfig` o tabla equivalente.
- El frontend no puede hardcodear precios para confirmar órdenes — solo para mostrar en UI.

---

## 2. Crear orden con Flash (EXISTENTE — ampliar)

### `POST /api/checkout/mp`

**Estado actual**: Recibe `flash: FlashAddressData` pero no valida precio Flash.

**Request actual**:
```json
{
  "shipping": { ... },
  "buyer_email": "...",
  "flash": { "recipientName": "...", ... }
}
```

**Request requerida**:
```json
{
  "shipping": { ... },
  "buyer_email": "...",
  "flash": {
    "recipientName": "...",
    "recipientDni": "...",
    "recipientPhone": "...",
    "street": "...",
    "streetNumber": "...",
    "floor": "...",
    "apartment": "...",
    "betweenStreet1": "...",
    "betweenStreet2": "...",
    "city": "...",
    "province": "...",
    "postalCode": "...",
    "shippingCode": "flash_plus",
    "shippingPrice": 5999
  }
}
```

**Validación que debe hacer Cursor en el backend**:
- Verificar que `shippingCode` es uno de `["flash_local", "flash_plus", "flash_normal"]`.
- Verificar que `shippingPrice` coincide con el precio configurado en la DB para ese código.
- Si no coinciden → devolver `{ error: "Precio de envío inválido" }` con status 400.

**Notas Windsurf**: El frontend enviará el `shippingCode` y `shippingPrice` de la opción que el usuario seleccionó. El backend debe ser la fuente de verdad del precio.

---

## 3. Dashboard del conductor (EXISTENTE — ampliar)

### `GET /api/flash/drivers/dashboard`

**Estado actual**: Devuelve métricas, envíos activos, bloques flex, etc.

**Campo que falta agregar**:
```json
{
  "driver": {
    "id": "...",
    "dutyStatus": "ONLINE",
    "mercadoPagoLinked": false,
    "mercadoPagoStatus": "not_linked",
    ...
  },
  ...
}
```

**Valores de `mercadoPagoStatus`**:
- `"not_linked"` — no tiene billetera vinculada
- `"pending"` — proceso de vinculación iniciado
- `"linked"` — vinculada y operativa
- `"error"` — error en la vinculación

**Notas Cursor**: Si el modelo aún no tiene este campo, devolver `mercadoPagoLinked: false` como hardcodeo temporal.

---

## 4. Feed de envíos disponibles (PENDIENTE — Cursor debe implementar)

### `GET /api/flash/shipments/available`

**Quién lo llama**: `/driver/pedidos` — pantalla de repartidor independiente.

**Auth**: Solo conductores aprobados y con `dutyStatus !== "OFFLINE"`.

**Response**:
```json
{
  "shipments": [
    {
      "id": "...",
      "flashType": "flash_plus",
      "pickupAddress": "Av. Corrientes 1234, CABA",
      "deliveryAddress": "Palermo, CABA",
      "estimatedDistance": "3.2 km",
      "estimatedPay": 4800,
      "priority": "high",
      "createdAt": "2026-05-21T15:00:00Z"
    }
  ]
}
```

**Notas Cursor**: En MVP sin zonas, devolver todos los envíos en estado `AVAILABLE`. Filtrar por zona cuando esté implementado.

---

## 5. Aceptar envío (PENDIENTE — Cursor debe implementar)

### `POST /api/flash/shipments/[id]/accept`

**Auth**: Solo conductor aprobado, online, con capacidad disponible.

**Response OK**:
```json
{ "ok": true, "shipment": { "id": "...", "status": "ACCEPTED_BY_DRIVER" } }
```

**Response error**:
```json
{ "error": "El envío ya fue aceptado por otro conductor." }
```

---

## 6. Vincular MercadoPago (PENDIENTE)

### `GET /api/flash/drivers/me/mercadopago/link`

**Quién lo llama**: Botón "Vincular MercadoPago" en dashboard conductor.

**Response**:
```json
{ "authUrl": "https://auth.mercadopago.com/..." }
```

**Notas Cursor**: Redirige al OAuth de MercadoPago para el conductor. Si no está implementado aún, puede devolver un mensaje de contacto al admin.

---

## 7. Estados de checkout Flash — Flujo completo esperado

```
1. Usuario llega a /checkout con productos
2. Elige "Flash" como método de envío
3. [NUEVO] Se muestra FlashShippingSelector con 3 opciones
4. Usuario selecciona una opción (ej. Flash Plus, $5.999)
5. [NUEVO] Se muestra FlashShippingForm con la opción seleccionada
6. Usuario completa el formulario de dirección
7. [NUEVO] Total se actualiza: subtotal + $5.999
8. Usuario confirma → avanza a paso 2 (Pago)
9. En paso 3: resumen muestra "Flash Plus: $5.999"
10. POST /api/checkout/mp con flashShippingCode + flashShippingPrice
11. Backend valida precio → redirige a MercadoPago
```

---

## Pendientes documentar (Cursor)

- [ ] Confirmar estructura real de `/api/flash/drivers/dashboard`
- [ ] Confirmar si `/api/flash/options` existe o hay que crearlo
- [ ] Confirmar campos actuales de `POST /api/checkout/mp`
- [ ] Confirmar si `flash_local/plus/normal` están en DB o son nuevos
- [ ] Documentar estructura de zonas si ya existe
