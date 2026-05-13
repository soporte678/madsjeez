# Recurso: Vendedor — panel y Mercado Pago

## Dashboard vendedor

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/seller/dashboard` | KPIs y datos agregados del vendedor. | Sesión vendedor |

## Colaboradores

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/seller/collaborators` | Listar colaboradores. | Sesión vendedor |
| POST | `/api/seller/collaborators/invite` | Invitar colaborador. | Sesión vendedor |
| DELETE | `/api/seller/collaborators/invite/{id}` | Revocar invitación. | Sesión vendedor |

## Pasarela Mercado Pago (cuenta del vendedor)

Conexión OAuth del **vendedor** con Mercado Pago para cobros (distinto del checkout marketplace en `/api/checkout/mp`).

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/seller/payment-gateway/mercadopago/auth` | Inicia OAuth MP. | Sesión vendedor |
| GET | `/api/seller/payment-gateway/mercadopago/callback` | Callback OAuth MP. | Redirección MP |
| POST | `/api/seller/payment-gateway/mercadopago/create-preference` | Crear preferencia de cobro. | Sesión vendedor |
| POST | `/api/seller/payment-gateway/mercadopago/disconnect` | Desvincular cuenta MP. | Sesión vendedor |
| GET | `/api/seller/payment-gateway/mercadopago/status` | Estado de vinculación. | Sesión vendedor |

Variables relacionadas: `MERCADOPAGO_*`, `MP_OAUTH_STATE_SECRET` (ver `.env.example`).

**Tokens OAuth:** el `access_token` del vendedor caduca (típicamente horas). En `POST /api/checkout/mp` y en `create-preference` el servidor renueva el token con `refresh_token` antes de crear la preferencia cuando está por vencer o vencido, y reintenta una vez si Mercado Pago responde **401**. Si el vendedor conectó MP antes de que existiera `mp_refresh_token` en base, debe **volver a vincular** Mercado Pago desde el panel.
