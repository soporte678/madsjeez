# Flash — Auditoría Frontend (Windsurf)

> Fecha: Mayo 2026  
> Responsable: Windsurf (frontend)  
> Contrapartida: Cursor (backend)  
> Referencia: `docs/flash-delivery-contract.md`

---

## 1. Componentes existentes

### `src/components/flash/`

| Componente | Qué hace | Estado |
|---|---|---|
| `FlashShippingForm.tsx` | Formulario de dirección Flash en checkout. Valida todos los campos con `validateFlashAddress`. | ✅ Funciona. Falta selector de modalidad (Local/Plus/Normal) |
| `FlashStatusBadge.tsx` | Badge visual de estado del envío. Usa `FLASH_STATUS_LABELS`. | ✅ Funciona |
| `FlashTimeline.tsx` | Timeline de estados del envío (para vista seller/admin). | ✅ Funciona |
| `FlashDeliveryConfirm.tsx` | Confirmación de entrega con foto, receptor, DNI. | ✅ Funciona, lógica de 10min validada |
| `FlashPhotoGallery.tsx` | Galería de fotos de evidencia. | ✅ Funciona |
| `FlashQrScanner.tsx` | Escáner QR en la app del conductor. | ✅ Funciona |

### `src/components/driver/`

| Componente | Qué hace | Estado |
|---|---|---|
| `DriverShell.tsx` | Layout principal del repartidor con nav + header + FAB. | ✅ Completo |
| `DriverShipmentCard.tsx` | Tarjeta de envío activo con acciones Ruta/Entregar. | ✅ Funciona. **Falta**: botones Aceptar, Rechazar, Iniciar ruta, Marcar retirado, Reportar problema |
| `DriverSupportFab.tsx` | FAB flotante de soporte. | ✅ Existe |
| `driver-ui.tsx` | Primitivas visuales: DriverCard, MetricPill, SectionTitle, formatMoney. | ✅ Completo |
| `useDriverDashboard.ts` | Hook que llama a `/api/flash/drivers/dashboard`. | ✅ Funciona. Falta: estado `mercadoPagoLinked` |

### `src/components/admin/`

| Componente | Qué hace | Estado |
|---|---|---|
| `FlashRatesPanel.tsx` | Panel para editar tarifas Flash desde admin. Consume `/api/admin/flash/rates`. | ✅ Funciona |

---

## 2. Pantallas existentes

### App del repartidor (`/driver/*`)

| Ruta | Qué tiene | Estado |
|---|---|---|
| `/driver` | Dashboard con ganancias, métricas, modo trabajo, bloques flex, pedidos activos. | ✅ Funciona. **Falta**: alerta MercadoPago no vinculado |
| `/driver/pedidos` | Pedidos asignados. | 🟡 Existe la ruta, no auditado en detalle |
| `/driver/ganancias` | Ganancias. | 🟡 Existe la ruta, no auditado en detalle |
| `/driver/perfil` | Perfil. | 🟡 Existe la ruta, no auditado en detalle |
| `/driver/mas` | Más opciones. | 🟡 Existe la ruta, no auditado en detalle |
| `/flash/scan/*` | Escaneo QR para retiro/entrega. | ✅ Existe |

### Checkout (`/checkout`)

| Sección | Estado actual |
|---|---|
| Selector de método: "Envío estándar" vs "⚡ Flash" | ✅ Existe — solo 2 opciones (estándar/flash), sin subtipos |
| Formulario estándar | ✅ Funciona |
| `FlashShippingForm` | ✅ Aparece al elegir Flash. **Falta**: 3 sub-opciones (Local/Plus/Normal) con precios |
| Resumen de precios | ✅ Existe para envío estándar (Zipnova). **Falta**: mostrar precio Flash seleccionado |
| Total actualizado con Flash | ❌ No actualiza el total cuando se elige Flash (no hay `shippingPrice` Flash en el estado) |

### Admin (`/admin/flash`)

| Sección | Estado |
|---|---|
| Panel admin Flash | ✅ Existe en `src/app/admin/flash/page.tsx` (25 KB). Tiene repartidores, envíos, asignación manual. |
| `FlashRatesPanel` | ✅ Incluido en el admin |

### Seller (`/seller/flash`)

| Sección | Estado |
|---|---|
| Panel vendedor Flash | ✅ Existe (10 KB). Timeline, fotos, etiqueta. |

---

## 3. Lo que aparece en checkout actualmente

```
[Método de envío]
  ○ Envío estándar (3–7 días hábiles)
  ● ⚡ Flash (Menos de 24 hs)
    → muestra FlashShippingForm (formulario de dirección)
    → al confirmar el form avanza al paso 2 (Pago)

[Resumen] muestra solo subtotal + "Gratis" o precio Zipnova
```

**Problema clave**: No hay selector de `flash_local` / `flash_plus` / `flash_normal`. El checkout sabe que eligió Flash pero no qué sub-modalidad ni a qué precio. El precio Flash **no se refleja en el resumen ni en el total**. El `handleSubmitOrder` envía `flash: flashData` sin precio validado por backend.

---

## 4. Qué no funciona

1. **Sin selector de modalidad Flash** — el usuario elige "Flash" pero no elige entre Local ($3.999), Plus ($5.999) o Normal ($6.999). El checkout avanza sin precio de envío.

2. **Total no actualiza con precio Flash** — el resumen lateral siempre muestra el precio Zipnova o gratis. Si el usuario elige Flash, el total no refleja el costo del envío seleccionado.

3. **`shippingPrice` Flash no se persiste ni valida en backend** — `handleSubmitOrder` envía `flash: flashData` pero no envía `flashShippingCode` ni `flashShippingPrice`. Backend no puede validar el precio declarado.

4. **Alerta de MercadoPago no vinculado en dashboard conductor** — no existe ninguna alerta cuando `data.driver.mercadoPagoLinked === false`. El conductor no sabe que necesita vincular MP para recibir pagos.

5. **`DriverShipmentCard` no tiene botones de flujo completo** — solo tiene "Ruta" y "Entregar". Faltan: Aceptar, Rechazar, Iniciar ruta, Marcar retirado, Reportar problema.

6. **Feed de envíos disponibles no existe en frontend** — no hay pantalla `/driver/pedidos/disponibles` para que los repartidores independientes vean y acepten envíos en estado `AVAILABLE`.

---

## 5. Qué está hardcodeado

| Lugar | Qué | Cómo debe ser |
|---|---|---|
| `checkout/page.tsx` L670-702 | Texto "Menos de 24 hs" en botón Flash | OK como descripción genérica |
| `checkout/page.tsx` L706-710 | `FlashShippingForm` sin precio | Necesita recibir `flashOption` seleccionada con precio |
| `FlashShippingForm.tsx` L38 | "Entrega en menos de 24 hs" hardcodeado | Puede venir del `flashOption` seleccionado |
| **Precios de las 3 opciones** | No existen en frontend — deben venir del contrato backend | Ver `docs/flash-delivery-contract.md` |

---

## 6. Qué depende de backend (Cursor)

| Funcionalidad | Endpoint esperado | Nota |
|---|---|---|
| Opciones Flash disponibles por dirección | `POST /api/flash/options` o `GET /api/flash/options?postalCode=X` | Necesario para saber si Flash cubre la zona y qué opciones hay |
| Validación de precio Flash al crear orden | `POST /api/checkout/mp` debe aceptar `flashShippingCode` + `flashShippingPrice` y validarlos | No hardcodear precio en frontend |
| Estado `mercadoPagoLinked` del conductor | `GET /api/flash/drivers/dashboard` debe incluir `mercadoPagoLinked: boolean` | Para mostrar alerta en UI |
| Feed de envíos disponibles | `GET /api/flash/shipments/available` | Para pantalla de repartidor independiente |
| Aceptar envío | `POST /api/flash/shipments/[id]/accept` | Botón "Aceptar" en DriverShipmentCard |

---

## 7. Qué se puede mejorar sin romper nada

1. **Agregar selector `FlashShippingSelector`** — antes del `FlashShippingForm`, mostrar las 3 opciones con precios, badges y descripción. Solo requiere frontend puro hasta que backend provea el endpoint de validación.

2. **Actualizar total en resumen** — cuando `shippingMethod === "flash"` y hay una `flashOption` seleccionada, mostrar el precio Flash en el resumen. Sin esperar confirmación backend.

3. **Alerta MercadoPago en `/driver`** — si `data.driver.mercadoPagoLinked === false`, mostrar banner. Requiere que backend incluya ese campo.

4. **Accesibilidad en selector Flash** — las tarjetas del selector deben ser seleccionables con teclado (`role="radio"`, `aria-checked`).

---

## 8. Componentes a crear / mejorar (según tarea)

| Componente | ¿Existe? | Acción |
|---|---|---|
| `FlashShippingSelector` | ❌ No | Crear — selector de las 3 opciones |
| `FlashShippingCard` | ❌ No | Crear — tarjeta individual de opción Flash |
| `FlashShippingSummary` | ❌ No | Crear — resumen de opción seleccionada en checkout |
| `FlashCoverageMessage` | ❌ No | Crear — estados de cobertura (sin dirección, calculando, disponible, no disponible, error) |
| `FlashCheckoutStatus` | ❌ No | Crear — wrapper de todos los estados del checkout Flash |
| `FlashDriverOrders` | 🟡 Parcial | Mejorar `DriverShipmentCard` con botones de flujo completo |
| `FlashDriverPaymentAlert` | ❌ No | Crear — alerta MP no vinculado en dashboard conductor |
| `FlashAdminSettings` | ✅ Existe | `FlashRatesPanel` — OK |
| `FlashAdminZones` | ❌ No | Pendiente — depende de endpoint de zonas |
| `FlashAdminOrders` | 🟡 Parcial | En `admin/flash/page.tsx` — mejorar filtros y UX |
| `FlashAdminSettlements` | ❌ No | Pendiente — depende de endpoint de liquidaciones |

---

## 9. Mocks temporales necesarios

Mientras Cursor no provea el endpoint de opciones Flash:

```ts
// MOCK TEMPORAL — reemplazar con fetch a /api/flash/options cuando esté listo
const FLASH_OPTIONS_MOCK = [
  { code: "flash_local",  name: "Flash Local",  price: 3999, badge: "Rápido",           description: "Busca un conductor local disponible para retirar y entregar tu pedido lo antes posible." },
  { code: "flash_plus",   name: "Flash Plus",   price: 5999, badge: "Prioridad alta",    description: "Entrega prioritaria. Tu pedido pasa a los primeros lugares de la cola.", recommended: true },
  { code: "flash_normal", name: "Flash Normal", price: 6999, badge: "Cobertura ampliada", description: "Cobertura ampliada en zonas Flash establecidas." },
]
```

⚠️ **No usar estos precios para confirmar pagos.** Solo para UI. El precio real debe venir del backend al crear la orden.

---

## 10. Cómo probar el flujo actual

1. Login como comprador → ir a `/checkout`
2. Agregar producto sin `shipping_free`
3. En paso 1, elegir "⚡ Flash"
4. Verificar que aparece `FlashShippingForm`
5. Completar todos los campos → presionar "Confirmar Envío Flash"
6. **Verificar que el total NO muestra precio Flash** (bug actual)
7. Avanzar a paso 2 y 3
8. En paso 3, verificar que el resumen muestra datos Flash pero sin precio de envío

---

*Actualizado por Windsurf — ver `docs/flash-delivery-contract.md` para el contrato de APIs que debe implementar Cursor.*
