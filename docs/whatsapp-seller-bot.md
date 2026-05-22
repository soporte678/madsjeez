# Madsjeez Seller WhatsApp AI Bot — Auditoría e integración

## FASE 1 — Auditoría (resumen)

### 1. Stack detectado

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16 App Router, React 19, Tailwind, componentes en `src/components/dashboard/` |
| Backend | Route Handlers en `src/app/api/**` (mismo repo Next.js) |
| Base de datos | PostgreSQL (Supabase) vía **Prisma 7** (`prisma/schema.prisma`, `src/lib/prisma.ts`) |
| ORM | Prisma |
| Auth | **NextAuth** (`src/lib/auth.ts`) — Credentials + Google, sesión `session.user.id` |
| APIs | ~100+ rutas bajo `src/app/api/` (seller, checkout, meli, admin, webhooks) |
| Dashboard vendedor | `src/app/dashboard/page.tsx` — menú por hash (`#meli-sync`, etc.) |
| Productos | Modelo `Product` con `sellerId` → `User` |
| Vendedores / tienda | No hay modelo `Store` separado: **tienda = `User`** (`isSeller`, `storeSlug`, `sellerId` = `User.id`) |
| Pedidos | `Order` + Supabase en flujos de pago/checkout |

**WhatsApp existente (no confundir):** integración **Meta Cloud API** en `src/lib/meta/whatsapp/` y rutas `src/app/api/meta/whatsapp/*` — plantillas administrativas, **no** QR por vendedor.

**Leads existentes:** `SellerLead` en Prisma = captación de **nuevos vendedores** al marketplace, no leads de clientes por chat.

### 2. Archivos / carpetas relevantes

- Productos: `prisma/schema.prisma` (`Product`), `src/app/api/dashboard/products/`, `PublicacionesView`
- Vendedor: `User`, `src/app/api/seller/*`
- Pedidos: `Order`, checkout en `src/app/api/checkout/`, MP en `src/app/api/seller/payment-gateway/`
- Dashboard: `src/app/dashboard/page.tsx`, `src/components/dashboard/*`
- Env: `.env.example` (raíz)
- Migraciones: `prisma/migrations/`
- IA de referencia (marketplace global): `src/app/api/chat/route.ts` (Gemini + Supabase) — patrón de contexto por catálogo, **no** reutilizar para el bot por vendedor

### 3. Dónde integrar el módulo

| Pieza | Ubicación elegida |
|-------|-------------------|
| Dominio / servicios | `src/lib/whatsapp-bot/` |
| Proveedor Evolution | `src/lib/whatsapp-bot/providers/evolution-provider.ts` |
| APIs vendedor | `src/app/api/seller/whatsapp-bot/` |
| Webhook Evolution | `src/app/api/webhooks/evolution/route.ts` |
| UI | `src/components/dashboard/WhatsappBotView.tsx` + menú `#whatsapp-bot` |
| DB | Nuevas tablas Prisma con prefijo `whatsapp_*` (sin tocar `SellerLead`) |

`store_id` en diseño = opcional; en runtime se usa **`sellerId`** (`User.id`) y `storeSlug` para links públicos.

### 4. Riesgos técnicos

- **Checkout / pagos:** el bot solo lee catálogo y genera links; no modifica órdenes ni preferencias MP.
- **Auth:** todas las rutas seller exigen sesión; QR solo vía API autenticada.
- **Permisos:** filtrar por `sellerId` en cada query Prisma.
- **Sesiones WhatsApp:** una instancia Evolution por vendedor; desconexión no debe borrar historial.
- **IA:** Ollama opcional; fallback por reglas si no responde.
- **Prompt injection:** contexto acotado; no exponer prompts al cliente.
- **Escalabilidad:** MVP síncrono en webhook; cola/worker es siguiente fase.

### 5. Plan incremental

1. ✅ Modelos + migración  
2. ✅ Provider abstracto + Evolution  
3. ✅ BotEngine + conocimiento catálogo + Ollama fallback  
4. ✅ APIs sesión / config / conversaciones / handoff / mensajes / leads PATCH  
5. ✅ Dashboard con chat, QR, config y leads  
6. ✅ Notificaciones Prisma (`type: whatsapp`) + email Resend en handoff/lead caliente  
7. ✅ Horario comercial (`business-hours.ts` + config)  
8. ✅ Webhook: secreto obligatorio en prod, rate limit, dedupe por `providerMessageId`  
9. Pendiente: embeddings/pgvector, cola async, medios (imagen/audio), tests E2E  

---

## Variables de entorno

```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=
EVOLUTION_DEFAULT_INSTANCE_PREFIX=madsjeez_seller_
EVOLUTION_WEBHOOK_SECRET=optional_shared_secret

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

Webhook público (configurar en Evolution):  
`https://<tu-dominio>/api/webhooks/evolution`

## Evolution API (local)

```bash
docker run -d --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=tu_clave \
  atendai/evolution-api:latest
```

En el panel Evolution, apuntá el webhook global a la URL de Madsjeez y el mismo `EVOLUTION_WEBHOOK_SECRET` si lo usás.

## Ollama

```bash
ollama pull qwen2.5:7b
ollama serve
```

## Pruebas MVP

1. Vendedor logueado → Dashboard → **Bot de WhatsApp** → Conectar → ver QR.  
2. Escanear QR → estado **Conectado**.  
3. Enviar WhatsApp al número conectado → revisar conversación en el panel.  
4. Preguntar por un producto publicado → respuesta con precio/stock reales de Prisma.  
5. “Quiero hablar con alguien” → conversación en modo humano; bot pausado.  

## Modelos (nombres en Prisma)

- `WhatsappSession`, `SellerBotConfig`, `WhatsappLead`, `WhatsappConversation`, `WhatsappMessage`, `WhatsappBotEvent`, `WhatsappHumanHandoff`
