# Checklist post-remediación

## Antes del deploy

- [ ] Rotar todas las credenciales listadas en [SECURITY_ROTATION.md](./SECURITY_ROTATION.md).
- [ ] Variables en Railway/hosting: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (pooler transaction `:6543` OK para la app), `NEXTAUTH_SECRET`, `MERCADOPAGO_*`, `MERCADOPAGO_WEBHOOK_SECRET`, `MP_OAUTH_STATE_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`, `ADMIN_SETUP_SECRET`, `ADMIN_CREATE_DIRECT_SECRET` (solo staging), `GEMINI_API_KEY` (opcional). **`migrate.mjs`** deriva por defecto **Supavisor session** (`*.pooler.supabase.com:5432`) desde ese pooler para `prisma migrate deploy` (IPv4 en Railway). `DIRECT_DATABASE_URL` solo si querés override: usá la URI **Session mode** del panel Supabase, no obligatorio `db.*` (a menudo P1001 sin IPv6). `PRISMA_MIGRATE_SUPABASE_USE_DB_HOST=1` fuerza la derivación antigua a `db.<ref>.supabase.co`.
- [ ] **Bot WhatsApp vendedor (Evolution + Ollama):** `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_WEBHOOK_SECRET` (**obligatorio en producción**), `EVOLUTION_DEFAULT_INSTANCE_PREFIX`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`. Webhook público: `https://<dominio>/api/webhooks/evolution`. Opcional email handoff: `RESEND_API_KEY`, `RESEND_FROM`. Ver `docs/whatsapp-seller-bot.md`.
- [ ] Migración Prisma `20260522120000_whatsapp_seller_bot` aplicada (`npx prisma migrate deploy`).
- [ ] **Zipnova (si usás cotización/envío Zipnova en prod):** `ZIPNOVA_API_BASE_URL`, `ZIPNOVA_ACCOUNT_ID`, `ZIPNOVA_API_TOKEN`, `ZIPNOVA_API_SECRET`, y opcionalmente `ZIPNOVA_ORIGIN_ID`, `ZIPNOVA_SOURCE`. Sin el trío token/secret/account válidos, el checkout usa monto de envío legacy. Ver `docs/api/recursos/zipnova-envios.md`.
- [ ] **`MP_OAUTH_STATE_SECRET`**: secreto propio (≥16 caracteres) para firmar el `state` del OAuth de MP vendedores — no viene del panel de Mercado Pago. Generación: ver comentarios en `.env.example` o sección “OAuth Mercado Pago” en `RAILWAY_DEPLOYMENT.md`.
- [ ] Aplicar migración SQL en Supabase: `supabase/migrations/006_security_webhook_oauth.sql` (`supabase db push` o SQL editor).
- [ ] `ENABLE_ADMIN_BOOTSTRAP`: dejar `false` en producción salvo ventana explícita de bootstrap.
- [ ] Ejecutar `npm run lint` y `npm run test`.

## Después del deploy

- [ ] En Railway: si existe `DIRECT_DATABASE_URL` con host `db.<ref>.supabase.co`, **eliminála** o reemplazala por la URI **Session** del panel (Connect → Session); con pooler `:6543` en `DATABASE_URL`, esa `DIRECT` provoca P1001 en migrate.
- [ ] **P3009 / P3018 (deriva DDL):** más redeploys **no** arreglan solos el estado en `_prisma_migrations`. Con **`migrate.mjs 20260514i`+**, auto-`migrate resolve` para casos conocidos (incl. columna `seller_meli_oauth.last_catalog_import_at` / `add_last_catalog_import_at`). Desactivar: `PRISMA_MIGRATE_AUTO_RESOLVE_P3009_DRIFT=0`. Manual: scripts `migrate:resolve:*` en `package.json`. **No** borres `_prisma_migrations` salvo plan de recuperación explícito y backup. Doc: https://pris.ly/d/migrate-resolve
- [ ] Logs sin `P2021` / tabla `seller_zipnova_oauth` inexistente (migrate nunca completó). Opcional: `PRISMA_MIGRATE_ATTEMPTS`, `PRISMA_MIGRATE_RETRY_SLEEP_SEC`.
- [ ] Verificar logs: sin errores 503 en `/api/webhooks/mercadopago` por firma.
- [ ] OAuth vendedor MP: conectar cuenta de prueba y confirmar redirect con `mp_success`.

## Observabilidad

- Revisar en logs intentos `401` en webhooks y `429` en `/api/chat` (rate limit).
- Alertar si sube el ratio de `Invalid signature` en MP webhook.
