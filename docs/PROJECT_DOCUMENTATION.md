# MADSJEEZ Marketplace - Documentación del Proyecto

**Fecha de creación:** 24 de abril de 2026  
**Versión:** 1.0  
**Repositorio:** https://github.com/soporte678/madsjeez  
**Supabase Project:** https://supabase.com/dashboard/project/svbzmvmmzaqkepeysjyk

---

## 1. RESUMEN DEL PROYECTO

MADSJEEZ es un marketplace de comercio electrónico estilo MercadoLibre con las siguientes características:

- Publicaciones gratuitas ilimitadas
- Sistema de suscripciones (Plata/Gold/Platinum)
- Sistema de reputación por 5 colores
- Impulsos pagos para destacar publicaciones
- Mensajería en tiempo real
- API interna estilo MELI

---

## 2. STACK TECNOLÓGICO

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS + shadcn/ui |
| Base de datos | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Monorepo | Turborepo |

---

## 3. ESTRUCTURA DEL PROYECTO

```
madsjeez-marketplace/
├── apps/web/                    # Aplicación Next.js
│   ├── src/
│   │   ├── app/                 # Rutas y páginas
│   │   ├── components/          # Componentes React
│   │   ├── lib/supabase/        # Clientes SSR/Browser/Admin
│   │   └── types/               # Tipos TypeScript
│   └── .env.local               # Variables de entorno
├── packages/shared-types/       # Tipos compartidos
├── supabase/migrations/         # 4 archivos SQL
├── docs/legal/                  # Documentos legales
├── docs/api/                    # Referencia API (`/docs/api`) y checklist listo para producción
└── turbo.json                   # Configuración monorepo
```

---

## 4. CONFIGURACIÓN DE SUPABASE

### 4.1 Datos del Proyecto
- **URL:** (configurar en `.env.local` / hosting; no versionar claves reales)
- **Publishable Key:** (anon / publishable desde el dashboard de Supabase)
- **Service Role Key:** (solo servidor; nunca en el cliente ni en el repo)

### 4.2 Migraciones Ejecutadas

#### Migración 001: Initial Schema ✅
- Fecha: 24/04/2026
- Estado: Ejecutada exitosamente
- Tablas creadas:
  - profiles
  - categories
  - products
  - product_images
  - orders
  - order_items
  - subscription_tiers
  - subscriptions
  - reputation_scores
  - reviews
  - promoted_products
  - conversations
  - messages
  - payment_transactions
- Notas: Se corrigió error con NOW() en índices, se movió a aplicación directa en índices sin predicado temporal

#### Migración 002: RLS Policies ✅
- Fecha: 24/04/2026
- Estado: Ejecutada exitosamente
- Políticas implementadas:
  - Perfiles: lectura pública, actualización propia
  - Productos: lectura pública para activos, gestión propia para vendedores
  - Órdenes: visibilidad para participantes
  - Reviews: lectura pública, creación por compradores verificados
  - Mensajería: acceso para participantes de conversación

#### Migración 003: Functions y Triggers ✅
- Fecha: 24/04/2026
- Estado: Ejecutada exitosamente
- Funciones creadas:
  - calculate_reputation_color(): Calcula color según métricas
  - recalculate_seller_reputation(): Recalcula reputación completa
  - trigger_recalculate_on_order_complete(): Trigger para órdenes completadas
  - trigger_recalculate_on_review(): Trigger para nuevas reviews
  - decrement_product_stock(): Decrementa stock al vender
  - restore_product_stock(): Restaura stock al cancelar
  - update_conversation_on_message(): Actualiza conversación
  - update_product_promotion_status(): Actualiza estado de promoción

#### Migración 004: Seed Data ✅
- Fecha: 24/04/2026
- Estado: Ejecutada exitosamente
- Datos insertados:
  - 4 planes de suscripción (Free, Plata, Gold, Platinum)
  - 17 categorías principales
  - Subcategorías para Tecnología, Electrodomésticos, Hogar, Moda, Deportes
  - Configuraciones del sistema

### 4.3 Storage Buckets ✅
- **avatars**: Público, para fotos de perfil
- **product-images**: Público, para imágenes de productos

---

## 5. PLANES DE SUSCRIPCIÓN

| Plan | Precio ARS | Comisión | Características |
|------|------------|----------|-----------------|
| Gratis | $0 | 10% | 5 imágenes, soporte email (48-72h) |
| Plata | $9.999 | 5% | 10 imágenes, métricas básicas, soporte (24-48h) |
| Gold | $19.999 | 3% | 15 imágenes, métricas avanzadas, 2 impulsos/mes |
| Platinum | $49.999 | 1% | 20 imágenes, API, soporte 24/7, 5 impulsos/mes |

---

## 6. SISTEMA DE REPUTACIÓN

| Color | Condiciones | Impacto |
|-------|-------------|---------|
| 🔴 Rojo | >5% reclamos o >10% demoras | Mínima visibilidad, +100% costo impulsos |
| 🟠 Naranja | 3-5% reclamos o 5-10% demoras | Visibilidad reducida, +50% costo impulsos |
| 🟡 Amarillo | 1-3% reclamos o 2-5% demoras | Visibilidad normal |
| 🟢 Verde Claro | <1% reclamos y <2% demoras | Alta visibilidad, descuento 25% impulsos |
| 🟢 Verde Oscuro | <0.5% reclamos, <1% demoras, 50+ ventas | Máxima visibilidad, descuento 50% impulsos |

---

## 7. DOCUMENTACIÓN LEGAL

- ✅ Términos y Condiciones
- ✅ Política de Privacidad
- ✅ Política de Cookies
- ✅ Política de Reembolsos
- ✅ Acuerdo de Vendedor
- ✅ Condiciones de Suscripción

**Nota:** Son borradores estándar adaptados a Argentina, requieren revisión profesional.

---

## 8. VARIABLES DE ENTORNO

Archivo: `apps/web/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_PAYMENTS=false
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_PROMOTIONS=true
```

---

## 9. COMANDOS ÚTILES

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Lint
npm run lint
```

---

## 10. ERRORES CONOCIDOS Y SOLUCIONES

### Error: functions in index predicate must be marked IMMUTABLE
**Solución:** Se eliminaron los predicados con NOW() en los índices, se cambió a índices simples sin función temporal.

### Error: Property 'asChild' does not exist
**Solución:** Se removieron las props `asChild` de los componentes DropdownMenuTrigger, DropdownMenuItem, y SheetTrigger.

### Error: Spread types may only be created from object types
**Solución:** Se agregó tipo `any` explícito en los mapeos de productos.

---

## 11. PRÓXIMOS PASOS PENDIENTES

- [ ] Configurar autenticación OAuth (Google, Facebook)
- [ ] Implementar pasarela de pagos (Stripe/MercadoPago)
- [ ] Crear páginas de autenticación (login, registro)
- [ ] Implementar dashboard de vendedor
- [ ] Crear flujo de checkout
- [ ] Implementar mensajería realtime
- [ ] Desplegar en Vercel

---

## 12. CONTACTO Y SOPORTE

- Email: soporte@madsjeez.com
- Repositorio: https://github.com/soporte678/madsjeez

---

**© 2026 MADSJEEZ. Todos los derechos reservados.**
