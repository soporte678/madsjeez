#!/usr/bin/env node
/**
 * seo-export-inventory.mjs
 *
 * Regenera docs/seo-page-inventory.csv desde la base de datos real.
 * Decide index_status según el gate de inventario (≥5 productos en stock).
 *
 * Uso:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/seo-export-inventory.mjs
 */

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const URL = process.env.SUPABASE_URL || "https://doweovsukuskflgnxhhn.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error("Falta SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const MIN_INDEX = 5;
const sb = createClient(URL, KEY);

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, "''")}"` : s;
}

async function main() {
  const { data: cats, error: e1 } = await sb
    .from("categories")
    .select("id, name, slug, parent_id");
  if (e1) throw e1;
  const { data: stock, error: e2 } = await sb
    .from("products")
    .select("category_id")
    .eq("is_active", true)
    .gt("stock", 0)
    .limit(20000);
  if (e2) throw e2;

  const byCat = new Map();
  for (const r of stock || []) {
    if (r.category_id) byCat.set(r.category_id, (byCat.get(r.category_id) || 0) + 1);
  }
  const nameById = new Map((cats || []).map((c) => [c.id, c.name]));

  const header = [
    "page_type", "name", "slug", "parent_category", "primary_keyword",
    "secondary_keywords", "search_intent", "product_count", "seller_count",
    "unique_content_available", "index_status", "canonical_url", "priority",
    "publication_phase", "notes",
  ];

  const rows = (cats || [])
    .map((c) => {
      const count = byCat.get(c.id) || 0;
      return { c, count };
    })
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count)
    .map(({ c, count }) => {
      const status = count >= MIN_INDEX ? "INDEX" : "NOINDEX";
      const phase = count >= 10 ? "A" : count >= MIN_INDEX ? "B" : "C";
      const priority = count >= 10 ? "0.8" : count >= MIN_INDEX ? "0.6" : "0.3";
      return [
        c.parent_id ? "subcategory" : "category",
        csvCell(c.name),
        c.slug,
        csvCell(nameById.get(c.parent_id) || ""),
        csvCell(String(c.name).toLowerCase()),
        "",
        "transactional",
        count,
        1,
        count >= MIN_INDEX ? "yes" : "partial",
        status,
        `https://www.madsjeez.com.ar/category/${c.slug}`,
        priority,
        phase,
        count >= MIN_INDEX ? "ok" : "sube a INDEX al llegar a 5",
      ].join(",");
    });

  const out = [header.join(","), ...rows].join("\n") + "\n";
  const file = path.resolve(process.cwd(), "docs/seo-page-inventory.csv");
  fs.writeFileSync(file, out, "utf8");
  console.log(`✓ ${rows.length} categorías con productos → ${file}`);
  console.log(`  INDEX: ${rows.filter((r) => r.includes(",INDEX,")).length} · NOINDEX: ${rows.filter((r) => r.includes(",NOINDEX,")).length}`);
}

main().catch((e) => {
  console.error("ERROR:", e.message || e);
  process.exit(1);
});
