import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");

const BASE_DIR = "C:/Users/Mi Pc/Desktop/MERCADOLIBRE CUENTA NUEVA";
const SKU_PREFIX = "MADSJEEZ";

function generateDescription(title: string): string {
  const lower = title.toLowerCase();
  let specs = "";

  if (lower.includes("aceite")) {
    specs = "- Formulación premium de alta resistencia\n- Compatible con múltiples marcas\n- Prolonga la vida útil del motor\n- Excelente rendimiento en altas temperaturas";
  } else if (lower.includes("carburador") || lower.includes("bujía") || lower.includes("repuesto") || lower.includes("desmalezadora") || lower.includes("motosierra")) {
    specs = "- Repuesto original de alta calidad\n- Compatibilidad garantizada\n- Materiales resistentes al desgaste\n- Instalación directa, sin modificaciones";
  } else if (lower.includes("herramienta") || lower.includes("llave") || lower.includes("pinza") || lower.includes("destornillador")) {
    specs = "- Fabricado en acero cromo vanadio\n- Mango ergonómico antideslizante\n- Resistencia profesional\n- Ideal para uso intensivo";
  } else if (lower.includes("tanque") || lower.includes("tapa") || lower.includes("cubre")) {
    specs = "- Material resistente a impactos\n- Ajuste perfecto, sellado hermético\n- Resistente a combustibles y solventes\n- Durabilidad garantizada";
  } else if (lower.includes("manguera") || lower.includes("tubo") || lower.includes("cable")) {
    specs = "- Material reforzado de alta resistencia\n- Flexible y durable\n- Resistente a presión y temperatura\n- Longitud óptima para múltiples usos";
  } else if (lower.includes("arnés") || lower.includes("cinto") || lower.includes("protección")) {
    specs = "- Diseño ergonómico para máxima comodidad\n- Materiales resistentes y transpirables\n- Ajuste universal con hebillas reforzadas\n- Seguridad certificada para trabajo profesional";
  } else if (lower.includes("tractor") || lower.includes("motor") || lower.includes("bomba")) {
    specs = "- Potencia profesional garantizada\n- Componentes de alta durabilidad\n- Mantenimiento sencillo\n- Ideal para trabajos exigentes";
  } else if (lower.includes("disco") || lower.includes("cadena") || lower.includes("mecha") || lower.includes("broca")) {
    specs = "- Filo de alto rendimiento\n- Material endurecido profesional\n- Compatible con equipos estándar\n- Larga vida útil de corte";
  } else {
    specs = "- Material de primera calidad\n- Resistencia y durabilidad profesional\n- Ideal para uso intensivo\n- Producto garantizado por MadsJeez";
  }

  return `# ${title}

${title} de alta calidad, ideal para uso profesional y doméstico. Producto seleccionado por MadsJeez para ofrecerte el mejor rendimiento.

## Características principales
${specs}

## Garantía
Garantía de fábrica de **60 días**. Todos nuestros productos pasan por controles de calidad antes de ser despachados.

## Envío
Envío a todo el país. Retiro en sucursal disponible. Consultá opciones al finalizar tu compra.

¿Tenés dudas? Contactanos por WhatsApp o chat y te asesoramos. Tu satisfacción es nuestra prioridad en MadsJeez.`;
}

async function uploadImages(folderPath: string): Promise<string[]> {
  const files = fs.readdirSync(folderPath).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).slice(0, 10);
  const urls: string[] = [];
  for (const file of files) {
    const fileName = `bulk-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const fileBuffer = fs.readFileSync(path.join(folderPath, file));
    const ext = path.extname(file).toLowerCase();
    const ct = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    const { error } = await supabase.storage.from("product-images").upload(fileName, fileBuffer, { contentType: ct });
    if (!error) {
      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
      if (data?.publicUrl) urls.push(data.publicUrl);
    }
  }
  return urls;
}

async function main() {
  // 1. Get or create seller
  const { data: existingSeller } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", "vianferreteria@gmail.com")
    .maybeSingle();

  let sellerId = existingSeller?.id;
  if (!sellerId) {
    sellerId = randomUUID();
    const { error: createErr } = await supabase.from("profiles").insert({
      id: sellerId,
      email: "vianferreteria@gmail.com",
      name: "Vian Ferreteria",
      is_seller: true,
      seller_name: "Vian Ferreteria",
      is_active: true,
      created_at: new Date().toISOString(),
    });
    if (createErr) {
      console.error("Failed to create seller:", createErr);
      throw createErr;
    }
    console.log("Created seller:", sellerId);
  } else {
    console.log("Using existing seller:", sellerId);
  }

  // 2. Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some(b => b.name === "product-images")) {
    await supabase.storage.createBucket("product-images", { public: true, fileSizeLimit: 5242880 });
    console.log("Created bucket: product-images");
  }

  // 3. DELETE all existing products from this seller
  const { data: existingProducts } = await supabase
    .from("products")
    .select("id")
    .eq("seller_id", sellerId);

  if (existingProducts && existingProducts.length > 0) {
    console.log(`Deleting ${existingProducts.length} existing products...`);
    for (const p of existingProducts) {
      await supabase.from("product_images").delete().eq("product_id", p.id);
      await supabase.from("product_attributes").delete().eq("product_id", p.id);
    }
    await supabase.from("products").delete().eq("seller_id", sellerId);
    console.log("Deleted existing products.");
  }

  // 4. Get default category
  const { data: categories } = await supabase.from("categories").select("id, name").limit(1);
  let categoryId = categories?.[0]?.id;
  if (!categoryId) {
    categoryId = randomUUID();
    await supabase.from("categories").insert({ id: categoryId, name: "General", slug: "general", description: "General" });
  }

  // 5. Find last SKU
  const { data: lastSku } = await supabase
    .from("products")
    .select("sku")
    .ilike("sku", `${SKU_PREFIX}-%`)
    .order("sku", { ascending: false })
    .limit(1);

  let skuCounter = 1;
  if (lastSku?.[0]?.sku) {
    const m = lastSku[0].sku.match(/MADSJEEZ-(\d+)/);
    if (m) skuCounter = parseInt(m[1]) + 1;
  }

  // 6. Collect folders
  const folders = fs.readdirSync(BASE_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => ({ name: d.name, path: path.join(BASE_DIR, d.name) }))
    .filter(f => fs.readdirSync(f.path).some(file => /\.(jpg|jpeg|png|webp)$/i.test(file)));

  console.log(`Found ${folders.length} folders with images. Starting at SKU ${SKU_PREFIX}-${String(skuCounter).padStart(6, "0")}`);

  const total = folders.length;
  let created = 0;

  for (const folder of folders) {
    const title = folder.name.trim();
    const sku = `${SKU_PREFIX}-${String(skuCounter).padStart(6, "0")}`;
    console.log(`[${created + 1}/${total}] Processing: ${title}`);

    const description = generateDescription(title);
    const imageUrls = await uploadImages(folder.path);

    const productId = randomUUID();
    const now = new Date().toISOString();

    // Insert product
    const { error: prodErr } = await supabase.from("products").insert({
      id: productId,
      title,
      description,
      price: 79999,
      stock: 100,
      sku,
      condition: "new",
      is_active: true,
      seller_id: sellerId,
      category_id: categoryId,
      created_at: now,
      updated_at: now,
    });

    if (prodErr) {
      console.error(`  FAILED product insert:`, prodErr);
      skuCounter++;
      continue;
    }

    // Insert images
    if (imageUrls.length > 0) {
      const imageRows = imageUrls.map((url, i) => ({
        id: randomUUID(),
        url,
        order: i,
        product_id: productId,
      }));
      await supabase.from("product_images").insert(imageRows);
    }

    // Insert attributes (skip if table schema differs)
    try {
      await supabase.from("product_attributes").insert([
        { id: randomUUID(), name: "Garantía", value: "60 días de fábrica", product_id: productId },
        { id: randomUUID(), name: "Tipo de factura", value: "Consumidor Final", product_id: productId },
        { id: randomUUID(), name: "Cuotas", value: "Sin cuotas adicionales", product_id: productId },
      ]);
    } catch (attrErr) {
      console.error("  Attributes insert failed (non-critical):", attrErr);
    }

    console.log(`  Created: ${productId} with ${imageUrls.length} images`);
    created++;
    skuCounter++;

    // Small delay to avoid overwhelming Supabase storage API
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`Done! Created ${created}/${total} products.`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
