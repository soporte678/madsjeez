# Guía de Despliegue - MADSJEEZ Marketplace

## Requisitos Previos

- Dominio comprado en DonWeb (o cualquier proveedor)
- VPS o hosting con Node.js 20+
- Base de datos Supabase configurada
- Certificado SSL (Let's Encrypt recomendado)

---

## PASO 1: Configurar Variables de Entorno

Crea el archivo `.env.production` en `apps/web/`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# App
NEXT_PUBLIC_APP_URL=https://tudominio.com
NEXT_PUBLIC_APP_NAME=MADSJEEZ Marketplace

# Pagos (MercadoPago recomendado para Argentina)
MERCADOPAGO_PUBLIC_KEY=TEST-...
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_WEBHOOK_SECRET=tu-webhook-secret

# Email (SendGrid, Resend, etc.)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@tudominio.com

# Storage (Supabase Storage)
NEXT_PUBLIC_STORAGE_URL=https://tu-proyecto.supabase.co/storage/v1
```

---

## PASO 2: Configurar DNS en DonWeb

### 2.1 Acceder al Panel de DonWeb
1. Inicia sesión en https://donweb.com
2. Ve a "Mis Productos" > "Dominios"
3. Selecciona tu dominio
4. Haz clic en "Administrar DNS"

### 2.2 Configurar Registros DNS

**Opción A: Si tienes un VPS con IP fija**

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| A | @ | TU_IP_VPS | 3600 |
| A | www | TU_IP_VPS | 3600 |
| CNAME | * | tudominio.com | 3600 |

**Opción B: Si usas Vercel (recomendado para Next.js)**

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| A | @ | 76.76.21.21 | 3600 |
| CNAME | www | cname.vercel-dns.com | 3600 |

**Opción C: Si usas Netlify**

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| A | @ | 75.2.60.5 | 3600 |
| CNAME | www | tudominio.netlify.app | 3600 |

---

## PASO 3: Desplegar la Aplicación

### Opción A: VPS Propio (Ubuntu/Debian)

```bash
# 1. Conectar al VPS
ssh root@TU_IP_VPS

# 2. Instalar Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar PM2
sudo npm install -g pm2

# 4. Clonar el proyecto
git clone https://github.com/tu-usuario/madsjeez-marketplace.git
cd madsjeez-marketplace/apps/web

# 5. Instalar dependencias
npm install

# 6. Configurar variables de entorno
cp .env.example .env.production
nano .env.production  # Editar con tus valores

# 7. Build de producción
npm run build

# 8. Iniciar con PM2
pm2 start npm --name "madsjeez" -- start
pm2 save
pm2 startup

# 9. Configurar Nginx como reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/madsjeez
```

**Configuración Nginx:**

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/madsjeez /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 10. Instalar Certbot para SSL
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

---

### Opción B: Vercel (Recomendado - Más fácil)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Desplegar
cd apps/web
vercel --prod

# 4. Configurar dominio personalizado
vercel domains add tudominio.com
```

**Configurar en Dashboard de Vercel:**
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Settings > Domains
4. Add Domain: `tudominio.com`
5. Sigue las instrucciones de DNS

---

### Opción C: Netlify

```bash
# 1. Instalar Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Build
npm run build

# 4. Desplegar
netlify deploy --prod --dir=.next

# 5. Configurar dominio en Dashboard de Netlify
```

---

## PASO 4: Configurar Supabase para Producción

### 4.1 Configurar Authentication URL
En Supabase Dashboard:
1. Authentication > URL Configuration
2. Site URL: `https://tudominio.com`
3. Redirect URLs: `https://tudominio.com/auth/callback`

### 4.2 Configurar CORS
En Supabase Dashboard:
1. Settings > API > CORS
2. Agregar: `https://tudominio.com`

### 4.3 Configurar Storage (imágenes)
1. Storage > Policies
2. Crear políticas para lectura pública

---

## PASO 5: Configurar MercadoPago (Pagos)

### 5.1 Crear Cuenta de MercadoPago
1. Ir a https://www.mercadopago.com.ar/developers
2. Crear aplicación
3. Obtener credenciales de producción

### 5.2 Configurar Webhooks
1. En MercadoPago Dashboard
2. Webhooks > Crear webhook
3. URL: `https://tudominio.com/api/webhooks/mercadopago`
4. Events: `payment`, `merchant_order`

---

## PASO 6: Verificación Post-Despliegue

### Checklist:
- [ ] Dominio accesible vía HTTPS
- [ ] Redirección www → non-www funciona
- [ ] Login/registro funciona
- [ ] Subida de imágenes funciona
- [ ] Pasarela de pagos funciona
- [ ] Emails se envían correctamente
- [ ] SSL válido (https://www.sslchecker.com)

### Comandos útiles:
```bash
# Verificar DNS
dig tudominio.com

# Verificar SSL
curl -vI https://tudominio.com

# Ver logs
pm2 logs madsjeez

# Restart app
pm2 restart madsjeez
```

---

## Solución de Problemas Comunes

### Error: "This site can't be reached"
- Verificar que los DNS estén propagados (puede tomar 24-48h)
- Verificar firewall del VPS: `sudo ufw allow 80,443`

### Error SSL
- Verificar certificado: `sudo certbot certificates`
- Renovar: `sudo certbot renew --dry-run`

### Error 502 Bad Gateway
- Verificar que la app esté corriendo: `pm2 status`
- Verificar puerto: `netstat -tlnp | grep 3000`

---

## Soporte

Si tienes problemas:
1. Revisar logs: `pm2 logs`
2. Verificar configuración DNS: https://dnschecker.org
3. Contactar soporte de DonWeb para temas de DNS
