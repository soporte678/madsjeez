import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const BASE_DIR = "C:/Users/Mi Pc/Desktop/MERCADOLIBRE CUENTA NUEVA";
const SKU_PREFIX = "MADSJEEZ";

function generateDescription(title: string): string {
  return `# ${title}\n\n${title} de alta calidad. Producto disponible en MadsJeez con envío a todo el país.`;
}

async function main() {
  // Get seller
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("email", "vianferreteria@gmail.com")
    .maybeSingle();
  if (!user) { console.error("No user"); return; }
  const sellerId = user.id;
  console.log("Seller:", sellerId);

  // Get category
  const { data: cat } = await supabase.from("categories").select("id").limit(1).single();
  if (!cat) { console.error("No category"); return; }

  // Get last SKU
  const { data: lastSku } = await supabase.from("products").select("sku").ilike("sku", `${SKU_PREFIX}-%`).order("sku", { ascending: false }).limit(1);
  let skuCounter = 1;
  if (lastSku?.[0]?.sku) { const m = lastSku[0].sku.match(/MADSJEEZ-(\d+)/); if (m) skuCounter = parseInt(m[1]) + 1; }

  // Get first 3 folders
  const folders = fs.readdirSync(BASE_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => ({ name: d.name, path: path.join(BASE_DIR, d.name) }))
    .filter(f => fs.readdirSync(f.path).some(file => /\.(jpg|jpeg|png|webp)$/i.test(file)))
    .slice(0, 3);

  console.log(`Testing ${folders.length} folders...`);

  for (const folder of folders) {
    const title = folder.name.trim();
    const sku = `${SKU_PREFIX}-${String(skuCounter).padStart(6, "0")}`;
    const productId = randomUUID();

    // Upload 1 image
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

    const { error: prodErr } = await supabase.from("products").insert({
      id: productId, title, description: generateDescription(title), price: 79999, stock: 100, sku,
      condition: "new", is_active: true, seller_id: sellerId, category_id: cat.id,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });

    if (prodErr) { console.error(`FAILED ${sku}:`, prodErr); continue; }

    if (urls.length > 0) {
      await supabase.from("product_images").insert(urls.map((url, i) => ({
        id: randomUUID(), url, order: i, product_id: productId,
      })));
    }

    console.log(`OK: ${sku} - ${title} (${urls.length} images)`);
    skuCounter++;
  }

  console.log("Test done!");
}

main().catch(console.error);
