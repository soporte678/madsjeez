<<<<<<< HEAD
# MADSJEEZ Marketplace

Un marketplace completo estilo MercadoLibre con publicaciones gratuitas, sistema de suscripciones (Plata/Gold/Platinum), reputación por colores, impulsos pagos y API propia.

## Características

- **Publicaciones gratuitas** ilimitadas para todos los vendedores
- **Sistema de suscripciones** con beneficios diferenciales:
  - Plata ($9.999/mes): Comisión 5%
  - Gold ($19.999/mes): Comisión 3%
  - Platinum ($49.999/mes): Comisión 1%
- **Sistema de reputación** por 5 colores (Rojo, Naranja, Amarillo, Verde Claro, Verde Oscuro)
- **Impulsos pagos** para destacar publicaciones
- **Mensajería en tiempo real** entre compradores y vendedores
- **API interna** estilo MercadoLibre
- **Documentación legal completa** (Términos, Privacidad, Cookies, Reembolsos, Vendedor, Suscripción)

## Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS + shadcn/ui
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Estado**: Zustand + TanStack Query
- **Monorepo**: Turborepo + npm workspaces

## Estructura del Proyecto

```
madsjeez-marketplace/
├── apps/
│   └── web/                 # Aplicación Next.js
│       ├── src/
│       │   ├── app/         # Rutas y páginas
│       │   ├── components/  # Componentes React
│       │   ├── lib/         # Utilidades y clientes
│       │   ├── types/       # Tipos TypeScript
│       │   └── hooks/       # Custom hooks
│       └── public/          # Archivos estáticos
├── packages/
│   └── shared-types/        # Tipos compartidos
├── supabase/
│   └── migrations/          # Migraciones SQL
├── docs/
│   └── legal/               # Documentos legales
└── turbo.json               # Configuración de Turborepo
```

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/madsjeez-marketplace.git
cd madsjeez-marketplace
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp apps/web/.env.example apps/web/.env.local
# Editar .env.local con tus credenciales
```

4. Ejecutar migraciones de Supabase:
```bash
# Usando Supabase CLI
supabase db push
```

5. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

## Configuración de Supabase

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Ejecutar las migraciones en orden:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_functions_triggers.sql`
   - `004_seed_data.sql`
3. Configurar autenticación (Email + OAuth)
4. Configurar Storage para imágenes

## Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo

# Construcción
npm run build        # Construir para producción

# Linting
npm run lint         # Ejecutar ESLint
```

## Sistema de Suscripciones

| Plan | Precio ARS | Comisión | Características principales |
|------|------------|----------|----------------------------|
| Gratis | $0 | 10% | Publicaciones ilimitadas, 5 imágenes |
| Plata | $9.999 | 5% | 10 imágenes, soporte email |
| Gold | $19.999 | 3% | 15 imágenes, métricas avanzadas, 2 impulsos/mes |
| Platinum | $49.999 | 1% | 20 imágenes, API, soporte 24/7, 5 impulsos/mes |

## Sistema de Reputación

| Color | Condiciones | Impacto |
|-------|-------------|---------|
| 🔴 Rojo | >5% reclamos o >10% demoras | Mínima visibilidad, +100% costo impulsos |
| 🟠 Naranja | 3-5% reclamos o 5-10% demoras | Visibilidad reducida, +50% costo impulsos |
| 🟡 Amarillo | 1-3% reclamos o 2-5% demoras | Visibilidad normal |
| 🟢 Verde Claro | <1% reclamos y <2% demoras | Alta visibilidad, descuento 25% impulsos |
| 🟢 Verde Oscuro | <0.5% reclamos, <1% demoras, 50+ ventas | Máxima visibilidad, descuento 50% impulsos |

## Documentos Legales

- [Términos y Condiciones](docs/legal/terminos-y-condiciones.md)
- [Política de Privacidad](docs/legal/politica-privacidad.md)
- [Política de Cookies](docs/legal/politica-cookies.md)
- [Política de Reembolsos](docs/legal/politica-reembolsos.md)
- [Acuerdo de Vendedor](docs/legal/acuerdo-vendedor.md)
- [Condiciones de Suscripción](docs/legal/condiciones-suscripcion.md)

> **Nota**: Estos documentos son borradores estándar adaptados al marco legal argentino y requieren revisión profesional antes de su publicación oficial.

## Contribuir

1. Fork del repositorio
2. Crear una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

Este proyecto es propiedad de MADSJEEZ. Todos los derechos reservados.

## Contacto

- Email: contacto@madsjeez.com
- Sitio web: https://madsjeez.com

---

**© 2026 MADSJEEZ. Todos los derechos reservados.**
=======
# MadsJeez - Marketplace

Marketplace completo con sistema de suscripciones, reputación y publicidad.

## Configuración DNS para Railway + Supabase

### 1. Configurar DNS en NIC.AR

Accede a [NIC.AR](https://nic.ar) con tu cuenta y modifica los DNS:

**Opción A: Usar los DNS de Railway (Recomendado)**
```
Tipo: CNAME
Nombre: www
Valor: [tu-app].up.railway.app
TTL: 3600
```

**Opción B: DNS personalizados**
```
Tipo: A
Nombre: @
Valor: [IP-de-Railway]
TTL: 3600

Tipo: CNAME
Nombre: www
Valor: madsjeez.com.ar
TTL: 3600
```

### 2. Configurar en Railway Dashboard

1. Ve a [railway.app](https://railway.app)
2. Selecciona tu proyecto
3. Settings > Domains
4. Agrega: `madsjeez.com.ar`
5. Agrega: `www.madsjeez.com.ar`

### 3. Variables de Entorno en Railway

```
DATABASE_URL=postgresql://postgres.svbzmvmmzaqkepeysjyk:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.svbzmvmmzaqkepeysjyk:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
NEXTAUTH_URL=https://madsjeez.com.ar
NEXTAUTH_SECRET=madsjeez-secret-2024
NEXT_PUBLIC_SUPABASE_URL=https://svbzmvmmzaqkepeysjyk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE-KEY]
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NEXT_PUBLIC_APP_NAME=MadsJeez
NEXT_PUBLIC_APP_URL=https://madsjeez.com.ar
```

### 4. Configurar Supabase Auth

En Supabase Dashboard:
- Authentication > URL Configuration
- Site URL: `https://madsjeez.com.ar`
- Redirect URLs: `https://madsjeez.com.ar/auth/callback`

## Deploy

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login y deploy
railway login
railway link
railway up
```

## Características

- ✅ Sistema de suscripciones (Plata, Gold, Platinum)
- ✅ Sistema de reputación con colores
- ✅ Programa de impulso/publicidad
- ✅ Dashboard de vendedor con métricas
- ✅ Pasarela de pagos Stripe
- ✅ Documentos legales (Términos, Privacidad)

## Estructura

- `/src/app` - Next.js App Router
- `/src/components` - Componentes React
- `/src/lib` - Utilidades
- `/prisma` - Base de datos

## Comandos

```bash
npm run dev      # Desarrollo
npm run build    # Build
npx prisma migrate dev  # Migraciones
railway up       # Deploy
```
>>>>>>> f4d3b74 (Initial commit: MadsJeez marketplace with subscriptions, reputation system, and legal docs)
