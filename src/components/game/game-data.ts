export type ResourceKey = "metal" | "plasma" | "credits";

export type BuildingType =
  | "metal_extractor"
  | "plasma_refinery"
  | "warehouse"
  | "energy_generator"
  | "control_center"
  | "shipyard"
  | "research_lab"
  | "hangar"
  | "defense_turret"
  | "missile_silo"
  | "radar_tower"
  | "aerial_platform"
  | "empty";

export type Building = {
  id: string;
  type: BuildingType;
  name: string;
  level: number;
  description: string;
  production?: string;
  capacity?: number;
  health?: number;
  upgradeCost?: Partial<Record<ResourceKey, number>>;
  webpName: string;
};

export type Player = { name: string; level: number; xp: number; xpMax: number };

export type Resource = {
  key: ResourceKey;
  label: string;
  value: number;
  max: number;
  rate?: string;
  tone: "cyan" | "purple" | "gold";
  webpName: string;
};

export const player: Player = { name: "HJOSE", level: 1, xp: 120, xpMax: 300 };

export const resources: Resource[] = [
  { key: "metal", label: "METAL", value: 1000, max: 1000, rate: "+100/h", tone: "cyan", webpName: "resource-metal" },
  { key: "plasma", label: "PLASMA", value: 629, max: 1000, rate: "+50/h", tone: "purple", webpName: "resource-plasma" },
  { key: "credits", label: "CRÉDITOS", value: 1000, max: 999999999, tone: "gold", webpName: "resource-credits" },
];

export const allBuildings: Building[] = [
  { id: "b1", type: "metal_extractor", name: "EXTRACTOR DE METAL", level: 1, description: "Extrae minerales metálicos desde la corteza del planeta para su uso en construcción y fabricación.", production: "+100/h", capacity: 1000, health: 1000, upgradeCost: { metal: 500, plasma: 80, credits: 120 }, webpName: "metal-mine" },
  { id: "b2", type: "plasma_refinery", name: "REFINERÍA DE PLASMA", level: 1, description: "Procesa plasma bruto para su uso en tecnologías avanzadas y construcción de estructuras.", production: "+50/h", capacity: 1000, health: 1000, upgradeCost: { metal: 500, plasma: 250, credits: 100 }, webpName: "plasma-refinery" },
  { id: "b3", type: "warehouse", name: "ALMACÉN", level: 1, description: "Aumenta la capacidad máxima de almacenamiento de recursos.", capacity: 1000, health: 500, upgradeCost: { metal: 200, plasma: 150, credits: 250 }, webpName: "warehouse" },
  { id: "b4", type: "energy_generator", name: "GENERADOR DE ENERGÍA", level: 1, description: "Genera energía para mantener operativa la colonia y sus estructuras.", production: "+80/h", capacity: 800, health: 700, upgradeCost: { metal: 350, plasma: 200, credits: 100 }, webpName: "energy-generator" },
  { id: "b5", type: "control_center", name: "CENTRO DE CONTROL", level: 1, description: "Coordina defensa, construcción e investigación en la base.", production: "+20/h", capacity: 500, health: 1200, upgradeCost: { metal: 700, plasma: 300, credits: 350 }, webpName: "control-center" },
  { id: "b6", type: "shipyard", name: "ASTILLERO", level: 0, description: "Construye y repara naves espaciales.", capacity: 0, health: 0, upgradeCost: { metal: 1000, plasma: 500, credits: 800 }, webpName: "shipyard" },
  { id: "b7", type: "research_lab", name: "LABORATORIO", level: 0, description: "Desarrolla tecnologías y mejoras.", capacity: 0, health: 0, upgradeCost: { metal: 800, plasma: 600, credits: 700 }, webpName: "research-lab" },
  { id: "b8", type: "hangar", name: "HANGAR", level: 0, description: "Almacena y despliega flotas de combate.", capacity: 0, health: 0, upgradeCost: { metal: 600, plasma: 400, credits: 500 }, webpName: "hangar" },
  { id: "b9", type: "defense_turret", name: "TORRE DE DEFENSA", level: 0, description: "Defiende la base de ataques enemigos.", capacity: 0, health: 0, upgradeCost: { metal: 900, plasma: 300, credits: 400 }, webpName: "defense-turret" },
  { id: "empty_1", type: "empty", name: "CONSTRUIR", level: 0, description: "Espacio disponible para construir.", webpName: "empty" },
  { id: "empty_2", type: "empty", name: "CONSTRUIR", level: 0, description: "Espacio disponible para construir.", webpName: "empty" },
  { id: "empty_3", type: "empty", name: "CONSTRUIR", level: 0, description: "Espacio disponible para construir.", webpName: "empty" },
  { id: "empty_4", type: "empty", name: "CONSTRUIR", level: 0, description: "Espacio disponible para construir.", webpName: "empty" },
];

export const builtIds = new Set(["b1", "b2", "b3", "b4", "b5"]);
export const initialBuildings = allBuildings.filter((b) => builtIds.has(b.id) || b.type === "empty");

export const fmt = (n: number) => new Intl.NumberFormat("es-AR").format(n);
export const pct = (v: number, m: number) => (!m ? 0 : Math.min(100, Math.max(0, (v / m) * 100)));
