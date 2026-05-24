# Plan de Reconstrucción - Stack Moderno

Arquitectura técnica propuesta para una versión moderna inspirada en GO2.

---

## Stack Tecnológico

### Frontend

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Framework** | Next.js 14+ (App Router) | SSR, API routes, optimizado |
| **Language** | TypeScript | Type safety, DX superior |
| **Styling** | Tailwind CSS | Utility-first, rápido, consistente |
| **UI Components** | shadcn/ui + Radix | Accessible, customizable |
| **State Management** | Zustand + React Query | Simple, performante, caching |
| **Charts** | Recharts / Tremor | Stats de combate, economía |
| **Icons** | Lucide React | Consistente, ligero |
| **Animations** | Framer Motion | UI fluida, transiciones |
| **3D (post-MVP)** | Three.js / React Three Fiber | Vista espacial opcional |

### Backend

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Runtime** | Node.js 20+ LTS | Ecosistema maduro |
| **Framework** | Fastify o Express | Fastify = performance, Express = familiaridad |
| **Language** | TypeScript | Compartir tipos con frontend |
| **API** | REST + WebSockets | REST para CRUD, WS para realtime (fase 2) |
| **Validation** | Zod | Schema validation shared FE/BE |
| **Auth** | JWT + Refresh tokens | Stateless, scalable |
| **Passwords** | Argon2 | Seguridad actual |

### Base de Datos

| Uso | Tecnología | Justificación |
|-----|------------|---------------|
| **Primary DB** | PostgreSQL 15+ | ACID, relaciones complejas, JSON support |
| **ORM** | Prisma | Type safety, migrations, DX |
| **Cache** | Redis | Sesiones, rate limiting, hot data |
| **Job Queue** | BullMQ (Redis) | Timers, procesamiento async |
| **Search (fase 2)** | Meilisearch | Búsqueda de jugadores, alianzas |
| **Analytics (fase 2)** | ClickHouse / BigQuery | Event tracking, métricas |

### Infraestructura

| Servicio | Proveedor | Uso |
|----------|-----------|-----|
| **Hosting** | Railway / Render / Fly.io | App server |
| **Database** | Supabase / Neon | PostgreSQL managed |
| **Redis** | Upstash / Railway | Cache + queues |
| **Storage** | Cloudflare R2 / AWS S3 | Assets, backups |
| **CDN** | Cloudflare | Static assets, caching |
| **Monitoring** | Sentry | Error tracking |
| **Analytics** | Plausible / Mixpanel | User analytics |
| **CI/CD** | GitHub Actions | Deploy automático |

---

## Arquitectura de Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Web App    │  │  Mobile Web  │  │   Desktop    │         │
│  │   (Next.js)  │  │  (PWA)       │  │   (Electron) │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          └────────────────┴────────────────┘
                           │
                   ┌───────▼────────┐
                   │   Cloudflare   │
                   │  CDN + WAF     │
                   └───────┬────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      API LAYER                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Next.js / Node.js                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │   │
│  │  │  Auth    │  │  Game    │  │  Admin   │         │   │
│  │  │  Routes  │  │  Routes  │  │  Routes  │         │   │
│  │  └──────────┘  └──────────┘  └──────────┘         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │   │
│  │  │ WebSocket│  │  Combat  │  │ Economy  │         │   │
│  │  │ Handler  │  │  Engine  │  │  Engine  │         │   │
│  │  └──────────┘  └──────────┘  └──────────┘         │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  PostgreSQL │ │    Redis    │ │  Job Workers│
    │  (Prisma)     │ │   (BullMQ)  │ │  (Node)     │
    └───────────────┘ └───────────────┘ └───────────────┘
```

### Microservicios (Fase 3+)

| Servicio | Responsabilidad | Tecnología |
|----------|-----------------|------------|
| **API Gateway** | Rate limiting, auth, routing | Kong / Nginx |
| **Combat Service** | Simulación de batallas | Node.js (CPU intensive) |
| **Notification Service** | Push, email, in-game | Node.js + Firebase |
| **Chat Service** | Mensajería alianza | Socket.io / custom WS |
| **Economy Service** | Transacciones, marketplace | Node.js (ACID critical) |

---

## Fases de Desarrollo

### Fase 1: MVP (Meses 1-3)

**Objetivo**: Core loop jugable

```
Features:
├── Auth (email/password)
├── 1 planeta, slots de edificios
├── 3 recursos (Metal, He3, Gold)
├── 3 tipos de naves (Fragata, Crucero, Acorazado)
├── Formación 2x2
├── 3 misiones PvE
├── Reporte de batalla básico
├── Sistema de XP simple
└── Leaderboard global
```

**Stack Fase 1**:
- Next.js (fullstack)
- PostgreSQL (Supabase)
- Redis (Upstash)
- Vercel / Railway

---

### Fase 2: Engagement (Meses 4-6)

**Objetivo**: Retención y progresión

```
Features:
├── Comandantes (stats básicos)
├── Módulos equipables (8 tipos básicos)
├── Árbol de investigación (4 ramas)
├── 10 misiones PvE (dificultad progresiva)
├── Sistema de "instancias" con olas
├── Notificaciones push
├── Daily rewards
├── Logros/achievements
└── WebSockets para tiempo real
```

**Stack Fase 2**:
- Separar API a Fastify standalone
- WebSocket server (Socket.io)
- Meilisearch para búsquedas
- Analytics (Mixpanel)

---

### Fase 3: Social (Meses 7-9)

**Objetivo**: Comunidad y competencia

```
Features:
├── Alianzas (crear, unirse, gestionar)
├── Chat de alianza
├── PvP asíncrono (atacar flotas estacionadas)
├── Sistema de espionaje
├── Guerra de alianzas (semanal)
├── Mercado entre jugadores (básico)
├── Múltiples planetas por imperio
├── Colonización
└── Sistema de trade routes
```

**Stack Fase 3**:
- Redis pub/sub para chat
- Job processors dedicados
- Sharding de datos por región
- CDN para assets globales

---

### Fase 4: Escalado (Meses 10-12)

**Objetivo**: Preparar para crecimiento

```
Features:
├── Eventos programados automáticamente
├── Pase de batalla (season pass)
├── Sistema de "cosméticos"
├── API pública (para streamers/devs)
├── Mobile app nativa (React Native)
├── Vista 3D del imperio (Three.js)
├── Sistema de "lore" y misiones narrativas
└── Localización (ES, EN, PT, DE)
```

**Stack Fase 4**:
- Microservicios (Kubernetes)
- GraphQL (Apollo Federation)
- Multi-region deploy
- Feature flags (LaunchDarkly)

---

## Sistema de Jobs/Colas

### Tipos de Jobs

```typescript
// 1. CONSTRUCTION_JOB
interface ConstructionJob {
  type: 'building_upgrade' | 'ship_construction' | 'research';
  empireId: string;
  targetId: string;
  startedAt: Date;
  duration: number; // seconds
  resourcesSpent: ResourceCost[];
}

// 2. FLEET_MOVEMENT_JOB
interface FleetMovementJob {
  type: 'fleet_arrival';
  fleetId: string;
  originPlanetId: string;
  targetPlanetId: string;
  missionType: MissionType;
  arrivalAt: Date;
}

// 3. COMBAT_JOB
interface CombatJob {
  type: 'pve_combat' | 'pvp_combat';
  attackerFleetId: string;
  defenderId: string; // fleet or planet
  instanceId?: string;
  executeAt: Date;
}

// 4. ECONOMY_JOB
interface EconomyJob {
  type: 'resource_tick' | 'he3_consumption' | 'salary_payment';
  empireId: string;
  interval: 'hourly' | 'daily';
}
```

### Procesamiento

```typescript
// Worker para jobs de construcción
queue.process('construction', async (job) => {
  const { empireId, buildingId } = job.data;
  
  await db.transaction(async (trx) => {
    // 1. Verificar recursos aún disponibles
    // 2. Aplicar upgrade a edificio
    // 3. Actualizar recursos del imperio (producción)
    // 4. Notificar usuario (WS push)
    // 5. Log evento analytics
  });
});

// Worker para combates
queue.process('combat', async (job) => {
  const simulator = new CombatSimulator();
  const result = simulator.run(job.data);
  
  await db.transaction(async (trx) => {
    // 1. Aplicar pérdidas de naves
    // 2. Otorgar experiencia
    // 3. Generar reporte de batalla
    // 4. Entregar loot/recompensas
    // 5. Notificar a ambos jugadores
  });
});
```

---

## Realtime (WebSockets)

### Eventos a transmitir

| Evento | Trigger | Payload |
|--------|---------|---------|
| `resource_update` | Cada tick de producción | `{ metal, he3, gold, rates }` |
| `construction_complete` | Job finished | `{ buildingId, newLevel }` |
| `battle_report` | Combate finalizado | `{ reportId, summary }` |
| `fleet_arrival` | Movimiento completado | `{ fleetId, location }` |
| `alliance_message` | Nuevo mensaje | `{ message, sender }` |
| `notification` | Evento importante | `{ type, title, body }` |

### Arquitectura WS

```
Cliente ──► WSS Server ──► Redis Pub/Sub ──► Otros Clientes
                │
                ▼
         Autenticación JWT
         Rooms por empireId
         Rate limiting
```

---

## Panel de Administración

### Features necesarias

- **User Management**: Buscar, banear, ver progreso
- **Economy**: Ajustar rates, ver transacciones sospechosas
- **Content**: Crear/editar misiones PvE, eventos
- **Analytics**: DAU, retención, revenue
- **Support**: Ver tickets, responder, compensar
- **Monitoring**: Health checks, logs, alerts

### Stack Admin

- Next.js separado o mismo proyecto con middleware
- Autentación propia (Admin JWT)
- RBAC (Role-Based Access Control)
- TanStack Table para datos
- Charts: Recharts/Tremor

---

## Mobile Strategy

### Fase 1: Responsive Web
- Tailwind breakpoints
- Touch-friendly UI
- PWA manifest
- Service worker básico

### Fase 2: PWA Optimizado
- Push notifications
- Offline cache para assets
- Add to home screen
- Background sync (offline progress)

### Fase 3: Native App (React Native)
- Shared logic con web (TypeScript)
- Native navigation
- Push notifications nativas
- App store deployment

---

## Consideraciones de Seguridad

```typescript
// 1. Rate Limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100 // requests per window
}));

// 2. Input Validation
const schema = z.object({
  fleetId: z.string().uuid(),
  missionId: z.string().uuid(),
  formation: formationSchema
});

// 3. Anti-Cheat
// - Re-simular batalla en servidor
// - Validar timestamps (no futuros)
// - Verificar posesión de recursos/naves
// - Rate limiting por empireId

// 4. SQL Injection Prevention
// - Uso exclusivo de Prisma/ORM
// - Nunca raw queries con concatenación

// 5. XSS Prevention
// - Input sanitization
// - CSP headers
// - React automatic escaping
```

---

## Costos Estimados (Mensuales)

| Servicio | Fase 1 (MVP) | Fase 2+ |
|----------|-------------|---------|
| Hosting (Vercel/Railway) | $20 | $100 |
| PostgreSQL (Supabase/Neon) | $0-25 | $100 |
| Redis (Upstash) | $0-20 | $80 |
| Storage (R2/S3) | $5 | $50 |
| CDN (Cloudflare) | $0 | $20 |
| Analytics (Plausible) | $10 | $10 |
| Monitoring (Sentry) | $0 | $26 |
| **Total** | **~$80/mes** | **~$400/mes** |

---

## Checklist de Arquitectura

- [ ] API REST documentada (OpenAPI/Swagger)
- [ ] Tests unitarios (core functions)
- [ ] Tests de integración (API)
- [ ] Migrations automáticas
- [ ] Backup automático diario
- [ ] CI/CD pipeline
- [ ] Environment separation (dev/staging/prod)
- [ ] Secrets management (no .env en repo)
- [ ] Logging estructurado
- [ ] Health check endpoints
- [ ] Graceful shutdown
- [ ] Database connection pooling
