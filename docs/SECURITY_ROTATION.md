# Rotación de credenciales tras exposición en repositorio

Ejecutar **en este orden** en los dashboards de cada proveedor. Tras cada rotación, actualizar variables en Railway/Vercel/GitHub Actions (sin commitear valores reales).

## 1. Supabase

1. Dashboard → Project Settings → API → **Regenerate** `service_role` (y opcionalmente `anon` si también se filtró).
2. Actualizar `SUPABASE_SERVICE_ROLE_KEY` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el hosting.
3. Revisar **Audit logs** por actividad anómala.

## 2. Meta (WhatsApp / Graph)

1. Meta for Developers → App → **Regenerate** App Secret.
2. Revocar/regenerar **User/System access tokens** expuestos.
3. Configurar `META_APP_SECRET`, `META_ACCESS_TOKEN`, `META_WEBHOOK_VERIFY_TOKEN` solo por variables de entorno.

## 3. Mercado Pago

1. Tus integraciones → Credenciales → **Rotar** Client Secret y Access Token de producción/test según corresponda.
2. Regenerar **Webhook secret** en la notificación configurada en MP.
3. Actualizar `MERCADOPAGO_CLIENT_SECRET`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`.

## 4. NextAuth

1. Generar nuevo `NEXTAUTH_SECRET` (mín. 32 bytes aleatorios, p. ej. `openssl rand -base64 32`).
2. Forzar re-login de usuarios si se invalidan sesiones.

## 5. Historial Git (obligatorio si hubo secretos en commits)

1. Usar [git-filter-repo](https://github.com/newren/git-filter-repo) o BFG para eliminar archivos/líneas con secretos del historial.
2. **Force-push** a `main` (coordinar con el equipo).
3. Volver a rotar todas las claves anteriores (el historial público puede haber sido copiado).

## 6. CI / secret scanning

1. Habilitar GitHub **Secret scanning** y push protection.
2. Opcional: job con `gitleaks` en PR.

## ¿Por qué no “encriptamos” secretos dentro del código del repo?

La aplicación (Next.js, Prisma, webhooks) necesita los valores **en texto claro en tiempo de ejecución** para llamar a Supabase, MP, Stripe, etc. Si guardás un archivo cifrado en Git junto con la clave para descifrarlo, **sigue siendo una filtración** en cuanto alguien clone el repo.

Lo correcto es:

- Secretos **solo** en el hosting (Railway, etc.) o en gestores de secretos del CI.
- En el repo: **solo** `.env.example` con placeholders (sin valores reales).

Quitar secretos de archivos visibles **reduce el riesgo de copia accidental**, pero **no reemplaza la rotación** si una credencial real llegó a verse en capturas, chats o historial público de Git.
