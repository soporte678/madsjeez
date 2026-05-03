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

async function main() {
  // Get seller
  const { data: user } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", "vianferreteria@gmail.com")
    .maybeSingle();

  if (!user) {
    console.error("User not found");
    return;
  }
  console.log("Seller ID:", user.id);

  // Get category
  const { data: cat } = await supabase.from("categories").select("id").limit(1).single();
  if (!cat) {
    console.error("No category found");
    return;
  }

  // Get first folder with images
  const folders = fs
    .readdirSync(BASE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({ name: d.name, path: path.join(BASE_DIR, d.name) }))
    .filter((f) => fs.readdirSync(f.path).some((file) => /\.(jpg|jpeg|png|webp)$/i.test(file)))
    .slice(0, 1);

  if (folders.length === 0) {
    console.error("No folders found");
    return;
  }

  const folder = folders[0];
  const title = folder.name.trim();
  const productId = randomUUID();

  // Insert product
  const { error: prodErr } = await supabase.from("products").insert({
    id: productId,
    title,
    description: `${title}. Producto de calidad.`,
    price: 79999,
    stock: 100,
    sku: `MADSJEEZ-TEST001`,
    condition: "new",
    is_active: true,
    seller_id: user.id,
    category_id: cat.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (prodErr) {
    console.error("Product insert FAILED:", prodErr);
    return;
  }

  console.log("SUCCESS! Product inserted:", productId);

  // Clean up test product
  await supabase.from("products").delete().eq("id", productId);
  console.log("Test product cleaned up.");
}

main().catch(console.error);
