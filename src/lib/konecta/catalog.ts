export type KonectaCatalogItem = {
  sku: string;
  title: string;
  cost: number;
};

export function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase().replace(/\s+/g, "");
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function parsePrice(raw: string): number {
  const cleaned = raw.replace(/^\$/, "").replace(/\./g, "").replace(/,/g, ".").trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

function isSkuLine(line: string): boolean {
  const t = line.trim();
  if (!t || t.length < 4 || t.length > 32) return false;
  if (/^www\.|página|repuestos|índice|catálogo|--\s*\d/i.test(t)) return false;
  if (/^\d{1,2}$/.test(t) || /^\d{1,2}-\d{1,2}$/.test(t)) return false;
  if (!/^[\w-]+$/i.test(t) || !/\d/.test(t)) return false;
  return (
    /^([A-Za-z]{1,4}-?)?\d{4,}[\w-]*$/i.test(t) ||
    /^[A-Za-z]{2,}-[A-Z0-9][\w-]*$/i.test(t)
  );
}

function isPriceLine(line: string): boolean {
  return /^\$[\d.,]+$/.test(line.trim());
}

export function parseCatalogFromPdfText(text: string): KonectaCatalogItem[] {
  const lines = text.split(/\r?\n/);
  const items: KonectaCatalogItem[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!isSkuLine(line)) {
      i++;
      continue;
    }

    const sku = normalizeSku(line);
    const titleParts: string[] = [];
    i++;

    let guard = 0;
    while (i < lines.length && guard++ < 40) {
      const cur = lines[i].trim();
      if (isPriceLine(cur)) {
        const cost = parsePrice(cur);
        const title = titleParts.join(" ").replace(/\s+/g, " ").trim();
        if (title && Number.isFinite(cost) && cost > 0) {
          items.push({ sku, title, cost });
        }
        i++;
        break;
      }
      if (isSkuLine(cur)) break;
      if (cur) titleParts.push(cur);
      i++;
    }
    if (guard >= 40) i++;
  }

  return items;
}

export function buildCatalogIndexes(catalog: KonectaCatalogItem[]) {
  const bySku = new Map<string, KonectaCatalogItem>();
  const byTitle = new Map<string, KonectaCatalogItem>();
  for (const item of catalog) {
    bySku.set(item.sku, item);
    byTitle.set(normalizeTitle(item.title), item);
  }
  return { bySku, byTitle };
}

export function extractKonectaSkuFromText(text: string): string | null {
  const patterns = [
    /\b(RI-|KS|KN|KE|DH-|K|RI)?[\d]{4,5}(?:-[A-Z0-9]+)?\b/gi,
    /\b[A-Z]{1,3}-?\d{4,6}(?:-[A-Z0-9]+)?\b/gi,
  ];
  for (const re of patterns) {
    const matches = text.match(re);
    if (matches?.length) {
      const sorted = [...matches].sort((a, b) => b.length - a.length);
      for (const m of sorted) {
        const n = normalizeSku(m);
        if (n.length >= 4 && /[\d]/.test(n)) return n;
      }
    }
  }
  return null;
}

function tokenOverlapScore(a: string, b: string): number {
  const ta = new Set(
    normalizeTitle(a)
      .split(" ")
      .filter((w) => w.length > 2)
  );
  const tb = new Set(
    normalizeTitle(b)
      .split(" ")
      .filter((w) => w.length > 2)
  );
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const w of ta) if (tb.has(w)) inter++;
  return inter / Math.min(ta.size, tb.size);
}

export function findCatalogMatch(
  product: {
    title: string;
    sku: string | null;
    description?: string | null;
    attrText?: string;
  },
  catalog: KonectaCatalogItem[],
  indexes: ReturnType<typeof buildCatalogIndexes>
): KonectaCatalogItem | undefined {
  const { bySku, byTitle } = indexes;
  let match: KonectaCatalogItem | undefined;

  if (product.sku) {
    const direct = normalizeSku(product.sku);
    match = bySku.get(direct);
    if (!match && direct.includes("-")) {
      const parts = direct.split("-");
      const tail = parts[parts.length - 1];
      if (/^\d/.test(tail)) match = bySku.get(normalizeSku(tail));
    }
    if (!match && /^MADS?JEEZ-(\d+)$/i.test(direct)) {
      const num = direct.match(/^MADS?JEEZ-(\d+)$/i)?.[1];
      if (num) match = bySku.get(normalizeSku(num));
    }
  }

  if (!match) {
    const blob = `${product.title} ${product.sku || ""} ${product.attrText || ""} ${product.description || ""}`;
    const fromText = extractKonectaSkuFromText(blob);
    if (fromText) match = bySku.get(fromText);
  }

  if (!match) {
    const norm = normalizeTitle(product.title);
    match = byTitle.get(norm);
    if (!match) {
      for (const [key, item] of byTitle) {
        if (norm.includes(key) || key.includes(norm)) {
          if (key.length >= 12 || norm.length >= 12) {
            match = item;
            break;
          }
        }
      }
    }
  }

  if (!match) {
    let best: KonectaCatalogItem | undefined;
    let bestScore = 0;
    const text = `${product.title} ${product.attrText || ""}`;
    for (const item of catalog) {
      const score = tokenOverlapScore(text, item.title);
      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }
    if (bestScore >= 0.55) match = best;
  }

  return match;
}

export function salePriceFromCost(cost: number, markup = 1.5): number {
  return Math.round(cost * (1 + markup));
}
