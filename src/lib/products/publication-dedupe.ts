import { normalizeImportSku, normalizeImportTitle } from "@/lib/meli/dedupe";

export type PublicationRow = {
  id: string;
  title: string;
  sku: string | null;
  price: number;
  sales?: number;
  views?: number;
  meliItemId?: string | null;
  createdAt?: Date;
};

export type DuplicateGroup = {
  keepId: string;
  removeIds: string[];
  matchFields: ("title" | "sku" | "price")[];
};

const PRICE_EPS = 0.01;

function pricesMatch(a: number, b: number): boolean {
  return Math.abs(a - b) <= PRICE_EPS;
}

function titlesMatch(a: string, b: string): boolean {
  const na = normalizeImportTitle(a);
  const nb = normalizeImportTitle(b);
  return Boolean(na && nb && na === nb);
}

function skusMatch(a: string | null, b: string | null): boolean {
  const sa = normalizeImportSku(a);
  const sb = normalizeImportSku(b);
  return Boolean(sa && sb && sa === sb);
}

/** Cuántos de título / SKU / precio coinciden entre dos publicaciones. */
export function publicationMatchScore(a: PublicationRow, b: PublicationRow): number {
  let score = 0;
  if (titlesMatch(a.title, b.title)) score++;
  if (skusMatch(a.sku, b.sku)) score++;
  if (pricesMatch(a.price, b.price)) score++;
  return score;
}

function matchFieldsBetween(a: PublicationRow, b: PublicationRow): ("title" | "sku" | "price")[] {
  const fields: ("title" | "sku" | "price")[] = [];
  if (titlesMatch(a.title, b.title)) fields.push("title");
  if (skusMatch(a.sku, b.sku)) fields.push("sku");
  if (pricesMatch(a.price, b.price)) fields.push("price");
  return fields;
}

/** Prioridad para conservar: MLA vinculado, más ventas, más antiguo. */
function keepScore(p: PublicationRow): number {
  let s = 0;
  if (p.meliItemId) s += 1_000_000;
  s += (p.sales ?? 0) * 1000;
  s += p.views ?? 0;
  if (p.createdAt) s -= p.createdAt.getTime() / 1_000_000_000;
  return s;
}

class UnionFind {
  parent: Map<string, string> = new Map();

  find(id: string): string {
    if (!this.parent.has(id)) this.parent.set(id, id);
    let root = id;
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root)!;
    }
    let cur = id;
    while (cur !== root) {
      const next = this.parent.get(cur)!;
      this.parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(rb, ra);
  }
}

/**
 * Agrupa publicaciones donde al menos 2 de (título, SKU, precio) coinciden.
 * Devuelve qué conservar y qué eliminar por grupo.
 */
export function findPublicationDuplicateGroups(products: PublicationRow[]): DuplicateGroup[] {
  if (products.length < 2) return [];

  const uf = new UnionFind();
  for (const p of products) uf.find(p.id);

  for (let i = 0; i < products.length; i++) {
    for (let j = i + 1; j < products.length; j++) {
      if (publicationMatchScore(products[i]!, products[j]!) >= 2) {
        uf.union(products[i]!.id, products[j]!.id);
      }
    }
  }

  const byRoot = new Map<string, PublicationRow[]>();
  for (const p of products) {
    const root = uf.find(p.id);
    const list = byRoot.get(root) || [];
    list.push(p);
    byRoot.set(root, list);
  }

  const groups: DuplicateGroup[] = [];

  for (const members of byRoot.values()) {
    if (members.length < 2) continue;
    const sorted = [...members].sort((a, b) => keepScore(b) - keepScore(a));
    const keep = sorted[0]!;
    const removeIds = sorted.slice(1).map((p) => p.id);
    const ref = keep;
    const sample = sorted[1]!;
    groups.push({
      keepId: keep.id,
      removeIds,
      matchFields: matchFieldsBetween(ref, sample),
    });
  }

  return groups;
}

export function flattenIdsToRemove(groups: DuplicateGroup[]): string[] {
  return [...new Set(groups.flatMap((g) => g.removeIds))];
}
