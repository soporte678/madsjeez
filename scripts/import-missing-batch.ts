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
const BATCH_SIZE = 30;

function generateDescription(title: string): string {
  const lower = title.toLowerCase().replace(/^maqjeez-\d+\s*-\s*/i, "");
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

  return `# ${title}\n\n${title} de alta calidad, ideal para uso profesional y doméstico. Producto seleccionado por MadsJeez para ofrecerte el mejor rendimiento.\n\n## Características principales\n${specs}\n\n## Garantía\nGarantía de fábrica de **60 días**. Todos nuestros productos pasan por controles de calidad antes de ser despachados.\n\n## Envío\nEnvío a todo el país. Retiro en sucursal disponible. Consultá opciones al finalizar tu compra.\n\n¿Tenés dudas? Contactanos por WhatsApp o chat y te asesoramos. Tu satisfacción es nuestra prioridad en MadsJeez.`;
}

async function uploadImages(folderPath: string): Promise<string[]> {
  let files: string[];
  try {
    files = fs.readdirSync(folderPath).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).slice(0, 3);
  } catch {
    return [];
  }
  const urls: string[] = [];
  for (const file of files) {
    const fileName = `bulk-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const filePath = path.join(folderPath, file);
    let fileBuffer: Buffer;
    try {
      fileBuffer = fs.readFileSync(filePath);
    } catch {
      continue;
    }
    const ext = path.extname(file).toLowerCase();
    const ct = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    try {
      const { error } = await supabase.storage.from("product-images").upload(fileName, fileBuffer, { contentType: ct });
      if (!error) {
        const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
        if (data?.publicUrl) urls.push(data.publicUrl);
      }
    } catch {
      // Skip failed uploads
    }
  }
  return urls;
}

async function processBatch(
  folders: { name: string; path: string }[],
  sellerId: string,
  categoryId: string,
  startSku: number
) {
  let skuCounter = startSku;
  let created = 0;

  for (const folder of folders) {
    const title = folder.name;
    const sku = `${SKU_PREFIX}-${String(skuCounter).padStart(6, "0")}`;
    console.log(`[${created + 1}/${folders.length}] ${title}`);

    const description = generateDescription(title);
    const imageUrls = await uploadImages(folder.path);

    const productId = randomUUID();
    const now = new Date().toISOString();

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
      console.error(`  FAILED:`, prodErr.message);
      skuCounter++;
      continue;
    }

    if (imageUrls.length > 0) {
      const imageRows = imageUrls.map((url, i) => ({
        id: randomUUID(),
        url,
        order: i,
        product_id: productId,
      }));
      await supabase.from("product_images").insert(imageRows);
    }

    try {
      await supabase.from("product_attributes").insert([
        { id: randomUUID(), name: "Garantía", value: "60 días de fábrica", product_id: productId },
        { id: randomUUID(), name: "Tipo de factura", value: "Consumidor Final", product_id: productId },
        { id: randomUUID(), name: "Cuotas", value: "Sin cuotas adicionales", product_id: productId },
      ]);
    } catch {
      // Ignore
    }

    console.log(`  OK: ${sku} (${imageUrls.length} images)`);
    created++;
    skuCounter++;

    // Small pause between products
    await new Promise(r => setTimeout(r, 300));
  }

  return { created, nextSku: skuCounter };
}

async function main() {
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", "vianferreteria@gmail.com")
    .maybeSingle();

  if (!existingUser?.id) {
    console.error("Seller not found");
    return;
  }
  const sellerId = existingUser.id;

  const { data: categories } = await supabase.from("categories").select("id").limit(1);
  let categoryId = categories?.[0]?.id;
  if (!categoryId) {
    categoryId = randomUUID();
    await supabase.from("categories").insert({ id: categoryId, name: "General", slug: "general" });
  }

  // Get last SKU
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
  console.log("Starting at SKU:", `${SKU_PREFIX}-${String(skuCounter).padStart(6, "0")}`);

  // Get existing product titles
  const { data: existingProducts } = await supabase
    .from("products")
    .select("title")
    .eq("seller_id", sellerId)
    .ilike("sku", `${SKU_PREFIX}-%`);

  const existingTitles = new Set(existingProducts?.map(p => p.title) || []);
  console.log("Existing products:", existingTitles.size);

  // Get all folders - simple, no nested readdirSync in filter
  const dirEntries = fs.readdirSync(BASE_DIR, { withFileTypes: true });
  const allFolders: { name: string; path: string }[] = [];
  for (const d of dirEntries) {
    if (!d.isDirectory()) continue;
    const folderPath = path.join(BASE_DIR, d.name);
    allFolders.push({ name: d.name.trim(), path: folderPath });
  }

  // Find missing folders (check image presence individually)
  const missingFolders: { name: string; path: string }[] = [];
  for (const f of allFolders) {
    if (existingTitles.has(f.name)) continue;
    try {
      const files = fs.readdirSync(f.path);
      if (files.some(file => /\.(jpg|jpeg|png|webp)$/i.test(file))) {
        missingFolders.push(f);
      }
    } catch {
      // Skip unreadable folders
    }
  }

  console.log(`Missing folders with images: ${missingFolders.length}`);
  if (missingFolders.length === 0) {
    console.log("All folders already imported!");
    return;
  }

  // Process in batches
  let totalCreated = 0;
  for (let i = 0; i < missingFolders.length; i += BATCH_SIZE) {
    const batch = missingFolders.slice(i, i + BATCH_SIZE);
    console.log(`\n=== BATCH ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(missingFolders.length / BATCH_SIZE)} (${batch.length} folders) ===`);
    
    const result = await processBatch(batch, sellerId, categoryId, skuCounter);
    totalCreated += result.created;
    skuCounter = result.nextSku;

    // Pause between batches to let memory settle
    if (i + BATCH_SIZE < missingFolders.length) {
      console.log("Pausing 5 seconds before next batch...");
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log(`\nDone! Created ${totalCreated}/${missingFolders.length} missing products.`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
