# Flash System Analysis — Auditoría Completa

**Fecha:** 2026-05-21
**Estado general:** ~70% funcional, con gaps críticos en liquidaciones automáticas, validación de zonas real y panel admin de shipping options/zonas.

---

## 1. Resumen ejecutivo

### Qué funciona
- **Checkout completo**: El comprador puede elegir Flash (3 tiers) o envío estándar. El formulario Flash recolecta dirección, valida, muestra opciones con precios y disponibilidad, y el total se calcula correctamente.
- **Creación de envío**: Al pagar con MercadoPago, se crea `FlashShipment` con tier, precio, prioridad y `paymentStatus: "paid_by_customer"`.
- **Feed de disponibles**: Los conductores ven envíos `AVAILABLE` ordenados por prioridad y pueden aceptarlos con lock optimista (P2025 para race conditions).
- **Flujo operativo completo del conductor**: Aceptar → Pickup (QR scan) → En tránsito → Llegar (GPS) → Entregar (con prueba de entrega: fotos + DNI) o marcar fallido (con 10 min de espera).
- **3 intentos de entrega**: Con estados progresivos (FAILED_ATTEMPT_1/2/3, PENDING_VISIT_2/3, RETURNED_TO_SENDER).
- **Dashboard del conductor**: Ganancias, billetera, pedidos, rating, tier, bloques Flex.
- **Panel admin Flash**: Ver envíos, asignar conductores, cambiar estados, ver conductores, aprobar conductores, tarifas.
- **Seller Flash page**: El vendedor ve sus envíos Flash, puede imprimir etiqueta y marcar "Listo para retirar" (→ AVAILABLE).
- **Tracking público**: `/track/[orderNumber]` sin auth, con nombre parcializado.
- **Audit logs**: Toda acción se registra en `FlashAuditLog`.
- **Precios configurables**: `FlashShippingOption` en DB con fallback a hardcoded si tabla no migrada.

### Qué no funciona / está incompleto
- **Liquidaciones automáticas**: No existe proceso automático de crear `FlashDriverSettlement` al entregar. Solo existe CRUD admin manual.
- **Validación de zona real**: No hay geocoding. La validación de cobertura usa match de postal code/provincia como proxy — `inLocalRadius === inFlexZone`. Los 3 tiers tienen la misma lógica de disponibilidad.
- **Panel admin para shipping options y zonas**: APIs existen (`/api/flash/admin/shipping-options`, `/api/flash/admin/zones`, `/api/flash/admin/settlements`) pero **no hay UI frontend** en el panel admin para gestionarlos.
- **MercadoPago del conductor**: Solo guarda referencia textual (alias/email). No hay integración real con API de MP para pagos automáticos a conductores.
- **Bug en tracking**: `/api/flash/track/[orderNumber]` selecciona `deliveredAt` de `FlashDeliveryProof` pero el campo en el schema es `signedAt`.
- **Sin notificaciones push/email** al conductor o comprador cuando cambia estado.
- **Sin webhook de confirmación de pago**: El `FlashShipment` se crea con `paymentStatus: "paid_by_customer"` asumiendo que MP cobra. No hay webhook que actualice si el pago falla.

### Qué está a medias
- **Diferenciación de tiers en validación**: Los 3 tiers usan la misma lógica de zona. Flash Local y Plus deberían usar radio real, Flash Normal zonas flex.
- **Earnings calculator**: Existe y calcula (base + km + bonuses - comisión), pero no se conecta con el precio real que pagó el comprador (`shippingPrice`). Son dos sistemas de pago independientes.
- **Bloques Flex**: Modelo existe, dashboard muestra, pero no hay asignación automática ni API para reservar bloques.

### Qué está duplicado
- **Nada significativamente duplicado.** El sistema Flash es uno solo, bien organizado bajo `src/lib/flash/`, `src/app/api/flash/`, `src/components/flash/`, `src/app/driver/`.

### Riesgos
- **Precios hardcodeados como fallback**: Si la tabla `FlashShippingOption` no está migrada, se usan defaults hardcodeados. Esto es un fallback correcto pero puede persistir silenciosamente.
- **Sin idempotencia en creación de envío**: Si el webhook de MP confirma el pago pero el `FlashShipment.create` ya se ejecutó en el checkout, podría haber inconsistencia.
- **paymentStatus "paid_by_customer" se asume antes de confirmación MP real**: El envío se marca como pagado al crear, no cuando MP confirma.
- **Sin settlement automático**: Un conductor puede entregar pero nunca cobrar si admin no crea el settlement manualmente.

---

## 2. Mapa de archivos

### Modelos / Schema
| Archivo | Propósito |
|---------|-----------|
| `prisma/schema.prisma` (líneas 1264-1629) | 15 modelos Flash + 7 enums |

### Librería core (`src/lib/flash/`)
| Archivo | Propósito |
|---------|-----------|
| `types.ts` | Tipos TS, constantes de estados/colores, validación de dirección, URL de Google Maps |
| `auth.ts` | `requireFlashAdmin()`, `requireFlashUser()`, `requireFlashDriver()` |
| `audit.ts` | `logFlashAudit()` — registra toda acción |
| `prisma-safe.ts` | `isPrismaSchemaDriftError()` — detecta tablas/columnas faltantes |
| `dashboard-safe.ts` | Wrappers seguros para queries del dashboard (graceful degradation) |
| `rate-config.ts` | Tarifas Flash configurables (`FlashRateSettings`) con DB + fallback |
| `earnings-calculator.ts` | Calcula ganancia estimada por envío (base + km + bonuses) |
| `driver-constants.ts` | Labels de tiers (BRONZE/SILVER/GOLD/DIAMOND) |
| `format.ts` | `formatArs()` — formato monetario AR |
| `qr.ts` | Generación de QR para etiquetas |
| `label.tsx` | Componente React de etiqueta imprimible |

### APIs (`src/app/api/flash/`)
| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/flash/shipping-options` | GET | Opciones Flash para checkout (público) |
| `/api/flash/shipments` | GET | Envíos del vendedor autenticado |
| `/api/flash/shipments/available` | GET | Feed de envíos disponibles para conductores |
| `/api/flash/shipments/[id]` | GET | Detalle de un envío |
| `/api/flash/shipments/[id]/ready` | POST | Vendedor marca como listo → AVAILABLE |
| `/api/flash/shipments/[id]/accept` | POST | Conductor acepta envío (optimistic lock) |
| `/api/flash/shipments/[id]/pickup` | POST | Conductor confirma retiro → IN_TRANSIT |
| `/api/flash/shipments/[id]/arrive` | POST | Conductor registra llegada + GPS |
| `/api/flash/shipments/[id]/deliver` | POST | Conductor confirma entrega (prueba) |
| `/api/flash/shipments/[id]/failed` | POST | Conductor registra intento fallido |
| `/api/flash/shipments/[id]/assign` | POST | Admin asigna conductor manualmente |
| `/api/flash/shipments/[id]/status` | PATCH | Admin cambia estado |
| `/api/flash/shipments/[id]/label` | POST | Generar etiqueta imprimible |
| `/api/flash/shipments/[id]/photos` | POST | Subir fotos de intento |
| `/api/flash/track/[orderNumber]` | GET | Tracking público |
| `/api/flash/qr/[token]` | GET | Datos del envío por QR token |
| `/api/flash/photos/upload` | POST | Upload de fotos a Supabase Storage |
| `/api/flash/photos/refresh` | POST | Refresh URLs firmadas |
| `/api/flash/drivers/dashboard` | GET | Dashboard completo del conductor |
| `/api/flash/drivers/register` | POST | Registro de nuevo conductor |
| `/api/flash/drivers/[id]/approve` | POST | Admin aprueba conductor |
| `/api/flash/drivers/me` | GET/PATCH | Perfil del conductor |
| `/api/flash/drivers/me/status` | PATCH | Cambiar duty status (online/offline) |
| `/api/flash/drivers/me/password` | PATCH | Cambiar contraseña |
| `/api/flash/drivers/me/mp-link` | POST/DELETE | Vincular/desvincular MercadoPago |
| `/api/flash/drivers/support` | GET/POST | Tickets de soporte |
| `/api/flash/drivers/blocks` | GET | Bloques Flex disponibles |
| `/api/flash/drivers/session-verify` | POST | Verificar sesión del conductor |
| `/api/flash/admin/shipping-options` | GET/PATCH | Config opciones de envío (admin) |
| `/api/flash/admin/zones` | GET/POST/PATCH/DELETE | CRUD zonas (admin) |
| `/api/flash/admin/settlements` | GET/PATCH | Ver/actualizar liquidaciones (admin) |
| `/api/flash/cron/check-returns` | POST | Cron para revisar devoluciones |
| `/api/admin/flash/rates` | GET/PATCH | Tarifas del conductor (admin) |
| `/api/internal/flash/provision-driver` | POST | Crear conductor desde sistema interno |
| `/api/checkout/mp` | POST | Checkout MercadoPago (integra Flash) |

### Frontend — Componentes
| Componente | Propósito |
|------------|-----------|
| `FlashShippingForm.tsx` | Formulario checkout Flash (dirección + 3 tiers) |
| `FlashStatusBadge.tsx` | Badge de estado con colores |
| `FlashTimeline.tsx` | Timeline de historial del envío |
| `FlashDeliveryConfirm.tsx` | Modal de confirmación de entrega (fotos + DNI) |
| `FlashPhotoGallery.tsx` | Galería de fotos de intentos |
| `FlashQrScanner.tsx` | Scanner QR para conductores |
| `FlashRatesPanel.tsx` | Panel admin de tarifas |
| `FlashCountdown.tsx` | Countdown de ofertas flash (NO relacionado con envíos) |

### Frontend — Páginas
| Página | Propósito |
|--------|-----------|
| `/checkout` | Checkout con selector standard/Flash |
| `/seller/flash` | Panel vendedor: ver envíos, imprimir etiqueta, marcar listo |
| `/admin/flash` | Panel admin: envíos, conductores, asignación, tarifas |
| `/driver` | Dashboard conductor: resumen, ganancias, pedidos activos |
| `/driver/pedidos` | Gestión de pedidos: disponibles, activos, retiro, tránsito, entregados, fallidos |
| `/driver/ganancias` | Detalle de ganancias, billetera, tarifas |
| `/driver/perfil` | Perfil del conductor |
| `/driver/mas` | Más opciones del conductor |
| `/driver/login` | Login del conductor |
| `/flash/scan/[token]` | Escaneo QR: ver envío, pickup, llegada, entrega |
| `/track/[orderNumber]` | Tracking público |

---

## 3. Flujo actual real

```
1. Comprador → /checkout
2. Selecciona "⚡ Flash" como método de envío
3. Completa formulario FlashShippingForm:
   - Datos del receptor (nombre, DNI, WhatsApp)
   - Dirección completa
   - Selecciona tier (Flash Local $3.999 / Plus $5.999 / Normal $6.999)
4. Frontend llama GET /api/flash/shipping-options con postalCode/city/province
   - Backend consulta FlashShippingOption (o fallback hardcoded)
   - Backend consulta FlashZone para verificar cobertura
   - Devuelve 3 opciones con available/unavailable
5. Total se actualiza: subtotal + flashShippingCost
6. Click "Pagar con MercadoPago" → POST /api/checkout/mp
   - Body incluye { flash: { ...addressData, shippingTier, shippingPrice, priorityScore } }
   - Flash shipping se agrega como item MP separado ("Envío ⚡ Flash Plus")
   - Se excluye del escrow split (100% va al conductor)
   - Se crea FlashShipment con status CREATED, paymentStatus "paid_by_customer"
   - Se crea audit log
7. Comprador paga en MercadoPago
8. Vendedor ve envío en /seller/flash
   - Imprime etiqueta (QR + datos)
   - Marca "Listo para retirar" → POST /api/flash/shipments/[id]/ready → status AVAILABLE
9. Conductor ve envío en /driver/pedidos tab "Disponibles"
   - GET /api/flash/shipments/available
   - Click "Aceptar envío" → POST /api/flash/shipments/[id]/accept
   - Optimistic lock (status AVAILABLE, driverId null)
   - → status ACCEPTED_BY_DRIVER
10. Conductor va al local, escanea QR → /flash/scan/[token]
    - Click "Confirmar retiro" → POST /api/flash/shipments/[id]/pickup → IN_TRANSIT
11. Conductor llega al domicilio
    - Click "Llegué" → POST /api/flash/shipments/[id]/arrive (GPS) → ARRIVED_AT_ADDRESS
12. Conductor entrega o marca fallido:
    a. Entrega: fotos + datos receptor → POST /api/flash/shipments/[id]/deliver → DELIVERED
    b. Fallido (10 min espera): POST /api/flash/shipments/[id]/failed → PENDING_VISIT_2/3 o RETURNED_TO_SENDER
13. ❌ NO HAY liquidación automática al conductor
    - Admin debe ir a /api/flash/admin/settlements y crear/actualizar manualmente
```

---

## 4. Flujo ideal recomendado

El flujo ideal agrega estos pasos faltantes:

```
7b. Webhook MP confirma pago → actualizar FlashShipment.paymentStatus a "confirmed" (hoy se asume pagado)
13. Al marcar DELIVERED → auto-crear FlashDriverSettlement con amount = shippingPrice, status "pending"
14. Cron/admin trigger → procesar settlements pendientes → pagar al conductor (MP split o transferencia)
15. Notificar al comprador por email/push en cada cambio de estado
16. Validar cobertura real con geocoding (Google Maps / Nominatim) para Flash Local y Plus
```

---

## 5. Diferencias entre flujo actual y flujo ideal

| Parte del flujo | Estado actual | Problema | Prioridad | Recomendación |
|----------------|---------------|----------|-----------|---------------|
| Confirmación de pago | Se asume pagado al crear | Si MP falla, el envío queda como "pagado" | 🔴 ALTA | Webhook MP debe actualizar paymentStatus |
| Liquidación al conductor | Solo manual vía admin API | Conductor puede entregar y nunca cobrar | 🔴 ALTA | Auto-crear settlement al DELIVERED |
| Validación de zona | Proxy por postal code/province | Los 3 tiers tienen la misma validación | 🟡 MEDIA | Implementar geocoding o al menos diferenciar lógica por tier |
| Diferenciación de tiers | Misma lógica de disponibilidad | Flash Local, Plus y Normal no tienen reglas separadas reales | 🟡 MEDIA | Definir reglas de radio distintas por tier |
| Notificaciones | No existen | Comprador y conductor no saben del cambio de estado | 🟡 MEDIA | Email o WhatsApp en cambios clave |
| Admin UI para shipping options | Solo API, sin UI | Admin no puede cambiar precios desde el panel | 🟡 MEDIA | Agregar sección en /admin/flash |
| Admin UI para zonas | Solo API, sin UI | Admin no puede gestionar zonas desde el panel | 🟡 MEDIA | Agregar sección en /admin/flash |
| Admin UI para settlements | Solo API, sin UI | Admin no puede ver/gestionar liquidaciones desde el panel | 🟡 MEDIA | Agregar sección en /admin/flash |
| Bug track endpoint | Selecciona `deliveredAt` inexistente | El tracking público puede fallar en prueba de entrega | 🟡 MEDIA | Cambiar a `signedAt` |
| Earnings vs shippingPrice | Dos sistemas independientes | El conductor ve "ganancia estimada" basada en rates, no en el precio real pagado | 🟢 BAJA | Unificar: ganancia = shippingPrice - comisión plataforma |
| Conductor rechazar | No puede rechazar un envío aceptado | Si acepta por error, queda atrapado | 🟢 BAJA | Agregar endpoint de rechazo con penalidad |
| Bloques Flex | Modelo existe, sin gestión | No se pueden reservar ni crear bloques | 🟢 BAJA | Implementar en fase posterior |

---

## 6. Modelos / Base de datos

### Modelos existentes (15 modelos + 7 enums)

| Modelo | Estado | Notas |
|--------|--------|-------|
| `FlashShipment` | ✅ Completo | 20 estados, tier, precio, prioridad, paymentStatus, settlement FK |
| `FlashDriver` | ✅ Completo | Duty status, work mode, rating, tier, MP link, CBU |
| `FlashRateConfig` | ✅ Completo | Tarifas configurables JSON |
| `FlashDriverEarning` | ✅ Completo | Ganancias por entrega |
| `FlashSupportTicket` | ✅ Completo | Soporte del conductor |
| `FlashDriverBlock` | ✅ Completo | Bloques Flex |
| `FlashDeliveryAttempt` | ✅ Completo | Intentos de entrega con GPS |
| `FlashAttemptPhoto` | ✅ Completo | Fotos de cada intento |
| `FlashDeliveryProof` | ✅ Completo | Prueba de entrega |
| `FlashAuthorizedRecipient` | ✅ Completo | Personas autorizadas a recibir |
| `FlashAuditLog` | ✅ Completo | Log de auditoría |
| `FlashShippingOption` | ✅ Completo | 3 opciones de envío configurables |
| `FlashZone` | ✅ Completo | Zonas de cobertura |
| `FlashDriverSettlement` | ✅ Completo | Liquidaciones a conductores |
| `FlashShipmentStatus` (enum) | ✅ 20 valores | Cubre todo el ciclo de vida |

### Modelos faltantes
- Ninguno crítico. El schema es completo para el flujo actual.

---

## 7. APIs / Endpoints

### Endpoints existentes: 30+ (ver sección 2)

### Endpoints faltantes o incompletos

| Endpoint faltante | Prioridad | Propósito |
|-------------------|-----------|-----------|
| `POST /api/flash/shipments/[id]/reject` | 🟢 BAJA | Conductor rechaza envío aceptado |
| `POST /api/flash/drivers/blocks/[id]/reserve` | 🟢 BAJA | Reservar bloque Flex |
| Auto-settlement en deliver endpoint | 🔴 ALTA | Crear FlashDriverSettlement al entregar |
| Webhook MP → actualizar paymentStatus | 🔴 ALTA | Confirmar pago real |

---

## 8. Frontend

### Componentes actuales — todos conectados a datos reales

| Componente | Conectado a API | Problemas |
|------------|----------------|-----------|
| `FlashShippingForm` | ✅ `/api/flash/shipping-options` | El `useEffect` se dispara en cada cambio de postalCode/city/province (puede ser excesivo) |
| `FlashStatusBadge` | ✅ Datos locales | OK |
| `FlashTimeline` | ✅ Datos locales | OK |
| `FlashDeliveryConfirm` | ✅ APIs de entrega | OK |
| `FlashPhotoGallery` | ✅ URLs reales | OK |
| `FlashQrScanner` | ✅ API de QR | OK |
| `FlashRatesPanel` | ✅ `/api/admin/flash/rates` | OK |

### Componentes faltantes para admin
- Panel de shipping options (precios, activar/desactivar)
- Panel de zonas (crear/editar/borrar)
- Panel de settlements (ver pendientes, marcar pagados)

### Mocks
- **No hay mocks en producción**. El único fallback es el hardcoded de `shipping-options` cuando la tabla no existe, que es un patrón de graceful degradation correcto.

---

## 9. Pagos / MercadoPago

### Estado actual
1. **Comprador paga**: Flash shipping se agrega como item separado en MP preference. El `marketplace_fee` solo incluye la comisión sobre productos, NO sobre el envío Flash (correcto — el envío va al conductor).
2. **paymentStatus**: Se marca `"paid_by_customer"` al crear el shipment, ANTES de que MP confirme. No hay webhook que actualice este campo.
3. **Conductor**: Solo guarda referencia textual de MP (alias o email). No hay API de MercadoPago para hacer split automático o transferencia.
4. **Settlements**: Modelo existe, admin puede crear/actualizar manualmente. No hay creación automática al entregar.

### Riesgos
- **Pago no confirmado**: Si MP rechaza el pago, el FlashShipment queda con paymentStatus "paid_by_customer" pero el dinero no llegó.
- **Sin idempotencia**: Si el checkout se llama dos veces, se crean dos FlashShipments.
- **Sin pago automático al conductor**: Todo es manual.
- **Sin doble liquidación protection**: Si admin crea manualmente un settlement, no hay check de unicidad fuerte más allá del `@unique` en shipmentId.

### Qué falta para hacerlo seguro
1. Webhook de MercadoPago que actualice `FlashShipment.paymentStatus` a "confirmed" o "failed".
2. Auto-crear `FlashDriverSettlement` al marcar DELIVERED.
3. Proceso batch o cron para ejecutar pagos a conductores.
4. Bloquear el flujo de seller/driver si paymentStatus no es "confirmed".

---

## 10. Zonas / Cobertura

### Estado actual
- `FlashZone` modelo tiene: postalCodes[], province, radiusKm, centerLat/Lng.
- El endpoint `/api/flash/shipping-options` verifica si el postal code está en alguna zona activa.
- **Sin geocoding**: `inLocalRadius === inFlexZone` — los 3 tiers usan la misma lógica.
- Si no hay zonas configuradas, TODAS las direcciones se consideran disponibles.
- Seed por migración: una zona "AMBA" con postal codes vacío y `Buenos Aires` como provincia.

### Cómo debería funcionar
- **Flash Local** (radio ~15km): Verificar distancia real entre vendedor y comprador.
- **Flash Plus** (radio ~15km): Mismo check pero con prioridad en la cola.
- **Flash Normal** (zonas flex): Verificar si el postal code está en una zona flex activa.
- Se necesita geocoding (Google Maps Geocoding API o similar) para calcular distancias reales.

---

## 11. Dashboard conductor

### Existe y funciona
- Dashboard principal (`/driver`): ganancias hoy/semana/mes, pedidos activos, KPIs.
- Pedidos (`/driver/pedidos`): 6 tabs (disponibles, activos, retiro, en camino, entregados, fallidos).
- Ganancias (`/driver/ganancias`): billetera (disponible/pendiente/procesando), tarifas.
- Perfil (`/driver/perfil`): datos personales, vehículo.
- Escáner QR integrado.
- Duty status (online/offline/on_trip/on_break).

### Qué falta
- **Vincular MP desde la UI**: API existe, pero no se ve un botón en el perfil para vincular/desvincular MP.
- **Rechazar envío**: No hay forma de devolver un envío aceptado.
- **Notificaciones en tiempo real**: No hay WebSocket ni polling automático de nuevos envíos.
- **Navegación integrada**: El link a Google Maps existe, pero no hay integración con app de navegación.

---

## 12. Admin

### Existe
- `/admin/flash`: Ver envíos, buscar, filtrar por estado, expandir detalle, asignar conductor, cambiar estado, ver timeline/fotos, ver conductores, aprobar conductores, agregar conductores, panel de tarifas.

### Falta
- **UI para shipping options**: Cambiar precios, activar/desactivar tiers (API existe, UI no).
- **UI para zonas**: Crear/editar/borrar zonas (API existe, UI no).
- **UI para settlements**: Ver liquidaciones pendientes, marcar como pagadas, reintentar (API existe, UI no).
- **Métricas Flash**: No hay dashboard con KPIs de Flash (envíos/día, tiempo promedio, tasa de éxito).
- **Vista de envíos con paymentStatus**: No se muestra si el pago fue realmente confirmado.

---

## 13. Plan de mejora por etapas

### Etapa 1 — Correcciones urgentes (1-2 días)
- [ ] Fix bug: `/api/flash/track/[orderNumber]` → cambiar `deliveredAt` a `signedAt` en select de deliveryProof.
- [ ] Fix: Estados faltantes en admin `STATUS_OPTIONS` (faltan AVAILABLE, ACCEPTED_BY_DRIVER, DRIVER_EN_ROUTE_TO_PICKUP, PACKAGE_PICKED_UP, RETURNED_TO_SELLER).
- [ ] Auto-crear `FlashDriverSettlement` al confirmar entrega (en `/api/flash/shipments/[id]/deliver`).
- [ ] Agregar debounce al `useEffect` de `FlashShippingForm` que consulta opciones.

### Etapa 2 — Checkout funcional (1-2 días)
- [ ] Verificar que el checkout no permite avanzar sin opción Flash válida seleccionada.
- [ ] Agregar indicador visual de tier seleccionado en el resumen de compra.
- [ ] Validar en backend (`/api/checkout/mp`) que el shippingPrice enviado coincide con el precio de la DB para ese tier.

### Etapa 3 — Backend seguro (2-3 días)
- [ ] Webhook MP: cuando se confirma pago, actualizar `FlashShipment.paymentStatus` de "paid_by_customer" a "confirmed".
- [ ] No permitir que seller marque "listo" ni que driver acepte si `paymentStatus !== "confirmed"` (o mantener "paid_by_customer" como válido temporalmente).
- [ ] Validar precios server-side: el precio en el body del checkout DEBE coincidir con `FlashShippingOption.price` activo en DB.

### Etapa 4 — Dashboard conductor (1-2 días)
- [ ] Agregar botón de vincular/desvincular MP en perfil del conductor.
- [ ] Agregar endpoint y UI para rechazar envío aceptado (con penalidad en acceptanceRate).
- [ ] Polling o refresh automático del feed de disponibles.

### Etapa 5 — Admin y zonas (2-3 días)
- [ ] UI en `/admin/flash` para gestionar shipping options (precios, activar/desactivar).
- [ ] UI en `/admin/flash` para CRUD de zonas.
- [ ] UI en `/admin/flash` para ver/gestionar settlements.
- [ ] Agregar filtro por paymentStatus en lista de envíos admin.

### Etapa 6 — MercadoPago / Liquidaciones (3-5 días)
- [ ] Proceso automático de pago a conductores (MercadoPago payouts o transferencia bancaria vía CBU).
- [ ] Cron para procesar settlements pendientes.
- [ ] Dashboard de liquidaciones con estados (pending → processing → settled / failed).
- [ ] Protección contra doble liquidación.

### Etapa 7 — QA final (1-2 días)
- [ ] Test E2E del flujo completo: checkout → pago → seller listo → driver acepta → pickup → entrega → settlement.
- [ ] Test de race conditions: dos drivers aceptando mismo envío.
- [ ] Test de flujo fallido: 3 intentos → devolución.
- [ ] Validar mobile UX en checkout Flash.
- [ ] Verificar que no hay datos sensibles expuestos en APIs públicas.

---

## 14. Recomendaciones para Cursor y Windsurf

### Cursor (Backend / Lógica)
- Fix del bug `deliveredAt` → `signedAt` en track endpoint.
- Auto-settlement al entregar.
- Validación server-side de precios.
- Webhook MP para paymentStatus.
- Endpoint de rechazo de envío.
- Mejoras en validación de zona (si se agrega geocoding).
- Cron de liquidaciones.
- Seguridad: no exponer datos sensibles en APIs públicas.

### Windsurf (Frontend / UI / UX)
- UI admin para shipping options, zonas, settlements.
- Botón de vincular MP en perfil conductor.
- Debounce en FlashShippingForm.
- Mejoras visuales mobile en checkout Flash.
- Estados faltantes en el select de admin.
- Indicadores de paymentStatus en admin.
- Polling/refresh en feed de disponibles.
- Notificaciones toast en cambios de estado.

---

## 15. Lista de acciones concretas (checklist técnico)

### 🔴 Urgente
- [ ] **BUG**: `src/app/api/flash/track/[orderNumber]/route.ts` línea 56 → `deliveredAt: true` debe ser `signedAt: true`
- [ ] **BUG**: `src/app/admin/flash/page.tsx` línea 18-25 → `STATUS_OPTIONS` no incluye 5 estados nuevos (AVAILABLE, ACCEPTED_BY_DRIVER, DRIVER_EN_ROUTE_TO_PICKUP, PACKAGE_PICKED_UP, RETURNED_TO_SELLER)
- [ ] **FEATURE**: Auto-crear `FlashDriverSettlement` en `src/app/api/flash/shipments/[id]/deliver/route.ts` después del transaction de entrega
- [ ] **SECURITY**: Validar que `body.flash.shippingPrice` en checkout MP coincida con `FlashShippingOption.price` de la DB

### 🟡 Importante
- [ ] Webhook MP → actualizar `FlashShipment.paymentStatus`
- [ ] UI admin: sección shipping options (editar precios, activar/desactivar)
- [ ] UI admin: sección zonas (CRUD)
- [ ] UI admin: sección settlements (ver/gestionar)
- [ ] Debounce en `FlashShippingForm` useEffect
- [ ] Botón vincular MP en `/driver/perfil`

### 🟢 Mejoras futuras
- [ ] Geocoding para validación real de radio Local/Plus
- [ ] Notificaciones (email/push) en cambios de estado
- [ ] Endpoint `/api/flash/shipments/[id]/reject` (conductor rechaza)
- [ ] Gestión de bloques Flex
- [ ] Earnings calculator conectado con shippingPrice real
- [ ] Polling/WebSocket para feed de disponibles
