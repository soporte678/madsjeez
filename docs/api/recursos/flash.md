# Flash — Arquitectura Funcional Completa

> Red de logística exprés de Madsjeez para entregas urbanas de ecommerce en menos de 24 hs.
> Flash **no** es delivery de comida. Es una red de repartidores para marketplace, paquetes y vendedores.

---

## Índice

1. [Visión y modelo operativo](#1-visión-y-modelo-operativo)
2. [Actores del sistema](#2-actores-del-sistema)
3. [Estados del envío](#3-estados-del-envío)
4. [Flujo completo vendedor → repartidor → cliente](#4-flujo-completo)
5. [User stories](#5-user-stories)
6. [Reglas de negocio](#6-reglas-de-negocio)
7. [Sistema de asignación](#7-sistema-de-asignación)
8. [Modelo de ganancias](#8-modelo-de-ganancias)
9. [Wallet del repartidor](#9-wallet-del-repartidor)
10. [Seguridad y control antifraude](#10-seguridad-y-control-antifraude)
11. [Tracking para cliente y vendedor](#11-tracking)
12. [Modelo de base de datos](#12-modelo-de-base-de-datos)
13. [Endpoints API](#13-endpoints-api)
14. [Módulos de la app del repartidor](#14-módulos-del-panel-repartidor)
15. [Módulos del panel vendedor](#15-módulos-del-panel-vendedor)
16. [Riesgos operativos](#16-riesgos-operativos)
17. [Checklist MVP](#17-checklist-mvp)
18. [Roadmap por etapas](#18-roadmap-por-etapas)

---

## 1. Visión y modelo operativo

### ¿Qué es Flash?

Flash es la red logística propia de Madsjeez. Permite a vendedores del marketplace despachar pedidos el mismo día usando repartidores que operan bajo el sistema. Es la capa de última milla de Madsjeez.

**Diferencial vs. delivery de comida:**
- Los paquetes pueden pesar hasta 20 kg y tener dimensiones variables
- El tiempo de entrega es en horas (mismo día o día siguiente), no minutos
- El repartidor retira el paquete del vendedor antes de entregarlo al comprador
- La evidencia de entrega es obligatoria (foto + firma digital)
- Existen hasta 3 intentos de entrega antes de devolver

### Modelos operativos soportados

| Modelo | Descripción | Cuándo usar |
|--------|-------------|-------------|
| **Propios** | Repartidores empleados o contratados directamente por Madsjeez | Zonas de alto volumen donde conviene controlar calidad |
| **Independientes** | Repartidores que se conectan por su cuenta, eligen pedidos, cobran por entrega | Expansión a nuevas zonas sin inversión fija |
| **Mixto** | Flash asigna automáticamente al repartidor más conveniente (propio o independiente) según carga, zona y disponibilidad | Operación madura con volumen variable |

El **MVP** arranca con el modelo mixto simplificado: asignación manual desde el admin + independientes que se postulan.

---

## 2. Actores del sistema

### Vendedor (`SELLER`)
- Crea el envío Flash al confirmar pago
- Imprime etiqueta con QR
- Espera al repartidor para hacer entrega del paquete
- Genera QR de retiro para que el repartidor confirme que retiró el paquete
- Recibe notificación de entrega con foto de evidencia

### Repartidor (`DRIVER`)
- Se registra, sube datos y espera aprobación
- Se activa online cuando está disponible
- Ve pedidos disponibles en su zona
- Acepta pedidos y navega al vendedor para retirar
- Escanea QR de retiro del vendedor
- Navega al domicilio del comprador
- Confirma entrega con foto + DNI del receptor
- Genera ingresos que van a su wallet

### Comprador (`BUYER`)
- No tiene acción activa en el flujo de envío
- Puede ver tracking del pedido
- Recibe notificación cuando el repartidor llega

### Admin (`ADMIN`)
- Aprueba repartidores
- Asigna manualmente cuando no hay asignación automática
- Monitorea todos los envíos
- Gestiona wallet y liquidaciones
- Ve auditoría completa
- Puede bloquear repartidores

---

## 3. Estados del envío

```
CREATED
  └─→ PAYMENT_CONFIRMED
        └─→ LABEL_GENERATED
              └─→ PACKAGE_READY          ← vendedor declara paquete listo
                    └─→ AVAILABLE         ← visible para repartidores independientes
                          └─→ ACCEPTED_BY_DRIVER    ← repartidor acepta
                                └─→ DRIVER_EN_ROUTE_TO_PICKUP  ← en camino al vendedor
                                      └─→ PACKAGE_PICKED_UP    ← retiró el paquete (QR)
                                            └─→ IN_TRANSIT       ← en camino al cliente
                                                  └─→ ARRIVED_AT_ADDRESS
                                                        ├─→ DELIVERED
                                                        ├─→ FAILED_ATTEMPT_1
                                                        │     └─→ PENDING_VISIT_2
                                                        │           └─→ FAILED_ATTEMPT_2
                                                        │                 └─→ PENDING_VISIT_3
                                                        │                       └─→ FAILED_ATTEMPT_3
                                                        │                             └─→ RETURNED_TO_SELLER
                                                        └─→ CANCELLED
```

### Descripción de cada estado

| Estado | Actor que lo genera | Descripción |
|--------|-------------------|-------------|
| `CREATED` | SYSTEM | Envío generado al confirmar pago |
| `PAYMENT_CONFIRMED` | SYSTEM/MP webhook | Pago acreditado |
| `LABEL_GENERATED` | SELLER | Etiqueta impresa |
| `PACKAGE_READY` | SELLER | Paquete embalado y listo para retiro |
| `AVAILABLE` | SYSTEM | Visible en el feed de repartidores disponibles |
| `ACCEPTED_BY_DRIVER` | DRIVER | Repartidor independiente acepta el envío |
| `DRIVER_EN_ROUTE_TO_PICKUP` | DRIVER | Marcó que está en camino al vendedor |
| `PACKAGE_PICKED_UP` | DRIVER | Escaneó QR de retiro del vendedor |
| `IN_TRANSIT` | DRIVER | En camino al domicilio del comprador |
| `ARRIVED_AT_ADDRESS` | DRIVER | Registró llegada con GPS |
| `DELIVERED` | DRIVER | Entrega confirmada con foto + DNI |
| `FAILED_ATTEMPT_1/2/3` | DRIVER | Cliente no encontrado (requiere 10 min de espera) |
| `PENDING_VISIT_2/3` | SYSTEM | Reagendado para próxima visita |
| `RETURNED_TO_SELLER` | SYSTEM | 3 intentos fallidos, devuelto al vendedor |
| `CANCELLED` | ADMIN/SELLER | Cancelado manualmente |

---

## 4. Flujo completo

### Vendedor → Repartidor → Cliente

```
[VENDEDOR]
  1. Comprador paga → sistema crea FlashShipment (CREATED → PAYMENT_CONFIRMED)
  2. Vendedor imprime etiqueta con QR (→ LABEL_GENERATED)
  3. Vendedor embala el paquete y lo marca como listo (→ PACKAGE_READY → AVAILABLE)
  4. Vendedor espera al repartidor con el QR de retiro en pantalla

[SISTEMA DE ASIGNACIÓN]
  5a. Asignación manual: admin elige repartidor
  5b. Asignación automática: sistema elige por zona/disponibilidad/reputación
  5c. Mercado abierto: repartidor independiente acepta del feed (→ ACCEPTED_BY_DRIVER)

[REPARTIDOR]
  6. Ve el pedido aceptado, abre Maps hacia el vendedor (→ DRIVER_EN_ROUTE_TO_PICKUP)
  7. Llega al vendedor, escanea QR de retiro → sistema confirma (→ PACKAGE_PICKED_UP)
  8. Carga en su vehículo, abre Maps hacia el domicilio del comprador (→ IN_TRANSIT)
  9. Llega al domicilio, registra llegada con GPS (→ ARRIVED_AT_ADDRESS)
  10. Si entrega: toma foto, registra receptor con DNI (→ DELIVERED)
      Si no encuentra: espera 10 minutos, registra visita fallida (→ FAILED_ATTEMPT_1)

[CLIENTE]
  - Recibe notificación en cada cambio de estado
  - Puede ver tracking en tiempo real

[VENDEDOR]
  - Ve estado del envío
  - Recibe evidencia fotográfica al entregar
  - Si devuelto: recibe notificación y el paquete vuelve a su dirección
```

---

## 5. User stories

### Repartidor

| ID | Como repartidor quiero... | Para... |
|----|--------------------------|---------|
| D01 | Registrarme con email, DNI y datos de vehículo | Sumarme a la red Flash |
| D02 | Activarme online/offline | Indicar si estoy disponible para recibir pedidos |
| D03 | Ver los pedidos disponibles en mi zona | Elegir cuál aceptar |
| D04 | Aceptar un pedido | Quedar asignado y recibir la dirección del vendedor |
| D05 | Navegar al vendedor con Maps | Llegar eficientemente al punto de retiro |
| D06 | Escanear el QR del vendedor | Confirmar retiro oficial del paquete |
| D07 | Navegar al domicilio del comprador | Hacer la entrega |
| D08 | Registrar llegada al domicilio con GPS | Iniciar el período de espera de 10 minutos |
| D09 | Confirmar entrega con foto y DNI | Cerrar el envío con evidencia |
| D10 | Registrar visita fallida | Documentar que el cliente no estaba |
| D11 | Ver mis ganancias del día/semana/mes | Controlar mis ingresos |
| D12 | Solicitar retiro de ganancias | Cobrar lo acumulado en mi wallet |
| D13 | Ver mi historial de entregas | Consultar actividad pasada |
| D14 | Ver mi reputación | Saber cómo me evalúan |

### Vendedor

| ID | Como vendedor quiero... | Para... |
|----|------------------------|---------|
| V01 | Crear un envío Flash al vender | Ofrecer entrega exprés a mis compradores |
| V02 | Imprimir la etiqueta con QR | Identificar el paquete |
| V03 | Marcar el paquete como listo | Que el sistema lo ponga disponible para repartidores |
| V04 | Ver qué repartidor fue asignado | Saber quién viene a retirar |
| V05 | Generar QR de retiro | Confirmar que el repartidor correcto retiró el paquete |
| V06 | Ver el estado del envío en tiempo real | Hacer seguimiento sin llamar al repartidor |
| V07 | Ver la foto de evidencia de entrega | Tener respaldo ante reclamos del comprador |
| V08 | Ver devoluciones | Saber si hay paquetes que vuelven |

### Admin

| ID | Como admin quiero... | Para... |
|----|---------------------|---------|
| A01 | Aprobar/rechazar solicitudes de repartidores | Controlar quién opera en la red |
| A02 | Asignar manualmente repartidores a envíos | Gestionar cuando no hay asignación automática |
| A03 | Ver todos los envíos con filtros | Monitorear la operación en tiempo real |
| A04 | Bloquear un repartidor | Retirar de la red ante fraude o mala conducta |
| A05 | Ver el audit log completo de un envío | Investigar incidentes |
| A06 | Gestionar liquidaciones de wallets | Procesar pagos a repartidores |
| A07 | Configurar zonas de cobertura | Definir dónde opera Flash |
| A08 | Ver métricas de la red | Tomar decisiones operativas |

---

## 6. Reglas de negocio

### Repartidor

| Regla | Detalle |
|-------|---------|
| **Validación de identidad** | DNI obligatorio. En MVP: autodeclarado. En producción: validación con foto de DNI frente/dorso + selfie |
| **Activación** | Un repartidor no puede recibir pedidos si `isActive = false` o si está offline |
| **Límite de pedidos activos** | Máximo 3 pedidos simultáneos (configurable por tipo de vehículo: bici=1, moto=2, auto/furgoneta=3) |
| **Geolocalización obligatoria** | Para registrar retiro, llegada y entrega, el navegador debe proveer coordenadas GPS. Sin GPS = operación bloqueada |
| **Tiempo mínimo en domicilio** | 10 minutos desde `ARRIVED_AT_ADDRESS` antes de poder registrar visita fallida |
| **Evidencia obligatoria** | Mínimo 1 foto para confirmar entrega exitosa |
| **QR de retiro obligatorio** | No se puede marcar `PACKAGE_PICKED_UP` sin escanear el QR del vendedor |
| **Reputación** | Score de 0 a 5 estrellas. Cae por: visitas falsas detectadas, cancelaciones, entregas tardías. Sube por: entregas exitosas, buena evidencia |
| **Penalizaciones** | Cancelación después de aceptar: -0.5 puntos reputación. 3 visitas falsas detectadas: bloqueo automático |
| **Bloqueo por fraude** | Admin puede bloquear manualmente. El sistema bloquea automáticamente si detecta GPS spoofing o patrones anómalos |

### Envío

| Regla | Detalle |
|-------|---------|
| **Máximo 3 intentos** | Después del 3er intento fallido, estado → `RETURNED_TO_SELLER` |
| **Vigencia del QR** | El QR de retiro expira 24 hs después de generado |
| **Cancelación** | Solo posible antes de `PACKAGE_PICKED_UP`. Después del retiro, no se puede cancelar sin penalización |
| **Reasignación** | Si un repartidor cancela antes del retiro, el envío vuelve a `AVAILABLE` |
| **Devolucion** | Al tercer intento fallido, el sistema asigna automáticamente la devolución al vendedor |

---

## 7. Sistema de asignación

### Modos disponibles

**Manual (MVP)**
- Admin ve los envíos en estado `AVAILABLE` y los asigna a un repartidor activo
- Simple, confiable para bajo volumen

**Automático por disponibilidad**
- Sistema asigna al repartidor activo con menor carga (menos pedidos activos)
- No considera distancia

**Automático por cercanía** *(requiere GPS activo del repartidor)*
- Sistema ordena repartidores activos por distancia al punto de retiro
- Asigna al más cercano con capacidad disponible

**Automático por zona**
- Cada repartidor declara zona de cobertura (barrios o polígono)
- El envío se asigna solo a repartidores cuya zona incluye origen y destino

**Automático por reputación**
- Pondera: distancia × reputación × carga actual
- Favorece repartidores con mejor historial para envíos de alto valor

**Mercado abierto (independientes)**
- Envíos en `AVAILABLE` aparecen en el feed del repartidor
- Primero en aceptar se queda con el pedido
- Ideal para repartidores independientes sin zona asignada

### Algoritmo recomendado MVP

```
1. Si hay repartidor propio activo en zona → asignación automática por cercanía
2. Si no → publicar en feed (AVAILABLE) por 15 minutos
3. Si nadie acepta → notificar admin para asignación manual
```

---

## 8. Modelo de ganancias

### Fórmula base

```
ganancia = tarifa_base + (distancia_km × precio_por_km) + bonus_demanda + bonus_rendimiento
```

### Variables

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `tarifa_base` | Monto fijo por envío (por zona) | $800 CABA, $600 GBA |
| `precio_por_km` | Por km de distancia total (retiro → entrega) | $120/km |
| `distancia_km` | Calculada con Google Maps Directions API | 5.2 km |
| `bonus_demanda` | Multiplicador en horas pico (ej. 12-14 hs, 18-20 hs) | ×1.3 |
| `bonus_peso` | Envíos >5 kg: +$200. >10 kg: +$500 | Declarado por vendedor |
| `bonus_urgencia` | Envíos con entrega < 4 hs: +20% | Opcional por vendedor |
| `bonus_rendimiento` | >10 entregas en el día: +$500 | Automático |
| `propina` | El comprador puede dejarla al confirmar entrega | Opcional |

### Comisión Flash

Flash retiene un % sobre el ingreso bruto del repartidor:
- Repartidores propios: 0% (son empleados/contratados)
- Repartidores independientes: 20% plataforma

### Liquidación

- **Pendiente**: ganado pero aún no disponible (envío en curso o en período de validación)
- **Disponible**: validado, listo para retirar
- **Período de validación**: 24 hs después de confirmada la entrega (ventana antifraude)
- **Liquidación**: diaria automática si wallet ≥ $5.000, o manual en cualquier momento

---

## 9. Wallet del repartidor

### Estados del balance

```
ganancia_bruta
  └─ - comisión_flash (20% independientes)
  └─ - penalizaciones
  └─ = ganancia_neta → "Pendiente" (24 hs validación)
        └─ → "Disponible" (después de validación)
              └─ Retiro solicitado → "En proceso" (1-3 días hábiles)
                    └─ → "Acreditado" (CBU/CVU del repartidor)
```

### Modelo de datos wallet

```
FlashDriverWallet
  - driverId
  - pendingBalance    // suma de entregas en período de validación
  - availableBalance  // listo para retirar
  - totalEarned       // histórico acumulado
  - totalWithdrawn    // histórico de retiros
  - updatedAt

FlashWalletTransaction
  - walletId
  - type: EARNING | COMMISSION | PENALTY | WITHDRAWAL | BONUS
  - amount
  - description
  - shipmentId?       // relación con el envío que generó el movimiento
  - status: PENDING | AVAILABLE | WITHDRAWN
  - createdAt
```

### Retiros

- Repartidor carga CBU/CVU al registrarse
- Solicita retiro desde el panel (mínimo $2.000)
- Admin aprueba y procesa (o integración con API de transferencias)
- En MVP: aprobación manual por admin, transferencia por fuera del sistema

---

## 10. Seguridad y control antifraude

### Validación de retiro

- Vendedor genera QR de retiro único por envío (token de 32 bytes hex)
- QR expira en 24 hs
- Solo el repartidor asignado puede escanearlo
- Al escanearlo, sistema registra: timestamp, GPS del repartidor, driverId
- **Sin QR escaneado no se puede avanzar a `PACKAGE_PICKED_UP`**

### Validación de entrega

- GPS obligatorio al registrar llegada (coordenadas deben estar dentro de 500m del domicilio declarado)
- Foto obligatoria (mínimo 1, máximo 5)
- DNI del receptor obligatorio (validado formato 7-8 dígitos)
- Si receptor es el titular: DNI comparado contra el declarado en el pedido
- Timestamp inmutable en base de datos

### Detección de visitas falsas

| Señal | Acción |
|-------|--------|
| GPS a >1 km del domicilio al registrar llegada | Warning en audit log, requiere confirmación manual |
| Tiempo entre `ARRIVED_AT_ADDRESS` y `FAILED_ATTEMPT_*` < 10 min | Bloqueado por sistema |
| Patrón: >50% de sus envíos resultan fallidos | Revisión admin automática |
| GPS idéntico en múltiples envíos simultáneos | Flag de GPS spoofing |
| Foto de evidencia duplicada (hash) | Rechazo automático y flag al admin |

### Detección de GPS spoofing

- Comparar velocidad entre ubicaciones consecutivas (>200 km/h = imposible)
- Comparar ubicación con zona declarada del repartidor
- En MVP: validación básica por distancia al domicilio

### Protección de datos del cliente

- El repartidor **nunca ve el DNI completo** del comprador en el panel (solo últimos 4 dígitos)
- El número de teléfono del comprador se muestra enmascarado hasta que el repartidor confirma retiro
- Los datos de dirección desaparecen del panel del repartidor 24 hs después de `DELIVERED`

### Audit log

Cada cambio de estado registra:
```
- actorId + actorRole
- previousStatus → newStatus
- timestamp (UTC, inmutable)
- GPS coords (si aplica)
- deviceInfo (user agent)
- metadata adicional
```

---

## 11. Tracking

### Qué ve el cliente

| Evento | Notificación |
|--------|-------------|
| `PACKAGE_PICKED_UP` | "Tu paquete fue retirado y está en camino" |
| `IN_TRANSIT` | "Tu repartidor está en camino" + nombre del repartidor |
| `ARRIVED_AT_ADDRESS` | "Tu repartidor llegó a tu domicilio" |
| `DELIVERED` | "¡Entregado! Ver evidencia foto" |
| `FAILED_ATTEMPT_1` | "No pudimos encontrarte. Volveremos a intentar" |
| `RETURNED_TO_SELLER` | "El paquete volvió al vendedor tras 3 intentos" |

### Página de tracking pública

`/track/[orderNumber]` — accesible sin login

Muestra:
- Línea de tiempo de estados con timestamps
- Nombre del repartidor (sin apellido) y tipo de vehículo
- Estado actual con badge visual
- Dirección de entrega (solo ciudad y barrio, no dirección completa)
- Foto de evidencia si ya fue entregado
- Hora estimada de llegada (calculada en base a distancia + tiempo promedio)

### ETA (Hora estimada)

```
ETA = timestamp_pickup + (distancia_km / velocidad_promedio_vehiculo)

velocidades promedio:
  bici: 15 km/h
  moto: 25 km/h
  auto: 20 km/h (tráfico urbano)
  furgoneta: 18 km/h
```

---

## 12. Modelo de base de datos

### Tablas nuevas / actualizadas

```sql
-- Nuevos estados (enum ampliado)
CREATE TYPE FlashShipmentStatus AS ENUM (
  'CREATED', 'PAYMENT_CONFIRMED', 'LABEL_GENERATED', 'PACKAGE_READY',
  'AVAILABLE',                        -- NUEVO
  'ACCEPTED_BY_DRIVER',               -- NUEVO
  'DRIVER_EN_ROUTE_TO_PICKUP',        -- NUEVO
  'PACKAGE_PICKED_UP',                -- NUEVO
  'IN_TRANSIT',
  'ARRIVED_AT_ADDRESS',
  'DELIVERED',
  'FAILED_ATTEMPT_1', 'PENDING_VISIT_2',
  'FAILED_ATTEMPT_2', 'PENDING_VISIT_3',
  'FAILED_ATTEMPT_3',
  'RETURNED_TO_SELLER',               -- RENOMBRADO (era RETURNED_TO_SENDER)
  'CANCELLED'
);

-- Repartidor ampliado
ALTER TABLE flash_drivers ADD COLUMN
  is_online         BOOLEAN DEFAULT false,
  zone_coverage     TEXT[],           -- array de barrios/zonas
  reputation_score  DECIMAL(2,1) DEFAULT 5.0,
  active_orders     INT DEFAULT 0,
  max_orders        INT DEFAULT 2,
  dni               VARCHAR(8),
  dni_verified      BOOLEAN DEFAULT false,
  cbu               VARCHAR(22),
  latitude          DECIMAL(10,8),
  longitude         DECIMAL(11,8),
  last_seen_at      TIMESTAMP;

-- QR de retiro (pickup)
CREATE TABLE flash_pickup_qr (
  id            TEXT PRIMARY KEY,
  shipment_id   TEXT UNIQUE REFERENCES flash_shipments(id),
  token         TEXT UNIQUE NOT NULL,   -- 32 bytes hex
  scanned_by    TEXT REFERENCES flash_drivers(id),
  scanned_at    TIMESTAMP,
  expires_at    TIMESTAMP NOT NULL,
  created_at    TIMESTAMP DEFAULT now()
);

-- Wallet del repartidor
CREATE TABLE flash_driver_wallets (
  id                  TEXT PRIMARY KEY,
  driver_id           TEXT UNIQUE REFERENCES flash_drivers(id),
  pending_balance     DECIMAL(10,2) DEFAULT 0,
  available_balance   DECIMAL(10,2) DEFAULT 0,
  total_earned        DECIMAL(10,2) DEFAULT 0,
  total_withdrawn     DECIMAL(10,2) DEFAULT 0,
  updated_at          TIMESTAMP DEFAULT now()
);

CREATE TYPE WalletTransactionType AS ENUM (
  'EARNING', 'COMMISSION', 'PENALTY', 'WITHDRAWAL', 'BONUS', 'REFUND'
);
CREATE TYPE WalletTransactionStatus AS ENUM (
  'PENDING', 'AVAILABLE', 'WITHDRAWN', 'CANCELLED'
);

CREATE TABLE flash_wallet_transactions (
  id            TEXT PRIMARY KEY,
  wallet_id     TEXT REFERENCES flash_driver_wallets(id),
  shipment_id   TEXT REFERENCES flash_shipments(id),
  type          WalletTransactionType NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  description   TEXT,
  status        WalletTransactionStatus DEFAULT 'PENDING',
  created_at    TIMESTAMP DEFAULT now(),
  available_at  TIMESTAMP             -- cuando pasa a AVAILABLE
);

-- Zonas de cobertura Flash
CREATE TABLE flash_zones (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,          -- "CABA Norte", "GBA Oeste"
  province    TEXT NOT NULL,
  polygon     JSONB,                  -- GeoJSON para MVP básico
  base_fare   DECIMAL(8,2),
  price_per_km DECIMAL(6,2),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT now()
);

-- Tarifario de envíos
CREATE TABLE flash_pricing (
  id              TEXT PRIMARY KEY,
  zone_id         TEXT REFERENCES flash_zones(id),
  weight_min_kg   DECIMAL(5,2),
  weight_max_kg   DECIMAL(5,2),
  base_fare       DECIMAL(8,2),
  price_per_km    DECIMAL(6,2),
  urgency_surcharge DECIMAL(4,2),    -- porcentaje adicional si urgente
  is_active       BOOLEAN DEFAULT true
);

-- Reputación del repartidor (detalle)
CREATE TABLE flash_driver_reviews (
  id          TEXT PRIMARY KEY,
  driver_id   TEXT REFERENCES flash_drivers(id),
  shipment_id TEXT REFERENCES flash_shipments(id),
  score       INT CHECK (score BETWEEN 1 AND 5),
  comment     TEXT,
  reviewer    TEXT,                   -- 'SYSTEM' | 'ADMIN' | 'BUYER'
  created_at  TIMESTAMP DEFAULT now()
);

-- Shipment ampliado (columnas nuevas)
ALTER TABLE flash_shipments ADD COLUMN
  pickup_qr_token   TEXT,             -- token del QR de retiro
  weight_kg         DECIMAL(5,2),
  dimensions        JSONB,            -- {largo, ancho, alto} en cm
  is_urgent         BOOLEAN DEFAULT false,
  seller_address    JSONB,            -- dirección de retiro si difiere del vendedor
  accepted_at       TIMESTAMP,
  picked_up_at      TIMESTAMP,
  zone_id           TEXT REFERENCES flash_zones(id),
  fare              DECIMAL(8,2),     -- tarifa calculada al crear
  driver_earnings   DECIMAL(8,2);     -- lo que le corresponde al repartidor
```

---

## 13. Endpoints API

### Repartidor

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/flash/drivers/register` | Registro público de repartidor |
| `PATCH` | `/api/flash/drivers/me/status` | Toggle online/offline |
| `GET` | `/api/flash/drivers/me` | Perfil y estado actual |
| `GET` | `/api/flash/shipments/available` | Feed de envíos disponibles en zona |
| `POST` | `/api/flash/shipments/[id]/accept` | Aceptar un envío disponible |
| `POST` | `/api/flash/shipments/[id]/en-route-pickup` | Marcar en camino al vendedor |
| `POST` | `/api/flash/shipments/[id]/pickup` | Escanear QR de retiro → PACKAGE_PICKED_UP |
| `POST` | `/api/flash/shipments/[id]/in-transit` | Marcar en camino al cliente |
| `POST` | `/api/flash/shipments/[id]/arrive` | Registrar llegada (ya existe) |
| `POST` | `/api/flash/shipments/[id]/deliver` | Confirmar entrega (ya existe) |
| `POST` | `/api/flash/shipments/[id]/failed` | Registrar visita fallida (ya existe) |
| `GET` | `/api/flash/drivers/me/earnings` | Resumen de ganancias |
| `GET` | `/api/flash/drivers/me/wallet` | Estado de la wallet |
| `POST` | `/api/flash/drivers/me/wallet/withdraw` | Solicitar retiro |
| `GET` | `/api/flash/drivers/me/history` | Historial de entregas |

### Vendedor

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/flash/shipments` | Crear envío (ya existe) |
| `POST` | `/api/flash/shipments/[id]/ready` | Marcar paquete listo (→ AVAILABLE) |
| `GET` | `/api/flash/shipments/[id]/pickup-qr` | Generar/obtener QR de retiro |
| `GET` | `/api/flash/shipments` | Mis envíos (ya existe, role=seller) |
| `GET` | `/api/flash/shipments/[id]` | Detalle de envío |

### Admin

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/flash/drivers` | Lista repartidores (activos/pendientes) |
| `POST` | `/api/flash/drivers/[id]/approve` | Aprobar repartidor (ya existe) |
| `DELETE` | `/api/flash/drivers/[id]/approve` | Rechazar/desactivar (ya existe) |
| `POST` | `/api/flash/drivers/[id]/block` | Bloquear por fraude |
| `POST` | `/api/flash/shipments/[id]/assign` | Asignar manualmente (ya existe) |
| `PATCH` | `/api/flash/shipments/[id]/status` | Override de estado (ya existe) |
| `GET` | `/api/flash/wallets/pending` | Wallets con saldo listo para liquidar |
| `POST` | `/api/flash/wallets/[id]/liquidate` | Procesar liquidación |
| `GET` | `/api/flash/zones` | Zonas de cobertura |
| `POST` | `/api/flash/zones` | Crear zona |

### Público (sin login)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/flash/track/[orderNumber]` | Tracking público por número de orden |
| `GET` | `/api/flash/qr/[token]` | Datos del envío por QR (ya existe) |

---

## 14. Módulos del panel repartidor

### `/driver` — Dashboard
- Stats del día: asignados / pendientes / entregados / ganancias del día
- Botón online/offline (toggle prominente)
- Feed de pedidos disponibles (si independiente)
- Lista de pedidos activos asignados
- Botón "Escanear QR" (ya existe)

### `/driver/available` — Feed de disponibles
- Tarjetas de envíos con: dirección de retiro, distancia estimada, ganancia estimada
- Botón "Aceptar" por envío
- Solo visible si está online

### `/driver/earnings` — Ganancias
- Resumen: hoy / semana / mes
- Gráfico de barras por día
- Desglose por envío

### `/driver/wallet` — Wallet
- Saldo pendiente y disponible
- Botón "Solicitar retiro"
- Historial de transacciones

### `/driver/history` — Historial
- Lista de todos los envíos completados
- Filtro por fecha y estado
- Detalle por envío (mapa, foto de evidencia, ganancias)

### `/driver/profile` — Perfil
- Datos personales
- Tipo de vehículo
- CBU/CVU para cobros
- Zona de cobertura
- Reputación (score + últimas reviews)

---

## 15. Módulos del panel vendedor

### `/seller/flash` — Mis envíos (ya existe)
- Stats: activos / entregados / devueltos
- Lista de envíos con estado y acciones
- Etiqueta imprimible
- Evidencia de entrega

### Nuevas acciones en cada envío

- **"Paquete listo"**: cambia estado a `AVAILABLE`, activa asignación
- **"Ver QR de retiro"**: muestra QR que el repartidor debe escanear al retirar
- **"Ver repartidor asignado"**: nombre, vehículo, teléfono (enmascarado)
- **"Tracking en vivo"**: link a la página de tracking pública

---

## 16. Riesgos operativos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Repartidor acepta y no aparece | Media | Alto | Cancelación automática si no escanea QR en 45 min → reasignación |
| GPS spoofing (marcar llegada desde lejos) | Media | Alto | Validar distancia ≤500m al domicilio + análisis de velocidad |
| Foto de evidencia falsa (imagen reutilizada) | Baja | Alto | Hash de imagen + timestamp EXIF + metadata del dispositivo |
| Repartidor roba paquete | Baja | Muy alto | DNI verificado + audit completo + bloqueo inmediato |
| Volumen de pedidos sin repartidores disponibles | Alta (inicio) | Alto | Fallback a asignación manual + alertas al admin |
| Falsos registros de visitas fallidas | Media | Medio | 10 min de espera obligatorio + GPS validado |
| Disputas comprador-vendedor sobre entrega | Media | Medio | Foto obligatoria + DNI receptor + audit log como prueba |
| Sobrecarga de repartidor (más de 3 pedidos) | Baja | Medio | Límite técnico en el sistema + validación al aceptar |
| Cancelaciones en cadena de independientes | Media | Alto | Score de reputación penaliza cancelaciones |

---

## 17. Checklist MVP

### Base ya implementada ✅
- [x] FlashShipment con estados básicos
- [x] Creación de envío al confirmar pago (MP webhook)
- [x] Etiqueta imprimible con QR
- [x] QR de escaneo → `/flash/scan/[token]`
- [x] Registro de llegada con GPS
- [x] Confirmación de entrega con foto (Supabase Storage)
- [x] Visita fallida con espera de 10 minutos
- [x] Hasta 3 intentos de entrega
- [x] Audit log inmutable
- [x] Panel vendedor con fotos y timeline
- [x] Panel admin con asignación manual y override de estado
- [x] Dashboard repartidor con escáner QR
- [x] Registro público de transportistas con aprobación admin
- [x] Protección de `/driver/*` solo para choferes aprobados
- [x] Fotos en Supabase Storage (paths en DB, URLs regeneradas on-demand)

### A implementar en MVP v2

**Crítico (bloquea operación real):**
- [ ] Estado `PACKAGE_READY` + botón en panel vendedor
- [ ] Estado `AVAILABLE` + feed para repartidores independientes
- [ ] Estado `PACKAGE_PICKED_UP` + endpoint de escaneo de QR de retiro
- [ ] QR de retiro generado por el vendedor (distinto del QR de escaneo del chofer)
- [ ] Toggle online/offline del repartidor
- [ ] Wallet básica: acumular ganancias al confirmar entrega
- [ ] Endpoint `/api/flash/shipments/available` para feed de disponibles

**Importante (mejora experiencia):**
- [ ] Página de tracking pública `/track/[orderNumber]`
- [ ] Notificaciones por email en cambios de estado clave
- [ ] Panel de ganancias del repartidor
- [ ] Solicitud de retiro de wallet (aprobación manual admin)
- [ ] Validación de GPS en retiro (distancia al vendedor ≤500m)

**Nice to have:**
- [ ] Validación de DNI con foto (puede ser manual en MVP)
- [ ] ETA calculado con Google Maps Directions API
- [ ] Cálculo de tarifa automático por zona y distancia
- [ ] Reputación visible en el perfil del repartidor

---

## 18. Roadmap por etapas

### Etapa 1 — MVP (0-3 meses)
**Objetivo:** Operar en 1 zona piloto (CABA) con repartidores conocidos

- Asignación manual por admin
- Repartidores propios o conocidos (aprobación manual)
- QR de retiro + QR de entrega
- Google Maps para navegación
- Confirmación con fotos
- Wallet básica (registro de ganancias, retiro manual)
- Panel vendedor y repartidor funcionales
- Tracking básico (página de estados)

**Métricas de éxito:** 50 entregas/semana, tasa de entrega exitosa >85%

---

### Etapa 2 — Beta cerrada (3-6 meses)
**Objetivo:** Escalar a 3-5 zonas, incorporar repartidores independientes

- Feed de pedidos disponibles para independientes
- Toggle online/offline
- Cálculo de tarifa automático por zona y distancia
- Sistema de reputación básico
- Validación de GPS en retiro y entrega
- Notificaciones por email/WhatsApp
- Tracking en tiempo real para compradores
- Métricas operativas para admin

**Métricas de éxito:** 500 entregas/semana, >10 repartidores activos por zona, tasa de éxito >90%

---

### Etapa 3 — Expansión por zonas (6-12 meses)
**Objetivo:** Cubrir GBA y principales ciudades del interior

- Zonas configurables con tarifario propio
- Asignación automática por cercanía y disponibilidad
- App móvil nativa (PWA o React Native)
- DNI verificado con foto (integración con RENAPER o servicio externo)
- Liquidaciones automáticas diarias
- Dashboard de métricas avanzado para admin
- API pública para vendedores externos (no solo Madsjeez)

**Métricas de éxito:** 5.000 entregas/semana, 10+ zonas cubiertas

---

### Etapa 4 — Automatización (12-18 meses)
**Objetivo:** Reducir intervención manual al mínimo

- Asignación automática inteligente (reputación + cercanía + carga)
- Detección automática de fraude (GPS spoofing, fotos falsas)
- Sistema de penalizaciones automático
- Optimización de rutas multi-parada (un repartidor con 3+ pedidos)
- Integración con sistemas de pagos (transferencias automáticas)
- Webhooks para vendedores externos

---

### Etapa 5 — IA logística (18+ meses)
**Objetivo:** Optimización predictiva de toda la red

- Predicción de demanda por zona y hora
- Asignación predictiva (pre-asignar antes de que llegue el pedido)
- Optimización de flota en tiempo real
- Pricing dinámico por demanda
- Score de confianza del comprador (historial de recepción)
- Análisis de patrones de fraude con ML

---

*Documento generado: mayo 2026 — Flash v1.0*
*Última actualización: integración de módulos de red logística ampliada*
