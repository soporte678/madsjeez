# MVP v0 - Especificación Técnica

Documento de especificación exacta para el MVP jugable.

---

## Visión del MVP

Un juego de estrategia espacial con:
- 1 planeta por jugador
- 3 tipos de naves
- 5 misiones PvE
- Combates asíncronos automáticos
- Progresión simple por XP

**No incluye**: PvP, alianzas, comandantes, módulos, mercado, múltiples planetas.

---

## Pantallas/UI

### 1. Login
```
Ruta: /login
Componentes:
- Form email/password
- Link "Crear cuenta" → /register
- Link "Recuperar contraseña"

Validaciones:
- Email formato válido
- Password mínimo 8 caracteres
- Mensaje error: credenciales inválidas
```

### 2. Register
```
Ruta: /register
Campos:
- Email (único)
- Password
- Username (visible, único, 3-20 chars)
- Nombre del Imperio (3-30 chars)

Validaciones:
- Email no registrado
- Username disponible
- Aceptar TOS checkbox

Post-registro:
- Crear imperio con planeta inicial
- Seed con edificios básicos nivel 1
- Redirigir a /dashboard
```

### 3. Dashboard del Imperio
```
Ruta: /dashboard
Layout:
┌─────────────────────────────────────┐
│  Header: Recursos (Metal/Plasma/Credits) + Nivel  │
├─────────────────────────────────────┤
│                                     │
│  Planeta Principal (visual)         │
│  - Slots de edificios visibles      │
│  - Recursos produciendo             │
│                                     │
├─────────────────────────────────────┤
│  Acciones Rápidas:                  │
│  [Ver Planeta] [Astillero] [Misiones]│
│  [Investigación] [Ranking]            │
└─────────────────────────────────────┘

Datos:
- Recursos actuales (calculados desde último update)
- Producción por hora
- XP actual / XP para siguiente nivel
- Flotas activas (resumen)
```

### 4. Vista de Planeta
```
Ruta: /planet/:id
Layout:
- Grid de edificios (slots disponibles/ocupados)
- Información de recursos del planeta
- Cola de construcción (si hay)

Slots: 9 slots (3x3 grid)
Inicial: 5 slots ocupados con:
  - Centro de Comando N1
  - Mina de Metal N1
  - Extractor de Plasma N1
  - Astillero N1
  - Laboratorio N1

Acciones:
- Click slot vacío → Lista de edificios construibles
- Click edificio existente → Info + Mejorar
```

### 5. Recursos
```
Ruta: /resources (o modal)
Muestra:
- Metal: cantidad / capacidad / producción por hora
- Plasma: cantidad / capacidad / producción por hora
- Créditos: cantidad (no capacidad máxima)

Cálculo:
```typescript
// Cada vez que se carga la pantalla
const offlineProgress = (now - lastUpdate) / 3600 * productionPerHour;
const currentAmount = Math.min(storedAmount + offlineProgress, capacity);
```
```

### 6. Edificios - Construir/Mejorar
```
Ruta: /planet/:id/build
Modal/Drawer:

Lista de Edificios Disponibles:
┌────────────────────────────────────┐
│ Centro de Comando Lv.2            │
│ Costo: 500 Metal, 200 Plasma      │
│ Tiempo: 5 minutos                  │
│ Bonus: +2 slots, +10% producción  │
│ [Construir]                        │
├────────────────────────────────────┤
│ Mina de Metal Lv.2                │
│ Costo: 300 Metal, 100 Plasma      │
│ Tiempo: 3 minutos                  │
│ Bonus: +50 metal/hora            │
│ [Construir]                        │
└────────────────────────────────────┘

Proceso:
1. Verificar recursos disponibles
2. Descontar recursos
3. Crear job con timestamp end
4. Mostrar timer en UI
5. Al completar: actualizar edificio, recalcular producción
```

### 7. Investigación
```
Ruta: /research
Layout:
Árbol simple (lista para MVP):

┌────────────────────────────────────┐
│ TECNOLOGÍAS DISPONIBLES           │
├────────────────────────────────────┤
│ ✓ Minería Básica (completada)     │
│   → +10% producción metal          │
├────────────────────────────────────┤
│ ⏳ Propulsión (en progreso)        │
│   Tiempo restante: 04:32           │
│   → Desbloquea: Crucero           │
├────────────────────────────────────┤
│ ⚪ Escudos Defensivos              │
│   Requiere: Propulsión             │
│   Costo: 800 Metal, 400 Plasma    │
│   → Desbloquea: Acorazado        │
└────────────────────────────────────┘

Tecnologías MVP:
1. Minería Básica (desbloqueada inicial) - bonus metal
2. Propulsión (Nivel Imperio 2) - desbloquea Crucero
3. Escudos (Nivel Imperio 3) - desbloquea Acorazado
4. Economía (Nivel Imperio 4) - bonus créditos
5. Avanzada (Nivel Imperio 5) - +1 flota
```

### 8. Astillero
```
Ruta: /shipyard
Layout:
┌────────────────────────────────────┐
│ TIPOS DE NAVES DESBLOQUEADAS      │
├────────────────────────────────────┤
│ FRAGATA                            │
│ Stats: ATK 10, HP 50, DEF 5       │
│ Costo: 50 Metal, 20 Plasma        │
│ Tiempo: 30 segundos               │
│ Cantidad: [___] [Construir]       │
├────────────────────────────────────┤
│ CRUCERO (🔒 Requiere: Propulsión) │
│ Stats: ATK 25, HP 120, DEF 12     │
│ Costo: 150 Metal, 60 Plasma       │
│ Tiempo: 2 minutos                 │
└────────────────────────────────────┘

Cola de Construcción:
- Máximo 5 slots en cola
- Procesa en paralelo (no secuencial)
- Cancelable (reembolso 50%)

Stats MVP:
| Tipo | Metal | Plasma | ATK | HP | DEF | Vel |
|------|-------|--------|-----|----|---- |-----|
| Fragata | 50 | 20 | 10 | 50 | 5 | 20 |
| Crucero | 150 | 60 | 25 | 120 | 12 | 12 |
| Acorazado | 400 | 150 | 40 | 300 | 25 | 6 |
```

### 9. Flotas
```
Ruta: /fleets
Layout:
Lista de flotas:
┌────────────────────────────────────┐
│ Flota Alfa                         │
│ Naves: 50 Fragatas                 │
│ Poder: 500                         │
│ Estado: Disponible                 │
│ [Editar] [Desplegar]               │
├────────────────────────────────────┤
│ Flota Beta                         │
│ Naves: 20 Cruceros                 │
│ Poder: 600                         │
│ Estado: En misión (vuelve en 5min)│
└────────────────────────────────────┘

Crear Flota:
- Nombre libre
- Seleccionar naves disponibles (no en otras flotas)
- Formación: 2x2 grid (simplificado de 4x4)
- Slots: 4 posiciones (0,1,2,3)

Límites MVP:
- Máximo 2 flotas simultáneas
- Máximo 100 naves por flota
```

### 10. Editor de Formación (2x2)
```
Ruta: /fleets/:id/formation

Grid 2x2:
┌─────────┬─────────┐
│ Slot 0  │ Slot 1  │
│ [50x    │ Vacío   │
│ Frig]   │         │
├─────────┼─────────┤
│ Slot 2  │ Slot 3  │
│ [20x    │ Vacío   │
│ Cruc]   │         │
└─────────┴─────────┘

Drag & Drop para asignar naves
Auto-guardar cambios

Poder calculado: Σ(ATK + HP/2 + DEF*2) * cantidad
```

### 11. Misiones PvE
```
Ruta: /missions
Layout:
5 Misiones disponibles:

┌────────────────────────────────────┐
│ 🟢 SECTOR PERIFÉRICO (Nivel 1)     │
│ Poder recomendado: 300             │
│ Recompensa: 100 XP, 50 Créditos   │
│ Tu poder: 450 ✅                   │
│ [Lanzar Flota]                     │
├────────────────────────────────────┤
│ 🟡 CINTURÓN DE ASTEROIDES (Nv 2)   │
│ Poder recomendado: 600             │
│ Recompensa: 250 XP, 100 Créditos   │
│ Tu poder: 450 ❌ (débil)           │
│ [Lanzar Flota] (advertencia)       │
├────────────────────────────────────┤
│ 🟠 NEBULOSA TÓXICA (Nv 3)          │
│ 🟠 CAMPO DE DERIVA (Nv 4)         │
│ 🔴 ESTACIÓN ABANDONADA (Nv 5)      │
└────────────────────────────────────┘

Proceso:
1. Seleccionar misión
2. Seleccionar flota disponible
3. Confirmar (consume plasma de viaje)
4. Batalla resuelve async (5-10 segundos)
5. Redirigir a reporte
```

### 12. Reporte de Batalla
```
Ruta: /battle-report/:id

Resumen:
┌────────────────────────────────────┐
│ 🏆 VICTORIA                        │
│ Duración: 4 rondas                 │
│                                    │
│ Tus pérdidas: 5 fragatas           │
│ Enemigo destruido: 100%           │
│                                    │
│ XP Ganada: 100                     │
│ Créditos: 50                       │
└────────────────────────────────────┘

Detalle por Ronda (expandible):
Ronda 1:
- Tu flota ataca primero
- Daño infligido: 450
- Destruyes 15 naves enemigas
- Enemigo contraataca
- Daño recibido: 125
- Pierdes 2 fragatas

Ronda 2:
[...]

Estadísticas Finales:
- Daño total infligido: 1800
- Daño total recibido: 450
- Eficiencia: 4.0
- Naves destruidas: 50
```

### 13. Ranking Básico
```
Ruta: /leaderboard

Tabs:
- Global (por XP total)
- Semanal (por XP ganada esta semana)
- Poder (por poder militar)

Tabla:
Pos | Nombre | Nivel | XP | Imperio
--- | ------ | ----- | -- | -------
🥇  | Player1| 15    | 5000| Imperio Alfa
🥈  | Player2| 12    | 4200| Imperio Beta
... | ...    | ...   | ... | ...
47  | TÚ     | 8     | 2100| Tu Imperio
```

### 14. Admin Básico
```
Ruta: /admin (protegida)

Funciones:
- Ver lista de usuarios
- Buscar usuario por email/username
- Ver progreso de usuario (recursos, naves, XP)
- Banear/Desbanear usuario
- Ver estadísticas globales:
  - Total usuarios registrados (últimos 7 días)
  - Batallas hoy
  - Recursos totales en economía
```

---

## Backend - Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
```

### Imperio
```
GET  /api/empire                  # Datos del imperio actual
GET  /api/empire/resources        # Recursos calculados
POST /api/empire/resources/collect # Forzar recolección (debug)
```

### Planeta
```
GET  /api/planets                 # Lista de planetas del imperio
GET  /api/planets/:id             # Detalle de planeta
POST /api/planets/:id/build       # Construir edificio
POST /api/planets/:id/upgrade     # Mejorar edificio
```

### Investigación
```
GET  /api/research                # Lista tecnologías disponibles
POST /api/research/:id/start      # Iniciar investigación
```

### Astillero
```
GET  /api/shipyard/blueprints     # Naves desbloqueadas
POST /api/shipyard/build          # Construir naves
GET  /api/shipyard/queue          # Cola de construcción
DELETE /api/shipyard/queue/:id    # Cancelar construcción
```

### Flotas
```
GET  /api/fleets                  # Mis flotas
POST /api/fleets                  # Crear flota
GET  /api/fleets/:id              # Detalle flota
PUT  /api/fleets/:id              # Editar flota (formación)
DELETE /api/fleets/:id            # Disolver flota
```

### Misiones
```
GET  /api/missions                # Lista misiones PvE
POST /api/missions/:id/start      # Iniciar misión con flota
```

### Batallas
```
GET  /api/battles                 # Mis reportes de batalla
GET  /api/battles/:id             # Detalle de batalla
```

### Ranking
```
GET  /api/leaderboard?type=global&limit=100
GET  /api/leaderboard/me          # Mi posición
```

### Admin
```
GET  /api/admin/users             # Lista usuarios
GET  /api/admin/users/:id         # Detalle usuario
POST /api/admin/users/:id/ban     # Banear
POST /api/admin/users/:id/unban   # Desbanear
GET  /api/admin/stats             # Estadísticas globales
```

---

## Sistemas Backend

### 1. Producción de Recursos (por tiempo)
```typescript
// Job que corre cada minuto o en demanda
function updateResources(empireId: string) {
  const empire = getEmpire(empireId);
  const minutesSinceUpdate = (now - empire.lastResourceUpdate) / 60;
  
  // Calcular producción
  const metalGained = empire.metalProductionPerHour * (minutesSinceUpdate / 60);
  const plasmaGained = empire.plasmaProductionPerHour * (minutesSinceUpdate / 60);
  
  // Aplicar con límites de capacidad
  empire.metal = Math.min(empire.metal + metalGained, empire.metalCapacity);
  empire.plasma = Math.min(empire.plasma + plasmaGained, empire.plasmaCapacity);
  
  // Descontar consumo de flotas
  const consumption = calculateFleetConsumption(empireId);
  empire.plasma = Math.max(0, empire.plasma - consumption);
  
  empire.lastResourceUpdate = now;
  save(empire);
}
```

### 2. Construcción de Edificios
```typescript
// Job con timestamp
interface ConstructionJob {
  id: string;
  empireId: string;
  planetId: string;
  buildingType: string;
  targetLevel: number;
  startAt: Date;
  endAt: Date;
  resourcesSpent: { metal: number; plasma: number };
}

// Worker escanea jobs donde endAt <= now
// Al completar: actualizar edificio, recalcular producción
```

### 3. Construcción de Naves
```typescript
// Similar a edificios pero en cola
// Múltiples pueden construirse en paralelo (slots de astillero)
// Al completar: agregar naves al inventario del imperio
```

### 4. Investigación
```typescript
interface ResearchJob {
  id: string;
  empireId: string;
  technologyId: string;
  endAt: Date;
}

// Al completar: marcar tecnología como completada
// Desbloquear naves/edificios relacionados
```

### 5. Crear Flota
```typescript
function createFleet(data: CreateFleetDTO) {
  // Verificar que naves existen y no están en otra flota
  // Verificar límite de flotas del imperio
  // Verificar slots de formación no excedidos
  // Crear registro flota, marcar naves como asignadas
}
```

### 6. Misión PvE y Resolución
```typescript
function startMission(fleetId: string, missionId: string) {
  // Verificar flota disponible
  // Verificar poder suficiente (warning si no)
  // Consumir plasma de viaje
  // Marcar flota como "en misión"
  
  // Simular batalla (async)
  const result = combatSimulator.run({
    attacker: fleet,
    defender: generateEnemyFleet(missionId),
    seed: generateSeed()
  });
  
  // Aplicar resultados:
  // - Destruir naves perdidas
  // - Otorgar XP
  // - Otorgar créditos
  // - Guardar reporte
  
  // Marcar flota como disponible (o con timer de regreso)
}
```

### 7. Simulador de Batalla
```typescript
interface BattleConfig {
  attacker: Fleet;
  defender: Fleet;
  seed: string; // Para reproducibilidad
  maxRounds: number; // 20 para MVP
}

interface BattleResult {
  winner: 'attacker' | 'defender';
  rounds: RoundResult[];
  attackerLosses: ShipLoss[];
  defenderLosses: ShipLoss[];
  seed: string;
  duration: number; // ms de simulación
}

// Fórmula MVP simplificada:
// 1. Calcular iniciativa (velocidad)
// 2. Ordenar por iniciativa
// 3. Cada nave ataca: daño = ataque - defensa
// 4. Aplicar daño, verificar destrucción
// 5. Repetir hasta que un lado destruido o maxRounds
```

### 8. Guardar Reporte
```typescript
interface BattleReport {
  id: string;
  empireId: string;
  missionId?: string;
  fleetId: string;
  result: 'victory' | 'defeat';
  rounds: RoundDetail[];
  losses: ShipLoss[];
  xpGained: number;
  creditsGained: number;
  createdAt: Date;
  seed: string; // Para reproducir si se quiere
}

// Guardar en DB
// Retornar ID para que frontend redirija a reporte
```

### 9. Leaderboard
```typescript
// Recalcular periódicamente (cada hora) o en tiempo real simplificado
function updateLeaderboard() {
  const empires = db.empires.findAll({
    order: { experience: 'DESC' },
    limit: 100
  });
  
  // Cachear en Redis
  redis.set('leaderboard:global', JSON.stringify(empires));
}
```

---

## Base de Datos - Tablas MVP

### Core
```sql
-- users: Auth
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- empires: Per imperio
CREATE TABLE empires (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(50) NOT NULL,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP
);

-- resources: Por imperio
CREATE TABLE resources (
  id UUID PRIMARY KEY,
  empire_id UUID REFERENCES empires(id),
  type VARCHAR(20) CHECK (type IN ('metal', 'plasma', 'credits')),
  amount INTEGER DEFAULT 0,
  capacity INTEGER DEFAULT 1000,
  production_per_hour INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- planets: 1 por imperio en MVP
CREATE TABLE planets (
  id UUID PRIMARY KEY,
  empire_id UUID REFERENCES empires(id),
  name VARCHAR(50) DEFAULT 'Planeta Principal',
  galaxy_x INTEGER DEFAULT 0,
  galaxy_y INTEGER DEFAULT 0,
  type VARCHAR(20) DEFAULT 'habitable',
  max_building_slots INTEGER DEFAULT 9,
  created_at TIMESTAMP DEFAULT NOW()
);

-- buildings
CREATE TABLE buildings (
  id UUID PRIMARY KEY,
  planet_id UUID REFERENCES planets(id),
  type VARCHAR(30) NOT NULL,
  level INTEGER DEFAULT 1,
  slot_index INTEGER,
  status VARCHAR(20) DEFAULT 'idle',
  construction_ends_at TIMESTAMP,
  UNIQUE(planet_id, slot_index)
);

-- technologies (seed data)
CREATE TABLE technologies (
  id UUID PRIMARY KEY,
  name VARCHAR(50),
  description TEXT,
  required_level INTEGER,
  cost_metal INTEGER,
  cost_plasma INTEGER,
  research_time INTEGER -- segundos
);

-- empire_technologies (progreso del jugador)
CREATE TABLE empire_technologies (
  id UUID PRIMARY KEY,
  empire_id UUID REFERENCES empires(id),
  technology_id UUID REFERENCES technologies(id),
  status VARCHAR(20) DEFAULT 'locked', -- locked, researching, completed
  research_ends_at TIMESTAMP,
  UNIQUE(empire_id, technology_id)
);

-- blueprints (seed data de naves)
CREATE TABLE blueprints (
  id UUID PRIMARY KEY,
  name VARCHAR(50),
  type VARCHAR(20), -- frigate, cruiser, battleship
  description TEXT,
  required_technology_id UUID REFERENCES technologies(id),
  cost_metal INTEGER,
  cost_plasma INTEGER,
  build_time INTEGER,
  attack INTEGER,
  hp INTEGER,
  defense INTEGER,
  speed INTEGER
);

-- ships (inventario del jugador)
CREATE TABLE ships (
  id UUID PRIMARY KEY,
  empire_id UUID REFERENCES empires(id),
  blueprint_id UUID REFERENCES blueprints(id),
  quantity INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'available', -- available, in_fleet, destroyed
  fleet_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- fleets
CREATE TABLE fleets (
  id UUID PRIMARY KEY,
  empire_id UUID REFERENCES empires(id),
  name VARCHAR(50),
  status VARCHAR(20) DEFAULT 'idle', -- idle, on_mission
  total_power INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- fleet_formation (slots)
CREATE TABLE fleet_formations (
  id UUID PRIMARY KEY,
  fleet_id UUID REFERENCES fleets(id),
  slot_index INTEGER CHECK (slot_index BETWEEN 0 AND 3),
  ship_id UUID REFERENCES ships(id),
  quantity INTEGER,
  UNIQUE(fleet_id, slot_index)
);

-- missions (seed data)
CREATE TABLE missions (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  difficulty INTEGER,
  recommended_power INTEGER,
  enemy_fleet_config JSONB, -- Config de naves enemigas
  reward_xp INTEGER,
  reward_credits INTEGER
);

-- mission_runs (instancias de ejecución)
CREATE TABLE mission_runs (
  id UUID PRIMARY KEY,
  empire_id UUID REFERENCES empires(id),
  mission_id UUID REFERENCES missions(id),
  fleet_id UUID REFERENCES fleets(id),
  status VARCHAR(20) DEFAULT 'running', -- running, completed, failed
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- battles (reportes)
CREATE TABLE battles (
  id UUID PRIMARY KEY,
  empire_id UUID REFERENCES empires(id),
  mission_run_id UUID REFERENCES mission_runs(id),
  fleet_id UUID REFERENCES fleets(id),
  result VARCHAR(20), -- victory, defeat, draw
  rounds JSONB, -- Detalle por ronda
  seed VARCHAR(64), -- Para reproducir
  xp_gained INTEGER,
  credits_gained INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- battle_losses (naves perdidas)
CREATE TABLE battle_losses (
  id UUID PRIMARY KEY,
  battle_id UUID REFERENCES battles(id),
  blueprint_id UUID REFERENCES blueprints(id),
  quantity INTEGER
);

-- construction_queue (edificios y naves)
CREATE TABLE construction_queue (
  id UUID PRIMARY KEY,
  empire_id UUID REFERENCES empires(id),
  type VARCHAR(20), -- building, ship
  target_id UUID, -- building_id o blueprint_id
  target_planet_id UUID, -- para buildings
  quantity INTEGER, -- para ships
  started_at TIMESTAMP,
  ends_at TIMESTAMP,
  completed BOOLEAN DEFAULT FALSE
);
```

### Índices
```sql
CREATE INDEX idx_empires_user ON empires(user_id);
CREATE INDEX idx_resources_empire ON resources(empire_id);
CREATE INDEX idx_planets_empire ON planets(empire_id);
CREATE INDEX idx_buildings_planet ON buildings(planet_id);
CREATE INDEX idx_ships_empire ON ships(empire_id, status);
CREATE INDEX idx_fleets_empire ON fleets(empire_id, status);
CREATE INDEX idx_battles_empire ON battles(empire_id, created_at DESC);
CREATE INDEX idx_queue_ends ON construction_queue(ends_at) WHERE completed = FALSE;
```

### Seed Data Inicial
```sql
-- Tecnologías
INSERT INTO technologies (id, name, description, required_level, cost_metal, cost_plasma, research_time) VALUES
  (gen_random_uuid(), 'Minería Básica', '+10% producción de metal', 1, 0, 0, 0), -- Desbloqueada
  (gen_random_uuid(), 'Propulsión', 'Desbloquea Cruceros', 2, 500, 200, 300),
  (gen_random_uuid(), 'Escudos Defensivos', 'Desbloquea Acorazados', 3, 1000, 500, 600),
  (gen_random_uuid(), 'Economía Avanzada', '+20% créditos de misiones', 4, 800, 300, 900);

-- Naves
INSERT INTO blueprints (id, name, type, description, required_technology_id, cost_metal, cost_plasma, build_time, attack, hp, defense, speed) VALUES
  (gen_random_uuid(), 'Fragata', 'frigate', 'Nave rápida y barata', (SELECT id FROM technologies WHERE name = 'Minería Básica'), 50, 20, 30, 10, 50, 5, 20),
  (gen_random_uuid(), 'Crucero', 'cruiser', 'Nave equilibrada', (SELECT id FROM technologies WHERE name = 'Propulsión'), 150, 60, 120, 25, 120, 12, 12),
  (gen_random_uuid(), 'Acorazado', 'battleship', 'Nave pesada con alto HP', (SELECT id FROM technologies WHERE name = 'Escudos Defensivos'), 400, 150, 300, 40, 300, 25, 6);

-- Misiones
INSERT INTO missions (id, name, description, difficulty, recommended_power, enemy_fleet_config, reward_xp, reward_credits) VALUES
  (gen_random_uuid(), 'Sector Periférico', 'Zona segura con poca resistencia', 1, 300, '{"frigates": 20}', 100, 50),
  (gen_random_uuid(), 'Cinturón de Asteroides', 'Naves piratas en asteroides', 2, 600, '{"frigates": 30, "cruisers": 10}', 250, 100),
  (gen_random_uuid(), 'Nebulosa Tóxica', 'Ambiente hostil, enemigos moderados', 3, 1000, '{"cruisers": 20, "battleships": 5}', 500, 200),
  (gen_random_uuid(), 'Campo de Deriva', 'Escombros y naves abandonadas hostiles', 4, 1500, '{"cruisers": 30, "battleships": 15}', 800, 350),
  (gen_random_uuid(), 'Estación Abandonada', 'Defensas automáticas activas', 5, 2000, '{"battleships": 25, "frigates": 50}', 1200, 500);
```

---

## MVP - Fuera de Scope (Fase 2+)

| Feature | Razón de exclusión | Fase aproximada |
|---------|-------------------|-----------------|
| Comandantes | Agrega complejidad a balance de combate | Fase 2 |
| Módulos equipables | Sistema de inventario + UI compleja | Fase 2 |
| Alianzas | Requiere chat, permisos, gestión social | Fase 2 |
| PvP real | Sistema de matchmaking, anti-cheat | Fase 2 |
| Mercado entre jugadores | Economía compleja, exploits posibles | Fase 2 |
| Múltiples planetas | Expansión de imperio | Fase 3 |
| Eventos temporales | Sistema de scheduling | Fase 3 |
| Chat global | Moderación, infraestructura | Fase 3 |
| Arte 3D | Costo, validar gameplay primero | Fase 3 |
| App mobile nativa | Validar en web primero | Fase 3 |
| Monetización | Validar retención antes | Fase 2+ |

---

## Definición de "Listo"

El MVP v0 está listo cuando:

- [ ] Jugador puede registrarse y crear imperio
- [ ] Jugador ve recursos produciéndose en tiempo real
- [ ] Jugador construye edificios (cola con timers)
- [ ] Jugador investiga tecnologías
- [ ] Jugador construye 3 tipos de naves
- [ ] Jugador arma flotas con formación
- [ ] Jugador completa misión PvE
- [ ] Jugador ve reporte detallado de batalla
- [ ] Jugador gana XP y sube de nivel
- [ ] Jugador ve ranking global
- [ ] Admin puede ver usuarios y stats

**Duración estimada**: 8 semanas con 1-2 desarrolladores.

---

*Especificación v0.1 - Mayo 2026*
