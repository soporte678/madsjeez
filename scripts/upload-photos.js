/**
 * Script: upload-photos.js
 * 
 * Reads matched folders (already renamed with SKU prefix), converts images to
 * base64 data URIs, and inserts them into product_images table via Supabase.
 * 
 * Usage: node scripts/upload-photos.js [--dry-run] [--limit N]
 */

const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

// ── Config ──
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PHOTO_BANK = process.env.PHOTO_BANK_PATH || path.join(process.cwd(), "photo-bank");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon) in .env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : Infinity;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]);
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB max per image for base64

// Generate CUID-like ID
function generateId() {
  const ts = Date.now().toString(36);
  const rand = crypto.randomBytes(12).toString("hex").substring(0, 16);
  return "c" + ts + rand;
}

function getMimeType(ext) {
  const map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
  };
  return map[ext] || "image/jpeg";
}

function getImagesInFolder(folderPath) {
  try {
    const entries = fs.readdirSync(folderPath);
    return entries
      .filter(f => {
        const ext = path.extname(f).toLowerCase();
        if (!IMAGE_EXTS.has(ext)) return false;
        const fullPath = path.join(folderPath, f);
        try {
          const stat = fs.statSync(fullPath);
          return stat.isFile() && stat.size <= MAX_FILE_SIZE;
        } catch { return false; }
      })
      .map(f => path.join(folderPath, f))
      .slice(0, 10);
  } catch {
    return [];
  }
}

function imageToDataUri(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = getMimeType(ext);
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString("base64");
  return `data:${mime};base64,${base64}`;
}

async function main() {
  console.log("Fetching products from Supabase...");
  
  // Fetch all products with their existing image count
  let allProducts = [];
  let page = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select("id, sku, title, product_images(id)")
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    
    if (error) { console.error("DB Error:", error.message); return; }
    if (!data || data.length === 0) break;
    allProducts = allProducts.concat(data);
    if (data.length < PAGE_SIZE) break;
    page++;
  }
  
  // Build SKU → product map
  const skuMap = {};
  for (const p of allProducts) {
    if (p.sku) skuMap[p.sku] = p;
  }
  console.log(`  ${allProducts.length} products, ${Object.keys(skuMap).length} with SKU`);
  
  // Find renamed folders (starting with MAQJEEZ-)
  const entries = fs.readdirSync(PHOTO_BANK);
  const skuFolders = entries.filter(e => {
    try { return e.startsWith("MAQJEEZ-") && fs.statSync(path.join(PHOTO_BANK, e)).isDirectory(); }
    catch { return false; }
  });
  
  console.log(`  ${skuFolders.length} SKU-prefixed folders found`);
  console.log(`  ${DRY_RUN ? "DRY RUN MODE" : "LIVE MODE"}`);
  if (LIMIT < Infinity) console.log(`  Limit: ${LIMIT} folders`);
  console.log();

  // Group folders by SKU (multiple folders can map to same product)
  const skuGroups = {};
  for (const folder of skuFolders) {
    const match = folder.match(/^(MAQJEEZ-\d+)\s*-\s*/);
    if (!match) continue;
    const sku = match[1];
    if (!skuGroups[sku]) skuGroups[sku] = [];
    skuGroups[sku].push(folder);
  }
  
  let processed = 0;
  let totalUploaded = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const [sku, folders] of Object.entries(skuGroups)) {
    if (processed >= LIMIT) break;
    
    const product = skuMap[sku];
    if (!product) {
      console.log(`SKIP: ${sku} - no product found`);
      totalSkipped++;
      continue;
    }
    
    const existingCount = product.product_images?.length || 0;
    const slotsAvailable = Math.max(0, 10 - existingCount);
    
    if (slotsAvailable === 0) {
      console.log(`SKIP: ${sku} "${product.title}" - already has ${existingCount} images`);
      totalSkipped++;
      continue;
    }
    
    // Collect all images from all matching folders for this SKU
    let allImages = [];
    for (const folder of folders) {
      const folderPath = path.join(PHOTO_BANK, folder);
      const images = getImagesInFolder(folderPath);
      allImages = allImages.concat(images);
    }
    
    // Deduplicate by filename
    const seen = new Set();
    allImages = allImages.filter(img => {
      const name = path.basename(img);
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
    
    const imagesToUpload = allImages.slice(0, slotsAvailable);
    
    if (imagesToUpload.length === 0) {
      totalSkipped++;
      continue;
    }
    
    console.log(`[${sku}] "${product.title}" - ${imagesToUpload.length} images to upload (${existingCount} existing)`);
    
    if (!DRY_RUN) {
      for (let i = 0; i < imagesToUpload.length; i++) {
        const imgPath = imagesToUpload[i];
        try {
          const dataUri = imageToDataUri(imgPath);
          const id = generateId();
          
          const { error: insertError } = await supabase
            .from("product_images")
            .insert({
              id,
              product_id: product.id,
              url: dataUri,
              alt: product.title,
              order: existingCount + i,
            });
          
          if (insertError) {
            console.log(`  ERROR: ${path.basename(imgPath)} - ${insertError.message}`);
            totalErrors++;
          } else {
            console.log(`  OK: ${path.basename(imgPath)} (order: ${existingCount + i})`);
            totalUploaded++;
          }
        } catch (e) {
          console.log(`  ERROR: ${path.basename(imgPath)} - ${e.message}`);
          totalErrors++;
        }
      }
    } else {
      for (const img of imagesToUpload) {
        const stat = fs.statSync(img);
        console.log(`  [DRY] ${path.basename(img)} (${(stat.size / 1024).toFixed(0)}KB)`);
      }
      totalUploaded += imagesToUpload.length;
    }
    
    processed++;
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Processed: ${processed} products`);
  console.log(`Uploaded: ${totalUploaded} images`);
  console.log(`Skipped: ${totalSkipped} products`);
  console.log(`Errors: ${totalErrors}`);
}

main().catch(console.error);
