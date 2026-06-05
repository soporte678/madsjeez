#!/usr/bin/env node
/**
 * mellimelos-rebuild.mjs
 *
 * Recrea los 4 productos Mellimelos con precios e imágenes correctas.
 *
 * Uso:
 *   1. Asegurate de tener SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local
 *      (o exportadas en el shell)
 *   2. Asegurate de que la carpeta MELLIMELOS exista en C:\Users\Mi Pc\Downloads\MELLIMELOS
 *   3. node scripts/mellimelos-rebuild.mjs
 */

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// ── Config ──
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://doweovsukuskflgnxhhn.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) {
  console.error("Falta SUPABASE_SERVICE_ROLE_KEY en el entorno");
  process.exit(1);
}

const FOLDER =
  process.env.MELLIMELOS_FOLDER ||
  "C:\\Users\\Mi Pc\\Downloads\\MELLIMELOS";
const BUCKET = "product-images";
const SELLER_EMAIL = "infomaqjeez@gmail.com";
const CATEGORY_ID = "cmokepidj002n0ds648m3qee3"; // Ropa para Bebés

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Mapeo de los 4 productos reales ──
// Las 40 imágenes en MELLIMELOS están organizadas por prefijo de timestamp.
// Cada grupo de 10 imágenes es el MISMO producto en distintos colores.
const PRODUCTS = [
  {
    slug: "body-polera-manga-larga-mellimelos",
    title: "Body Polera Manga Larga · Mellimelos",
    price: 24999,
    comparePrice: 39999,
    stock: 40,
    timePrefix: "11_03",
    description:
      "Body polera de manga larga para bebés. Algodón premium hipoalergénico, broches al hombro para fácil postura y broches inferiores para cambios rápidos. Suavidad y comodidad para cada día. Colores disponibles: Celeste, Rosa, Gris melange, Lavanda.",
  },
  {
    slug: "conjunto-body-media-polera-babucha-mellimelos",
    title: "Conjunto Body Media Polera + Babucha · Mellimelos",
    price: 24999,
    comparePrice: 39999,
    stock: 40,
    timePrefix: "11_08",
    description:
      "Conjunto de body media polera + babucha para bebés. Super suave al tacto, cómodo y flexible, broches prácticos. Ideal para acompañar cada momento de tu bebé.",
  },
  {
    slug: "body-puntilla-x-unidad-mellimelos",
    title: "Body Puntilla x Unidad · Mellimelos",
    price: 16999,
    comparePrice: 24999,
    stock: 40,
    timePrefix: "11_12",
    description:
      "Body de bebé con puntilla, algodón interlock de excelente calidad. Suave y cómodo, puntilla delicada, ideal para bebé. Talle 0 meses a 12 meses. Disponible en varios colores.",
  },
  {
    slug: "body-cuello-americano-medio-osito-mellimelos",
    title: "Body Cuello Americano + Medio Osito · Mellimelos",
    price: 16999,
    comparePrice: 24999,
    stock: 40,
    timePrefix: "11_14",
    description:
      "Body de cuello americano + medio osito (2 piezas). Algodón suave 100% de excelente calidad. Cómodo, ajuste perfecto para libertad de movimiento. Ideal para bebé, delicado con la piel.",
  },
];

function cuid() {
  // CUID-like, suficiente para uso interno.
  const ts = Date.now().toString(36);
  const rand = crypto.randomBytes(12).toString("hex").substring(0, 16);
  return "c" + ts + rand;
}

async function getSellerId() {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("email", SELLER_EMAIL)
    .single();
  if (error || !data) throw new Error("Seller no encontrado: " + SELLER_EMAIL);
  return data.id;
}

function pickImagesFor(prefix) {
  const files = fs.readdirSync(FOLDER).filter((f) => f.includes(prefix) && /\.png$/i.test(f));
  // Orden por sufijo (1)..(10)
  files.sort((a, b) => {
    const ai = parseInt(a.match(/\((\d+)\)/)?.[1] ?? "0", 10);
    const bi = parseInt(b.match(/\((\d+)\)/)?.[1] ?? "0", 10);
    return ai - bi;
  });
  return files;
}

async function uploadImage(localPath, storageKey) {
  const buf = fs.readFileSync(localPath);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storageKey, buf, {
      contentType: "image/png",
      upsert: true,
    });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(storageKey).data.publicUrl;
}

async function createProduct(sellerId, p) {
  const id = cuid();
  const now = new Date().toISOString();
  const { error } = await supabase.from("products").insert({
    id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    price: p.price,
    compare_price: p.comparePrice,
    original_price: p.comparePrice,
    stock: p.stock,
    condition: "new",
    is_active: true,
    is_featured: false,
    is_boosted: false,
    free_shipping: false,
    shipping_cost: 0,
    quality_score: 0,
    has_video: false,
    views: 0,
    sales: 0,
    seller_id: sellerId,
    category_id: CATEGORY_ID,
    created_at: now,
    updated_at: now,
  });
  if (error) throw error;
  return id;
}

async function insertImageRow(productId, url, order) {
  const id = cuid();
  const { error } = await supabase.from("product_images").insert({
    id,
    url,
    alt: null,
    order,
    product_id: productId,
  });
  if (error) throw error;
}

async function main() {
  console.log("→ Buscando seller…");
  const sellerId = await getSellerId();
  console.log("  seller =", sellerId);

  for (const p of PRODUCTS) {
    console.log(`\n→ Producto: ${p.title}  (${p.price})`);
    const files = pickImagesFor(p.timePrefix);
    if (files.length === 0) {
      console.warn(`  ⚠ no se encontraron imágenes con prefijo ${p.timePrefix}, salteo`);
      continue;
    }
    console.log(`  imágenes: ${files.length}`);

    const productId = await createProduct(sellerId, p);
    console.log("  producto creado:", productId);

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const local = path.join(FOLDER, f);
      const key = `mellimelos/${productId}/${i}.png`;
      const url = await uploadImage(local, key);
      await insertImageRow(productId, url, i);
      process.stdout.write(".");
    }
    console.log("  ✓ imágenes subidas");
  }
  console.log("\n✓ Listo");
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
