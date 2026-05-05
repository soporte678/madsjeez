# Despliegue en Railway vía GitHub (Alternativa sin CLI)

## Opción Recomendada: GitHub + Railway

Si el Railway CLI da problemas, esta es la forma más fácil y confiable.

---

## PASO 1: Subir código a GitHub

### 1.1 Crear repositorio en GitHub
1. Ve a https://github.com/new
2. Nombre: `madsjeez-marketplace`
3. Público o Privado (como prefieras)
4. NO inicialices con README (ya lo tenemos)

### 1.2 Subir código desde tu PC

Abre PowerShell en la carpeta del proyecto:

```powershell
# Ir al directorio del proyecto
cd "C:\Users\Mi Pc\Downloads\LINEAGE 2 - JEEZ\.worktrees\kimi-k2.6-1777041882296\madsjeez-marketplace"

# Inicializar git (si no está inicializado)
git init

# Agregar todos los archivos
git add .

# Crear commit
git commit -m "Initial commit - MADSJEEZ Marketplace"

# Conectar con GitHub (reemplaza TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/madsjeez-marketplace.git

# Subir código
git push -u origin master
```

---

## PASO 2: Conectar Railway con GitHub

### 2.1 Crear cuenta en Railway
1. Ve a https://railway.app
2. Click en "Login"
3. Selecciona "Continue with GitHub"
4. Autoriza a Railway a acceder a tus repositorios

### 2.2 Crear nuevo proyecto
1. En el Dashboard de Railway, click en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Busca y selecciona: `madsjeez-marketplace`
4. Click en "Add Variables"

### 2.3 Configurar Variables de Entorno

En Railway Dashboard:
1. Ve a tu proyecto
2. Click en "Variables" (pestaña)
3. Agrega cada variable:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=(set in GitHub/Railway secrets — never commit)
SUPABASE_SERVICE_ROLE_KEY=(set in GitHub/Railway secrets — never commit)
NEXT_PUBLIC_APP_URL=https://tudominio.com
```

### 2.4 Configurar Build

Railway detectará automáticamente el `Dockerfile` y hará el build.

Si no funciona automáticamente:
1. Ve a Settings
2. En "Root Directory" deja vacío (o pon `apps/web` si solo quieres esa carpeta)
3. El Dockerfile debe estar en la raíz

### 2.5 Deploy

1. Click en "Deploy"
2. Railway construirá y desplegará automáticamente
3. Obtendrás una URL como: `https://madsjeez-marketplace.up.railway.app`

---

## PASO 3: Configurar Dominio Personalizado

### 3.1 En Railway Dashboard
1. Ve a tu proyecto
2. Selecciona el servicio (el contenedor)
3. Ve a "Settings" → "Domains"
4. Click en "Custom Domain"
5. Ingresa: `tudominio.com`
6. Copia el valor del CNAME (ej: `cname.railway.app`)

### 3.2 En DonWeb (DNS)
1. Inicia sesión en https://donweb.com
2. Ve a "Mis Productos" → "Dominios"
3. Selecciona tu dominio → "Administrar DNS"
4. Agrega estos registros:

| Tipo | Nombre | Valor | TTL |
|------|--------|-------|-----|
| CNAME | @ | `cname.railway.app` | 3600 |
| CNAME | www | `cname.railway.app` | 3600 |

> **Nota:** Reemplaza `cname.railway.app` con el valor que te dio Railway

### 3.3 Verificar en Railway
1. Vuelve a Railway
2. Click en "Check DNS"
3. Espera 5-30 minutos a que se propague

---

## PASO 4: Configurar Supabase

### 4.1 URLs de Autenticación
En Supabase Dashboard:
1. Authentication → URL Configuration
2. Site URL: `https://tudominio.com`
3. Redirect URLs:
   - `https://tudominio.com/auth/callback`
   - `https://tudominio.com/dashboard`

### 4.2 CORS
1. Settings → API → CORS
2. Agrega: `https://tudominio.com`

---

## Actualizaciones Automáticas

Con esta configuración, cada vez que hagas `git push` a GitHub:
1. Railway detectará el cambio
2. Reconstruirá automáticamente
3. Desplegará la nueva versión

---

## Comandos Git Útiles

```powershell
# Ver estado
git status

# Agregar cambios
git add .

# Commit
git commit -m "Descripción de cambios"

# Subir a GitHub (dispara deploy en Railway)
git push

# Ver historial
git log --oneline
```

---

## Solución de Problemas

### "No se reconoce git"
Descarga Git desde: https://git-scm.com/download/win

### Error al hacer push
```powershell
# Si pide credenciales, configura:
git config --global user.email "tu@email.com"
git config --global user.name "Tu Nombre"
```

### Railway no detecta el Dockerfile
Asegúrate de que `Dockerfile` esté en la raíz del repositorio (no en subcarpetas).

---

## Resumen Visual

```
Tu PC → GitHub → Railway → DonWeb DNS → Usuarios
   ↑        ↓         ↓          ↓
   └────────┴─────────┴──────────┘
      (Deploy automático)
```

---

## ¿Necesitas ayuda?

- **Railway Docs:** https://docs.railway.app
- **GitHub Docs:** https://docs.github.com/es
- **DonWeb Soporte:** https://donweb.com/ayuda
