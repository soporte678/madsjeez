# Glosario - Galaxy Online III

Términos del juego en español e inglés para consistencia del proyecto.

---

## Términos Core

| Español | Inglés | Descripción | Ejemplo de uso |
|---------|--------|-------------|----------------|
| **Planeta** | Planet | Cuerpo celestial colonizable con slots de construcción | "Mi planeta principal produce 1000 metal/hora" |
| **Imperio** | Empire | Entidad del jugador, colección de planetas y flotas | "El imperio de Ziegler tiene 5 planetas" |
| **Comandante** | Commander | Líder de flota con stats y habilidades | "Asigné un comandante táctico a mi flota" |
| **Flota** | Fleet | Grupo de naves organizadas con formación | "Mi flota de ataque tiene 50 naves" |
| **Nave** | Ship | Unidad individual de combate o transporte | "Las fragatas son naves rápidas y baratas" |

## Infraestructura

| Español | Inglés | Descripción | Ejemplo de uso |
|---------|--------|-------------|----------------|
| **Astillero** | Shipyard | Edificio para construir naves | "Mejoré mi astillero al nivel 5" |
| **Investigación** | Research | Tecnologías desbloqueables | "La investigación militar da bonus de ataque" |
| **Edificio** | Building | Estructura construible en planetas | "Los edificios tienen niveles del 1 al 30" |
| **Módulo** | Module | Componente equipable en naves/comandantes | "Equipé un módulo de escudo a mi nave" |
| **Plano** | Blueprint | Diseño para construir tipo de nave avanzado | "Conseguí un plano épico de crucero" |
| **Formación** | Formation | Disposición espacial de naves en batalla | "La formación en cuña protege las naves traseras" |

## Recursos y Economía

| Español | Inglés | Descripción | Ejemplo de uso |
|---------|--------|-------------|----------------|
| **Recursos** | Resources | Materiales para construcción y mantenimiento | "Necesito más recursos para expandirme" |
| **Metal** | Metal | Recurso básico para edificios y naves | "La mina de metal produce 500/hora" |
| **Plasma** | Plasma (He3) | Combustible para flotas | "Mi flota consume 100 plasma por hora" |
| **Créditos** | Credits | Moneda para comercio y comandantes | "Los créditos se obtienen por comercio" |
| **Mercado** | Market | Sistema de comercio entre jugadores | "Vendí exceso de metal en el mercado" |
| **Crafting** | Crafting | Fabricación de items avanzados | "El crafting de módulos requiere materiales" |
| **Upgrade** | Upgrade | Mejora de nivel de edificio/nave | "Hice upgrade del centro de comando" |

## Combate

| Español | Inglés | Descripción | Ejemplo de uso |
|---------|--------|-------------|----------------|
| **Batalla** | Battle | Encuentro de combate entre flotas | "La batalla duró 5 rondas" |
| **Instancia** | Instance | Misión PvE contra IA | "La instancia nivel 3 me dio buen loot" |
| **Targeting** | Targeting | Selección de objetivo en combate | "El targeting automático elige al más cercano" |
| **PvE** | PvE (Player vs Environment) | Combate contra IA/instancias | "Prefiero PvE antes que arriesgar en PvP" |
| **PvP** | PvP (Player vs Player) | Combate entre jugadores | "El PvP da más recursos pero es riesgoso" |
| **Cooldown** | Cooldown | Tiempo de recarga de habilidad | "El cooldown de la habilidad es 3 rondas" |
| **Timer** | Timer | Contador de tiempo para completar acción | "El timer de construcción termina en 2 horas" |
| **Reporte de Batalla** | Battle Report | Registro detallado del combate | "El reporte muestra que perdí 10 naves" |

## Social y Progresión

| Español | Inglés | Descripción | Ejemplo de uso |
|---------|--------|-------------|----------------|
| **Alianza** | Alliance | Grupo de jugadores cooperando | "Mi alianza tiene 20 miembros" |
| **Evento** | Event | Actividad temporal con recompensas | "El evento de este fin de semana da doble XP" |
| **Ranking** | Ranking/Leaderboard | Tabla de posiciones de jugadores | "Subí al puesto 50 del ranking" |
| **Experiencia** | Experience (XP) | Puntos para subir de nivel | "Gané 500 XP en esa batalla" |
| **Nivel** | Level | Grado de progresión | "Alcanzé nivel 10 y desbloqueé cruceros" |

## Términos Técnicos

| Español | Inglés | Descripción | Ejemplo de uso |
|---------|--------|-------------|----------------|
| **Seed** | Seed | Valor para reproducir batalla idéntica | "El seed permite ver el mismo combate" |
| **Simulador** | Simulator | Sistema que resuelve combates | "El simulador corre en el servidor" |
| **Async** | Async | Proceso asíncrono sin jugador presente | "Los combates son async, no requieren presencia" |
| **Stack** | Stack | Grupo de naves del mismo tipo | "Tengo un stack de 100 fragatas" |
| **Slot** | Slot | Espacio disponible para construir/equipar | "Mi planeta tiene 12 slots de edificios" |

---

## Convenciones de Nomenclatura

### Para código
```typescript
// Enums en SCREAMING_SNAKE_CASE
enum ShipType {
  FRIGATE = 'frigate',
  CRUISER = 'cruiser',
  BATTLESHIP = 'battleship'
}

// Interfaces en PascalCase
interface FleetConfiguration {
  formationSlots: FormationSlot[];
  commanderId?: string;
}

// Variables en camelCase
const fleetPower = calculateFleetPower(ships);
const isBattleActive = battle.status === 'in_progress';
```

### Para UI
- Títulos de pantallas: "Mis Flotas", "Centro de Investigación"
- Botones de acción: "Construir", "Atacar", "Mejorar"
- Mensajes de estado: "Construcción en progreso...", "Batalla completada"
- Nombres propios del juego: Naves ("Vanguardia", "Titán"), Recursos ("Metal", "Plasma")

### Para bases de datos
- Tablas: `snake_case`, plural: `empires`, `fleets`, `battle_reports`
- Columnas: `snake_case`: `created_at`, `fleet_id`, `is_active`
- Constraints: `pk_`, `fk_`, `idx_` prefijos

---

## Términos a EVITAR

Estos términos están asociados al juego original y no deben usarse:

| ❌ No usar | ✅ Usar en su lugar | Razón |
|-----------|---------------------|-------|
| Galaxy Online II | Nuestro nombre de proyecto | Trademark |
| GO2 | GO3 o nombre propio | Trademark |
| IGG | N/A (no referirse) | Compañía original |
| Cruiser (exacto) | Crucero / Interceptor | Diferenciación |
| Battleship (exacto) | Acorazado / Titán | Diferenciación |
| He3 (exacto) | Plasma / Células de Energía | Diferenciación |

---

*Documento vivo - actualizar según evolucione el proyecto*
