# Guía de Configuración DNS - MadsJeez.com.ar

## Paso 1: Obtener datos de Railway

1. Ve a [railway.app](https://railway.app) y haz login
2. Crea un nuevo proyecto o usa uno existente
3. Ve a tu servicio > Settings > Domains
4. Agrega tu dominio: `madsjeez.com.ar`
5. Railway te dará un **CNAME Target** como:
   `madsjeez-com-ar.up.railway.app`

## Paso 2: Configurar DNS en NIC.AR

1. Ve a [https://nic.ar](https://nic.ar) e inicia sesión
2. Busca tu dominio `madsjeez.com.ar`
3. Ve a la sección **"DNS"** o **"Servidores de nombres"**

### Opción A: Usar CNAME (Recomendado para subdominios)

```
Tipo:     CNAME
Nombre:   www
Valor:    [TU-CNAME-DE-RAILWAY].up.railway.app
TTL:      3600
```

Luego configura redirección de raíz a www en Railway.

### Opción B: DNS Personalizado (Para dominio raíz)

Si necesitas que funcione `madsjeez.com.ar` (sin www):

1. Obtén la IP de Railway ejecutando:
   ```bash
   nslookup [TU-CNAME-DE-RAILWAY].up.railway.app
   ```

2. En NIC.AR agrega:
   ```
   Tipo:     A
   Nombre:   @
   Valor:    [IP-DE-RAILWAY]
   TTL:      3600
   
   Tipo:     CNAME
   Nombre:   www
   Valor:    madsjeez.com.ar
   TTL:      3600
   ```

## Paso 3: Configurar Supabase

Tu URL de Supabase: `https://svbzmvmmzaqkepeysjyk.supabase.co`

### Obtener credenciales:
1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Project Settings** > **API**
4. Copia:
   - **URL**: `https://svbzmvmmzaqkepeysjyk.supabase.co`
   - **anon public**: Para el frontend
   - **service_role secret**: Para el backend (¡nunca expongas esta!)

### Configurar Authentication:
1. Ve a **Authentication** > **URL Configuration**
2. Agrega:
   - Site URL: `https://madsjeez.com.ar`
   - Redirect URLs:
     - `https://madsjeez.com.ar/auth/callback`
     - `https://madsjeez.com.ar/auth/confirm`

## Paso 4: Configurar Variables en Railway

En tu proyecto de Railway, ve a **Variables** y agrega:

```env
# Database (Supabase) — copiá las URLs desde el dashboard de tu proyecto (sin commitear credenciales reales)
DATABASE_URL=postgresql://postgres.[YOUR-POOLER-USER]:[PASSWORD]@[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.[YOUR-POOLER-USER]:[PASSWORD]@[REGION].pooler.supabase.com:5432/postgres

# Auth
NEXTAUTH_URL=https://madsjeez.com.ar
NEXTAUTH_SECRET=[openssl rand -base64 32]

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[publishable o anon desde Dashboard → API Keys]
SUPABASE_SERVICE_ROLE_KEY=[secret o service_role — solo servidor]

# Stripe (para pagos)
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary (para imágenes)
CLOUDINARY_CLOUD_NAME=tu-cloud
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-secret

# App
NEXT_PUBLIC_APP_NAME=MadsJeez
NEXT_PUBLIC_APP_URL=https://madsjeez.com.ar
```

## Paso 5: Deploy

### Opción 1: CLI de Railway

```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# Enlazar proyecto
cd marketplace
railway link

# Deploy
railway up
```

### Opción 2: GitHub Integration

1. En Railway, ve a tu proyecto > Settings
2. Conecta tu repositorio de GitHub: `soporte678/madsjeez`
3. Configura deploy automático en cada push a `main`

## Paso 6: Verificar SSL

Railway automáticamente provisiona SSL para tu dominio. Verifica:
- `https://madsjeez.com.ar` funciona
- El certificado es válido

## Troubleshooting

### DNS no propaga
- Espera 24-48 horas para propagación global
- Verifica con: `dig madsjeez.com.ar` o `nslookup madsjeez.com.ar`

### Error de conexión a Supabase
- Verifica que la contraseña en DATABASE_URL sea correcta
- Asegúrate de usar el Pooler (puerto 6543) para DATABASE_URL
- Usa puerto 5432 solo para DIRECT_URL

### Build falla
- Revisa los logs en Railway Dashboard
- Verifica que todas las variables de entorno estén configuradas

## Comandos útiles

```bash
# Ver logs
railway logs

# Variables
railway variables

# Conectar a base de datos
railway connect postgres

# Ejecutar migraciones manualmente
railway run npx prisma migrate deploy
```
