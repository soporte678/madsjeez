# Modelo de Combate - Diseño Inspirado

Sistema de combate táctico por turnos, adaptado de mecánicas de GO2.

---

## Principios de Diseño

1. **Tiempo real async**: El jugador no está presente durante el combate
2. **Reporte detallado**: Resultado mostrado ronda por ronda
3. **Formación importa**: Posición de naves afecta targeting
4. **Stats + Módulos**: Combinación determina resultado
5. **Predeterminable pero variable**: RNG controlado para imprevisibilidad

---

## Fase de Preparación

### 1. Formación de Flota

```
Grilla 4x4 = 16 posiciones posibles

[ 0] [ 1] [ 2] [ 3]    ← Fila frontal (recibe daño primero)
[ 4] [ 5] [ 6] [ 7]
[ 8] [ 9] [10] [11]
[12] [13] [14] [15]    ← Fila trasera (protegida)
```

**Reglas de formación:**
- Máximo 1 tipo de nave por posición (stack de cantidad)
- Algunas naves ocupan 2 slots (acorazados, porta-naves)
- Comandante ocupa slot separado (siempre posición 5, 6, 9, o 10)
- Formaciones guardables con nombre

### 2. Detección y Engagement

```typescript
interface Engagement {
  attackerFleet: Fleet;
  defenderFleet: Fleet | null;    // Null = instancia PvE
  defenderPlanet: Planet | null;   // Para batallas defensivas
  instanceId: string | null;       // Para PvE
  terrainModifier: TerrainEffect | null;
  detectionWinner: 'attacker' | 'defender' | 'neutral'; // Afecta quién dispara primero
}
```

---

## Sistema de Turnos

### Orden de acción

1. **Calcular iniciativa** por cada grupo de naves:
   ```
   iniciativa = baseSpeed * (1 + commanderNavigationBonus) * random(0.9, 1.1)
   ```

2. **Ordenar** todos los grupos por iniciativa descendente

3. **Ejecutar acciones** en orden:
   - Seleccionar objetivo
   - Calcular daño
   - Aplicar daño
   - Verificar destrucciones

### Estructura de Ronda

```typescript
interface CombatRound {
  roundNumber: number;
  actions: CombatAction[];
  fleetStates: Map<FleetId, FleetState>;
  endCondition?: 'victory' | 'defeat' | 'draw' | 'timeout';
}

interface CombatAction {
  actor: ShipGroup;
  actionType: 'attack' | 'defend' | 'flee' | 'special';
  target?: ShipGroup;
  damage?: DamageResult;
  effectsApplied: AppliedEffect[];
}
```

---

## Stats de Combate

### Stats Base de Naves

| Stat | Descripción | Cálculo |
|------|-------------|---------|
| **Structure** | HP total | Base + módulos + bonus investigación |
| **Attack** | Daño base por disparo | Base + módulos + comandante |
| **Defense** | Reducción % de daño | Base + módulos - penetración atacante |
| **Speed** | Orden de turno + evasión | Base + módulos + comandante |
| **Shield** | HP extra (regenera) | Módulos + investigación |

### Modificadores de Combate

```typescript
interface CombatModifiers {
  // Del comandante
  attackBonus: number;      // %
  defenseBonus: number;   // %
  speedBonus: number;       // %
  criticalChance: number;   // %
  criticalDamage: number; // % extra
  
  // De módulos
  shieldNegation: number;   // % ignorar escudo
  structureNegation: number; // % ignorar armadura
  splashDamage: number;     // % daño a naves adyacentes
  
  // De investigación
  fleetSizeBonus: number; // % más naves por stack
  rangeBonus: number;       // Prioridad targeting
}
```

---

## Sistema de Targeting

### Prioridad por defecto

1. **Proximidad**: Naves más cercanas en grilla
2. **Tipo**: Fragatas > Cazas > Cruceros > Acorazados (si iguales)
3. **HP**: Objetivo con menos HP (coupe de grâce)

### Módulos de targeting

- **Targeting System**: Prioriza tipos específicos
- **Interceptor**: Prioriza naves más rápidas
- **Bomber Targeting**: Prioriza naves más grandes

```typescript
function selectTarget(
  attacker: ShipGroup,
  enemyFormation: Formation,
  strategy: TargetingStrategy
): ShipGroup {
  // Lógica de scoring basada en estrategia
  const candidates = enemyFormation.getAliveGroups();
  return candidates
    .map(c => ({ group: c, score: calculateScore(attacker, c, strategy) }))
    .sort((a, b) => b.score - a.score)[0]?.group;
}
```

---

## Cálculo de Daño

### Fórmula base

```typescript
function calculateDamage(
  attacker: ShipGroup,
  target: ShipGroup,
  modifiers: CombatModifiers
): DamageResult {
  
  // Daño base * cantidad de naves vivas
  let baseDamage = attacker.attack * attacker.aliveCount;
  
  // Bonus de comandante
  baseDamage *= (1 + modifiers.attackBonus);
  
  // Crítico
  const isCritical = Math.random() < modifiers.criticalChance;
  if (isCritical) {
    baseDamage *= (1.5 + modifiers.criticalDamage);
  }
  
  // Defensa del objetivo
  const effectiveDefense = target.defense * (1 - modifiers.structureNegation);
  const defenseReduction = effectiveDefense / (effectiveDefense + 100); // Fórmula de atenuación
  
  let finalDamage = baseDamage * (1 - defenseReduction);
  
  // RNG de ±10%
  finalDamage *= random(0.9, 1.1);
  
  // Aplicación de daño
  const shieldDamage = Math.min(target.shield, finalDamage * (1 - modifiers.shieldNegation));
  const hullDamage = finalDamage - shieldDamage;
  
  return {
    total: Math.floor(finalDamage),
    shield: Math.floor(shieldDamage),
    hull: Math.floor(hullDamage),
    isCritical,
    shipsDestroyed: Math.floor(hullDamage / target.structurePerShip)
  };
}
```

### Tipos de daño (para variedad)

| Tipo | Efecto especial |
|------|-----------------|
| Balístico | Ignora % de escudo |
| Láser | Daño consistente, poca RNG |
| Plasma | Alto daño, inestable (±20% RNG) |
| Explosivo | Daño en área a grupos adyacentes |
| Iónico | Daño a escudo x2, daño a estructura /2 |

---

## Comandantes en Combate

### Auras (pasivas que afectan flota entera)

```typescript
interface CommanderAura {
  name: string;
  radius: 'fleet' | 'adjacent' | 'row';
  effect: StatModifier;
}

// Ejemplos:
const AURAS = {
  marshalsFury: {
    name: "Furia del Mariscal",
    radius: 'fleet',
    effect: { attack: 0.15, speed: 0.05 }
  },
  defensiveMatrix: {
    name: "Matriz Defensiva",
    radius: 'adjacent',
    effect: { defense: 0.20, structure: 0.10 }
  },
  tacticalManeuver: {
    name: "Maniobra Táctica",
    radius: 'row',
    effect: { speed: 0.25, evasion: 0.10 }
  }
};
```

### Habilidades activas

- Usadas automáticamente por IA del comandante
- Cooldown entre usos
- Trigger basado en condiciones (ej: <50% HP, ronda 3, etc.)

```typescript
interface CommanderSkill {
  id: string;
  name: string;
  trigger: 'manual' | 'round_start' | 'health_threshold' | 'enemy_destroyed';
  cooldown: number; // rounds
  effect: SkillEffect;
}

// Ejemplos:
const SKILLS = {
  overcharge: {
    name: "Sobrecarga",
    trigger: 'round_start',
    cooldown: 3,
    effect: { type: 'buff', stat: 'attack', value: 0.50, duration: 1 }
  },
  emergencyRepair: {
    name: "Reparación Emergencia",
    trigger: 'health_threshold',
    cooldown: 5,
    effect: { type: 'heal', target: 'most_damaged', value: 0.25 }
  },
  alphaStrike: {
    name: "Golpe Alfa",
    trigger: 'round_start',
    cooldown: 4,
    effect: { type: 'attack', multiplier: 2.0, ignoreDefense: true }
  }
};
```

---

## Módulos y Combate

### Slots de módulos en naves

```typescript
interface ModuleSlot {
  type: 'weapon_small' | 'weapon_large' | 'defense' | 'engine' | 'structure' | 'special';
  equipped?: Module;
}

// Ejemplo Fragata: [weapon_small, engine, special]
// Ejemplo Acorazado: [weapon_large, weapon_large, defense, structure, structure, engine]
```

### Efectos de módulos

```typescript
type ModuleEffect =
  | { type: 'stat_bonus'; stat: string; value: number; }
  | { type: 'damage_type'; damageType: DamageType; conversion: number; }
  | { type: 'targeting_priority'; priority: TargetType; bonus: number; }
  | { type: 'splash_damage'; radius: 1 | 2; percentage: number; }
  | { type: 'shield_leech'; percentage: number; }  // Robar escudo
  | { type: 'counter_attack'; chance: number; damagePercent: number; }
  | { type: 'evasion'; chance: number; };
```

---

## Instancias PvE (Misiones)

### Estructura de ola (Wave)

```typescript
interface InstanceWave {
  waveNumber: number;
  enemies: EnemyGroup[];
  formation: Formation;
  behavior: AIBehavior;
  reinforcement?: {     // Refuerzos que llegan más tarde
    delayRounds: number;
    enemies: EnemyGroup[];
  };
}

interface EnemyGroup {
  shipType: ShipType;
  quantity: number;
  level: number;
  moduleQuality: 'basic' | 'standard' | 'advanced' | 'elite';
  aiPriority: 'nearest' | 'weakest' | 'strongest' | 'commander';
}
```

### Comportamientos de IA

| Comportamiento | Descripción |
|----------------|-------------|
| **Aggressive** | Ataca al más cercano, no defiende |
| **Defensive** | Protege naves más dañadas, prioriza sobrevivir |
| **Tactical** | Targeting por tipo, usa habilidades con cooldown |
| **Suicide** | Alto daño, ignora defensa propia |
| **Support** | Buffa aliados, no ataca directamente |

---

## Reporte de Batalla

### Estructura del reporte

```typescript
interface BattleReport {
  id: string;
  battleType: 'pve' | 'pvp' | 'alliance';
  timestamp: Date;
  duration: number; // segundos reales de simulación
  rounds: RoundReport[];
  
  attackerSnapshot: FleetSnapshot;
  defenderSnapshot: FleetSnapshot;
  
  result: {
    winner: 'attacker' | 'defender' | 'draw';
    roundsCompleted: number;
    
    attackerLosses: ShipLoss[];
    defenderLosses: ShipLoss[];
    
    experienceGained: number;
    commanderExperience: number;
    
    loot?: ResourceLoot[];
    blueprintsDropped?: string[];
    
    mvpUnit?: { type: string; kills: number; damageDealt: number; };
  };
  
  replayData: CompressedCombatLog; // Para ver animación
}

interface RoundReport {
  round: number;
  highlights: string[]; // Texto descriptivo para UI
  actions: ActionReport[];
  stateAfter: FleetStateSnapshot;
}
```

### Visualización UI

1. **Resumen**: Ganador, pérdidas totales, loot
2. **Timeline**: Rondas con expandir/colapsar
3. **Detalle por ronda**:
   - Quién actuó
   - Acción tomada
   - Daño infligido
   - Naves destruidas
4. **Estadísticas finales**:
   - Daño total infligido/recibido
   - Eficiencia (daño/losses)
   - Críticos acertados

---

## Simulador de Combate

### Uso

```typescript
// Ejemplo de uso del simulador
const simulator = new CombatSimulator({
  randomSeed: 'optional_seed_for_reproducibility',
  maxRounds: 50,
  timeLimit: 30000 // ms
});

const result = simulator.run({
  attackerFleet: myFleet,
  defenderFleet: enemyFleet,
  terrain: 'asteroid_field',
  instanceModifiers: null
});

console.log(result.summary);
console.log(result.replayData);
```

### Casos especiales

- **Timeout**: Si >50 rondas sin ganador → empate
- **Flee**: Flota puede retirarse ronda 5+ (pérdida automática pero salva naves)
- **Interrupción**: Desconexión = IA toma control con lógica defensiva

---

## Balance y Tuning

### Métricas a monitorear

| Métrica | Objetivo | Acción si falla |
|---------|----------|-----------------|
| Win rate PvE nivel 1-3 | 90%+ | Revisar si es onboarding |
| Win rate PvE nivel 5 | 60% | Ajustar stats enemigos |
| Win rate PvE nivel 10 | 20% | Correcto, debe ser challenge |
| PvP win rate | 50% (matchmaking) | Ajustar matchmaking, no balance |
| Combate promedio | 3-8 rondas | Ajustar HP/daño |

### Formulas de balance

```typescript
// Poder de flota (para matchmaking y display)
function calculateFleetPower(fleet: Fleet): number {
  return fleet.shipGroups.reduce((total, group) => {
    const shipPower = 
      group.structure * 1 +
      group.attack * 2 +
      group.defense * 1.5 +
      group.speed * 0.5;
    return total + (shipPower * group.quantity);
  }, 0);
}

// Difficulty rating de instancia
function calculateInstanceDifficulty(instance: Instance): number {
  const totalEnemyPower = instance.waves.reduce((sum, wave) => 
    sum + calculateWavePower(wave), 0
  );
  const attemptsFactor = 5 / instance.dailyAttempts;
  return totalEnemyPower * attemptsFactor;
}
```

---

## Tech Stack Sugerido para Simulador

- **Core**: TypeScript/JavaScript puro (compartir con cliente)
- **Server**: Validación anti-cheat (re-simular en backend)
- **Determinístico**: Con seed fijo, mismo resultado cliente/servidor
- **Performance**: Pre-calcular resultados comunes, cachear
