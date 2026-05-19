/**
 * Actualiza precios de vianferreteria@gmail.com según catálogo Konecta Abril 2026.
 * Precio venta = costo × (1 + markup), default markup 1.5 (= 150% sobre costo).
 *
 * Uso:
 *   npx tsx scripts/update-konecta-prices.ts
 *   npx tsx scripts/update-konecta-prices.ts --dry-run
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

function getSupabase() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local");
  }
  return createClient(supabaseUrl, supabaseKey);
}

const PDF_PATH =
  process.env.KONECTA_PDF_PATH ||
  "C:/Users/Mi Pc/Desktop/Catalogo Abril 2026 Konecta Repuestos.pdf";
const SELLER_EMAIL = "vianferreteria@gmail.com";
const MARKUP = parseFloat(process.env.KONECTA_MARKUP || "1.5");
const DRY_RUN = process.argv.includes("--dry-run");
const PARSE_ONLY = process.argv.includes("--parse-only");

type CatalogItem = {
  sku: string;
  title: string;
  cost: number;
};

function parsePrice(raw: string): number {
  const cleaned = raw.replace(/^\$/, "").replace(/\./g, "").replace(/,/g, ".").trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
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

function parseCatalogFromPdfText(text: string): CatalogItem[] {
  const lines = text.split(/\r?\n/);
  const items: CatalogItem[] = [];
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

function extractKonectaSkuFromText(text: string): string | null {
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

function salePrice(cost: number): number {
  return Math.round(cost * (1 + MARKUP));
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

function findBestTitleMatch(
  productText: string,
  catalog: CatalogItem[]
): CatalogItem | undefined {
  let best: CatalogItem | undefined;
  let bestScore = 0;
  for (const item of catalog) {
    const score = tokenOverlapScore(productText, item.title);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return bestScore >= 0.55 ? best : undefined;
}

async function extractPdfText(): Promise<string> {
  const cachePath = path.join(process.cwd(), "scripts", ".cache", "konecta-catalog-abril-2026.txt");
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath, "utf8");
  }
  const buffer = fs.readFileSync(PDF_PATH);
  const { text } = await pdfParse(buffer);
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, text, "utf8");
  return text;
}

async function main() {
  if (!fs.existsSync(PDF_PATH)) {
    console.error("PDF no encontrado:", PDF_PATH);
    process.exit(1);
  }

  const pdfText = await extractPdfText();
  const catalog = parseCatalogFromPdfText(pdfText);
  console.log(`Catálogo parseado: ${catalog.length} ítems con precio`);

  if (PARSE_ONLY) {
    console.log("Muestra:", catalog.slice(0, 5));
    fs.writeFileSync(
      path.join(process.cwd(), "scripts", ".cache", "konecta-catalog-parsed.json"),
      JSON.stringify(catalog, null, 2)
    );
    return;
  }

  const supabase = getSupabase();
  const bySku = new Map<string, CatalogItem>();
  const byTitle = new Map<string, CatalogItem>();
  for (const item of catalog) {
    bySku.set(item.sku, item);
    byTitle.set(normalizeTitle(item.title), item);
  }

  const { data: seller, error: sellerErr } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", SELLER_EMAIL)
    .maybeSingle();

  if (sellerErr || !seller) {
    console.error("Vendedor no encontrado:", SELLER_EMAIL, sellerErr?.message);
    process.exit(1);
  }

  const products: {
    id: string;
    title: string;
    sku: string | null;
    price: number;
    compare_price: number | null;
    description?: string | null;
  }[] = [];
  const pageSize = 500;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("id, title, sku, price, compare_price, description")
      .eq("seller_id", seller.id)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    products.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const productIds = products.map((p) => p.id);
  const attrByProduct = new Map<string, string[]>();
  for (let i = 0; i < productIds.length; i += 200) {
    const chunk = productIds.slice(i, i + 200);
    const { data: attrs } = await supabase
      .from("product_attributes")
      .select("product_id, name, value")
      .in("product_id", chunk);
    for (const row of attrs || []) {
      const list = attrByProduct.get(row.product_id) || [];
      list.push(`${row.name} ${row.value}`);
      attrByProduct.set(row.product_id, list);
    }
  }
  console.log(`Productos del vendedor: ${products.length}`);
  console.log(`Markup: ${MARKUP * 100}% sobre costo → precio = costo × ${1 + MARKUP}`);

  let updated = 0;
  let skipped = 0;
  const unmatched: { id: string; title: string; sku: string | null }[] = [];

  for (const product of products) {
    let match: CatalogItem | undefined;

    if (product.sku) {
      const direct = normalizeSku(product.sku);
      match = bySku.get(direct);
      if (!match && direct.includes("-")) {
        const parts = direct.split("-");
        const tail = parts[parts.length - 1];
        if (/^\d/.test(tail)) match = bySku.get(normalizeSku(tail));
      }
    }

    if (!match) {
      const attrText = (attrByProduct.get(product.id) || []).join(" ");
      const fromTitle = extractKonectaSkuFromText(
        `${product.title} ${product.sku || ""} ${attrText} ${product.description || ""}`
      );
      if (fromTitle) match = bySku.get(fromTitle);
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
      match = findBestTitleMatch(
        `${product.title} ${attrByProduct.get(product.id)?.join(" ") || ""}`,
        catalog
      );
    }

    if (!match) {
      skipped++;
      unmatched.push({ id: product.id, title: product.title, sku: product.sku });
      continue;
    }

    const newPrice = salePrice(match.cost);
    const newCompare = match.cost;

    if (DRY_RUN) {
      console.log(
        `[dry] ${product.sku || "?"} | ${match.sku} | $${product.price} → $${newPrice} (costo $${match.cost}) | ${product.title.slice(0, 50)}`
      );
      updated++;
      continue;
    }

    const { error: updErr } = await supabase
      .from("products")
      .update({
        price: newPrice,
        compare_price: newCompare,
        original_price: newCompare,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);
    if (updErr) console.error("Error actualizando", product.id, updErr.message);
    updated++;
  }

  const reportPath = path.join(process.cwd(), "scripts", "konecta-price-update-report.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        seller: SELLER_EMAIL,
        catalogItems: catalog.length,
        productsTotal: products.length,
        updated,
        skipped,
        markup: MARKUP,
        dryRun: DRY_RUN,
        unmatched: unmatched.slice(0, 200),
      },
      null,
      2
    )
  );

  console.log(`\nActualizados: ${updated}`);
  console.log(`Sin match: ${skipped}`);
  console.log(`Reporte: ${reportPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
