import "server-only";
import { icons, type LucideIcon } from "lucide-react";
import {
  CATEGORY_ICON_NAMES,
  CATEGORY_ICON_SET,
} from "@/lib/category-icon-names";
import { MELI_CATEGORIES, slugifyCategory } from "@/lib/seed-categories";

export type CategoryVisual = {
  Icon: LucideIcon;
  accent: string;
  ring: string;
  iconName: string;
};

const ACCENTS = [
  "text-sky-300",
  "text-orange-300",
  "text-cyan-200",
  "text-amber-200",
  "text-fuchsia-200",
  "text-rose-200",
  "text-violet-200",
  "text-emerald-200",
  "text-lime-200",
  "text-yellow-100",
  "text-teal-200",
  "text-indigo-200",
  "text-pink-200",
  "text-blue-100",
  "text-red-200",
  "text-green-200",
];

const RINGS = [
  "from-sky-400/20 to-blue-500/10",
  "from-orange-400/20 to-amber-500/10",
  "from-cyan-400/20 to-slate-500/10",
  "from-amber-300/20 to-yellow-500/10",
  "from-fuchsia-400/20 to-pink-500/10",
  "from-rose-400/20 to-orange-500/10",
  "from-violet-400/20 to-fuchsia-500/10",
  "from-emerald-400/20 to-cyan-500/10",
  "from-lime-400/20 to-emerald-500/10",
  "from-yellow-400/20 to-orange-500/10",
  "from-teal-400/20 to-cyan-500/10",
  "from-indigo-400/20 to-sky-500/10",
];

const MAIN_ICON_NAMES: Record<string, string> = {
  "accesorios-para-vehiculos": "Car",
  agro: "Sprout",
  "alimentos-y-bebidas": "Apple",
  "animales-y-mascotas": "PawPrint",
  "antiguedades-y-colecciones": "Gem",
  "arte-libreria-y-merceria": "Palette",
  "autos-motos-y-otros": "CarFront",
  bebes: "Baby",
  "belleza-y-cuidado-personal": "Sparkles",
  "camaras-y-accesorios": "Camera",
  "celulares-y-telefonia": "Smartphone",
  computacion: "Laptop",
  "consolas-y-videojuegos": "Gamepad2",
  construccion: "HardHat",
  "deportes-y-fitness": "Dumbbell",
  "electrodomesticos-y-aires": "Wind",
  "electronica-audio-y-video": "Tv",
  "entradas-para-eventos": "Ticket",
  herramientas: "Wrench",
  "hogar-muebles-y-jardin": "Home",
  "industrias-y-oficinas": "Factory",
  inmuebles: "Building2",
  "instrumentos-musicales": "Music",
  "joyas-y-relojes": "Watch",
  "juegos-y-juguetes": "ToyBrick",
  "libros-revistas-y-comics": "BookOpen",
  "musica-peliculas-y-series": "Film",
  "ropa-y-accesorios": "Shirt",
  "salud-y-equipamiento-medico": "HeartPulse",
  servicios: "Truck",
  "souvenirs-cotillon-y-fiestas": "PartyPopper",
  otros: "MoreHorizontal",
};

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (Math.imul(31, h) + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function lucideByName(name: string): LucideIcon {
  return (icons[name as keyof typeof icons] as LucideIcon) || icons.Package;
}

function pickLucideIcon(slug: string, used: Set<string>): { Icon: LucideIcon; name: string } {
  const preferred = MAIN_ICON_NAMES[slug];
  if (preferred && CATEGORY_ICON_SET.has(preferred) && !used.has(preferred)) {
    used.add(preferred);
    return { Icon: lucideByName(preferred), name: preferred };
  }

  const start = hashSlug(slug) % CATEGORY_ICON_NAMES.length;
  for (let i = 0; i < CATEGORY_ICON_NAMES.length; i++) {
    const name = CATEGORY_ICON_NAMES[(start + i) % CATEGORY_ICON_NAMES.length];
    if (!used.has(name)) {
      used.add(name);
      return { Icon: lucideByName(name), name };
    }
  }

  const fallback = CATEGORY_ICON_NAMES[hashSlug(slug) % CATEGORY_ICON_NAMES.length];
  return { Icon: lucideByName(fallback), name: fallback };
}

function buildRegistry(): Map<string, CategoryVisual> {
  const map = new Map<string, CategoryVisual>();
  const usedIcons = new Set<string>();

  for (const cat of MELI_CATEGORIES) {
    const h = hashSlug(cat.slug);
    const { Icon, name } = pickLucideIcon(cat.slug, usedIcons);
    map.set(cat.slug, {
      Icon,
      accent: ACCENTS[h % ACCENTS.length],
      ring: RINGS[h % RINGS.length],
      iconName: name,
    });
  }

  for (const cat of MELI_CATEGORIES) {
    for (const childName of cat.children) {
      const slug = `${cat.slug}-${slugifyCategory(childName)}`;
      if (map.has(slug)) continue;
      const h = hashSlug(slug);
      const { Icon, name } = pickLucideIcon(slug, usedIcons);
      map.set(slug, {
        Icon,
        accent: ACCENTS[h % ACCENTS.length],
        ring: RINGS[(h + 3) % RINGS.length],
        iconName: name,
      });
    }
  }

  return map;
}

const REGISTRY = buildRegistry();

export function getCategoryVisual(slug: string): CategoryVisual {
  const hit = REGISTRY.get(slug);
  if (hit) return hit;

  const h = hashSlug(slug);
  const fallbackName = CATEGORY_ICON_NAMES[h % CATEGORY_ICON_NAMES.length];
  return {
    Icon: lucideByName(fallbackName),
    accent: ACCENTS[h % ACCENTS.length],
    ring: RINGS[h % RINGS.length],
    iconName: fallbackName,
  };
}

export function getRegistrySize(): number {
  return REGISTRY.size;
}
