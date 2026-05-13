# Checklist post-remediación

## Antes del deploy

- [ ] Rotar todas las credenciales listadas en [SECURITY_ROTATION.md](./SECURITY_ROTATION.md).
- [ ] Variables en Railway/hosting: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (pooler `:6543` OK para la app en runtime), `NEXTAUTH_SECRET`, `MERCADOPAGO_*`, `MERCADOPAGO_WEBHOOK_SECRET`, `MP_OAUTH_STATE_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`, `ADMIN_SETUP_SECRET`, `ADMIN_CREATE_DIRECT_SECRET` (solo staging), `GEMINI_API_KEY` (opcional). Para **migraciones Prisma** en el contenedor: **`DIRECT_DATABASE_URL`** con la URI **Direct connection** `:5432` de Supabase (Database → Connection string, host `db.<ref>.supabase.co`). Sin esto, `migrate deploy` puede fallar con P1001 y faltan tablas nuevas (`seller_zipnova_oauth`, etc.). Si el hosting no alcanza `db.*:5432`, revisá redes / [IPv4 en Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).
- [ ] **Zipnova (si usás cotización/envío Zipnova en prod):** `ZIPNOVA_API_BASE_URL`, `ZIPNOVA_ACCOUNT_ID`, `ZIPNOVA_API_TOKEN`, `ZIPNOVA_API_SECRET`, y opcionalmente `ZIPNOVA_ORIGIN_ID`, `ZIPNOVA_SOURCE`. Sin el trío token/secret/account válidos, el checkout usa monto de envío legacy. Ver `docs/api/recursos/zipnova-envios.md`.
- [ ] **`MP_OAUTH_STATE_SECRET`**: secreto propio (≥16 caracteres) para firmar el `state` del OAuth de MP vendedores — no viene del panel de Mercado Pago. Generación: ver comentarios en `.env.example` o sección “OAuth Mercado Pago” en `RAILWAY_DEPLOYMENT.md`.
- [ ] Aplicar migración SQL en Supabase: `supabase/migrations/006_security_webhook_oauth.sql` (`supabase db push` o SQL editor).
- [ ] `ENABLE_ADMIN_BOOTSTRAP`: dejar `false` en producción salvo ventana explícita de bootstrap.
- [ ] Ejecutar `npm run lint` y `npm run test`.

## Después del deploy

- [ ] Smoke: login, checkout Mercado Pago (sandbox/prod según entorno), webhook de prueba desde panel MP.
- [ ] Tras el deploy: logs sin `P2021` / tabla `seller_zipnova_oauth` inexistente (indica `migrate deploy` fallido). Opcional en Railway: `PRISMA_MIGRATE_ATTEMPTS`, `PRISMA_MIGRATE_RETRY_SLEEP_SEC` para reintentos en boot.
- [ ] Verificar logs: sin errores 503 en `/api/webhooks/mercadopago` por firma.
- [ ] OAuth vendedor MP: conectar cuenta de prueba y confirmar redirect con `mp_success`.

## Observabilidad

- Revisar en logs intentos `401` en webhooks y `429` en `/api/chat` (rate limit).
- Alertar si sube el ratio de `Invalid signature` en MP webhook.
