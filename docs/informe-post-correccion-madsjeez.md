# Informe post-corrección — Madsjeez

Fecha: 2026-06-13 · Sigue al informe de integridad inicial. Documenta qué se corrigió,
cómo se verificó y qué queda pendiente (con motivo).

Verificación global: `npm run build` → **Compiled successfully**. Revisión de los cambios de
seguridad por agente especializado → **SAFE** (sin bypass ni regresión).

---

## Scorecard — antes vs. después

| Dimensión | Antes | Después | Cambio |
|-----------|:-----:|:-------:|--------|
| Funcionalidad | 8 / 10 | 8 / 10 | igual (deuda de tipos sigue) |
| **Seguridad** | **6 / 10** | **8.5 / 10** | 2 CRÍTICOS + 3 ALTO/MEDIO cerrados |
| SEO | 8.5 / 10 | 9 / 10 | + cluster de vendedores y blog |
| Estética / UX / A11y | 7 / 10 | 7.5 / 10 | aria-labels + contraste footer |
| Rendimiento / DevOps | 7.5 / 10 | 7.5 / 10 | igual (CI/observabilidad pendiente) |

---

## ✅ Corregido y verificado

### CRÍTICO (cerrado)
| ID | Hallazgo | Corrección | Archivo |
|----|----------|------------|---------|
| C1 | `/api/jarvis/autonomous` sin auth (confirmado 200 en prod) | `assertJarvisAuth(req)` en GET y POST (admin + `JARVIS_ENABLED`) | `api/jarvis/autonomous/route.ts` |
| C2 | `/api/jarvis/init` sin auth (DDL/exec_sql con service role) | `assertJarvisAuth(req)` en GET y POST | `api/jarvis/init/route.ts` |

> Si Jarvis está apagado en prod (`JARVIS_ENABLED=false`), estos endpoints ahora devuelven **503**;
> si está encendido, exigen **admin** (o `x-jarvis-secret`). El hueco explotable quedó cerrado.

### ALTO / MEDIO (cerrado)
| ID | Hallazgo | Corrección | Archivo |
|----|----------|------------|---------|
| + | `/api/jarvis/mcp` solo chequeaba flag, sin admin (ejecuta ops GitHub/Railway/Supabase) | `checkJarvisEnabled()` + `assertJarvisAuth(req)` en GET y POST | `api/jarvis/mcp/route.ts` |
| A3 | Webhook PayPal **fail-open** (aceptaba sin verificar si faltaba `PAYPAL_WEBHOOK_ID`) | **fail-closed**: rechaza (401) si no puede verificar firma | `api/webhooks/paypal/route.ts` |
| A4 | `req.ip` inexistente (TS2339) en 4 rutas Jarvis | reemplazado por `x-forwarded-for` (split/trim) | jarvis `chat`/`voice`/`command`/`face-auth` |
| Sec-M | `INTEGRATION_ENC_KEY` con fallback a literal público | lanza error si no hay `INTEGRATION_ENC_KEY` ni `NEXTAUTH_SECRET` (sin literal) | `lib/integrations/crypto.ts` |
| Sec-M | `search/smart` (Gemini pago) sin rate-limit | rate-limit por IP 20/min → 429 | `api/search/smart/route.ts` |
| Sec-M | `seller/leads` sin rate-limit (spam) | rate-limit por IP 5/10min → 429 | `api/seller/leads/route.ts` |
| A11y | Botones-ícono de AIChatBot sin `aria-label` | `aria-label` + `title` en los 4 botones del header | `components/AIChatBot.tsx` |
| A11y | Footer: label CUIT con bajo contraste (`text-slate-500`) | subido a `text-slate-400` | `components/seo/SiteCompanyFooter.tsx` |

---

## ⚠️ Requisito operativo (acción tuya en Railway)

- **`PAYPAL_WEBHOOK_ID`** debe estar seteado en las env de producción. Con el fail-closed (A3),
  si falta, **todos** los webhooks de PayPal devuelven 401 y los pagos no se reconcilian. Si PayPal
  no está activo todavía, no afecta; si lo activás, seteá la variable.

---

## ⏳ Pendiente (con motivo) — NO corregido en este lote

| ID | Hallazgo | Por qué no ahora | Recomendación |
|----|----------|------------------|---------------|
| A2 | Tokens MeLi/MercadoPago en texto plano en DB | El surface de lectura es grande (12 archivos: checkout, webhooks, `seller-access-token`, payment-gateway…). Cifrar al vuelo sin migrar TODOS los lectores + filas existentes **rompería cobros de sellers en vivo**. | Migración dedicada y testeada: cifrar en escritura con `encryptJSON`, `decryptJSON` con fallback a texto plano para filas legacy, backfill, y recién entonces quitar el fallback. Hacerlo en una rama con pruebas. |
| A5 | Webhook PayPal sin mapear pago→orden (TODO) | Es completar una feature (requiere decidir el mapeo `resource.id`→orden) y que PayPal esté activo, no un bug de seguridad. | Implementar cuando se active PayPal; la firma ya está fail-closed. |
| A1 | Token "face session" forjable (sin HMAC) | `/api/jarvis/command` **ya está gateado con admin** → el token facial es un 2º factor detrás de admin, no el control principal. Riesgo real bajo. | Endurecer con HMAC en un pase de Jarvis, opcional. |
| Perf | `ignoreBuildErrors: true` (163 errores TS Decimal/number) | Refactor grande de tipos Prisma Decimal vs number en cientos de lugares; riesgoso de hacer apurado. | Rama dedicada, resolver por módulos, luego apagar el flag. |
| Perf | 6 `<img>` crudos, admin `.select("*")` sin `.limit()` | Mejoras de rendimiento dispersas en varios archivos. | Pase de performance separado. |
| DevOps | Sin CI/CD ni Sentry, 455 `console.*` | Setup de infraestructura, no un fix de código puntual. | GitHub Actions (lint+test) + Sentry + logger estructurado. |
| A11y | AIChatBot `bg-white` en dark mode | Cambiarlo exige migrar también los colores del CONTENIDO del chat (texto oscuro sobre fondo claro). A medias rompe legibilidad. | Pase de theming dedicado del panel completo. |
| Sec | Rate-limit in-memory + XFF spoofable | Suficiente para abuso casual (lo dice el propio helper). | Si hay >1 réplica o se necesita control duro: Redis/Upstash + IP de proxy confiable. |

---

## Resumen

- **Cerrados:** 2 CRÍTICOS + 1 gap MCP + A3 (PayPal) + A4 (req.ip) + 2 rate-limits + crypto fallback + 2 a11y = **9 ítems**.
- **Verificado:** build OK + revisión de seguridad **SAFE**.
- **Tu acción:** setear `PAYPAL_WEBHOOK_ID` en Railway antes de usar PayPal.
- **Pendiente mayor:** A2 (cifrado de tokens) como migración dedicada — es lo único ALTO que queda, y se dejó así a propósito para no romper cobros en vivo.
