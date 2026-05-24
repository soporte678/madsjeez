# Roadmap de Implementación - MVP

Plan semana a semana para desarrollar el MVP en 8 semanas.

---

## Semana 1: Schema + Seed + Recursos

### Objetivo
Base de datos funcionando con datos iniciales y sistema de recursos.

### Tareas
- [ ] Setup proyecto monorepo (opcional) o estructura clara
- [ ] Configurar PostgreSQL local + Prisma
- [ ] Crear schema Prisma con tablas MVP
- [ ] Crear seed data: tecnologías, naves, misiones
- [ ] Implementar sistema de recursos (producción pasiva)
- [ ] Endpoint: GET /api/empire/resources
- [ ] Job básico para recalcular recursos

### Entregables
```
✅ DB migrada y seeded
✅ API devuelve recursos calculados
✅ Recursos aumentan con el tiempo
```

### Stack
- PostgreSQL + Prisma
- Node.js + Fastify

---

## Semana 2: Edificios + Investigación

### Objetivo
Jugador puede construir y mejorar edificios, investigar tecnologías.

### Tareas
- [ ] CRUD de edificios (construir, mejorar)
- [ ] Sistema de timers/jobs para construcción
- [ ] Cola de construcción (1 a la vez inicialmente)
- [ ] Árbol de investigación (4 techs)
- [ ] Sistema de timers para investigación
- [ ] Desbloqueo de naves por tecnología
- [ ] UI: Vista de planeta con edificios
- [ ] UI: Pantalla de investigación

### Entregables
```
✅ Construir Centro de Comando → aumenta slots
✅ Construir Mina → aumenta producción metal
✅ Investigar Propulsión → desbloquea Cruceros
✅ Timers visibles en UI
```

### Nuevas Tablas
- buildings
- technologies (seed)
- empire_technologies

---

## Semana 3: Naves + Astillero

### Objetivo
Jugador puede construir 3 tipos de naves en astillero.

### Tareas
- [ ] Seed de blueprints (Fragata, Crucero, Acorazado)
- [ ] Sistema de construcción de naves con cola
- [ ] 5 slots de cola paralelos
- [ ] Cancelación con reembolso 50%
- [ ] Naves aparecen en inventario
- [ ] UI: Astillero con stats de naves
- [ ] UI: Cola de construcción visible

### Entregables
```
✅ Construir 50 fragatas (toma tiempo)
✅ Ver fragatas en inventario
✅ Cancelar construcción (reembolso parcial)
✅ Cruceros/Acorazados desbloqueados por tech
```

### Nuevas Tablas
- blueprints (seed)
- ships
- construction_queue (compartido con edificios)

---

## Semana 4: Flotas + Misiones

### Objetivo
Jugador crea flotas y envía a misiones PvE.

### Tareas
- [ ] Crear flota (nombre, seleccionar naves)
- [ ] Editor de formación 2x2
- [ ] Calcular poder de flota
- [ ] Seed de 5 misiones PvE
- [ ] Enviar flota a misión
- [ ] Consumir plasma de viaje
- [ ] Marcar flota como "en misión"

### Entregables
```
✅ Flota "Alfa" con 50 fragatas
✅ Formación: 2 slots frontales con naves
✅ Enviar a misión (con check de poder)
✅ Flota aparece como "en misión"
```

### Nuevas Tablas
- fleets
- fleet_formations
- missions (seed)
- mission_runs

---

## Semana 5: Combate PvE Async

### Objetivo
Resolver batallas automáticamente, aplicar resultados.

### Tareas
- [ ] Implementar simulador de combate (v0 simple)
- [ ] Fórmula de daño básica
- [ ] Generar naves enemigas por misión
- [ ] Resolver batalla ronda por ronda
- [ ] Aplicar pérdidas a flota del jugador
- [ ] Destruir naves perdidas
- [ ] Marcar misión como completada/fallida

### Entregables
```
✅ Batalla resuelve en 1-2 segundos
✅ Naves destruidas se eliminan de flota
✅ Sistema por turnos básico
✅ Victoria si enemigo destruido
```

### Nuevo Código
- CombatSimulator (TypeScript)
- EnemyFleetGenerator
- BattleResolver job

---

## Semana 6: Reportes + Ranking

### Objetivo
Jugador ve qué pasó en batalla y compite en ranking.

### Tareas
- [ ] Guardar reporte detallado (rondas, acciones)
- [ ] UI: Vista de reporte con resumen
- [ ] UI: Timeline de rondas (expandible)
- [ ] Otorgar XP por victoria
- [ ] Otorgar créditos por victoria
- [ ] Calcular y guardar XP del imperio
- [ ] Sistema de niveles (1-10 para MVP)
- [ ] API: Leaderboard global
- [ ] UI: Tabla de ranking con posición propia

### Entregables
```
✅ Reporte muestra "Victoria en 4 rondas"
✅ XP sube, nivel aumenta
✅ Leaderboard muestra top 100
✅ Jugador ve su posición
```

### Nuevas Tablas
- battles (reportes)
- battle_losses

---

## Semana 7: UI Polish + UX

### Objetivo
Juego es usable, feedback claro, sin bugs críticos.

### Tareas
- [ ] Loading states en todas las pantallas
- [ ] Toast notifications (éxito/error)
- [ ] Validaciones de formularios
- [ ] Mobile responsive básico
- [ ] Animaciones simples (Framer Motion)
- [ ] Tutorial básico (tooltips)
- [ ] Manejo de errores (API caída, etc.)
- [ ] Feedback visual de recursos produciendo

### Entregables
```
✅ No hay botones que parecen muertos
✅ Errores muestran mensaje claro
✅ Funciona en móvil (no perfecto, usable)
✅ Usuario entiende qué hacer (onboarding básico)
```

### Stack
- Framer Motion
- React Hot Toast / Sonner

---

## Semana 8: Admin + Balance + Deploy

### Objetivo
Panel admin básico, balance inicial, deploy a producción.

### Tareas
- [ ] Auth de admin (role-based)
- [ ] UI Admin: Lista de usuarios
- [ ] UI Admin: Ver progreso de usuario
- [ ] UI Admin: Banear/Desbanear
- [ ] UI Admin: Stats globales
- [ ] Balancear números (costos, recompensas)
- [ ] Testing manual de core loop
- [ ] Deploy a Railway/Render
- [ ] Setup básico de monitoreo (Sentry)
- [ ] README de deploy

### Entregables
```
✅ Admin puede ver usuarios
✅ Juego deployado y accesible
✅ Core loop validado: login → construir → mision → reporte
✅ Sentry reportando errores
```

### Nuevo
- Middleware de auth admin
- Panel admin simple
- CI/CD básico

---

## Calendario Visual

```
        Semana 1    Semana 2    Semana 3    Semana 4
        ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
Lunes   │Schema  │  │Edificios│  │Blueprints│  │Flotas  │
        │+ Seed  │  │CRUD    │  │Stats   │  │Create  │
        └────────┘  └────────┘  └────────┘  └────────┘

        Semana 5    Semana 6    Semana 7    Semana 8
        ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
Lunes   │Combat  │  │Reportes│  │UI      │  │Admin   │
        │Engine  │  │+ XP    │  │Polish  │  │+ Deploy│
        └────────┘  └────────┘  └────────┘  └────────┘
```

---

## Hitos de Validación

### Semana 2
> "Puedo construir edificios y ver recursos subir"

### Semana 4
> "Puedo crear flota y enviarla a misión"

### Semana 6
> "Puedo completar misión, ganar XP, ver ranking"

### Semana 8
> "Juego está online y amigo puede jugar"

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Simulador de combate muy complejo | Media | Alto | Simplificar a turnos básicos, no skills |
| Timers/jobs no funcionan bien | Baja | Alto | Usar BullMQ probado, testear jobs |
| UI toma más tiempo | Alta | Medio | Scope UI mínima, Tailwind + componentes listos |
| Balance de números mal | Media | Medio | Testear con usuarios, ajustar iterativamente |
| Deploy falla | Baja | Alto | Probar deploy en semana 6, no esperar al final |

---

## Post-MVP: Fase 2 (Meses 3-4)

- Comandantes (stats básicos)
- Módulos equipables simples
- Alianzas (crear/unirse, chat básico)
- PvP asíncrono (atacar flotas estacionadas)
- Mercado básico (NPC primero)

---

## Recursos Necesarios

### Tiempo
- **2 desarrolladores full-time**: 8 semanas
- **1 desarrollador solo**: 16 semanas

### Infraestructura (estimado)
- Desarrollo: $0 (local)
- Producción: ~$50-80/mes (ver mvp.md)

### Assets
- Iconos: Lucide (gratis)
- UI: Tailwind + shadcn (gratis)
- Sonido: Generar con sfxr (gratis)
- Arte: Placeholders o contratar post-MVP

---

## Métricas de Éxito por Semana

| Semana | Métrica | Objetivo |
|--------|---------|----------|
| 2 | DB migrations exitosas | 100% |
| 4 | Flota creada sin errores | 95% flujos |
| 6 | XP ganado en batalla | Funciona |
| 8 | Usuario puede completar tutorial | 70%+ sin abandono |

---

*Roadmap v1.0 - Mayo 2026*  
*Ajustar según velocidad real de desarrollo*
