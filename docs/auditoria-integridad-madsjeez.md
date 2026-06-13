# Auditoría de integridad — Madsjeez

Fecha: 2026-06-13 · Sitio: https://www.madsjeez.com.ar · Método: 5 auditores en paralelo (funcionalidad, seguridad, SEO, estética/UX, rendimiento/DevOps) + smoke tests en vivo contra producción.

## Scorecard

| Dimensión | Nota | Estado |
|-----------|------|--------|
| Funcionalidad | 8 / 10 | Sólida; flujos críticos OK; deuda de tipos |
| **Seguridad** | **6 / 10** | **2 endpoints CRÍTICOS sin auth en prod** |
| SEO | 8.5 / 10 | Excelente base, gate de indexación, JSON-LD |
| Estética / UX / A11y | 7 / 10 | Core AAA; componentes 2dios con deuda dark/a11y |
| Rendimiento / DevOps | 7.5 / 10 | Caching/CWV bien; falta CI/observabilidad |

**Veredicto general:** plataforma madura y bien arquitecturada. **Hay 2 vulnerabilidades críticas que se deben cerrar YA** (endpoints Jarvis sin auth). El resto son mejoras de hardening y deuda técnica no bloqueante.

---

## 🔴 CRÍTICO — cerrar de inmediato

### C1. `/api/jarvis/autonomous` sin autenticación (CONFIRMADO en producción)
- **Evidencia live:** `GET /api/jarvis/autonomous?action=start` → **HTTP 200** sin credenciales.
- **Riesgo:** cualquiera arranca/para/reinicia/destruye el motor autónomo y puede ejecutar tareas que mutan estado del marketplace.
- **Archivo:** `src/app/api/jarvis/autonomous/route.ts:47,110`
- **Fix:** `assertJarvisAuth(req)` al inicio de GET y POST (igual que dispatch/orchestrate/tasks).

### C2. `/api/jarvis/init` sin autenticación
- **Evidencia:** `POST /api/jarvis/init` ejecuta (HTTP 500 por otra causa, pero **corre sin auth**) DDL/execSql con service role.
- **Riesgo:** creación de tablas/seed/SQL arbitrario contra Supabase con privilegios de service role.
- **Archivo:** `src/app/api/jarvis/init/route.ts:182`
- **Fix:** `assertJarvisAuth` o `JARVIS_INIT_TOKEN`, y deshabilitar en prod (patrón admin-bootstrap).

> Recomendación: estos dos se arreglan en minutos y deberían ir antes que cualquier otra cosa.

---

## 🟠 ALTO

| # | Hallazgo | Archivo | Acción |
|---|----------|---------|--------|
| A1 | Token "face session" forjable (base64 sin firma); el `userId` de logs/rate-limit lo elige el caller | `api/jarvis/command/route.ts:142` | Firmar con HMAC o derivar userId de la sesión admin |
| A2 | Tokens MeLi/MercadoPago **en texto plano** en DB (solo TiendaNube cifra) | `meli/oauth/callback:62`, `seller_mercadopago` | Cifrar con `encryptJSON` (AES-256-GCM ya existe) |
| A3 | Webhook PayPal acepta eventos **no verificados** si falta `PAYPAL_WEBHOOK_ID` (fail-open) | `api/webhooks/paypal/route.ts:31` | Fail-closed (rechazar/503) — urgente antes de mutar órdenes |
| A4 | `req.ip` no existe en NextRequest → runtime error en 4 rutas Jarvis | `jarvis/{chat,command,voice,face-auth}` | Usar `x-forwarded-for` |
| A5 | Webhook PayPal sin mapear pago→orden (TODO) | `api/webhooks/paypal:95` | Implementar antes de activar PayPal |

---

## 🟡 MEDIO

**Seguridad**
- Endpoints públicos costosos sin rate-limit: `api/search/smart` (llama Gemini pago), `api/seller/leads` (lead-spam). → agregar `checkRateLimit` por IP.
- `INTEGRATION_ENC_KEY` con fallback a literal `"madsjeez-fallback-secret"` → lanzar error si no hay clave.
- `seller_locations` / `seller_meli_oauth` aplicadas fuera de migraciones → confirmar RLS ON en el dashboard Supabase.

**Funcionalidad**
- FX ARS/USD hardcodeado `1000` en checkout PayPal → conectar tasa real.
- Flash shipping: fallback a precio del cliente si la tabla no migró, **sin log** → loguear.
- `ignoreBuildErrors: true` tapa 163 errores TS (Decimal vs number, schema drift `marketingCollaboratorAccess`, `sw.ts`). Build pasa pero hay riesgo runtime.

**Estética / UX / A11y**
- `AIChatBot` con `bg-white` hardcodeado → invisible/ilegible en dark mode. (`AIChatBot.tsx:208`)
- Footer con `#00b4d8` (cyan) → **falla contraste WCAG AA en dark**. (`SiteCompanyFooter.tsx`)
- Botones de ícono sin `aria-label` (AIChatBot, AdminNavbar) → fallo de accesibilidad.
- `NotificationsDropdown`/`AIChatBot` con ancho fijo `380px` → overflow en 375px.
- Colores hardcodeados sueltos (footer, FlashRatesPanel, CartView) ignoran el sistema de temas.

**Rendimiento / DevOps**
- 6 `<img>` crudos en rutas públicas (product detail, diagnóstico, pieza) → migrar a `next/image`.
- Admin pages con `.select("*")` sin `.limit()` → memory bloat si crece la data.
- Sin CI/CD (GitHub Actions) ni observabilidad (Sentry); 455 `console.*` sin logging estructurado.

---

## 🟢 Fortalezas confirmadas

- **Headers de seguridad (live):** HSTS preload, CSP restrictiva, X-Frame DENY, nosniff, referrer-policy. Muy bien.
- **Pagos:** preferencia MP recalcula montos server-side (anti-tampering), Bearer + ownership; webhook MP con HMAC-SHA256 + timestamp + idempotencia.
- **Auth admin:** `requireAdminRequest` (Supabase user + admin_users + cookie hasheada); bootstrap deshabilitado en prod.
- **SEO:** gate de indexación por inventario (evita ~378 categorías vacías), JSON-LD completo (Product/Breadcrumb/FAQ/ItemList), sitemap filtrado, robots correcto, contenido real (no thin/inventado).
- **Rendimiento:** ISR en categorías/guías/diagnóstico, next/image con AVIF/WebP, queries con `include`/`limit`, GA/GTM async. Core Web Vitals: riesgo bajo.
- **Privacidad geo:** coordenadas privadas no se exponen (vista pública + RPC validados).
- **Tests:** 56 tests (vitest) pasando.
- **Páginas públicas:** todas 200 OK y rápidas (<1.8s) en el smoke test.

---

## Plan de acción priorizado

**Hoy (crítico, ~30 min):**
1. Auth en `jarvis/autonomous` + `jarvis/init` (C1, C2).
2. PayPal webhook fail-closed (A3).

**Esta semana (alto):**
3. Cifrar tokens MeLi/MP en reposo (A2).
4. Firmar face token o derivar userId de sesión (A1).
5. `req.ip` → `x-forwarded-for` en rutas Jarvis (A4).
6. Rate-limit en `search/smart` y `seller/leads`.

**Próximas 2 semanas (medio):**
7. Dark/A11y: AIChatBot tokens, footer cyan, aria-labels, anchos fijos.
8. `<img>` → `next/image` en rutas públicas.
9. `.limit()` en admin queries.
10. GitHub Actions (lint+test) + Sentry.

**Backlog (deuda):**
11. Resolver tipos Decimal/number y apagar `ignoreBuildErrors`.
12. Consolidar recharts vs chart.js.
13. FX real en PayPal.
