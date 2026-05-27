# 🛍️ Madsjeez Marketplace

> Marketplace completo idéntico a Mercado Libre, listo para producción

## 🚀 **Estado: PRODUCCIÓN ACTIVA** ✅

**🌐 Live Preview**: [GitHub Repository](https://github.com/soporte678/madsjeez)

---

## 📋 **Características Principales**

### 🎯 **Funcionalidades Completas**
- ✅ **Sistema de Publicación** - Formulario completo con upload de imágenes
- ✅ **Dashboard de Vendedor** - Gestión de publicaciones, compras y preguntas
- ✅ **ProductCards Estilo ML** - Badges, precios, cuotas y ratings
- ✅ **UI Responsiva** - Diseño exacto a Mercado Libre
- ✅ **Supabase Integration** - Base de datos y storage en tiempo real

### 🛠️ **Tecnología**
- **Frontend**: Next.js 16.2.4 + TypeScript
- **UI**: TailwindCSS + Radix UI + Lucide Icons
- **Backend**: Supabase (PostgreSQL + Storage)
- **Deploy**: Railway + GitHub Actions
- **Auth**: NextAuth.js

---

## 🎯 **Demo en Producción**

### 🏠 **Página Principal**
- Grid de productos con cards estilo Mercado Libre
- Banners promocionales dinámicos
- Búsqueda y categorías
- Badges de "Envío gratis" y descuentos

### 📊 **Dashboard de Vendedor**
- **Publicaciones**: Gestión completa de productos
- **Compras**: Historial y seguimiento
- **Preguntas**: Sistema Q&A con respuestas
- **Publicar**: Formulario completo con imágenes

### 🛍️ **Sistema de E-commerce**
- ProductCards con rating y ventas
- Precios con cuotas y financiación
- Información de vendedores
- Sistema de favoritos

---

## 🔧 **Configuración Rápida**

### 1. **Variables de Entorno**
```bash
# Copiar template
cp .env.example .env.local

# Configurar Supabase (valores reales solo en .env.local / hosting, nunca en el repo)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. **Instalación**
```bash
npm install
npx prisma generate
npm run dev
```

### 3. **Acceso Local**
- **Frontend**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard
- **Publicar**: http://localhost:3000/dashboard/publicar

---

## 🚀 **Deploy a Producción**

### Railway (Recomendado)
```bash
# Conectar a Railway
railway login
railway link

# Deploy automático con GitHub Actions
git push origin main
```

### Variables Railway
Configurar en Railway dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXTAUTH_URL=https://www.madsjeez.com.ar`
- `NEXTAUTH_SECRET`

---

## 📁 **Estructura del Proyecto**

```
src/
├── app/
│   ├── dashboard/
│   │   ├── publicaciones/    # Gestión de productos
│   │   ├── preguntas/        # Q&A system
│   │   └── publicar/         # Formulario publicación
│   ├── api/
│   │   └── products/         # API endpoints
│   └── page.tsx              # Home principal
├── components/
│   ├── ProductCard.tsx       # Card estilo ML
│   └── ui/                   # Componentes base
└── lib/
    └── supabase.ts          # Cliente Supabase
```

---

## 📚 **Documentación API (desarrolladores)**

- **Sitio en la app:** [https://tu-dominio/docs/api](https://www.madsjeez.com.ar/docs/api) (o `http://localhost:3000/docs/api` en local) — navegación lateral, tablas y búsqueda visual.
- **Markdown en repo:** [docs/api/README.md](docs/api/README.md) (mismo contenido; útil para PRs y revisiones).

---

## 🎯 **Funcionalidades de Mercado Libre**

### ✅ **Implementadas**
- ProductCards con badges y descuentos
- Sistema de rating y ventas
- Dashboard completo de vendedor
- Upload de imágenes a Supabase Storage
- Búsqueda y filtrado de productos
- UI responsiva exacta a ML

### 🔄 **En Progreso**
- Sistema de pagos (Stripe/MercadoPago)
- Notificaciones en tiempo real
- Chat interno de mensajes

---

## 🔐 **Seguridad**

- ✅ Autenticación con NextAuth.js
- ✅ Variables de entorno protegidas
- ✅ Validación de formularios
- ✅ CORS configurado
- ✅ Sanitización de datos

---

## 📊 **Métricas**

- 🎨 **UI Components**: 15+ componentes reutilizables
- 📱 **Responsive Design**: Mobile-first
- 🚀 **Performance**: Optimizado con Next.js
- 🔥 **Build Size**: Optimizado para producción
- 📦 **Dependencies**: Mínimas y actualizadas

---

## 🤝 **Contribuir**

1. Fork del repositorio
2. Crear feature branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Pull Request

---

## 📄 **Licencia**

MIT License - ver [LICENSE](LICENSE) para detalles

---

## 🎯 **Status del Proyecto**

- ✅ **MVP Completo** - Listo para producción
- ✅ **Deploy Automático** - GitHub Actions + Railway
- ✅ **Testing Local** - Funcional y estable
- ✅ **Documentación** - Completa y actualizada

---

**🚀 Madsjeez Marketplace v1.0 - Ready for Production!**

> *Marketplace completo idéntico a Mercado Libre con tecnología moderna y deploy automático*

<!-- Build trigger: 2026-05-28T07:56:30.853455 -->
