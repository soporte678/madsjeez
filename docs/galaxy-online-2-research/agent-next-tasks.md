# Tareas para Agentes - Next Steps

Lista de tareas listas para ejecutar por herramientas de desarrollo.

---

## Para Codex ( Windsurf )

### Tarea 1: Setup Proyecto Base
**Objetivo**: Crear estructura inicial del monorepo

**Archivos a crear**:
```
/
├── package.json (root)
├── turbo.json
├── packages/
│   ├── database/
│   │   ├── package.json
│   │   └── prisma/
│   │       └── schema.prisma
│   └── shared/
│       ├── package.json
│       └── src/
│           └── types/
├── apps/
│   ├── api/
│   │   ├── package.json
│   │   └── src/
│   │       └── index.ts
│   └── web/
│       ├── package.json
│       └── src/
│           └── app/
└── README.md
```

**Restricciones**:
- Usar TypeScript en todo
- Prisma para ORM
- Fastify para API
- Next.js 14 para web
- Turborepo para monorepo

**Verificación**:
```bash
cd apps/api && npm run dev # API corriendo
# Y en otra terminal:
cd apps/web && npm run dev # Next.js corriendo
```

---

### Tarea 2: Schema Prisma MVP
**Objetivo**: Crear schema de base de datos completo

**Archivo**: `packages/database/prisma/schema.prisma`

**Incluir**:
- Users (auth)
- Empires
- Resources
- Planets
- Buildings
- Technologies (seed)
- EmpireTechnologies
- Blueprints (seed)
- Ships
- Fleets
- FleetFormations
- Missions (seed)
- MissionRuns
- Battles
- BattleLosses
- ConstructionQueue

**Restricciones**:
- Todos los campos auditables (created_at, updated_at)
- Relaciones claras con FKs
- Índices para queries comunes
- Seed data en migrations o script separado

**Verificación**:
```bash
npx prisma migrate dev --name init
npx prisma db seed
npx prisma studio # Ver tablas y datos
```

---

### Tarea 3: Sistema de Recursos
**Objetivo**: Implementar producción pasiva de recursos

**Archivos**:
- `apps/api/src/services/resource.service.ts`
- `apps/api/src/jobs/resource.job.ts`
- `apps/api/src/routes/resources.routes.ts`

**Funcionalidad**:
- Calcular recursos desde last_update
- Aplicar producción por hora
- Aplicar capacidad máxima
- Descontar consumo de flotas
- Endpoint GET /api/resources

**Restricciones**:
- Usar Prisma
- Calcular en demanda (no guardar cada segundo)
- Transacciones para consistencia

**Verificación**:
```typescript
// Test esperado
const resources = await getResources(empireId);
// Esperar 1 minuto
const resources2 = await getResources(empireId);
assert(resources2.metal > resources.metal);
```

---

### Tarea 4: API Endpoints MVP
**Objetivo**: Crear todos los endpoints REST del MVP

**Archivos**: `apps/api/src/routes/*.routes.ts`

**Endpoints**:
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/empire
GET    /api/resources
GET    /api/planets/:id
POST   /api/planets/:id/build
POST   /api/planets/:id/upgrade
GET    /api/research
POST   /api/research/:id/start
GET    /api/shipyard/blueprints
POST   /api/shipyard/build
GET    /api/fleets
POST   /api/fleets
PUT    /api/fleets/:id
GET    /api/missions
POST   /api/missions/:id/start
GET    /api/battles
GET    /api/battles/:id
GET    /api/leaderboard
```

**Restricciones**:
- Validar input con Zod
- Auth JWT en rutas protegidas
- Rate limiting básico

**Verificación**: Colección Postman/Insomnia con todos los endpoints

---

## Para Cursor / Claude

### Tarea 5: UI Components Base
**Objetivo**: Crear componentes reutilizables

**Archivos**: `apps/web/src/components/`

**Componentes**:
```
ui/
├── Button.tsx          # Variants: primary, secondary, danger
├── Card.tsx            # Contenedor con estilos consistentes
├── Input.tsx           # Input con label y error
├── Select.tsx          # Dropdown con opciones
├── ResourceDisplay.tsx # Muestra recurso con ícono y cantidad
├── Timer.tsx           # Cuenta regresiva para construcción
├── ProgressBar.tsx     # Barra de progreso
├── Toast.tsx           # Notificaciones
└── Modal.tsx           # Modal/drawer genérico
```

**Restricciones**:
- Tailwind CSS
- shadcn/ui como base si aplica
- Props tipadas con TypeScript
- Responsive por defecto

**Verificación**:
```tsx
// Story o preview
<Button variant="primary" onClick={() => {}}>Construir</Button>
<ResourceDisplay type="metal" amount={1250} capacity={2000} />
<Timer endsAt={new Date(Date.now() + 300000)} />
```

---

### Tarea 6: Layouts y Navegación
**Objetivo**: Estructura de páginas y navegación

**Archivos**: `apps/web/src/app/`

**Estructura Next.js 14 (App Router)**:
```
app/
├── layout.tsx              # Root layout con header
├── page.tsx                # Landing / Login
├── dashboard/
│   └── page.tsx            # Dashboard del imperio
├── planet/
│   └── [id]/
│       └── page.tsx        # Vista de planeta
├── shipyard/
│   └── page.tsx            # Astillero
├── research/
│   └── page.tsx            # Investigación
├── fleets/
│   ├── page.tsx            # Lista de flotas
│   └── [id]/
│       └── page.tsx        # Detalle/editar flota
├── missions/
│   └── page.tsx            # Misiones PvE
├── battles/
│   └── [id]/
│       └── page.tsx        # Reporte de batalla
├── leaderboard/
│   └── page.tsx            # Ranking
└── admin/
    └── page.tsx            # Panel admin
```

**Restricciones**:
- Server Components por defecto
- Client Components solo donde necesite interacción
- Auth: redirigir a /login si no autenticado

**Verificación**: Navegar entre todas las páginas sin errores

---

### Tarea 7: Pantallas Core
**Objetivo**: Implementar UI de pantallas principales

**Dashboard**:
- Mostrar recursos actuales
- Producción por hora
- Accesos rápidos (planeta, misiones, astillero)
- XP y nivel

**Vista de Planeta**:
- Grid de 9 slots (3x3)
- Edificios construidos mostrados
- Slots vacíos con botón "Construir"
- Click en edificio → Modal mejorar

**Astillero**:
- Lista de naves desbloqueadas
- Stats: ATK, HP, DEF, Vel
- Costos: Metal, Plasma
- Formulario cantidad + botón Construir
- Cola de construcción visible

**Misiones**:
- Lista de 5 misiones
- Poder recomendado vs tu poder
- Estado: disponible/bloqueada
- Botón "Lanzar" → Seleccionar flota → Confirmar

**Restricciones**:
- Usar componentes creados en Tarea 5
- Fetch data con React Query / SWR
- Loading states
- Error handling

**Verificación**: Usuario puede completar flujo: login → dashboard → planeta → construir → astillero → misiones

---

### Tarea 8: Combat Simulator (Frontend + Backend)
**Objetivo**: Simulador determinístico de batallas

**Archivos**:
- `packages/shared/src/combat/simulator.ts` (shared code)
- `apps/api/src/services/combat.service.ts`
- `apps/api/src/jobs/combat.job.ts`

**Algoritmo MVP**:
```typescript
function simulateBattle(fleet, enemyFleet, seed) {
  // 1. Deterministic RNG con seed
  const rng = createSeededRandom(seed);
  
  // 2. Calcular iniciativa
  const attackerInitiative = fleet.ships.reduce((s, ship) => s + ship.speed, 0);
  const defenderInitiative = enemyFleet.ships.reduce((s, ship) => s + ship.speed, 0);
  
  // 3. Rondas hasta maxRounds o destrucción
  const rounds = [];
  for (let round = 1; round <= 20; round++) {
    // Cada nave ataca
    // Daño = ataque - defensa (mínimo 1)
    // RNG: ±10% variación
    // Aplicar daño, marcar destruidas
    
    rounds.push({ actions, attackerShips, defenderShips });
    
    if (allShipsDestroyed(attacker) || allShipsDestroyed(defender)) break;
  }
  
  return { winner, rounds, seed };
}
```

**Restricciones**:
- Determinístico: mismo seed = mismo resultado
- Simple: no skills, no comandantes
- Seed generado en servidor

**Verificación**:
```typescript
const result1 = simulateBattle(fleet, enemy, 'seed123');
const result2 = simulateBattle(fleet, enemy, 'seed123');
assert.deepEqual(result1, result2); // Determinístico
```

---

## Para Windsurf (Edición de Múltiples Archivos)

### Tarea 9: Mejorar Documentación Técnica
**Objetivo**: Profundizar y conectar documentos

**Archivos a tocar**:
- `combat-model.md` → Especificar fórmulas exactas MVP
- `data-model.md` → Agregar SQL completo con índices
- `game-systems.md` → Detallar sistemas mencionados
- `mvp.md` → Conectar con `mvp-spec-v0.md`

**Cambios específicos**:
```
combat-model.md:
+ Agregar sección "Fórmulas MVP v0" con valores exactos
+ Definir stats base para cada nave
+ Simplificar para no usar comandantes en MVP

data-model.md:
+ Agregar campo created_at / updated_at a todas las tablas
+ Definir estados posibles para enums
+ Agregar SQL de índices completos

game-systems.md:
+ Expandir sección PvE con olas concretas
+ Expandir economía con fórmulas
+ Expandir progresión con curva de XP
```

**Restricciones**:
- Mantener formato consistente
- No copiar de fuentes protegidas
- Usar términos del glosario

**Verificación**: Todos los documentos referencian el glosario y entre sí

---

### Tarea 10: Conectar con Repositorio Galaxy Online III
**Objetivo**: Sincronizar documentación entre repositorios

**Archivos**:
- `C:\Users\Mi Pc\Documents\Codex\GALAXY ONLINE III\docs\research\`

**Tareas**:
- [ ] Copiar todos los documentos actualizados
- [ ] Actualizar README del proyecto
- [ ] Crear estructura de carpetas para código

**Estructura a crear**:
```
GALAXY ONLINE III/
├── docs/
│   └── research/ (actualizado)
├── apps/
│   ├── api/
│   └── web/
├── packages/
│   ├── database/
│   └── shared/
└── README.md (actualizado)
```

**Restricciones**:
- Mantener docs/galaxy-online-2-research/ como fuente
- Sync unidireccional (desde windsurf hacia Codex)

**Verificación**: Estructura idéntica en ambos lugares

---

## Checklist de Coordinación

### Antes de empezar cualquier tarea
- [ ] Leer `glossary.md` para términos consistentes
- [ ] Verificar `legal-safety.md` para no cruzar líneas
- [ ] Revisar `mvp-spec-v0.md` para scope exacto

### Al terminar cada tarea
- [ ] Código compila sin errores TypeScript
- [ ] Tests básicos pasan (si hay)
- [ ] Documentación actualizada si aplica
- [ ] Commit con mensaje claro

### Orden de dependencias
```
Tarea 1 (Setup) → Tarea 2 (Schema) → Tarea 3 (Recursos)
     ↓                    ↓                  ↓
     ↓              Tarea 4 (API) ← Tarea 8 (Combat)
     ↓                    ↓
Tarea 5 (UI) → Tarea 6 (Layout) → Tarea 7 (Pantallas)
     ↑
Tarea 9 (Docs) → Tarea 10 (Sync)
```

---

## Prioridades

| Tarea | Herramienta | Prioridad | Bloquea |
|-------|-------------|-----------|---------|
| 1 - Setup | Codex | 🔴 Alta | Todo |
| 2 - Schema | Codex | 🔴 Alta | Todo |
| 3 - Recursos | Codex | 🔴 Alta | Edificios |
| 4 - API | Codex | 🔴 Alta | Pantallas |
| 8 - Combat | Cursor/Claude | 🔴 Alta | Misiones |
| 5 - UI | Cursor/Claude | 🟡 Media | Pantallas |
| 6 - Layout | Cursor/Claude | 🟡 Media | Pantallas |
| 7 - Pantallas | Cursor/Claude | 🟡 Media | MVP |
| 9 - Docs | Windsurf | 🟢 Baja | Nada |
| 10 - Sync | Windsurf | 🟢 Baja | Nada |

---

## Comandos Rápidos

### Setup inicial
```bash
# En GALAXY ONLINE III/
npm init -y
npm install -g turbo
npx create-turbo@latest . # Seleccionar pnpm/npm
```

### Database
```bash
cd packages/database
npx prisma init
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

### Dev
```bash
# Root
turbo dev

# O individual
cd apps/api && npm run dev
cd apps/web && npm run dev
```

---

*Documento de coordinación v1.0*
*Actualizar conforme se completen tareas*
