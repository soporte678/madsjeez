import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");

const BASE_DIR = "C:/Users/Mi Pc/Desktop/MERCADOLIBRE CUENTA NUEVA";
const SKU_PREFIX = "MADSJEEZ";

async function main() {
  // 1. Check seller
  const { data: existingSeller } = await supabase.from("profiles").select("id, email").eq("email", "vianferreteria@gmail.com").maybeSingle();
  let sellerId = existingSeller?.id;
  if (!sellerId) {
    sellerId = randomUUID();
    const { error } = await supabase.from("profiles").insert({
      id: sellerId, email: "vianferreteria@gmail.com", name: "Vian Ferreteria", is_seller: true, subscription_tier: "FREE",
    });
    if (error) { console.error("Create seller failed:", error); return; }
    console.log("Created seller:", sellerId);
  } else {
    console.log("Existing seller:", sellerId);
  }

  // 2. Ensure bucket
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some(b => b.name === "product-images")) {
    await supabase.storage.createBucket("product-images", { public: true, fileSizeLimit: 5242880 });
    console.log("Created bucket");
  }

  // 3. Get category
  const { data: cats } = await supabase.from("categories").select("id").limit(1);
  let categoryId = cats?.[0]?.id;
  if (!categoryId) {
    categoryId = randomUUID();
    await supabase.from("categories").insert({ id: categoryId, name: "General", slug: "general", description: "General" });
  }

  // 4. Get last SKU
  const { data: lastSku } = await supabase.from("products").select("sku").ilike("sku", `${SKU_PREFIX}-%`).order("sku", { ascending: false }).limit(1);
  let skuCounter = 1;
  if (lastSku?.[0]?.sku) { const m = lastSku[0].sku.match(/MADSJEEZ-(\d+)/); if (m) skuCounter = parseInt(m[1]) + 1; }

  // 5. Get first 5 folders
  const folders = fs.readdirSync(BASE_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => ({ name: d.name, path: path.join(BASE_DIR, d.name) }))
    .filter(f => fs.readdirSync(f.path).some(file => /\.(jpg|jpeg|png|webp)$/i.test(file)))
    .slice(0, 5);

  console.log(`Testing ${folders.length} folders...`);

  for (const folder of folders) {
    const title = folder.name.trim();
    const sku = `${SKU_PREFIX}-${String(skuCounter).padStart(6, "0")}`;
    console.log(`Processing: ${title} (${sku})`);

    // Upload first image only for test speed
    const files = fs.readdirSync(folder.path).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).slice(0, 1);
    const urls: string[] = [];
    for (const file of files) {
      const fileName = `bulk-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const fileBuffer = fs.readFileSync(path.join(folder.path, file));
      const ext = path.extname(file).toLowerCase();
      const ct = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
      const { error } = await supabase.storage.from("product-images").upload(fileName, fileBuffer, { contentType: ct });
      if (!error) {
        const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
        if (data?.publicUrl) urls.push(data.publicUrl);
      }
    }

    const productId = randomUUID();
    const desc = `${title}. Producto de calidad para uso profesional y doméstico.`;
    const { error: prodErr } = await supabase.from("products").insert({
      id: productId, title, description: desc, price: 79999, stock: 100, sku,
      condition: "new", is_active: true, seller_id: sellerId, category_id: categoryId,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });

    if (prodErr) { console.error("FAILED:", prodErr); continue; }

    if (urls.length > 0) {
      await supabase.from("product_images").insert(urls.map((url, i) => ({ id: randomUUID(), url, order: i, product_id: productId })));
    }
    await supabase.from("product_attributes").insert([
      { id: randomUUID(), name: "Garantía", value: "60 días de fábrica", product_id: productId },
      { id: randomUUID(), name: "Tipo de factura", value: "Consumidor Final", product_id: productId },
    ]);

    console.log(`  OK: ${productId} with ${urls.length} images`);
    skuCounter++;
  }

  console.log("Test complete!");
}

main().catch(console.error);
