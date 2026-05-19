/**
 * Ejecuta sync de precios Konecta (Supabase REST + catálogo embebido).
 * CI: .github/workflows/konecta-price-sync.yml
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import catalogData from "../src/data/konecta-catalog-abril-2026.json";
import {
  buildCatalogIndexes,
  findCatalogMatch,
  salePriceFromCost,
  type KonectaCatalogItem,
} from "../src/lib/konecta/catalog";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const SELLER_EMAIL = "vianferreteria@gmail.com";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

async function main() {
  const dryRun =
    process.env.KONECTA_DRY_RUN === "true" || process.argv.includes("--dry-run");
  const markup = parseFloat(process.env.KONECTA_MARKUP || "1.5");
  const supabase = getSupabase();
  const catalog = catalogData as KonectaCatalogItem[];
  const indexes = buildCatalogIndexes(catalog);

  console.log("Supabase:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("Catálogo:", catalog.length, "ítems");
  console.log(dryRun ? "Modo: dry-run" : "Modo: ACTUALIZACIÓN REAL");

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
    description: string | null;
  }[] = [];

  let from = 0;
  const pageSize = 500;
  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("id, title, sku, price, description")
      .eq("seller_id", seller.id)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    products.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const attrByProduct = new Map<string, string>();
  const ids = products.map((p) => p.id);
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const { data: attrs } = await supabase
      .from("product_attributes")
      .select("product_id, name, value")
      .in("product_id", chunk);
    for (const row of attrs || []) {
      const prev = attrByProduct.get(row.product_id) || "";
      attrByProduct.set(row.product_id, `${prev} ${row.name} ${row.value}`.trim());
    }
  }

  console.log("Productos del vendedor:", products.length);

  let updated = 0;
  let skipped = 0;
  const unmatched: { id: string; title: string; sku: string | null }[] = [];

  for (const product of products) {
    const match = findCatalogMatch(
      {
        title: product.title,
        sku: product.sku,
        description: product.description,
        attrText: attrByProduct.get(product.id),
      },
      catalog,
      indexes
    );

    if (!match) {
      skipped++;
      unmatched.push({ id: product.id, title: product.title, sku: product.sku });
      continue;
    }

    const newPrice = salePriceFromCost(match.cost, markup);
    const newCompare = match.cost;

    if (!dryRun) {
      const { error: updErr } = await supabase
        .from("products")
        .update({
          price: newPrice,
          compare_price: newCompare,
          original_price: newCompare,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id);
      if (updErr) {
        console.error("Error", product.id, updErr.message);
        continue;
      }
    }
    updated++;
  }

  const result = {
    seller: SELLER_EMAIL,
    catalogItems: catalog.length,
    productsTotal: products.length,
    updated,
    skipped,
    markup,
    dryRun,
    unmatched: unmatched.slice(0, 200),
  };

  const reportPath = path.join(process.cwd(), "scripts", "konecta-price-update-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));

  console.log("Actualizados:", updated);
  console.log("Sin match:", skipped);
  console.log("Reporte:", reportPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
