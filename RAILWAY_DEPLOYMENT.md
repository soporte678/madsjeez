# Guía de Despliegue en Railway + DonWeb

## Despliegue del Marketplace MADSJEEZ en Railway

---

## PASO 1: Preparar el Proyecto

### 1.1 Verificar archivos necesarios
Asegúrate de tener estos archivos en tu proyecto:

```
madsjeez-marketplace/
├── Dockerfile (ya configurado ✅)
├── railway.toml (ya configurado ✅)
├── package.json
└── apps/web/
    ├── .env.production (lo crearemos)
    └── next.config.ts
```

### 1.2 Crear archivo .env.production

Crea el archivo `apps/web/.env.production`:

```env
# ============================================
# SUPABASE - Base de datos
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=(set in Railway UI — never commit)
SUPABASE_SERVICE_ROLE_KEY=(set in Railway UI — never commit)

# ============================================
# APP CONFIG
# ============================================
NEXT_PUBLIC_APP_URL=https://tudominio.com
NEXT_PUBLIC_APP_NAME=MADSJEEZ Marketplace
PORT=3000

# ============================================
# MERCADOPAGO - Pagos (Argentina)
# ============================================
# Modo sandbox (desarrollo)
MERCADOPAGO_PUBLIC_KEY=TEST-...
MERCADOPAGO_ACCESS_TOKEN=TEST-...

# Modo producción (activar cuando esté todo listo)
# MERCADOPAGO_PUBLIC_KEY=your_mp_public_key
# MERCADOPAGO_ACCESS_TOKEN=your_mp_access_token
MERCADOPAGO_WEBHOOK_SECRET=tu-webhook-secret

# OAuth conectar cuenta del vendedor (distinto del checkout): firmar "state"
# Ver sección "OAuth Mercado Pago (vendedores)" más abajo — NO lo provee el panel de MP.
MP_OAUTH_STATE_SECRET=

# ============================================
# EMAIL - Resend (recomendado)
# ============================================
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@tudominio.com
EMAIL_FROM_NAME=MADSJEEZ

# ============================================
# OPCIONAL: Analytics
# ============================================
# NEXT_PUBLIC_GOOGLE_ANALYTICS=G-XXXXXXXXXX
```

### OAuth Mercado Pago (vendedores): `MP_OAUTH_STATE_SECRET`

- **No** es una clave que descargues de Mercado Pago. Es un **secreto aleatorio** que vos generás (recomendado: 32 bytes en Base64; el código exige **mínimo 16 caracteres**).
- Se usa solo en el servidor para firmar el parámetro `state` del flujo OAuth cuando un vendedor conecta su cuenta MP (`/api/seller/payment-gateway/mercadopago/auth` y `callback`).
- **Windows (CMD):** generá el valor y copialo en Railway → Variables → `MP_OAUTH_STATE_SECRET`:

```cmd
powershell -NoProfile -Command "$r = New-Object System.Security.Cryptography.RNGCryptoServiceProvider; $b = New-Object byte[] 32; $r.GetBytes($b); [Convert]::ToBase64String($b)"
```

- Después de crear o cambiar la variable, **redeploy** del servicio.
- En paralelo deben estar bien configuradas `MERCADOPAGO_CLIENT_ID`, `MERCADOPAGO_CLIENT_SECRET` y `MERCADOPAGO_REDIRECT_URI` (igual que en la aplicación OAuth de Mercado Pago).

---

## PASO 2: Crear Cuenta e Instalar Railway CLI

### 2.1 Crear cuenta en Railway
1. Ve a https://railway.app
2. Regístrate con GitHub (recomendado)
3. Verifica tu email

### 2.2 Instalar Railway CLI

**En Windows (PowerShell):**
```powershell
# Instalar con npm
npm install -g @railway/cli

# O descargar directamente
# https://railway.app/download
```

**En Mac/Linux:**
```bash
# Con npm
npm install -g @railway/cli

# O con Homebrew (Mac)
brew install railway

# O con script
curl -fsSL https://railway.app/install.sh | sh
```

### 2.3 Login en CLI
```bash
railway login
```

---

## PASO 3: Crear Proyecto y Desplegar

### 3.1 Inicializar proyecto
```bash
# Ir a la carpeta del proyecto
cd madsjeez-marketplace

# Inicializar proyecto en Railway
railway init

# Selecciona:
# - "Create a new project"
# - Nombre: madsjeez-marketplace
```

### 3.2 Configurar variables de entorno en Railway

**Opción A: Desde la web**
1. Ve a https://railway.app/dashboard
2. Selecciona tu proyecto
3. Ve a la pestaña "Variables"
4. Agrega todas las variables del archivo `.env.production`

**Opción B: Desde CLI**
```bash
# Agregar variables una por una
railway variables set NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY="(your anon key)"
# ... agregar todas las demás
```

### 3.3 Desplegar

```bash
# Desplegar desde la rama actual
railway up

# O especificar ambiente
railway up --environment production
```

**Railway automáticamente:**
- Detectará el Dockerfile
- Construirá la imagen
- Desplegará la aplicación
- Asignará una URL temporal

---

## PASO 4: Configurar Dominio Personalizado (DonWeb)

### 4.1 Obtener URL de Railway
Después del despliegue, Railway te dará una URL como:
`https://madsjeez-marketplace.up.railway.app`

### 4.2 Configurar dominio en Railway

**Desde la web:**
1. Ve a tu proyecto en https://railway.app
2. Selecciona el servicio (el contenedor)
3. Ve a "Settings" → "Domains"
4. Click en "Custom Domain"
5. Ingresa tu dominio: `tudominio.com`
6. Railway te dará un **CNAME target** (ej: `cname.railway.app`)

### 4.3 Configurar DNS en DonWeb

1. Inicia sesión en https://donweb.com
2. Ve a **"Mis Productos" → "Dominios"**
3. Selecciona tu dominio → **"Administrar DNS"**
4. Configura estos registros:

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| CNAME | @ | `cname.railway.app` | 3600 |
| CNAME | www | `cname.railway.app` | 3600 |

> **Nota:** Si DonWeb no permite CNAME en el root (@), usa estos registros A:
> 
> | Tipo | Nombre | Valor | TTL |
> |------|--------|-------|-----|
> | A | @ | IP_DE_RAILWAY | 3600 |
> | CNAME | www | tudominio.com | 3600 |

### 4.4 Verificar dominio en Railway
1. Vuelve a Railway → Settings → Domains
2. Click en "Check DNS"
3. Espera a que se verifique (puede tomar 5-30 minutos)

---

## PASO 5: Configurar SSL (Automático en Railway)

Railway **automáticamente** proporciona SSL para tu dominio personalizado.

Verifica:
1. Accede a `https://tudominio.com`
2. Debería mostrar el candado verde 🔒

---

## PASO 6: Configurar Supabase para Producción

### 6.1 Authentication URLs
En Supabase Dashboard:
1. Authentication → URL Configuration
2. **Site URL:** `https://tudominio.com`
3. **Redirect URLs:**
   - `https://tudominio.com/auth/callback`
   - `https://tudominio.com/dashboard`

### 6.2 CORS Configuration
1. Settings → API → CORS
2. Agrega:
   - `https://tudominio.com`
   - `https://www.tudominio.com`

### 6.3 Storage Policies
Asegúrate de que las políticas de storage permitan:
- Lectura pública para imágenes de productos
- Escritura solo para usuarios autenticados

---

## PASO 7: Configurar MercadoPago

### 7.1 Crear aplicación en MercadoPago
1. Ve a https://www.mercadopago.com.ar/developers
2. Crea una nueva aplicación
3. Obtén las credenciales de producción

### 7.2 Actualizar variables en Railway
```bash
railway variables set MERCADOPAGO_PUBLIC_KEY="your_mp_public_key"
railway variables set MERCADOPAGO_ACCESS_TOKEN="your_mp_access_token"
```

### 7.3 Configurar Webhooks
1. En MercadoPago Dashboard → Webhooks
2. URL: `https://tudominio.com/api/webhooks/mercadopago`
3. Events: `payment`, `merchant_order`

---

## PASO 8: Comandos Útiles de Railway

```bash
# Ver logs en tiempo real
railway logs

# Ver logs con follow
railway logs --follow

# Reiniciar servicio
railway restart

# Ver variables
railway variables

# Conectar a shell del contenedor
railway connect

# Ver estado
railway status

# Abrir proyecto en navegador
railway open
```

---

## Solución de Problemas

### Error: "Build failed"
```bash
# Ver logs detallados
railway logs --deployment

# Reconstruir
railway up --detach
```

### Error: "Domain not verified"
1. Verifica que los DNS estén propagados: https://dnschecker.org
2. Espera 24-48 horas si es necesario
3. Intenta remover y volver a agregar el dominio en Railway

### Error SSL
Railway maneja SSL automáticamente. Si hay problemas:
1. Remueve el dominio personalizado
2. Vuelve a agregarlo
3. Espera 5-10 minutos

### Error de variables de entorno
```bash
# Verificar que estén seteadas
railway variables

# Recargar el servicio después de cambiar variables
railway up
```

---

## Checklist Final

- [ ] Proyecto desplegado en Railway
- [ ] Variables de entorno configuradas
- [ ] Dominio apuntando a Railway (DNS)
- [ ] SSL funcionando (https://)
- [ ] Supabase URLs actualizadas
- [ ] MercadoPago configurado
- [ ] Login/registro funcionan
- [ ] Subida de imágenes funciona
- [ ] Pagos procesan correctamente

---

## Costos Estimados (Railway)

| Plan | Precio | Incluye |
|------|--------|---------|
| **Starter** | $5/mes | 512MB RAM, 1 CPU, 1GB disco |
| **Pro** | $10/mes | 1GB RAM, 1 CPU, 5GB disco |
| **Business** | $20/mes | 2GB RAM, 2 CPUs, 10GB disco |

> **Nota:** Railway tiene $5 de crédito gratis mensual para nuevos usuarios

---

## Soporte

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **DonWeb Soporte:** https://donweb.com/ayuda
