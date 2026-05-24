# Modelo de Datos - Esquema Propuesto

Diseño de entidades para sistema inspirado en GO2. Adaptable a cualquier stack.

---

## Diagrama ER de Alto Nivel

```
User 1--* Empire 1--* Planet 1--* Building
                |
                *--* Resource
                |
                1--* Fleet 1--* Ship
                |       |
                |       1--1 Commander 1--* Module
                |
                *--* Research
                |
                1--* BattleReport
                |
                *--* Alliance
                |
                1--* Mission
                |
                1--* InventoryItem
                |
                *--* Blueprint
```

---

## Entidades Detalladas

### 1. User (Auth)
```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // Único
  passwordHash: string;          // bcrypt/argon2
  username: string;              // Único, visible
  createdAt: Date;
  lastLoginAt: Date;
  status: 'active' | 'banned' | 'inactive';
  preferences: UserPreferences; // JSON
}
```

### 2. Empire
```typescript
interface Empire {
  id: string;
  userId: string;                // FK → User
  name: string;                  // Nombre del imperio
  level: number;                 // Nivel de imperio
  experience: number;
  prestigeLevel: number;         // Renombre/reinicio
  totalPower: number;            // Poder militar calculado
  allianceId?: string;            // FK → Alliance (nullable)
  allianceRank?: 'member' | 'officer' | 'leader';
  createdAt: Date;
  lastActiveAt: Date;
  settings: EmpireSettings;      // JSON
}
```

### 3. Planet
```typescript
interface Planet {
  id: string;
  empireId: string;              // FK → Empire
  name: string;
  galaxyX: number;               // Coordenada X
  galaxyY: number;               // Coordenada Y
  type: 'rocky' | 'gas' | 'habitable' | 'mineral' | 'ice';
  level: number;                 // Nivel de desarrollo
  maxBuildingSlots: number;
  usedSlots: number;
  isCapital: boolean;            // Planeta principal
  defenseScore: number;
  createdAt: Date;
  capturedAt?: Date;             // Si fue conquistado
  previousOwnerId?: string;       // Para historial
}
```

### 4. Resource (Stock por imperio/planeta)
```typescript
interface Resource {
  id: string;
  empireId: string;              // FK → Empire
  planetId?: string;             // FK → Planet (null = compartido)
  type: 'metal' | 'he3' | 'gold' | 'tokens' | 'alliance_points';
  amount: number;                // Actual
  capacity: number;              // Máximo
  productionPerHour: number;       // Producción pasiva
  consumptionPerHour: number;    // Consumo (He3)
  updatedAt: Date;               // Para calcular offline progress
}
```

### 5. Building
```typescript
interface Building {
  id: string;
  planetId: string;              // FK → Planet
  type: BuildingType;            // Enum de tipos
  level: number;
  status: 'idle' | 'constructing' | 'upgrading' | 'damaged';
  constructionStartedAt?: Date;
  constructionEndsAt?: Date;
  slotIndex: number;             // Posición en planeta
  efficiency: number;            // 0-100%, puede bajar por daño
}

type BuildingType = 
  | 'command_center'
  | 'metal_mine' 
  | 'he3_extractor'
  | 'shipyard'
  | 'research_lab'
  | 'academy'
  | 'market'
  | 'warehouse'
  | 'shield_generator'
  | 'planetary_cannon';
```

### 6. Research
```typescript
interface Research {
  id: string;
  empireId: string;              // FK → Empire
  type: ResearchType;            // Enum
  level: number;
  status: 'completed' | 'researching';
  researchStartedAt?: Date;
  researchEndsAt?: Date;
}

type ResearchType =
  | 'construction'      // Edificios más baratos
  | 'economy'           // +Producción recursos
  | 'military'          // +Stats naves
  | 'navigation'        // +Velocidad flotas
  | 'defense'           // +Defensa planetaria
  | 'espionage';        // +Inteligencia
```

### 7. Ship
```typescript
interface Ship {
  id: string;
  empireId: string;              // FK → Empire
  blueprintId: string;           // FK → Blueprint
  type: ShipType;                // Enum
  name?: string;                 // Nombre personalizado opcional
  quantity: number;              // Cantidad (stack)
  location: 'planet' | 'fleet';  // Dónde está
  planetId?: string;             // Si en planeta
  fleetId?: string;              // Si en flota
  status: 'ready' | 'damaged' | 'destroyed';
  hullIntegrity: number;         // % de salud
}

type ShipType =
  | 'frigate'      // Scout/barato
  | 'cruiser'      // Balance
  | 'battleship'   // Tanque
  | 'carrier'      // Transporta cazas
  | 'fighter'      // DPS frágil
  | 'bomber'       // Anti-edificios
  | 'colonizer'    // Expansión
  | 'trader';      // Transporte
```

### 8. Blueprint
```typescript
interface Blueprint {
  id: string;
  name: string;
  description: string;
  type: ShipType;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  baseStats: ShipStats;          // Stats base
  moduleSlots: ModuleSlotConfig[]; // Config de slots
  buildCost: ResourceCost[];
  buildTime: number;             // Segundos
  unlockRequirements?: ResearchRequirement[];
  obtainedFrom: 'instance' | 'research' | 'event' | 'market';
}

interface ShipStats {
  structure: number;             // HP
  attack: number;
  defense: number;
  speed: number;
  cargo: number;
  he3Consumption: number;
}
```

### 9. Fleet
```typescript
interface Fleet {
  id: string;
  empireId: string;              // FK → Empire
  name: string;
  commanderId?: string;          // FK → Commander
  status: 'idle' | 'moving' | 'fighting' | 'returning' | 'stationed';
  originPlanetId: string;
  targetPlanetId?: string;
  targetType?: 'planet' | 'instance' | 'fleet';
  departureAt?: Date;
  arrivalAt?: Date;
  missionType?: 'attack' | 'transport' | 'colonize' | 'spy' | 'defend' | 'raid';
  totalPower: number;            // Calculado de naves
  totalCargo: number;
  carriedResources?: ResourceCargo[];
  formation: FormationSlot[];     // Posiciones en batalla
}

interface FormationSlot {
  position: number;              // 0-15 (4x4 grid)
  shipId?: string;
  quantity: number;
}
```

### 10. Commander
```typescript
interface Commander {
  id: string;
  empireId: string;              // FK → Empire
  fleetId?: string;              // FK → Fleet (null = en planeta)
  name: string;
  avatarUrl?: string;
  type: 'marshal' | 'defender' | 'engineer' | 'explorer' | 'trader';
  level: number;
  experience: number;
  stats: CommanderStats;
  equippedModules: EquippedModule[];
  skillPoints: number;           // Puntos disponibles
  skills: CommanderSkill[];      // Habilidades desbloqueadas
  salary: number;                // Costo He3/hora
  status: 'idle' | 'assigned' | 'training';
}

interface CommanderStats {
  tactics: number;               // Bonus daño
  mechanic: number;              // Bonus HP
  navigation: number;            // Bonus velocidad
  commerce: number;              // Bonus comercio
}

interface EquippedModule {
  slotIndex: number;
  moduleId: string;
}
```

### 11. Module
```typescript
interface Module {
  id: string;
  empireId?: string;             // Si es propiedad
  templateId: string;            // FK → ModuleTemplate
  name: string;
  type: ModuleType;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  level: number;
  effects: ModuleEffect[];
}

interface ModuleTemplate {
  id: string;
  name: string;
  type: ModuleType;
  slotType: 'weapon_small' | 'weapon_large' | 'defense' | 'engine' | 'structure' | 'special';
  baseEffects: ModuleEffect[];
  maxLevel: number;
  upgradeCost: ResourceCost[];
}

type ModuleType = 'weapon' | 'defense' | 'engine' | 'structure' | 'special';

interface ModuleEffect {
  stat: string;
  value: number;
  operation: 'add' | 'multiply' | 'percent';
}
```

### 12. Battle / BattleReport
```typescript
interface Battle {
  id: string;
  type: 'pve' | 'pvp' | 'alliance';
  status: 'pending' | 'in_progress' | 'completed';
  attackerFleetId: string;
  defenderFleetId?: string;      // Null para PvE
  defenderPlanetId?: string;
  instanceId?: string;           // Si es PvE
  startedAt: Date;
  endedAt?: Date;
  winner?: 'attacker' | 'defender' | 'draw';
  rounds: BattleRound[];
}

interface BattleRound {
  roundNumber: number;
  actions: BattleAction[];
  attackerStatsAfter: FleetSnapshot;
  defenderStatsAfter: FleetSnapshot;
}

interface BattleReport {
  id: string;
  battleId: string;
  empireId: string;              // Para quién es el reporte
  isAttacker: boolean;
  summary: {
    winner: string;
    rounds: number;
    attackerLosses: ShipLoss[];
    defenderLosses: ShipLoss[];
    resourcesLooted?: ResourceAmount[];
    experienceGained: number;
  };
  detailedLog: RoundDetail[];
  viewed: boolean;
  createdAt: Date;
}
```

### 13. Alliance
```typescript
interface Alliance {
  id: string;
  name: string;
  tag: string;                   // [TAG] corto
  description: string;
  logoUrl?: string;
  leaderId: string;              // FK → Empire
  level: number;
  experience: number;
  maxMembers: number;
  currentMembers: number;
  totalPower: number;
  technologies: AllianceTech[];
  resources: AllianceResource[];
  createdAt: Date;
  settings: AllianceSettings;
}

interface AllianceMember {
  allianceId: string;
  empireId: string;
  rank: 'member' | 'officer' | 'leader';
  contribution: number;
  joinedAt: Date;
  lastContributionAt: Date;
}
```

### 14. Mission / Instance
```typescript
interface Instance {
  id: string;
  name: string;
  description: string;
  difficulty: number;              // 1-10
  recommendedPower: number;
  waves: InstanceWave[];
  rewards: InstanceReward[];
  dailyAttempts: number;
  resetTime: string;               // HH:mm UTC
  requirements?: {
    minLevel?: number;
    minPrestige?: number;
    requiredResearch?: string[];
  };
}

interface InstanceRun {
  id: string;
  empireId: string;
  instanceId: string;
  fleetId: string;
  status: 'running' | 'completed' | 'failed';
  currentWave: number;
  results: WaveResult[];
  startedAt: Date;
  endedAt?: Date;
}
```

### 15. Inventory / Items
```typescript
interface InventoryItem {
  id: string;
  empireId: string;
  itemTemplateId: string;
  quantity: number;
  obtainedAt: Date;
  expiresAt?: Date;              // Items temporales
  isBound: boolean;              // No tradeable
}

interface ItemTemplate {
  id: string;
  name: string;
  description: string;
  type: 'consumable' | 'material' | 'blueprint' | 'module' | 'cosmetic' | 'boost';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  iconUrl: string;
  usable: boolean;
  effects?: ItemEffect[];
  tradable: boolean;
  maxStack: number;
}
```

---

## Índices Recomendados

```sql
-- Performance crítica
CREATE INDEX idx_empire_user ON Empire(userId);
CREATE INDEX idx_planet_empire ON Planet(empireId);
CREATE INDEX idx_ship_empire_location ON Ship(empireId, location);
CREATE INDEX idx_fleet_empire_status ON Fleet(empireId, status);
CREATE INDEX idx_resource_empire_type ON Resource(empireId, type);
CREATE INDEX idx_battle_report_empire ON BattleReport(empireId, viewed);
CREATE INDEX idx_coord ON Planet(galaxyX, galaxyY);

-- Timers para jobs
CREATE INDEX idx_building_construction ON Building(status, constructionEndsAt) 
WHERE status IN ('constructing', 'upgrading');
CREATE INDEX idx_research_researching ON Research(status, researchEndsAt) 
WHERE status = 'researching';
CREATE INDEX idx_fleet_arrival ON Fleet(status, arrivalAt) 
WHERE status IN ('moving', 'returning');
```

---

## Consideraciones de Escalado

- **Resources**: Sharding por empireId para datos de jugador
- **Battles**: Tabla aparte, archivar reports antiguos (>30 días)
- **Planets**: Partition por galaxy quadrant (X,Y ranges)
- **Fleet movements**: Job queue (Redis/Bull) para procesar arrivos
